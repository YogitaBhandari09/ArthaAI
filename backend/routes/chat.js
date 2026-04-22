import { Router } from "express";
import { buildSystemPrompt } from "../prompts/system.js";
import { FD_BANKS } from "../prompts/system.js";
import { generateFinancialAdvice, GeminiError } from "../services/gemini.js";
import { getRecommendation } from "../services/mlClient.js";
import { fallbackRecommendation } from "./recommend.js";

const router = Router();

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeAdvice = (payload = {}) => ({
  reply: String(payload.reply || "माफ़ करें, मैं अभी पूरी सलाह नहीं दे पाया।"),
  product: String(payload.product || "None"),
  bank: String(payload.bank || ""),
  rate: safeNumber(payload.rate),
  amount: safeNumber(payload.amount),
  months: safeNumber(payload.months),
  returns: safeNumber(payload.returns),
  tip: String(payload.tip || ""),
});

const isWeakAdvice = (advice) => {
  const reply = String(advice?.reply || "").trim();
  if (!reply) return true;
  if (reply.startsWith('"reply"') || reply.startsWith("reply")) return true;
  if (reply.length < 12) return true;
  return false;
};

const extractAmountFromText = (message = "") => {
  const normalized = String(message).replace(/[,₹\s]/g, "");
  const match = normalized.match(/(\d{3,9})/);
  if (!match) return 0;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : 0;
};

const calculateReturns = (amount, annualRate, months) => {
  if (amount <= 0 || annualRate <= 0 || months <= 0) return 0;
  return Math.round(amount * Math.pow(1 + annualRate / 100 / 12, months));
};

const mapRecommendationToProduct = (recommendation = "") => {
  if (recommendation === "SavingsAccount") return "SavingsAccount";
  if (recommendation === "RD" || recommendation === "RD_plus_MF") return "RD";
  return "FD";
};

const pickBestBank = (product) => {
  if (product !== "FD") {
    return { bank: "India Post Payments Bank", rate: 4.0 };
  }
  return FD_BANKS[0];
};

const buildFallbackAdvice = ({ message, profile, mlResult, reason }) => {
  const amount = extractAmountFromText(message) || Math.max(5000, Number(profile.income) || 10000);
  const product = mapRecommendationToProduct(mlResult?.recommendation);
  const bankRate = pickBestBank(product);
  const months = Number(mlResult?.tenure_months) || (product === "FD" ? 12 : 6);
  const returns = calculateReturns(amount, bankRate.rate, months);

  const reply =
    product === "SavingsAccount"
      ? `अभी आपके लिए पहले आपातकाल के लिए सेविंग्स अकाउंट में पैसा रखना बेहतर है। ₹${amount.toLocaleString(
          "en-IN"
        )} अलग रखें और फिर FD शुरू करें।`
      : `आपके प्रोफाइल के हिसाब से ${product} बेहतर है। ₹${amount.toLocaleString(
          "en-IN"
        )} को लगभग ${months} महीने के लिए रखें, इससे अनुमानित रिटर्न ₹${returns.toLocaleString("en-IN")} हो सकता है।`;

  return {
    reply,
    product,
    bank: bankRate.bank,
    rate: bankRate.rate,
    amount,
    months,
    returns,
    tip:
      reason === "quota"
        ? "AI सेवा व्यस्त है, इसलिए फिलहाल नियम-आधारित सुरक्षित सलाह दी गई है।"
        : "हर महीने थोड़ी राशि नियमित निवेश में जोड़ते रहें, इससे परिणाम बेहतर होते हैं।",
    fallback: true,
  };
};

router.post("/", async (request, response, next) => {
  const message = request.body?.message;
  const profile = request.body?.profile || {};

  if (!message || typeof message !== "string") {
    return response.status(400).json({
      message: "message string जरूरी है।",
    });
  }

  let mlResult;
  let mlConfidence = 0.5;

  try {
    mlResult = await getRecommendation(profile, 3000);
    mlConfidence = mlResult.confidence;
  } catch {
    mlResult = fallbackRecommendation(profile);
    mlConfidence = mlResult.confidence;
  }

  try {
    const systemPrompt = buildSystemPrompt(profile, mlResult.recommendation, mlResult.confidence);
    const advice = await generateFinancialAdvice({
      message,
      systemInstruction: systemPrompt,
      timeoutMs: 10000,
      retries: 2,
    });
    let normalized = normalizeAdvice(advice);
    if (isWeakAdvice(normalized)) {
      normalized = normalizeAdvice(
        buildFallbackAdvice({
          message,
          profile,
          mlResult,
          reason: "weak_output",
        })
      );
      return response.json({
        ...normalized,
        mlConfidence,
        fallback: true,
      });
    }
    return response.json({
      ...normalized,
      mlConfidence,
      fallback: false,
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      const fallbackAdvice = buildFallbackAdvice({
        message,
        profile,
        mlResult,
        reason: error.status === 429 ? "quota" : "error",
      });
      return response.json({
        ...normalizeAdvice(fallbackAdvice),
        mlConfidence,
        fallback: true,
      });
    }
    return next(error);
  }
});

export default router;

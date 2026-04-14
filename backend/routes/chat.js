import { Router } from "express";
import { buildSystemPrompt } from "../prompts/system.js";
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
    const normalized = normalizeAdvice(advice);
    return response.json({
      ...normalized,
      mlConfidence,
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      if (error.status === 429) {
        return response.status(429).json({
          message: "Gemini quota limit reached",
        });
      }
      return response.status(error.status || 500).json({
        message: "AI सेवा से उत्तर लेने में दिक्कत हुई।",
      });
    }
    return next(error);
  }
});

export default router;

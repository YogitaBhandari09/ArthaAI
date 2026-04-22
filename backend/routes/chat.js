import { Router } from "express";
import { buildSystemPrompt, FD_BANKS, normalizeLanguage } from "../prompts/system.js";
import { generateFinancialAdvice, GeminiError } from "../services/gemini.js";
import { getRecommendation } from "../services/mlClient.js";
import { fallbackRecommendation } from "./recommend.js";

const router = Router();

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const I18N = {
  "hi-IN": {
    genericError: "माफ़ करें, मैं अभी पूरी सलाह नहीं दे पाया।",
    savingsReply: (amount, goal) =>
      `आपका लक्ष्य ${goal} है, इसलिए पहले सुरक्षित और तुरंत उपलब्ध फंड बनाना जरूरी है। अभी Rs ${amount.toLocaleString(
        "en-IN"
      )} सेविंग्स अकाउंट में रखें। जब 3-6 महीने का आपातकालीन फंड बन जाए, तब FD शुरू करें। खर्च के लिए इस राशि को लॉक मत करें।`,
    investReply: (product, amount, months, returns, bank, rate) =>
      `आपके प्रोफाइल के लिए ${product} सही दिख रहा है क्योंकि यह जोखिम और स्थिरता में संतुलित है। अगर आप Rs ${amount.toLocaleString(
        "en-IN"
      )} को ${months} महीने ${bank} (${rate}%) में रखें, तो अनुमानित राशि Rs ${returns.toLocaleString(
        "en-IN"
      )} हो सकती है। हर महीने छोटी नियमित बचत जोड़ें ताकि रिटर्न बेहतर हो। मैच्योरिटी से पहले पैसे निकालने से लाभ घट सकता है।`,
    quotaTip: "AI सेवा व्यस्त है, इसलिए फिलहाल नियम-आधारित सुरक्षित सलाह दी गई है।",
    defaultTip: "हर महीने थोड़ी राशि नियमित निवेश में जोड़ते रहें, इससे परिणाम बेहतर होते हैं।",
  },
  "bn-IN": {
    genericError: "দুঃখিত, এখন সম্পূর্ণ পরামর্শ দিতে পারলাম না।",
    savingsReply: (amount, goal) =>
      `আপনার লক্ষ্য ${goal}, তাই আগে নিরাপদ ও সহজে তোলা যায় এমন ফান্ড রাখা জরুরি। এখন Rs ${amount.toLocaleString(
        "en-IN"
      )} সেভিংস অ্যাকাউন্টে রাখুন। ৩-৬ মাসের জরুরি তহবিল তৈরি হলে তারপর FD শুরু করুন। প্রয়োজনের টাকা লক করে রাখবেন না।`,
    investReply: (product, amount, months, returns, bank, rate) =>
      `আপনার প্রোফাইল অনুযায়ী ${product} উপযুক্ত, কারণ এতে স্থিরতা ও ঝুঁকির ভারসাম্য থাকে। Rs ${amount.toLocaleString(
        "en-IN"
      )} যদি ${months} মাস ${bank} (${rate}%) এ রাখেন, আনুমানিক Rs ${returns.toLocaleString("en-IN")} পেতে পারেন। প্রতি মাসে নিয়মিত সঞ্চয় যোগ করলে ফল আরও ভালো হবে। মেয়াদপূর্তির আগে তুললে লাভ কমে যেতে পারে।`,
    quotaTip: "AI পরিষেবা ব্যস্ত, তাই আপাতত নিয়মভিত্তিক নিরাপদ পরামর্শ দেওয়া হয়েছে।",
    defaultTip: "প্রতি মাসে নিয়মিত বিনিয়োগ করলে ফল আরও ভালো হয়।",
  },
  "ta-IN": {
    genericError: "மன்னிக்கவும், இப்போது முழு ஆலோசனையை வழங்க முடியவில்லை.",
    savingsReply: (amount, goal) =>
      `உங்கள் இலக்கு ${goal}, ஆகவே முதலில் பாதுகாப்பான மற்றும் உடனே பயன்படுத்தக்கூடிய நிதி தேவை. இப்போது Rs ${amount.toLocaleString(
        "en-IN"
      )} சேமிப்பு கணக்கில் வைத்திருக்கவும். 3-6 மாத அவசர நிதி உருவான பிறகு FD தொடங்குங்கள். அவசர செலவுக்கான பணத்தை lock செய்ய வேண்டாம்.`,
    investReply: (product, amount, months, returns, bank, rate) =>
      `உங்கள் ப்ரொஃபைலுக்கு ${product} பொருத்தமாக உள்ளது, ஏனெனில் இது பாதுகாப்பும் வருமானமும் சமநிலைப்படுத்துகிறது. Rs ${amount.toLocaleString(
        "en-IN"
      )} ஐ ${months} மாதங்கள் ${bank} (${rate}%) இல் வைத்தால் கணிக்கப்பட்ட தொகை Rs ${returns.toLocaleString("en-IN")} ஆக இருக்கலாம். மாதந்தோறும் சிறிய சேமிப்பை சேர்த்தால் முடிவு மேம்படும். காலாவதிக்கு முன் எடுத்தால் லாபம் குறையலாம்.`,
    quotaTip: "AI சேவை பிஸியாக உள்ளது, அதனால் தற்போது விதி-அடிப்படையிலான பாதுகாப்பான ஆலோசனை வழங்கப்பட்டது.",
    defaultTip: "ஒவ்வொரு மாதமும் ஒழுங்காக முதலீடு செய்தால் முடிவுகள் மேம்படும்.",
  },
};

const getCopy = (language) => I18N[normalizeLanguage(language)] || I18N["hi-IN"];

const normalizeAdvice = (payload = {}, language = "hi-IN") => {
  const copy = getCopy(language);
  return {
    reply: String(payload.reply || copy.genericError),
    product: String(payload.product || "None"),
    bank: String(payload.bank || ""),
    rate: safeNumber(payload.rate),
    amount: safeNumber(payload.amount),
    months: safeNumber(payload.months),
    returns: safeNumber(payload.returns),
    tip: String(payload.tip || ""),
  };
};

const LANGUAGE_SCRIPT_REGEX = {
  "hi-IN": /[\u0900-\u097F]/,
  "bn-IN": /[\u0980-\u09FF]/,
  "ta-IN": /[\u0B80-\u0BFF]/,
};

const matchesRequestedLanguage = (text, language) => {
  const rule = LANGUAGE_SCRIPT_REGEX[normalizeLanguage(language)];
  if (!rule) return true;
  return rule.test(String(text || ""));
};

const isWeakAdvice = (advice) => {
  const reply = String(advice?.reply || "").trim();
  if (!reply) return true;
  if (reply.startsWith('"reply"') || reply.startsWith("reply")) return true;
  if (reply.length < 24) return true;
  const sentenceCount = reply
    .split(/[.!?।]+/g)
    .map((part) => part.trim())
    .filter(Boolean).length;
  if (sentenceCount < 2) return true;
  return false;
};

const extractAmountFromText = (message = "") => {
  const normalized = String(message).replace(/[,Rs\s]/gi, "");
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
  const language = normalizeLanguage(profile?.language || profile?.lang || "hi-IN");
  const copy = getCopy(language);
  const amount = extractAmountFromText(message) || Math.max(5000, Number(profile.income) || 10000);
  const product = mapRecommendationToProduct(mlResult?.recommendation);
  const bankRate = pickBestBank(product);
  const months = Number(mlResult?.tenure_months) || (product === "FD" ? 12 : 6);
  const returns = calculateReturns(amount, bankRate.rate, months);

  const reply =
    product === "SavingsAccount"
      ? copy.savingsReply(amount, profile.goal || "emergency")
      : copy.investReply(product, amount, months, returns, bankRate.bank, bankRate.rate);

  return {
    reply,
    product,
    bank: bankRate.bank,
    rate: bankRate.rate,
    amount,
    months,
    returns,
    tip: reason === "quota" ? copy.quotaTip : copy.defaultTip,
    fallback: true,
  };
};

router.post("/", async (request, response, next) => {
  const message = request.body?.message;
  const profile = request.body?.profile || {};

  if (!message || typeof message !== "string") {
    return response.status(400).json({
      message: "message string is required.",
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

    const language = normalizeLanguage(profile?.language || profile?.lang || "hi-IN");
    let normalized = normalizeAdvice(advice, language);

    if (isWeakAdvice(normalized) || !matchesRequestedLanguage(normalized.reply, language)) {
      normalized = normalizeAdvice(
        buildFallbackAdvice({
          message,
          profile,
          mlResult,
          reason: "weak_output",
        }),
        language
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
      const language = normalizeLanguage(profile?.language || profile?.lang || "hi-IN");
      const fallbackAdvice = buildFallbackAdvice({
        message,
        profile,
        mlResult,
        reason: error.status === 429 ? "quota" : "error",
      });
      return response.json({
        ...normalizeAdvice(fallbackAdvice, language),
        mlConfidence,
        fallback: true,
      });
    }
    return next(error);
  }
});

export default router;

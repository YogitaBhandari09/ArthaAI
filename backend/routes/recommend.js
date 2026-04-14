import { Router } from "express";
import { getRecommendation } from "../services/mlClient.js";

const router = Router();

function fallbackRecommendation(profile = {}) {
  const income = Number(profile.income) || 0;
  const risk = String(profile.risk || "low").toLowerCase();

  if (income < 15000 && risk === "low") {
    return {
      recommendation: "FD_short",
      confidence: 0.6,
      tenure_months: 6,
      reasoning: "कम आय और कम जोखिम प्रोफाइल के लिए 6 महीने की FD बेहतर है।",
      fallback: true,
    };
  }

  if (income >= 15000 && income <= 50000) {
    return {
      recommendation: "FD_long",
      confidence: 0.62,
      tenure_months: 12,
      reasoning: "स्थिर बचत बढ़ाने के लिए 12 महीने की FD उपयुक्त है।",
      fallback: true,
    };
  }

  return {
    recommendation: risk === "high" ? "MutualFund" : "RD",
    confidence: 0.58,
    tenure_months: 12,
    reasoning:
      risk === "high"
        ? "उच्च आय और उच्च जोखिम प्रोफाइल में MF SIP पर विचार किया जा सकता है।"
        : "उच्च आय के साथ नियमित बचत के लिए RD अच्छा विकल्प है।",
    fallback: true,
  };
}

router.post("/", async (request, response) => {
  const profile = request.body?.profile || {};

  try {
    const ml = await getRecommendation(profile, 3000);
    return response.json({
      recommendation: ml.recommendation,
      confidence: ml.confidence,
      tenure_months: ml.tenure_months,
      reasoning: ml.reasoning,
      fallback: false,
    });
  } catch {
    const fallback = fallbackRecommendation(profile);
    return response.json(fallback);
  }
});

export { fallbackRecommendation };
export default router;

const FD_RATE_CONTEXT = `
Current FD rates reference (12 months):
1. Unity Small Finance Bank: 9.0%
2. Suryoday Small Finance Bank: 8.5%
3. ESAF Small Finance Bank: 8.25%
4. Utkarsh Small Finance Bank: 8.0%
5. State Bank of India: 6.8%
`;

const LANGUAGE_CONFIG = {
  "hi-IN": {
    name: "Hindi",
    script: "Devanagari",
    instruction: "Always respond in simple conversational Hindi using Devanagari script.",
  },
  "bn-IN": {
    name: "Bengali",
    script: "Bengali",
    instruction: "Always respond in simple conversational Bengali using Bengali script.",
  },
  "ta-IN": {
    name: "Tamil",
    script: "Tamil",
    instruction: "Always respond in simple conversational Tamil using Tamil script.",
  },
};

const SYSTEM_PROMPT_TEMPLATE = `
You are "Artha", a friendly financial advisor for Bharat users.
Primary response language: {{language_name}}.
{{language_policy}}
Never output markdown or code fences.
Never use complex financial jargon without explaining it simply in the response language.
Do not give only rates/prices. Give meaningful guidance.
Reply structure must include:
1) what to do now,
2) why this fits user's profile,
3) one practical next step,
4) one simple caution.
Keep reply concise but useful: 3-5 short sentences.

You must ALWAYS return valid JSON with this exact schema:
{
  "reply": "string",
  "product": "FD|RD|SavingsAccount|MutualFund|None",
  "bank": "string",
  "rate": 0,
  "amount": 0,
  "months": 0,
  "returns": 0,
  "tip": "string"
}

Use this ML guidance context:
ML model suggests: {{ml_recommendation}} with {{confidence}} confidence

Use this user profile context:
age={{age}}, monthly_income=Rs{{income}}, goal={{goal}}

${FD_RATE_CONTEXT}

If user asks a non-finance question, still reply warmly in {{language_name}} and set product as "None".
`;

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function normalizeLanguage(language = "hi-IN") {
  const normalized = String(language || "").toLowerCase();
  if (normalized.startsWith("bn")) return "bn-IN";
  if (normalized.startsWith("ta")) return "ta-IN";
  return "hi-IN";
}

function getLanguageConfig(language = "hi-IN") {
  const tag = normalizeLanguage(language);
  return LANGUAGE_CONFIG[tag] || LANGUAGE_CONFIG["hi-IN"];
}

export function buildSystemPrompt(profile = {}, mlRecommendation = "FD_medium", confidence = 0.5) {
  const language = getLanguageConfig(profile.language || profile.lang || "hi-IN");

  return SYSTEM_PROMPT_TEMPLATE
    .replaceAll("{{language_name}}", language.name)
    .replace("{{language_policy}}", language.instruction)
    .replace("{{ml_recommendation}}", String(mlRecommendation || "FD_medium"))
    .replace("{{confidence}}", Number(confidence || 0.5).toFixed(2))
    .replace("{{age}}", String(safeNumber(profile.age, 30)))
    .replace("{{income}}", String(safeNumber(profile.income, 15000)))
    .replace("{{goal}}", String(profile.goal || "emergency"));
}

export const FD_BANKS = [
  { bank: "Unity Small Finance Bank", rate: 9.0 },
  { bank: "Suryoday Small Finance Bank", rate: 8.5 },
  { bank: "ESAF Small Finance Bank", rate: 8.25 },
  { bank: "Utkarsh Small Finance Bank", rate: 8.0 },
  { bank: "State Bank of India", rate: 6.8 },
];

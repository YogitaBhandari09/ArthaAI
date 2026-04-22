import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-2.0-flash";

class GeminiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
    this.details = details;
  }
}

const parseJson = (raw) => {
  const text = String(raw || "").trim();
  if (!text) throw new GeminiError("Empty response from Gemini", 502);

  const cleaned = text.replace(/```json|```/gi, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      const fallbackReply = cleaned
        .replace(/[{}]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 220);
      return {
        reply: fallbackReply || "माफ़ कीजिए, मैं अभी साफ़ उत्तर नहीं दे पाया।",
        product: "None",
        bank: "",
        rate: 0,
        amount: 0,
        months: 0,
        returns: 0,
        tip: "",
      };
    }
    const subset = cleaned.slice(start, end + 1);
    try {
      return JSON.parse(subset);
    } catch {
      const replyMatch = cleaned.match(/"reply"\s*:\s*"([^"]*)/i);
      const fallbackReply = (replyMatch?.[1] || cleaned)
        .replace(/[{}]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 220);
      return {
        reply: fallbackReply || "माफ़ कीजिए, मैं अभी साफ़ उत्तर नहीं दे पाया।",
        product: "None",
        bank: "",
        rate: 0,
        amount: 0,
        months: 0,
        returns: 0,
        tip: "",
      };
    }
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateFinancialAdvice({
  message,
  systemInstruction,
  timeoutMs = 10000,
  retries = 2,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new GeminiError("Missing GEMINI_API_KEY in backend environment", 500);
  }
  if (!message?.trim()) {
    throw new GeminiError("Message is required for Gemini call", 400);
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction,
  });

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let timeoutHandle;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new GeminiError("Gemini timeout", 408)), timeoutMs);
      });

      const requestPromise = model.generateContent({
        contents: [{ role: "user", parts: [{ text: message.trim() }] }],
        generationConfig: {
          temperature: 0.55,
          maxOutputTokens: 600,
          responseMimeType: "application/json",
        },
      });

      const result = await Promise.race([requestPromise, timeoutPromise]);
      const text = result.response?.text?.() || "";
      return parseJson(text);
    } catch (error) {
      const status = Number(error?.status || error?.response?.status || 500);
      const isRetriable = status === 503 && attempt < retries;

      if (isRetriable) {
        await sleep(300 * (attempt + 1));
        continue;
      }

      if (status === 429) {
        throw new GeminiError("Gemini quota exceeded", 429, error?.message);
      }
      if (error instanceof GeminiError) throw error;
      throw new GeminiError(error?.message || "Gemini request failed", status, error?.details || null);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }

  throw new GeminiError("Gemini service unavailable after retries", 503);
}

export { GeminiError };

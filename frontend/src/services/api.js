const BASE = import.meta.env.VITE_API_URL || "";

/**
 * @typedef {Object} ApiResult
 * @property {boolean} ok
 * @property {number} status
 * @property {any} [data]
 * @property {string} [error]
 */

const FRIENDLY_ERRORS = {
  default: "कुछ तकनीकी दिक्कत हुई है, कृपया दोबारा कोशिश करें।",
  network: "सर्वर से कनेक्शन नहीं हो पाया। इंटरनेट या सर्वर स्थिति जांचें।",
  timeout: "रिक्वेस्ट में समय लग रहा है। कृपया फिर से कोशिश करें।",
};

async function request(path, body, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() };

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: payload?.message || payload?.error || FRIENDLY_ERRORS.default,
        data: payload,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: payload,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      return { ok: false, status: 408, error: FRIENDLY_ERRORS.timeout };
    }
    return { ok: false, status: 0, error: FRIENDLY_ERRORS.network };
  } finally {
    clearTimeout(timer);
  }
}

export async function sendChat(message, profile) {
  return request("/api/chat", { message, profile }, 12000);
}

export async function calculateFD(amount, rate, months) {
  return request("/api/calculate", { amount, rate, months }, 8000);
}

export async function getRecommendation(profile) {
  return request("/api/recommend", { profile }, 5000);
}


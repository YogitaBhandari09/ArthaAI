const BASE = import.meta.env.VITE_API_URL || "";

/**
 * @typedef {Object} ApiResult
 * @property {boolean} ok
 * @property {number} status
 * @property {any} [data]
 * @property {string} [error]
 */

const FRIENDLY_ERRORS = {
  default: "Something went wrong. Please try again.",
  network: "Unable to connect to server. Check internet or backend status.",
  timeout: "Request is taking too long. Please retry.",
};

async function request(path, { method = "POST", body, timeoutMs = 10000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = {};
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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
  return request("/api/chat", {
    method: "POST",
    body: { message, profile },
    timeoutMs: 12000,
  });
}

export async function calculateFD(amount, rate, months) {
  return request("/api/calculate", {
    method: "POST",
    body: { amount, rate, months },
    timeoutMs: 8000,
  });
}

export async function getRecommendation(profile) {
  return request("/api/recommend", {
    method: "POST",
    body: { profile },
    timeoutMs: 5000,
  });
}

export async function getSystemStatus() {
  return request("/api/status", {
    method: "GET",
    timeoutMs: 6000,
  });
}

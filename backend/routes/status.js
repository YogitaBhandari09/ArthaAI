import { Router } from "express";

const router = Router();
const DEFAULT_TIMEOUT_MS = 2500;

function withTimeout(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timer };
}

async function checkMlHealth(baseUrl) {
  if (!baseUrl) {
    return {
      status: "unknown",
      latencyMs: null,
      message: "ML_SERVICE_URL not configured",
    };
  }

  const cleanBase = String(baseUrl).replace(/\/+$/, "");
  const start = Date.now();
  const { controller, timer } = withTimeout(DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${cleanBase}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    const latencyMs = Date.now() - start;

    if (!response.ok) {
      return {
        status: "down",
        latencyMs,
        message: `ML health failed with status ${response.status}`,
      };
    }

    const payload = await response.json().catch(() => ({}));
    return {
      status: "up",
      latencyMs,
      model: payload?.model || "unknown",
      message: "ML service reachable",
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    const timedOut = error?.name === "AbortError";
    return {
      status: "down",
      latencyMs,
      message: timedOut ? "ML health check timed out" : "ML health check failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

router.get("/", async (_request, response) => {
  const ml = await checkMlHealth(process.env.ML_SERVICE_URL || "");
  const aiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const degraded = ml.status !== "up" || !aiConfigured;

  response.json({
    status: degraded ? "degraded" : "ok",
    timestamp: new Date().toISOString(),
    backend: {
      status: "up",
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.VERCEL ? "vercel" : "local",
    },
    ml,
    ai: {
      configured: aiConfigured,
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    },
  });
});

export default router;

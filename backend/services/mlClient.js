const DEFAULT_TIMEOUT = 3000;

class MLServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "MLServiceError";
    this.status = status;
  }
}

function withTimeout(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timer };
}

export async function getRecommendation(profile = {}, timeoutMs = DEFAULT_TIMEOUT) {
  const baseUrl = process.env.ML_SERVICE_URL || "http://localhost:5001";
  const { controller, timer } = withTimeout(timeoutMs);
  try {
    const response = await fetch(`${baseUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: Number(profile.age) || 30,
        income: Number(profile.income) || 15000,
        savings: Number(profile.savings) || 0,
        goal: profile.goal || "emergency",
        risk: profile.risk || "low",
        dependents: Number(profile.dependents) || 0,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new MLServiceError(`ML service failed with status ${response.status}`, response.status);
    }

    const data = await response.json();
    return {
      recommendation: data.recommendation || "FD_medium",
      confidence: Number(data.confidence) || 0.5,
      tenure_months: Number(data.tenure_months) || 12,
      reasoning: data.reasoning || "",
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new MLServiceError("ML service timeout", 408);
    }
    if (error instanceof MLServiceError) throw error;
    throw new MLServiceError("Unable to connect to ML service", 503);
  } finally {
    clearTimeout(timer);
  }
}

export { MLServiceError };

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

const buckets = new Map();

const getIp = (request) => {
  const xForwardedFor = request.headers["x-forwarded-for"];
  if (xForwardedFor) {
    return String(xForwardedFor).split(",")[0].trim();
  }
  return request.ip || request.socket.remoteAddress || "unknown";
};

export default function rateLimit(request, response, next) {
  const now = Date.now();
  const ip = getIp(request);
  const current = buckets.get(ip);

  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (current.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    response.setHeader("Retry-After", String(retryAfter));
    return response.status(429).json({
      message: "बहुत ज़्यादा रिक्वेस्ट आ रही हैं। कृपया 1 मिनट बाद फिर कोशिश करें।",
    });
  }

  current.count += 1;
  buckets.set(ip, current);
  return next();
}

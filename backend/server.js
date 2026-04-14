import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "./middleware/rateLimit.js";
import chatRoute from "./routes/chat.js";
import calculateRoute from "./routes/calculate.js";
import recommendRoute from "./routes/recommend.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));
app.use("/api", rateLimit);

app.get("/api/health", (_, response) => {
  response.json({
    status: "ok",
    service: "artha-ai-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/chat", chatRoute);
app.use("/api/calculate", calculateRoute);
app.use("/api/recommend", recommendRoute);

app.use((request, response) => {
  response.status(404).json({
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
});

app.use((error, _request, response, _next) => {
  const status = Number(error?.status) || 500;
  response.status(status).json({
    message: status >= 500 ? "Server error" : error.message,
  });
});

app.listen(PORT, () => {
  console.log(`Artha backend running on port ${PORT}`);
});

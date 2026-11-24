import "dotenv/config";
import express from "express";
import cors from "cors";
import categoryRoutes from "./routes/categoryRoutes.js";
import authorRoutes from "./routes/authorRoutes.js";
import workRoutes from "./routes/workRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    name: "GERBONG API",
    description: "Gerakan Bacaan dan Arsip Gotong-Royong — Modul 1 RESTful API",
    status: "ok",
    endpoints: {
      auth: "/api/auth",
      categories: "/api/categories",
      authors: "/api/authors",
      works: "/api/works",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "GERBONG API",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api/works", workRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, next) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Invalid JSON payload",
    });
  }

  let statusCode = err?.status || 500;

  if (err?.code) {
    switch (err.code) {
      case "22P02":
      case "23502":
      case "PGRST204":
        statusCode = 400;
        break;
      case "23503":
        statusCode = req.method === "DELETE" ? 409 : 400;
        break;
      case "23505":
        statusCode = 409;
        break;
      case "42501":
        statusCode = 403;
        break;
      case "PGRST116":
        statusCode = 404;
        break;
      default:
        break;
    }
  }

  const responseBody = {
    error: err?.message || "Internal server error",
  };

  if (err?.code) responseBody.code = err.code;
  if (err?.details) responseBody.details = err.details;
  if (err?.hint) responseBody.hint = err.hint;

  return res.status(statusCode).json(responseBody);
});

const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GERBONG API running on http://localhost:${PORT}`);
  });
}

export default app;

import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import morgan from "morgan";
import { AppDataSource } from "./config/database";
import { specs } from "./config/swagger";
import { logger, logStream } from "./config/logger";
import { requestLogger } from "./middleware/requestLogger";
import { errorLogger } from "./middleware/errorLogger";
import { errorHandler } from "./middleware/errorHandler";
import userRoutes from "./routes/userRoutes";
import proposalRoutes from "./routes/proposalRoutes";

const app = express();
const PORT = process.env.PORT || 3333;

// Create logs directory
import fs from "fs";
import path from "path";
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Morgan HTTP request logger
app.use(morgan("combined", { stream: logStream }));

// Custom request/response logger
app.use(requestLogger);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Web3 Express API Documentation",
  }),
);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/proposals", proposalRoutes);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     description: Check if the server is running properly
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get("/api/health", (req, res) => {
  logger.info("Health check requested", { requestId: req.requestId });
  res.json({ status: "OK", message: "Server is running!" });
});

// Error logging middleware (before error handler)
app.use(errorLogger);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  logger.warn("Route not found", {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
});

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    logger.info("Database connection established");

    app.listen(PORT, () => {
      logger.info(`Server started successfully`, {
        port: PORT,
        environment: process.env.NODE_ENV || "development",
        apiEndpoint: `http://localhost:${PORT}/api`,
        swaggerDocs: `http://localhost:${PORT}/api-docs`,
      });

      console.log(`Server is running on port ${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api`);
      console.log(
        `📚 Swagger documentation available at http://localhost:${PORT}/api-docs`,
      );
      console.log(`📝 Logs are being written to ./logs/ directory`);
    });
  })
  .catch((error) => {
    logger.error("Database initialization failed", {
      error: error.message,
      stack: error.stack,
    });
    console.error("Error during database initialization:", error);
    process.exit(1);
  });

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", {
    reason: reason,
    promise: promise,
  });
});

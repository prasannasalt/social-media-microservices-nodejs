require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const Redis = require("ioredis");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const app = express();

const logger = require("./utils/logger");
const routes = require("./routes/identity-service");
const errorHandler = require("./middleware/errorHandler");
const PORT = process.env.PORT || 3001;

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to MongoDb"))
  .catch((error) => logger.error("Mongo Connection Error", error));

// Redis Setup
const redisClient = new Redis(process.env.REDIS_URL);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Receaved ${req.method} request to ${req.url}`);
  logger.info(`Request Body, ${req.body}`);
  next();
});

// DDOS Protection
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate Limit Exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    });
});

// Ip based rate limiting for sensetive End points
const sensetiveEndPoints = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensetive Endpoint rate limit for IP ${req.ip}`);
    res.status(429).json({ success: false, message: `Too many requests` });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// Apply this sensitive Endpoints Limiter to Our Routes
app.use("/api/auth/register", sensetiveEndPoints);

// Routes
app.use("/api/auth", routes);

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Identity Service Running on port ${PORT}`);
});

// Unhandled promise rejection
process.on("unhabdledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "Reason", reason);
});

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const Redis = require("ioredis");
const cors = require("cors");
const postRoutes = require("./routes/postRoutes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { connectToRabbitMQ } = require("./utils/rabbitmq");

const app = express();
const PORT = process.env.PORT || 3002;

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to MongoDb"))
  .catch((error) => logger.error("Mongo Connection Error", error));

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

const sensitiveEndpoints = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit for IP ${req.ip}`);
    res.status(429).json({
      success: false,
      message: `Too many requests, please try again later.`,
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(
  "/api/posts",
  sensitiveEndpoints,
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes
);

// Error Handler
app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ()
    app.listen(PORT,()=>{
      logger.info(`POST Service running on port ${PORT}`)
    })
  } catch (error) {
    logger.error(`Failed to connect Rabbit Mq`, error)
    process.exit(1) 
  }
}

startServer()

// app.listen(PORT, () => {
//   logger.info(`Post Service Running on port ${PORT}`);
// });

// Unhandled promise rejection
process.on("unhabdledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "Reason", reason);
});

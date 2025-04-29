require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const Redis = require("ioredis");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const searchRoutes = require("./routes/search-routes");
const {
  handlePostCreated,
  handlePostDeleted,
} = require("./eventHandler/search-event-handler");

const app = express();
const PORT = process.env.PORT || 3004;

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

app.use("/api/search", searchRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();

    await consumeEvent("post.created", handlePostCreated);
    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(`Search service is running on port: ${PORT}`);
    });
  } catch (error) {
    logger.error(error, `Failed to start search service`);
    process.exit(1);
  }
}

startServer();

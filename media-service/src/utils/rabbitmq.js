// const amqp = require("amqplib");
// const logger = require("./logger");
// require("dotenv").config();

// let connection = null;
// let channel = null;

// const EXCHANGE_NAME = "facebook_events";

// async function connectToRabbitMQ() {
//   try {
//     connection = await amqp.connect(process.env.RABBITMQ_URL);
//     channel = await connection.createChannel();

//     await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
//     logger.info("Connected to Rabbit Mq");
//     return channel;
//   } catch (error) {
//     logger.error("Error while connecting Rabbit MQ", error);
//   }
// }

// async function publishEvent(routingKey, message) {
//   if (!channel) {
//     try {
//       await connectToRabbitMQ();
//     } catch (error) {
//       logger.error("Cannot publish event, RabbitMQ not connected", error);
//       return;
//     }
//   }
//   channel.publish(
//     EXCHANGE_NAME,
//     routingKey,
//     Buffer.from(JSON.stringify(message))
//   );
//   logger.info(`Event Published: ${routingKey}`);
// }

// async function consumeEvent(routingKey, callback) {
//   if (!channel) {
//     try {
//       await connectToRabbitMQ();
//     } catch (error) {
//       logger.error("Cannot consume event, RabbitMQ not connected");
//       return;
//     }
//   }
//   const q = await channel.assertQueue("", { exclusive: true });
//   await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
//   channel.consume(q.queue, (msg) => {
//     if (msg !== null) {
//       const content = JSON.parse(msg.content.toString());
//       callback(content);
//       channel.ack(msg);
//     }
//   });
//   logger.info(`Subscribed to Event: ${routingKey}`);
// }

// module.exports = { connectToRabbitMQ, publishEvent, consumeEvent };
const amqp = require("amqplib");
const logger = require("./logger");
require("dotenv").config();

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

// Retry delay (in ms)
const RETRY_DELAY = 5000;

// Connect to RabbitMQ
async function connectToRabbitMQ() {
  if (connection && channel) {
    return channel; // Already connected
  }

  while (true) {
    try {
      logger.info("Connecting to RabbitMQ...");
      connection = await amqp.connect(process.env.RABBITMQ_URL);

      connection.on("error", (err) => {
        logger.error("RabbitMQ connection error:", err);
        connection = null;
        channel = null;
      });

      connection.on("close", () => {
        logger.warn("RabbitMQ connection closed. Reconnecting...");
        connection = null;
        channel = null;
        setTimeout(connectToRabbitMQ, RETRY_DELAY);
      });

      channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });

      logger.info("Connected to RabbitMQ successfully");
      break;
    } catch (error) {
      logger.error("Error connecting to RabbitMQ. Retrying in 5s...", error);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }

  return channel;
}

// Publish Event
async function publishEvent(routingKey, message) {
  try {
    if (!channel) {
      await connectToRabbitMQ();
    }

    channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(message))
    );

    logger.info(`Event Published: ${routingKey}`);
  } catch (error) {
    logger.error("Failed to publish event", error);
  }
}

// Consume Event
async function consumeEvent(routingKey, callback) {
  try {
    if (!channel) {
      await connectToRabbitMQ();
    }

    const q = await channel.assertQueue("", { exclusive: true });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

    channel.consume(q.queue, (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          callback(content);
          channel.ack(msg);
        } catch (err) {
          logger.error("Error processing consumed message", err);
        }
      }
    });

    logger.info(`Subscribed to Event: ${routingKey}`);
  } catch (error) {
    logger.error("Failed to consume event", error);
  }
}

module.exports = { connectToRabbitMQ, publishEvent, consumeEvent };

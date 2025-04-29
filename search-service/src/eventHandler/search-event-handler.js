const Search = require("../models/Search");
const logger = require("../utils/logger");

async function handlePostCreated(event) {
  console.log(event);
  try {
    const newSearchPost = new Search({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });
    await newSearchPost.save();
    logger.info(
      `Search post created: ${event.postId}, ${newSearchPost._id.toString()}`
    );
  } catch (error) {
    logger.error("Error while Handle Post Creation Event in Media", error);
    res.status(500).json({
      success: false,
      message: "Error while Handle Post Creation Event in Media",
    });
  }
}

async function handlePostDeleted(event) {
  try {
    await Search.findOneAndDelete({ postId: event.postId });
    logger.info(
        `Search post Deleted: ${event.postId}`
      );
  } catch (error) {
    logger.error("Error while Handle Post delete Event in Search", error);
    res.status(500).json({
      success: false,
      message: "Error while Handle Post delete Event in Search",
    });
  }
}

module.exports = {
  handlePostCreated,
  handlePostDeleted
};

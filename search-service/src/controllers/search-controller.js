const Search = require("../models/Search");
const logger = require("../utils/logger");

const searchPost = async (req, res) => {
  logger.info("Search End point Hit..");
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const result = await Search.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error while Search Post", error);
    res.status(500).json({
      success: false,
      message: "Error while Searching Post",
    });
  }
};

module.exports = {
  searchPost,
};

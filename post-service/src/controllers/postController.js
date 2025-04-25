const Post = require("../models/Post");
const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");

async function invalidatePostCache(req, input) {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);

  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

const createPost = async (req, res) => {
  logger.info("Create Post End Point");
  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      console.log("This Is Error", error);
      logger.warn("Validate Error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, mediaIds } = req.body;

    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newlyCreatedPost.save();
    await invalidatePostCache(req, newlyCreatedPost._id.toString());

    logger.info("Post Created successfully", newlyCreatedPost);
    res.status(200).json({
      success: true,
      message: "Post Created Successfully",
    });
  } catch (error) {
    logger.error("Error while creating Post", error);
    res.status(500).json({
      success: false,
      message: "Error while creating Post",
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cachekey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cachekey);
    if (cachedPosts) {
      return res.status(200).json(JSON.parse(cachedPosts));
    }

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfPosts = await Post.countDocuments();

    const result = {
      currentPage: page,
      totalPages: Math.ceil(totalNoOfPosts / limit),
      totalPosts: totalNoOfPosts,
      posts,
    };

    // save your posts in redis client
    await req.redisClient.setex(cachekey, 300, JSON.stringify(result));

    res.status(200).json({
      success: true,
      message: `Posts Get Succesfully`,
      data: result,
    });
  } catch (error) {
    logger.error("Error while Getting All Post", error);
    res.status(500).json({
      success: false,
      message: "Error while Getting All Post",
    });
  }
};

const getPost = async (req, res) => {
  try {
  } catch (error) {
    logger.error("Error while Getting Post", error);
    res.status(500).json({
      success: false,
      message: "Error while Getting Post",
    });
  }
};

const deletePost = async (req, res) => {
  try {
  } catch (error) {
    logger.error("Error while Delete Post", error);
    res.status(500).json({
      success: false,
      message: "Error while Delete Post",
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
};

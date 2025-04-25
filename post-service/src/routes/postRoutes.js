const express = require("express");
const postController = require("../controllers/postController");
const { authenticateRequest } = require("../middleware/authMiddleware");
const router = express();

router.use(authenticateRequest);

router.post("/create-post", postController.createPost);

router.get("/all-posts", postController.getAllPosts);

router.get("/:id", postController.getPost);

router.delete("/:id", postController.deletePost);

module.exports = router;

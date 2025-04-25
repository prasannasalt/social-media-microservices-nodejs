const express = require("express");
const postController = require("../controllers/postController");
const { authenticateRequest } = require("../middleware/authMiddleware");
const router = express();

router.use(authenticateRequest);

router.post("/create-post", postController.createPost);

router.get("/all-posts", postController.getAllPosts);

router.get("/get-post", postController.getPost);

router.delete("/delete-post", postController.deletePost);

module.exports = router;

const express = require("express");
const multer = require("multer");
const mediaController = require("../controllers/media-controller");
const { authenticateRequest } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

// router.use(authenticateRequest);

// config multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

router.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, function (error) {
      if (error instanceof multer.MulterError) {
        logger.error("Multer error while uploading:", error);
        return res.status(400).json({
          success: false,
          error: error.message,
          stack: error.stack,
        });
      } else if (error) {
        logger.error("Multer Error while Uploading Media:", error);
        res.status(500).json({
          success: false,
          message: "Multer Error while Uploading Media:",
        });
      }

      if (!req.file) {
        res.status(500).json({
          success: false,
          message: "No file found!",
        });
      }
      next();
    });
  },
  mediaController.uploadMedia
);

router.get("/get", authenticateRequest, mediaController.getAllMedia);

module.exports = router;

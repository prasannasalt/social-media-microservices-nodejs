const Media = require("../models/Media");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const uploadMedia = async (req, res) => {
  logger.info("Starting Media Upload");
  try {
    if (!req.file) {
      logger.error("No file found. Please add a file and try again!");
      return res.status(400).json({
        success: false,
        message: "No file found. Please add a file and try again!",
      });
    }
    const { originalname, fieldname, mimetype, buffer } = req.file;
    console.log("Request Filesss : -----", req.file);
    const userId = req.user.userId;
    logger.info(`File details: name:${originalname}, type:${mimetype}`);

    logger.info("Upload to cloudinary starting..");
    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    logger.info(
      `Cloudinary Upload Successfully. Public Id:- ${cloudinaryUploadResult.public_id}`
    );
    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      orignalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(200).json({
      success: true,
      message: "Media Upload is Scucessfull",
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
    });
  } catch (error) {
    logger.error("Error while Uploading Media", error);
    res.status(500).json({
      success: false,
      message: "Error while Uploading Media",
    });
  }
};

const getAllMedia = async (req, res) => {
  try {
    const result = await Media.find({});
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error while Getting all Media", error);
    res.status(500).json({
      success: false,
      message: "Error while Getting all Media",
    });
  }
};

module.exports = {
  uploadMedia,
  getAllMedia,
};

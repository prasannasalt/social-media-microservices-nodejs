const Media = require("../models/Media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const handlePostDeleted = async (event) => {
  console.log(event, "Event Event");
  const { postId, userId, mediaIds } = event;
  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

    for (const media of mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);
      logger.info(
        `Deleted media ${media._id} associated with this deleted post ${postId}`
      );
    }
    logger.info(`Processed Deletetaion of Media for post ${postId}`);
  } catch (error) {
    logger.error("Error while Handle Delete Event in Media", error);
    res.status(500).json({
      success: false,
      message: "Error while Handle Delete Event in Media",
    });
  }
};

module.exports = {
  handlePostDeleted,
};

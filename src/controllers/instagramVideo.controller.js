const InstagramVideo = require("../models/InstagramVideo");
const {
  uploadToSpaces,
  getPublicUrl,
  deleteImageFromSpaces,
} = require("../middlewares/uploadMiddleware");

const { successResponse, errorResponse } = require("../utils/responseUtil");

/**
 * ✅ CREATE
 */
const createVideo = async (req, res) => {
  try {
    const { caption, instagramLink, sortOrder } = req.body;

    if (!instagramLink) {
      return errorResponse(res, 400, "Instagram link is required");
    }

    if (!req.file) {
      return errorResponse(res, 400, "Video file is required");
    }

    const key = await uploadToSpaces(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "instagram-videos"
    );

    const videoUrl = getPublicUrl(key);

    const video = await InstagramVideo.create({
      caption,
      instagramLink,
      videoUrl,
      sortOrder,
    });

    return successResponse(res, 201, "Instagram video created", { video });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

/**
 * ✅ READ (PUBLIC)
 */
const getAllVideos = async (req, res) => {
  try {
    const videos = await InstagramVideo.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 });

    return successResponse(res, 200, "Instagram videos fetched", { videos });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

/**
 * ✅ UPDATE
 * - Can update caption / link / order
 * - Can replace video (old video deleted from S3)
 */
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, instagramLink, sortOrder, isActive } = req.body;

    const video = await InstagramVideo.findById(id);
    if (!video) {
      return errorResponse(res, 404, "Video not found");
    }

    // If new video uploaded → delete old video
    if (req.file) {
      const oldKey = video.videoUrl.replace(
        `${process.env.DO_PUBLIC_URL}/`,
        ""
      );
      await deleteImageFromSpaces(oldKey);

      const newKey = await uploadToSpaces(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "instagram-videos"
      );

      video.videoUrl = getPublicUrl(newKey);
    }

    if (caption !== undefined) video.caption = caption;
    if (instagramLink !== undefined) video.instagramLink = instagramLink;
    if (sortOrder !== undefined) video.sortOrder = sortOrder;
    if (isActive !== undefined) video.isActive = isActive;

    await video.save();

    return successResponse(res, 200, "Instagram video updated", { video });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

/**
 * ✅ DELETE
 * - Deletes from S3 + MongoDB
 */
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await InstagramVideo.findById(id);
    if (!video) {
      return errorResponse(res, 404, "Video not found");
    }

    const key = video.videoUrl.replace(
      `${process.env.DO_PUBLIC_URL}/`,
      ""
    );

    await deleteImageFromSpaces(key);
    await video.deleteOne();

    return successResponse(res, 200, "Instagram video deleted");
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  createVideo,
  getAllVideos,
  updateVideo,
  deleteVideo,
};

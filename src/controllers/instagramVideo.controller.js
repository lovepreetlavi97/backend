const { InstagramVideo } = require("../models/index");
const { create, findOne, findMany, findAndUpdate, deleteOne, countDocuments } = require("../services/mysql/mysqlService");
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

    if (!req.files?.video?.[0]) {
      return errorResponse(res, 400, "Video file is required");
    }

    // ⬆️ Upload VIDEO
    const videoFile = req.files.video[0];
    const videoKey = await uploadToSpaces(
      videoFile.buffer,
      videoFile.originalname,
      videoFile.mimetype,
      "instagram-videos"
    );

    const videoUrl = getPublicUrl(videoKey);

    // ⬆️ Upload THUMBNAIL (optional but recommended)
    let thumbnailUrl = null;

    if (req.files?.thumbnail?.[0]) {
      const thumbFile = req.files.thumbnail[0];

      const thumbKey = await uploadToSpaces(
        thumbFile.buffer,
        thumbFile.originalname,
        thumbFile.mimetype,
        "instagram-thumbnails"
      );

      thumbnailUrl = getPublicUrl(thumbKey);
    }

    const video = await create(InstagramVideo, {
      caption,
      instagramLink,
      videoUrl,
      thumbnail: thumbnailUrl,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      isActive: true
    });

    return successResponse(res, 201, "Instagram video created", { video });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};


/**
 * ✅ READ (PUBLIC/ADMIN)
 */
const getAllVideos = async (req, res) => {
  try {
    const { all, page = 1, limit = 10 } = req.query;
    const filter = all === "true" ? {} : { isActive: true };

    const options = {
      page: Number(page),
      limit: Number(limit),
      sort: { sortOrder: 1, createdAt: -1 }
    };

    const videos = await findMany(InstagramVideo, filter, null, options);
    const total = await countDocuments(InstagramVideo, filter);

    return successResponse(res, 200, "Instagram videos fetched", {
      videos,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
        hasNext: (Number(page) * Number(limit)) < total,
      },
    });
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

    const video = await findOne(InstagramVideo, { id });
    if (!video) {
      return errorResponse(res, 404, "Video not found");
    }

    // Handle context-specific uploads from multer.fields()
    const videoFile = req.files?.video?.[0];
    const thumbFile = req.files?.thumbnail?.[0];

    const updateFields = {};

    // If new thumbnail uploaded → delete old thumbnail
    if (thumbFile) {
      if (video.thumbnail) {
        const oldThumbKey = video.thumbnail.replace(
          `${process.env.DO_PUBLIC_URL}/`,
          ""
        );
        await deleteImageFromSpaces(oldThumbKey);
      }

      const thumbKey = await uploadToSpaces(
        thumbFile.buffer,
        thumbFile.originalname,
        thumbFile.mimetype,
        "instagram-thumbnails"
      );

      updateFields.thumbnail = getPublicUrl(thumbKey);
    }

    // If new video uploaded → delete old video
    if (videoFile) {
      if (video.videoUrl) {
        const oldKey = video.videoUrl.replace(
          `${process.env.DO_PUBLIC_URL}/`,
          ""
        );
        await deleteImageFromSpaces(oldKey);
      }

      const newKey = await uploadToSpaces(
        videoFile.buffer,
        videoFile.originalname,
        videoFile.mimetype,
        "instagram-videos"
      );

      updateFields.videoUrl = getPublicUrl(newKey);
    }

    if (caption !== undefined) updateFields.caption = caption;
    if (instagramLink !== undefined) updateFields.instagramLink = instagramLink;
    if (sortOrder !== undefined) updateFields.sortOrder = parseInt(sortOrder);
    if (isActive !== undefined) updateFields.isActive = isActive;

    const updatedVideo = await findAndUpdate(InstagramVideo, { id }, updateFields);

    return successResponse(res, 200, "Instagram video updated", { video: updatedVideo });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

/**
 * ✅ DELETE
 * - Deletes from S3 + MySQL
 */
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await findOne(InstagramVideo, { id });
    if (!video) {
      return errorResponse(res, 404, "Video not found");
    }

    // delete video
    if (video.videoUrl) {
      const videoKey = video.videoUrl.replace(
        `${process.env.DO_PUBLIC_URL}/`,
        ""
      );
      await deleteImageFromSpaces(videoKey);
    }

    // delete thumbnail
    if (video.thumbnail) {
      const thumbKey = video.thumbnail.replace(
        `${process.env.DO_PUBLIC_URL}/`,
        ""
      );
      await deleteImageFromSpaces(thumbKey);
    }

    await deleteOne(InstagramVideo, { id });

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

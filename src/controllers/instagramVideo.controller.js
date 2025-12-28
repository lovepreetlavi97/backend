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

    const video = await InstagramVideo.create({
      caption,
      instagramLink,
      videoUrl,
      thumbnail: thumbnailUrl,
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
if (req.files?.thumbnail?.[0]) {
  if (video.thumbnail) {
    const oldThumbKey = video.thumbnail.replace(
      `${process.env.DO_PUBLIC_URL}/`,
      ""
    );
    await deleteImageFromSpaces(oldThumbKey);
  }

  const thumbFile = req.files.thumbnail[0];
  const thumbKey = await uploadToSpaces(
    thumbFile.buffer,
    thumbFile.originalname,
    thumbFile.mimetype,
    "instagram-thumbnails"
  );

  video.thumbnail = getPublicUrl(thumbKey);
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

// delete video
const videoKey = video.videoUrl.replace(
  `${process.env.DO_PUBLIC_URL}/`,
  ""
);
await deleteImageFromSpaces(videoKey);

// delete thumbnail
if (video.thumbnail) {
  const thumbKey = video.thumbnail.replace(
    `${process.env.DO_PUBLIC_URL}/`,
    ""
  );
  await deleteImageFromSpaces(thumbKey);
}

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

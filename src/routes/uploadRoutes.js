const express = require('express');
const router = express.Router();
const {
  uploadSingleImage,
  uploadMultipleImagesMulter,
  uploadToSpaces,
  uploadMultipleImages,
  getPublicUrl,
  deleteImageFromSpaces,
  deleteMultipleImagesFromSpaces,
} = require('../middlewares/uploadMiddleware');

const { adminAuth } = require('../middlewares/auth/auth.middleware');

// 🔹 Upload single image (expects `image` field + optional `folder`)
router.post("/image", adminAuth, uploadSingleImage, async (req, res) => {
  try {
    const file = req.file;
    const folder = req.body.folder || 'misc';


    if (!file) return res.status(400).json({ error: "No image uploaded" });

    const { buffer, originalname, mimetype } = file;
    const key = await uploadToSpaces(buffer, originalname, mimetype, folder);
    const url = getPublicUrl(key);

    res.status(200).json({ url, key });
  } catch (err) {

    res.status(500).json({ error: "Image upload failed" });
  }
});

// 🔹 Upload multiple images (expects `images` field + optional `folder`)
router.post("/images", adminAuth, uploadMultipleImagesMulter, async (req, res) => {
  try {
    const files = req.files;
    const folder = req.body.folder || 'misc';


    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }

    const keys = await uploadMultipleImages(files, folder);
    const urls = keys.map(getPublicUrl);

    res.status(200).json({ urls, keys });
  } catch (err) {

    res.status(500).json({ error: "Multiple image upload failed" });
  }
});

// 🔻 Delete single image by key
router.delete("/deleteImage", adminAuth, async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "Image key is required" });

    const deleted = await deleteImageFromSpaces(key);
    if (!deleted) throw new Error("Failed to delete");

    res.status(200).json({ message: "Image deleted", key });
  } catch (err) {

    res.status(500).json({ error: "Image deletion failed" });
  }
});

// 🔻 Delete multiple images by keys
router.delete("/deleteImages", adminAuth, async (req, res) => {
  try {
    const { keys } = req.query;
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: "Array of image keys is required" });
    }

    const deleted = await deleteMultipleImagesFromSpaces(keys);
    if (!deleted) throw new Error("Failed to delete images");

    res.status(200).json({ message: "Images deleted", keys });
  } catch (err) {

    res.status(500).json({ error: "Multiple image deletion failed" });
  }
});

module.exports = router;

const multer = require("multer");

const storage = multer.memoryStorage();

const uploadInstagramVideo = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}).single("image");

module.exports = { uploadInstagramVideo };

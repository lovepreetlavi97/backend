require("dotenv").config(); // Load .env FIRST

const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

// 🔍 Sanity logs (AWS ONLY)



// ✅ Configure AWS globally (CORRECT)
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// ✅ AWS S3 Client (NO custom endpoint)
const s3 = new AWS.S3({
  signatureVersion: "v4",
});

// File filter for images and videos (UNCHANGED)
const fileFilter = (req, file, cb) => {
  const isValid = file.mimetype.match(
    /(image|video)\/(jpeg|jpg|png|gif|mp4|webp)/
  );

  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error("❌ Invalid file type."), false);
  }
};

// ✅ Multer upload middleware (AWS S3)
const imageUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET, // 🔥 FIXED (AWS)
    // acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileExt = file.mimetype.split("/")[1];
      const fileName = `products/${uuidv4()}.${fileExt}`;
      cb(null, fileName);
    },
  }),
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 50 }, // 50MB
});

module.exports = {
  imageUpload,
  s3,
};

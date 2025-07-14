require("dotenv").config(); // Load .env FIRST

const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

// Log for sanity check
console.log("💬 DO_BUCKET_NAME:", process.env.DO_BUCKET_NAME);
console.log("💬 DO_REGION:", process.env.DO_REGION);

// Custom DigitalOcean Spaces endpoint
const spacesEndpoint = new AWS.Endpoint(`${process.env.DO_REGION.trim()}.digitaloceanspaces.com`);

// AWS S3 Client (v2)
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_ACCESS_KEY_ID,
  secretAccessKey: process.env.DO_SECRET_ACCESS_KEY,
  region: process.env.DO_REGION.trim(),
  signatureVersion: "v4",
});

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const isValid = file.mimetype.match(/(image|video)\/(jpeg|jpg|png|gif|mp4|webp)/);
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error("❌ Invalid file type."), false);
  }
};

// Multer upload middleware
const imageUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.DO_BUCKET_NAME,
    acl: "public-read",
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
  s3, // in case you need it elsewhere
};

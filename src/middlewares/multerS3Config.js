const multer = require("multer");
const multerS3 = require("multer-s3");
const { s3 } = require("../config/awsConfig");
const { v4: uuidv4 } = require("uuid");

const fileFilter = (req, file, cb) => {
  if (file.mimetype.match(/(image|video)\/(jpeg|jpg|png|gif|mp4|webp)/)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const imageUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    // acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileExt = file.mimetype.split("/")[1];
      cb(null, `products/${uuidv4()}.${fileExt}`);
    },
  }),
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 50 }, // 50MB
});

module.exports = imageUpload;

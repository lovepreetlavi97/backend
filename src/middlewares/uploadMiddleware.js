const multer = require("multer");
const { Upload } = require("@aws-sdk/lib-storage");
const { DeleteObjectCommand, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../config/s3Client");
const { v4: uuidv4 } = require("uuid");

// Multer memory storage (no disk writing)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Accept images & videos only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.match(/(image|video)\/(jpeg|jpg|png|gif|mp4|webp)/)) {
    cb(null, true);
  } else {
    cb(new Error("❌ Invalid file type."), false);
  }
};

// Middleware: upload single image under field name `image`
const uploadSingleImage = upload.single("image");

// Middleware: upload multiple images under field name `images`
const uploadMultipleImagesMulter = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10,
  },
  fileFilter,
}).array("images", 10);

// Upload a single file buffer to S3/Spaces
const uploadToSpaces = async (fileBuffer, fileName, mimeType, folder = 'misc') => {
  const uniqueName = `${uuidv4()}_${fileName}`;
  const key = `${folder}/${uniqueName}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.DO_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: "public-read",
    },
  });

  await upload.done();
  return key;
};

// Upload multiple files (array of File objects)
const uploadMultipleImages = async (files, folder = 'misc') => {
  const uploadedKeys = [];

  for (const file of files) {
    const { buffer, originalname, mimetype } = file;
    const key = await uploadToSpaces(buffer, originalname, mimetype, folder);
    uploadedKeys.push(key);
  }

  return uploadedKeys;
};

// Helper: Get full public URL from S3 key
const getPublicUrl = (key) => {
  const base = process.env.DO_PUBLIC_URL;
  if (!base) {
    console.warn("⚠️ DO_PUBLIC_URL not set in .env");
    return key;
  }
  return `${base}/${key}`;
};

// Delete a single file by key
const deleteImageFromSpaces = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.DO_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (err) {
    console.error("❌ Failed to delete single image:", err);
    return false;
  }
};

// Delete multiple files by key array
const deleteMultipleImagesFromSpaces = async (keys) => {
  try {
    const command = new DeleteObjectsCommand({
      Bucket: process.env.DO_BUCKET_NAME,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    });
    await s3Client.send(command);
    return true;
  } catch (err) {
    console.error("❌ Failed to delete multiple images:", err);
    return false;
  }
};

module.exports = {
  upload,
  uploadSingleImage,
  uploadMultipleImagesMulter,
  uploadToSpaces,
  uploadMultipleImages,
  getPublicUrl,
  deleteImageFromSpaces,
  deleteMultipleImagesFromSpaces,
};

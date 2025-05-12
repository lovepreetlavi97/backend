const imageUpload = require("./multerS3Config");

// Middleware Functions
const uploadSingleImage = imageUpload.single("image");
const uploadMultipleImages = imageUpload.array("images", 10); // Max 10 files

// New middleware for handling both main image and additional images
const uploadProductImages = imageUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);

// Image Controller Functions
const uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("Single File URL: ", req.file.location);
    res.status(200).json({ url: req.file.location });
  } catch (err) {
    console.error("Upload Single Error: ", err);
    res.status(500).json({ message: err.message });
  }
};

const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const urls = req.files.map((file) => file.location);
    console.log("Multiple File URLs: ", urls);
    res.status(200).json({ urls });
  } catch (err) {
    console.error("Upload Multiple Error: ", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  uploadSingle,
  uploadMultiple,
  uploadProductImages
};

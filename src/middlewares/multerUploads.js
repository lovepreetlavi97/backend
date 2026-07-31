const { imageUpload } = require("./multerS3Config");

// Middleware wrappers
const uploadSingleImage = imageUpload.single("image");
const uploadMultipleImages = imageUpload.array("images", 10); // Max 10 files

const uploadProductImages = imageUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

// Controller: Single File Upload
const uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }


    res.status(200).json({ url: req.file.location });
  } catch (err) {

    res.status(500).json({ message: err.message });
  }
};

// Controller: Multiple Files Upload
const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const urls = req.files.map((file) => file.location);

    res.status(200).json({ urls });
  } catch (err) {

    res.status(500).json({ message: err.message });
  }
};

// Optional: Controller for `uploadProductImages` if used directly
const uploadProductHandler = async (req, res) => {
  try {
    const image = req.files?.image?.[0]?.location || null;
    const images = req.files?.images?.map((f) => f.location) || [];




    res.status(200).json({ image, images });
  } catch (err) {

    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  uploadSingle,
  uploadMultiple,
  uploadProductImages,
  uploadProductHandler, // optional
};

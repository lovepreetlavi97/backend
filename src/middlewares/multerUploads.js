const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Configure AWS SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION, // AWS Region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your AWS Access Key
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Your AWS Secret Key
  },
});

// Multer configuration for S3
const upload = multer({
  storage: multerS3({
    s3: s3Client, // Using the S3Client from AWS SDK v3
    bucket: process.env.AWS_BUCKET_NAME, // Your S3 Bucket Name
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // Create a unique key for the uploaded file based on timestamp and original filename
      const uniqueName = `${Date.now()}-${file.originalname.replace(/\s/g, '')}`;
      cb(null, uniqueName); // Set the unique file name in the bucket
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 50, // 50 MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

// Function to handle the upload of multiple files
const uploadImagesToBucket = (req, res, next) => {
  const uploadMultiple = upload.array('images', 10); // Accept up to 10 images in the array
  uploadMultiple(req, res, (err) => {
    if (err) {
      // Handle Multer or S3 errors
      console.error('Upload error:', err);
      return res.status(400).json({ isError: true, message: err.message });
    }

    // Ensure that files are uploaded before proceeding
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ isError: true, message: 'No files uploaded!' });
    }

    // Successful upload, format the response with file information
    const uploadedFiles = req.files.map((file) => ({
      fileName: file.originalname,
      s3Key: file.key,
      s3Url: file.location,
    }));

    req.uploadedFiles = uploadedFiles; // Attach the uploaded files info to the request object
    next(); // Pass to next middleware or controller
  });
};

module.exports = {
  uploadImagesToBucket,
};

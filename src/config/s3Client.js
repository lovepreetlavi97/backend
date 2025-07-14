// config/s3Client.js
const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();

const s3Client = new S3Client({
  endpoint: `https://${process.env.DO_REGION}.digitaloceanspaces.com`,
  region: process.env.DO_REGION,
  credentials: {
    accessKeyId: process.env.DO_ACCESS_KEY_ID,
    secretAccessKey: process.env.DO_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false, // DigitalOcean needs this false
});

module.exports = { s3Client };

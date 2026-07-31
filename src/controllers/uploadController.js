import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ✅ AWS S3 client (NO custom endpoint)
const s3 = new S3Client({
  region: process.env.AWS_REGION, // eu-north-1
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const generatePresignedUrl = async (req, res) => {
  try {
    const { filename, filetype } = req.query;

    if (!filename || !filetype) {
      return res.status(400).json({ error: "Missing filename or filetype" });
    }

    const key = `products/${Date.now()}_${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET, // ✅ AWS bucket
      Key: key,
      ContentType: filetype,
      // ACL: "public-read", // optional, keep if you want public files
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 60, // seconds
    });

    // ✅ Correct AWS S3 public URL
    const finalUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({ uploadUrl, finalUrl });
  } catch (err) {

    res.status(500).json({ error: "Internal Server Error" });
  }
};

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.DO_REGION, // e.g., "blr1"
  endpoint: `https://${process.env.DO_REGION}.digitaloceanspaces.com`, // 🧠 DIGITALOCEAN MAGIC
  credentials: {
    accessKeyId: process.env.DO_ACCESS_KEY_ID,
    secretAccessKey: process.env.DO_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

export const generatePresignedUrl = async (req, res) => {
  try {
    const { filename, filetype } = req.query;

    if (!filename || !filetype) {
      return res.status(400).json({ error: 'Missing filename or filetype' });
    }

    const key = `products/${Date.now()}_${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.DO_BUCKET_NAME, // ✅ Use correct DO bucket env
      Key: key,
      ContentType: filetype,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    const finalUrl = `https://${process.env.DO_BUCKET_NAME}.${process.env.DO_REGION}.digitaloceanspaces.com/${key}`;

    res.json({ uploadUrl, finalUrl });
  } catch (err) {
    console.error('❌ Error generating signed URL:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

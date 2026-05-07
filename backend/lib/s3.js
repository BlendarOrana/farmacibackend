import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_BUCKET_NAME || !process.env.CLOUDFRONT_DOMAIN) {
  console.error('Missing required environment variables (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, CLOUDFRONT_DOMAIN)');
  process.exit(1);
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Convert and compress any image buffer to WebP
 */
export const processImage = async (buffer, options = {}) => {
  const { maxWidth = 1920, maxHeight = 1080, quality = 85, effort = 4 } = options;

  const metadata = await sharp(buffer).metadata();
  let { width, height } = metadata;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  return sharp(buffer)
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort })
    .toBuffer();
};

/**
 * Upload a WebP buffer to S3
 */
export const uploadToS3 = async (buffer, key) => {
  if (!buffer || buffer.length === 0) throw new Error('Buffer is empty or invalid');
  if (!key) throw new Error('S3 key is required');

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
    ServerSideEncryption: 'AES256',
    Metadata: {
      'upload-time': new Date().toISOString(),
    },
  }));

  return {
    key,
    url: `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`,
  };
};

/**
 * Process and upload an image to S3 in one step
 */
export const processAndUpload = async (buffer, key, sharpOptions = {}) => {
  const webpBuffer = await processImage(buffer, sharpOptions);
  return uploadToS3(webpBuffer, key);
};

/**
 * Delete a file from S3
 */
export const deleteFromS3 = async (key) => {
  if (!key) return null;

  try {
    return await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    }));
  } catch (err) {
    console.error(`Error deleting "${key}" from S3:`, err.message);
    return null;
  }
};

/**
 * Get CloudFront URL for a key
 */
export const getUrl = (key) => {
  if (!key) return null;
  return `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
};

/**
 * Test S3 connection
 */
export const testS3Connection = async () => {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: process.env.AWS_BUCKET_NAME }));
    return true;
  } catch (err) {
    console.error('S3 connection failed:', err.message);
    return false;
  }
};
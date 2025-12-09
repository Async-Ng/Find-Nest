import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({ region: process.env.REGION });
const BUCKET_NAME = process.env.IMAGES_BUCKET_NAME;

// Generate presigned URL for upload
export const generateUploadUrl = async (fileName, contentType, userId) => {
  const ext = contentType?.split('/')[1] || 'jpg';
  const safeName = fileName && fileName !== 'undefined' ? fileName : `image.${ext}`;
  const key = `listings/${userId}/${uuidv4()}-${safeName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Metadata: {
      uploadedBy: userId,
      originalName: safeName
    }
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  
  return {
    uploadUrl,
    key,
    publicUrl: `https://${BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${key}`
  };
};

// Generate multiple upload URLs
export const generateMultipleUploadUrls = async (files, userId) => {
  const uploadPromises = files.map(file => 
    generateUploadUrl(file.fileName, file.contentType, userId)
  );
  
  return await Promise.all(uploadPromises);
};

// Delete image from S3
export const deleteImage = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });
  
  await s3Client.send(command);
  return { success: true };
};
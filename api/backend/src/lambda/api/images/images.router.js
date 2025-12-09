import express from "express";
import { generateUploadUrls, deleteImage } from "./images.controller.js";
import { requireLandlordOrAdmin } from "../auth/auth.middleware.js";

const router = express.Router();

// Generate presigned URLs for image upload
router.post("/upload-urls", requireLandlordOrAdmin, generateUploadUrls);

// Delete image
router.delete("/:key", requireLandlordOrAdmin, deleteImage);

export default router;
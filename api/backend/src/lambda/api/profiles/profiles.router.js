import express from "express";
import { getProfile, updateProfile } from "./profiles.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = express.Router();

// All profile routes require authentication
// GET /profile (lấy hồ sơ của user hiện tại)
router.get("/", requireAuth, getProfile);

// PUT /profile (cập nhật hồ sơ của user hiện tại)
router.put("/", requireAuth, updateProfile);

export default router;

import express from "express";
import { getNotifications, markNotificationAsRead, markAllAsRead } from "./notifications.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = express.Router();

// Get user notifications
router.get("/", requireAuth, getNotifications);

// Mark notification as read
router.put("/:notificationId/read", requireAuth, markNotificationAsRead);

// Mark all as read
router.put("/read-all", requireAuth, markAllAsRead);

export default router;

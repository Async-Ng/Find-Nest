import express from "express";
import { smartRoomSearch } from "./ai.controller.js";
import { rateLimitMiddleware } from "../system/rate-limit.middleware.js";
import { optionalAuth } from "../auth/auth.middleware.js";

const router = express.Router();

// US-025, US-027, US-031, US-032: Smart room search with natural language processing
router.post("/search", rateLimitMiddleware(50, 60000), optionalAuth, smartRoomSearch);

export default router;
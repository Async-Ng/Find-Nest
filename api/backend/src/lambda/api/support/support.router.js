import express from "express";
import { createSupportRequest, getSupportRequests, updateSupportRequest } from "./support.controller.js";
import { requireAuth, requireAdmin } from "../auth/auth.middleware.js";

const router = express.Router();

// User creates support request (landlord upgrade, feedback, bug reports, etc.)
router.post("/", requireAuth, createSupportRequest);

// Admin views all support requests
router.get("/", requireAdmin, getSupportRequests);

// Admin updates support request status
router.put("/:requestId", requireAdmin, updateSupportRequest);

export default router;
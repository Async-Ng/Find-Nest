import express from "express";
import { createListing, getListings, getListingById, updateListing, deleteListing } from "./listings.controller.js";
import { requireAuth, requireLandlordOrAdmin, optionalAuth } from "../auth/auth.middleware.js";
import { rateLimitMiddleware } from "../system/rate-limit.middleware.js";

const router = express.Router();

// Public routes with optional auth for search history and rate limiting
router.get("/", rateLimitMiddleware(200, 60000), optionalAuth, getListings);           // GET /listings?district=...&view=map&recommendations=true
router.get("/:listingId", getListingById); // GET /listings/:id

// Protected routes (yêu cầu JWT auth - chỉ landlord hoặc admin)
router.post("/", requireLandlordOrAdmin, createListing);        // POST /listings
router.put("/:listingId", requireLandlordOrAdmin, updateListing);  // PUT /listings/:id
router.delete("/:listingId", requireLandlordOrAdmin, deleteListing); // DELETE /listings/:id

export default router;

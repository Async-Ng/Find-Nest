import express from "express";
import { getAllUsers, updateUserStatus, getSystemStats, deleteViolatingListing, updateUserRole, cleanupInactiveUsers, refreshAreaData, sendWeeklyDigest, getPopularAreas, getTopRecommendations, getUsersByArea } from "./admin.controller.js";
import { requireAdmin } from "../auth/auth.middleware.js";

const router = express.Router();

/**
 * GET /admin/users
 * Get all users in the system (admin only)
 * Query: ?page=1&limit=20&userType=user&status=ENABLED
 */
router.get("/users", requireAdmin, getAllUsers);

/**
 * PUT /admin/users/:userId/status
 * Update user status (enable/disable) (admin only)
 * Body: { status: "ENABLED" | "DISABLED" }
 */
router.put("/users/:userId/status", requireAdmin, updateUserStatus);

/**
 * GET /admin/stats
 * Get system statistics (US-040)
 */
router.get("/stats", requireAdmin, getSystemStats);

/**
 * DELETE /admin/listings/:listingId
 * Delete violating listing (US-041)
 * Body: { reason: "Violation reason" }
 */
router.delete("/listings/:listingId", requireAdmin, deleteViolatingListing);

/**
 * PUT /admin/users/:userId/role
 * Update user role (US-042)
 * Body: { role: "user" | "landlord" | "admin" }
 */
router.put("/users/:userId/role", requireAdmin, updateUserRole);





/**
 * POST /admin/system/cleanup-inactive-users
 * Delete inactive user accounts (US-010)
 */
router.post("/system/cleanup-inactive-users", requireAdmin, cleanupInactiveUsers);

/**
 * POST /admin/system/refresh-area-data
 * Refresh area context data (US-040)
 * TEMP: No auth for testing
 */
router.post("/system/refresh-area-data", refreshAreaData);

/**
 * POST /admin/notifications/send-weekly-digest
 * Send weekly digest to users (US-050)
 */
router.post("/notifications/send-weekly-digest", requireAdmin, sendWeeklyDigest);

/**
 * GET /admin/analytics/popular-areas
 * Get popular area analytics (US-045)
 */
router.get("/analytics/popular-areas", requireAdmin, getPopularAreas);

/**
 * GET /admin/analytics/top-recommendations
 * Get top AI recommendations (US-058)
 */
router.get("/analytics/top-recommendations", requireAdmin, getTopRecommendations);

/**
 * GET /admin/analytics/users-by-area
 * Get user analytics by area (US-060)
 */
router.get("/analytics/users-by-area", requireAdmin, getUsersByArea);

/**
 * GET /admin/listings/:listingId/area-context
 * Test endpoint to view areaContext for a specific listing
 */
router.get("/listings/:listingId/area-context", async (req, res) => {
  try {
    const { getListingById } = await import('../listings/listings.service.js');
    const listing = await getListingById(req.params.listingId);
    
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }
    
    res.json({
      listingId: listing.listingId,
      title: listing.title,
      location: listing.location,
      address: listing.address,
      areaContext: listing.areaContext || null,
      hasAreaContext: !!listing.areaContext
    });
  } catch (error) {
    console.error("Get area context error:", error);
    res.status(500).json({ error: "ServerError" });
  }
});

export default router;
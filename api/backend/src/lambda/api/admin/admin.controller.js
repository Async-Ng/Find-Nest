import * as adminService from "./admin.service.js";

/**
 * GET /admin/users
 * Get all users in the system (admin only)
 */
export async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 20, userType, status } = req.query;

    const filters = {};
    if (userType) filters.userType = userType;
    if (status) filters.status = status;

    const result = await adminService.getAllUsers(filters, parseInt(page), parseInt(limit));

    return res.status(200).json({
      success: true,
      users: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      error: "ServerError",
      message: "Failed to retrieve users",
    });
  }
}

/**
 * GET /admin/stats
 * Get system statistics (US-040, US-051, US-052)
 */
export async function getSystemStats(req, res) {
  try {
    const stats = await adminService.getEnhancedSystemStats();
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Get system stats error:", error);
    return res.status(500).json({
      error: "ServerError",
      message: "Failed to retrieve system statistics"
    });
  }
}

/**
 * DELETE /admin/listings/:listingId
 * Delete violating listing (US-041)
 */
export async function deleteViolatingListing(req, res) {
  try {
    const { listingId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;

    await adminService.deleteViolatingListing(listingId, reason, adminId);
    
    return res.status(200).json({
      success: true,
      message: "Listing deleted successfully"
    });
  } catch (error) {
    console.error("Delete violating listing error:", error);
    return res.status(500).json({
      error: "ServerError",
      message: "Failed to delete listing"
    });
  }
}

/**
 * PUT /admin/users/:userId/role
 * Update user role (US-042)
 */
export async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.user.userId;

    if (!['user', 'landlord', 'admin'].includes(role)) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Invalid role. Must be: user, landlord, or admin"
      });
    }

    const result = await adminService.updateUserRole(userId, role, adminId);
    
    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: result.user
    });
  } catch (error) {
    console.error("Update user role error:", error);
    return res.status(500).json({
      error: "ServerError",
      message: "Failed to update user role"
    });
  }
}

/**
 * PUT /admin/users/:userId/status
 * Update user status (enable/disable) (admin only)
 */
export async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status || !["ENABLED", "DISABLED"].includes(status)) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Status must be ENABLED or DISABLED",
      });
    }

    const result = await adminService.updateUserStatus(userId, status);

    return res.status(200).json({
      success: true,
      message: `User ${status.toLowerCase()} successfully`,
      user: result.user,
    });
  } catch (error) {
    console.error("Update user status error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "UserNotFound",
        message: "User not found",
      });
    }

    return res.status(500).json({
      error: "ServerError",
      message: "Failed to update user status",
    });
  }
}





/**
 * POST /admin/system/cleanup-inactive-users
 * Delete inactive user accounts (US-010)
 */
export async function cleanupInactiveUsers(req, res) {
  try {
    const { deleteInactiveAccounts } = await import('../system/cleanup.service.js');
    const result = await deleteInactiveAccounts();
    
    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} inactive accounts`,
      ...result
    });
  } catch (error) {
    console.error("Cleanup inactive users error:", error);
    return res.status(500).json({
      error: "ServerError",
      message: "Failed to cleanup inactive users"
    });
  }
}

/**
 * POST /admin/system/refresh-area-data
 * Refresh area context data (US-040)
 * Query: ?force=true to refresh all listings
 */
export async function refreshAreaData(req, res) {
  try {
    const { force } = req.query;
    const { refreshAreaContext } = await import('../system/cleanup.service.js');
    const result = await refreshAreaContext(force === 'true');
    
    return res.status(200).json({
      success: true,
      message: `Refreshed ${result.refreshedCount} listings`,
      ...result
    });
  } catch (error) {
    console.error("Refresh area data error:", error);
    return res.status(500).json({
      error: "ServerError",
      message: "Failed to refresh area data"
    });
  }
}

/**
 * POST /admin/notifications/send-weekly-digest
 * Send weekly digest to users (US-050)
 */
export async function sendWeeklyDigest(req, res) {
  try {
    const { sendWeeklyDigest } = await import('../notifications/weekly-digest.service.js');
    const result = await sendWeeklyDigest();
    
    return res.status(200).json({
      success: true,
      message: `Sent digest to ${result.sentCount} users`,
      ...result
    });
  } catch (error) {
    console.error("Send weekly digest error:", error);
    return res.status(500).json({
      error: "ServerError",
      message: "Failed to send weekly digest"
    });
  }
}

/**
 * GET /admin/analytics/popular-areas
 * Get popular area analytics (US-045)
 */
export async function getPopularAreas(req, res) {
  try {
    const { days = 7 } = req.query;
    const { getPopularAreas } = await import('../analytics/analytics.service.js');
    const areas = await getPopularAreas(parseInt(days));
    
    return res.status(200).json({
      success: true,
      areas
    });
  } catch (error) {
    console.error("Get popular areas error:", error);
    return res.status(500).json({
      error: "ServerError",
      message: "Failed to get popular areas"
    });
  }
}

/**
 * GET /admin/analytics/top-recommendations
 * Get top AI recommendations (US-058)
 */
export async function getTopRecommendations(req, res) {
  try {
    const { days = 7 } = req.query;
    const { getTopAIRecommendations } = await import('../analytics/analytics.service.js');
    const recommendations = await getTopAIRecommendations(parseInt(days));
    
    return res.status(200).json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error("Get top recommendations error:", error);
    return res.status(500).json({
      error: "ServerError",
      message: "Failed to get top recommendations"
    });
  }
}

/**
 * GET /admin/analytics/users-by-area
 * Get user analytics by area (US-060)
 */
export async function getUsersByArea(req, res) {
  try {
    const { getUserAnalyticsByArea } = await import('../analytics/analytics.service.js');
    const analytics = await getUserAnalyticsByArea();
    
    return res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error("Get users by area error:", error);
    return res.status(500).json({
      error: "ServerError",
      message: "Failed to get user analytics"
    });
  }
}
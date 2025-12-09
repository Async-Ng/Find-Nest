import express from "express";
import {
  sendOTP,
  verifyOTP,
  adminLogin,
  refreshToken,
  logout,
  getCurrentUser,
} from "./auth.controller.js";
import { requireAuth, requireAdmin } from "./auth.middleware.js";

const router = express.Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================



// ============================================================================
// USER AUTHENTICATION ROUTES (Phone + OTP)
// ============================================================================

/**
 * POST /auth/send-otp
 * Send OTP to user's phone number
 */
router.post("/send-otp", sendOTP);

/**
 * POST /auth/verify-otp
 * Verify OTP and authenticate user
 */
router.post("/verify-otp", verifyOTP);



// ============================================================================
// ADMIN AUTHENTICATION ROUTES (Username + Password)
// ============================================================================

/**
 * POST /auth/admin/login
 * Admin login with username and password
 * Body: { username: "admin01", password: "SecurePass123!" }
 * Returns: { accessToken, refreshToken, idToken, admin }
 */
router.post("/admin/login", adminLogin);



// ============================================================================
// TOKEN MANAGEMENT ROUTES
// ============================================================================

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 * Body: { refreshToken }
 * Returns: { accessToken, idToken }
 */
router.post("/refresh", refreshToken);

/**
 * POST /auth/logout
 * Sign out user globally (invalidate all tokens)
 * Headers: { Authorization: "Bearer <access-token>" }
 * Returns: { success, message }
 * Protected: Requires authentication
 */
router.post("/logout", requireAuth, logout);

// ============================================================================
// USER INFO ROUTES
// ============================================================================

/**
 * GET /auth/me
 * Get current authenticated user's profile
 * Headers: { Authorization: "Bearer <access-token>" }
 * Returns: { user } with full profile
 * Protected: Requires authentication
 */
router.get("/me", requireAuth, getCurrentUser);

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Handle 404 for undefined auth routes
 */
router.use((req, res) => {
  res.status(404).json({
    error: "NotFound",
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      "POST /auth/send-otp",
      "POST /auth/verify-otp",
      "POST /auth/admin/login",
      "POST /auth/refresh",
      "POST /auth/logout (protected)",
      "GET /auth/me (protected)",
    ],
  });
});

export default router;

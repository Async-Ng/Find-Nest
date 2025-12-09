import {
  generateAndSendOTP,
  verifyOTPAndAuthenticate,
  authenticateAdmin,
  refreshAccessToken,
  signOut,
  getUserProfile,
} from "./auth.service.js";
import {
  formatPhoneNumber,
  validatePhoneNumber,
  validateUsername,
} from "./auth.utils.js";

/**
 * POST /auth/user/send-otp
 * Send OTP to phone number - auto-creates user if doesn't exist
 */
export async function sendOTP(req, res) {
  try {
    const { phoneNumber } = req.body;

    // Validate input
    if (!phoneNumber) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Phone number is required",
      });
    }

    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone || !validatePhoneNumber(formattedPhone)) {
      return res.status(400).json({
        error: "InvalidPhoneNumber",
        message:
          "Invalid phone number format. Please use Vietnam phone number (+84xxxxxxxxx or 0xxxxxxxxx)",
      });
    }

    // Generate and send OTP (will auto-create user on verify)
    const result = await generateAndSendOTP(formattedPhone);

    // Return OTP in response (temporarily enabled for testing when SNS quota exceeded)
    return res.status(200).json({
      success: true,
      message:
        "OTP sent successfully. If this is your first time, an account will be created automatically.",
      expiresIn: result.expiresIn,
      phoneNumber: formattedPhone,
      otp: result.otp, // TODO: Remove when SNS quota restored
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    // Handle specific errors
    if (error.message.includes("OTP already sent")) {
      return res.status(429).json({
        error: "TooManyRequests",
        message: error.message,
      });
    }

    return res.status(500).json({
      error: "ServerError",
      message: "Failed to send OTP. Please try again.",
    });
  }
}

/**
 * POST /auth/user/verify-otp
 * Verify OTP and authenticate user (auto-creates account if first time)
 */
export async function verifyOTP(req, res) {
  try {
    const { phoneNumber, otp } = req.body;

    // Validate input
    if (!phoneNumber || !otp) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Phone number and OTP are required",
      });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        error: "InvalidOTP",
        message: "OTP must be 6 digits",
      });
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return res.status(400).json({
        error: "InvalidPhoneNumber",
        message: "Invalid phone number format",
      });
    }

    // Verify OTP and authenticate (auto-creates user if needed)
    console.log("[verifyOTP] Starting verification for:", formattedPhone);
    const result = await verifyOTPAndAuthenticate(formattedPhone, otp);
    console.log(
      "[verifyOTP] Authentication successful, result keys:",
      Object.keys(result)
    );

    const isNewUser =
      !result.user.lastLoginAt ||
      result.user.createdAt === result.user.lastLoginAt;

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? "Welcome! Your account has been created successfully."
        : "Login successful",
      isNewUser,
      accessToken: result.AccessToken,
      refreshToken: result.RefreshToken,
      idToken: result.IdToken,
      expiresIn: result.ExpiresIn,
      tokenType: result.TokenType || "Bearer",
      user: result.user,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    // Handle specific errors
    if (
      error.message.includes("not found") ||
      error.message.includes("expired")
    ) {
      return res.status(400).json({
        error: "InvalidOTP",
        message: error.message,
      });
    }

    if (error.message.includes("Invalid OTP")) {
      return res.status(400).json({
        error: "InvalidOTP",
        message: error.message,
      });
    }

    if (error.message.includes("Maximum")) {
      return res.status(429).json({
        error: "TooManyAttempts",
        message: error.message,
      });
    }

    return res.status(500).json({
      error: "ServerError",
      message: "Authentication failed. Please try again.",
    });
  }
}

/**
 * POST /auth/admin/login
 * Admin login with username and password
 */
export async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Username and password are required",
      });
    }

    // Validate username format
    if (!validateUsername(username)) {
      return res.status(400).json({
        error: "InvalidUsername",
        message: "Invalid username format",
      });
    }

    // Authenticate admin
    const result = await authenticateAdmin(username, password);

    return res.status(200).json({
      success: true,
      message: "Admin authentication successful",
      accessToken: result.AccessToken,
      refreshToken: result.RefreshToken,
      idToken: result.IdToken,
      expiresIn: result.ExpiresIn,
      tokenType: result.TokenType || "Bearer",
      admin: result.admin,
    });
  } catch (error) {
    console.error("Admin login error:", error);

    // Handle specific errors
    if (error.message.includes("Invalid username or password")) {
      return res.status(401).json({
        error: "InvalidCredentials",
        message: "Invalid username or password",
      });
    }

    if (error.message.includes("Unauthorized")) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have administrator privileges",
      });
    }

    return res.status(500).json({
      error: "ServerError",
      message: "Authentication failed. Please try again.",
    });
  }
}

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
export async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    // Validate input
    if (!refreshToken) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Refresh token is required",
      });
    }

    // Refresh tokens
    const result = await refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: result.AccessToken,
      idToken: result.IdToken,
      expiresIn: result.ExpiresIn,
      tokenType: result.TokenType || "Bearer",
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    // Handle specific errors
    if (
      error.message.includes("Invalid") ||
      error.message.includes("expired")
    ) {
      return res.status(401).json({
        error: "InvalidRefreshToken",
        message: "Invalid or expired refresh token. Please login again.",
      });
    }

    return res.status(500).json({
      error: "ServerError",
      message: "Failed to refresh token. Please try again.",
    });
  }
}

/**
 * POST /auth/logout
 * Sign out user globally (invalidate all tokens)
 */
export async function logout(req, res) {
  try {
    // Extract access token from Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Access token is required",
      });
    }

    // Sign out
    await signOut(token);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      error: "ServerError",
      message: "Failed to logout. Please try again.",
    });
  }
}

/**
 * GET /auth/me
 * Get current user profile
 */
export async function getCurrentUser(req, res) {
  try {
    // User info is already in req.user (from middleware)
    const userId = req.user.userId;

    // Get full profile from DynamoDB
    const profile = await getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        error: "ProfileNotFound",
        message: "User profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        ...profile,
        // Add token info
        isAdmin: req.user.isAdmin,
        isUser: req.user.isUser,
        groups: req.user.groups,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      error: "ServerError",
      message: "Failed to retrieve user profile",
    });
  }
}

export default {
  sendOTP,
  verifyOTP,
  adminLogin,
  refreshToken,
  logout,
  getCurrentUser,
};

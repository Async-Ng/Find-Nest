import { extractTokenFromHeader, verifyJWT } from "./auth.utils.js";
import {
  getUserFromToken,
  isUserInAdminGroup,
  getUserProfile,
} from "./auth.service.js";

const USER_POOL_ID = process.env.USER_POOL_ID;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID;
const REGION = process.env.REGION || "us-east-1";

/**
 * Middleware to verify JWT token and attach user info to request
 * This is the base middleware used by all auth-protected routes
 */
export async function verifyToken(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
        message:
          "No token provided. Please include Authorization header with Bearer token.",
      });
    }

    // Verify JWT token with Cognito (don't check audience for access tokens)
    const decoded = await verifyJWT(token, USER_POOL_ID, REGION, null);

    // Extract user information from decoded token
    const userId = decoded.sub;
    const username = decoded["cognito:username"];
    const groups = decoded["cognito:groups"] || [];
    const phoneNumber = decoded.phone_number || null;
    const email = decoded.email || null;

    // Determine user type based on groups
    const isAdmin = groups.includes("Admins");
    const isUser = groups.includes("Users");
    const isLandlord = groups.includes("Landlords");

    // Attach decoded user info to request
    req.user = {
      userId,
      username,
      phoneNumber,
      email,
      groups,
      isAdmin,
      isUser,
      isLandlord,
      token: decoded,
    };

    // Continue to next middleware/handler
    next();
  } catch (error) {
    console.error("Token verification error:", error);

    // Return appropriate error message
    if (error.message.includes("expired")) {
      return res.status(401).json({
        error: "TokenExpired",
        message: "Token has expired. Please refresh your token or login again.",
      });
    }

    if (error.message.includes("verification failed")) {
      return res.status(401).json({
        error: "InvalidToken",
        message: "Invalid token. Please login again.",
      });
    }

    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication failed.",
    });
  }
}

/**
 * Middleware to require authenticated user (either User or Admin)
 * Use this for routes that need authentication but don't care about role
 */
export async function requireAuth(req, res, next) {
  // First verify the token
  await verifyToken(req, res, () => {
    // Token is verified and req.user is set
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required.",
      });
    }

    // User is authenticated, proceed
    next();
  });
}

/**
 * Middleware to require regular user (not admin)
 * Use this for user-only routes
 */
export async function requireUser(req, res, next) {
  // First verify the token
  await verifyToken(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required.",
      });
    }

    // Check if user is in Users group
    if (!req.user.isUser) {
      return res.status(403).json({
        error: "Forbidden",
        message: "This endpoint is only accessible to regular users.",
      });
    }

    // User is authenticated and is a regular user
    next();
  });
}

/**
 * Middleware to require landlord user
 * Use this for landlord-only routes
 */
export async function requireLandlord(req, res, next) {
  // First verify the token
  await verifyToken(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required.",
      });
    }

    // Check if user is in Landlords group
    if (!req.user.isLandlord) {
      return res.status(403).json({
        error: "Forbidden",
        message: "This endpoint is only accessible to landlords.",
      });
    }

    // User is authenticated and is a landlord
    next();
  });
}

/**
 * Middleware to require landlord or admin
 * Use this for listing management routes
 */
export async function requireLandlordOrAdmin(req, res, next) {
  // First verify the token
  await verifyToken(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required.",
      });
    }

    // Check if user is landlord or admin
    if (!req.user.isLandlord && !req.user.isAdmin) {
      return res.status(403).json({
        error: "Forbidden",
        message: "This endpoint is only accessible to landlords or administrators.",
      });
    }

    next();
  });
}

/**
 * Middleware to require admin user
 * Use this for admin-only routes
 */
export async function requireAdmin(req, res, next) {
  // First verify the token
  await verifyToken(req, res, async () => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required.",
      });
    }

    // Check if user is in Admins group
    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: "Forbidden",
        message: "This endpoint is only accessible to administrators.",
      });
    }

    // Token already verified and contains groups claim
    // No need for double-check with Cognito
    next();
  });
}

/**
 * Middleware to optionally verify token
 * If token exists, verify it and attach user info
 * If no token, continue without user info
 * Use this for routes that have optional authentication
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      // No token provided, continue without user info
      req.user = null;
      return next();
    }

    // Token provided, verify it
    await verifyToken(req, res, next);
  } catch (error) {
    // Token verification failed, but continue without user info
    req.user = null;
    next();
  }
}

/**
 * Middleware to attach full user profile from DynamoDB
 * Should be used after verifyToken/requireAuth
 * Adds req.userProfile with full profile data
 */
export async function attachUserProfile(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated.",
      });
    }

    // Get full profile from DynamoDB
    const profile = await getUserProfile(req.user.userId);

    if (!profile) {
      return res.status(404).json({
        error: "ProfileNotFound",
        message: "User profile not found.",
      });
    }

    // Attach profile to request
    req.userProfile = profile;

    next();
  } catch (error) {
    console.error("Error attaching user profile:", error);
    return res.status(500).json({
      error: "ServerError",
      message: "Error retrieving user profile.",
    });
  }
}

/**
 * Error handler middleware for authentication errors
 * Place this after all routes
 */
export function authErrorHandler(err, req, res, next) {
  // Handle specific authentication errors
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      error: "Unauthorized",
      message: err.message || "Authentication failed.",
    });
  }

  if (err.name === "ForbiddenError") {
    return res.status(403).json({
      error: "Forbidden",
      message: err.message || "Access denied.",
    });
  }

  // Pass to next error handler
  next(err);
}

export default {
  verifyToken,
  requireAuth,
  requireUser,
  requireAdmin,
  optionalAuth,
  attachUserProfile,
  authErrorHandler,
};

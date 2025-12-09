import crypto from "crypto";
import { parsePhoneNumber } from "libphonenumber-js";
import jwksClient from "jwks-rsa";
import jwt from "jsonwebtoken";
/**
 * Validate phone number format for Vietnam (+84)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function validatePhoneNumber(phone) {
  try {
    // Parse phone number with Vietnam country code
    const phoneNumber = parsePhoneNumber(phone, "VN");

    // Check if valid and is mobile number
    if (!phoneNumber || !phoneNumber.isValid()) {
      return false;
    }

    // Ensure it's in international format starting with +84
    const formatted = phoneNumber.number;
    return formatted.startsWith("+84");
  } catch (error) {
    return false;
  }
}

/**
 * Format phone number to international format (+84xxx)
 * Converts 0xxx to +84xxx
 * @param {string} phone - Phone number to format
 * @returns {string|null} - Formatted phone or null if invalid
 */
export function formatPhoneNumber(phone) {
  try {
    // Remove all spaces and dashes
    let cleaned = phone.replace(/[\s-]/g, "");

    // If starts with 0, replace with +84
    if (cleaned.startsWith("0")) {
      cleaned = "+84" + cleaned.slice(1);
    }

    // If doesn't start with +, assume Vietnam
    if (!cleaned.startsWith("+")) {
      cleaned = "+84" + cleaned;
    }

    // Validate the formatted number
    const phoneNumber = parsePhoneNumber(cleaned, "VN");

    if (!phoneNumber || !phoneNumber.isValid()) {
      return null;
    }

    return phoneNumber.number; // Returns in E.164 format (+84xxxxxxxxx)
  } catch (error) {
    console.error("Error formatting phone number:", error);
    return null;
  }
}

/**
 * Generate a random 6-digit OTP
 * @returns {string} - 6-digit OTP as string
 */
export function generateOTP() {
  // Generate random 6-digit number (100000 to 999999)
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

/**
 * Generate a secure random password for backend use
 * Users won't know this password - it's for Cognito internal use
 * Must meet Cognito password policy:
 * - Minimum 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 * - At least one special character
 * @param {number} length - Length of password (default 16)
 * @returns {string} - Random password
 */
export function generateSecurePassword(length = 16) {
  if (length < 8) {
    length = 8;
  }

  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const allChars = lowercase + uppercase + digits + symbols;

  // Ensure at least one character from each required set
  let password = "";
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += digits[crypto.randomInt(0, digits.length)];
  password += symbols[crypto.randomInt(0, symbols.length)];

  // Fill the rest with random characters from all sets
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  // Shuffle the password to avoid predictable pattern
  password = password
    .split("")
    .sort(() => crypto.randomInt(0, 2) - 0.5)
    .join("");

  return password;
}

/**
 * JWKS client cache (singleton pattern)
 */
let jwksClientCache = null;

/**
 * Get JWKS client for Cognito token verification
 * @param {string} userPoolId - Cognito User Pool ID
 * @param {string} region - AWS Region
 * @returns {object} - JWKS client instance
 */
export function getJWKSClient(userPoolId, region) {
  if (!jwksClientCache) {
    const jwksUri = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

    jwksClientCache = jwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 86400000, // 24 hours
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  return jwksClientCache;
}

/**
 * Get signing key from JWKS
 * @param {object} client - JWKS client
 * @param {string} kid - Key ID from JWT header
 * @returns {Promise<string>} - Public key for verification
 */
function getSigningKey(client, kid) {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        return reject(err);
      }
      const signingKey = key.publicKey || key.rsaPublicKey;
      resolve(signingKey);
    });
  });
}

/**
 * Verify and decode JWT token from Cognito
 * @param {string} token - JWT token to verify
 * @param {string} userPoolId - Cognito User Pool ID
 * @param {string} region - AWS Region
 * @param {string} clientId - Cognito Client ID (optional, for audience validation)
 * @returns {Promise<object>} - Decoded token payload
 */
export async function verifyJWT(token, userPoolId, region, clientId = null) {
  try {
    // Decode token header to get kid (key id)
    const decodedHeader = jwt.decode(token, { complete: true });

    if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
      throw new Error("Invalid token: missing kid in header");
    }

    const kid = decodedHeader.header.kid;

    // Get JWKS client and signing key
    const client = getJWKSClient(userPoolId, region);
    const signingKey = await getSigningKey(client, kid);

    // Verify token
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    const verifyOptions = {
      issuer,
      algorithms: ["RS256"],
    };

    // Add audience check if clientId provided (for id tokens)
    if (clientId) {
      verifyOptions.audience = clientId;
    }

    const decoded = jwt.verify(token, signingKey, verifyOptions);

    return decoded;
  } catch (error) {
    console.error("JWT verification error:", error);
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Extracted token or null
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }

  // Check if it's Bearer token
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Calculate TTL timestamp for DynamoDB
 * @param {number} expirySeconds - Seconds until expiration
 * @returns {number} - Unix timestamp for TTL
 */
export function calculateTTL(expirySeconds) {
  return Math.floor(Date.now() / 1000) + expirySeconds;
}

/**
 * Convert phone number to safe Cognito username
 * Cannot use E.164 format because phone alias is enabled
 * @param {string} phone - Phone number in any format
 * @returns {string} - Sanitized phone for Cognito username (e.g., "user_84xxxxxxxxx")
 */
export function sanitizePhoneForUsername(phone) {
  const formatted = formatPhoneNumber(phone);
  if (!formatted) {
    throw new Error("Invalid phone number");
  }
  // Convert +84xxxxxxxxx to user_84xxxxxxxxx to avoid phone format conflict
  return `user_${formatted.replace("+", "")}`;
}

/**
 * Check if a string is a valid username (for admin)
 * Alphanumeric, underscore, hyphen only. 3-20 chars.
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid
 */
export function validateUsername(username) {
  if (!username || typeof username !== "string") {
    return false;
  }

  // 3-20 characters, alphanumeric + underscore + hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Mask phone number for logging (security)
 * +84987654321 -> +8498****321
 * @param {string} phone - Phone number to mask
 * @returns {string} - Masked phone number
 */
export function maskPhoneNumber(phone) {
  if (!phone || phone.length < 8) {
    return "****";
  }

  const start = phone.slice(0, 5);
  const end = phone.slice(-3);
  return `${start}****${end}`;
}

export default {
  validatePhoneNumber,
  formatPhoneNumber,
  generateOTP,
  generateSecurePassword,
  getJWKSClient,
  verifyJWT,
  extractTokenFromHeader,
  calculateTTL,
  sanitizePhoneForUsername,
  validateUsername,
  maskPhoneNumber,
};

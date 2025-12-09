import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  AdminGetUserCommand,
  AdminAddUserToGroupCommand,
  AdminListGroupsForUserCommand,
  AdminUpdateUserAttributesCommand,
  GlobalSignOutCommand,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { v4 as uuidv4 } from "uuid";
import {
  formatPhoneNumber,
  validatePhoneNumber,
  generateOTP,
  generateSecurePassword,
  sanitizePhoneForUsername,
  calculateTTL,
  verifyJWT,
  maskPhoneNumber,
  validateUsername,
} from "./auth.utils.js";

// Initialize AWS clients
const region = process.env.REGION || "us-east-1";
const cognitoClient = new CognitoIdentityProviderClient({ region });
const snsClient = new SNSClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables - get dynamically to ensure dotenv is loaded
const getEnvVar = (name) => process.env[name];
const USER_POOL_ID = process.env.USER_POOL_ID;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID;
const USER_PROFILES_TABLE_NAME = process.env.USER_PROFILES_TABLE_NAME;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const MAX_OTP_ATTEMPTS = 3;

// ============================================================================
// OTP MANAGEMENT
// ============================================================================

/**
 * Check rate limit for OTP requests
 * Max 3 OTP requests per 10 minutes per phone number
 */
async function checkRateLimit(phoneNumber) {
  const tenMinutesAgo = Math.floor(Date.now() / 1000) - 600;

  // In production, implement proper rate limiting with DynamoDB GSI or ElastiCache
  // For now, we'll just check if there's an active OTP
  try {
    const command = new GetCommand({
      TableName: getEnvVar("OTP_TABLE_NAME"),
      Key: { phoneNumber },
    });

    const result = await docClient.send(command);

    if (result.Item) {
      const createdAt = result.Item.createdAt;
      if (createdAt > tenMinutesAgo) {
        // Check how many times OTP was created in last 10 mins
        // For simplicity, we only allow 1 active OTP at a time
        throw new Error(
          "OTP already sent. Please wait before requesting a new one."
        );
      }
    }

    return true;
  } catch (error) {
    if (error.message.includes("OTP already sent")) {
      throw error;
    }
    console.error("Rate limit check error:", error);
    return true; // Allow on error
  }
}

/**
 * Generate OTP and send via SMS
 */
export async function generateAndSendOTP(phoneNumber) {
  try {
    console.log("🔧 Environment check:");
    console.log("- OTP_TABLE_NAME:", getEnvVar("OTP_TABLE_NAME"));
    console.log("- USER_POOL_ID:", getEnvVar("USER_POOL_ID"));
    console.log("- REGION:", region);
    console.log("- NODE_ENV:", process.env.NODE_ENV);

    if (!getEnvVar("OTP_TABLE_NAME")) {
      throw new Error("OTP_TABLE_NAME environment variable is not set");
    }

    // Validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone || !validatePhoneNumber(formattedPhone)) {
      throw new Error("Invalid phone number format. Use +84xxxxxxxxx");
    }

    // Check rate limit
    await checkRateLimit(formattedPhone);

    // Generate OTP
    const otp = generateOTP();
    const ttl = calculateTTL(OTP_EXPIRY_SECONDS);
    const createdAt = Math.floor(Date.now() / 1000);

    // Store OTP in DynamoDB
    const putCommand = new PutCommand({
      TableName: getEnvVar("OTP_TABLE_NAME"),
      Item: {
        phoneNumber: formattedPhone,
        otp,
        attempts: 0,
        createdAt,
        ttl,
      },
    });

    await docClient.send(putCommand);

    // Send SMS via AWS SNS
    const message = `Your FindNest verification code is: ${otp}. Valid for 5 minutes.`;

    const publishCommand = new PublishCommand({
      PhoneNumber: formattedPhone,
      Message: message,
      MessageAttributes: {
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional", // Transactional SMS for OTP
        },
      },
    });

    // Send SMS via SNS - fail if SMS cannot be sent
    try {
      console.log(
        `📱 Attempting to send SMS to ${maskPhoneNumber(formattedPhone)}`
      );
      console.log(`📝 Message: ${message}`);

      const snsResult = await snsClient.send(publishCommand);
      console.log(
        `✅ SMS sent successfully to ${maskPhoneNumber(
          formattedPhone
        )}. MessageId:`,
        snsResult.MessageId
      );
    } catch (snsError) {
      console.error(
        `❌ Failed to send SMS to ${maskPhoneNumber(formattedPhone)}:`,
        snsError.message
      );
      console.error(
        "SNS Error details:",
        JSON.stringify(
          {
            name: snsError.name,
            message: snsError.message,
            code: snsError.$metadata?.httpStatusCode,
            requestId: snsError.$metadata?.requestId,
            errorCode: snsError.Code,
            errorType: snsError.$fault,
          },
          null,
          2
        )
      );

      // For development: Log the actual OTP so you can test
      if (process.env.NODE_ENV === "development") {
        console.log(
          `🔑 [DEV] OTP for ${maskPhoneNumber(formattedPhone)}: ${otp}`
        );
        // In dev mode, continue even if SMS fails
      } else {
        // In production, throw error if SMS fails
        throw new Error(`SMS delivery failed: ${snsError.message}`);
      }
    }

    console.log(`OTP generated for ${maskPhoneNumber(formattedPhone)}`);

    // Return OTP in response for testing when SNS quota exceeded
    // TODO: Remove this in production when SNS quota is available
    const response = {
      success: true,
      message: "OTP sent successfully",
      expiresIn: OTP_EXPIRY_SECONDS,
      otp: otp, // Included for testing - remove when SNS quota restored
    };

    return response;
  } catch (error) {
    console.error("Error generating and sending OTP:", error);
    throw error;
  }
}

/**
 * Verify OTP and authenticate user
 * Creates user in Cognito if doesn't exist
 */
export async function verifyOTPAndAuthenticate(phoneNumber, otp) {
  try {
    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      throw new Error("Invalid phone number format");
    }

    // Get OTP from DynamoDB
    const getCommand = new GetCommand({
      TableName: getEnvVar("OTP_TABLE_NAME"),
      Key: { phoneNumber: formattedPhone },
    });

    const result = await docClient.send(getCommand);

    if (!result.Item) {
      throw new Error("OTP not found or expired");
    }

    const otpRecord = result.Item;

    // Check if OTP expired
    const now = Math.floor(Date.now() / 1000);
    if (now > otpRecord.ttl) {
      // Delete expired OTP
      await docClient.send(
        new DeleteCommand({
          TableName: getEnvVar("OTP_TABLE_NAME"),
          Key: { phoneNumber: formattedPhone },
        })
      );
      throw new Error("OTP has expired");
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      throw new Error(
        "Maximum OTP attempts exceeded. Please request a new OTP."
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      await docClient.send(
        new UpdateCommand({
          TableName: getEnvVar("OTP_TABLE_NAME"),
          Key: { phoneNumber: formattedPhone },
          UpdateExpression: "SET attempts = attempts + :inc",
          ExpressionAttributeValues: {
            ":inc": 1,
          },
        })
      );

      const remainingAttempts = MAX_OTP_ATTEMPTS - (otpRecord.attempts + 1);
      throw new Error(`Invalid OTP. ${remainingAttempts} attempts remaining.`);
    }

    // OTP is valid - delete it
    await docClient.send(
      new DeleteCommand({
        TableName: getEnvVar("OTP_TABLE_NAME"),
        Key: { phoneNumber: formattedPhone },
      })
    );

    // Check if user exists in Cognito
    const username = sanitizePhoneForUsername(formattedPhone);
    let userExists = false;
    let cognitoUser = null;

    try {
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      });
      cognitoUser = await cognitoClient.send(getUserCommand);
      userExists = true;
    } catch (error) {
      if (error.name !== "UserNotFoundException") {
        throw error;
      }
    }

    // Generate random password for backend use (new password each time)
    const randomPassword = generateSecurePassword();

    // Create user if doesn't exist
    if (!userExists) {
      // Create user in Cognito
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        TemporaryPassword: randomPassword,
        UserAttributes: [
          { Name: "phone_number", Value: formattedPhone },
          { Name: "phone_number_verified", Value: "true" },
        ],
        MessageAction: "SUPPRESS", // Don't send welcome email/SMS
      });

      await cognitoClient.send(createUserCommand);

      // Add user to "Users" group
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        GroupName: "Users",
      });

      await cognitoClient.send(addToGroupCommand);

      console.log(`Created new user: ${maskPhoneNumber(formattedPhone)}`);
    }

    // Always update password (for both new and existing users)
    // This ensures we can authenticate with the new random password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: randomPassword,
      Permanent: true,
    });

    await cognitoClient.send(setPasswordCommand);

    // If user was just created, fetch user info to get sub (userId)
    if (!userExists) {
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      });
      cognitoUser = await cognitoClient.send(getUserCommand);
      console.log(
        "[OTP] New user attributes:",
        JSON.stringify(cognitoUser.UserAttributes)
      );
    }

    // Authenticate user and get tokens
    const authCommand = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: USER_POOL_CLIENT_ID,
      AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: username,
        PASSWORD: randomPassword,
      },
    });

    const authResult = await cognitoClient.send(authCommand);
    console.log("[OTP] Auth result keys:", Object.keys(authResult));
    console.log(
      "[OTP] AuthenticationResult:",
      authResult.AuthenticationResult ? "exists" : "missing"
    );

    // Get userId from cognito user attributes
    const userId = cognitoUser?.UserAttributes?.find(
      (attr) => attr.Name === "sub"
    )?.Value;
    console.log("[OTP] Extracted userId:", userId);
    if (!userId) {
      console.error("[OTP] cognitoUser:", JSON.stringify(cognitoUser));
      throw new Error("Failed to get user ID from Cognito");
    }

    // Create or update user profile in DynamoDB
    const userProfile = await getOrCreateUserProfile({
      userId,
      phoneNumber: formattedPhone,
      cognitoUsername: username,
      userType: "user",
    });

    return {
      ...authResult.AuthenticationResult,
      user: userProfile,
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
}

// ============================================================================
// USER REGISTRATION & EMAIL AUTHENTICATION
// ============================================================================

// ============================================================================
// ADMIN AUTHENTICATION
// ============================================================================

/**
 * Authenticate admin with username and password
 */
export async function authenticateAdmin(username, password) {
  try {
    // Validate username
    if (!validateUsername(username)) {
      throw new Error("Invalid username format");
    }

    if (!password || password.length < 8) {
      throw new Error("Invalid password");
    }

    // Authenticate with Cognito
    const authCommand = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: USER_POOL_CLIENT_ID,
      AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const authResult = await cognitoClient.send(authCommand);

    // Check if user is in Admins group
    const isAdmin = await isUserInAdminGroup(username);

    if (!isAdmin) {
      throw new Error("Unauthorized: User is not an administrator");
    }

    // Get admin profile
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    });

    const cognitoUser = await cognitoClient.send(getUserCommand);
    const userId = cognitoUser.UserAttributes.find(
      (attr) => attr.Name === "sub"
    )?.Value;
    const email = cognitoUser.UserAttributes.find(
      (attr) => attr.Name === "email"
    )?.Value;

    // Get or create admin profile
    const adminProfile = await getOrCreateUserProfile({
      userId,
      email,
      cognitoUsername: username,
      userType: "admin",
    });

    return {
      ...authResult.AuthenticationResult,
      admin: adminProfile,
    };
  } catch (error) {
    console.error("Error authenticating admin:", error);

    // Don't expose detailed error messages for security
    if (
      error.name === "NotAuthorizedException" ||
      error.name === "UserNotFoundException"
    ) {
      throw new Error("Invalid username or password");
    }

    throw error;
  }
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    const command = new InitiateAuthCommand({
      ClientId: USER_POOL_CLIENT_ID,
      AuthFlow: "REFRESH_TOKEN_AUTH",
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const result = await cognitoClient.send(command);

    return result.AuthenticationResult;
  } catch (error) {
    console.error("Error refreshing token:", error);

    if (error.name === "NotAuthorizedException") {
      throw new Error("Invalid or expired refresh token");
    }

    throw error;
  }
}

/**
 * Sign out user globally
 */
export async function signOut(accessToken) {
  try {
    if (!accessToken) {
      throw new Error("Access token is required");
    }

    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    await cognitoClient.send(command);

    return { success: true, message: "Signed out successfully" };
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

// ============================================================================
// USER UTILITIES
// ============================================================================

/**
 * Get user info from token
 */
export async function getUserFromToken(token) {
  try {
    const decoded = await verifyJWT(
      token,
      USER_POOL_ID,
      region,
      USER_POOL_CLIENT_ID
    );
    return decoded;
  } catch (error) {
    console.error("Error getting user from token:", error);
    throw new Error("Invalid or expired token");
  }
}

/**
 * Check if user is in Admins group
 */
export async function isUserInAdminGroup(username) {
  try {
    const command = new AdminListGroupsForUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    });

    const result = await cognitoClient.send(command);

    return (
      result.Groups?.some((group) => group.GroupName === "Admins") || false
    );
  } catch (error) {
    console.error("Error checking admin group:", error);
    return false;
  }
}

/**
 * Get or create user profile in DynamoDB
 */
export async function getOrCreateUserProfile(userData) {
  try {
    const {
      userId,
      phoneNumber,
      email,
      cognitoUsername,
      userType,
      fullName,
      createdBy,
    } = userData;

    // Try to get existing profile
    const getCommand = new GetCommand({
      TableName: USER_PROFILES_TABLE_NAME,
      Key: { userId },
    });

    const result = await docClient.send(getCommand);

    if (result.Item) {
      // Update last login
      const updateCommand = new UpdateCommand({
        TableName: USER_PROFILES_TABLE_NAME,
        Key: { userId },
        UpdateExpression: "SET lastLoginAt = :now",
        ExpressionAttributeValues: {
          ":now": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      });

      const updateResult = await docClient.send(updateCommand);
      return updateResult.Attributes;
    }

    // Create new profile
    const now = new Date().toISOString();
    const profile = {
      userId,
      userType,
      cognitoUsername,
      phoneNumber: phoneNumber || null,
      email: email || null,
      fullName: fullName || null,
      businessName: userData.businessName || null,
      businessAddress: userData.businessAddress || null,
      createdBy: createdBy || null,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    const putCommand = new PutCommand({
      TableName: USER_PROFILES_TABLE_NAME,
      Item: profile,
    });

    await docClient.send(putCommand);

    return profile;
  } catch (error) {
    console.error("Error getting/creating user profile:", error);
    throw error;
  }
}

/**
 * Get user profile by userId
 */
export async function getUserProfile(userId) {
  try {
    const command = new GetCommand({
      TableName: USER_PROFILES_TABLE_NAME,
      Key: { userId },
    });

    const result = await docClient.send(command);

    return result.Item || null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
}

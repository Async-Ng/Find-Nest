#!/usr/bin/env node

/**
 * Seed Admin Script
 *
 * This script creates the first admin user in the system.
 * Run this script AFTER deploying the CDK stack.
 *
 * Usage:
 *   node seed-admin.js
 *
 * Or with environment variables:
 *   USER_POOL_ID=xxx node seed-admin.js
 */

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import * as readline from "readline";
import { promisify } from "util";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const region = process.env.REGION || "us-east-1";
const USER_POOL_ID = process.env.USER_POOL_ID;
const USER_PROFILES_TABLE_NAME = process.env.USER_PROFILES_TABLE_NAME;

// Initialize AWS clients
const cognitoClient = new CognitoIdentityProviderClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = promisify(rl.question).bind(rl);

/**
 * Validate environment variables
 */
function validateEnvironment() {
  if (!USER_POOL_ID) {
    console.error("❌ Error: USER_POOL_ID environment variable is required");
    console.error(
      "   Set it in .env file or export it: export USER_POOL_ID=xxx"
    );
    process.exit(1);
  }

  if (!USER_PROFILES_TABLE_NAME) {
    console.error(
      "❌ Error: USER_PROFILES_TABLE_NAME environment variable is required"
    );
    console.error(
      "   Set it in .env file or export it: export USER_PROFILES_TABLE_NAME=xxx"
    );
    process.exit(1);
  }

  console.log("✅ Environment variables loaded:");
  console.log(`   Region: ${region}`);
  console.log(`   User Pool ID: ${USER_POOL_ID}`);
  console.log(`   User Profiles Table: ${USER_PROFILES_TABLE_NAME}`);
  console.log("");
}

/**
 * Validate username format
 */
function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one digit",
    };
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one special character",
    };
  }
  return { valid: true };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if user exists in Cognito
 */
async function userExists(username) {
  try {
    const command = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    });
    await cognitoClient.send(command);
    return true;
  } catch (error) {
    if (error.name === "UserNotFoundException") {
      return false;
    }
    throw error;
  }
}

/**
 * Create admin user in Cognito
 */
async function createAdminInCognito(username, password, email, fullName) {
  try {
    // Check if user already exists
    if (await userExists(username)) {
      throw new Error(`User '${username}' already exists in Cognito`);
    }

    console.log("📝 Creating admin user in Cognito...");

    // Create user
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      TemporaryPassword: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
      ],
      MessageAction: "SUPPRESS", // Don't send welcome email
    });

    const createResult = await cognitoClient.send(createCommand);
    const userId = createResult.User.Attributes.find(
      (attr) => attr.Name === "sub"
    )?.Value;

    console.log(`   ✅ User created with ID: ${userId}`);

    // Set permanent password
    console.log("🔑 Setting permanent password...");
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: password,
      Permanent: true,
    });

    await cognitoClient.send(setPasswordCommand);
    console.log("   ✅ Password set");

    // Add to Admins group
    console.log("👑 Adding user to Admins group...");
    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: "Admins",
    });

    await cognitoClient.send(addToGroupCommand);
    console.log("   ✅ Added to Admins group");

    return { userId, username };
  } catch (error) {
    console.error("❌ Error creating admin in Cognito:", error.message);
    throw error;
  }
}

/**
 * Create admin profile in DynamoDB
 */
async function createAdminProfile(userId, username, email, fullName) {
  try {
    // Check if profile already exists
    const getCommand = new GetCommand({
      TableName: USER_PROFILES_TABLE_NAME,
      Key: { userId },
    });

    const existing = await docClient.send(getCommand);
    if (existing.Item) {
      console.log("⚠️  Profile already exists in DynamoDB, skipping...");
      return existing.Item;
    }

    console.log("📝 Creating admin profile in DynamoDB...");

    const now = new Date().toISOString();
    const profile = {
      userId,
      userType: "admin",
      cognitoUsername: username,
      email,
      fullName: fullName || username,
      phoneNumber: null,
      createdBy: "seed-script",
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    };

    const putCommand = new PutCommand({
      TableName: USER_PROFILES_TABLE_NAME,
      Item: profile,
    });

    await docClient.send(putCommand);
    console.log("   ✅ Profile created");

    return profile;
  } catch (error) {
    console.error("❌ Error creating admin profile:", error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log("");
  console.log("═══════════════════════════════════════════════");
  console.log("   🔐 SEED ADMIN USER SCRIPT");
  console.log("   Smart Boarding House - Admin Creation");
  console.log("═══════════════════════════════════════════════");
  console.log("");

  // Validate environment
  validateEnvironment();

  try {
    console.log("Please enter the admin user details:");
    console.log("");

    // Get username
    let username;
    while (true) {
      username = await question("Username (3-20 chars, alphanumeric, _, -): ");
      if (validateUsername(username)) {
        break;
      }
      console.log("❌ Invalid username format. Try again.");
    }

    // Get password
    let password;
    while (true) {
      password = await question(
        "Password (min 8 chars, uppercase, lowercase, digit, special char): "
      );
      const validation = validatePassword(password);
      if (validation.valid) {
        break;
      }
      console.log(`❌ ${validation.message}`);
    }

    // Confirm password
    const confirmPassword = await question("Confirm password: ");
    if (password !== confirmPassword) {
      console.log("❌ Passwords do not match. Exiting.");
      process.exit(1);
    }

    // Get email
    let email;
    while (true) {
      email = await question("Email: ");
      if (validateEmail(email)) {
        break;
      }
      console.log("❌ Invalid email format. Try again.");
    }

    // Get full name (optional)
    const fullName = await question(
      "Full Name (optional, press Enter to skip): "
    );

    console.log("");
    console.log("═══════════════════════════════════════════════");
    console.log("Summary:");
    console.log(`  Username:  ${username}`);
    console.log(`  Email:     ${email}`);
    console.log(`  Full Name: ${fullName || "(not provided)"}`);
    console.log("═══════════════════════════════════════════════");
    console.log("");

    const confirm = await question("Create this admin user? (yes/no): ");
    if (confirm.toLowerCase() !== "yes" && confirm.toLowerCase() !== "y") {
      console.log("❌ Operation cancelled.");
      process.exit(0);
    }

    console.log("");
    console.log("🚀 Creating admin user...");
    console.log("");

    // Create admin in Cognito
    const { userId } = await createAdminInCognito(
      username,
      password,
      email,
      fullName
    );

    // Create profile in DynamoDB
    await createAdminProfile(userId, username, email, fullName);

    console.log("");
    console.log("═══════════════════════════════════════════════");
    console.log("✅ ADMIN USER CREATED SUCCESSFULLY!");
    console.log("═══════════════════════════════════════════════");
    console.log("");
    console.log("Admin credentials:");
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
    console.log(`  User ID:  ${userId}`);
    console.log("");
    console.log("⚠️  IMPORTANT: Save these credentials securely!");
    console.log("   You can now login at: POST /auth/admin/login");
    console.log("");
  } catch (error) {
    console.error("");
    console.error("═══════════════════════════════════════════════");
    console.error("❌ ERROR CREATING ADMIN USER");
    console.error("═══════════════════════════════════════════════");
    console.error(error.message);
    console.error("");
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
main();

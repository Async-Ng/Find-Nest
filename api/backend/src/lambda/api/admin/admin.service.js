import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient, AdminEnableUserCommand, AdminDisableUserCommand, AdminGetUserCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand } from "@aws-sdk/client-cognito-identity-provider";

const region = process.env.REGION || "us-east-1";
const cognitoClient = new CognitoIdentityProviderClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = process.env.USER_POOL_ID;
const USER_PROFILES_TABLE_NAME = process.env.USER_PROFILES_TABLE_NAME;
const LISTINGS_TABLE_NAME = process.env.LISTINGS_TABLE_NAME;

/**
 * Get all users with pagination and filters
 */
export async function getAllUsers(filters = {}, page = 1, limit = 20) {
  try {
    const scanParams = {
      TableName: USER_PROFILES_TABLE_NAME,
    };

    // Add filters if provided
    const filterExpressions = [];
    const expressionAttributeValues = {};

    if (filters.userType) {
      filterExpressions.push("userType = :userType");
      expressionAttributeValues[":userType"] = filters.userType;
    }

    if (filterExpressions.length > 0) {
      scanParams.FilterExpression = filterExpressions.join(" AND ");
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
    }

    const { Items } = await docClient.send(new ScanCommand(scanParams));
    const users = Items || [];

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: users.length,
        totalPages: Math.ceil(users.length / limit),
      },
    };
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
}

/**
 * Update user status in Cognito (enable/disable)
 */
export async function updateUserStatus(userId, status) {
  try {
    // Get user profile to get cognito username
    const getCommand = new GetCommand({
      TableName: USER_PROFILES_TABLE_NAME,
      Key: { userId },
    });

    const result = await docClient.send(getCommand);

    if (!result.Item) {
      throw new Error("User not found");
    }

    const cognitoUsername = result.Item.cognitoUsername;

    // Update status in Cognito
    if (status === "ENABLED") {
      const enableCommand = new AdminEnableUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: cognitoUsername,
      });
      await cognitoClient.send(enableCommand);
    } else {
      const disableCommand = new AdminDisableUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: cognitoUsername,
      });
      await cognitoClient.send(disableCommand);
    }

    // Update profile in DynamoDB
    const updateCommand = new UpdateCommand({
      TableName: USER_PROFILES_TABLE_NAME,
      Key: { userId },
      UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    });

    const updateResult = await docClient.send(updateCommand);

    console.log(`User ${userId} status updated to ${status}`);

    return {
      success: true,
      user: updateResult.Attributes,
    };
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
}

/**
 * Get system statistics (US-040)
 */
export async function getSystemStatistics() {
  try {
    // Get user count
    const usersResult = await docClient.send(new ScanCommand({
      TableName: USER_PROFILES_TABLE_NAME,
      Select: 'COUNT'
    }));

    // Get listings count
    const listingsResult = await docClient.send(new ScanCommand({
      TableName: LISTINGS_TABLE_NAME,
      Select: 'COUNT'
    }));

    // Get user counts by type
    const usersByType = await docClient.send(new ScanCommand({
      TableName: USER_PROFILES_TABLE_NAME,
      ProjectionExpression: 'userType'
    }));

    const userTypeCounts = usersByType.Items.reduce((acc, user) => {
      acc[user.userType] = (acc[user.userType] || 0) + 1;
      return acc;
    }, {});

    return {
      totalUsers: usersResult.Count,
      totalListings: listingsResult.Count,
      usersByType: userTypeCounts,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting system statistics:", error);
    throw error;
  }
}

/**
 * Delete violating listing (US-041)
 */
export async function deleteViolatingListing(listingId, reason, adminId) {
  try {
    // Get listing details first
    const getCommand = new GetCommand({
      TableName: LISTINGS_TABLE_NAME,
      Key: { listingId }
    });

    const result = await docClient.send(getCommand);
    if (!result.Item) {
      throw new Error("Listing not found");
    }

    // Delete the listing
    const deleteCommand = new DeleteCommand({
      TableName: LISTINGS_TABLE_NAME,
      Key: { listingId }
    });

    await docClient.send(deleteCommand);

    // Log the action
    console.log(`Admin ${adminId} deleted listing ${listingId} for reason: ${reason}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting violating listing:", error);
    throw error;
  }
}

/**
 * Update user role (US-042)
 */
export async function updateUserRole(userId, newRole, adminId) {
  try {
    // Get user profile
    const getCommand = new GetCommand({
      TableName: USER_PROFILES_TABLE_NAME,
      Key: { userId }
    });

    const result = await docClient.send(getCommand);
    if (!result.Item) {
      throw new Error("User not found");
    }

    const user = result.Item;
    const cognitoUsername = user.cognitoUsername;
    const currentRole = user.userType;

    // Update role in Cognito groups
    const groupMap = {
      'user': 'Users',
      'landlord': 'Landlords', 
      'admin': 'Admins'
    };

    // Remove from current group
    if (currentRole && groupMap[currentRole]) {
      const removeCommand = new AdminRemoveUserFromGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: cognitoUsername,
        GroupName: groupMap[currentRole]
      });
      await cognitoClient.send(removeCommand);
    }

    // Add to new group
    const addCommand = new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: cognitoUsername,
      GroupName: groupMap[newRole]
    });
    await cognitoClient.send(addCommand);

    // Update profile in DynamoDB
    const updateCommand = new UpdateCommand({
      TableName: USER_PROFILES_TABLE_NAME,
      Key: { userId },
      UpdateExpression: "SET userType = :role, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":role": newRole,
        ":updatedAt": new Date().toISOString()
      },
      ReturnValues: "ALL_NEW"
    });

    const updateResult = await docClient.send(updateCommand);

    console.log(`Admin ${adminId} updated user ${userId} role from ${currentRole} to ${newRole}`);

    return {
      success: true,
      user: updateResult.Attributes
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}



// US-051: Enhanced system statistics
export async function getEnhancedSystemStats() {
  try {
    const stats = await getSystemStatistics();
    
    // Add active listings count (US-052)
    const activeListingsResult = await docClient.send(new ScanCommand({
      TableName: LISTINGS_TABLE_NAME,
      FilterExpression: "attribute_not_exists(#status) OR #status <> :expired",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":expired": "EXPIRED" },
      Select: 'COUNT'
    }));

    return {
      ...stats,
      activeListings: activeListingsResult.Count,
      systemHealth: "OK",
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting enhanced system stats:", error);
    throw error;
  }
}
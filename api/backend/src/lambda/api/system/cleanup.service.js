import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });

const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE_NAME;
const USER_POOL_ID = process.env.USER_POOL_ID;

// US-010: Auto-delete inactive accounts (6 months)
export const deleteInactiveAccounts = async () => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoffDate = sixMonthsAgo.toISOString();

    const { Items } = await docClient.send(new ScanCommand({
      TableName: USER_PROFILES_TABLE,
      FilterExpression: "lastLoginAt < :cutoff AND userType = :userType",
      ExpressionAttributeValues: {
        ":cutoff": cutoffDate,
        ":userType": "user" // Only delete regular users, not landlords/admins
      }
    }));

    let deletedCount = 0;
    
    for (const user of Items || []) {
      try {
        // Delete from Cognito
        await cognitoClient.send(new AdminDeleteUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: user.cognitoUsername
        }));

        // Delete from DynamoDB
        await docClient.send(new DeleteCommand({
          TableName: USER_PROFILES_TABLE,
          Key: { userId: user.userId }
        }));

        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete user ${user.userId}:`, error);
      }
    }

    return { success: true, deletedCount };
  } catch (error) {
    console.error("Error deleting inactive accounts:", error);
    throw error;
  }
};

// US-040: Periodic data refresh for area context
export const refreshAreaContext = async (forceAll = false) => {
  try {
    const { getAllListings, updateListing } = await import('../listings/listings.service.js');
    const { enrichListingWithAreaContext } = await import('../ai/ai.service.js');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const listings = await getAllListings();
    let refreshedCount = 0;
    let skippedCount = 0;
    
    console.log(`[Refresh] Processing ${listings.length} listings (forceAll: ${forceAll})`);
    
    for (const listing of listings) {
      // Skip if no location data
      if (!listing.location?.latitude || !listing.location?.longitude) {
        skippedCount++;
        continue;
      }
      
      const needsRefresh = forceAll || 
        !listing.areaContext?.lastEnriched || 
        new Date(listing.areaContext.lastEnriched) < thirtyDaysAgo;
      
      if (needsRefresh) {
        try {
          console.log(`[Refresh] Enriching listing ${listing.listingId} at [${listing.location.latitude}, ${listing.location.longitude}]`);
          const newAreaContext = await enrichListingWithAreaContext(listing);
          if (newAreaContext) {
            console.log(`[Refresh] ✓ Success for ${listing.listingId}:`, JSON.stringify({
              restaurants: newAreaContext.restaurantCount,
              schools: newAreaContext.schoolCount,
              security: newAreaContext.securityScore,
              transport: newAreaContext.transportScore,
              noise: newAreaContext.noiseLevel
            }));
            await updateListing(listing.listingId, { areaContext: newAreaContext });
            refreshedCount++;
          } else {
            console.log(`[Refresh] ✗ No context returned for ${listing.listingId}`);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`[Refresh] ✗ Failed for ${listing.listingId}:`, error.message);
          console.error(error.stack);
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log(`[Refresh] Complete: ${refreshedCount} refreshed, ${skippedCount} skipped`);
    return { success: true, refreshedCount, skippedCount, total: listings.length };
  } catch (error) {
    console.error("Error refreshing area context:", error);
    throw error;
  }
};
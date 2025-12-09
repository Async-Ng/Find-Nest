import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { createNotification } from "./notifications.service.js";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE_NAME;
const LISTINGS_TABLE = process.env.LISTINGS_TABLE_NAME;
const SEARCH_HISTORY_TABLE = process.env.SEARCH_HISTORY_TABLE_NAME;

// US-050: Weekly digest notifications
export const sendWeeklyDigest = async () => {
  try {
    const { Items: users } = await docClient.send(new ScanCommand({
      TableName: USER_PROFILES_TABLE,
      FilterExpression: "userType = :userType",
      ExpressionAttributeValues: { ":userType": "user" }
    }));

    let sentCount = 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const user of users || []) {
      try {
        // Get user's recent search history
        const { Items: searches } = await docClient.send(new QueryCommand({
          TableName: SEARCH_HISTORY_TABLE,
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: { ":userId": user.userId },
          ScanIndexForward: false,
          Limit: 5
        }));

        // Get new listings this week
        const { Items: newListings } = await docClient.send(new ScanCommand({
          TableName: LISTINGS_TABLE,
          FilterExpression: "createdAt > :weekAgo",
          ExpressionAttributeValues: { ":weekAgo": oneWeekAgo.toISOString() },
          Limit: 10
        }));

        // Generate personalized digest
        const digest = generateDigestMessage(user, searches, newListings);
        
        if (digest) {
          await createNotification(
            user.userId,
            'WEEKLY_DIGEST',
            'Tóm tắt tuần này',
            digest,
            { newListingsCount: newListings?.length || 0 }
          );
          sentCount++;
        }

      } catch (userError) {
        console.error(`Error sending digest to user ${user.userId}:`, userError);
      }
    }

    return { success: true, sentCount };
  } catch (error) {
    console.error("Error sending weekly digest:", error);
    throw error;
  }
};

const generateDigestMessage = (user, searches, newListings) => {
  if (!newListings?.length) return null;

  const userName = user.fullName || "bạn";
  const listingCount = newListings.length;
  
  // Get price range from searches
  let priceInfo = "";
  if (searches?.length > 0) {
    const avgPrice = searches
      .filter(s => s.filters?.maxPrice)
      .reduce((sum, s, _, arr) => sum + s.filters.maxPrice / arr.length, 0);
    
    if (avgPrice > 0) {
      const matchingListings = newListings.filter(l => l.price <= avgPrice * 1.2);
      if (matchingListings.length > 0) {
        priceInfo = ` Có ${matchingListings.length} phòng phù hợp với ngân sách của bạn.`;
      }
    }
  }

  return `🏠 Chào ${userName}! Tuần này có ${listingCount} phòng trọ mới được đăng.${priceInfo} Xem ngay tại FindNest!`;
};
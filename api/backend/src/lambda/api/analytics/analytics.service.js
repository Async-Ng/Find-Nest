import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SEARCH_HISTORY_TABLE = process.env.SEARCH_HISTORY_TABLE_NAME;
const LISTINGS_TABLE = process.env.LISTINGS_TABLE_NAME;
const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE_NAME;

// US-044: Log high-traffic areas
export const logAreaAccess = async (district, userId = null) => {
  try {
    console.log(`Area access: ${district} by ${userId || 'anonymous'}`);
    return { success: true };
  } catch (error) {
    console.error("Error logging area access:", error);
    return { success: false };
  }
};

// US-045: Get popular area analytics
export const getPopularAreas = async (days = 7) => {
  try {
    const { Items: searchHistory } = await docClient.send(new ScanCommand({
      TableName: SEARCH_HISTORY_TABLE,
      FilterExpression: "createdAt > :cutoff",
      ExpressionAttributeValues: {
        ":cutoff": new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      }
    }));

    const districtCounts = {};
    searchHistory?.forEach(search => {
      if (search.filters?.district) {
        districtCounts[search.filters.district] = (districtCounts[search.filters.district] || 0) + 1;
      }
    });

    return Object.entries(districtCounts)
      .map(([district, searchCount]) => ({ district, searchCount }))
      .sort((a, b) => b.searchCount - a.searchCount)
      .slice(0, 10);
  } catch (error) {
    console.error("Error getting popular areas:", error);
    throw error;
  }
};

// US-058: Get top AI recommendations
export const getTopAIRecommendations = async (days = 7) => {
  try {
    const { Items: listings } = await docClient.send(new ScanCommand({
      TableName: LISTINGS_TABLE,
      FilterExpression: "createdAt > :cutoff",
      ExpressionAttributeValues: {
        ":cutoff": new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      }
    }));

    return listings
      ?.filter(l => l.relevanceScore)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 10)
      .map(l => ({
        listingId: l.listingId,
        title: l.title,
        district: l.address?.district,
        price: l.price,
        relevanceScore: l.relevanceScore
      })) || [];
  } catch (error) {
    console.error("Error getting top AI recommendations:", error);
    throw error;
  }
};

// US-060: User analytics by area
export const getUserAnalyticsByArea = async () => {
  try {
    const { Items: searchHistory } = await docClient.send(new ScanCommand({
      TableName: SEARCH_HISTORY_TABLE,
      FilterExpression: "createdAt > :cutoff",
      ExpressionAttributeValues: {
        ":cutoff": new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    }));

    const usersByArea = {};
    const userSearchCounts = {};

    searchHistory?.forEach(search => {
      if (search.filters?.district && search.userId) {
        if (!userSearchCounts[search.userId]) {
          userSearchCounts[search.userId] = {};
        }
        const district = search.filters.district;
        userSearchCounts[search.userId][district] = (userSearchCounts[search.userId][district] || 0) + 1;
      }
    });

    Object.entries(userSearchCounts).forEach(([userId, districts]) => {
      const topDistrict = Object.entries(districts)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      if (topDistrict) {
        usersByArea[topDistrict] = (usersByArea[topDistrict] || 0) + 1;
      }
    });

    return Object.entries(usersByArea)
      .map(([district, userCount]) => ({ district, userCount }))
      .sort((a, b) => b.userCount - a.userCount);
  } catch (error) {
    console.error("Error getting user analytics by area:", error);
    throw error;
  }
};
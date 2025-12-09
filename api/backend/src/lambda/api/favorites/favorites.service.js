import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const FAVORITES_TABLE =
  process.env.FAVORITES_TABLE_NAME ||
  process.env.FAVORITES_TABLE ||
  "UserFavorites";

const LISTINGS_TABLE =
  process.env.LISTINGS_TABLE_NAME ||
  process.env.LISTINGS_TABLE ||
  "BoardingHouseListings";

if (!FAVORITES_TABLE) {
  throw new Error("FAVORITES_TABLE_NAME environment variable is not configured");
}

if (!LISTINGS_TABLE) {
  throw new Error("LISTINGS_TABLE_NAME environment variable is not configured");
}

export const addToFavorites = async (userId, listingId) => {
  // Validate listing exists
  const { Item: listing } = await docClient.send(
    new GetCommand({
      TableName: LISTINGS_TABLE,
      Key: { listingId },
    })
  );

  if (!listing) {
    const error = new Error("Listing không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date().toISOString();
  await docClient.send(
    new PutCommand({
      TableName: FAVORITES_TABLE,
      Item: { userId, listingId, createdAt: now },
    })
  );
  return { success: true };
};

export const removeFromFavorites = async (userId, listingId) => {
  // Check if favorite exists
  const { Item: favorite } = await docClient.send(
    new GetCommand({
      TableName: FAVORITES_TABLE,
      Key: { userId, listingId },
    })
  );

  if (!favorite) {
    const error = new Error("Favorite không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  await docClient.send(
    new DeleteCommand({
      TableName: FAVORITES_TABLE,
      Key: { userId, listingId },
    })
  );
  return { success: true };
};

export const getUserFavorites = async (userId) => {
  const { Items } = await docClient.send(
    new QueryCommand({
      TableName: FAVORITES_TABLE,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    })
  );
  return Items || [];
};
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const snsClient = new SNSClient({ region: process.env.REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const FAVORITES_TABLE = process.env.FAVORITES_TABLE_NAME;
const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE_NAME;
const LISTINGS_TABLE = process.env.LISTINGS_TABLE_NAME;
const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE_NAME;

// US-039: Send SMS (only for OTP)
export const sendSMS = async (phoneNumber, message) => {
  try {
    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: {
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional"
        }
      }
    });

    const result = await snsClient.send(command);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
};

// Create notification in database
export const createNotification = async (userId, type, title, message, metadata = {}) => {
  const notificationId = uuidv4();
  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

  await docClient.send(new PutCommand({
    TableName: NOTIFICATIONS_TABLE,
    Item: {
      userId,
      notificationId,
      type,
      title,
      message,
      metadata,
      isRead: false,
      createdAt: now,
      ttl
    }
  }));

  return { notificationId, createdAt: now };
};

// Get user notifications
export const getUserNotifications = async (userId, limit = 20) => {
  const { Items } = await docClient.send(new QueryCommand({
    TableName: NOTIFICATIONS_TABLE,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: { ":userId": userId },
    ScanIndexForward: false,
    Limit: limit
  }));

  return Items || [];
};

// Mark notification as read
export const markAsRead = async (userId, notificationId) => {
  await docClient.send(new UpdateCommand({
    TableName: NOTIFICATIONS_TABLE,
    Key: { userId, notificationId },
    UpdateExpression: "SET isRead = :true",
    ExpressionAttributeValues: { ":true": true }
  }));
};

// Mark all as read
export const markAllAsRead = async (userId) => {
  const notifications = await getUserNotifications(userId, 100);
  
  await Promise.all(
    notifications.map(n => markAsRead(userId, n.notificationId))
  );
};

// US-037: Notify users when their saved listings change
export const notifyListingChange = async (listingId, changeType, oldData, newData) => {
  try {
    // Get users who favorited this listing
    const favoritesResult = await docClient.send(new QueryCommand({
      TableName: FAVORITES_TABLE,
      KeyConditionExpression: "listingId = :listingId",
      ExpressionAttributeValues: { ":listingId": listingId }
    }));

    if (!favoritesResult.Items?.length) return { success: true, notified: 0 };

    let notificationCount = 0;
    
    for (const favorite of favoritesResult.Items) {
      try {
        let title = "";
        let message = "";

        if (changeType === "PRICE_CHANGE") {
          title = "Thay đổi giá phòng";
          message = `Phòng "${newData.title}" đã thay đổi giá từ ${oldData.price?.toLocaleString()} VND thành ${newData.price?.toLocaleString()} VND.`;
        } else if (changeType === "STATUS_CHANGE") {
          title = "Cập nhật phòng";
          message = `Phòng "${newData.title}" đã cập nhật trạng thái.`;
        }

        if (message) {
          await createNotification(
            favorite.userId,
            'PRICE_CHANGE',
            title,
            message,
            { listingId, oldPrice: oldData.price, newPrice: newData.price }
          );
          notificationCount++;
        }
      } catch (userError) {
        console.error(`Error notifying user ${favorite.userId}:`, userError);
      }
    }

    return { success: true, notified: notificationCount };
  } catch (error) {
    console.error("Error in notifyListingChange:", error);
    throw error;
  }
};

// US-038: Notify landlord when someone favorites their listing
export const notifyLandlordOfInterest = async (listingId, userId) => {
  try {
    const listingResult = await docClient.send(new GetCommand({
      TableName: LISTINGS_TABLE,
      Key: { listingId }
    }));

    if (!listingResult.Item) return { success: false, error: "Listing not found" };

    const listing = listingResult.Item;

    await createNotification(
      listing.ownerId,
      'LANDLORD_INTEREST',
      'Có người quan tâm',
      `Có người quan tâm đến phòng "${listing.title}" của bạn!`,
      { listingId, interestedUserId: userId }
    );

    return { success: true, notified: 1 };
  } catch (error) {
    console.error("Error in notifyLandlordOfInterest:", error);
    throw error;
  }
};
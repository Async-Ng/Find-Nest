import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const SUPPORT_REQUESTS_TABLE = process.env.SUPPORT_REQUESTS_TABLE_NAME;

export const createSupportRequest = async (userId, requestData) => {
  const requestId = uuidv4();
  const now = new Date().toISOString();

  const request = {
    requestId,
    userId,
    type: requestData.type || "GENERAL",
    subject: requestData.subject,
    message: requestData.message,
    status: requestData.type === "FEEDBACK" ? "RECEIVED" : "PENDING",
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: SUPPORT_REQUESTS_TABLE,
      Item: request,
    })
  );

  return request;
};

export const getAllSupportRequests = async () => {
  const { Items } = await docClient.send(
    new ScanCommand({
      TableName: SUPPORT_REQUESTS_TABLE,
    })
  );
  return Items || [];
};

export const updateRequestStatus = async (
  requestId,
  status,
  adminResponse = null
) => {
  let updateExpression = "SET #status = :status, updatedAt = :updatedAt";
  const expressionAttributeNames = { "#status": "status" };
  const expressionAttributeValues = {
    ":status": status,
    ":updatedAt": new Date().toISOString(),
  };

  if (adminResponse) {
    updateExpression += ", adminResponse = :response";
    expressionAttributeValues[":response"] = adminResponse;
  }

  const { Attributes } = await docClient.send(
    new UpdateCommand({
      TableName: SUPPORT_REQUESTS_TABLE,
      Key: { requestId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return Attributes;
};

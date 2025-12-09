import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const clientConfig = {};
const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);
const PROFILES_TABLE = process.env.USER_PROFILES_TABLE_NAME;

export const getUserProfile = async (userId) => {
  const command = new GetCommand({
    TableName: PROFILES_TABLE,
    Key: { userId },
  });
  const { Item } = await docClient.send(command);
  return Item;
};

export const updateUserProfile = async (userId, profileData) => {
  const now = new Date().toISOString();
  
  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  
  Object.keys(profileData).forEach((key, index) => {
    updateExpressions.push(`#field${index} = :value${index}`);
    expressionAttributeNames[`#field${index}`] = key;
    expressionAttributeValues[`:value${index}`] = profileData[key];
  });
  
  updateExpressions.push(`#updatedAt = :updatedAt`);
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = now;
  
  const command = new UpdateCommand({
    TableName: PROFILES_TABLE,
    Key: { userId },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  });
  
  const result = await docClient.send(command);
  return result.Attributes;
};

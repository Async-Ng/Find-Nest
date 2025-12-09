import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Load environment variables FIRST
  dotenv.config({ path: path.join(__dirname, ".env") });

  console.log("🔧 Loaded environment variables:");
  console.log("Region:", process.env.REGION);
  console.log("DynamoDB Tables:");
  console.log("Listings Table Name:", process.env.LISTINGS_TABLE_NAME);
  console.log("User Profiles Table Name:", process.env.USER_PROFILES_TABLE_NAME);
  console.log("OTP Table Name:", process.env.OTP_TABLE_NAME);
  console.log("Favorites Table Name:", process.env.FAVORITES_TABLE_NAME);
  console.log(
    "Support Requests Table Name:",
    process.env.SUPPORT_REQUESTS_TABLE_NAME
  );
  console.log(
    "Search History Table Name:",
    process.env.SEARCH_HISTORY_TABLE_NAME
  );
  console.log(
    "User Preferences Table Name:",
    process.env.USER_PREFERENCES_TABLE_NAME
  );
  console.log("Cognito:");
  console.log("Cognito User Pool ID:", process.env.USER_POOL_ID);
  console.log("Cognito User Pool Client ID:", process.env.USER_POOL_CLIENT_ID);
  console.log("S3 Buckets:");
  console.log("S3 Images Bucket Name:", process.env.IMAGES_BUCKET_NAME);
  console.log("Amazon Location Service:");
  console.log("Place Index Name:", process.env.PLACE_INDEX_NAME);
  console.log("Map Name:", process.env.MAP_NAME);
  console.log("Route Calculator Name:", process.env.ROUTE_CALCULATOR_NAME);
  console.log("Amazon Bedrock Model ID:", process.env.BEDROCK_MODEL_ID);
  console.log("Development Settings:");
  console.log("Node Environment:", process.env.NODE_ENV);
  console.log("Port:", process.env.PORT);

  // Import app after environment variables are loaded
  const { default: app } = await import("./app.js");

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📖 Swagger UI: http://localhost:${PORT}/`);
  });
}

startServer().catch(console.error);

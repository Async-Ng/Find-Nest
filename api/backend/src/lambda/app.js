import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { fileURLToPath } from "url";
import path from "path";
import listingsRouter from "./api/listings/listings.router.js";
import profilesRouter from "./api/profiles/profiles.router.js";
import authRouter from "./api/auth/auth.router.js";
import adminRouter from "./api/admin/admin.router.js";
import favoritesRouter from "./api/favorites/favorites.router.js";
import imagesRouter from "./api/images/images.router.js";
import locationRouter from "./api/location/location.router.js";
import aiRouter from "./api/ai/ai.router.js";
import supportRouter from "./api/support/support.router.js";
import notificationsRouter from "./api/notifications/notifications.router.js";
import landlordRouter from "./api/landlord/landlord.router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));

const app = express();

// CORS configuration
app.use(
  cors({
    origin: "*", // Configure this properly in production
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (must be before Swagger to avoid conflicts)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "FindNest API is running",
    timestamp: new Date().toISOString(),
  });
});

// Swagger UI - serve static files and setup
app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(swaggerDocument));

// Redirect root to API docs (preserve base path for API Gateway)
app.get("/", (req, res) => {
  const basePath = req.baseUrl || "";
  res.redirect(`${basePath}/api-docs`);
});

// API Routes
app.use("/auth", authRouter);
app.use("/listings", listingsRouter);
app.use("/profile", profilesRouter);
app.use("/admin", adminRouter);
app.use("/favorites", favoritesRouter);
app.use("/images", imagesRouter);
app.use("/location", locationRouter);
app.use("/ai", aiRouter);
app.use("/support", supportRouter);
app.use("/notifications", notificationsRouter);
app.use("/landlord", landlordRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "NotFound",
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      "/",
      "/health",
      "/auth/*",
      "/listings/*",
      "/profile/*",
      "/admin/*",
      "/favorites/*",
      "/images/*",
      "/location/*",
      "/ai/*",
      "/support/*",
      "/notifications/*",
      "/landlord/*",
    ],
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    error: err.name || "ServerError",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;

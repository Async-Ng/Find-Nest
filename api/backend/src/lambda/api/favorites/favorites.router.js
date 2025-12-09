import express from "express";
import { addToFavorites, removeFromFavorites, getUserFavorites } from "./favorites.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = express.Router();

// All favorites routes require authentication
router.post("/:listingId", requireAuth, addToFavorites);
router.delete("/:listingId", requireAuth, removeFromFavorites);
router.get("/", requireAuth, getUserFavorites);

export default router;
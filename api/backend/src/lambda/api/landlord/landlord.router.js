import express from "express";
import { getLandlordMapData } from "./landlord.controller.js";
import { requireLandlordOrAdmin } from "../auth/auth.middleware.js";

const router = express.Router();

// US-042: Landlord map interface for market analysis
router.get("/map-data", requireLandlordOrAdmin, getLandlordMapData);

export default router;
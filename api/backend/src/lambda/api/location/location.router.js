import express from "express";
import { searchPlaces, getPlaceDetails, reverseGeocode, calculateRoute } from "./location.controller.js";

const router = express.Router();

// Public routes - no authentication required
router.get("/search", searchPlaces);           // GET /location/search?q=district1&limit=10
router.get("/reverse", reverseGeocode);        // GET /location/reverse?lat=10.7769&lng=106.7009
router.get("/places/:placeId", getPlaceDetails); // GET /location/places/:placeId
router.post("/routes", calculateRoute);        // POST /location/routes

export default router;
import * as locationService from "./location.service.js";

// Calculate route between two points
export const calculateRoute = async (req, res) => {
  try {
    const { origin, destination } = req.body;
    
    if (!origin || !destination || !Array.isArray(origin) || !Array.isArray(destination)) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Origin and destination must be arrays [longitude, latitude]"
      });
    }
    
    if (origin.length !== 2 || destination.length !== 2) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Coordinates must have exactly 2 elements [longitude, latitude]"
      });
    }

    const route = await locationService.calculateRoute(origin, destination);
    
    res.status(200).json({
      success: true,
      route
    });
  } catch (error) {
    console.error("Calculate route error:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to calculate route"
    });
  }
};

// Search places by text (address, area name)
export const searchPlaces = async (req, res) => {
  try {
    const { q: searchText, limit = 10 } = req.query;
    
    if (!searchText || searchText.trim() === '') {
      return res.status(400).json({
        error: "BadRequest",
        message: "Search text is required"
      });
    }

    const results = await locationService.searchPlacesByText(searchText, parseInt(limit));
    
    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error("Search places error:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to search places"
    });
  }
};

// Get place details by PlaceId
export const getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;
    
    if (!placeId) {
      return res.status(400).json({
        error: "BadRequest",
        message: "PlaceId is required"
      });
    }

    const place = await locationService.getPlaceDetails(placeId);
    
    res.status(200).json({
      success: true,
      place
    });
  } catch (error) {
    console.error("Get place details error:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to get place details"
    });
  }
};

// Reverse geocoding - get address from coordinates
export const reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Latitude and longitude are required"
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Invalid coordinates"
      });
    }

    const address = await locationService.reverseGeocode(latitude, longitude);
    
    res.status(200).json({
      success: true,
      address
    });
  } catch (error) {
    console.error("Reverse geocode error:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to reverse geocode"
    });
  }
};
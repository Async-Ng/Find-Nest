import * as aiService from "./ai.service.js";
import * as listingService from "../listings/listings.service.js";

// US-025 & US-027: Smart room search with natural language
export const smartRoomSearch = async (req, res) => {
  try {
    const { query, userLocation } = req.body;
    const userId = req.user?.userId;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        error: "BadRequest",
        message: "Search query is required"
      });
    }

    // Parse natural language requirements with user context
    const requirements = await aiService.parseNaturalLanguageRequirements(query, userId);
    
    if (!requirements) {
      return res.status(400).json({
        error: "ParseError",
        message: "Could not understand the search requirements"
      });
    }

    // Get all listings
    const allListings = await listingService.getAllListings();
    
    // Get AI recommendations with personalization
    const recommendations = await aiService.getAIRecommendations(
      requirements, 
      allListings, 
      userLocation,
      userId
    );

    // Generate explanation
    const explanation = await aiService.generateRecommendationExplanation(
      requirements, 
      recommendations
    );

    res.status(200).json({
      success: true,
      query,
      parsedRequirements: requirements,
      explanation,
      recommendations,
      totalFound: recommendations.length
    });

  } catch (error) {
    console.error("Smart room search error:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to process smart search"
    });
  }
};


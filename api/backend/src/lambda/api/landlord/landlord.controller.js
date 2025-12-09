import * as listingService from "../listings/listings.service.js";

// US-042: Landlord map view when creating listings
export const getLandlordMapData = async (req, res) => {
  try {
    const { lat, lng, radius = 2 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        error: "BadRequest",
        message: "Latitude and longitude are required"
      });
    }

    const allListings = await listingService.getAllListings();
    const { filterListingsByDistance } = await import("../location/location.service.js");
    
    const nearbyListings = filterListingsByDistance(
      allListings, 
      parseFloat(lat), 
      parseFloat(lng), 
      parseFloat(radius)
    );

    const marketData = {
      totalListings: nearbyListings.length,
      averagePrice: nearbyListings.length > 0 
        ? nearbyListings.reduce((sum, l) => sum + l.price, 0) / nearbyListings.length 
        : 0,
      priceRange: nearbyListings.length > 0 ? {
        min: Math.min(...nearbyListings.map(l => l.price)),
        max: Math.max(...nearbyListings.map(l => l.price))
      } : { min: 0, max: 0 },
      popularAmenities: getPopularAmenities(nearbyListings)
    };

    res.status(200).json({
      success: true,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius: parseFloat(radius),
      nearbyListings: nearbyListings.slice(0, 10),
      marketData
    });
  } catch (error) {
    console.error("Get landlord map data error:", error);
    res.status(500).json({
      error: "ServerError",
      message: "Failed to get map data"
    });
  }
};

const getPopularAmenities = (listings) => {
  const amenityCounts = {};
  
  listings.forEach(listing => {
    listing.amenities?.forEach(amenity => {
      amenityCounts[amenity] = (amenityCounts[amenity] || 0) + 1;
    });
  });

  return Object.entries(amenityCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([amenity, count]) => ({ amenity, count }));
};
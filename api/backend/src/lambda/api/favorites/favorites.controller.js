import * as favoritesService from "./favorites.service.js";

export const addToFavorites = async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.user.userId;

    await favoritesService.addToFavorites(userId, listingId);

    const successResponse = (landlordNotified) => ({
      success: true,
      message: "Added to favorites",
      listingId,
      landlordNotified,
    });

    // US-048: Complete landlord interest notifications
    try {
      const { notifyLandlordOfInterest } = await import(
        "../notifications/notifications.service.js"
      );
      const notificationResult = await notifyLandlordOfInterest(listingId, userId);

      res
        .status(201)
        .json(
          successResponse(
            notificationResult.success && notificationResult.notified > 0
          )
        );
    } catch (notificationError) {
      console.error("Landlord notification failed:", notificationError);
      res.status(201).json(successResponse(false));
    }
  } catch (error) {
    console.error("Add to favorites error:", error);

    // Handle listing not found
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeFromFavorites = async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.user.userId;

    await favoritesService.removeFromFavorites(userId, listingId);
    res.status(200).json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    console.error("Remove from favorites error:", error);

    // Handle favorite not found
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const favorites = await favoritesService.getUserFavorites(userId);
    res.status(200).json(favorites);
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
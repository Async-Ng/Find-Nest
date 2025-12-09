import * as listingService from "./listings.service.js";
import {
  validateCreateListing,
  validateUpdateListing,
} from "./listings.validator.js";

const parseNumberQuery = (...candidates) => {
  for (const value of candidates) {
    if (value === undefined || value === null || value === "") continue;
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const parseStringQuery = (...candidates) => {
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

const parseArrayQuery = (value) => {
  if (!value) return undefined;
  const source = Array.isArray(value) ? value : String(value).split(",");
  return source
    .map((item) => (typeof item === "string" ? item.trim() : item))
    .filter((item) => typeof item === "string" && item.length > 0);
};

// Cập nhật createListing controller
export const createListing = async (req, res) => {
  try {
    // Validate
    const validation = validateCreateListing(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        errors: validation.errors,
      });
    }

    // Lấy ownerId từ JWT token (req.user.userId)
    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res
        .status(401)
        .json({ message: "Không xác định được người dùng" });
    }

    // Thêm ownerId vào data
    const listingData = {
      ...(validation.sanitizedData || {}),
      ownerId,
    };

    const newListing = await listingService.createNewListing(listingData);
    res.status(201).json(newListing);
  } catch (error) {
    console.error("Lỗi Controller - createListing:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const getListings = async (req, res) => {
  try {
    const {
      district,
      ward,
      city,
      lat,
      lng,
      radius,
      view,
      recommendations,
      bounds,
    } = req.query;

    const filters = {};

    const normalizedDistrict = parseStringQuery(district);
    if (normalizedDistrict) filters.district = normalizedDistrict;

    const normalizedWard = parseStringQuery(ward);
    if (normalizedWard) filters.ward = normalizedWard;

    const normalizedCity = parseStringQuery(city);
    if (normalizedCity) filters.city = normalizedCity;

    const minPrice = parseNumberQuery(
      req.query.minPrice,
      req.query.min_price,
      req.query.priceMin,
      req.query.price_from
    );
    if (minPrice !== undefined) filters.minPrice = minPrice;

    const maxPrice = parseNumberQuery(
      req.query.maxPrice,
      req.query.max_price,
      req.query.priceMax,
      req.query.price_to
    );
    if (maxPrice !== undefined) filters.maxPrice = maxPrice;

    const minArea = parseNumberQuery(
      req.query.minArea,
      req.query.min_area,
      req.query.areaMin
    );
    if (minArea !== undefined) filters.minArea = minArea;

    const maxArea = parseNumberQuery(
      req.query.maxArea,
      req.query.max_area,
      req.query.areaMax
    );
    if (maxArea !== undefined) filters.maxArea = maxArea;

    const search = parseStringQuery(
      req.query.search,
      req.query.q,
      req.query.keyword,
      req.query.query
    );
    if (search) filters.search = search;

    const amenities =
      req.query.amenities ?? req.query["amenities[]"] ?? req.query.amenity;
    const amenitiesList = parseArrayQuery(amenities);
    if (amenitiesList?.length) filters.amenities = amenitiesList;

    let allListings = await listingService.getAllListings(filters);

    // US-044: Log high-traffic areas
    if (district) {
      try {
        const { logAreaAccess } = await import("../analytics/analytics.service.js");
        await logAreaAccess(district, req.user?.userId);
      } catch (error) {
        console.error("Failed to log area access:", error);
      }
    }

    // Filter by distance
    if (lat && lng && radius) {
      const { filterListingsByDistance } = await import("../location/location.service.js");
      allListings = filterListingsByDistance(allListings, parseFloat(lat), parseFloat(lng), parseFloat(radius));
    }

    // AI recommendations
    if (recommendations === "true") {
      const { getAIRecommendations } = await import("../ai/ai.service.js");
      const userPreferences = {
        maxPrice: maxPrice ?? undefined,
        minArea: minArea ?? undefined,
        amenities: amenitiesList ?? [],
      };
      allListings = await getAIRecommendations(userPreferences, allListings);
    }

    // Map view
    if (view === "map") {
      if (bounds) {
        const [lat1, lng1, lat2, lng2] = bounds.split(",").map(parseFloat);
        allListings = allListings.filter((listing) => {
          const lat = listing.location?.latitude;
          const lng = listing.location?.longitude;
          return lat && lng && lat >= lat1 && lat <= lat2 && lng >= lng1 && lng <= lng2;
        });
      }
      allListings = allListings.map((listing) => ({
        listingId: listing.listingId,
        title: listing.title,
        price: listing.price,
        location: listing.location,
        images: listing.images?.[0] || null,
      }));
    }

    res.status(200).json(allListings);
  } catch (error) {
    console.error("Lỗi Controller - getListings:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

// get listing by id
export const getListingById = async (req, res) => {
  try {
    const { listingId } = req.params;
    const listing = await listingService.getListingById(listingId);

    if (!listing) {
      return res.status(404).json({ message: "Không tìm thấy listing" });
    }

    res.status(200).json(listing);
  } catch (error) {
    console.error("Lỗi Controller - getListingById:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

// update listing by id
export const updateListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const updateData = req.body;
    // Validate
    const validation = validateUpdateListing(updateData);
    if (!validation.isValid) {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        errors: validation.errors,
      });
    }

    const sanitizedUpdate = validation.sanitizedData || {};
    if (Object.keys(sanitizedUpdate).length === 0) {
      return res.status(400).json({
        message: "Không có trường hợp lệ để cập nhật",
        errors: ["Payload không chứa trường hợp lệ"],
      });
    }
    // Kiểm tra listing có tồn tại không
    const existingListing = await listingService.getListingById(listingId);
    if (!existingListing) {
      return res.status(404).json({ message: "Không tìm thấy listing" });
    }

    // Kiểm tra authorization (ownerId) - validate user exists and check ownership or admin role
    if (!req.user?.userId) {
      return res
        .status(401)
        .json({ message: "Không xác định được người dùng" });
    }

    // Validate ownerId from database is a valid string
    if (!existingListing.ownerId || typeof existingListing.ownerId !== 'string') {
      return res
        .status(500)
        .json({ message: "Dữ liệu listing không hợp lệ" });
    }

    const isOwner = existingListing.ownerId === req.user.userId;
    const isAdmin = req.user.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Không có quyền cập nhật listing này" });
    }

    const updatedListing = await listingService.updateListing(
      listingId,
      sanitizedUpdate
    );

    // US-036: Re-enrich area context if location changed
    if (updateData.location?.latitude && updateData.location?.longitude) {
      const locationChanged = 
        updateData.location.latitude !== existingListing.location?.latitude ||
        updateData.location.longitude !== existingListing.location?.longitude;
      
      if (locationChanged) {
        try {
          const { enrichListingWithAreaContext } = await import("../ai/ai.service.js");
          const areaContext = await enrichListingWithAreaContext(updatedListing);
          if (areaContext) {
            await listingService.updateListing(listingId, { areaContext });
            updatedListing.areaContext = areaContext;
          }
        } catch (error) {
          console.error("Error re-enriching area context:", error);
        }
      }
    }

    // US-037: Notify users if price changed
    if (updateData.price && updateData.price !== existingListing.price) {
      const { notifyListingChange } = await import(
        "../notifications/notifications.service.js"
      );
      notifyListingChange(
        listingId,
        "PRICE_CHANGE",
        existingListing,
        updatedListing
      ).catch(console.error);
    }

    res.status(200).json(updatedListing);
  } catch (error) {
    console.error("Lỗi Controller - updateListing:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

// delete listing by id
export const deleteListing = async (req, res) => {
  try {
    const { listingId } = req.params;

    // Kiểm tra listing có tồn tại không
    const existingListing = await listingService.getListingById(listingId);
    if (!existingListing) {
      return res.status(404).json({ message: "Không tìm thấy listing" });
    }

    // Kiểm tra authorization (ownerId) - validate user exists and check ownership or admin role
    if (!req.user?.userId) {
      return res
        .status(401)
        .json({ message: "Không xác định được người dùng" });
    }

    // Validate ownerId from database is a valid string
    if (!existingListing.ownerId || typeof existingListing.ownerId !== 'string') {
      return res
        .status(500)
        .json({ message: "Dữ liệu listing không hợp lệ" });
    }

    const isOwner = existingListing.ownerId === req.user.userId;
    const isAdmin = req.user.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Không có quyền xóa listing này" });
    }

    await listingService.deleteListing(listingId);
    // 204 No Content - không trả về body
    res.status(204).send();
  } catch (error) {
    console.error("Lỗi Controller - deleteListing:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};





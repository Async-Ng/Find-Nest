import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { calculateDistance } from "../location/location.service.js";
import {
  LocationClient,
  SearchPlaceIndexForPositionCommand,
} from "@aws-sdk/client-location";

const bedrockClient = new BedrockRuntimeClient({ region: process.env.REGION });
const locationClient = new LocationClient({ region: process.env.REGION });
const MODEL_ID =
  process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-sonnet-20240229-v1:0";
const PLACE_INDEX_NAME = process.env.PLACE_INDEX_NAME;

// Validate AI output structure and values
const validateAIOutput = (parsed) => {
  // Check required fields exist
  if (
    !parsed.explicitFilters ||
    !parsed.semanticIntent ||
    !parsed.contextualNeeds ||
    !parsed.aiSummary
  ) {
    return false;
  }

  // Validate price range (500k - 50tr)
  if (parsed.explicitFilters.price) {
    const { min, max } = parsed.explicitFilters.price;
    if (min && (min < 500000 || min > 50000000)) return false;
    if (max && (max < 500000 || max > 50000000)) return false;
    if (min && max && min > max) return false;
  }

  // Validate area (5 - 200m²)
  if (parsed.explicitFilters.area) {
    const { min, max } = parsed.explicitFilters.area;
    if (min && (min < 5 || min > 200)) return false;
    if (max && (max < 5 || max > 200)) return false;
    if (min && max && min > max) return false;
  }

  // Validate semanticIntent structure
  if (
    !Array.isArray(parsed.semanticIntent.priorities) ||
    !parsed.semanticIntent.lifestyle
  ) {
    return false;
  }

  return true;
};

// AI-powered parsing using Bedrock - Optimized prompt
const parseWithAI = async (userInput, userContext = null) => {
  try {
    const contextInfo = userContext
      ? `

User interests (from favorited rooms): Avg price ${userContext.avgPrice?.toLocaleString()}đ | Districts: ${
          userContext.favoriteDistricts?.join(", ") || "none"
        } | Amenities: ${userContext.favoriteAmenities?.join(", ") || "none"}`
      : "";

    const prompt = `You are an expert Vietnamese room rental assistant. Extract search requirements from natural Vietnamese text. Users write casually without structure - understand their real intent.

Input: "${userInput}"${contextInfo}

UNDERSTAND NATURAL LANGUAGE:
- "khoảng 2-3 triệu thôi" = price: {min: 2000000, max: 3000000}
- "giá sinh viên" = price: {max: 4000000}
- "giá hợp lý" = no specific price filter
- "không quá 5 triệu" = price: {max: 5000000}
- "dưới 3 triệu" = price: {max: 3000000}
- "từ 3-5 triệu" = price: {min: 3000000, max: 5000000}

TIME & DISTANCE PATTERNS:
- "trong 20 phút đi xe máy" = maxTravelTime: "20"
- "đi làm thuận tiện" = maxTravelTime: "25"
- "không quá 30 phút" = maxTravelTime: "30"
- "gần trường" = maxTravelTime: "15"
- "thuận tiện đi" = maxTravelTime: "25"

LOCATION INTELLIGENCE:
- "trường FPT" / "đại học FPT" / "FPT" = nearSchool: {school: "Đại học FPT"}
- "Bách Khoa" / "đại học Bách Khoa" = nearSchool: {school: "Đại học Bách Khoa"}
- "công ty ở Thủ Đức" = nearOffice: {office: "Thủ Đức"}
- "làm ở quận 1" = workCommute: {destination: "Quận 1"}
- "Vincom Thủ Đức" = nearLandmark: {landmark: "Vincom Thủ Đức"}
- "khu công nghệ cao" = nearLandmark: {landmark: "Khu Công nghệ cao"}

DISTRICT NORMALIZATION:
- "quận 1" → "Quận 1"
- "quận 2" / "quận 9" / "thủ đức" → "Thành phố Thủ Đức"
- "bình thạnh" → "Quận Bình Thạnh"
- "tân bình" → "Quận Tân Bình"
- "gò vấp" → "Quận Gò Vấp"

AMENITIES DETECTION:
- "wifi" / "wi-fi" / "wifi tốt" → "WiFi"
- "điều hòa" / "máy lạnh" → "Điều hòa"
- "máy giặt" → "Máy giặt"
- "tủ lạnh" → "Tủ lạnh"
- "ban công" → "Ban công"
- "thang máy" → "Thang máy"
- "chỗ để xe" / "để xe" → "Chỗ để xe"
- "bảo vệ" / "bảo vệ 24/7" → "Bảo vệ"
- "wc riêng" / "toilet riêng" → "WC riêng"
- "bếp riêng" / "chỗ nấu ăn" → "Bếp"
- "cửa sổ" / "thoáng mát" → "Cửa sổ"

LIFESTYLE DETECTION:
- "sinh viên" / "em sinh viên" / "học" → "student"
- "đi làm" / "làm việc" / "công ty" → "professional"
- "2 người ở" / "ở chung" → "shared"
- "studio" / "riêng tư" → "private"

CONTEXT UNDERSTANDING:
- "yên tĩnh" / "không ồn" → quietEnvironment: {required: true}
- "an ninh tốt" / "an toàn" → needsSecurity: {level: "high"}
- "gần chợ" / "mua đồ ăn tiện" → nearMarket: {required: true}
- "gần siêu thị" → nearSupermarket: {required: true}
- "gần metro" / "xe bus" → nearTransport: {required: true}
- "có chỗ nấu ăn" → cookingAllowed: {required: true}

EXAMPLES:

Input: "Mình cần tìm phòng trọ gần trường FPT, khoảng 2-3 triệu thôi, có wifi và điều hòa"
Output: {"explicitFilters":{"price":{"min":2000000,"max":3000000},"amenities":["WiFi","Điều hòa"],"city":"Tp Hồ Chí Minh"},"semanticIntent":{"priorities":["location","price","amenities"],"lifestyle":"student"},"contextualNeeds":{"nearSchool":{"required":true,"school":"Đại học FPT"}},"aiSummary":"Sinh viên cần phòng gần FPT, 2-3tr có WiFi điều hòa"}

Input: "Tìm phòng ở quận 1 hoặc gần quận 1, đi làm thuận tiện, giá không quá 5 triệu"
Output: {"explicitFilters":{"district":"Quận 1","price":{"max":5000000},"city":"Tp Hồ Chí Minh"},"semanticIntent":{"priorities":["location","commute","price"],"lifestyle":"professional"},"contextualNeeds":{"workCommute":{"maxTravelTime":"25","destination":"Quận 1"}},"aiSummary":"Người đi làm cần phòng Quận 1 hoặc gần, dưới 5tr"}

Input: "Phòng yên tĩnh, an ninh tốt, gần công ty ở Thủ Đức, đi làm không quá 30 phút"
Output: {"explicitFilters":{"city":"Tp Hồ Chí Minh"},"semanticIntent":{"priorities":["security","quiet","commute"],"lifestyle":"professional"},"contextualNeeds":{"nearOffice":{"required":true,"office":"Thủ Đức"},"workCommute":{"maxTravelTime":"30"},"quietEnvironment":{"required":true},"needsSecurity":{"level":"high"}},"aiSummary":"Người đi làm cần phòng yên tĩnh an toàn gần công ty Thủ Đức"}

Input: "Cần phòng có ban công, máy giặt, gần chợ để mua đồ ăn tiện, giá khoảng 3-4 triệu"
Output: {"explicitFilters":{"price":{"min":3000000,"max":4000000},"amenities":["Ban công","Máy giặt"],"city":"Tp Hồ Chí Minh"},"semanticIntent":{"priorities":["amenities","convenience","price"],"lifestyle":"general"},"contextualNeeds":{"nearMarket":{"required":true}},"aiSummary":"Cần phòng có ban công máy giặt gần chợ, 3-4tr"}

Input: "Phòng cho 2 người ở, có 2 giường, tủ lạnh, máy giặt chung, gần trường"
Output: {"explicitFilters":{"amenities":["Tủ lạnh","Máy giặt"],"city":"Tp Hồ Chí Minh"},"semanticIntent":{"priorities":["shared_living","amenities","location"],"lifestyle":"shared"},"contextualNeeds":{"nearSchool":{"required":true,"school":"gần trường"},"sharedRoom":{"occupants":2,"beds":2}},"aiSummary":"Phòng 2 người có tủ lạnh máy giặt gần trường"}

RETURN ONLY JSON with ALL 4 fields:
- explicitFilters
- semanticIntent  
- contextualNeeds
- aiSummary

Extract from: "${userInput}"`;

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const aiText = responseBody.content[0].text;

    // Extract and parse JSON safely
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("⚠️ No JSON found in AI response");
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.warn("⚠️ Invalid JSON from AI:", parseError.message);
      return null;
    }

    // Validate structure
    if (!validateAIOutput(parsed)) {
      console.warn("⚠️ AI output validation failed");
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Bedrock AI error:", error);
    return null;
  }
};

// Rule-based fallback with enhanced semantic understanding
const parseWithRules = (userInput) => {
  const query = userInput.toLowerCase();

  // Price parsing
  let maxPrice = null;
  let minPrice = null;
  const priceRangeMatch = query.match(/từ\s*(\d+)\s*[-đến]*\s*(\d+)\s*triệu/);
  if (priceRangeMatch) {
    minPrice = parseInt(priceRangeMatch[1]) * 1000000;
    maxPrice = parseInt(priceRangeMatch[2]) * 1000000;
  } else {
    const maxPriceMatch = query.match(/dưới\s*(\d+)\s*triệu/);
    if (maxPriceMatch) maxPrice = parseInt(maxPriceMatch[1]) * 1000000;

    const minPriceMatch = query.match(/trên\s*(\d+)\s*triệu/);
    if (minPriceMatch) minPrice = parseInt(minPriceMatch[1]) * 1000000;

    if (!maxPrice && !minPrice) {
      const singlePriceMatch = query.match(/(\d+)\s*triệu/);
      if (singlePriceMatch) maxPrice = parseInt(singlePriceMatch[1]) * 1000000;
    }
  }

  // Area parsing
  let minArea = null;
  const areaMatch = query.match(/(\d+)\s*m/);
  if (areaMatch) minArea = parseInt(areaMatch[1]);

  // Amenities extraction
  const amenities = [];
  const amenityKeywords = [
    "wifi",
    "wi-fi",
    "điều hòa",
    "tủ lạnh",
    "máy giặt",
    "ban công",
    "thang máy",
    "bảo vệ",
    "giường",
    "tủ",
    "bàn ghế",
    "bếp",
    "wc riêng",
    "cửa sổ",
  ];
  amenityKeywords.forEach((keyword) => {
    if (query.includes(keyword)) {
      amenities.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  });

  return {
    explicitFilters: {
      price: { min: minPrice, max: maxPrice },
      area: { min: minArea, max: null },
      city: null,
      district: null,
      amenities,
    },
    semanticIntent: {
      priorities: [],
      lifestyle: "unknown",
    },
    contextualNeeds: {
      semanticCriteria: {
        security:
          query.includes("an ninh") ||
          query.includes("bảo vệ") ||
          query.includes("an toàn") ||
          query.includes("không lo trộm") ||
          query.includes("dân cư đông") ||
          query.includes("đèn đường"),

        foodAndDining:
          query.includes("ăn uống") ||
          query.includes("quán ăn") ||
          query.includes("mua đồ ăn") ||
          query.includes("tiện mua") ||
          query.includes("gần chợ") ||
          query.includes("siêu thị"),

        education:
          query.includes("trường") ||
          query.includes("học") ||
          query.includes("đại học") ||
          query.includes("sinh viên"),

        transportation:
          query.includes("đi làm") ||
          query.includes("giao thông") ||
          query.includes("gần công ty") ||
          query.includes("thuận tiện đi") ||
          query.includes("xe bus") ||
          query.includes("metro"),

        entertainment:
          query.includes("giải trí") ||
          query.includes("mua sắm") ||
          query.includes("trung tâm thương mại") ||
          query.includes("rạp phim"),

        quietArea:
          query.includes("yên tĩnh") ||
          query.includes("tĩnh lặng") ||
          query.includes("ít ồn") ||
          query.includes("không ồn") ||
          query.includes("xa đường"),

        businessArea:
          query.includes("trung tâm") ||
          query.includes("văn phòng") ||
          query.includes("cbd") ||
          query.includes("sầm uất"),
      },
    },
    aiSummary: "Tìm phòng trọ phù hợp",
  };
};

// Extract user interests from favorited listings
const extractUserInterests = async (userId) => {
  if (!userId) return null;

  try {
    const { getUserProfile } = await import("../profiles/profiles.service.js");
    const { getUserFavorites } = await import(
      "../favorites/favorites.service.js"
    );
    const { getAllListings } = await import("../listings/listings.service.js");

    const [profile, favorites, allListings] = await Promise.all([
      getUserProfile(userId),
      getUserFavorites(userId),
      getAllListings(),
    ]);

    if (!favorites?.length) return null;

    const favoriteListings = allListings.filter((l) =>
      favorites.some((f) => f.listingId === l.listingId)
    );

    const avgPrice =
      favoriteListings.reduce((sum, l) => sum + l.price, 0) /
      favoriteListings.length;
    const districts = [
      ...new Set(
        favoriteListings.map((l) => l.address?.district).filter(Boolean)
      ),
    ];
    const amenities = [
      ...new Set(favoriteListings.flatMap((l) => l.amenities || [])),
    ];

    return {
      avgPrice: Math.round(avgPrice),
      favoriteDistricts: districts,
      favoriteAmenities: amenities,
      lifestyle: profile?.userType === "user" ? "renter" : profile?.userType,
    };
  } catch (error) {
    console.error("Error extracting user context:", error);
    return null;
  }
};

// US-031, US-032: Enhanced natural language parsing with AI
export const parseNaturalLanguageRequirements = async (
  userInput,
  userId = null
) => {
  try {
    const userContext = await extractUserInterests(userId);
    const aiResult = await parseWithAI(userInput, userContext);

    if (aiResult) {
      return aiResult;
    }

    return parseWithRules(userInput);
  } catch (error) {
    console.error("Error parsing:", error);
    return parseWithRules(userInput);
  }
};

// US-026, US-028, US-034: AI-powered smart recommendations
export const getAIRecommendations = async (
  requirements,
  allListings,
  userLocation = null,
  userId = null
) => {
  try {
    // Auto-detect city from userLocation if not specified
    if (
      userLocation?.latitude &&
      userLocation?.longitude &&
      !requirements.explicitFilters.city
    ) {
      try {
        const { reverseGeocode } = await import(
          "../location/location.service.js"
        );
        const address = await reverseGeocode(
          userLocation.latitude,
          userLocation.longitude
        );
        if (address?.city) {
          requirements.explicitFilters.city = address.city;
        } else {
        }
      } catch (error) {
        console.error("❌ Error detecting city:", error.message);
      }
    }

    // Extract work location from contextual needs (check both contextualNeeds and explicitFilters)
    let workLocation = null;
    const officeName =
      requirements.contextualNeeds?.nearOffice?.office ||
      requirements.contextualNeeds?.nearSchool?.school ||
      requirements.contextualNeeds?.nearLandmark?.landmark ||
      requirements.explicitFilters?.nearLandmark?.landmark ||
      requirements.contextualNeeds?.proximityToSchool?.institution;

    if (officeName) {
      try {
        const { searchPlacesByText } = await import(
          "../location/location.service.js"
        );
        const userCity = requirements.explicitFilters.city;

        const searchQuery = userCity ? `${officeName} ${userCity}` : officeName;

        const places = await searchPlacesByText(searchQuery, 5);

        if (places.length === 0) {
          // Continue without work location filter
        } else {
          // Find closest place to user location
          let selectedPlace = places[0];
          if (userLocation && places.length > 1) {
            let minDistance = Infinity;
            places.forEach((place) => {
              const dist = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                place.coordinates.latitude,
                place.coordinates.longitude
              );
              if (dist < minDistance) {
                minDistance = dist;
                selectedPlace = place;
              }
            });
          }

          workLocation = {
            latitude: selectedPlace.coordinates.latitude,
            longitude: selectedPlace.coordinates.longitude,
          };
        }
      } catch (error) {
        console.error("❌ Error finding office location:", error.message);
      }
    }

    // District mapping for HCM (Quận 2, 9, Thủ Đức merged into Thành phố Thủ Đức)
    const districtMapping = {
      "Quận 2": "Thành phố Thủ Đức",
      "Quận 9": "Thành phố Thủ Đức",
      "Quận Thủ Đức": "Thành phố Thủ Đức",
      "Huyện Thủ Đức": "Thành phố Thủ Đức",
      "Thủ Đức": "Thành phố Thủ Đức",
    };

    // Apply district mapping
    if (requirements.explicitFilters.district) {
      const mappedDistrict =
        districtMapping[requirements.explicitFilters.district];
      if (mappedDistrict) {
        requirements.explicitFilters.district = mappedDistrict;
      }
    }

    // Basic filtering with explicit filters only
    let filteredListings = allListings.filter((listing) => {
      const filters = requirements.explicitFilters || {};

      // Price filtering - MUST match
      if (filters.price?.max && listing.price > filters.price.max) return false;
      if (filters.price?.min && listing.price < filters.price.min) return false;

      // Area filtering
      if (filters.area?.min && listing.area < filters.area.min) return false;
      if (filters.area?.max && listing.area > filters.area.max) return false;

      // City filter - exact match after normalization
      if (filters.city) {
        const normalizeCity = (city) => {
          if (!city) return "";
          return city
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/ồ/g, "o")
            .replace(/à|á|ạ|ả|ã|ă|ằ|ắ|ặ|ẳ|ẵ|â|ầ|ấ|ậ|ẩ|ẫ/g, "a")
            .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
            .replace(/ì|í|ị|ỉ|ĩ/g, "i")
            .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
            .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
            .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
            .replace(/đ/g, "d");
        };

        const filterCity = normalizeCity(filters.city);
        const listingCity = normalizeCity(listing.address?.city);

        if (filterCity && listingCity && filterCity !== listingCity)
          return false;
      }

      if (filters.district && listing.address?.district !== filters.district)
        return false;

      // Amenities filtering - ALL required amenities MUST be present
      if (filters.amenities?.length) {
        if (!listing.amenities?.length) return false;
        const listingAmenities = listing.amenities.map((a) => a.toLowerCase());
        const hasAllAmenities = filters.amenities.every((required) =>
          listingAmenities.some((a) => a.includes(required.toLowerCase()))
        );
        if (!hasAllAmenities) return false;
      }

      return true;
    });

    // US-033: Enrich listings with area context if not already done
    filteredListings = await Promise.all(
      filteredListings.map(async (listing) => {
        if (!listing.areaContext) {
          listing.areaContext = await enrichListingWithAreaContext(listing);
        }
        return listing;
      })
    );

    // US-030: Add distance-based filtering if work location provided
    const effectiveWorkLocation = workLocation || requirements.workLocation;
    if (effectiveWorkLocation?.latitude && effectiveWorkLocation?.longitude) {
      const maxDistanceStr =
        requirements.contextualNeeds?.workCommute?.maxDistance;
      const maxTravelTimeStr =
        requirements.contextualNeeds?.workCommute?.maxTravelTime;

      // For landmarks, use stricter distance (3km max)
      const isLandmarkSearch =
        requirements.contextualNeeds?.nearLandmark ||
        requirements.explicitFilters?.nearLandmark;
      let maxDistance = isLandmarkSearch ? 3 : 5; // stricter for landmarks
      let maxTravelTime = isLandmarkSearch ? 900 : 1800; // 15min for landmarks, 30min for work

      if (maxDistanceStr) {
        const parsed = parseFloat(maxDistanceStr.replace(/[^0-9.]/g, ""));
        if (!isNaN(parsed)) maxDistance = parsed;
      }

      if (maxTravelTimeStr) {
        const parsed = parseFloat(maxTravelTimeStr.replace(/[^0-9.]/g, ""));
        if (!isNaN(parsed)) maxTravelTime = parsed * 60; // convert minutes to seconds
      }

      console.log(
        `[Filter] ${
          isLandmarkSearch ? "Landmark" : "Work location"
        } filter: maxDistance=${maxDistance}km, maxTravelTime=${
          maxTravelTime / 60
        }min`
      );

      // Calculate route for each listing to get accurate travel time
      const { calculateRoute } = await import(
        "../location/location.service.js"
      );

      const validatedListings = [];
      for (const listing of filteredListings) {
        if (!listing.location?.latitude || !listing.location?.longitude) {
          continue;
        }

        try {
          const route = await calculateRoute(
            [listing.location.longitude, listing.location.latitude],
            [effectiveWorkLocation.longitude, effectiveWorkLocation.latitude]
          );

          // Check both distance and travel time constraints
          const withinDistance = route.distance <= maxDistance;
          const withinTime = route.duration <= maxTravelTime;

          if (withinDistance && withinTime) {
            listing.distanceToWork = route.distance;
            listing.durationToWork = route.duration;
            validatedListings.push(listing);
            console.log(
              `[Filter] ✓ ${listing.title}: ${route.distance.toFixed(
                2
              )}km, ${Math.round(route.duration / 60)}min from ${
                isLandmarkSearch ? "landmark" : "work location"
              }`
            );
          } else {
            console.log(
              `[Filter] ✗ ${listing.title}: ${route.distance.toFixed(
                2
              )}km (>${maxDistance}km) or ${Math.round(
                route.duration / 60
              )}min (>${maxTravelTime / 60}min) from ${
                isLandmarkSearch ? "landmark" : "work location"
              }`
            );
          }
        } catch (error) {
          console.error(
            `[Filter] Route error for ${listing.title}:`,
            error.message
          );
          // Skip listings with route calculation errors
        }
      }

      filteredListings = validatedListings;
      console.log(
        `[Filter] ${filteredListings.length} listings passed ${
          isLandmarkSearch ? "landmark proximity" : "travel time"
        } validation`
      );
    }

    // US-030: Add distance from user location if provided
    if (userLocation?.latitude && userLocation?.longitude) {
      filteredListings = filteredListings.map((listing) => {
        if (listing.location?.latitude && listing.location?.longitude) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            listing.location.latitude,
            listing.location.longitude
          );
          return { ...listing, distanceFromUser: distance };
        }
        return listing;
      });
    }

    // Get user context for personalized scoring
    const userContext = await extractUserInterests(userId);

    // AI-powered dynamic scoring based on contextual needs
    const scoredListings = await Promise.all(
      filteredListings.map(async (listing) => {
        const score = await calculateAIScore(
          listing,
          requirements,
          userLocation,
          userContext
        );
        return { ...listing, relevanceScore: score };
      })
    );

    // Sort by relevance score (highest first) and limit results
    let finalListings = scoredListings
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20); // Increase to 20 for better selection after validation

    // Final validation with location service
    finalListings = await validateListingsWithLocation(
      finalListings,
      requirements,
      effectiveWorkLocation
    );

    // Ensure we have at least some results, but prioritize quality
    if (finalListings.length === 0 && scoredListings.length > 0) {
      console.log(
        "[AI Recommendations] No listings passed strict validation, relaxing constraints..."
      );
      // Return top 3 with relaxed validation for user feedback
      finalListings = scoredListings.slice(0, 3);
    }

    // Final limit to top 10 results
    return finalListings.slice(0, 10);
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    // Fallback to simple filtering
    return allListings
      .filter(
        (listing) =>
          !requirements.maxPrice || listing.price <= requirements.maxPrice
      )
      .slice(0, 5);
  }
};

// Calculate AI-powered relevance score
const calculateAIScore = async (
  listing,
  requirements,
  userLocation,
  userContext = null
) => {
  let score = 0;
  const filters = requirements.explicitFilters || {};
  const contextual = requirements.contextualNeeds || {};
  const semantic = requirements.semanticIntent || {};

  // Personalization boost based on user favorites
  if (userContext) {
    // Price similarity to user's favorites
    if (userContext.avgPrice && listing.price) {
      const priceDiff =
        Math.abs(listing.price - userContext.avgPrice) / userContext.avgPrice;
      score +=
        priceDiff < 0.1 ? 15 : priceDiff < 0.2 ? 10 : priceDiff < 0.3 ? 5 : 0;
    }

    // District match with favorites
    if (userContext.favoriteDistricts?.includes(listing.address?.district)) {
      score += 20;
    }

    // Amenities match with favorites
    if (userContext.favoriteAmenities?.length && listing.amenities) {
      const matchCount = listing.amenities.filter((a) =>
        userContext.favoriteAmenities.some(
          (fa) => fa.toLowerCase() === a.toLowerCase()
        )
      ).length;
      score += matchCount * 3;
    }
  }

  // Price scoring
  if (filters.price?.max && listing.price) {
    const ratio = listing.price / filters.price.max;
    score += ratio <= 0.8 ? 20 : ratio <= 1.0 ? 10 : 0;
  }

  // Amenities matching
  if (filters.amenities?.length && listing.amenities) {
    const matched = filters.amenities.filter((req) =>
      listing.amenities.some((a) => a.toLowerCase().includes(req.toLowerCase()))
    ).length;
    score += matched * 5;
  }

  // Distance and travel time scoring (CRITICAL for commute requirements)
  if (listing.distanceToWork !== undefined) {
    score +=
      listing.distanceToWork <= 2
        ? 30
        : listing.distanceToWork <= 5
        ? 20
        : listing.distanceToWork <= 10
        ? 10
        : 0;
  }

  // Travel time scoring (most important for commute)
  if (listing.durationToWork !== undefined) {
    const minutes = listing.durationToWork / 60;
    if (minutes <= 15) score += 40;
    else if (minutes <= 25) score += 30;
    else if (minutes <= 35) score += 15;
    else score += 0;
  }

  if (listing.distanceFromUser !== undefined) {
    score +=
      listing.distanceFromUser <= 1
        ? 10
        : listing.distanceFromUser <= 3
        ? 5
        : 0;
  }

  // Dynamic contextual scoring
  if (listing.areaContext) {
    const ctx = listing.areaContext;

    // Score based on any contextual need dynamically
    Object.entries(contextual).forEach(([key, value]) => {
      // Security scoring
      if (
        key.includes("security") ||
        key.includes("Security") ||
        key.includes("needsSecurity")
      ) {
        const level = value?.level || value?.importance || "medium";
        const weight = level === "high" ? 25 : level === "medium" ? 15 : 10;
        if (ctx.securityScore >= 8) score += weight;
        else if (ctx.securityScore >= 6) score += weight * 0.6;
        else if (ctx.securityScore >= 4) score += weight * 0.3;
      }

      // Food & Dining scoring
      if (
        key.includes("food") ||
        key.includes("dining") ||
        key.includes("Food") ||
        key.includes("foodOptions")
      ) {
        if (ctx.restaurantCount >= 15) score += 20;
        else if (ctx.restaurantCount >= 10) score += 15;
        else if (ctx.restaurantCount >= 5) score += 10;
        else if (ctx.restaurantCount >= 2) score += 5;
      }

      // Quiet area scoring
      if (
        key.includes("quiet") ||
        key.includes("Quiet") ||
        key.includes("quietEnvironment") ||
        key.includes("awayFromStreet")
      ) {
        if (ctx.noiseLevel <= 2) score += 20;
        else if (ctx.noiseLevel <= 4) score += 12;
        else if (ctx.noiseLevel <= 6) score += 6;
      }

      // Transportation scoring
      if (
        key.includes("transport") ||
        key.includes("commute") ||
        key.includes("workCommute")
      ) {
        if (ctx.transportScore >= 8) score += 18;
        else if (ctx.transportScore >= 5) score += 12;
        else if (ctx.transportScore >= 3) score += 6;
      }

      // Education/School scoring
      if (
        key.includes("education") ||
        key.includes("school") ||
        key.includes("university") ||
        key.includes("nearSchool")
      ) {
        if (ctx.schoolCount >= 3) score += 20;
        else if (ctx.schoolCount >= 1) score += 15;
        else if (ctx.schoolCount === 0) score += 0;
      }

      // Business area scoring
      if (
        key.includes("office") ||
        key.includes("business") ||
        key.includes("nearOffice")
      ) {
        if (ctx.businessScore >= 8) score += 18;
        else if (ctx.businessScore >= 5) score += 12;
        else if (ctx.businessScore >= 2) score += 6;
      }

      // Entertainment/Shopping scoring
      if (
        key.includes("entertainment") ||
        key.includes("shopping") ||
        key.includes("nearShoppingMall")
      ) {
        if (ctx.entertainmentCount >= 5) score += 15;
        else if (ctx.entertainmentCount >= 2) score += 10;
        else if (ctx.entertainmentCount >= 1) score += 5;
      }
    });
  }

  // Penalty for wrong city/region
  if (requirements.explicitFilters?.city) {
    const normalizeCity = (city) => {
      if (!city) return "";
      return city
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/ồ/g, "o")
        .replace(/à|á|ạ|ả|ã|ă|ằ|ắ|ặ|ẳ|ẵ|â|ầ|ấ|ậ|ẩ|ẫ/g, "a")
        .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
        .replace(/ì|í|ị|ỉ|ĩ/g, "i")
        .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
        .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
        .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
        .replace(/đ/g, "d");
    };

    const filterCity = normalizeCity(requirements.explicitFilters.city);
    const listingCity = normalizeCity(listing.address?.city);

    if (filterCity && listingCity && filterCity !== listingCity) {
      score -= 100; // Heavy penalty for wrong city
    }
  }

  return Math.round(score);
};

// US-025, US-035: AI-powered explanation generation
export const generateRecommendationExplanation = async (
  requirements,
  recommendations
) => {
  try {
    const summary = requirements.aiSummary || "Tìm phòng trọ phù hợp";
    const contextual = requirements.contextualNeeds || {};
    const priorities = requirements.semanticIntent?.priorities || [];

    const prompt = `Bạn là trợ lý FindNest. Giải thích kết quả tìm phòng bằng tiếng Việt thân thiện.

Yêu cầu của khách: "${summary}"

Ưu tiên: ${priorities.join(", ") || "Không xác định"}

Tìm được ${recommendations.length} phòng phù hợp.

Top 3 phòng tốt nhất:
${recommendations
  .slice(0, 3)
  .map(
    (r, i) =>
      `${i + 1}. ${
        r.title
      } - ${r.price.toLocaleString()} VND (điểm phù hợp: ${Math.round(
        r.relevanceScore
      )})`
  )
  .join("\n")}

Viết 2-3 câu giải thích ngắn gọn tại sao những phòng này phù hợp với yêu cầu.`;

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 300,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.content[0].text.trim();
  } catch (error) {
    console.error("AI explanation error:", error);

    const criteria = requirements.semanticCriteria || {};
    const descriptions = [];
    if (criteria.security) descriptions.push("khu vực an ninh cao");
    if (criteria.foodAndDining) descriptions.push("nhiều chỗ ăn uống");
    if (criteria.transportation) descriptions.push("thuận tiện đi làm");

    const summary = requirements.aiSummary || "yêu cầu của bạn";
    return `Dựa trên ${summary}, chúng tôi đã tìm thấy ${recommendations.length} phòng trọ phù hợp. Các phòng được xếp hạng theo mức độ phù hợp với nhu cầu của bạn.`;
  }
};

// US-033, US-036: Enrich listing with area context using Location Service
// Validate listings using location service
const validateListingsWithLocation = async (
  listings,
  requirements,
  workLocation
) => {
  const validatedListings = [];
  const hasDistanceRequirement =
    workLocation?.latitude && workLocation?.longitude;

  console.log(
    `[Validation] Starting validation for ${listings.length} listings (hasDistanceReq: ${hasDistanceRequirement})`
  );

  for (const listing of listings) {
    try {
      // Skip if no location
      if (!listing.location?.latitude || !listing.location?.longitude) {
        console.log(
          `[Validation] ⚠ Listing ${listing.listingId} skipped: no location`
        );
        continue;
      }

      // Validate distance to work location if specified
      if (hasDistanceRequirement) {
        const { calculateRoute } = await import(
          "../location/location.service.js"
        );

        try {
          const route = await calculateRoute(
            [listing.location.longitude, listing.location.latitude],
            [workLocation.longitude, workLocation.latitude]
          );

          const maxDistance =
            parseFloat(
              requirements.contextualNeeds?.workCommute?.maxDistance?.replace(
                /[^0-9.]/g,
                ""
              )
            ) || 5;

          // Reject if exceeds distance requirement
          if (route.distance > maxDistance) {
            console.log(
              `[Validation] ✗ Listing ${
                listing.listingId
              } rejected: ${route.distance.toFixed(2)}km > ${maxDistance}km`
            );
            continue;
          }

          // Update with accurate route data
          listing.distanceToWork = route.distance;
          listing.durationToWork = route.duration;
          console.log(
            `[Validation] ✓ Listing ${
              listing.listingId
            } validated: ${route.distance.toFixed(2)}km, ${Math.round(
              route.duration / 60
            )}min`
          );
        } catch (routeError) {
          console.error(
            `[Validation] Route calculation failed for ${listing.listingId}:`,
            routeError.message
          );
          // Keep listing if route calculation fails (don't reject)
        }
      }

      // Reverse geocode to verify address accuracy (only if city filter exists)
      if (requirements.explicitFilters?.city) {
        const { reverseGeocode } = await import(
          "../location/location.service.js"
        );
        try {
          const verifiedAddress = await reverseGeocode(
            listing.location.latitude,
            listing.location.longitude
          );

          const normalizeCity = (city) => {
            if (!city) return "";
            return city
              .toLowerCase()
              .replace(/\s+/g, "")
              .replace(/ồ/g, "o")
              .replace(/à|á|ạ|ả|ã|ă|ằ|ắ|ặ|ẳ|ẵ|â|ầ|ấ|ậ|ẩ|ẫ/g, "a")
              .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
              .replace(/ì|í|ị|ỉ|ĩ/g, "i")
              .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
              .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
              .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
              .replace(/đ/g, "d");
          };

          const requiredCity = normalizeCity(requirements.explicitFilters.city);
          const verifiedCity = normalizeCity(verifiedAddress.city);

          if (requiredCity && verifiedCity && requiredCity !== verifiedCity) {
            console.log(
              `[Validation] ✗ Listing ${listing.listingId} rejected: city mismatch (${verifiedAddress.city} != ${requirements.explicitFilters.city})`
            );
            continue;
          }

          // Update with verified address
          listing.verifiedAddress = verifiedAddress;
        } catch (geocodeError) {
          console.error(
            `[Validation] Geocode failed for ${listing.listingId}:`,
            geocodeError.message
          );
          // Don't reject on geocode failure
        }
      }

      // Final validation: check all requirements are met
      const meetsRequirements = validateListingRequirements(
        listing,
        requirements
      );
      if (!meetsRequirements) {
        console.log(
          `[Validation] ✗ Listing ${listing.listingId} rejected: requirements not met`
        );
        continue;
      }

      validatedListings.push(listing);
    } catch (error) {
      console.error(
        `[Validation] Error validating listing ${listing.listingId}:`,
        error.message
      );
    }
  }

  console.log(
    `[Validation] ${validatedListings.length}/${listings.length} listings passed validation`
  );
  return validatedListings;
};

// Validate listing meets all requirements
const validateListingRequirements = (listing, requirements) => {
  const filters = requirements.explicitFilters || {};

  // Price validation
  if (filters.price?.max && listing.price > filters.price.max) return false;
  if (filters.price?.min && listing.price < filters.price.min) return false;

  // Area validation
  if (filters.area?.min && listing.area < filters.area.min) return false;
  if (filters.area?.max && listing.area > filters.area.max) return false;

  // District validation
  if (filters.district && listing.address?.district !== filters.district)
    return false;

  // Amenities validation - ALL required amenities must be present
  if (filters.amenities?.length) {
    if (!listing.amenities?.length) return false;
    const listingAmenities = listing.amenities.map((a) => a.toLowerCase());
    const hasAllAmenities = filters.amenities.every((required) =>
      listingAmenities.some((a) => a.includes(required.toLowerCase()))
    );
    if (!hasAllAmenities) return false;
  }

  return true;
};

export const enrichListingWithAreaContext = async (listing) => {
  try {
    if (!listing.location?.latitude || !listing.location?.longitude) {
      return null;
    }

    const SEARCH_RADIUS_KM = 10; // 10km radius for area context

    const command = new SearchPlaceIndexForPositionCommand({
      IndexName: PLACE_INDEX_NAME,
      Position: [listing.location.longitude, listing.location.latitude],
      MaxResults: 50,
    });

    const response = await locationClient.send(command);
    const allResults = response.Results || [];

    const places = allResults.filter(
      (r) => (r.Distance || 0) <= SEARCH_RADIUS_KM
    );

    // Helper to check both Categories and SupplementalCategories
    const hasCategory = (place, keywords) => {
      const allCategories = [
        ...(place.Place.Categories || []),
        ...(place.Place.SupplementalCategories || []),
      ].map((c) => c.toLowerCase());

      return keywords.some((keyword) =>
        allCategories.some((cat) => cat.includes(keyword.toLowerCase()))
      );
    };

    // Analyze nearby places to create context scores
    const restaurants = places.filter((p) =>
      hasCategory(p, [
        "restaurant",
        "food",
        "cafe",
        "coffee",
        "dining",
        "eatery",
        "beverage",
      ])
    );

    const schools = places.filter((p) =>
      hasCategory(p, [
        "school",
        "university",
        "education",
        "college",
        "academy",
      ])
    );

    const security = places.filter((p) =>
      hasCategory(p, [
        "police",
        "security",
        "government",
        "hospital",
        "clinic",
        "pharmacy",
        "medical",
        "health",
      ])
    );

    // Additional safety indicators
    const lighting = places.filter((p) =>
      hasCategory(p, ["bank", "atm", "convenience", "financial"])
    );

    const crowdedAreas = places.filter((p) =>
      hasCategory(p, ["shopping", "market", "mall", "store", "retail"])
    );

    const transport = places.filter((p) =>
      hasCategory(p, ["transport", "bus", "metro", "station", "transit"])
    );

    const entertainment = places.filter((p) =>
      hasCategory(p, [
        "entertainment",
        "cinema",
        "theater",
        "recreation",
        "leisure",
      ])
    );

    const business = places.filter((p) =>
      hasCategory(p, ["office", "business", "commercial", "corporate"])
    );

    const areaContext = {
      restaurantCount: restaurants.length,
      schoolCount: schools.length,
      securityCount: security.length,
      transportCount: transport.length,
      entertainmentCount: entertainment.length,
      businessCount: business.length,
      securityScore: Math.min(
        10,
        security.length * 2 +
          lighting.length * 0.5 +
          crowdedAreas.length * 0.3 +
          (security.length > 0 ? 5 : 0)
      ),
      safetyFactors: {
        policeStations: security.filter((p) => hasCategory(p, ["police"]))
          .length,
        hospitals: security.filter((p) =>
          hasCategory(p, ["hospital", "clinic", "medical"])
        ).length,
        bankATMs: lighting.length,
        crowdedPlaces: crowdedAreas.length,
      },
      transportScore: Math.min(
        10,
        transport.length * 1.5 + (transport.length > 2 ? 3 : 0)
      ),
      businessScore: Math.min(
        10,
        business.length * 1.2 + (business.length > 3 ? 4 : 0)
      ),
      noiseLevel: Math.max(1, 10 - entertainment.length - transport.length), // Lower is quieter
      lastEnriched: new Date().toISOString(),
    };

    return areaContext;
  } catch (error) {
    console.error(`[Enrich] ✗ Error for ${listing.listingId}:`, error.message);
    console.error(error);
    return null;
  }
};

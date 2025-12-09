import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const LISTINGS_TABLE = process.env.LISTINGS_TABLE_NAME;

// Use environment variable or fallback
const TABLE_NAME =
  LISTINGS_TABLE || process.env.LISTINGS_TABLE_NAME || "BoardingHouseListings";

const normalizeText = (value) => {
  if (value === undefined || value === null) return "";
  return value
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const prepareAmenitiesFilter = (amenities) => {
  if (!amenities) return [];
  if (Array.isArray(amenities)) {
    return amenities
      .map((item) => normalizeText(item))
      .filter((item) => item.length > 0);
  }
  if (typeof amenities === "string") {
    return amenities
      .split(",")
      .map((item) => normalizeText(item))
      .filter((item) => item.length > 0);
  }
  return [];
};

const toNumberOrUndefined = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const matchesSearch = (listing, searchTerm) => {
  if (!searchTerm) return true;
  const normalizedSearch = normalizeText(searchTerm);
  if (!normalizedSearch) return true;

  const searchableChunks = [
    listing.title,
    listing.description,
    listing.address?.street,
    listing.address?.ward,
    listing.address?.district,
    listing.address?.city,
    Array.isArray(listing.amenities) ? listing.amenities.join(" ") : undefined,
  ]
    .map((chunk) => normalizeText(chunk))
    .filter((chunk) => chunk.length > 0)
    .join(" ");

  return searchableChunks.includes(normalizedSearch);
};

const hasAllAmenities = (listing, requiredAmenities) => {
  if (!requiredAmenities.length) return true;
  if (!Array.isArray(listing.amenities) || listing.amenities.length === 0) {
    return false;
  }

  const listingAmenities = listing.amenities
    .map((amenity) => normalizeText(amenity))
    .filter((amenity) => amenity.length > 0);

  return requiredAmenities.every((required) =>
    listingAmenities.some((existing) => existing === required)
  );
};

export const createNewListing = async (listingData) => {
  const listingId = uuidv4();
  const now = new Date().toISOString();
  const newListing = {
    listingId,
    createdAt: now,
    updatedAt: now,
    ...listingData,
  };

  // US-036: Enrich with area context before saving
  if (newListing.location?.latitude && newListing.location?.longitude) {
    try {
      const { enrichListingWithAreaContext } = await import(
        "../ai/ai.service.js"
      );
      const areaContext = await enrichListingWithAreaContext(newListing);
      if (areaContext) {
        newListing.areaContext = areaContext;
      }
    } catch (error) {
      // Continue without enrichment
    }
  }

  // Save listing with areaContext included
  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: newListing })
  );

  return newListing;
};

export const getAllListings = async (filters = {}) => {
  const {
    district,
    ward,
    city,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    search,
    amenities,
  } = filters;

  const numericMinPrice = toNumberOrUndefined(minPrice);
  const numericMaxPrice = toNumberOrUndefined(maxPrice);
  const numericMinArea = toNumberOrUndefined(minArea);
  const numericMaxArea = toNumberOrUndefined(maxArea);

  const filterExpressions = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  if (numericMinPrice !== undefined) {
    filterExpressions.push("#price >= :minPrice");
    expressionAttributeNames["#price"] = "price";
    expressionAttributeValues[":minPrice"] = numericMinPrice;
  }

  if (numericMaxPrice !== undefined) {
    filterExpressions.push("#price <= :maxPrice");
    expressionAttributeNames["#price"] = "price";
    expressionAttributeValues[":maxPrice"] = numericMaxPrice;
  }

  if (numericMinArea !== undefined) {
    filterExpressions.push("#area >= :minArea");
    expressionAttributeNames["#area"] = "area";
    expressionAttributeValues[":minArea"] = numericMinArea;
  }

  if (numericMaxArea !== undefined) {
    filterExpressions.push("#area <= :maxArea");
    expressionAttributeNames["#area"] = "area";
    expressionAttributeValues[":maxArea"] = numericMaxArea;
  }

  const scanParams = { TableName: TABLE_NAME };
  if (filterExpressions.length > 0) {
    scanParams.FilterExpression = filterExpressions.join(" AND ");
    scanParams.ExpressionAttributeNames = expressionAttributeNames;
    scanParams.ExpressionAttributeValues = expressionAttributeValues;
  }

  const { Items: listings = [] } = await docClient.send(
    new ScanCommand(scanParams)
  );

  const normalizedDistrict = normalizeText(district);
  const normalizedWard = normalizeText(ward);
  const normalizedCity = normalizeText(city);
  const requiredAmenities = prepareAmenitiesFilter(amenities);

  let filteredListings = listings;

  if (numericMinPrice !== undefined) {
    filteredListings = filteredListings.filter(
      (listing) => Number(listing.price) >= numericMinPrice
    );
  }

  if (numericMaxPrice !== undefined) {
    filteredListings = filteredListings.filter(
      (listing) => Number(listing.price) <= numericMaxPrice
    );
  }

  if (numericMinArea !== undefined) {
    filteredListings = filteredListings.filter(
      (listing) => Number(listing.area) >= numericMinArea
    );
  }

  if (numericMaxArea !== undefined) {
    filteredListings = filteredListings.filter(
      (listing) => Number(listing.area) <= numericMaxArea
    );
  }

  if (normalizedDistrict) {
    filteredListings = filteredListings.filter((listing) =>
      normalizeText(listing.address?.district) === normalizedDistrict
    );
  }

  if (normalizedWard) {
    filteredListings = filteredListings.filter((listing) =>
      normalizeText(listing.address?.ward) === normalizedWard
    );
  }

  if (normalizedCity) {
    filteredListings = filteredListings.filter((listing) =>
      normalizeText(listing.address?.city) === normalizedCity
    );
  }

  if (search) {
    filteredListings = filteredListings.filter((listing) =>
      matchesSearch(listing, search)
    );
  }

  if (requiredAmenities.length > 0) {
    filteredListings = filteredListings.filter((listing) =>
      hasAllAmenities(listing, requiredAmenities)
    );
  }

  return filteredListings;
};

// get listing by id
export const getListingById = async (listingId) => {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { listingId },
    })
  );
  return Item;
};

// update listing by id
export const updateListing = async (listingId, updateData) => {
  const now = new Date().toISOString();

  // Re-enrich area context only if location coordinates changed
  if (updateData.location?.latitude && updateData.location?.longitude) {
    try {
      const currentListing = await getListingById(listingId);
      const locationChanged = 
        currentListing.location?.latitude !== updateData.location.latitude ||
        currentListing.location?.longitude !== updateData.location.longitude;
      
      if (locationChanged) {
        const updatedListing = { ...currentListing, ...updateData };
        const { enrichListingWithAreaContext } = await import("../ai/ai.service.js");
        const areaContext = await enrichListingWithAreaContext(updatedListing);
        
        if (areaContext) {
          updateData.areaContext = areaContext;
        }
      }
    } catch (error) {
      // Continue without enrichment
    }
  }

  // Build update expression dynamically
  const updateExpression = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  Object.keys(updateData).forEach((key, index) => {
    updateExpression.push(`#attr${index} = :val${index}`);
    expressionAttributeNames[`#attr${index}`] = key;
    expressionAttributeValues[`:val${index}`] = updateData[key];
  });

  updateExpression.push(`#updatedAt = :updatedAt`);
  expressionAttributeNames["#updatedAt"] = "updatedAt";
  expressionAttributeValues[":updatedAt"] = now;

  const { Attributes } = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { listingId },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return Attributes;
};

// delete listing by id
export const deleteListing = async (listingId) => {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { listingId },
    })
  );
  return { success: true, message: "Listing đã được xóa" };
};

// 4. Lấy listings của một owner
export const getListingsByOwnerId = async (ownerId) => {
  const { Items } = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "ownerId = :ownerId",
      ExpressionAttributeValues: {
        ":ownerId": ownerId,
      },
    })
  );
  return Items;
};

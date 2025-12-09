import { LocationClient, SearchPlaceIndexForTextCommand, GetPlaceCommand, SearchPlaceIndexForPositionCommand, CalculateRouteCommand } from "@aws-sdk/client-location";

const locationClient = new LocationClient({ region: process.env.REGION });
const PLACE_INDEX_NAME = process.env.PLACE_INDEX_NAME;
const ROUTE_CALCULATOR_NAME = process.env.ROUTE_CALCULATOR_NAME;

// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// Filter listings by distance from user location
export const filterListingsByDistance = (listings, userLat, userLng, radiusKm) => {
  return listings.filter(listing => {
    if (!listing.location?.latitude || !listing.location?.longitude) return false;
    const distance = calculateDistance(userLat, userLng, listing.location.latitude, listing.location.longitude);
    return distance <= radiusKm;
  }).map(listing => ({
    ...listing,
    distance: calculateDistance(userLat, userLng, listing.location.latitude, listing.location.longitude)
  }));
};

// Search for places by text (address, area name)
export const searchPlacesByText = async (searchText, maxResults = 10) => {
  try {
    const command = new SearchPlaceIndexForTextCommand({
      IndexName: PLACE_INDEX_NAME,
      Text: searchText,
      MaxResults: maxResults,
      BiasPosition: [106.7009, 10.7769], // Ho Chi Minh City center
      FilterCountries: ['VNM']
    });
    
    const response = await locationClient.send(command);
    return response.Results?.map(result => ({
      placeId: result.PlaceId,
      label: result.Place.Label,
      address: {
        street: result.Place.AddressNumber ? 
          `${result.Place.AddressNumber} ${result.Place.Street}` : result.Place.Street || '',
        ward: result.Place.Municipality || '',
        district: result.Place.SubRegion || '',
        city: result.Place.Region || ''
      },
      location: {
        latitude: result.Place.Geometry.Point[1],
        longitude: result.Place.Geometry.Point[0]
      },
      coordinates: {
        latitude: result.Place.Geometry.Point[1],
        longitude: result.Place.Geometry.Point[0]
      }
    })) || [];
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
};

// Get place details by PlaceId
export const getPlaceDetails = async (placeId) => {
  try {
    const command = new GetPlaceCommand({
      IndexName: PLACE_INDEX_NAME,
      PlaceId: placeId
    });
    
    const response = await locationClient.send(command);
    return {
      placeId: response.Place.PlaceId,
      label: response.Place.Label,
      address: {
        street: response.Place.AddressNumber ? 
          `${response.Place.AddressNumber} ${response.Place.Street}` : response.Place.Street || '',
        ward: response.Place.Municipality || '',
        district: response.Place.SubRegion || '',
        city: response.Place.Region || ''
      },
      location: {
        latitude: response.Place.Geometry.Point[1],
        longitude: response.Place.Geometry.Point[0]
      },
      coordinates: {
        latitude: response.Place.Geometry.Point[1],
        longitude: response.Place.Geometry.Point[0]
      }
    };
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
};

// Calculate route between two points
export const calculateRoute = async (origin, destination) => {
  try {
    const command = new CalculateRouteCommand({
      CalculatorName: ROUTE_CALCULATOR_NAME,
      DeparturePosition: origin,
      DestinationPosition: destination,
      TravelMode: 'Car',
      DistanceUnit: 'Kilometers',
      IncludeLegGeometry: true
    });
    
    const response = await locationClient.send(command);
    const leg = response.Legs[0];
    
    return {
      distance: leg.Distance,
      duration: leg.DurationSeconds,
      geometry: {
        type: 'LineString',
        coordinates: leg.Geometry?.LineString || []
      },
      steps: leg.Steps?.map(step => ({
        distance: step.Distance,
        duration: step.DurationSeconds,
        startPosition: step.StartPosition,
        endPosition: step.EndPosition
      })) || []
    };
  } catch (error) {
    console.error('Error calculating route:', error);
    throw error;
  }
};

// Reverse geocoding - get address from coordinates
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const command = new SearchPlaceIndexForPositionCommand({
      IndexName: PLACE_INDEX_NAME,
      Position: [longitude, latitude],
      MaxResults: 1
    });
    
    const response = await locationClient.send(command);
    if (response.Results && response.Results.length > 0) {
      const place = response.Results[0].Place;
      
      // HERE uses SubRegion for city (e.g., "Hồ Chí Minh")
      // Municipality is district (e.g., "Quận 1")
      let city = place.SubRegion || place.Region || '';
      
      // Format city name properly
      if (city === 'Hồ Chí Minh' || city === 'Ho Chi Minh') {
        city = 'Tp Hồ Chí Minh';
      } else if (city === 'Hà Nội' || city === 'Ha Noi') {
        city = 'Hà Nội';
      } else if (city === 'Đà Nẵng' || city === 'Da Nang') {
        city = 'Đà Nẵng';
      }
      
      return {
        address: place.AddressNumber ? `${place.AddressNumber} ${place.Street}` : place.Street || '',
        ward: place.Neighborhood || '',
        district: place.Municipality || '',
        city: city,
        country: place.Country || ''
      };
    }
    return {
      address: '',
      ward: '',
      district: '',
      city: '',
      country: ''
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return {
      address: '',
      ward: '',
      district: '',
      city: '',
      country: ''
    };
  }
};
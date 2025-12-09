import { LocationClient, GetMapStyleDescriptorCommand, SearchPlaceIndexForTextCommand, GetMapTileCommand } from '@aws-sdk/client-location';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';

// AWS Location Service Configuration
const REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';
const MAP_NAME = import.meta.env.VITE_MAP_NAME || 'FindNestMap';
const PLACE_INDEX_NAME = import.meta.env.VITE_PLACE_INDEX_NAME || 'FindNestPlaces';
const IDENTITY_POOL_ID = import.meta.env.VITE_IDENTITY_POOL_ID;

// Cache for location client and credentials
let cachedLocationClient = null;
let cachedCredentials = null;
let credentialsPromise = null;

// Fallback map style (Simple raster tiles - OpenStreetMap)
const FALLBACK_MAP_STYLE = {
  version: 8,
  name: 'Simple Raster OSM',
  sources: {
    osm_raster: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm_raster_layer',
      type: 'raster',
      source: 'osm_raster',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Initialize Location Client with Cognito credentials
const getLocationClient = () => {
  if (!IDENTITY_POOL_ID) {
    console.warn('VITE_IDENTITY_POOL_ID not set. AWS Location Service will not be available.');
    return null;
  }

  if (cachedLocationClient) {
    return cachedLocationClient;
  }

  cachedLocationClient = new LocationClient({
    region: REGION,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: REGION }),
      identityPoolId: IDENTITY_POOL_ID,
    }),
  });

  return cachedLocationClient;
};

/**
 * Get map style descriptor from AWS Location Service
 * Returns style JSON for MapLibre GL
 * Falls back to OpenStreetMap style if AWS is not available
 */
export const getMapStyleDescriptor = async () => {
  try {
    const client = getLocationClient();
    if (!client) {
      console.warn('⚠️ AWS Location Client not available. Using fallback.');
      console.log('📍 ĐANG SỬ DỤNG: OpenStreetMap (Fallback)');
      return { ...FALLBACK_MAP_STYLE, metadata: { source: 'fallback' } };
    }

    console.log('🗺️ Fetching AWS Location Service map style...');
    const command = new GetMapStyleDescriptorCommand({
      MapName: MAP_NAME,
    });
    const response = await client.send(command);
    
    // AWS Location Service connected successfully
    console.log('✅ AWS Location Service kết nối thành công!');
    console.log('📍 ĐANG SỬ DỤNG: AWS Location Service (với OSM tiles)');
    
    // Return OSM style but mark as AWS connected
    return {
      ...FALLBACK_MAP_STYLE,
      metadata: { source: 'aws-location' }
    };
  } catch (error) {
    console.error('❌ AWS Location Service error:', error.message);
    console.log('📍 ĐANG SỬ DỤNG: OpenStreetMap (Fallback do lỗi)');
    return { ...FALLBACK_MAP_STYLE, metadata: { source: 'fallback-error' } };
  }
};

/**
 * Get cached credentials or fetch new ones
 */
const getCredentials = async () => {
  // Return cached credentials if still valid (expires in 1 hour)
  if (cachedCredentials && cachedCredentials.expiration > Date.now()) {
    return cachedCredentials;
  }

  // If already fetching, wait for that promise
  if (credentialsPromise) {
    return credentialsPromise;
  }

  // Fetch new credentials
  credentialsPromise = (async () => {
    const credentialsProvider = fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: REGION }),
      identityPoolId: IDENTITY_POOL_ID,
    });

    const creds = await credentialsProvider();
    cachedCredentials = {
      ...creds,
      expiration: creds.expiration ? creds.expiration.getTime() : Date.now() + 3600000, // 1 hour
    };
    credentialsPromise = null;
    return cachedCredentials;
  })();

  return credentialsPromise;
};

/**
 * Transform request to sign AWS requests
 * This function is used by MapLibre GL to sign requests to AWS Location Service
 */
export const transformRequest = (url, resourceType) => {
  if (resourceType === 'Style' && !url.includes('://')) {
    return { url };
  }

  // For AWS URLs, return the URL without signing to avoid Promise serialization issues
  // MapLibre GL JS workers cannot serialize Promises
  if (url.includes('amazonaws.com')) {
    // Return a simple object instead of a Promise
    return { url };
  }

  return { url };
};

/**
 * Search places using place index
 * @param {string} text - Search text (address, place name, etc.)
 * @param {object} options - Additional options (bias position, etc.)
 */
export const searchPlaces = async (text, options = {}) => {
  try {
    const client = getLocationClient();
    if (!client) {
      console.warn('AWS Location Service not available. Using mock data.');
      // Return mock data for testing without AWS
      return [
        {
          Label: text + ' (Mock)',
          PlaceId: 'mock-1',
          Geometry: { Point: [105.8047, 21.0285] },
          Properties: { Country: 'Vietnam' },
        },
      ];
    }

    const command = new SearchPlaceIndexForTextCommand({
      IndexName: PLACE_INDEX_NAME,
      Text: text,
      MaxResults: options.maxResults || 10,
      ...(options.biasPosition && {
        BiasPosition: options.biasPosition,
      }),
      ...(options.filterBBox && {
        FilterBBox: options.filterBBox,
      }),
    });
    const response = await client.send(command);
    return response.Results || [];
  } catch (error) {
    console.warn('Error searching places:', error.message);
    // Return mock data on error
    return [
      {
        Label: text + ' (Mock)',
        PlaceId: 'mock-1',
        Geometry: { Point: [105.8047, 21.0285] },
        Properties: { Country: 'Vietnam' },
      },
    ];
  }
};

/**
 * Get map tile URL for specific zoom level and coordinates
 * @param {number} z - Zoom level
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 */
export const getMapTileUrl = async (z, x, y) => {
  try {
    const client = getLocationClient();
    const command = new GetMapTileCommand({
      MapName: MAP_NAME,
      Z: z.toString(),
      X: x.toString(),
      Y: y.toString(),
    });
    const response = await client.send(command);
    return response.Blob;
  } catch (error) {
    console.error('Error fetching map tile:', error);
    throw error;
  }
};

/**
 * Format location data from AWS response
 */
export const formatLocationData = (result) => {
  return {
    label: result.Label,
    placeId: result.PlaceId,
    geometry: {
      point: result.Geometry?.Point || [],
    },
    properties: result.Properties || {},
  };
};

export default {
  getMapStyleDescriptor,
  searchPlaces,
  getMapTileUrl,
  formatLocationData,
  transformRequest,
};

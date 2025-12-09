// src/services/api.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://k0qsj9xb67.execute-api.us-east-1.amazonaws.com/prod";

// Utility function để lấy accessToken
const getAuthToken = () => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;

      if (Date.now() >= exp) {
        console.warn('⚠️ Access token expired');
        return null;
      }
    } catch (error) {
      console.error('Token decode error:', error);
    }
  }

  return token;
};

// Utility function để tạo headers với accessToken
const getHeaders = (contentType = "application/json") => {
  const headers = {
    "Content-Type": contentType,
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// Xác định xem user hiện tại có phải admin không
const isAdminRoute = () => {
  return window.location.pathname.startsWith('/admin');
};

// Utility function xử lý response - TÁCH LOGIC CHO ADMIN
const handleResponse = async (response) => {
  let data;
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    console.error("API Error:", {
      status: response.status,
      statusText: response.statusText,
      data: data,
    });

    // TÁCH XỬ LÝ 401 CHO ADMIN VS USER
    if (response.status === 401) {
      console.warn('🔒 Unauthorized access');

      // CHỈ CLEAR TOKEN VÀ REDIRECT NẾU KHÔNG PHẢI ADMIN ROUTE
      if (!isAdminRoute()) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        window.location.href = '/user/loginPage';
      } else {
        // Admin route - chỉ log warning, không redirect
        console.warn('⚠️ Admin authentication failed');
      }
    } else if (response.status === 403) {
      console.warn('🚫 Forbidden access - insufficient permissions');
    }

    throw {
      status: response.status,
      message: (typeof data === "object" ? data.message : data) || "API Error",
      data: data,
    };
  }

  return data;
};

// Utility function để lấy idToken headers
const getIdTokenHeaders = (contentType = "application/json") => {
  const headers = {
    "Content-Type": contentType,
  };

  const idToken = localStorage.getItem("idToken");
  if (idToken) {
    headers["Authorization"] = `Bearer ${idToken}`;
  }

  return headers;
};

// ============ AUTH APIs ============
// Rate limit tracking
const rateLimitStore = new Map();

const checkRateLimit = (key, maxRequests = 1, windowMs = 60000) => {
  const now = Date.now();
  const data = rateLimitStore.get(key) || { requests: [], resetTime: now + windowMs };

  // Reset if window expired
  if (now > data.resetTime) {
    data.requests = [];
    data.resetTime = now + windowMs;
  }

  data.requests.push(now);

  // Keep only requests within window
  data.requests = data.requests.filter(timestamp => now - timestamp < windowMs);

  rateLimitStore.set(key, data);

  if (data.requests.length > maxRequests) {
    const oldestRequest = data.requests[0];
    const waitTime = Math.ceil((oldestRequest + windowMs - now) / 1000);
    const error = new Error(`OTP đã gửi, xin vui lòng chờ ${waitTime} giây`);
    error.code = 'RATE_LIMIT_EXCEEDED';
    error.waitTime = waitTime;
    throw error;
  }
};

export const authApi = {
  // Send OTP with rate limiting
  sendOtp: async (phoneNumber) => {
    try {
      // Check rate limit - max 1 request per 60 seconds per phone number
      checkRateLimit(`sendOtp_${phoneNumber}`, 1, 60000);

      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      return handleResponse(response);
    } catch (error) {
      // Re-throw rate limit errors
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        throw {
          status: 429,
          message: error.message,
          waitTime: error.waitTime,
          isRateLimit: true
        };
      }
      throw error;
    }
  },

  // Verify OTP
  verifyOtp: async (phoneNumber, otp) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, otp }),
    });
    return handleResponse(response);
  },

  // Admin Login
  adminLogin: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },

  // Refresh Token
  refreshToken: async (refreshToken) => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ refreshToken }),
    });
    return handleResponse(response);
  },

  // Logout
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Get user info using idToken
  getUserInfo: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/user-info`, {
      method: "GET",
      headers: getIdTokenHeaders(),
    });
    return handleResponse(response);
  },
};

// ============ ADMIN APIs ============
export const adminApi = {
  //Edit Role
  updateUserRole: async (userId, role) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ role }), // Gửi role trong body
    });

    return handleResponse(response); // Dùng hàm xử lý chung
  },

  // Update User Status
  updateUserStatus: async (userId, status) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({
        status: status === 'active' ? 'ENABLED' : 'DISABLED'
      }),
    });

    return handleResponse(response);
  },

  // Get Dashboard Stats
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Get Users List
  getUsers: async (page = 1, limit = 20, userType = "", search = "") => {
    const params = new URLSearchParams({
      page,
      limit,
      ...(userType && { userType }),
      ...(search && { search }),
    });

    const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Get User Detail
  getUserDetail: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Delete User
  deleteUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Get Support Requests
  getRequests: async (page = 1, limit = 20, status = "") => {
    const params = new URLSearchParams({
      page,
      limit,
      ...(status && { status }),
    });

    const response = await fetch(`${API_BASE_URL}/support?${params}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Get Request Detail
  getRequestDetail: async (requestId) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/requests/${requestId}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );
    return handleResponse(response);
  },

  // Update Request Status
  updateRequestStatus: async (requestId, data) => {
    const response = await fetch(`${API_BASE_URL}/support/${requestId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Reply to Request
  replyRequest: async (requestId, reply) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/requests/${requestId}/reply`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ reply }),
      }
    );
    return handleResponse(response);
  },

  // Get System Logs with date range filter
  getLogs: async (
    page = 1,
    limit = 50,
    filter = "",
    logLevel = "",
    startTime = "",
    endTime = ""
  ) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...(filter && { filter }),
      ...(logLevel && { logLevel }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
    });

    const response = await fetch(`${API_BASE_URL}/admin/logs?${params}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Get Log Details
  getLogDetail: async (logStream) => {
    const params = new URLSearchParams({ logStream });

    const response = await fetch(`${API_BASE_URL}/admin/logs/${logStream}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Export Logs
  exportLogs: async (
    format = "csv",
    filter = "",
    startTime = "",
    endTime = ""
  ) => {
    const params = new URLSearchParams({
      format,
      ...(filter && { filter }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
    });

    const response = await fetch(
      `${API_BASE_URL}/admin/logs/export?${params}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );
    return handleResponse(response);
  },

  // Refresh Area Data
  refreshAreaData: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/system/refresh-area-data`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============ USER APIs ============
export const userApi = {
  // Get Profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Update Profile
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  // Get Listings
  getListings: async (page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });

    const response = await fetch(`${API_BASE_URL}/listings?${params}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Submit Support Request
  submitRequest: async (subject, message, type) => {
    const response = await fetch(`${API_BASE_URL}/support`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ subject, message, type }),
    });
    return handleResponse(response);
  },

  // Get User Requests
  getRequests: async (page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });

    const response = await fetch(`${API_BASE_URL}/user/requests?${params}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============ LANDLORD APIs ============
export const landlordApi = {
  // Get Profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/landlord/profile`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Update Profile
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/landlord/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  // Get Properties
  getProperties: async (page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });

    const response = await fetch(
      `${API_BASE_URL}/landlord/properties?${params}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );
    return handleResponse(response);
  },

  // Create Property
  createProperty: async (propertyData) => {
    const response = await fetch(`${API_BASE_URL}/landlord/properties`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(propertyData),
    });
    return handleResponse(response);
  },

  // Update Property
  updateProperty: async (propertyId, propertyData) => {
    const response = await fetch(
      `${API_BASE_URL}/landlord/properties/${propertyId}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(propertyData),
      }
    );
    return handleResponse(response);
  },

  // Delete Property
  deleteProperty: async (propertyId) => {
    const response = await fetch(
      `${API_BASE_URL}/landlord/properties/${propertyId}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      }
    );
    return handleResponse(response);
  },

  // Get Requests
  getRequests: async (page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });

    const response = await fetch(
      `${API_BASE_URL}/landlord/requests?${params}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );
    return handleResponse(response);
  },
};

// ============ PUBLIC APIs ============
export const publicApi = {
  searchAI: async (query, userLocation) => {
    const response = await fetch(`${API_BASE_URL}/ai/search`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ query, userLocation }),
    });
    return handleResponse(response);
  },

  getAllListings: async (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...filters,
    });

    const response = await fetch(`${API_BASE_URL}/listings?${params}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  searchListings: async (query, page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams({
      q: query,
      page,
      limit,
      ...filters,
    });

    const response = await fetch(`${API_BASE_URL}/listings/search?${params}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getListingDetail: async (listingId) => {
    const response = await fetch(`${API_BASE_URL}/listings/${listingId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getDistricts: async (province) => {
    const params = new URLSearchParams({ province });

    const response = await fetch(`${API_BASE_URL}/districts?${params}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getFavorites: async () => {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  removeFavorite: async (listingId) => {
    const response = await fetch(`${API_BASE_URL}/favorites/${listingId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  addFavorite: async (listingId) => {
    const response = await fetch(`${API_BASE_URL}/favorites/${listingId}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ listingId }),
    });
    return handleResponse(response);
  },

  getRoute: async (routeData) => {
    const response = await fetch(`${API_BASE_URL}/location/routes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(routeData),
    });
    return handleResponse(response);
  },
};

// ============ LISTING APIs ============
export const listingApi = {
  getAllListings: async (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...filters,
    });

    const response = await fetch(`${API_BASE_URL}/listings?${params}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getListingById: async (listingId) => {
    const response = await fetch(`${API_BASE_URL}/listings/${listingId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createListing: async (listingData) => {
    const response = await fetch(`${API_BASE_URL}/listings`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(listingData),
    });
    return handleResponse(response);
  },

  // ⭐ ENHANCED updateListing với better error handling
  updateListing: async (listingId, listingData) => {
    try {
      console.log('🚀 updateListing API called:', {
        listingId: listingId,
        dataStructure: {
          hasTitle: !!listingData.title,
          hasDescription: !!listingData.description,
          hasPrice: !!listingData.price,
          hasAddress: !!listingData.address,
          hasImages: !!listingData.images,
          imageCount: listingData.images?.length || 0
        }
      });

      // ⭐ VALIDATE INPUTS
      if (!listingId) {
        throw new Error('ListingId is required');
      }

      if (!listingData || typeof listingData !== 'object') {
        throw new Error('Invalid listing data provided');
      }

      // ⭐ VALIDATE REQUIRED FIELDS
      const requiredFields = ['title', 'description', 'price', 'address'];
      for (const field of requiredFields) {
        if (!listingData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // ⭐ VALIDATE ADDRESS STRUCTURE
      if (!listingData.address.district || !listingData.address.city) {
        throw new Error('Address must include district and city');
      }

      // ⭐ VALIDATE DATA TYPES
      if (typeof listingData.price !== 'number' || listingData.price <= 0) {
        throw new Error('Price must be a positive number');
      }

      if (typeof listingData.area !== 'number' || listingData.area <= 0) {
        throw new Error('Area must be a positive number');
      }

      // ⭐ CHECK AUTHENTICATION
      const token = getAuthToken();
      console.log('🔑 Auth token check:', {
        exists: !!token,
        length: token?.length || 0
      });

      if (!token) {
        throw new Error('Authentication token missing');
      }

      // ⭐ PREPARE CLEAN DATA (remove undefined/null values)
      const cleanData = JSON.parse(JSON.stringify(listingData, (key, value) => {
        return value === undefined ? null : value;
      }));

      console.log('📤 Making PUT request:');
      console.log('🔗 URL:', `${API_BASE_URL}/listings/${listingId}`);
      console.log('📋 Headers:', getHeaders());
      console.log('📦 Body size:', JSON.stringify(cleanData).length, 'bytes');
      console.log('📦 Clean data:', cleanData);

      const response = await fetch(`${API_BASE_URL}/listings/${listingId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(cleanData),
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      // ⭐ HANDLE RESPONSE
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }

        throw {
          status: response.status,
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          data: errorData
        };
      }

      const result = await response.json();
      console.log('✅ Update successful:', result);

      return result;

    } catch (error) {
      console.error('❌ updateListing API error:', {
        error: error,
        message: error.message,
        status: error.status,
        listingId: listingId
      });

      // ⭐ ENHANCED ERROR HANDLING
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại');
      }

      // Re-throw with preserved error info
      throw error;
    }
  },

  // ⭐ Delete listing endpoint
  deleteListing: async (listingId) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_BASE_URL}/listings/${listingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // ⭐ Handle 204 No Content response
    if (response.status === 204) {
      return; // Success with no content
    }

    // ⭐ Handle other success status codes
    if (response.ok) {
      return;
    }

    // ⭐ Handle error responses
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || 'Failed to delete listing');
    error.response = response;
    throw error;
  },
};

// ============ NOTIFICATIONS APIs ============
export const notificationsApi = {
  // Get all notifications for current user
  getNotifications: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============ UPLOAD APIs ============
export const uploadApi = {
  getPresignedUrls: async (files) => {
    try {
      const response = await fetch(`${API_BASE_URL}/images/upload-urls`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ files }),
      });

      const data = await handleResponse(response);
      console.log('✅ getPresignedUrls response:', data);
      return data;
    } catch (error) {
      console.error('❌ getPresignedUrls error:', error);
      throw error;
    }
  },

  uploadToS3: async (presignedUrl, file, contentType) => {
    try {
      console.log('📤 Uploading to S3:', {
        contentType: contentType,
        fileSize: file.size,
        fileName: file.name
      });

      const response = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
        body: file,
      });

      console.log('✅ S3 Upload response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ S3 Upload failed:', errorText);
        throw new Error(`S3 upload failed: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error("❌ S3 Upload error:", error);
      throw error;
    }
  },
};

// ============ LOCATION APIs ============
export const locationApi = {
  // Search locations by query
  searchLocations: async (query, limit = 10) => {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString()
      });

      console.log('📍 Searching locations:', { query, limit });

      const response = await fetch(`${API_BASE_URL}/location/search?${params}`, {
        method: "GET",
        headers: getHeaders()
      });

      const result = await handleResponse(response);
      console.log('✅ Location search result:', result);
      return result;

    } catch (error) {
      console.error('❌ Location search error:', error);
      throw error;
    }
  },

  // Get place details by placeId
  getPlaceDetails: async (placeId) => {
    try {
      console.log('📍 Getting place details:', placeId);

      const response = await fetch(`${API_BASE_URL}/location/places/${placeId}`, {
        method: "GET",
        headers: getHeaders()
      });

      const result = await handleResponse(response);
      console.log('✅ Place details result:', result);
      return result;

    } catch (error) {
      console.error('❌ Get place details error:', error);
      throw error;
    }
  },

  // Reverse geocode (coordinates to address)
  reverseGeocode: async (lat, lng) => {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString()
      });

      console.log('📍 Reverse geocoding:', { lat, lng });

      const response = await fetch(`${API_BASE_URL}/location/reverse?${params}`, {
        method: "GET",
        headers: getHeaders()
      });

      const result = await handleResponse(response);
      console.log('✅ Reverse geocode result:', result);

      // Parse response structure
      if (result && result.address) {
        return {
          street: result.address.street || result.address.road || '',
          ward: result.address.ward || result.address.suburb || '',
          district: result.address.district || result.address.city_district || '',
          city: result.address.city || result.address.province || 'TP.HCM',
          fullAddress: result.address.label || result.label || '',
          latitude: lat,
          longitude: lng
        };
      }

      return result;

    } catch (error) {
      console.error('❌ Reverse geocode error:', error);
      throw error;
    }
  },

  // Geocode address to coordinates (wrapper function)
  geocodeAddress: async (address) => {
    try {
      console.log('📍 [START] Geocoding address:', address);

      // STEP 1: Search for the address
      const searchResult = await locationApi.searchLocations(address, 1);

      console.log('📍 [STEP 1] Search result:', {
        hasData: !!searchResult,
        type: typeof searchResult,
        keys: Object.keys(searchResult || {}),
        fullResult: searchResult
      });

      // STEP 2: Handle different response structures
      let results = null;

      if (Array.isArray(searchResult)) {
        results = searchResult;
      } else if (searchResult && Array.isArray(searchResult.results)) {
        results = searchResult.results;
      } else if (searchResult && searchResult.data && Array.isArray(searchResult.data.results)) {
        results = searchResult.data.results;
      } else if (searchResult && searchResult.placeId) {
        results = [searchResult];
      }

      console.log('📍 [STEP 2] Parsed results:', {
        hasResults: !!results,
        resultsCount: results?.length || 0,
        firstResult: results?.[0]
      });

      // STEP 3: Extract coordinates from first result
      if (results && results.length > 0) {
        const firstResult = results[0];

        console.log('📍 [STEP 3] First result structure:', {
          hasPlaceId: !!firstResult.placeId,
          hasLocation: !!firstResult.location,
          hasLatitude: !!firstResult.latitude,
          keys: Object.keys(firstResult)
        });

        // Try to get coordinates from different possible structures
        let latitude = null;
        let longitude = null;

        if (firstResult.location) {
          latitude = firstResult.location.latitude;
          longitude = firstResult.location.longitude;
        } else if (firstResult.latitude !== undefined) {
          latitude = firstResult.latitude;
          longitude = firstResult.longitude;
        } else if (firstResult.lat !== undefined) {
          latitude = firstResult.lat;
          longitude = firstResult.lon || firstResult.lng;
        }

        console.log('📍 [STEP 4] Extracted coordinates:', {
          latitude,
          longitude
        });

        if (latitude && longitude) {
          const result = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            address: firstResult.address || firstResult.label || address,
            label: firstResult.label || firstResult.address || address,
            placeId: firstResult.placeId
          };

          console.log('✅ [SUCCESS] Geocoding completed:', result);
          return result;
        }
      }

      console.error('❌ [FAILED] No valid coordinates found in results');
      throw new Error('Không tìm thấy tọa độ cho địa chỉ này');

    } catch (error) {
      console.error('❌ [ERROR] Geocode address error:', {
        message: error.message,
        status: error.status,
        stack: error.stack
      });
      throw error;
    }
  },

  // Search with filters
  searchWithFilters: async (filters) => {
    try {
      console.log('📍 Searching with filters:', filters);

      const response = await fetch(`${API_BASE_URL}/location/search`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(filters)
      });

      const result = await handleResponse(response);
      console.log('✅ Filtered search result:', result);
      return result;

    } catch (error) {
      console.error('❌ Filtered search error:', error);
      throw error;
    }
  },

  // Batch geocode multiple addresses
  batchGeocode: async (addresses) => {
    try {
      console.log('📍 Batch geocoding:', addresses);

      const response = await fetch(`${API_BASE_URL}/location/batch-geocode`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ addresses })
      });

      const result = await handleResponse(response);
      console.log('✅ Batch geocode result:', result);
      return result;

    } catch (error) {
      console.error('❌ Batch geocode error:', error);
      throw error;
    }
  }
};

export default {
  authApi,
  adminApi,
  userApi,
  landlordApi,
  publicApi,
  listingApi,
  uploadApi,
  notificationsApi,
  locationApi,
};

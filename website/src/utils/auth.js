/**
 * ✅ AUTH UTILITIES (UPDATED):
 * - accessToken: Dùng cho API authentication
 * - idToken: Dùng để lấy thông tin user từ backend
 * - userType: Thay vì role
 */

// Role constants
export const USER_ROLES = {
    ADMIN: 'admin',
    LANDLORD: 'landlord',
    USER: 'user'
};

// Get current user from localStorage
export const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

// ✅ Get accessToken (for API calls)
export const getAccessToken = () => {
    return localStorage.getItem('accessToken');
};

// ✅ THÊM: Get idToken (for user info from backend)
export const getIdToken = () => {
    return localStorage.getItem('idToken');
};

// Get refresh token
export const getRefreshToken = () => {
    return localStorage.getItem('refreshToken');
};

// ✅ Get userType
export const getUserType = () => {
    return localStorage.getItem('userType') || 'user';
};

// Backward compatibility
export const getUserRole = () => {
    return getUserType();
};

// Get user ID
export const getUserId = () => {
    return localStorage.getItem('userId');
};

// ✅ Check if user is authenticated (check accessToken)
export const isAuthenticated = () => {
    return !!getAccessToken();
};

// Check if user has specific userType
export const hasRole = (userType) => {
    const currentUserType = getUserType();
    return currentUserType === userType;
};

// Check if user has any of the userTypes
export const hasAnyRole = (userTypes = []) => {
    const currentUserType = getUserType();
    return userTypes.includes(currentUserType);
};

// Check if user is admin
export const isAdmin = () => {
    return hasRole(USER_ROLES.ADMIN);
};

// Check if user is landlord
export const isLandlord = () => {
    return hasRole(USER_ROLES.LANDLORD);
};

// Check if user is regular user
export const isRegularUser = () => {
    return hasRole(USER_ROLES.USER);
};

// Decode JWT token (without verification - for client side only)
export const decodeToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

// Check if token is expired
export const isTokenExpired = (token) => {
    if (!token) return true;

    try {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) return true;

        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    } catch (error) {
        return true;
    }
};

// ✅ Clear all auth data
export const clearAuthData = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userEmail');
};

// ✅ Save auth data - HỖ TRỢ CẢ accessToken VÀ idToken
export const saveAuthData = (data) => {
    // ✅ Save accessToken (for API calls)
    if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
    }

    // ✅ Save idToken (for user info)
    if (data.idToken) {
        localStorage.setItem('idToken', data.idToken);
    }

    // Save refreshToken
    if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
    }

    // Save user data
    if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.userId || data.user.id || '');

        // ✅ Lưu userType
        localStorage.setItem('userType', data.user.userType || 'user');

        if (data.user.fullName || data.user.name) {
            localStorage.setItem('userName', data.user.fullName || data.user.name || '');
        }
        if (data.user.phoneNumber) {
            localStorage.setItem('userPhone', data.user.phoneNumber || '');
        }
        if (data.user.email) {
            localStorage.setItem('userEmail', data.user.email || '');
        }
    }
};

// Get home route based on userType
export const getHomeRoute = (userType) => {
    switch (userType) {
        case USER_ROLES.ADMIN:
            return '/admin/dashboard';
        case USER_ROLES.LANDLORD:
        case USER_ROLES.USER:
            return '/';
    }
};

// ✅ THÊM: Fetch user info from backend using idToken
export const fetchUserInfo = async () => {
    const idToken = getIdToken();
    if (!idToken) {
        throw new Error('No idToken found');
    }

    try {
        const response = await fetch(
            'https://qjird3g5xf.execute-api.us-east-1.amazonaws.com/prod/auth/user-info',
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }

        const userData = await response.json();

        // Update localStorage with fresh user data
        if (userData.user) {
            localStorage.setItem('user', JSON.stringify(userData.user));
            localStorage.setItem('userType', userData.user.userType || 'user');
        }

        return userData.user;
    } catch (error) {
        console.error('Error fetching user info:', error);
        throw error;
    }
};

export default {
    USER_ROLES,
    getCurrentUser,
    getAccessToken,
    getIdToken,
    getRefreshToken,
    getUserType,
    getUserRole,
    getUserId,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    isAdmin,
    isLandlord,
    isRegularUser,
    decodeToken,
    isTokenExpired,
    clearAuthData,
    saveAuthData,
    getHomeRoute,
    fetchUserInfo
};
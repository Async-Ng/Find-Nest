/**
 * ✅ useAuth HOOK (UPDATED):
 * - Check accessToken for authentication
 * - Use idToken to fetch user info from backend
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    isAuthenticated,
    getCurrentUser,
    getUserType,
    clearAuthData,
    isTokenExpired,
    getAccessToken,
    getIdToken,
    fetchUserInfo
} from '../utils/auth';

const useAuth = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [userType, setUserType] = useState('user');
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const accessToken = getAccessToken();
            const idToken = getIdToken();

            // Check if accessToken exists and not expired
            if (!accessToken || isTokenExpired(accessToken)) {
                handleLogout();
                return;
            }

            // Get user from localStorage first
            let currentUser = getCurrentUser();
            let currentUserType = getUserType();

            // ✅ THÊM: Nếu có idToken, fetch fresh user info from backend
            if (idToken && !isTokenExpired(idToken)) {
                try {
                    const freshUserData = await fetchUserInfo();
                    if (freshUserData) {
                        currentUser = freshUserData;
                        currentUserType = freshUserData.userType || 'user';
                    }
                } catch (error) {
                    console.warn('⚠️ Failed to fetch fresh user info, using cached data');
                    // Fallback to localStorage data
                }
            }

            setUser(currentUser);
            setUserType(currentUserType);
            setAuthenticated(true);

            console.log('✅ Auth check:', {
                userId: currentUser?.userId,
                userType: currentUserType,
                hasAccessToken: !!accessToken,
                hasIdToken: !!idToken
            });
        } catch (error) {
            console.error('Auth check error:', error);
            handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearAuthData();
        setUser(null);
        setUserType('user');
        setAuthenticated(false);
        navigate('/user/loginPage');
    };

    const refreshAuth = () => {
        checkAuth();
    };

    return {
        user,
        userType,
        role: userType, // Alias for backward compatibility
        authenticated,
        loading,
        logout: handleLogout,
        refresh: refreshAuth,
        isAdmin: userType === 'admin',
        isLandlord: userType === 'landlord',
        isUser: userType === 'user'
    };
};

export default useAuth;
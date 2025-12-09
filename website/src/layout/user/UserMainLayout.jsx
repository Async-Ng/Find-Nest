import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";
import { setToken, setUser, clearAuth } from "../../redux/slices/authSlice";
import Navbar from "./Navbar";

const MainLayout = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check token on mount and sync with localStorage
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");

    if (token) {
      // Token exists - restore auth state
      dispatch(setToken(token));
      if (user) {
        try {
          dispatch(setUser(JSON.parse(user)));
        } catch (error) {
          console.error('Error parsing user:', error);
        }
      }
    } else if (isAuthenticated) {
      // Token was cleared but Redux still thinks user is authenticated
      // This happens after logout
      dispatch(clearAuth());
    }
  }, [dispatch]);

  useEffect(() => {
    // Monitor localStorage changes from other tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken') {
        if (!e.newValue && isAuthenticated) {
          dispatch(clearAuth());
        } else if (e.newValue && !isAuthenticated) {
          dispatch(setToken(e.newValue));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated, dispatch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>
      {/* Navbar - fixed positioning with floating effect */}
      <Navbar />

      {/* Spacer to prevent content from being hidden under fixed navbar */}
      <div style={{ height: "0px" }} />

      {/* Main content - render child routes here */}
      <main style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
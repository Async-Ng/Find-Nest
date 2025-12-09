import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";
import { setToken, setUser, clearAuth } from "../../redux/slices/authSlice";
import Navbar from "./Navbar";

const LandlordMainLayout = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");

    if (token) {
      dispatch(setToken(token));
      if (user) {
        try {
          dispatch(setUser(JSON.parse(user)));
        } catch (error) {
          console.error("Error parsing user:", error);
        }
      }
    } else if (isAuthenticated) {
      dispatch(clearAuth());
    }
  }, [dispatch]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "accessToken") {
        if (!e.newValue && isAuthenticated) {
          dispatch(clearAuth());
        } else if (e.newValue && !isAuthenticated) {
          dispatch(setToken(e.newValue));
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isAuthenticated, dispatch]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: "#f8fdff"
    }}>
      <Navbar />

      {/* MAIN CONTENT */}
      <main style={{
        flex: 1,
        padding: "0",
        minHeight: "calc(100vh - 70px)"
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default LandlordMainLayout;

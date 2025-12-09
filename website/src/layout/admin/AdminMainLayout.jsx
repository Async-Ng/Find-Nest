import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";
import { setToken, setUser, clearAuth } from "../../redux/slices/authSlice";

const AdminMainLayout = () => {
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#0b1220", color: "#f8fafc" }}>
      <header style={{ height: "70px", display: "flex", alignItems: "center", padding: "0 24px", background: "linear-gradient(90deg,#071133,#0b1220)", boxShadow: "0 4px 18px rgba(2,6,23,0.6)" }}>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Admin Panel</h1>
      </header>

      <main style={{ flex: 1, padding: "24px" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminMainLayout;

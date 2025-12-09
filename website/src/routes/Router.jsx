// src/router/Router.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Import các trang (component)
import Home from "../pages/user/Home";
// import MapLoginPage from "../pages/user/MapLoginPage";
import RequestPage from "../pages/user/RequestPage";
import ListingsMapPage from "../pages/user/ListingsMapPage";
import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminUserDetail from "../pages/admin/AdminUserDetail";
import AdminLogs from "../pages/admin/AdminLogs";
import LoginPage from "../pages/user/LoginPage";
import AdminRequestPage from "../pages/admin/adminRequestPage.jsx/AdminRequestPage";
import FavoriteListingsPage from "../pages/user/FavoriteListing";
import ListingDetailPage from "../pages/user/ListingDetailPage";
import AIChat from "../components/user/chatBoxAI/AIChat";
import ListingPage from "../pages/user/ListingPage";
import MyListing from '../pages/landlord/MyListing';
import CreateListing from '../pages/landlord/CreateListing';
import NotFound from "../pages/NotFound";
import MainLayout from "../layout/user/UserMainLayout";
import AdminMainLayout from "../layout/admin/AdminMainLayout";
import LandlordMainLayout from "../layout/landlord/LandlordMainLayout";
import EditListing from "../pages/landlord/EditListing";
import ProfilePage from "../pages/user/ProfilePage";

// Protected Route Component
const ProtectedRoute = ({ element, requireAuth = true }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/user/loginPage" replace />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return element;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang chủ - Map với Login Panel */}
        {/* <Route index element={<MapLoginPage />} /> */}

        {/* Login Pages - NO MainLayout */}
        <Route path="/user/loginPage" element={<ProtectedRoute element={<LoginPage />} requireAuth={false} />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* User routes (uses existing user MainLayout) */}
        <Route element={<MainLayout />}>
          <Route index path="/" element={<Home />} />
          <Route path="/user/requestPage" element={<ProtectedRoute element={<RequestPage />} requireAuth={true} />} />
          <Route path="/user/listings-map" element={<ListingsMapPage />} />
          <Route path="/user/favoriteListing" element={<ProtectedRoute element={<FavoriteListingsPage />} requireAuth={true} />} />
          <Route path="/user/profile" element={<ProtectedRoute element={<ProfilePage />} requireAuth={true} />} />
          <Route path="/user/AIChat" element={<ProtectedRoute element={<AIChat />} requireAuth={true} />} />
          <Route path="/user/listings" element={<ListingPage />} />
          <Route path="/listings/:listingId" element={<ListingDetailPage />} />
        </Route>

        {/* Admin routes (uses AdminMainLayout) */}
        <Route path="/admin" element={<AdminMainLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:userId" element={<AdminUserDetail />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="requests" element={<AdminRequestPage />} />
        </Route>

        {/* Landlord routes (uses LandlordMainLayout) */}
        <Route path="/landlord" element={<LandlordMainLayout />}>
          <Route path="my-listings" element={<MyListing />} />
          <Route path="create-listing" element={<CreateListing />} />
          <Route path="edit-listing/:listingId" element={<EditListing />} />
        </Route>

        {/* Route không tồn tại */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

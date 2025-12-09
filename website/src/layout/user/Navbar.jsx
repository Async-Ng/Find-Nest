// src/components/Navbar.jsx
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { clearAuth } from "../../redux/slices/authSlice";
import { authApi } from "../../services/api"
import NotificationBell from "../../components/NotificationBell";
import RequestModal from "../../components/user/RequestModal";
import ProfileModal from "../../components/user/ProfileModal";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Lấy thông tin user từ Redux
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [openMenu, setOpenMenu] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Format userType
  const formatUserType = (type) => {
    if (type === 'landlord') return 'Chủ Trọ';
    if (type === 'user') return 'Người dùng';
    return 'User';
  };

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  //logout 
  const handleLogout = async () => {
    setLoading(true);
    try {
      // Call logout API
      await authApi.logout();

      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      localStorage.removeItem('userId');
      localStorage.removeItem('userPhone');

      // Dispatch Redux action to clear auth state
      dispatch(clearAuth());

      // Show success notification with Swal
      await Swal.fire({
        icon: 'success',
        title: 'Đăng xuất thành công',
        text: 'Bạn đã đăng xuất khỏi hệ thống',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#0a66c2',
      });

      // Redirect to login
      navigate("/user/loginPage", { replace: true });
    } catch (error) {
      console.error('Logout error:', error);

      // Show error notification with Swal
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi đăng xuất',
        text: error.message || 'Vui lòng thử lại',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: isScrolled ? "70px" : "85px",
        backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.95)" : "transparent",
        backdropFilter: isScrolled ? "blur(10px)" : "none",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isScrolled ? "0 20px" : "0 40px",
        position: "fixed",
        top: "0px",
        left: "0px",
        zIndex: 9999,
        gap: "60px",
        borderRadius: isScrolled ? "40px" : "0px",
        boxShadow: isScrolled ? "0 8px 32px rgba(0, 0, 0, 0.1)" : "none",
        transition: "all 0.5s ease-in-out",
        borderBottom: isScrolled ? "1px solid rgba(255, 255, 255, 0.2)" : "none",
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ textDecoration: "none", color: "#111", flexShrink: 0 }}>
        <img
          src="/Logo.png"
          alt="Logo"
          style={{
            height: "50px",
            objectFit: "contain",
          }}
        />
      </Link>

      {/* Góc phải (User info) */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        {/* Nếu user đã login */}
        {isAuthenticated ? (
          <div style={{ display: "flex", alignItems: "end", gap: "16px" }}>
            {/* Notification Bell */}
            <NotificationBell />

            {/* User Profile */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                gap: "10px",
              }}
              onClick={() => setOpenMenu(!openMenu)}
            >
              {/* Ảnh đại diện user */}
              <img
                src={user?.avatar || "/default-avatar-profile-icon-of-social-media-user-vector.jpg"}
                alt="avatar"
                style={{
                  width: "45px",
                  height: "45px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                }}
              />
              <span style={{ fontSize: "15px", fontWeight: 500, color: "#111" }}>{user?.name || formatUserType(user?.userType)}</span>
            </div>

            {/* Dropdown menu */}
            {openMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "65px",
                  right: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "12px",
                  padding: "12px",
                  width: "190px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                  zIndex: 10000,
                }}
              >
                <div
                  onClick={() => { setProfileModalOpen(true); setOpenMenu(false); }}
                  style={{ display: "block", marginBottom: "12px", fontSize: "14px", color: "#333", textDecoration: "none", cursor: "pointer" }}
                >
                  Hồ sơ cá nhân
                </div>

                <Link
                  to="/user/favoriteListing"
                  style={{ display: "block", marginBottom: "12px", fontSize: "14px", color: "#333", textDecoration: "none" }}
                >
                  Yêu thích
                </Link>

                <div
                  onClick={() => { setRequestModalOpen(true); setOpenMenu(false); }}
                  style={{ display: "block", marginBottom: "12px", fontSize: "14px", color: "#333", textDecoration: "none", cursor: "pointer" }}
                >
                  Yêu cầu
                </div>

                {/* Landlord Management Link */}
                {user?.userType === 'landlord' && (
                  <Link
                    to="/landlord/my-listings"
                    style={{ display: "block", marginBottom: "12px", fontSize: "14px", color: "#333", textDecoration: "none" }}
                  >
                    Quản lý phòng trọ
                  </Link>
                )}

                <button
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #e06a1a 0%, #ff8c42 100%)",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    marginTop: "8px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 4px 12px rgba(224, 106, 26, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
                  onClick={handleLogout}
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng xuất'}
                </button>
              </div>
            )}
          </div>
        ) : (
          // Nếu chưa login
          <Link
            to="/user/loginPage"
            style={{
              background: "linear-gradient(135deg, #0a66c2 0%, #0052a3 100%)",
              padding: "10px 20px",
              borderRadius: "6px",
              color: "white",
              textDecoration: "none",
              fontSize: "15px",
              fontWeight: 500,
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(10, 102, 194, 0.2)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(10, 102, 194, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(10, 102, 194, 0.2)";
            }}
          >
            Đăng nhập
          </Link>
        )}
      </div>

      {/* Request Modal */}
      <RequestModal open={requestModalOpen} onClose={() => setRequestModalOpen(false)} />
      
      {/* Profile Modal */}
      <ProfileModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
};

export default Navbar;

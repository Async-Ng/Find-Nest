import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Empty, Spin, message } from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  ArrowLeftOutlined,
  HeartOutlined,
  HeartFilled,
  AreaChartOutlined,
  CameraOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  WifiOutlined,
  FireOutlined,
  CarOutlined,
  BuildOutlined,
  HomeOutlined as HomeFilled,
  CrownOutlined,
  ThunderboltOutlined,
  DownOutlined,
  InboxOutlined,
  SyncOutlined,
  VerticalAlignTopOutlined
} from "@ant-design/icons";
import Swal from "sweetalert2";
import { publicApi } from "../../services/api";
import MiniMapComponent from "../../components/MiniMapComponent";

const AMENITIES_LIST = [
  { label: 'WiFi', value: 'wifi', icon: <WifiOutlined />, color: '#3B82F6' },
  { label: 'Điều hòa', value: 'aircon', icon: <ThunderboltOutlined />, color: '#06B6D4' },
  { label: 'Tủ lạnh', value: 'fridge', icon: <InboxOutlined />, color: '#8B5CF6' },
  { label: 'Máy giặt', value: 'washing', icon: <SyncOutlined />, color: '#EC4899' },
  { label: 'Gửi xe', value: 'parking', icon: <CarOutlined />, color: '#F59E0B' },
  { label: 'An ninh 24/7', value: 'security', icon: <SafetyCertificateOutlined />, color: '#EF4444' },
  { label: 'Thang máy', value: 'elevator', icon: <VerticalAlignTopOutlined />, color: '#10B981' },
  { label: 'Ban công', value: 'balcony', icon: <BuildOutlined />, color: '#14B8A6' }
];

const ListingDetailPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null); // ⭐ ADD: Ref for map section

  const [listing, setListing] = useState(null);
  const [currentImage, setCurrentImage] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // THEME COLORS
  const COLORS = {
    primary: '#FF8C42',        // ⭐ Orange
    primaryLight: '#FFF5ED',   // ⭐ Light orange
    primaryDark: '#E67A2E',    // ⭐ Dark orange
    secondary: '#FFB366',      // ⭐ Light orange
    white: '#FFFFFF',
    gray: '#F8F9FA',
    border: '#E0E6ED',
    text: '#2D3748',
    textLight: '#718096',
    success: '#28A745',
    error: '#DC3545',
    warning: '#FFC107',
    background: 'linear-gradient(135deg, #fffaf5 0%, #fff5ed 100%)' // ⭐ Orange tint
  };

  // ⭐ ADD: Scroll to map function
  const scrollToMap = () => {
    if (mapRef.current) {
      const headerHeight = 80; // Height of fixed header
      const elementPosition = mapRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Optional: Add highlight effect
      mapRef.current.style.transition = 'all 0.3s ease';
      mapRef.current.style.boxShadow = `0 8px 32px ${COLORS.primary}40`; // ⭐ Orange shadow

      setTimeout(() => {
        mapRef.current.style.boxShadow = `0 4px 20px ${COLORS.primary}15`; // ⭐ Orange shadow
      }, 1000);
    }
  };

  // Smart back navigation
  const handleGoBack = () => {
    try {
      if (location.state?.from) {
        navigate(location.state.from);
        return;
      }
      if (window.history.length > 2) {
        navigate(-1);
        return;
      }
      navigate('/listings');
    } catch (error) {
      console.error('❌ Navigation error:', error);
      navigate('/listings');
    }
  };

  // Handle contact actions
  const handleContact = () => {
    if (!listing?.landlord) {
      message.warning('Thông tin liên hệ chưa có sẵn');
      return;
    }

    Swal.fire({
      icon: 'info',
      title: '📞 Thông tin liên hệ',
      html: `
        <div style="text-align: left; padding: 20px;">
          <p style="margin-bottom: 12px;">
            <strong>Chủ nhà:</strong> ${listing.landlord.name || 'N/A'}
          </p>
          ${listing.landlord.phone ? `
            <p style="margin-bottom: 12px;">
              <strong>Số điện thoại:</strong> 
              <a href="tel:${listing.landlord.phone}" style="color: #5ba9d3; text-decoration: none;">
                ${listing.landlord.phone}
              </a>
            </p>
          ` : ''}
          ${listing.landlord.email ? `
            <p style="margin-bottom: 12px;">
              <strong>Email:</strong> 
              <a href="mailto:${listing.landlord.email}" style="color: #5ba9d3; text-decoration: none;">
                ${listing.landlord.email}
              </a>
            </p>
          ` : ''}
        </div>
      `,
      confirmButtonText: 'Đóng',
      confirmButtonColor: COLORS.primary // ⭐ Line 139
    });
  };

  const handleMessage = () => {
    if (!listing?.landlord) {
      message.warning('Chức năng nhắn tin đang phát triển');
      return;
    }

    Swal.fire({
      icon: 'info',
      title: '💬 Gửi tin nhắn',
      text: 'Chức năng nhắn tin sẽ có trong phiên bản tiếp theo',
      confirmButtonText: 'Đồng ý',
      confirmButtonColor: '#5ba9d3'
    });
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await publicApi.getListingDetail(listingId);

        if (data) {
          setListing(data);

          const images = data.images || data.imageUrls || [];
          if (images.length > 0) {
            setCurrentImage(images[0]);
          } else {
            setCurrentImage("https://via.placeholder.com/800x600?text=No+Image");
          }

          const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
          setIsFavorite(favorites.some(fav => fav.listingId === listingId));
        } else {
          setListing(null);
        }

      } catch (err) {
        console.error('❌ Fetch detail error:', err);
        setListing(null);

        const errorMessage = err.response?.data?.message || err.message || "Không tải được chi tiết listing";
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: errorMessage,
          confirmButtonText: "Đóng"
        });
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchDetail();
    }
  }, [listingId]);

  const getAddressDisplay = (listing) => {
    if (!listing) return 'Chưa cập nhật địa chỉ';

    try {
      if (listing.address && typeof listing.address === 'object') {
        const parts = [
          listing.address.street,
          listing.address.ward,
          listing.address.district,
          listing.address.city
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật địa chỉ';
      }

      if (listing.address && typeof listing.address === 'string') {
        return listing.address;
      }

      if (listing.location) {
        const parts = [
          listing.location.street,
          listing.location.ward || listing.location.district,
          listing.location.city
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Chưa cập nhật địa chỉ';
      }

      return 'Chưa cập nhật địa chỉ';
    } catch (error) {
      console.error('❌ Address parsing error:', error);
      return 'Chưa cập nhật địa chỉ';
    }
  };

  const handleFavoriteToggle = async () => {
    if (!listingId) return;

    try {
      if (isFavorite) {
        await publicApi.removeFavorite(listingId);
        setIsFavorite(false);

        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const updatedFavorites = favorites.filter(fav => fav.listingId !== listingId);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));

        Swal.fire({
          icon: "success",
          title: "Đã bỏ yêu thích",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await publicApi.addFavorite(listingId);
        setIsFavorite(true);

        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        favorites.push({ listingId, addedAt: new Date().toISOString() });
        localStorage.setItem('favorites', JSON.stringify(favorites));

        Swal.fire({
          icon: "success",
          title: "Đã thêm vào yêu thích",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('❌ Favorite toggle error:', error);

      const errorMessage = error.response?.data?.message || error.message || "Không thể thay đổi trạng thái yêu thích";
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMessage,
        confirmButtonText: "Đóng"
      });
    }
  };

  const formatPrice = (price) => {
    try {
      if (!price || price === 0) return 'Liên hệ';

      const numPrice = typeof price === 'string' ? parseFloat(price) : price;
      if (isNaN(numPrice)) return 'Liên hệ';

      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(numPrice);
    } catch (error) {
      console.error('❌ Price format error:', error);
      return 'Liên hệ';
    }
  };

  const getAmenityIcon = (amenityValue) => {
    if (!amenityValue) return <StarOutlined />;

    try {
      // Try to find in predefined list (by value)
      const predefined = AMENITIES_LIST.find(a => a.value === amenityValue);
      if (predefined) {
        return predefined.icon;
      }

      // Backward compatibility: Try to match by label text
      const lowerAmenity = amenityValue.toLowerCase();

      if (lowerAmenity.includes('wifi') || lowerAmenity.includes('mạng')) {
        return <WifiOutlined />;
      }
      if (lowerAmenity.includes('điều hòa') || lowerAmenity.includes('máy lạnh') || lowerAmenity.includes('aircon')) {
        return <ThunderboltOutlined />;
      }
      if (lowerAmenity.includes('tủ lạnh') || lowerAmenity.includes('fridge')) {
        return <InboxOutlined />;
      }
      if (lowerAmenity.includes('máy giặt') || lowerAmenity.includes('washing')) {
        return <SyncOutlined />;
      }
      if (lowerAmenity.includes('gửi xe') || lowerAmenity.includes('parking') || lowerAmenity.includes('bãi đỗ')) {
        return <CarOutlined />;
      }
      if (lowerAmenity.includes('an ninh') || lowerAmenity.includes('security')) {
        return <SafetyCertificateOutlined />;
      }
      if (lowerAmenity.includes('thang máy') || lowerAmenity.includes('elevator')) {
        return <VerticalAlignTopOutlined />;
      }
      if (lowerAmenity.includes('ban công') || lowerAmenity.includes('balcony')) {
        return <BuildOutlined />;
      }

      // Default for custom amenities
      return <StarOutlined />;
    } catch (error) {
      console.error('❌ Amenity icon error:', error);
      return <StarOutlined />;
    }
  };

  const getAmenityDisplayLabel = (amenityValue) => {
    if (!amenityValue) return '';

    try {
      // Try to find in predefined list
      const predefined = AMENITIES_LIST.find(a => a.value === amenityValue);
      if (predefined) {
        return predefined.label; // Return "WiFi", "Điều hòa", etc.
      }

      // If not found, it's a custom amenity - return as is
      return amenityValue;
    } catch (error) {
      console.error('❌ Amenity display error:', error);
      return amenityValue;
    }
  };

  // OPTIMIZED STYLES
  const pageStyles = {
    container: {
      minHeight: '100vh',
      background: COLORS.background,
      paddingTop: '80px'
    },
    contentWrapper: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 24px'
    },
    backButtonContainer: {
      paddingTop: '24px',
      paddingBottom: '16px',
      display: 'flex',
      justifyContent: 'flex-start'
    },
    backButton: {
      borderRadius: '12px',
      border: `2px solid ${COLORS.primary}`,
      color: COLORS.primary,
      fontWeight: '600',
      height: '44px',
      padding: '0 24px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      background: 'transparent',
      cursor: 'pointer',
      fontSize: '15px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    mainContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr 420px',
      gap: '32px',
      alignItems: 'start',
      paddingBottom: '40px'
    },
    imageSection: {
      background: COLORS.white,
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(91, 169, 211, 0.08)',
      border: `1px solid ${COLORS.border}`
    },
    mainImage: {
      width: '100%',
      height: '520px',
      borderRadius: '16px',
      overflow: 'hidden',
      position: 'relative',
      background: COLORS.gray
    },
    favoriteButton: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '52px',
      height: '52px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.95)',
      border: 'none',
      boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(10px)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2
    },
    thumbnailContainer: {
      display: 'flex',
      gap: '12px',
      marginTop: '16px',
      overflowX: 'auto',
      paddingBottom: '8px',
      scrollbarWidth: 'thin',
      scrollbarColor: `${COLORS.primary}40 transparent`
    },
    thumbnail: (isActive) => ({
      width: '90px',
      height: '90px',
      borderRadius: '12px',
      overflow: 'hidden',
      cursor: 'pointer',
      border: `3px solid ${isActive ? COLORS.primary : COLORS.border}`,
      transition: 'all 0.3s ease',
      flexShrink: 0,
      opacity: isActive ? 1 : 0.7
    }),
    infoSection: {
      background: COLORS.white,
      borderRadius: '20px',
      padding: '28px',
      boxShadow: '0 4px 20px rgba(91, 169, 211, 0.08)',
      border: `1px solid ${COLORS.border}`,
      position: 'sticky',
      top: '100px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '800',
      color: COLORS.text,
      marginBottom: '16px',
      lineHeight: '1.3',
      letterSpacing: '-0.5px'
    },
    // ⭐ UPDATE: Address clickable style
    address: {
      fontSize: '15px',
      color: COLORS.textLight,
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      lineHeight: '1.6',
      cursor: 'pointer',
      padding: '12px',
      borderRadius: '10px',
      transition: 'all 0.3s ease',
      background: COLORS.gray
    },
    priceContainer: {
      background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.white} 100%)`,
      padding: '24px',
      borderRadius: '16px',
      marginBottom: '24px',
      border: `2px solid ${COLORS.primary}30`,
      textAlign: 'center'
    },
    price: {
      fontSize: '32px',
      fontWeight: '900',
      color: COLORS.primary,
      marginBottom: '8px',
      letterSpacing: '-1px'
    },
    priceNote: {
      fontSize: '14px',
      color: COLORS.textLight,
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    detailsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginBottom: '24px'
    },
    detailItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '14px',
      background: COLORS.gray,
      borderRadius: '12px',
      transition: 'all 0.2s ease'
    },
    amenitiesSection: {
      marginBottom: '24px'
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    amenityTag: {
      padding: '8px 14px',
      background: `${COLORS.primary}10`,
      color: COLORS.primary,
      border: `1px solid ${COLORS.primary}30`,
      borderRadius: '20px',
      fontWeight: '600',
      fontSize: '13px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px'
    },
    contactSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginTop: '24px'
    },
    contactButton: (type, active) => {
      const baseStyle = {
        width: '100%',
        height: '48px',
        borderRadius: '12px',
        fontWeight: '600',
        fontSize: '15px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        border: 'none'
      };

      if (type === 'primary') {
        return {
          ...baseStyle,
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
          color: COLORS.white,
          boxShadow: `0 4px 12px ${COLORS.primary}30`
        };
      } else if (type === 'secondary') {
        return {
          ...baseStyle,
          background: COLORS.white,
          border: `2px solid ${COLORS.primary}`,
          color: COLORS.primary
        };
      } else if (type === 'favorite') {
        return {
          ...baseStyle,
          background: active ? `rgba(220, 53, 69, 0.1)` : COLORS.gray,
          border: `2px solid ${active ? '#dc3545' : COLORS.border}`,
          color: active ? '#dc3545' : COLORS.textLight
        };
      }
      return baseStyle;
    },
    descriptionCard: {
      background: COLORS.white,
      borderRadius: '20px',
      padding: '28px',
      marginTop: '24px',
      boxShadow: '0 4px 20px rgba(91, 169, 211, 0.08)',
      border: `1px solid ${COLORS.border}`
    },
    ownerCard: {
      background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.white} 100%)`,
      borderRadius: '16px',
      padding: '20px',
      marginTop: '20px',
      boxShadow: '0 2px 12px rgba(91, 169, 211, 0.1)',
      border: `1px solid ${COLORS.primary}20`
    },
    avatar: {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 4px 12px ${COLORS.primary}30`
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 20px',
      background: COLORS.white,
      borderRadius: '20px',
      margin: '40px auto',
      maxWidth: '600px',
      boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)'
    },
    emptyContainer: {
      maxWidth: '600px',
      margin: '40px auto',
      padding: '60px 40px',
      background: COLORS.white,
      borderRadius: '20px',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)'
    },
    mapCard: {
      background: COLORS.white,
      borderRadius: '20px',
      padding: '24px',
      marginTop: '24px',
      boxShadow: '0 4px 20px rgba(91, 169, 211, 0.08)',
      border: `1px solid ${COLORS.border}`,
      transition: 'all 0.3s ease'
    },
    divider: {
      border: 'none',
      borderTop: `1px solid ${COLORS.border}`,
      margin: '24px 0'
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={pageStyles.contentWrapper}>
          <div style={pageStyles.loadingContainer}>
            <div style={{
              width: '60px',
              height: '60px',
              border: `5px solid ${COLORS.primaryLight}`, // ⭐ Orange light
              borderTop: `5px solid ${COLORS.primary}`, // ⭐ Orange
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{
              color: COLORS.primary, // ⭐ Orange
              marginTop: '20px',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Đang tải thông tin phòng trọ...
            </p>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY STATE
  if (!listing) {
    return (
      <div style={pageStyles.container}>
        <div style={pageStyles.contentWrapper}>
          <div style={pageStyles.emptyContainer}>
            <Empty
              description={
                <span style={{ color: COLORS.textLight, fontSize: '16px' }}>
                  Không tìm thấy thông tin phòng trọ
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            <button
              style={{
                ...pageStyles.contactButton('secondary'),
                width: '200px',
                margin: '24px auto 0'
              }}
              onClick={handleGoBack}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.primary;
                e.currentTarget.style.color = COLORS.white;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(91, 169, 211, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = COLORS.white;
                e.currentTarget.style.color = COLORS.primary;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <ArrowLeftOutlined />
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SAFE DATA EXTRACTION
  const images = Array.isArray(listing.images) ? listing.images :
    Array.isArray(listing.imageUrls) ? listing.imageUrls : [];
  const address = getAddressDisplay(listing);
  const displayImage = currentImage || images[0] || "https://via.placeholder.com/800x600?text=No+Image";

  return (
    <div style={pageStyles.container}>
      <div style={pageStyles.contentWrapper}>

        {/* BACK BUTTON */}
        <div style={pageStyles.backButtonContainer}>
          <button
            style={pageStyles.backButton}
            onClick={handleGoBack}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLORS.primary;
              e.currentTarget.style.color = COLORS.white;
              e.currentTarget.style.transform = 'translateX(-4px)';
              e.currentTarget.style.boxShadow = `0 4px 16px ${COLORS.primary}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = COLORS.primary;
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <ArrowLeftOutlined />
            <span>Quay lại</span>
          </button>
        </div>

        <div style={pageStyles.mainContainer}>
          {/* LEFT COLUMN - Images & Description */}
          <div>
            {/* Image Section */}
            <div style={pageStyles.imageSection}>
              <div style={pageStyles.mainImage}>
                <img
                  src={displayImage}
                  alt={listing.title || 'Listing image'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x600?text=No+Image';
                  }}
                />

                {/* Favorite Button */}
                <button
                  style={pageStyles.favoriteButton}
                  onClick={handleFavoriteToggle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.15)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                  }}
                >
                  {isFavorite ?
                    <HeartFilled style={{ color: '#ff4d4f', fontSize: '26px' }} /> :
                    <HeartOutlined style={{ color: '#666', fontSize: '26px' }} />
                  }
                </button>

                {/* Image Count Badge */}
                {images.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(10px)',
                    color: COLORS.white,
                    padding: '8px 16px',
                    borderRadius: '24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 1
                  }}>
                    <CameraOutlined />
                    <span>{imageIndex + 1} / {images.length}</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div style={pageStyles.thumbnailContainer}>
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      style={pageStyles.thumbnail(displayImage === img)}
                      onClick={() => {
                        setCurrentImage(img);
                        setImageIndex(idx);
                      }}
                      onMouseEnter={(e) => {
                        if (displayImage !== img) {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (displayImage !== img) {
                          e.currentTarget.style.opacity = '0.7';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      <img
                        src={img}
                        alt={`thumbnail-${idx}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description Card */}
            <div style={pageStyles.descriptionCard}>
              <h3 style={pageStyles.sectionTitle}>
                📄 Mô tả chi tiết
              </h3>
              <div style={{
                fontSize: '15px',
                color: COLORS.text,
                lineHeight: '1.8',
                whiteSpace: 'pre-line'
              }}>
                {listing.description || 'Chưa có mô tả chi tiết cho phòng trọ này.'}
              </div>
            </div>

            {/* ⭐ MAP CARD - With Ref */}
            <div ref={mapRef} style={pageStyles.mapCard}>
              <h3 style={pageStyles.sectionTitle}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" style={{ color: COLORS.primary }}>
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>Vị trí & phòng lân cận</span>
              </h3>
              <MiniMapComponent currentListing={listing} />
            </div>
          </div>

          {/* RIGHT COLUMN - Property Info */}
          <div>
            <div style={pageStyles.infoSection}>
              {/* Title */}
              <h1 style={pageStyles.title}>{listing.title || 'Phòng trọ'}</h1>

              {/* ⭐ CLICKABLE ADDRESS - Scroll to Map */}
              <div
                style={pageStyles.address}
                onClick={scrollToMap}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${COLORS.primary}20`;
                  e.currentTarget.style.borderLeft = `3px solid ${COLORS.primary}`;
                  e.currentTarget.style.paddingLeft = '9px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = COLORS.gray;
                  e.currentTarget.style.borderLeft = 'none';
                  e.currentTarget.style.paddingLeft = '12px';
                }}
                title="Click để xem bản đồ"
              >
                <EnvironmentOutlined style={{
                  color: COLORS.primary,
                  fontSize: '18px',
                  marginTop: '2px',
                  flexShrink: 0
                }} />
                <span style={{ flex: 1 }}>{address}</span>
                <DownOutlined style={{
                  color: COLORS.primary,
                  fontSize: '12px',
                  flexShrink: 0
                }} />
              </div>

              {/* PRICE */}
              <div style={pageStyles.priceContainer}>
                <div style={pageStyles.price}>
                  {formatPrice(listing.price)}
                </div>
                <div style={pageStyles.priceNote}>
                  <CrownOutlined style={{
                    color: COLORS.warning,
                    fontSize: '16px'
                  }} />
                  <span>Giá thuê hàng tháng</span>
                </div>
              </div>

              {/* Property Details */}
              <div style={pageStyles.detailsGrid}>
                <div
                  style={pageStyles.detailItem}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${COLORS.primary}20`;
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = COLORS.gray;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <AreaChartOutlined style={{ color: COLORS.primary, fontSize: '20px' }} />
                  <div>
                    <div style={{ fontWeight: '700', color: COLORS.text, fontSize: '16px' }}>
                      {listing.area || 'N/A'} m²
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.textLight }}>Diện tích</div>
                  </div>
                </div>

                <div
                  style={pageStyles.detailItem}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${COLORS.primary}20`;
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = COLORS.gray;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <CalendarOutlined style={{ color: COLORS.primary, fontSize: '20px' }} />
                  <div>
                    <div style={{ fontWeight: '700', color: COLORS.text, fontSize: '16px' }}>
                      {listing.createdAt ?
                        new Date(listing.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit'
                        }) :
                        'Mới'
                      }
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.textLight }}>Ngày đăng</div>
                  </div>
                </div>
              </div>

              {/* AMENITIES */}
              {listing.amenities && Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
                <div style={pageStyles.amenitiesSection}>
                  <h4 style={pageStyles.sectionTitle}>
                    <ThunderboltOutlined style={{
                      color: COLORS.warning,
                      fontSize: '18px'
                    }} />
                    <span>Tiện ích</span>
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {listing.amenities.map((amenity, idx) => (
                      <div key={idx} style={pageStyles.amenityTag}>
                        {getAmenityIcon(amenity)}
                        {/* ⭐ FIX: Use display label instead of raw value */}
                        <span>{getAmenityDisplayLabel(amenity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={pageStyles.divider} />

              {/* Contact Actions */}
              <div style={pageStyles.contactSection}>
                <button
                  style={pageStyles.contactButton('primary')}
                  onClick={handleContact}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.primary}60`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.primary}30`;
                  }}
                >
                  <PhoneOutlined style={{ fontSize: '18px' }} />
                  Liên hệ ngay
                </button>

                <button
                  style={pageStyles.contactButton('secondary')}
                  onClick={handleMessage}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = COLORS.primary;
                    e.currentTarget.style.color = COLORS.white;
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${COLORS.primary}50`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = COLORS.white;
                    e.currentTarget.style.color = COLORS.primary;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <MailOutlined style={{ fontSize: '18px' }} />
                  Gửi tin nhắn
                </button>

                <button
                  style={pageStyles.contactButton('favorite', isFavorite)}
                  onClick={handleFavoriteToggle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {isFavorite ? <HeartFilled style={{ fontSize: '18px' }} /> : <HeartOutlined style={{ fontSize: '18px' }} />}
                  <span>
                    {isFavorite ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
                  </span>
                </button>
              </div>

              {/* Owner Info */}
              {listing.landlord && (
                <div style={pageStyles.ownerCard}>
                  <h4 style={pageStyles.sectionTitle}>
                    <UserOutlined style={{
                      color: COLORS.primary,
                      fontSize: '18px'
                    }} />
                    <span>Chủ nhà</span>
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={pageStyles.avatar}>
                      <HomeFilled style={{ color: COLORS.white, fontSize: '26px' }} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: COLORS.text,
                        marginBottom: '4px'
                      }}>
                        {listing.landlord.name || 'Chủ sở hữu'}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: COLORS.textLight,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <SafetyCertificateOutlined />
                        Đã xác thực
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPage;

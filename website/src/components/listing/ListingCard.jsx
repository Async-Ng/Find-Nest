import React, { useState, useRef } from "react";
import { Card, Tag, Button, Tooltip } from "antd";
import {
  HeartFilled,
  HeartOutlined,
  HomeOutlined,
  CalendarOutlined,
  EnvironmentOutlined
} from "@ant-design/icons";
import { publicApi } from "../../services/api";

const ListingCard = ({ listing, onRemoveFavorite, onClickDetail, onFavorite, isFavorited }) => {
  const [currentImage, setCurrentImage] = useState(listing.images?.[0] || "https://baohanh.365group.com.vn/upload/images/defaults/page_not_found.jpg");
  const [imageIndex, setImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(isFavorited ?? listing?.isFavorite ?? false);
  const slideTimer = useRef(null);

  const listingId = listing?.listingId || listing?.id;

  // Auto slideshow
  const startSlideshow = () => {
    if (!listing.images || listing.images.length <= 1) return;
    if (slideTimer.current) return;
    slideTimer.current = setInterval(() => {
      setImageIndex(prev => {
        const next = (prev + 1) % listing.images.length;
        setCurrentImage(listing.images[next]);
        return next;
      });
    }, 2500);
  };

  const stopSlideshow = () => {
    clearInterval(slideTimer.current);
    slideTimer.current = null;
    setCurrentImage(listing.images?.[0] || "https://baohanh.365group.com.vn/upload/images/defaults/page_not_found.jpg");
    setImageIndex(0);
  };

  const toggleFavorite = async (e) => {
    e.stopPropagation();

    try {
      if (isFavorite) {
        await publicApi.removeFavorite(listingId);
      } else {
        await publicApi.addFavorite(listingId);
      }

      setIsFavorite((prev) => !prev);

      // Call parent callback
      if (onFavorite) {
        onFavorite(listingId);
      } else if (onRemoveFavorite) {
        onRemoveFavorite(listingId);
      }
    } catch (error) {
      console.error("Lỗi toggle favorite:", error);
    }
  };

  // ⭐ UPDATE STYLES - Orange Theme Colors
  const cardStyles = {
    card: {
      height: '420px',
      borderRadius: '20px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 140, 66, 0.15)', // ⭐ Orange border
      boxShadow: '0 4px 20px rgba(255, 140, 66, 0.08)', // ⭐ Orange shadow
      transition: 'all 0.3s ease',
      background: '#ffffff',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column'
    },
    imageContainer: {
      height: '280px',
      position: 'relative',
      overflow: 'hidden',
      background: '#f8f9fa'
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.3s ease'
    },
    favoriteButton: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.95)',
      border: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backdropFilter: 'blur(10px)'
    },
    areaTag: {
      position: 'absolute',
      bottom: '12px',
      left: '12px',
      background: 'rgba(255, 140, 66, 0.9)', // ⭐ Orange background
      color: '#ffffff',
      borderRadius: '20px',
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: '600',
      backdropFilter: 'blur(10px)'
    },
    content: {
      padding: '16px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    },
    title: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#2d3748',
      lineHeight: '1.3',
      marginBottom: '8px',
      height: '42px',
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical'
    },
    location: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '13px',
      color: '#718096',
      marginBottom: '8px',
      height: '20px'
    },
    amenities: {
      marginBottom: '12px',
      minHeight: '32px',
      maxHeight: '32px',
      display: 'flex',
      flexWrap: 'nowrap',
      gap: '6px',
      alignItems: 'center',
      overflow: 'hidden'
    },
    amenityTag: {
      background: 'rgba(255, 140, 66, 0.1)', // ⭐ Orange background
      color: '#FF8C42', // ⭐ Orange text
      border: '1px solid rgba(255, 140, 66, 0.2)', // ⭐ Orange border
      borderRadius: '12px',
      padding: '4px 8px',
      fontSize: '11px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      flexShrink: 0
    },
    footer: {
      marginTop: 'auto',
      paddingTop: '12px',
      borderTop: '1px solid rgba(255, 140, 66, 0.1)', // ⭐ Orange border
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px'
    },
    priceSection: {
      flex: 1
    },
    price: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#FF8C42', // ⭐ Solid orange color instead of gradient
      marginBottom: '4px',
      lineHeight: '1.2'
    },
    date: {
      fontSize: '12px',
      color: '#718096',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    detailButton: {
      background: 'linear-gradient(135deg, #FF8C42 0%, #FFB366 100%)', // ⭐ Orange gradient
      border: 'none',
      borderRadius: '12px',
      color: '#ffffff',
      fontWeight: '600',
      padding: '10px 20px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '13px',
      whiteSpace: 'nowrap'
    }
  };

  return (
    <div
      style={cardStyles.card}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(91, 169, 211, 0.15)';
        startSlideshow();
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(91, 169, 211, 0.08)';
        stopSlideshow();
      }}
      onClick={onClickDetail}
    >
      {/* ⭐ IMAGE SECTION - Increased Height */}
      <div style={cardStyles.imageContainer}>
        <img
          src={currentImage}
          alt={listing.title}
          style={cardStyles.image}
          onError={(e) => {
            e.target.src = "https://baohanh.365group.com.vn/upload/images/defaults/page_not_found.jpg";
          }}
        />

        {/* Favorite Button */}
        <button
          style={{
            ...cardStyles.favoriteButton,
            transform: isFavorite ? 'scale(1.1)' : 'scale(1)'
          }}
          onClick={toggleFavorite}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.15)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = isFavorite ? 'scale(1.1)' : 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          {isFavorite ? (
            <HeartFilled style={{ color: '#ff4d8f', fontSize: '18px' }} />
          ) : (
            <HeartOutlined style={{ color: '#718096', fontSize: '18px' }} />
          )}
        </button>

        {/* Area Tag */}
        {listing.area && (
          <div style={cardStyles.areaTag}>
            <HomeOutlined style={{ marginRight: '4px', fontSize: '12px' }} />
            {listing.area}m²
          </div>
        )}
      </div>

      {/* ⭐ CONTENT SECTION - No Description */}
      <div style={cardStyles.content}>
        {/* Title - Increased Size */}
        <h3 style={cardStyles.title}>
          {listing.title}
        </h3>

        {/* ⭐ REMOVED: Description section */}

        {/* Location - Increased Size */}
        <div style={cardStyles.location}>
          <EnvironmentOutlined style={{ color: '#5ba9d3', marginRight: '8px', fontSize: '16px' }} />
          <span>
            {listing.address?.district || listing.location?.district}, {listing.address?.city || listing.location?.city || "TP.HCM"}
          </span>
        </div>

        {/* Amenities - Single Row Only */}
        <div style={cardStyles.amenities}>
          {listing.amenities && listing.amenities.length > 0 ? (
            <>
              {/* ⭐ CALCULATE how many amenities can fit */}
              {listing.amenities.slice(0, 3).map((amenity, index) => (
                <span key={index} style={cardStyles.amenityTag}>
                  {amenity.length > 8 ? amenity.substring(0, 8) + '...' : amenity}
                </span>
              ))}
              {listing.amenities.length > 3 && (
                <span style={{
                  ...cardStyles.amenityTag,
                  background: '#f8f9fa',
                  color: '#718096',
                  minWidth: '32px', // ⭐ FIXED WIDTH for +count
                  textAlign: 'center'
                }}>
                  +{listing.amenities.length - 3}
                </span>
              )}
            </>
          ) : (
            <span style={{
              ...cardStyles.amenityTag,
              background: '#f8f9fa',
              color: '#718096'
            }}>
              Chưa có tiện ích
            </span>
          )}
        </div>

        {/* ⭐ FOOTER - Enhanced Spacing */}
        <div style={cardStyles.footer}>
          <div style={cardStyles.priceSection}>
            <div style={cardStyles.price}>
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(listing.price || listing.monthlyRent || 0)}
            </div>
            {listing.createdAt && (
              <div style={cardStyles.date}>
                <CalendarOutlined />
                {new Date(listing.createdAt).toLocaleDateString("vi-VN")}
              </div>
            )}
          </div>

          <button
            style={cardStyles.detailButton}
            onClick={(e) => {
              e.stopPropagation();
              onClickDetail();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(91, 169, 211, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;

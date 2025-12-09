import React, { useState, useEffect } from "react";
import { Badge, Empty } from "antd";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ListingCard from "../../components/listing/ListingCard";
import Filters from "../../components/listing/Filters";
import Swal from "sweetalert2";
import { publicApi } from "../../services/api";

const FavoriteListingsPage = () => {
  const navigate = useNavigate();
  const reduxFavorites = useSelector((state) => state.bootstrap?.favorites || []);
  const [listings, setListings] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceFilter, setPriceFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const COLORS = {
    primary: '#5ba9d3',
    primaryLight: '#e8f4f8',
    primaryDark: '#4a8fb5',
    secondary: '#7bc4e0',
    white: '#FFFFFF',
    gray: '#F8F9FA',
    border: '#E0E6ED',
    text: '#2D3748',
    textLight: '#718096',
    success: '#28A745',
    error: '#DC3545',
    warning: '#FFC107'
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const favs = reduxFavorites.length > 0 ? reduxFavorites : await publicApi.getFavorites();
      const details = await Promise.all(favs.map(f => publicApi.getListingDetail(f.listingId)));
      const withFavoriteFlag = details.map(d => ({ ...d, isFavorite: true }));
      setListings(withFavoriteFlag);
    } catch (err) {
      console.error(err);
      Swal.fire("Lỗi", "Không thể tải danh sách yêu thích", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (listingId) => {
    try {
      setListings(prev => prev.filter(l => l.listingId !== listingId));
      await publicApi.removeFavorite(listingId);
      Swal.fire("Thành công", "Đã xóa khỏi danh sách yêu thích", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Lỗi", "Xóa thất bại", "error");
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [reduxFavorites]);

  const filtered = listings
    .filter(l => l.title.toLowerCase().includes(searchText.toLowerCase()) || l.address.district.toLowerCase().includes(searchText.toLowerCase()))
    .filter(l => {
      if (priceFilter === "low") return l.price < 3000000;
      if (priceFilter === "medium") return l.price >= 3000000 && l.price <= 5000000;
      if (priceFilter === "high") return l.price > 5000000;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "area-desc") return b.area - a.area;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-orange-100">
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(to bottom right, white, rgb(239 246 255), rgb(255 237 213))',
        padding: '24px 0',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 4px 20px rgba(91, 169, 211, 0.2)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }} >
          <h1 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-1px', color: '#3A3A3A', textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}>
            Danh sách yêu thích
          </h1>
          <p style={{ fontSize: '18px', marginBottom: '0', color: '#3A3A3A' }}>
            Quản lý các bài đăng bạn đã lưu
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Filter Card */}
        <div style={{
          background: COLORS.white,
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)',
          border: `1px solid ${COLORS.border}`,
          marginBottom: '24px'
        }}>
          <Filters
            searchText={searchText}
            setSearchText={setSearchText}
            sortBy={sortBy}
            setSortBy={setSortBy}
            priceFilter={priceFilter}
            setPriceFilter={setPriceFilter}
          />
        </div>

        {/* Listings */}
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            background: COLORS.white,
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)'
          }}>
            <p style={{ color: COLORS.textLight, marginTop: '16px', fontSize: '18px' }}>Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: COLORS.white,
            borderRadius: '20px',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)'
          }}>
            <Empty description="Chưa có bài viết yêu thích nào" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(listing => (
              <ListingCard
                key={listing.listingId}
                listing={listing}
                onRemoveFavorite={handleRemoveFavorite}
                onClickDetail={() => navigate(`/listing/${listing.listingId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoriteListingsPage;

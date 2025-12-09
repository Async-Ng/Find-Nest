import React, { useState, useEffect } from "react";
import {
    Badge,
    Empty,
    message,
    Spin,
    Avatar,
    Dropdown,
    Button,
    Input,
    Select,
    Pagination
} from "antd";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    UserOutlined,
    HeartOutlined,
    SettingOutlined,
    LogoutOutlined,
    BellOutlined,
    HomeOutlined,
    GlobalOutlined,
    SearchOutlined,
    FilterOutlined,
    SortAscendingOutlined
} from "@ant-design/icons";
import Swal from "sweetalert2";
import ListingCard from "../../components/listing/ListingCard";
import Filters from "../../components/listing/Filters";
import SearchBar from "../../components/listing/SearchBar"; // ⭐ Import SearchBar
import { listingApi, publicApi } from "../../services/api";

const ListingPage = () => {
    const navigate = useNavigate();
    const reduxFavorites = useSelector((state) => state.bootstrap?.favorites || []);
    const [listings, setListings] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [selectedLocation, setSelectedLocation] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [listingMode, setListingMode] = useState("rent");
    const [sortBy, setSortBy] = useState("newest");
    const [priceFilter, setPriceFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    // Get user info
    const userName = localStorage.getItem('userName') || 'Người dùng';
    const userRole = localStorage.getItem('userRole') || localStorage.getItem('userType') || 'user';
    const isLoggedIn = !!localStorage.getItem('accessToken');
    const userId = localStorage.getItem("userId");

    // ⭐ ENHANCED SEARCH FUNCTION - Support title matching
    const fetchListings = async () => {
        try {
            setLoading(true);

            const filters = {};
            if (selectedLocation) filters.city = selectedLocation;
            if (selectedType) filters.propertyType = selectedType;
            if (listingMode) filters.listingType = listingMode;

            // ⭐ ENHANCED: Search by title/description/keywords
            if (searchText && searchText.trim()) {
                filters.q = searchText.trim();
                // Also search in title and description
                filters.title = searchText.trim();
                filters.description = searchText.trim();
                filters.keywords = searchText.trim();
            }

            // Price filter
            if (priceFilter === "low") {
                filters.maxPrice = 3000000;
            } else if (priceFilter === "medium") {
                filters.minPrice = 3000000;
                filters.maxPrice = 5000000;
            } else if (priceFilter === "high") {
                filters.minPrice = 5000000;
            }

            console.log('🔍 Searching with filters:', filters);

            const data = await listingApi.getAllListings(page, 20, filters);

            let listingsData = [];
            if (Array.isArray(data)) {
                listingsData = data;
            } else if (data.listings) {
                listingsData = data.listings;
            } else if (data.data) {
                listingsData = data.data;
            }

            // ⭐ ENHANCED: Client-side filtering for better search results
            if (searchText && searchText.trim()) {
                const searchTerm = searchText.trim().toLowerCase();
                listingsData = listingsData.filter(listing => {
                    const title = (listing.title || '').toLowerCase();
                    const description = (listing.description || '').toLowerCase();
                    const address = (listing.address?.street || listing.address?.ward || listing.address?.district || '').toLowerCase();
                    const amenities = (listing.amenities || []).join(' ').toLowerCase();

                    return title.includes(searchTerm) ||
                        description.includes(searchTerm) ||
                        address.includes(searchTerm) ||
                        amenities.includes(searchTerm);
                });

                console.log(`🎯 Found ${listingsData.length} listings matching "${searchText}"`);
            }

            // Compare with Redux favorites and mark them
            const listingsWithFavorites = listingsData.map((listing) => ({
                ...listing,
                isFavorite: reduxFavorites.some(
                    (fav) => fav.listingId === (listing.listingId || listing.id)
                ),
            }));

            setListings(listingsWithFavorites);
            setTotal(data.total || listingsWithFavorites.length);

            // ⭐ Show search results message
            if (searchText && searchText.trim()) {
                if (listingsWithFavorites.length > 0) {
                    message.success({
                        content: `Tìm thấy ${listingsWithFavorites.length} kết quả cho "${searchText}"`,
                        duration: 3,
                        style: { marginTop: '80px' }
                    });
                } else {
                    message.warning({
                        content: `Không tìm thấy phòng trọ nào có tên "${searchText}"`,
                        duration: 4,
                        style: { marginTop: '80px' }
                    });
                }
            }

        } catch (err) {
            console.error('❌ Search error:', err);
            message.error("Không thể tải danh sách phòng trọ");
            setListings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFavoriteToggle = async (listingId, currentState) => {
        try {
            if (currentState) {
                await publicApi.removeFavorite(listingId);
                Swal.fire({
                    icon: "success",
                    title: "Thành công",
                    text: "Đã bỏ yêu thích",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await publicApi.addFavorite(listingId);
                Swal.fire({
                    icon: "success",
                    title: "Thành công",
                    text: "Đã thêm vào yêu thích",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }

            // Apply UI immediately
            setListings((prev) =>
                prev.map((item) =>
                    item.listingId === listingId || item.id === listingId
                        ? { ...item, isFavorite: !currentState }
                        : item
                )
            );
        } catch (error) {
            console.error("Lỗi toggle favorite:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể thay đổi yêu thích",
                timer: 1500,
                showConfirmButton: false,
            });
        }
    };

    const sortOptions = [
        { label: 'Mới nhất', value: 'newest' },
        { label: 'Giá thấp đến cao', value: 'price-asc' },
        { label: 'Giá cao đến thấp', value: 'price-desc' },
        { label: 'Diện tích lớn nhất', value: 'area-desc' }
    ];

    // ⭐ Reset page when search changes
    useEffect(() => {
        setPage(1); // Reset to first page when search changes
    }, [searchText, selectedLocation, selectedType, priceFilter]);

    useEffect(() => {
        fetchListings();
    }, [page, selectedLocation, selectedType, listingMode, priceFilter, reduxFavorites]);

    // Sort listings
    const sortedListings = [...listings].sort((a, b) => {
        if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === "price-asc") return (a.price || a.monthlyRent || 0) - (b.price || b.monthlyRent || 0);
        if (sortBy === "price-desc") return (b.price || b.monthlyRent || 0) - (a.price || a.monthlyRent || 0);
        if (sortBy === "area-desc") return (b.area || 0) - (a.area || 0);
        return 0;
    });

    // ⭐ ENHANCED STYLES với ORANGE THEME
    const pageStyles = {
        container: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #fffaf5 0%, #fff5ed 100%)', // ⭐ Orange tint
            width: '100%',
            overflowX: 'hidden'
        },
        searchSection: {
            background: 'linear-gradient(135deg, #FF8C42 0%, #FFB366 100%)', // ⭐ Orange gradient
            padding: '40px 16px',
            borderRadius: '0 0 24px 24px'
        },
        searchContainer: {
            maxWidth: '900px',
            margin: '0 auto'
        },
        searchTitle: {
            fontSize: '32px',
            fontWeight: '700',
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: '16px',
            letterSpacing: '-0.5px'
        },
        searchSubtitle: {
            fontSize: '16px',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            marginBottom: '32px'
        },
        searchBarContainer: {
            display: 'flex',
            justifyContent: 'center',
            padding: '0 16px'
        },
        contentSection: {
            padding: '24px 16px',
            maxWidth: '1600px',
            margin: '0 auto'
        },
        controlsBar: {
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(255, 140, 66, 0.1)', // ⭐ Orange shadow
            padding: '20px',
            marginBottom: '24px'
        },
        filterButton: (active) => ({
            height: '40px',
            padding: '0 16px',
            borderRadius: '10px',
            border: `2px solid ${active ? '#FF8C42' : '#e0e6ed'}`, // ⭐ Orange border
            background: active ? 'rgba(255, 140, 66, 0.1)' : '#ffffff', // ⭐ Orange background
            color: active ? '#FF8C42' : '#718096', // ⭐ Orange text
            fontWeight: '600',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
        }),
        resultsInfo: {
            color: '#718096'
        },
        resultsCount: {
            color: '#FF8C42', // ⭐ Orange
            fontWeight: '700'
        },
        resultsCard: {
            background: '#ffffff',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '24px',
            boxShadow: '0 2px 12px rgba(255, 140, 66, 0.08)', // ⭐ Orange shadow
            border: '1px solid rgba(255, 140, 66, 0.1)' // ⭐ Orange border
        },
        pageIndicator: {
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF8C42 0%, #FFB366 100%)', // ⭐ Orange gradient
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '16px'
        },
        filterTag: {
            padding: '6px 12px',
            background: 'rgba(255, 140, 66, 0.1)', // ⭐ Orange background
            color: '#FF8C42', // ⭐ Orange text
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
        },
        emptyCard: {
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(255, 140, 66, 0.1)', // ⭐ Orange shadow
            padding: '48px'
        },
        clearButton: {
            background: 'linear-gradient(135deg, #FF8C42 0%, #FFB366 100%)', // ⭐ Orange gradient
            border: 'none',
            borderRadius: '12px',
            color: '#ffffff',
            fontWeight: '600',
            padding: '12px 24px',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
        },
        listingsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
        }
    };

    // ⭐ RESPONSIVE CSS
    const responsiveCSS = `
        /* Mobile First */
        @media (max-width: 768px) {
            .listings-grid {
                grid-template-columns: 1fr !important;
                gap: 16px !important;
                padding: 0 8px !important;
            }
        }

        /* Tablet */
        @media (min-width: 769px) and (max-width: 1024px) {
            .listings-grid {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 20px !important;
            }
        }

        /* Desktop */
        @media (min-width: 1025px) and (max-width: 1400px) {
            .listings-grid {
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 24px !important;
            }
        }

        /* Large Desktop */
        @media (min-width: 1401px) {
            .listings-grid {
                grid-template-columns: repeat(4, 1fr) !important;
                gap: 28px !important;
            }
        }
    `;

    return (
        <div style={pageStyles.container}>
            {/* ⭐ RESPONSIVE CSS */}
            <style>{responsiveCSS}</style>

            {/* ⭐ SEARCH SECTION - FIXED */}
            <div style={{
                background: 'linear-gradient(to bottom right, white, rgb(239 246 255), rgb(255 237 213))',
                padding: '40px 16px',
                borderRadius: '0 0 24px 24px'
            }}>
                <div style={pageStyles.searchContainer}>
                    <h1 style={{
                        fontSize: '48px',
                        fontWeight: '800',
                        marginBottom: '16px',
                        letterSpacing: '-1px',
                        color: '#ff8c42',
                        textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff',
                        textAlign: 'center'
                    }}>
                        Tìm kiếm phòng trọ
                    </h1>
                    <p style={{
                        fontSize: '18px',
                        marginBottom: '32px',
                        color: '#e06a1a',
                        textAlign: 'center'
                    }}>
                        Khám phá hàng nghìn phòng trọ chất lượng trên toàn quốc
                    </p>

                    {/* ⭐ FIXED SEARCH BAR */}
                    <div style={pageStyles.searchBarContainer}>
                        <SearchBar
                            searchText={searchText}
                            setSearchText={setSearchText}
                            onSearch={fetchListings}
                            placeholder="Tìm kiếm phòng trọ theo tên, địa chỉ, tiện ích..."
                            maxWidth="700px"
                        />
                    </div>
                </div>
            </div>

            {/* ⭐ MAIN CONTENT */}
            <div style={pageStyles.contentSection}>
                {/* Controls Bar */}
                <div style={pageStyles.controlsBar}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                flexWrap: 'wrap'
                            }}>
                                <button
                                    style={pageStyles.filterButton(showFilters)}
                                    onClick={() => setShowFilters(!showFilters)}
                                    onMouseEnter={(e) => {
                                        if (!showFilters) {
                                            e.currentTarget.style.borderColor = '#5ba9d3';
                                            e.currentTarget.style.color = '#5ba9d3';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!showFilters) {
                                            e.currentTarget.style.borderColor = '#e0e6ed';
                                            e.currentTarget.style.color = '#718096';
                                        }
                                    }}
                                >
                                    <FilterOutlined style={{ marginRight: '8px' }} />
                                    Bộ lọc
                                </button>

                                <div style={pageStyles.resultsInfo}>
                                    {loading ? (
                                        <span>Đang tìm kiếm...</span>
                                    ) : (
                                        <span>
                                            Tìm thấy <span style={pageStyles.resultsCount}>{sortedListings.length}</span> kết quả
                                            {searchText && (
                                                <span> cho "<strong style={{ color: '#5ba9d3' }}>{searchText}</strong>"</span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <SortAscendingOutlined style={{ color: '#718096' }} />
                                <Select
                                    value={sortBy}
                                    onChange={setSortBy}
                                    options={sortOptions}
                                    style={{ minWidth: '160px' }}
                                    size="middle"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Component */}
                {showFilters && (
                    <div style={{ marginBottom: '24px' }}>
                        <Filters
                            searchText={searchText}
                            setSearchText={setSearchText}
                            selectedLocation={selectedLocation}
                            setSelectedLocation={setSelectedLocation}
                            selectedType={selectedType}
                            setSelectedType={setSelectedType}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            priceFilter={priceFilter}
                            setPriceFilter={setPriceFilter}
                            onSearch={fetchListings}
                        />
                    </div>
                )}

                {/* LISTINGS CONTENT */}
                {loading ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '80px 0',
                        background: '#ffffff',
                        borderRadius: '20px',
                        boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)'
                    }}>
                        <Spin size="large" />
                        <p style={{
                            color: '#718096',
                            marginTop: '16px',
                            fontSize: '18px'
                        }}>
                            Đang tải dữ liệu...
                        </p>
                    </div>
                ) : sortedListings.length === 0 ? (
                    <div style={pageStyles.emptyCard}>
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <div style={{ textAlign: 'center' }}>
                                    <h3 style={{
                                        fontSize: '20px',
                                        fontWeight: '600',
                                        color: '#2d3748',
                                        marginBottom: '12px'
                                    }}>
                                        {searchText ? `Không tìm thấy phòng trọ cho "${searchText}"` : 'Không tìm thấy kết quả'}
                                    </h3>
                                    <p style={{
                                        color: '#718096',
                                        marginBottom: '24px',
                                        fontSize: '16px'
                                    }}>
                                        {searchText ? 'Thử tìm với từ khóa khác hoặc bỏ bộ lọc' : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'}
                                    </p>
                                    <button
                                        style={pageStyles.clearButton}
                                        onClick={() => {
                                            setSearchText("");
                                            setSelectedLocation("");
                                            setSelectedType("");
                                            setPriceFilter("all");
                                            fetchListings();
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(91, 169, 211, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        Xóa bộ lọc
                                    </button>
                                </div>
                            }
                        />
                    </div>
                ) : (
                    <>
                        {/* Results Summary */}
                        <div style={pageStyles.resultsCard}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '16px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={pageStyles.pageIndicator}>
                                        {sortedListings.length}
                                    </div>
                                    <div>
                                        <p style={{
                                            fontSize: '14px',
                                            color: '#718096',
                                            margin: 0
                                        }}>
                                            Kết quả tìm kiếm
                                        </p>
                                        <p style={{
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: '#2d3748',
                                            margin: 0
                                        }}>
                                            {searchText ? `"${searchText}"` : `Trang ${page} / ${Math.ceil(total / 20)}`}
                                        </p>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px'
                                }}>
                                    {searchText && (
                                        <span style={pageStyles.filterTag}>
                                            🔍 {searchText}
                                        </span>
                                    )}
                                    {selectedLocation && (
                                        <span style={pageStyles.filterTag}>
                                            📍 {selectedLocation}
                                        </span>
                                    )}
                                    {selectedType && (
                                        <span style={pageStyles.filterTag}>
                                            🏠 {selectedType}
                                        </span>
                                    )}
                                    {priceFilter !== 'all' && (
                                        <span style={pageStyles.filterTag}>
                                            💰 {priceFilter === 'low' ? 'Dưới 3 triệu' : priceFilter === 'medium' ? '3-5 triệu' : 'Trên 5 triệu'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ⭐ ENHANCED GRID LAYOUT */}
                        <div className="listings-grid" style={pageStyles.listingsGrid}>
                            {sortedListings.map((listing) => (
                                <ListingCard
                                    key={listing.listingId || listing.id}
                                    listing={listing}
                                    onFavorite={(id) => handleFavoriteToggle(id, listing.isFavorite)}
                                    onView={(id) => navigate(`/listings/${id}`)}
                                    onClickDetail={() => navigate(`/listings/${listing.listingId || listing.id}`)}
                                    isFavorited={listing.isFavorite}
                                    loading={false}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {total > 20 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginTop: '32px'
                            }}>
                                <div style={{
                                    background: '#ffffff',
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)',
                                    padding: '16px'
                                }}>
                                    <Pagination
                                        current={page}
                                        total={total}
                                        pageSize={20}
                                        onChange={setPage}
                                        showSizeChanger={false}
                                        showQuickJumper
                                        showTotal={(total, range) =>
                                            `${range[0]}-${range[1]} của ${total} kết quả`
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ListingPage;
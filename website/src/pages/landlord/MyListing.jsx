import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Empty,
    message,
    Modal,
    Tag,
    Input,
    Spin,
    Tooltip,
    Button,
    Pagination,
    Card,
    Row,
    Col,
    Space,
    Statistic
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    SearchOutlined,
    ExclamationCircleOutlined,
    EnvironmentOutlined,
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    DashboardOutlined,
    HomeOutlined,
    HeartOutlined,
    BellOutlined,
    GlobalOutlined,
    FilterOutlined,
    CalendarOutlined,
    DollarOutlined,
    AreaChartOutlined,
    BankOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    CameraOutlined,
    BuildOutlined,
    ArrowLeftOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { listingApi, publicApi } from '../../services/api'; // ⭐ Add publicApi
import ListingCard from '../../components/listing/ListingCard';
import { useSelector, useDispatch } from 'react-redux';

const { confirm } = Modal;

const MyListing = () => {
    const navigate = useNavigate();

    // ⭐ Redux state  
    const reduxFavorites = useSelector((state) => state.bootstrap?.favorites || []);
    const dispatch = useDispatch();

    // State
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState('');
    // ⭐ REMOVE: statusFilter (không còn dùng)
    // const [statusFilter, setStatusFilter] = useState(''); 
    const [userRole, setUserRole] = useState('');
    const [userName, setUserName] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    const COLORS = {
        primary: '#ff8c42',
        primaryLight: '#fff5eb',
        primaryDark: '#e06a1a',
        secondary: '#ffb366',
        white: '#FFFFFF',
        gray: '#F8F9FA',
        border: '#ffe4cc',
        text: '#2D3748',
        textLight: '#718096',
        success: '#28A745',
        error: '#DC3545',
        warning: '#FFC107',
        background: 'linear-gradient(to bottom right, rgb(255 251 235), rgb(254 243 199), rgb(255 237 213))'
    };

    const pageStyles = {
        container: {
            minHeight: '100vh',
            background: 'linear-gradient(to bottom right, rgb(255 251 235), rgb(254 243 199), rgb(255 237 213))',
            margin: 0,
            padding: 0,
            width: '100%',
            maxWidth: '100vw',
            overflowX: 'hidden'
        },
        headerSection: {
            background: 'linear-gradient(to bottom right, white, rgb(239 246 255), rgb(255 237 213))',
            padding: '24px 0',
            borderRadius: '0 0 24px 24px',
            boxShadow: '0 4px 20px rgba(91, 169, 211, 0.2)'
        },
        headerContainer: {
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 24px'
        },
        headerTop: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
        },
        backButton: {
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.3)',
            color: COLORS.white,
            borderRadius: '12px',
            padding: '8px 16px',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
        },
        userInfo: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: COLORS.white
        },
        avatar: {
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.3)'
        },
        headerContent: {
            textAlign: 'center'
        },
        title: {
            fontSize: '48px',
            fontWeight: '800',
            marginBottom: '16px',
            letterSpacing: '-1px',
            color: '#ff8c42',
            textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff'
        },
        subtitle: {
            fontSize: '18px',
            marginBottom: '32px',
            color: '#e06a1a'
        },
        createButton: {
            background: 'linear-gradient(135deg, #e06a1a 0%, #ff8c42 100%)',
            color: COLORS.white,
            border: 'none',
            borderRadius: '16px',
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: '700',
            height: '56px',
            boxShadow: '0 4px 20px rgba(224, 106, 26, 0.3)',
            transition: 'all 0.3s ease'
        },
        mainContent: {
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '32px 24px'
        },
        statCard: {
            background: COLORS.white,
            borderRadius: '20px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)',
            border: `1px solid ${COLORS.border}`,
            transition: 'all 0.3s ease'
        },
        filterCard: {
            background: COLORS.white,
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)',
            border: `1px solid ${COLORS.border}`,
            marginBottom: '24px'
        },
        listingCard: {
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)',
            border: `1px solid ${COLORS.border}`,
            transition: 'all 0.3s ease',
            height: '100%'
        },
        actionButton: (type) => {
            const styles = {
                view: {
                    color: COLORS.primary,
                    borderColor: COLORS.primary
                },
                edit: {
                    color: COLORS.secondary,
                    borderColor: COLORS.secondary
                },
                delete: {
                    color: COLORS.error,
                    borderColor: COLORS.error
                }
            };
            return {
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                ...styles[type]
            };
        }
    };

    // CHECK AUTHENTICATION & ROLE
    useEffect(() => {
        checkAuth();
    }, []);

    // ⭐ UPDATE useEffect - Remove statusFilter dependency
    useEffect(() => {
        if (userRole) {
            fetchMyListings();
        }
    }, [page, userRole, reduxFavorites]); // ⭐ Added reduxFavorites

    const checkAuth = () => {
        try {
            const token = localStorage.getItem('accessToken');
            let role = localStorage.getItem('userRole');
            let userType = localStorage.getItem('userType');
            const name = localStorage.getItem('userName') || 'Chủ nhà';

            if (!token) {
                message.error('Vui lòng đăng nhập');
                navigate('/user/loginPage');
                return;
            }

            const normalizedRole = (role || '').trim().toLowerCase();
            const normalizedUserType = (userType || '').trim().toLowerCase();

            const isAuthorized =
                normalizedRole === 'landlord' ||
                normalizedRole === 'admin' ||
                normalizedUserType === 'landlord' ||
                normalizedUserType === 'admin';

            if (!isAuthorized) {
                message.warning('Bạn cần có quyền chủ nhà để truy cập trang này');
                navigate('/user/listings');
                return;
            }

            const finalRole = normalizedRole || normalizedUserType;
            setUserRole(finalRole);
            setUserName(name);

        } catch (error) {
            console.error('❌ Auth check error:', error);
            message.error('Lỗi xác thực');
            navigate('/user/loginPage');
        }
    };

    const fetchMyListings = async () => {
        try {
            setLoading(true);

            const userDataString = localStorage.getItem('user');
            let userId = null;

            if (userDataString) {
                try {
                    const userData = JSON.parse(userDataString);
                    userId = userData.userId || userData.id || userData.sub;
                } catch (error) {
                    console.error('❌ Parse user data error:', error);
                }
            }

            if (!userId) {
                const idToken = localStorage.getItem('idToken');
                if (idToken) {
                    try {
                        const payload = JSON.parse(atob(idToken.split('.')[1]));
                        userId = payload.sub || payload.userId || payload['cognito:username'];
                    } catch (error) {
                        console.error('❌ Parse idToken error:', error);
                    }
                }
            }

            if (!userId) {
                message.error('Không tìm thấy thông tin người dùng');
                navigate('/user/loginPage');
                return;
            }

            const data = await listingApi.getAllListings(1, 1000);

            let listingsData = [];
            if (Array.isArray(data)) {
                listingsData = data;
            } else if (data.listings) {
                listingsData = data.listings;
            } else if (data.data) {
                listingsData = data.data;
            } else if (data.Items) {
                listingsData = data.Items;
            }

            let myListings = listingsData.filter(listing => {
                const listingUserId = listing.userId || listing.landlordId || listing.ownerId || listing.createdBy;
                return listingUserId &&
                    (listingUserId === userId || listingUserId.trim() === userId.trim());
            });

            if (searchText) {
                myListings = myListings.filter(item => {
                    const searchLower = searchText.toLowerCase();
                    const titleMatch = item.title?.toLowerCase().includes(searchLower);

                    let addressMatch = false;
                    if (item.address) {
                        if (typeof item.address === 'string') {
                            addressMatch = item.address.toLowerCase().includes(searchLower);
                        } else if (typeof item.address === 'object') {
                            const addressParts = [
                                item.address.street,
                                item.address.ward,
                                item.address.district,
                                item.address.city
                            ].filter(Boolean);
                            addressMatch = addressParts.some(part =>
                                part?.toLowerCase().includes(searchLower)
                            );
                        }
                    }

                    let locationMatch = false;
                    if (item.location) {
                        const locationParts = [
                            item.location.street,
                            item.location.ward,
                            item.location.district,
                            item.location.city
                        ].filter(Boolean);
                        locationMatch = locationParts.some(part =>
                            part?.toLowerCase().includes(searchLower)
                        );
                    }

                    return titleMatch || addressMatch || locationMatch;
                });
            }

            // ⭐ ADD: Mark favorites in listings
            const listingsWithFavorites = myListings.map((listing) => ({
                ...listing,
                isFavorite: reduxFavorites.some(
                    (fav) => fav.listingId === (listing.listingId || listing.id)
                ),
            }));

            const pageSize = 20;
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedListings = listingsWithFavorites.slice(startIndex, endIndex);

            setListings(paginatedListings);
            setTotal(listingsWithFavorites.length);

        } catch (error) {
            console.error('❌ Fetch my listings error:', error);

            if (error.status === 401 || error.status === 403) {
                message.error('Phiên đăng nhập hết hạn');
                navigate('/user/loginPage');
            } else {
                message.error('Không thể tải danh sách bài đăng');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchMyListings();
    };

    const handleCreateNew = () => {
        navigate('/landlord/create-listing');
    };

    // UPDATED: Navigate to EditListing
    const handleEdit = (listingId) => {
        console.log('🔧 Navigating to edit listing:', listingId);
        navigate(`/landlord/edit-listing/${listingId}`);
    };

    // ⭐ ALTERNATIVE: Simple confirmation without CloseOutlined
    const handleDelete = async (listingId, title) => {
        try {
            await confirm({
                title: 'Xác nhận xóa bài đăng',
                content: (
                    <div style={{ padding: '16px 0' }}>
                        <div style={{
                            background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.white} 100%)`,
                            padding: '16px',
                            borderRadius: '12px',
                            border: `2px solid ${COLORS.primary}20`,
                            marginBottom: '20px'
                        }}>
                            <h4 style={{
                                margin: '0 0 8px 0',
                                color: COLORS.primary,
                                fontSize: '16px',
                                fontWeight: '600'
                            }}>
                                📋 Bài đăng sẽ bị xóa:
                            </h4>
                            <p style={{
                                margin: '0',
                                fontSize: '15px',
                                color: COLORS.text,
                                fontWeight: '500',
                                lineHeight: '1.4'
                            }}>
                                "{title}"
                            </p>
                        </div>

                        <div style={{
                            background: 'rgba(255, 77, 79, 0.05)',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '2px solid rgba(255, 77, 79, 0.2)',
                            marginBottom: '16px'
                        }}>
                            <h4 style={{
                                margin: '0 0 12px 0',
                                color: COLORS.error,
                                fontSize: '15px',
                                fontWeight: '700'
                            }}>
                                ⚠️ Cảnh báo quan trọng
                            </h4>
                            <ul style={{
                                margin: '0',
                                paddingLeft: '20px',
                                color: COLORS.text,
                                fontSize: '14px',
                                lineHeight: '1.6'
                            }}>
                                <li><strong>Hành động này không thể hoàn tác</strong></li>
                                <li>Tất cả thông tin bài đăng sẽ bị xóa vĩnh viễn</li>
                                <li>Hình ảnh và dữ liệu liên quan sẽ bị mất</li>
                            </ul>
                        </div>
                    </div>
                ),
                width: 520,
                centered: true,
                maskClosable: false,
                keyboard: false,

                // ⭐ SIMPLIFIED: Remove icons from button text
                okText: 'Xóa bài đăng',
                cancelText: 'Hủy bỏ',
                okType: 'danger',
                okButtonProps: {
                    size: 'large',
                    style: {
                        background: `linear-gradient(135deg, ${COLORS.error} 0%, #dc2626 100%)`,
                        borderColor: COLORS.error,
                        fontWeight: '700',
                        height: '44px',
                        borderRadius: '10px',
                        boxShadow: `0 4px 12px ${COLORS.error}40`
                    }
                },
                cancelButtonProps: {
                    size: 'large',
                    style: {
                        borderColor: COLORS.border,
                        color: COLORS.text,
                        fontWeight: '600',
                        height: '44px',
                        borderRadius: '10px',
                        background: COLORS.white
                    }
                },
                autoFocusButton: 'cancel'
            });

            // ⭐ Continue with delete logic...
            setDeletingId(listingId);
            await new Promise(resolve => setTimeout(resolve, 500));
            await listingApi.deleteListing(listingId);

            // ⭐ Success feedback
            message.success({
                content: `Đã xóa "${title}" thành công!`,
                duration: 4,
                style: {
                    marginTop: '20px',
                    fontSize: '15px'
                }
            });

            // ⭐ Update UI
            setListings(prevListings =>
                prevListings.filter(listing =>
                    (listing.listingId || listing.id) !== listingId
                )
            );

            setTotal(prevTotal => Math.max(0, prevTotal - 1));

            const remainingItems = total - 1;
            const maxPage = Math.ceil(remainingItems / 20);

            if (page > maxPage && maxPage > 0) {
                setPage(maxPage);
            } else if (remainingItems === 0) {
                fetchMyListings();
            }

        } catch (error) {
            if (error.dismissed) {
                message.info({
                    content: 'Đã hủy xóa bài đăng',
                    duration: 2
                });
                return;
            }

            console.error('Error deleting listing:', error);

            // ⭐ Error handling
            let errorMessage = 'Có lỗi xảy ra khi xóa bài đăng';

            if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn';
            } else if (error.response?.status === 403) {
                errorMessage = 'Không có quyền xóa bài đăng';
            } else if (error.response?.status === 404) {
                errorMessage = 'Bài đăng không tồn tại';
            }

            message.error({
                content: errorMessage,
                duration: 4,
                style: { marginTop: '20px' }
            });

            if (error.response?.status === 401) {
                setTimeout(() => navigate('/user/loginPage'), 2000);
            } else if (error.response?.status === 404) {
                setListings(prevListings =>
                    prevListings.filter(listing =>
                        (listing.listingId || listing.id) !== listingId
                    )
                );
            }

        } finally {
            setDeletingId(null);
        }
    };

    const handleLogout = () => {
        confirm({
            title: 'Đăng xuất',
            icon: <ExclamationCircleOutlined />,
            content: 'Bạn có chắc chắn muốn đăng xuất?',
            okText: 'Đăng xuất',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: () => {
                localStorage.clear();
                message.success('Đã đăng xuất');
                navigate('/user/loginPage');
            },
        });
    };

    const formatPrice = (price) => {
        if (!price) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getStatusConfig = (status) => {
        const configs = {
            available: {
                color: 'success',
                icon: <CheckCircleOutlined />,
                text: 'Còn trống'
            },
            rented: {
                color: 'error',
                icon: <CloseCircleOutlined />,
                text: 'Đã thuê'
            },
            pending: {
                color: 'warning',
                icon: <ClockCircleOutlined />,
                text: 'Chờ duyệt'
            }
        };
        return configs[status] || configs.available;
    };

    // ⭐ UPDATE clear filters function
    const clearFilters = () => {
        setSearchText('');
        // ⭐ REMOVED: setStatusFilter('');
        setPage(1);
        setTimeout(fetchMyListings, 100);
    };

    // ⭐ ADD: Favorite toggle handler for landlord
    const handleFavoriteToggle = async (listingId, currentState) => {
        try {
            if (currentState) {
                await publicApi.removeFavorite(listingId);
                message.success('Đã bỏ yêu thích');
            } else {
                await publicApi.addFavorite(listingId);
                message.success('Đã thêm vào yêu thích');
            }

            // ⭐ Update listings state immediately
            setListings((prev) =>
                prev.map((item) =>
                    (item.listingId === listingId || item.id === listingId)
                        ? { ...item, isFavorite: !currentState }
                        : item
                )
            );
        } catch (error) {
            console.error("Lỗi toggle favorite:", error);
            message.error("Không thể thay đổi yêu thích");
        }
    };

    // ⭐ ADD: Missing handleView function
    const handleView = (listingId) => {
        console.log('👁️ Viewing listing:', listingId);
        navigate(`/listings/${listingId}`);
    };

    return (
        <>
            <style jsx global>{`
                * {
                    box-sizing: border-box;
                }
                body {
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow-x: hidden !important;
                    width: 100% !important;
                }
                #root {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                }
                .ant-card {
                    border-radius: 20px !important;
                }
                .ant-card-cover {
                    border-radius: 20px 20px 0 0 !important;
                }
            `}</style>

            <div style={pageStyles.container}>
                {/* NEW HEADER - Thay thế navbar */}
                <div style={pageStyles.headerSection}>
                    <div style={pageStyles.headerContainer}>

                        {/* Main header content */}
                        <div style={pageStyles.headerContent}>
                            <h1 style={pageStyles.title}>Quản lý bài đăng</h1>
                            <p style={pageStyles.subtitle}>
                                Theo dõi và quản lý các tin đăng phòng trọ hiệu quả
                            </p>

                            <button
                                style={pageStyles.createButton}
                                onClick={handleCreateNew}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,255,255,0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,255,255,0.3)';
                                }}
                            >
                                <PlusOutlined style={{ marginRight: '8px' }} />
                                Tạo bài đăng mới
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT với theme mới */}
                <div style={pageStyles.mainContent}>

                    {/* Stats Cards với theme mới - CHỈ TỔNG SỐ */}
                    <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                        <Col xs={24} sm={12} lg={8}>
                            <div
                                style={pageStyles.statCard}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(91, 169, 211, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(91, 169, 211, 0.1)';
                                }}
                            >
                                <Statistic
                                    title={
                                        <Space>
                                            <AreaChartOutlined style={{ color: COLORS.primary }} />
                                            Tổng bài đăng
                                        </Space>
                                    }
                                    value={total}
                                    valueStyle={{ color: COLORS.primary, fontSize: '32px', fontWeight: 'bold' }}
                                />
                            </div>
                        </Col>

                        <Col xs={24} sm={12} lg={8}>
                            <div
                                style={pageStyles.statCard}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(91, 169, 211, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(91, 169, 211, 0.1)';
                                }}
                            >
                                <Statistic
                                    title={
                                        <Space>
                                            <CalendarOutlined style={{ color: COLORS.secondary }} />
                                            Bài đăng tháng này
                                        </Space>
                                    }
                                    value={listings.filter(l => {
                                        if (!l.createdAt) return false;
                                        const created = new Date(l.createdAt);
                                        const now = new Date();
                                        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                                    }).length}
                                    valueStyle={{ color: COLORS.secondary, fontSize: '32px', fontWeight: 'bold' }}
                                />
                            </div>
                        </Col>

                        <Col xs={24} sm={12} lg={8}>
                            <div
                                style={pageStyles.statCard}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(91, 169, 211, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(91, 169, 211, 0.1)';
                                }}
                            >
                                <Statistic
                                    title={
                                        <Space>
                                            <EyeOutlined style={{ color: COLORS.primaryDark }} />
                                            Lượt xem trung bình
                                        </Space>
                                    }
                                    value={Math.round((listings.reduce((acc, l) => acc + (l.views || 0), 0) / listings.length) || 0)}
                                    valueStyle={{ color: COLORS.primaryDark, fontSize: '32px', fontWeight: 'bold' }}
                                />
                            </div>
                        </Col>
                    </Row>

                    {/* Enhanced Filters với theme mới */}
                    <div style={pageStyles.filterCard}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '16px'
                        }}>
                            <FilterOutlined style={{ color: COLORS.primary, fontSize: '18px' }} />
                            <h3 style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: '700',
                                color: COLORS.text
                            }}>
                                Bộ lọc tìm kiếm
                            </h3>
                        </div>

                        {/* ⭐ NEW: Single row, wider input, smaller button */}
                        <Row gutter={16} align="middle">
                            <Col xs={24} md={20} lg={22}>
                                <Input
                                    placeholder="Tìm theo tiêu đề, địa chỉ..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    onPressEnter={handleSearch}
                                    size="large"
                                    allowClear
                                    prefix={<SearchOutlined style={{ color: COLORS.textLight }} />}
                                    style={{
                                        borderRadius: '12px',
                                        border: `2px solid ${COLORS.border}`,
                                        fontSize: '16px',
                                        height: '48px'
                                    }}
                                />
                            </Col>

                            <Col xs={24} md={4} lg={2}>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handleSearch}
                                    style={{
                                        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                                        border: 'none',
                                        borderRadius: '12px',
                                        width: '100%',
                                        height: '48px',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                    icon={<SearchOutlined />}
                                >
                                    Tìm
                                </Button>
                            </Col>
                        </Row>

                        {/* ⭐ ADD: Clear button when searching */}
                        {searchText && (
                            <div style={{ marginTop: '12px', textAlign: 'right' }}>
                                <Button
                                    type="text"
                                    onClick={() => {
                                        setSearchText('');
                                        setPage(1);
                                        setTimeout(fetchMyListings, 100);
                                    }}
                                    style={{
                                        color: COLORS.textLight,
                                        fontSize: '14px'
                                    }}
                                >
                                    <span style={{ textDecoration: 'underline' }}>Xóa bộ lọc</span>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Results Summary với theme mới */}
                    <div style={{
                        ...pageStyles.filterCard,
                        marginBottom: '32px'
                    }}>
                        <Row align="middle" justify="space-between" wrap>
                            <Col xs={24} md={12}>
                                <Space size="large">
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '16px',
                                        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: COLORS.white,
                                        fontWeight: '700',
                                        fontSize: '18px'
                                    }}>
                                        {listings.length}
                                    </div>
                                    <div>
                                        <p style={{
                                            fontSize: '14px',
                                            color: COLORS.textLight,
                                            margin: '0 0 4px 0'
                                        }}>
                                            Bài đăng của bạn
                                        </p>
                                        <p style={{
                                            fontSize: '20px',
                                            fontWeight: '700',
                                            color: COLORS.text,
                                            margin: 0
                                        }}>
                                            Trang {page} / {Math.ceil(total / 20)}
                                        </p>
                                    </div>
                                </Space>
                            </Col>

                            <Col xs={24} md={12} style={{ marginTop: '16px' }}>
                                <Space wrap>
                                    {searchText && (
                                        <Tag color="blue" icon={<SearchOutlined />}>
                                            "{searchText}"
                                        </Tag>
                                    )}
                                </Space>
                            </Col>
                        </Row>
                    </div>

                    {/* Listings với theme mới */}
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
                            <Spin size="large" />
                            <p style={{
                                color: COLORS.textLight,
                                marginTop: '16px',
                                fontSize: '18px'
                            }}>
                                Đang tải dữ liệu...
                            </p>
                        </div>
                    ) : listings.length === 0 ? (
                        <div style={{
                            background: COLORS.white,
                            borderRadius: '20px',
                            padding: '48px 24px',
                            textAlign: 'center',
                            boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)'
                        }}>
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <div>
                                        <h3 style={{
                                            fontSize: '24px',
                                            fontWeight: '600',
                                            color: COLORS.text,
                                            marginBottom: '16px'
                                        }}>
                                            {searchText // ⭐ FIXED: Remove statusFilter reference
                                                ? 'Không tìm thấy kết quả'
                                                : 'Bạn chưa có bài đăng nào'}
                                        </h3>
                                        <p style={{
                                            color: COLORS.textLight,
                                            marginBottom: '24px',
                                            fontSize: '16px'
                                        }}>
                                            {searchText // ⭐ FIXED: Remove statusFilter reference
                                                ? 'Thử điều chỉnh bộ lọc tìm kiếm'
                                                : 'Bắt đầu đăng tin để cho thuê phòng trọ'}
                                        </p>
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<PlusOutlined />}
                                            onClick={handleCreateNew}
                                            style={{
                                                background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                                                border: 'none',
                                                borderRadius: '12px',
                                                height: '48px',
                                                padding: '0 24px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Tạo bài đăng đầu tiên
                                        </Button>
                                    </div>
                                }
                            />
                        </div>
                    ) : (
                        <>
                            {/* Grid Layout với ListingCard + Action Buttons */}
                            <Row gutter={[24, 32]} style={{ marginBottom: '48px' }}>
                                {listings.map((listing) => {
                                    const listingId = listing.listingId || listing.id;

                                    return (
                                        <Col xs={24} md={12} xl={8} key={listingId}>
                                            <div style={{
                                                position: 'relative',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}>
                                                {/* ⭐ ListingCard Component */}
                                                <div style={{ flex: 1, marginBottom: '16px' }}>
                                                    <ListingCard
                                                        listing={listing}
                                                        onClickDetail={() => handleView(listingId)}
                                                        onFavorite={(id) => handleFavoriteToggle(id, listing.isFavorite)} // ⭐ Enable favorite
                                                        isFavorited={listing.isFavorite} // ⭐ Pass actual favorite state
                                                    />
                                                </div>

                                                {/* ⭐ Action Buttons Below Card */}
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '8px',
                                                    padding: '0 4px'
                                                }}>
                                                    <Tooltip title="Chỉnh sửa">
                                                        <Button
                                                            type="default"
                                                            icon={<EditOutlined />}
                                                            onClick={() => handleEdit(listingId)}
                                                            style={{
                                                                flex: 1,
                                                                height: '44px',
                                                                borderRadius: '12px',
                                                                border: `2px solid ${COLORS.secondary}`,
                                                                color: COLORS.secondary,
                                                                fontWeight: '600',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = COLORS.secondary;
                                                                e.currentTarget.style.color = COLORS.white;
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'transparent';
                                                                e.currentTarget.style.color = COLORS.secondary;
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                            }}
                                                        >
                                                            Sửa
                                                        </Button>
                                                    </Tooltip>

                                                    <Tooltip title={deletingId === listingId ? "Đang xóa..." : "Xóa bài đăng"}>
                                                        <Button
                                                            danger
                                                            icon={deletingId === listingId ? <Spin size="small" /> : <DeleteOutlined />}
                                                            onClick={() => handleDelete(listingId, listing.title)}
                                                            disabled={deletingId === listingId}
                                                            style={{
                                                                flex: 1,
                                                                height: '44px',
                                                                borderRadius: '12px',
                                                                border: `2px solid ${COLORS.error}`,
                                                                color: deletingId === listingId ? COLORS.textLight : COLORS.error,
                                                                fontWeight: '600',
                                                                transition: 'all 0.2s ease',
                                                                background: deletingId === listingId ? COLORS.gray : 'transparent',
                                                                cursor: deletingId === listingId ? 'not-allowed' : 'pointer'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (deletingId !== listingId) {
                                                                    e.currentTarget.style.background = COLORS.error;
                                                                    e.currentTarget.style.color = COLORS.white;
                                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 53, 69, 0.3)';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (deletingId !== listingId) {
                                                                    e.currentTarget.style.background = 'transparent';
                                                                    e.currentTarget.style.color = COLORS.error;
                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                    e.currentTarget.style.boxShadow = 'none';
                                                                }
                                                            }}
                                                        >
                                                            {deletingId === listingId ? 'Đang xóa...' : 'Xóa'}
                                                        </Button>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </Col>
                                    );
                                })}
                            </Row>

                            {/* Pagination với theme mới */}
                            {total > 20 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginTop: '32px'
                                }}>
                                    <div style={{
                                        background: COLORS.white,
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
                                                `${range[0]}-${range[1]} của ${total} bài đăng`
                                            }
                                            size="large"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default MyListing;
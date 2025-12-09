import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
    HomeOutlined,
    PlusCircleOutlined,
    UnorderedListOutlined,
    UserOutlined,
    LogoutOutlined,
    MenuOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { Dropdown, Avatar, message } from 'antd';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [openMenu, setOpenMenu] = useState(false);

    // ⭐ THEME COLORS - Orange tone
    const COLORS = {
        primary: '#ff8c42',
        primaryLight: '#fff5eb',
        secondary: '#ffb366',
        white: '#FFFFFF',
        gray: '#F8F9FA',
        border: '#ffe4cc',
        text: '#2D3748',
        textLight: '#718096',
        success: '#28A745',
        error: '#DC3545',
        warning: '#FFC107'
    };

    useEffect(() => {
        // Load user info
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
            try {
                setUser(JSON.parse(userInfo));
            } catch (error) {
                console.error('Error parsing user info:', error);
            }
        }
    }, []);

    // NAVIGATION ITEMS - Updated home path
    const navItems = [
       
        {
            key: 'create',
            label: 'Đăng tin',
            icon: <PlusCircleOutlined />,
            path: '/landlord/create-listing',
            description: 'Tạo bài đăng mới'
        },
        {
            key: 'manage',
            label: 'Quản lý',
            icon: <UnorderedListOutlined />,
            path: '/landlord/my-listings',
            description: 'Quản lý bài đăng'
        }
    ];



    function handleLogout() {
        localStorage.clear();
        sessionStorage.clear();
        message.success('Đã đăng xuất thành công');
        navigate('/user/loginPage');
    }

    const isActivePath = (path) => {
        return location.pathname === path;
    };

    // UPDATED STYLES
    const styles = {
        navbar: {
            background: COLORS.white,
            borderBottom: `1px solid ${COLORS.border}`,
            boxShadow: '0 2px 12px rgba(91, 169, 211, 0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            padding: '0 20px',
            width: '100%'
        },
        container: {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '70px',
            position: 'relative'
        },
        // Logo positioned at far left
        logo: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: '800',
            fontSize: '24px',
            color: COLORS.primary,
            cursor: 'pointer',
            textDecoration: 'none'
        },
        logoIcon: {
            width: '40px',
            height: '40px',
            background: `linear-gradient(135deg, #e06a1a 0%, #ff8c42 100%)`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.white,
            fontSize: '20px'
        },
        // Navigation in center
        nav: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)'
        },
        navItem: (isActive) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: '600',
            textDecoration: 'none',
            color: isActive ? COLORS.white : COLORS.text,
            background: isActive
                ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`
                : 'transparent',
            border: isActive ? 'none' : `2px solid transparent`,
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
        }),
        // Right section
        rightSection: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
        },
        avatar: {
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            cursor: 'pointer'
        },
        mobileMenuButton: {
            display: 'none',
            background: 'transparent',
            border: `2px solid ${COLORS.border}`,
            borderRadius: '8px',
            width: '44px',
            height: '44px',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: COLORS.text,
            fontSize: '18px'
        },
        mobileMenu: {
            position: 'fixed',
            top: '70px',
            left: 0,
            right: 0,
            background: COLORS.white,
            borderBottom: `1px solid ${COLORS.border}`,
            boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)',
            padding: '20px 24px',
            zIndex: 999,
            transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.3s ease'
        }
    };

    // RESPONSIVE STYLES
    const responsiveStyles = `
        @media (max-width: 768px) {
            .desktop-nav {
                position: static !important;
                transform: none !important;
                left: auto !important;
                display: none !important;
            }
            .mobile-menu-btn {
                display: flex !important;
            }
        }
        @media (min-width: 769px) {
            .mobile-menu {
                display: none !important;
            }
        }
    `;

    return (
        <>
            <style>{responsiveStyles}</style>

            {/* MAIN NAVBAR */}
            <nav style={styles.navbar}>
                <div style={styles.container}>
                    {/* ⭐ LOGO - COPIED FROM USER NAVBAR */}
                    <Link
                        to="/"
                        style={{ textDecoration: "none", color: "#111", flexShrink: 0 }}
                    >
                        <img
                            src="/Logo.png"
                            alt="Logo"
                            style={{
                                height: "50px",
                                objectFit: "contain",
                            }}
                        />
                    </Link>

                    {/* DESKTOP NAVIGATION - Center */}
                    <div className="desktop-nav" style={styles.nav}>
                        {navItems.map((item) => (
                            <div
                                key={item.key}
                                style={styles.navItem(isActivePath(item.path))}
                                onClick={() => navigate(item.path)}
                                onMouseEnter={(e) => {
                                    if (!isActivePath(item.path)) {
                                        e.currentTarget.style.background = COLORS.primaryLight;
                                        e.currentTarget.style.borderColor = COLORS.primary;
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActivePath(item.path)) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }
                                }}
                                title={item.description}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* RIGHT SECTION - Far Right (Only Avatar) */}
                    <div style={styles.rightSection}>
                        {/* User Avatar */}
                        <div style={{ position: 'relative' }}>
                            <img
                                src={user?.avatar || "/default-avatar-profile-icon-of-social-media-user-vector.jpg"}
                                alt="avatar"
                                style={styles.avatar}
                                onClick={() => setOpenMenu(!openMenu)}
                            />

                            {/* Dropdown menu */}
                            {openMenu && (
                                <div style={{
                                    position: 'absolute',
                                    top: '55px',
                                    right: 0,
                                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    width: '190px',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                                    zIndex: 10000
                                }}>
                                    <div style={{ padding: '8px 0', marginBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                                        <div style={{ fontWeight: '600', color: COLORS.text, fontSize: '14px' }}>
                                            {user?.name || user?.username || 'Chủ nhà'}
                                        </div>
                                        <div style={{ fontSize: '12px', color: COLORS.textLight }}>
                                            {user?.phone || user?.phoneNumber || 'Chưa cập nhật'}
                                        </div>
                                    </div>

                                    <Link
                                        to="/user/favoriteListing"
                                        style={{ display: 'block', marginBottom: '12px', fontSize: '14px', color: '#333', textDecoration: 'none' }}
                                        onClick={() => setOpenMenu(false)}
                                    >
                                        Yêu thích
                                    </Link>

                                    <Link
                                        to="/"
                                        style={{ display: 'block', marginBottom: '12px', fontSize: '14px', color: '#333', textDecoration: 'none' }}
                                        onClick={() => setOpenMenu(false)}
                                    >
                                        Trang chủ
                                    </Link>

                                    <button
                                        style={{
                                            width: '100%',
                                            background: 'linear-gradient(135deg, #e06a1a 0%, #ff8c42 100%)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(224, 106, 26, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        onClick={handleLogout}
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* MOBILE MENU BUTTON */}
                        <button
                            className="mobile-menu-btn"
                            style={styles.mobileMenuButton}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* MOBILE MENU */}
            <div className="mobile-menu" style={styles.mobileMenu}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {navItems.map((item) => (
                        <div
                            key={item.key}
                            style={{
                                ...styles.navItem(isActivePath(item.path)),
                                justifyContent: 'flex-start'
                            }}
                            onClick={() => {
                                navigate(item.path);
                                setMobileMenuOpen(false);
                            }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Navbar;
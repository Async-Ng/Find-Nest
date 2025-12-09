import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { getMapStyleDescriptor } from '../services/awsLocation';
import { publicApi } from '../services/api';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigate } from 'react-router-dom';
import {
    StarFilled,
    HomeFilled,
    EnvironmentOutlined,
    ExpandAltOutlined,
    DollarOutlined,
    PlusOutlined,
    MinusOutlined
} from '@ant-design/icons';
import ReactDOMServer from 'react-dom/server';

const MiniMapComponent = ({ currentListing }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const navigate = useNavigate();
    const popupRef = useRef(null);

    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Đang khởi tạo bản đồ...');
    const [error, setError] = useState('');
    const [allListings, setAllListings] = useState([]);
    const [mapReady, setMapReady] = useState(false);

    const COLORS = {
        primary: '#FF8C42',
        primaryLight: '#FFF5ED',
        primaryDark: '#E67A2E',
        secondary: '#FFB366',
        white: '#FFFFFF',
        gray: '#F8F9FA',
        border: '#E0E6ED',
        text: '#2D3748',
        textLight: '#718096',
        error: '#DC3545'
    };

    // ⭐ CREATE CURRENT LISTING ICON (Orange Star)
    const createCurrentIcon = () => {
        const iconHtml = ReactDOMServer.renderToString(
            <div style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}>
                {/* Outer pulse ring */}
                <div style={{
                    position: 'absolute',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: `${COLORS.primary}30`,
                    animation: 'pulse 1.5s ease-out infinite'
                }} />

                {/* Main circle */}
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255, 140, 66, 0.5)',
                    border: '3px solid white'
                }}>
                    <StarFilled style={{ color: 'white', fontSize: '20px' }} />
                </div>
            </div>
        );

        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
        };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
                <defs>
                    <filter id="shadow">
                        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.4"/>
                    </filter>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${COLORS.primary};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${COLORS.primaryDark};stop-opacity:1" />
                    </linearGradient>
                </defs>
                
                <!-- Pulse ring -->
                <circle cx="24" cy="24" r="22" fill="${COLORS.primary}" opacity="0.3">
                    <animate attributeName="r" from="20" to="24" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                
                <!-- Main circle -->
                <circle cx="24" cy="24" r="20" fill="url(#grad)" filter="url(#shadow)"/>
                <circle cx="24" cy="24" r="18" fill="none" stroke="white" stroke-width="3"/>
                
                <!-- Star icon (simplified) -->
                <path d="M24 14 L26.5 21 L34 21 L28 26 L30.5 33 L24 28 L17.5 33 L20 26 L14 21 L21.5 21 Z" 
                      fill="white"/>
            </svg>
        `);

        return img;
    };

    // ⭐ CREATE OTHER LISTING ICON (Orange Home)
    const createOtherIcon = () => {
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                <defs>
                    <filter id="shadow-other">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
                    </filter>
                </defs>
                
                <!-- Outer circle -->
                <circle cx="16" cy="16" r="15" fill="${COLORS.secondary}" opacity="0.3"/>
                
                <!-- Main circle -->
                <circle cx="16" cy="16" r="12" fill="${COLORS.secondary}" filter="url(#shadow-other)"/>
                <circle cx="16" cy="16" r="10" fill="none" stroke="white" stroke-width="2"/>
                
                <!-- Home icon -->
                <path d="M10 17 L10 22 L14 22 L14 17 L18 17 L18 22 L22 22 L22 17 L23 16 L16 11 L9 16 Z" 
                      fill="white"/>
            </svg>
        `);
        return img;
    };

    useEffect(() => {
        if (!mapContainer.current || !currentListing?.location) {
            console.warn('⚠️ Missing map container or location');
            return;
        }

        const initializeMap = async () => {
            try {
                setIsLoading(true);
                setLoadingMessage('Đang khởi tạo bản đồ...');
                setError('');

                const styleDescriptor = await getMapStyleDescriptor();
                const lat = parseFloat(currentListing.location.latitude);
                const lng = parseFloat(currentListing.location.longitude);

                if (isNaN(lat) || isNaN(lng)) {
                    throw new Error('Invalid coordinates');
                }

                setLoadingMessage('Đang tải bản đồ...');

                map.current = new maplibregl.Map({
                    container: mapContainer.current,
                    style: styleDescriptor,
                    center: [lng, lat],
                    zoom: 13,
                    pitch: 0,
                    bearing: 0,
                });

                map.current.on('load', () => {
                    console.log('✅ Mini map loaded successfully');
                    setLoadingMessage('Đang tải biểu tượng...');

                    let iconsLoaded = 0;
                    const totalIcons = 2;

                    const checkAllLoaded = () => {
                        iconsLoaded++;
                        if (iconsLoaded === totalIcons) {
                            setLoadingMessage('Đang tải danh sách phòng trọ...');
                            setMapReady(true);
                            loadAllListings(lat, lng);
                        }
                    };

                    // ⭐ LOAD CURRENT ICON
                    const currentIcon = createCurrentIcon();
                    currentIcon.onload = () => {
                        if (map.current && !map.current.hasImage('current-icon')) {
                            map.current.addImage('current-icon', currentIcon);
                            checkAllLoaded();
                        }
                    };
                    currentIcon.onerror = checkAllLoaded;

                    // ⭐ LOAD OTHER ICON
                    const otherIcon = createOtherIcon();
                    otherIcon.onload = () => {
                        if (map.current && !map.current.hasImage('other-icon')) {
                            map.current.addImage('other-icon', otherIcon);
                            checkAllLoaded();
                        }
                    };
                    otherIcon.onerror = checkAllLoaded;
                });

                map.current.on('error', (e) => {
                    console.error('❌ Map error:', e);
                    setError('Lỗi tải bản đồ');
                    setIsLoading(false);
                });

            } catch (error) {
                console.error('❌ Map initialization error:', error);
                setError('Không thể khởi tạo bản đồ');
                setIsLoading(false);
            }
        };

        initializeMap();

        return () => {
            if (map.current) {
                map.current.remove();
            }
        };
    }, [currentListing]);

    // ⭐ LOAD ALL LISTINGS
    const loadAllListings = async (currentLat, currentLng) => {
        try {
            const currentId = currentListing.id || currentListing.listingId || currentListing.pk;
            setLoadingMessage('Đang tải danh sách phòng trọ...');

            const response = await publicApi.getAllListings(1, 100);

            let listingsData = [];
            if (Array.isArray(response)) {
                listingsData = response;
            } else if (response.data && Array.isArray(response.data)) {
                listingsData = response.data;
            } else if (response.listings && Array.isArray(response.listings)) {
                listingsData = response.listings;
            } else if (response.Items && Array.isArray(response.Items)) {
                listingsData = response.Items;
            }

            const validListings = listingsData.filter(listing => {
                const lat = parseFloat(listing.location?.latitude || listing.lat);
                const lng = parseFloat(listing.location?.longitude || listing.lng);
                return !isNaN(lat) && !isNaN(lng);
            });

            setAllListings(validListings);
            setLoadingMessage('Đang hiển thị markers...');
            await displayMarkersOnMap(currentLat, currentLng, validListings);

            setTimeout(() => {
                setIsLoading(false);
                centerToCurrentLocation(currentLat, currentLng);
            }, 500);

        } catch (error) {
            console.error('❌ Error loading listings:', error);
            setIsLoading(false);
        }
    };

    const centerToCurrentLocation = (lat, lng) => {
        if (!map.current) return;
        map.current.flyTo({
            center: [lng, lat],
            zoom: 15,
            duration: 2000,
            essential: true
        });
    };

    const displayMarkersOnMap = async (currentLat, currentLng, otherListings) => {
        if (!map.current || !map.current.isStyleLoaded()) return;

        try {
            const currentImageUrl = getFirstImage(currentListing);

            const features = [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [currentLng, currentLat]
                    },
                    properties: {
                        id: String(currentListing.id),
                        markerType: 'current',
                        name: String(currentListing.title || 'Phòng hiện tại'),
                        price: Number(currentListing.price || 0),
                        address: String(getAddressString(currentListing.address)),
                        area: Number(currentListing.area || 0),
                        imageUrl: currentImageUrl
                    }
                },
                ...otherListings.map(listing => {
                    const lat = parseFloat(listing.location?.latitude || listing.lat);
                    const lng = parseFloat(listing.location?.longitude || listing.lng);
                    const imageUrl = getFirstImage(listing);

                    return {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [lng, lat]
                        },
                        properties: {
                            id: String(listing.id || listing.listingId),
                            markerType: 'other',
                            name: String(listing.title || listing.name || 'Phòng trọ'),
                            price: Number(listing.price || 0),
                            address: String(getAddressString(listing.address)),
                            area: Number(listing.area || 0),
                            imageUrl: imageUrl
                        }
                    };
                })
            ];

            if (map.current.getSource('mini-listings')) {
                map.current.getSource('mini-listings').setData({
                    type: 'FeatureCollection',
                    features: features
                });
            } else {
                map.current.addSource('mini-listings', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: features
                    }
                });

                map.current.addLayer({
                    id: 'mini-listings-layer',
                    type: 'symbol',
                    source: 'mini-listings',
                    layout: {
                        'icon-image': [
                            'case',
                            ['==', ['get', 'markerType'], 'current'],
                            'current-icon',
                            'other-icon'
                        ],
                        'icon-size': 1,
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true
                    }
                });

                map.current.on('mouseenter', 'mini-listings-layer', (e) => {
                    map.current.getCanvas().style.cursor = 'pointer';

                    if (e.features && e.features.length > 0) {
                        const props = e.features[0].properties;

                        if (popupRef.current) {
                            popupRef.current.remove();
                        }

                        const imageUrl = props.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image';

                        popupRef.current = new maplibregl.Popup({
                            closeButton: false,
                            closeOnClick: false,
                            offset: 15,
                            className: 'mini-listing-popup'
                        })
                            .setLngLat(e.lngLat)
                            .setHTML(createMiniListingCard(props, imageUrl))
                            .addTo(map.current);
                    }
                });

                map.current.on('mouseleave', 'mini-listings-layer', () => {
                    map.current.getCanvas().style.cursor = '';
                    if (popupRef.current) {
                        popupRef.current.remove();
                        popupRef.current = null;
                    }
                });

                map.current.on('click', 'mini-listings-layer', (e) => {
                    if (!e.features || e.features.length === 0) return;
                    const props = e.features[0].properties;
                    if (props.markerType === 'other') {
                        window.location.href = `/listings/${props.id}`;
                    }
                });
            }

        } catch (error) {
            console.error('❌ Error displaying markers:', error);
        }
    };

    const recenterMap = () => {
        if (!map.current || !currentListing?.location) return;
        const lat = parseFloat(currentListing.location.latitude);
        const lng = parseFloat(currentListing.location.longitude);
        map.current.flyTo({
            center: [lng, lat],
            zoom: 15,
            duration: 1500
        });
    };

    const getAddressString = (address) => {
        if (typeof address === 'string') return address;
        if (typeof address === 'object' && address) {
            const parts = [address.street, address.ward, address.district, address.city].filter(Boolean);
            return parts.join(', ');
        }
        return 'Địa chỉ không rõ';
    };

    const formatPrice = (price) => {
        if (!price || price === 0) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const createMiniListingCard = (props, imageUrl) => {
        const safeImageUrl = cleanS3Url(imageUrl);

        // ⭐ ANT DESIGN ICONS IN HTML
        const dollarIcon = ReactDOMServer.renderToString(
            <DollarOutlined style={{ fontSize: '14px', marginRight: '4px' }} />
        );
        const locationIcon = ReactDOMServer.renderToString(
            <EnvironmentOutlined style={{ fontSize: '14px', marginRight: '4px' }} />
        );
        const areaIcon = ReactDOMServer.renderToString(
            <ExpandAltOutlined style={{ fontSize: '12px', marginRight: '4px' }} />
        );
        const starIcon = ReactDOMServer.renderToString(
            <StarFilled style={{ fontSize: '12px', marginRight: '4px' }} />
        );

        return `
            <div style="
                width: 280px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                background: ${COLORS.white};
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 8px 32px rgba(255, 140, 66, 0.25);
                border: 2px solid ${COLORS.primary}30;
            ">
                <div style="
                    width: 100%;
                    height: 160px;
                    background: ${COLORS.gray};
                    position: relative;
                    overflow: hidden;
                ">
                    <img 
                        src="${safeImageUrl}"
                        alt="Listing"
                        style="width: 100%; height: 100%; object-fit: cover;"
                        onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=No+Image';"
                    />
                    ${props.markerType === 'current' ? `
                        <div style="
                            position: absolute; top: 8px; right: 8px;
                            background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%);
                            color: white; padding: 6px 12px; border-radius: 8px;
                            font-size: 11px; font-weight: 700;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                            display: flex; align-items: center; gap: 4px;
                        ">
                            ${starIcon} Phòng hiện tại
                        </div>
                    ` : ''}
                </div>
                <div style="padding: 16px;">
                    <h3 style="
                        font-size: 15px; font-weight: 700; color: ${COLORS.text};
                        margin: 0 0 12px 0; overflow: hidden;
                        text-overflow: ellipsis; white-space: nowrap;
                    ">${props.name || 'Phòng trọ'}</h3>
                    
                    <div style="
                        font-size: 18px; font-weight: 700;
                        color: ${COLORS.primary}; margin-bottom: 12px;
                        display: flex; align-items: center;
                    ">
                        ${dollarIcon} ${formatPrice(props.price)}
                    </div>
                    
                    <div style="
                        display: flex; align-items: flex-start; gap: 6px;
                        font-size: 13px; color: ${COLORS.textLight};
                        line-height: 1.4; margin-bottom: 12px;
                    ">
                        ${locationIcon}
                        <span style="
                            overflow: hidden; text-overflow: ellipsis;
                            display: -webkit-box; -webkit-line-clamp: 2;
                            -webkit-box-orient: vertical;
                        ">${props.address || 'Chưa cập nhật'}</span>
                    </div>
                    
                    ${props.area > 0 ? `
                        <div style="
                            display: inline-flex; align-items: center; gap: 4px;
                            background: ${COLORS.primaryLight}; 
                            color: ${COLORS.primary};
                            border: 1px solid ${COLORS.primary}30;
                            padding: 6px 12px; border-radius: 8px;
                            font-size: 12px; font-weight: 600;
                        ">
                            ${areaIcon} ${props.area}m²
                        </div>
                    ` : ''}
                    
                    ${props.markerType === 'other' ? `
                        <div style="
                            margin-top: 12px; text-align: center;
                            font-size: 11px; color: ${COLORS.primary};
                            font-weight: 600;
                            padding: 8px;
                            background: ${COLORS.primaryLight};
                            border-radius: 6px;
                        ">👆 Click để xem chi tiết</div>
                    ` : ''}
                </div>
            </div>
        `;
    };

    const styles = {
        container: {
            position: 'relative',
            width: '100%',
            height: '450px',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(255, 140, 66, 0.08)',
            border: `1px solid ${COLORS.border}`
        },
        mapContainer: {
            width: '100%',
            height: '100%'
        },
        loading: {
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            zIndex: 10
        },
        loadingContent: {
            textAlign: 'center',
            padding: '40px'
        },
        loadingSpinner: {
            width: '60px',
            height: '60px',
            border: `5px solid ${COLORS.primaryLight}`,
            borderTop: `5px solid ${COLORS.primary}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 24px'
        },
        loadingText: {
            color: COLORS.primary,
            fontSize: '16px',
            fontWeight: '700',
            marginBottom: '8px'
        },
        loadingSubtext: {
            color: COLORS.textLight,
            fontSize: '14px',
            fontWeight: '500'
        },
        controls: {
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 5
        },
        badge: {
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
            color: COLORS.white,
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '700',
            boxShadow: `0 6px 16px ${COLORS.primary}40`,
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            userSelect: 'none'
        }
    };

    if (!currentListing?.location) {
        return (
            <div style={{
                ...styles.container,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: COLORS.gray
            }}>
                <p style={{
                    color: COLORS.textLight,
                    fontSize: '15px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <EnvironmentOutlined style={{ fontSize: '18px' }} />
                    Không có thông tin vị trí
                </p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {isLoading && (
                <div style={styles.loading}>
                    <div style={styles.loadingContent}>
                        <div style={styles.loadingSpinner} />
                        <p style={styles.loadingText}>{loadingMessage}</p>
                        <p style={styles.loadingSubtext}>Vui lòng đợi trong giây lát...</p>
                    </div>
                </div>
            )}

            {error && (
                <div style={styles.loading}>
                    <p style={{ color: COLORS.error, fontSize: '15px', fontWeight: '600' }}>
                        ❌ {error}
                    </p>
                </div>
            )}

            <div ref={mapContainer} style={styles.mapContainer} />

            {mapReady && !isLoading && (
                <>
                    <div
                        style={styles.badge}
                        onClick={recenterMap}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.primary}60`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = `0 6px 16px ${COLORS.primary}40`;
                        }}
                        title="Click để quay về vị trí phòng"
                    >
                        <EnvironmentOutlined style={{ fontSize: '16px' }} />
                        <span>Vị trí phòng</span>
                    </div>

                    <div style={styles.controls}>
                        <button
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '10px',
                                backgroundColor: COLORS.white,
                                border: `2px solid ${COLORS.primary}30`,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: COLORS.primary,
                                boxShadow: '0 4px 12px rgba(255, 140, 66, 0.2)',
                                transition: 'all 0.3s ease',
                                fontSize: '20px'
                            }}
                            onClick={() => map.current?.zoomIn()}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = `0 6px 20px ${COLORS.primary}40`;
                                e.currentTarget.style.background = COLORS.primaryLight;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 140, 66, 0.2)';
                                e.currentTarget.style.background = COLORS.white;
                            }}
                            title="Phóng to"
                        >
                            <PlusOutlined />
                        </button>

                        <button
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '10px',
                                backgroundColor: COLORS.white,
                                border: `2px solid ${COLORS.primary}30`,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: COLORS.primary,
                                boxShadow: '0 4px 12px rgba(255, 140, 66, 0.2)',
                                transition: 'all 0.3s ease',
                                fontSize: '20px'
                            }}
                            onClick={() => map.current?.zoomOut()}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = `0 6px 20px ${COLORS.primary}40`;
                                e.currentTarget.style.background = COLORS.primaryLight;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 140, 66, 0.2)';
                                e.currentTarget.style.background = COLORS.white;
                            }}
                            title="Thu nhỏ"
                        >
                            <MinusOutlined />
                        </button>
                    </div>
                </>
            )}

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 0.3; }
                        100% { transform: scale(1.3); opacity: 0; }
                    }
                    
                    .mini-listing-popup .maplibregl-popup-content {
                        padding: 0 !important;
                        border-radius: 16px !important;
                        box-shadow: 0 12px 32px rgba(255, 140, 66, 0.35) !important;
                        border: 2px solid ${COLORS.primary}30 !important;
                        background: transparent !important;
                    }
                    
                    .mini-listing-popup .maplibregl-popup-tip {
                        border-top-color: ${COLORS.white} !important;
                    }
                    
                    .maplibregl-popup-close-button {
                        display: none !important;
                    }
                `}
            </style>
        </div>
    );
};

export default MiniMapComponent;

// ⭐ HELPER FUNCTIONS
const cleanS3Url = (url) => {
    if (!url || typeof url !== 'string') {
        return 'https://via.placeholder.com/300x200?text=No+Image';
    }

    try {
        let cleanUrl = url
            .replace(/\/undefined$/gi, '')
            .replace(/\/null$/gi, '')
            .replace(/undefined/gi, '')
            .replace(/null/gi, '')
            .trim();

        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
            const hasExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(cleanUrl);
            if (!hasExtension) {
                if (!cleanUrl.endsWith('/')) cleanUrl += '/';
                cleanUrl += 'image.jpg';
            }
            return cleanUrl;
        }

        return 'https://via.placeholder.com/300x200?text=No+Image';

    } catch (error) {
        console.error('❌ Clean S3 URL error:', error);
        return 'https://via.placeholder.com/300x200?text=No+Image';
    }
};

const getFirstImage = (listing) => {
    try {
        if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
            return cleanS3Url(listing.images[0]);
        }
        if (listing.imageUrls && Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0) {
            return cleanS3Url(listing.imageUrls[0]);
        }
        if (typeof listing.images === 'string') {
            const parsed = JSON.parse(listing.images);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return cleanS3Url(parsed[0]);
            }
        }
        return 'https://via.placeholder.com/300x200?text=No+Image';
    } catch (error) {
        console.error('❌ Get first image error:', error);
        return 'https://via.placeholder.com/300x200?text=No+Image';
    }
};
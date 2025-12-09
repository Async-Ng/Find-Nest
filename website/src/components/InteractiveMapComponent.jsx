import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { getMapStyleDescriptor } from '../services/awsLocation';
import { EnvironmentOutlined, AimOutlined, FullscreenOutlined } from '@ant-design/icons';
import 'maplibre-gl/dist/maplibre-gl.css';

const InteractiveMapComponent = ({
    onLocationSelect,
    coordinates, // { latitude, longitude } - controlled by parent
    isGeocoding = false
}) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const marker = useRef(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showInstruction, setShowInstruction] = useState(true);

    const COLORS = {
        primary: '#5ba9d3',
        primaryLight: '#e8f4f8',
        white: '#FFFFFF',
        text: '#2D3748',
        textLight: '#718096',
        success: '#28A745',
        error: '#DC3545',
        warning: '#FFC107'
    };

    // ⭐ INITIALIZE MAP ONCE
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        const initializeMap = async () => {
            try {
                setIsLoading(true);
                setError('');

                const styleDescriptor = await getMapStyleDescriptor();

                map.current = new maplibregl.Map({
                    container: mapContainer.current,
                    style: styleDescriptor,
                    center: [106.6297, 10.8231], // Default HCMC
                    zoom: 12,
                    pitch: 0,
                    bearing: 0,
                });

                // Add navigation controls
                map.current.addControl(
                    new maplibregl.NavigationControl({ showCompass: false }),
                    'top-right'
                );

                map.current.on('load', () => {
                    console.log('✅ Interactive map loaded');
                    setIsLoading(false);
                    setupClickHandler();
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
                map.current = null;
            }
        };
    }, []); // ⭐ ONLY RUN ONCE

    // ⭐ UPDATE MARKER WHEN COORDINATES CHANGE (from parent)
    useEffect(() => {
        if (!map.current || !coordinates?.latitude || !coordinates?.longitude) return;

        const { latitude, longitude } = coordinates;

        console.log('📍 Updating marker to:', { latitude, longitude });

        // Remove old marker
        if (marker.current) {
            marker.current.remove();
        }

        // Add new marker
        marker.current = new maplibregl.Marker({
            color: COLORS.primary,
            draggable: true,
            scale: 1.2
        })
            .setLngLat([longitude, latitude])
            .addTo(map.current);

        // Setup drag handler
        marker.current.on('dragend', () => {
            const lngLat = marker.current.getLngLat();
            handleLocationSelect(lngLat.lat, lngLat.lng, 'drag');
        });

        // Fly to location
        map.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 1500,
            essential: true
        });

    }, [coordinates?.latitude, coordinates?.longitude]); // ⭐ ONLY UPDATE ON COORDINATE CHANGE

    // ⭐ CLICK HANDLER
    const setupClickHandler = () => {
        if (!map.current) return;

        map.current.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            handleLocationSelect(lat, lng, 'click');
        });

        map.current.getCanvas().style.cursor = 'crosshair';
    };

    const handleLocationSelect = (lat, lng, source) => {
        console.log(`📍 Location selected (${source}):`, { lat, lng });

        // Remove old marker
        if (marker.current) {
            marker.current.remove();
        }

        // Add new marker
        marker.current = new maplibregl.Marker({
            color: COLORS.primary,
            draggable: true,
            scale: 1.2
        })
            .setLngLat([lng, lat])
            .addTo(map.current);

        // Setup drag handler
        marker.current.on('dragend', () => {
            const lngLat = marker.current.getLngLat();
            handleLocationSelect(lngLat.lat, lngLat.lng, 'drag');
        });

        // Trigger callback
        if (onLocationSelect) {
            onLocationSelect({
                coordinates: { lat, lng }
            });
        }
    };

    const recenterMap = () => {
        if (!map.current || !coordinates?.latitude || !coordinates?.longitude) return;

        map.current.flyTo({
            center: [coordinates.longitude, coordinates.latitude],
            zoom: 15,
            duration: 1500
        });
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div style={{
            position: isFullscreen ? 'fixed' : 'relative',
            top: isFullscreen ? 0 : 'auto',
            left: isFullscreen ? 0 : 'auto',
            right: isFullscreen ? 0 : 'auto',
            bottom: isFullscreen ? 0 : 'auto',
            width: '100%',
            height: isFullscreen ? '100vh' : '500px',
            borderRadius: isFullscreen ? '0' : '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(91, 169, 211, 0.15)',
            border: `2px solid ${COLORS.primary}30`,
            zIndex: isFullscreen ? 9999 : 1,
            transition: 'all 0.3s ease'
        }}>
            {/* Loading Overlay */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.95)',
                    zIndex: 10
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: `5px solid ${COLORS.primaryLight}`,
                        borderTop: `5px solid ${COLORS.primary}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{
                        marginTop: '16px',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: COLORS.text
                    }}>
                        Đang tải bản đồ...
                    </p>
                </div>
            )}

            {/* Geocoding Overlay */}
            {isGeocoding && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 15,
                    background: COLORS.white,
                    padding: '20px 32px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(91, 169, 211, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        border: `4px solid ${COLORS.primaryLight}`,
                        borderTop: `4px solid ${COLORS.primary}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: COLORS.text
                    }}>
                        Đang xác định vị trí...
                    </span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.95)',
                    zIndex: 10
                }}>
                    <p style={{
                        color: COLORS.error,
                        fontSize: '16px',
                        fontWeight: '600'
                    }}>
                        ❌ {error}
                    </p>
                </div>
            )}

            {/* Instruction Banner */}
            {!isLoading && !error && showInstruction && (
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 5,
                    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
                    color: COLORS.white,
                    padding: '12px 20px',
                    paddingRight: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(91, 169, 211, 0.4)',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'slideDown 0.4s ease',
                    maxWidth: '90%'
                }}>
                    <EnvironmentOutlined style={{ fontSize: '18px' }} />
                    <span>Click hoặc kéo marker để chọn vị trí chính xác</span>
                    <button
                        onClick={() => setShowInstruction(false)}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(255,255,255,0.3)',
                            color: COLORS.white,
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Control Buttons */}
            {!isLoading && !error && (
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    zIndex: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    {/* Recenter Button */}
                    {coordinates?.latitude && coordinates?.longitude && (
                        <button
                            onClick={recenterMap}
                            title="Về vị trí hiện tại"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                border: 'none',
                                background: COLORS.white,
                                color: COLORS.primary,
                                fontSize: '18px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = COLORS.primary;
                                e.currentTarget.style.color = COLORS.white;
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = COLORS.white;
                                e.currentTarget.style.color = COLORS.primary;
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <AimOutlined />
                        </button>
                    )}

                    {/* Fullscreen Button */}
                    <button
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            border: 'none',
                            background: COLORS.white,
                            color: COLORS.primary,
                            fontSize: '18px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = COLORS.primary;
                            e.currentTarget.style.color = COLORS.white;
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = COLORS.white;
                            e.currentTarget.style.color = COLORS.primary;
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <FullscreenOutlined />
                    </button>
                </div>
            )}

            {/* Coordinate Display */}
            {!isLoading && !error && coordinates?.latitude && coordinates?.longitude && (
                <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 5,
                    background: COLORS.white,
                    padding: '10px 20px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: COLORS.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{ color: COLORS.primary }}>📍</span>
                    <span>
                        {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                    </span>
                </div>
            )}

            {/* Map Container */}
            <div ref={mapContainer} style={{
                width: '100%',
                height: '100%'
            }} />

            {/* CSS Animations */}
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    @keyframes slideDown {
                        from {
                            opacity: 0;
                            transform: translateX(-50%) translateY(-20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(-50%) translateY(0);
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default InteractiveMapComponent;
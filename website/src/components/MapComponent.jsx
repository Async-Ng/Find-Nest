import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import { getMapStyleDescriptor, searchPlaces, formatLocationData, transformRequest } from '../services/awsLocation';
import { publicApi } from '../services/api';
import 'maplibre-gl/dist/maplibre-gl.css';
import ListingDetailModal from './ListingDetailModal';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const MapComponent = ({ onLocationSelect, center = [105.8, 21.0], zoom = 12 }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [currentStyle, setCurrentStyle] = useState('aws');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchType, setSearchType] = useState('ai'); // 'ai' or 'location'
  const [allListings, setAllListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [filters, setFilters] = useState({
    district: '',
    minPrice: 0,
    maxPrice: 50000000,
    minArea: 0,
    maxArea: 500,
    amenities: [],
    maxDistance: null,
  });
  const [panelPosition, setPanelPosition] = useState({ x: 16, y: 96 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [showDirections, setShowDirections] = useState(false);
  const [directionsData, setDirectionsData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [manualFilters, setManualFilters] = useState({
    city: '',
    district: '',
    minPrice: 0,
    maxPrice: 50,
    minArea: 0,
    maxArea: 100,
    amenities: []
  });
  const [filterLoading, setFilterLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showDistrictSuggestions, setShowDistrictSuggestions] = useState(false);

  const [mapSource, setMapSource] = useState('');
  const [showResultsPanel, setShowResultsPanel] = useState(true);
  const [listingsLoaded, setListingsLoaded] = useState(false);
  
  const cities = ['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'];
  const districts = {
    'TP.HCM': [
      'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
      'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12', 'Quận Bình Thạnh', 'Quận Gò Vấp',
      'Quận Phú Nhuận', 'Quận Tân Bình', 'Quận Tân Phú', 'Quận Bình Tân',
      'Thành phố Thủ Đức', 'Huyện Hóc Môn', 'Huyện Củ Chi', 'Huyện Bình Chánh',
      'Huyện Nhà Bè', 'Huyện Cần Giờ'
    ],
    'Hà Nội': ['Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Đống Đa', 'Quận Hai Bà Trưng', 'Quận Cầu Giấy'],
    'Đà Nẵng': ['Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn', 'Quận Liên Chiểu']
  };

  const mapStyles = React.useMemo(() => ({
    aws: { name: 'AWS Location', getStyle: getMapStyleDescriptor },
    positron: { name: 'CartoDB Positron', url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
    dark: { name: 'CartoDB Dark', url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
    voyager: { name: 'CartoDB Voyager', url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
    osm: { name: 'OpenStreetMap', url: 'https://tiles.openfreemap.org/styles/liberty' }
  }), []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    let timeoutId = null;

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError('');
        console.log('🗺️ Initializing map...');
        const styleConfig = mapStyles[currentStyle];
        const styleDescriptor = styleConfig.getStyle ? await styleConfig.getStyle() : styleConfig.url;
        
        // Check map source
        if (styleDescriptor?.metadata?.source) {
          setMapSource(styleDescriptor.metadata.source);
        }
        
        console.log('📍 Creating MapLibre GL map with style:', styleConfig.name);

        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: styleDescriptor,
          center: center,
          zoom: zoom,
          pitch: 0,
          bearing: 0,
          transformRequest: transformRequest,
        });



        // Map click handler disabled

        // ✅ CRITICAL: Wait for map.on('load') event before adding layers
        const onMapLoad = () => {
          console.log('✅ Map fully loaded. Adding marker layers...');
          addMarkerLayer();

          // Load home icons
          const homeImg = new Image(32, 32);
          homeImg.onload = () => {
            if (map.current) {
              map.current.addImage('home-icon', homeImg);
              console.log('✅ Home icon loaded');
            }
          };
          homeImg.src = 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#FF6B35">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          `);

          const favoriteImg = new Image(40, 40);
          favoriteImg.onload = () => {
            if (map.current) {
              map.current.addImage('home-favorite-icon', favoriteImg);
              console.log('✅ Favorite home icon loaded');
              addListingsLayer();
            }
          };
          favoriteImg.src = 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
              <defs>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
                </filter>
              </defs>
              <path d="M20 35L16.5 31.8C7.6 23.7 2 18.6 2 12.5C2 7.5 6 3.5 11 3.5C13.8 3.5 16.5 4.8 18.3 6.9L20 8.7L21.7 6.9C23.5 4.8 26.2 3.5 29 3.5C34 3.5 38 7.5 38 12.5C38 18.6 32.4 23.7 23.5 31.8L20 35Z" fill="#FF1744" stroke="#FFF" stroke-width="3" filter="url(#shadow)"/>
            </svg>
          `);

          loadListings();
          if (timeoutId) clearTimeout(timeoutId);
          map.current.off('load', onMapLoad);

          // Auto-get current location
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                console.log('📍 Got current location:', latitude, longitude, 'Accuracy:', accuracy, 'meters');
                setCurrentLocation({ lat: latitude, lng: longitude });
                selectLocation(
                  { lat: latitude, lng: longitude },
                  'Vị trí hiện tại'
                );
                if (accuracy > 50) {
                  setError(`Vị trí GPS không chính xác lắm (±${Math.round(accuracy)}m). Hãy ra ngoài trời để cải thiện độ chính xác.`);
                  setTimeout(() => setError(''), 5000);
                }
              },
              (error) => {
                console.warn('⚠️ Geolocation error:', error);
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              }
            );
          }
        };

        map.current.on('load', onMapLoad);

        timeoutId = setTimeout(() => {
          if (map.current) {
            console.warn('⏱️ Map loading timeout. Adding marker layers anyway...');
            addMarkerLayer();

            const homeImg = new Image(32, 32);
            homeImg.onload = () => {
              if (map.current) map.current.addImage('home-icon', homeImg);
            };
            homeImg.src = 'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#FF6B35">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            `);

            const favoriteImg = new Image(40, 40);
            favoriteImg.onload = () => {
              if (map.current) {
                map.current.addImage('home-favorite-icon', favoriteImg);
                addListingsLayer();
              }
            };
            favoriteImg.src = 'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                <defs>
                  <filter id="shadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
                  </filter>
                </defs>
                <path d="M20 35L16.5 31.8C7.6 23.7 2 18.6 2 12.5C2 7.5 6 3.5 11 3.5C13.8 3.5 16.5 4.8 18.3 6.9L20 8.7L21.7 6.9C23.5 4.8 26.2 3.5 29 3.5C34 3.5 38 7.5 38 12.5C38 18.6 32.4 23.7 23.5 31.8L20 35Z" fill="#FF1744" stroke="#FFF" stroke-width="3" filter="url(#shadow)"/>
              </svg>
            `);

            // Không tắt loading ở đây, để loadListings tự xử lý
            loadListings();
            map.current.off('load', onMapLoad);

            // Auto-get current location even if map loading times out
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const { latitude, longitude, accuracy } = position.coords;
                  console.log('📍 Got current location (timeout):', latitude, longitude, 'Accuracy:', accuracy, 'meters');
                  setCurrentLocation({ lat: latitude, lng: longitude });
                  selectLocation(
                    { lat: latitude, lng: longitude },
                    'Vị trí hiện tại'
                  );
                },
                (error) => {
                  console.warn('⚠️ Geolocation error:', error);
                },
                {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0
                }
              );
            }
          }
        }, 5000);
      } catch (error) {
        console.error('Map initialization error:', error);
        setError('Failed to initialize map. Please try again.');
        setIsLoading(false);
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    initializeMap();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (map.current) {
        console.log('🧹 Cleaning up map');
        map.current.remove();
      }
    };
  }, [currentStyle]);

  // Reload listings when filtered listings or favorites change
  useEffect(() => {
    console.log('📍 useEffect: filteredListings changed', filteredListings.length);
    if (map.current && map.current.isStyleLoaded() && listingsLoaded) {
      addListingsLayer();
    }
  }, [filteredListings, allListings, favoriteIds, listingsLoaded]);

  const changeMapStyle = async (styleKey) => {
    setCurrentStyle(styleKey);
    setShowStyleSelector(false);
  };

  // Add marker layer to map
  const addMarkerLayer = () => {
    if (!map.current) return;

    try {
      // Check if source already exists
      if (!map.current.getSource('markers')) {
        // Add GeoJSON source for markers
        map.current.addSource('markers', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });
      }

      // Check if layer already exists
      if (!map.current.getLayer('markers')) {
        // Add marker layer
        map.current.addLayer({
          id: 'markers',
          type: 'circle',
          source: 'markers',
          paint: {
            'circle-radius': 8,
            'circle-color': '#FF6B35',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });
      }

      // Add popup on marker click
      map.current.on('click', 'markers', (e) => {
        const features = map.current.querySourceFeatures('markers');
        if (features.length > 0) {
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="p-2">
                <h3 class="font-bold">${features[0].properties.name}</h3>
                <p class="text-sm">${features[0].properties.address}</p>
                <p class="text-xs text-gray-600">${features[0].geometry.coordinates[1].toFixed(4)}, ${features[0].geometry.coordinates[0].toFixed(4)}</p>
              </div>
            `)
            .addTo(map.current);
        }
      });
    } catch (error) {
      console.error('Error adding marker layer:', error);
      setError('Failed to initialize markers');
    }
  };

  // Add listings layer with home icons
  const addListingsLayer = () => {
    console.log('🔍 addListingsLayer called');
    console.log('📊 map.current:', map.current);
    console.log('📊 allListings:', allListings);

    if (!map.current) {
      console.warn('❌ map.current is null');
      return;
    }

    try {
      // Filter out listings without valid coordinates
      const validListings = allListings.filter(listing => {
        const lat = listing.location?.latitude || listing.lat;
        const lng = listing.location?.longitude || listing.lng;
        return lat && lng;
      });

      if (validListings.length === 0) {
        console.warn('⚠️ No listings with valid coordinates');
        return;
      }

      const features = validListings.map((listing) => {
        const lat = listing.location?.latitude || listing.lat;
        const lng = listing.location?.longitude || listing.lng;
        const addressObj = listing.address;

        let addressStr = '';
        if (typeof addressObj === 'string') {
          addressStr = addressObj;
        } else if (typeof addressObj === 'object' && addressObj) {
          const parts = [addressObj.street, addressObj.ward, addressObj.district, addressObj.city].filter(Boolean);
          addressStr = parts.join(', ');
        }

        const listingId = listing.id || listing.listingId;
        const isFavorite = favoriteIds.includes(listingId);

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          properties: {
            id: listingId,
            name: listing.title || listing.name || 'Phòng trọ',
            price: listing.price || 0,
            address: addressStr || 'Địa chỉ không rõ',
            area: listing.area || 0,
            images: listing.images || listing.imageUrls || [],
            isFavorite: isFavorite,
          },
        };
      });

      console.log('🏠 Creating features:', features.length, features);

      // Check if source exists, if so update it
      if (map.current.getSource('listings')) {
        console.log('📍 Updating existing listings source...');
        map.current.getSource('listings').setData({
          type: 'FeatureCollection',
          features: features,
        });
      } else {
        console.log('📍 Creating new listings source and layer...');
        map.current.addSource('listings', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: features,
          },
        });

        // Add layer if it doesn't exist
        if (!map.current.getLayer('listings-layer')) {
          console.log('🎨 Adding listings-layer to map...');
          map.current.addLayer({
            id: 'listings-layer',
            type: 'symbol',
            source: 'listings',
            layout: {
              'icon-image': [
                'case',
                ['get', 'isFavorite'],
                'home-favorite-icon',
                'home-icon'
              ],
              'icon-size': 1,
              'icon-allow-overlap': true,
            },
          });

          // Add click handler for listings
          map.current.on('click', 'listings-layer', (e) => {
            // Clear directions if showing
            if (map.current.getLayer('route')) map.current.removeLayer('route');
            if (map.current.getSource('route')) map.current.removeSource('route');
            setShowDirections(false);
            setDirectionsData(null);

            const props = e.features[0].properties;
            setSelectedListingId(props.id);
          });

          map.current.on('mouseenter', 'listings-layer', () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });
          map.current.on('mouseleave', 'listings-layer', () => {
            map.current.getCanvas().style.cursor = '';
          });
        }
      }

      console.log(`✅ Displayed ${features.length} listings on map`);
    } catch (error) {
      console.error('Error adding listings layer:', error);
    }
  };

  // Load favorites
  const loadFavorites = async () => {
    try {
      const favorites = await publicApi.getFavorites();
      setFavoriteIds(favorites.map(f => f.listingId));
    } catch (err) {
      console.log('Not logged in or error loading favorites');
    }
  };

  // Load all listings
  const loadListings = async () => {
    try {
      console.log('📍 Loading all listings...');
      if (isAuthenticated) {
        await loadFavorites();
      }
      const response = await publicApi.getAllListings(1, 100);
      console.log('✅ Listings loaded:', response);

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

      console.log('📊 Parsed listings count:', listingsData.length);
      setAllListings(listingsData);
      setFilteredListings(listingsData);
      setListingsLoaded(true);
      
      // Đợi một chút để đảm bảo markers đã được render
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
      
      return true;
    } catch (error) {
      console.error('❌ Error loading listings:', error);
      setError('Không thể tải danh sách phòng trọ');
      setIsLoading(false);
      return true;
    }
  };

  // Select location on map
  const selectLocation = async (coordinates, label = 'Selected Location') => {
    if (!map.current) return;

    const feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [coordinates.lng, coordinates.lat],
      },
      properties: {
        name: label,
        address: `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
      },
    };

    // Update marker source
    const source = map.current.getSource('markers');
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: [feature],
      });
    }

    // Fly to location
    map.current.flyTo({
      center: [coordinates.lng, coordinates.lat],
      zoom: 15,
      duration: 1500,
    });

    setSelectedLocation({
      label,
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng,
      },
    });

    if (onLocationSelect) {
      onLocationSelect({
        label,
        lat: coordinates.lat,
        lng: coordinates.lng,
      });
    }
  };

  // Search places
  const handleSearch = async () => {
    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập để sử dụng tính năng tìm kiếm AI. Click vào đây để đăng nhập.');
      return;
    }

    if (searchQuery.length < 2) {
      setError('Vui lòng nhập ít nhất 2 ký tự');
      return;
    }

    if (!currentLocation) {
      setError('Vui lòng cho phép truy cập vị trí để tìm kiếm');
      return;
    }

    try {
      setIsSearching(true);
      setError('');
      setSearchType('ai');

      const query = searchQuery;

      console.log('🤖 AI Search:', query, currentLocation);

      const aiResults = await publicApi.searchAI(query, {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
      });

      console.log('✅ AI Results:', aiResults);

      if (aiResults?.recommendations?.length > 0) {
        // Lưu explanation từ AI response
        setAiExplanation(aiResults.explanation || '');

        const formatted = aiResults.recommendations.map((item) => ({
          id: item.listingId,
          label: item.title,
          description: item.description,
          price: item.price,
          area: item.area,
          address: item.address,
          geometry: {
            point: [item.location.longitude, item.location.latitude],
          },
          relevanceScore: item.relevanceScore,
        }));

        setSearchResults(formatted);
        setShowResultsPanel(true);

        // Cập nhật allListings và filteredListings để hiển thị icon ngôi nhà
        const listingsFromAI = formatted.map(item => ({
          id: item.id,
          listingId: item.id,
          title: item.label,
          name: item.label,
          price: item.price,
          area: item.area,
          address: item.address,
          location: {
            latitude: item.geometry.point[1],
            longitude: item.geometry.point[0]
          },
          lat: item.geometry.point[1],
          lng: item.geometry.point[0],
          images: [],
          imageUrls: []
        }));
        
        setAllListings(listingsFromAI);
        setFilteredListings(listingsFromAI);

        // Fit map to results
        if (map.current && listingsFromAI.length > 0) {
          const coordinates = listingsFromAI.map(l => [l.lng, l.lat]);
          const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
          }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
          map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
        }
      } else {
        setSearchResults([]);
        setAiExplanation('');
        setError('Không tìm thấy phòng phù hợp với yêu cầu');
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setError('Lỗi tìm kiếm: ' + (error.message || 'Vui lòng thử lại'));
      setSearchResults([]);
      setAiExplanation('');
    } finally {
      setIsSearching(false);
    }
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - panelPosition.x,
        y: e.clientY - panelPosition.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPanelPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Show directions on map using AWS Location Service
  const showDirectionsOnMap = async (origin, destination) => {
    try {
      const response = await publicApi.getRoute({
        origin: [origin.lng, origin.lat],
        destination: [destination.lng, destination.lat]
      });

      if (!response || !response.route) {
        setError('Không tìm thấy đường đi');
        return;
      }

      const route = response.route;
      const distance = route.distance.toFixed(1) + ' km';
      const duration = Math.round(route.duration / 60) + ' phút';

      // Add route to map
      if (map.current.getSource('route')) {
        map.current.getSource('route').setData(route.geometry);
      } else {
        map.current.addSource('route', {
          type: 'geojson',
          data: route.geometry
        });
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3B82F6',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });
      }

      // Fit map to route
      const coordinates = route.geometry.coordinates;
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
      map.current.fitBounds(bounds, { padding: 100 });

      // Show popup at middle of route
      const midIndex = Math.floor(coordinates.length / 2);
      const midPoint = coordinates[midIndex];

      new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        className: 'route-popup-mini',
        offset: 8
      })
        .setLngLat(midPoint)
        .setHTML(`
          <style>
            .route-popup-mini .maplibregl-popup-content {
              padding: 0;
              background: transparent;
              box-shadow: none;
              border-radius: 12px;
            }
            .route-popup-mini .maplibregl-popup-close-button {
              font-size: 14px;
              width: 18px;
              height: 18px;
              color: #666;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
              right: 2px;
              top: 2px;
              background: rgba(255,255,255,0.9);
              border-radius: 50%;
            }
            .route-popup-mini .maplibregl-popup-close-button:hover {
              background: #ef4444;
              color: white;
              transform: scale(1.1);
            }
          </style>
          <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg px-3 py-2 text-white text-sm font-medium flex items-center gap-2">
            <span>📍 ${distance}</span>
            <span>•</span>
            <span>⏱️ ${duration}</span>
          </div>
        `)
        .addTo(map.current);

      setShowDirections(false);
      setDirectionsData(null);
    } catch (err) {
      console.error('Error fetching directions:', err);
      setError('Không thể tính toán đường đi');
    }
  };

  // Select from search results
  const handleSelectSearchResult = (result) => {
    try {
      const [lng, lat] = result.geometry.point;

      // Thu nhỏ panel khi click vào item
      setShowResultsPanel(false);

      map.current?.flyTo({
        center: [lng, lat],
        zoom: 16,
        duration: 1500,
      });

      // Open detail modal
      setSelectedListingId(result.id);
    } catch (error) {
      console.error('Error selecting result:', error);
      setError('Không thể chọn kết quả này');
    }
  };

  return (
    <div className="w-full h-full relative bg-gray-100">
      {/* Map Container - Full Screen */}
      <div className="w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-red-50 z-50">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto">
                  <svg className="w-full h-full text-orange-500 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Đang tải bản đồ...</h3>
              <p className="text-sm text-gray-600">Vui lòng chờ trong giây lát</p>
              <div className="flex justify-center gap-1 mt-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* AI Search Bar - Positioned below navbar */}
      <div className="absolute top-15 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-40">
        <div className="relative">
          {/* AI Badge */}
          <div className="flex items-center justify-center mb-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg">
              <svg className="w-4 h-4 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
              </svg>
              <span className="text-white text-sm font-bold">AI Tìm Kiếm Thông Minh</span>
              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative bg-gradient-to-r from-orange-50 to-red-50 p-1 rounded-3xl shadow-2xl">
            <div className="relative bg-white rounded-3xl">
              <div className="absolute left-6 top-1/2 -translate-y-1/2">
                <div className="relative">
                  <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <input
                type="text"
                placeholder="🤖 Hỏi AI: 'Tìm phòng gần chợ, có bếp, giá dưới 5 triệu...'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-16 pr-32 py-5 text-base rounded-3xl focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all font-medium"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {searchQuery && !isSearching && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                {isSearching ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span className="text-white text-sm font-medium">AI đang tìm...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSearch}
                    disabled={searchQuery.length < 2}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-full hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    TÌM NGAY
                  </button>
                )}
              </div>
            </div>
          </div>


          {/* Quick Suggestions */}
          
          {/* Quick Suggestions */}
          {!searchQuery && !isSearching && (
            <div className="mt-3 flex justify-center">
              <div className="flex flex-wrap gap-2 justify-center">
                {['Phòng gần trường', 'Có bếp riêng', 'Giá rẻ', 'Gần chợ'].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setSearchQuery(suggestion)}
                    className="px-4 py-1.5 bg-white hover:bg-orange-50 border border-orange-200 text-orange-600 text-sm rounded-full transition-all hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Loading State */}
          {isSearching && searchQuery.length >= 2 && (
            <div
              className="fixed w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
              style={{ left: `${panelPosition.x}px`, top: `${panelPosition.y}px` }}
            >
              <div
                className="p-2 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-100 cursor-move drag-handle"
                onMouseDown={handleMouseDown}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                  <span className="text-xs text-gray-500 font-medium">Kéo để di chuyển</span>
                </div>
              </div>
              <div className="p-4 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-3 animate-pulse">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  🤖 AI đang tìm kiếm...
                </p>
                <p className="text-xs text-gray-500">
                  Đang phân tích yêu cầu
                </p>
                <div className="mt-3 flex justify-center gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Minimized Results Button */}
          {!isSearching && searchResults.length > 0 && !showResultsPanel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowResultsPanel(true);
              }}
              className="fixed left-4 top-32 z-[9999] px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium hover:scale-105"
              style={{ pointerEvents: 'auto' }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span>{searchResults.length} kết quả</span>
            </button>
          )}

          {/* Search Results Panel */}
          {!isSearching && searchResults.length > 0 && showResultsPanel && (
            <div
              className="fixed w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[calc(100vh-120px)] z-50 flex flex-col"
              style={{ left: `${panelPosition.x}px`, top: `${panelPosition.y}px` }}
            >
              <div className="p-2 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                  ✅ {searchResults.length} kết quả
                </p>
                <div className="flex items-center gap-1">
                  {aiExplanation && (
                    <button
                      onClick={() => setShowExplanation(!showExplanation)}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${showExplanation ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50'}`}
                      title="Xem giải thích từ AI"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                      </svg>
                      <span>Giải thích</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowResultsPanel(false)}
                    className="p-1 hover:bg-orange-100 rounded transition-colors"
                    title="Thu nhỏ"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {showExplanation && aiExplanation ? (
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 mb-1.5">🤖 AI Giải thích</p>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {aiExplanation}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full text-left p-3 hover:bg-orange-50 border-b border-gray-50 last:border-b-0 transition-all group"
                  >
                    <div className="flex gap-2.5">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                          {result.label}
                        </h3>
                        {result.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          📍 {typeof result.address === 'string' ? result.address :
                            `${result.address.street}, ${result.address.ward}, ${result.address.district}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold">
                            💰 {(result.price / 1000000).toFixed(1)}M đ
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                            📏 {result.area} m²
                          </span>
                          {result.relevanceScore > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs font-medium">
                              ⭐ {result.relevanceScore}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Quick Actions */}
      <div className="absolute top-20 right-6 z-40 flex gap-2">
        {/* Filter Button */}
        <button
          onClick={() => {
            if (!isAuthenticated) {
              setError('Vui lòng đăng nhập để sử dụng tính năng lọc');
              return;
            }
            setShowFilters(!showFilters);
          }}
          className="p-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 text-gray-600 hover:text-gray-900"
          title="Lọc phòng trọ"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
        </button>


        {/* Map Style Selector */}
        <div className="relative">
          <button
            onClick={() => setShowStyleSelector(!showStyleSelector)}
            className="p-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 text-gray-600 hover:text-gray-900"
            title="Đổi kiểu bản đồ"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
              <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM16 17a1 1 0 100-2h-3a1 1 0 100 2h3z" />
            </svg>
          </button>
          {showStyleSelector && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 min-w-[200px]">
              {Object.entries(mapStyles).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => changeMapStyle(key)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${currentStyle === key ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Help Button */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 text-gray-600 hover:text-gray-900"
          title="Hướng dẫn"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-40 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm shadow-md flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-32 left-4 right-4 z-40 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm shadow-md flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="flex-1">{error}</span>
          {error.includes('đăng nhập') && (
            <button
              onClick={() => navigate('/user/loginPage')}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors font-medium"
            >
              Đăng nhập
            </button>
          )}
          <button
            onClick={() => setError('')}
            className="text-red-700 hover:text-red-900 transition-colors"
            title="Đóng"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Map Controls - Right Side */}
      <div className="absolute right-4 bottom-4 z-40 flex flex-col gap-2">
        {/* Zoom In/Out */}
        <button
          onClick={() => map.current?.zoomIn()}
          className="w-12 h-12 bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all font-bold text-lg"
          title="Phóng to"
        >
          +
        </button>
        <button
          onClick={() => map.current?.zoomOut()}
          className="w-12 h-12 bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all font-bold text-lg"
          title="Thu nhỏ"
        >
          −
        </button>

        {/* Geolocation */}
        <button
          onClick={() => {
            const geolocateControl = new maplibregl.GeolocateControl({
              positionOptions: { enableHighAccuracy: true },
              trackUserLocation: true,
              showUserHeading: true,
            });
            map.current?.addControl(geolocateControl);
            setTimeout(() => geolocateControl.trigger(), 100);
          }}
          className="w-12 h-12 bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all"
          title="Vị trí hiện tại"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Listing Detail Modal */}
      {selectedListingId && !showDirections && (
        <ListingDetailModal
          listingId={selectedListingId}
          onClose={() => setSelectedListingId(null)}
          onFavoriteChange={(listingId, isFavorite) => {
            if (isFavorite) {
              setFavoriteIds(prev => [...prev, listingId]);
            } else {
              setFavoriteIds(prev => prev.filter(id => id !== listingId));
            }
          }}
          onShowDirections={(destination) => {
            if (!isAuthenticated) {
              setError('Vui lòng đăng nhập để xem chỉ đường');
              return;
            }

            console.log('📍 Xem đường đi:', destination);
            console.log('📍 Vị trí hiện tại:', currentLocation);
            setSelectedListingId(null);
            
            if (!currentLocation) {
              setError('Vui lòng cho phép truy cập vị trí hiện tại để xem đường đi');
              if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentLocation({ lat: latitude, lng: longitude });
                    showDirectionsOnMap({ lat: latitude, lng: longitude }, destination);
                  },
                  (error) => {
                    setError('Không thể lấy vị trí hiện tại. Vui lòng kiểm tra cài đặt trình duyệt.');
                  }
                );
              } else {
                setError('Trình duyệt không hỗ trợ định vị');
              }
            } else {
              showDirectionsOnMap(currentLocation, destination);
            }
          }}
        />
      )}





      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute right-4 top-32 z-40 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80 max-h-[calc(100vh-150px)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Lọc phòng trọ</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* City */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
            <input
              type="text"
              value={manualFilters.city}
              onChange={(e) => setManualFilters({ ...manualFilters, city: e.target.value, district: '' })}
              onFocus={() => setShowCitySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
              placeholder="VD: TP.HCM, Đà Nẵng, Hà Nội..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {showCitySuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {cities.filter(c => c.toLowerCase().includes(manualFilters.city.toLowerCase())).map(city => (
                  <button
                    key={city}
                    onClick={() => {
                      setManualFilters({ ...manualFilters, city, district: '' });
                      setShowCitySuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* District */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
            <input
              type="text"
              value={manualFilters.district}
              onChange={(e) => setManualFilters({ ...manualFilters, district: e.target.value })}
              onFocus={() => setShowDistrictSuggestions(true)}
              onBlur={() => setTimeout(() => setShowDistrictSuggestions(false), 200)}
              placeholder="VD: Quận 1, Quận Hải Châu..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {showDistrictSuggestions && manualFilters.city && districts[manualFilters.city] && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {districts[manualFilters.city].filter(d => d.toLowerCase().includes(manualFilters.district.toLowerCase())).map(district => (
                  <button
                    key={district}
                    onClick={() => {
                      setManualFilters({ ...manualFilters, district });
                      setShowDistrictSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  >
                    {district}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Range */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Giá: {manualFilters.minPrice} - {manualFilters.maxPrice} triệu</label>
            <Slider
              range
              min={0}
              max={50}
              value={[manualFilters.minPrice, manualFilters.maxPrice]}
              onChange={(value) => setManualFilters({ ...manualFilters, minPrice: value[0], maxPrice: value[1] })}
              trackStyle={[{ backgroundColor: '#f97316' }]}
              handleStyle={[{ borderColor: '#f97316' }, { borderColor: '#f97316' }]}
            />
          </div>

          {/* Area */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Diện tích: {manualFilters.minArea} - {manualFilters.maxArea} m²</label>
            <Slider
              range
              min={0}
              max={100}
              value={[manualFilters.minArea, manualFilters.maxArea]}
              onChange={(value) => setManualFilters({ ...manualFilters, minArea: value[0], maxArea: value[1] })}
              trackStyle={[{ backgroundColor: '#f97316' }]}
              handleStyle={[{ borderColor: '#f97316' }, { borderColor: '#f97316' }]}
            />
          </div>

          {/* Amenities */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiện ích</label>
            <div className="space-y-2">
              {['WiFi', 'Điều hòa', 'Tủ lạnh', 'Máy giặt', 'Bếp'].map(amenity => (
                <label key={amenity} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={manualFilters.amenities.includes(amenity)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setManualFilters({ ...manualFilters, amenities: [...manualFilters.amenities, amenity] });
                      } else {
                        setManualFilters({ ...manualFilters, amenities: manualFilters.amenities.filter(a => a !== amenity) });
                      }
                    }}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>



          {/* Apply Button */}
          <button
            onClick={async () => {
              try {
                setFilterLoading(true);
                const params = {};
                if (manualFilters.district) params.district = manualFilters.district;
                if (manualFilters.minPrice > 0) params.minPrice = manualFilters.minPrice * 1000000;
                if (manualFilters.maxPrice > 0) params.maxPrice = manualFilters.maxPrice * 1000000;
                if (manualFilters.minArea > 0) params.minArea = manualFilters.minArea;
                if (manualFilters.maxArea > 0) params.maxArea = manualFilters.maxArea;
                if (manualFilters.amenities.length > 0) params.amenities = manualFilters.amenities.join(',');

                const response = await publicApi.getAllListings(1, 100, params);
                let listingsData = Array.isArray(response) ? response : (response.data || response.listings || response.Items || []);
                setAllListings(listingsData);
                setFilteredListings(listingsData);
                setShowFilters(false);
                setSuccessMessage(`Đã tìm thấy ${listingsData.length} phòng trọ`);
                setTimeout(() => setSuccessMessage(''), 3000);
              } catch (err) {
                setError('Không thể lọc phòng trọ');
              } finally {
                setFilterLoading(false);
              }
            }}
            disabled={filterLoading}
            className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {filterLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Đang lọc...
              </>
            ) : 'Áp dụng lọc'}
          </button>

          {/* Reset Button */}
          <button
            onClick={() => {
              setManualFilters({
                city: '',
                district: '',
                minPrice: 0,
                maxPrice: 50,
                minArea: 0,
                maxArea: 100,
                amenities: []
              });
              loadListings();
              setShowFilters(false);
            }}
            className="w-full mt-2 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all"
          >
            Xóa lọc
          </button>
        </div>
      )}

      {/* Info Panel - Left Side */}
      {showInfo && (
        <div className="absolute left-4 top-20 z-40 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Hướng dẫn sử dụng</h3>
            <button
              onClick={() => setShowInfo(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span className="font-semibold">🔍</span>
              <span>Tìm kiếm địa điểm trong thanh tìm kiếm</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">🖱️</span>
              <span>Nhấp vào bản đồ để chọn vị trí</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">📍</span>
              <span>Nhấp nút GPS để lấy vị trí hiện tại</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">+/−</span>
              <span>Dùng nút +/− để phóng to/thu nhỏ</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MapComponent;

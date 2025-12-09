import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Input, InputNumber, Select, Row, Col } from 'antd';
import {
    InfoCircleOutlined,
    EnvironmentOutlined,
    CameraOutlined,
    EditOutlined,
    FileTextOutlined,
    DollarOutlined,
    ExpandOutlined,
    HomeOutlined,
    BankOutlined,
    CompassOutlined,
    GlobalOutlined,
    StarOutlined,
    WifiOutlined,
    ThunderboltOutlined,
    InboxOutlined,
    SyncOutlined,
    CarOutlined,
    SafetyOutlined,
    VerticalAlignTopOutlined,
    BuildOutlined,
    CheckOutlined,
    CheckSquareOutlined,
    PlusOutlined,
    DeleteOutlined,
    UploadOutlined,
    LoadingOutlined,
    LeftOutlined,
    RightOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { listingApi, uploadApi, locationApi } from '../../services/api';
import InteractiveMapComponent from '../../components/InteractiveMapComponent';

const { TextArea } = Input;
const { Option } = Select;

// COLORS - Enhanced Theme
const COLORS = {
    primary: '#ff8c42',
    primaryLight: '#fff5eb',
    primaryDark: '#e06a1a',
    secondary: '#ffb366',
    accent: '#FF6B6B',
    accentLight: '#FFE5E5',
    background: '#F7F9FC',
    white: '#FFFFFF',
    text: '#1A1A1A',
    textLight: '#718096',
    border: '#ffe4cc',
    success: '#10B981',
    successLight: '#D1FAE5',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    gray: '#F3F4F6',
    grayDark: '#E5E7EB',
    purple: '#8B5CF6',
    purpleLight: '#EDE9FE'
};

const SHADOWS = {
    button: '0 4px 12px rgba(0,0,0,0.08)',
    card: '0 4px 20px rgba(0,0,0,0.06)',
    hover: '0 8px 32px rgba(91, 169, 211, 0.2)'
};

const AMENITIES_LIST = [
    { id: 'wifi', label: 'WiFi', icon: <WifiOutlined />, color: '#3B82F6' },
    { id: 'aircon', label: 'Điều hòa', icon: <ThunderboltOutlined />, color: '#06B6D4' },
    { id: 'fridge', label: 'Tủ lạnh', icon: <InboxOutlined />, color: '#8B5CF6' },
    { id: 'washing', label: 'Máy giặt', icon: <SyncOutlined />, color: '#10B981' },
    { id: 'parking', label: 'Bãi đỗ xe', icon: <CarOutlined />, color: '#F59E0B' },
    { id: 'security', label: 'An ninh 24/7', icon: <SafetyOutlined />, color: '#EF4444' },
    { id: 'elevator', label: 'Thang máy', icon: <VerticalAlignTopOutlined />, color: '#6366F1' },
    { id: 'balcony', label: 'Ban công', icon: <BuildOutlined />, color: '#14B8A6' }
];

const CreateListing = () => {
    const navigate = useNavigate();
    const geocodeTimerRef = useRef(null);

    // STATES
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const [coordinatesFound, setCoordinatesFound] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [mapPickedLocation, setMapPickedLocation] = useState(null);
    const [showMapPicker, setShowMapPicker] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        area: '',
        street: '',
        ward: '',
        district: '',
        city: 'TP.HCM',
        amenities: [],
        images: []
    });

    const [coordinates, setCoordinates] = useState({
        latitude: null,
        longitude: null
    });

    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});

    // Custom Amenities States
    const [customAmenities, setCustomAmenities] = useState([]);
    const [showAddAmenityInput, setShowAddAmenityInput] = useState(false);
    const [newAmenityText, setNewAmenityText] = useState('');

    const steps = [
        { title: 'Thông tin cơ bản', description: 'Tiêu đề, mô tả, giá', icon: <InfoCircleOutlined /> },
        { title: 'Vị trí & Tiện ích', description: 'Địa chỉ, bản đồ, tiện nghi', icon: <EnvironmentOutlined /> },
        { title: 'Hình ảnh', description: 'Quản lý ảnh phòng', icon: <CameraOutlined /> }
    ];

    // VALIDATION
    const validateStep = (step) => {
        if (step === 1) {
            if (!formData.title.trim()) {
                message.error('Vui lòng nhập tiêu đề');
                return false;
            }
            if (!formData.description.trim()) {
                message.error('Vui lòng nhập mô tả');
                return false;
            }
            if (!formData.price || formData.price <= 0) {
                message.error('Vui lòng nhập giá hợp lệ');
                return false;
            }
            if (!formData.area || formData.area <= 0) {
                message.error('Vui lòng nhập diện tích hợp lệ');
                return false;
            }
        }

        if (step === 2) {
            if (!formData.street.trim()) {
                message.error('Vui lòng nhập địa chỉ');
                return false;
            }
            if (!formData.district.trim()) {
                message.error('Vui lòng nhập quận/huyện');
                return false;
            }
            if (!formData.city.trim()) {
                message.error('Vui lòng nhập thành phố');
                return false;
            }
            if (!coordinates.latitude || !coordinates.longitude || !coordinatesFound) {
                message.error('Vui lòng xác định tọa độ trước khi tiếp tục');
                return false;
            }
        }

        return true;
    };

    // GEOCODING
    const geocodeAddress = async (street, ward, district, city) => {
        try {
            const address = [street, ward, district, city].filter(Boolean).join(', ');
            const result = await locationApi.geocodeAddress(address);

            if (result && result.latitude && result.longitude) {
                const coords = {
                    latitude: result.latitude,
                    longitude: result.longitude
                };
                setCoordinates(coords);
                setCoordinatesFound(true);
                setGeocoding(false);
                return coords;
            }
            throw new Error('Không tìm thấy tọa độ');
        } catch (error) {
            console.error('❌ Geocoding error:', error);
            setGeocoding(false);
            setCoordinatesFound(false);
            throw error;
        }
    };

    const handleAddressChange = (field, value) => {
        const updatedData = { ...formData, [field]: value };
        setFormData(updatedData);

        if (mapPickedLocation) {
            setMapPickedLocation(null);
        }

        if (geocodeTimerRef.current) {
            clearTimeout(geocodeTimerRef.current);
        }

        const hasAllFields = updatedData.street?.trim() &&
            updatedData.district?.trim() &&
            updatedData.city?.trim();

        if (hasAllFields) {
            geocodeTimerRef.current = setTimeout(async () => {
                setGeocoding(true);
                try {
                    const result = await geocodeAddress(
                        updatedData.street,
                        updatedData.ward,
                        updatedData.district,
                        updatedData.city
                    );
                    if (result) {
                        message.success('✅ Đã tìm thấy vị trí');
                    }
                } catch (error) {
                    setGeocoding(false);
                    setCoordinatesFound(false);
                }
            }, 1000);
        } else {
            setCoordinates({ latitude: null, longitude: null });
            setCoordinatesFound(false);
        }
    };

    const handleMapLocationSelect = async (location) => {
        try {
            setIsReverseGeocoding(true);
            const addressData = await locationApi.reverseGeocode(
                location.coordinates.lat,
                location.coordinates.lng
            );

            setCoordinates({
                latitude: location.coordinates.lat,
                longitude: location.coordinates.lng
            });
            setCoordinatesFound(true);

            setFormData(prev => ({
                ...prev,
                street: addressData.street || '',
                ward: addressData.ward || '',
                district: addressData.district || '',
                city: addressData.city || 'TP.HCM'
            }));

            setMapPickedLocation(location);
            message.success('✅ Đã chọn vị trí từ bản đồ');
        } catch (error) {
            message.warning('Không thể lấy địa chỉ. Vui lòng nhập thủ công.');
            setCoordinates({
                latitude: location.coordinates.lat,
                longitude: location.coordinates.lng
            });
            setCoordinatesFound(true);
            setMapPickedLocation(location);
        } finally {
            setIsReverseGeocoding(false);
        }
    };

    const handleChange = (field, value) => {
        if (['street', 'ward', 'district', 'city'].includes(field)) {
            handleAddressChange(field, value);
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    // AMENITIES
    const toggleAmenity = (amenityId) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenityId)
                ? prev.amenities.filter(id => id !== amenityId)
                : [...prev.amenities, amenityId]
        }));
    };

    const toggleSelectAll = () => {
        const allIds = [...AMENITIES_LIST.map(a => a.id), ...customAmenities.map(a => a.id)];
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.length === allIds.length ? [] : allIds
        }));
    };

    const handleAddCustomAmenity = () => {
        const trimmed = newAmenityText.trim();
        if (!trimmed) {
            message.warning('Vui lòng nhập tên tiện ích');
            return;
        }

        const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        const isDuplicate = [...AMENITIES_LIST, ...customAmenities].some(
            a => a.label.toLowerCase() === capitalized.toLowerCase()
        );

        if (isDuplicate) {
            message.warning('Tiện ích đã tồn tại');
            return;
        }

        const newAmenity = {
            id: `custom_${Date.now()}`,
            label: capitalized,
            icon: <StarOutlined />,
            color: COLORS.accent,
            isCustom: true
        };

        setCustomAmenities(prev => [...prev, newAmenity]);
        setFormData(prev => ({
            ...prev,
            amenities: [...prev.amenities, newAmenity.id]
        }));

        setNewAmenityText('');
        setShowAddAmenityInput(false);
        message.success(`Đã thêm: ${capitalized}`);
    };

    const removeCustomAmenity = (amenityId) => {
        setCustomAmenities(prev => prev.filter(a => a.id !== amenityId));
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.filter(id => id !== amenityId)
        }));
    };

    // IMAGE HANDLING
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (imagePreviews.length + files.length > 5) {
            message.error('Chỉ được tải tối đa 5 ảnh');
            return;
        }

        const validFiles = [];
        const validPreviews = [];

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                message.error(`File ${file.name} quá lớn (>5MB)`);
                return;
            }
            if (!file.type.startsWith('image/')) {
                message.error(`File ${file.name} không phải là ảnh`);
                return;
            }

            validFiles.push(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                validPreviews.push(e.target.result);
                if (validPreviews.length === validFiles.length) {
                    setImageFiles(prev => [...prev, ...validFiles]);
                    setImagePreviews(prev => [...prev, ...validPreviews]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async () => {
        if (imageFiles.length === 0) return [];

        try {
            const filesData = imageFiles.map(file => ({
                filename: `${Date.now()}-${file.name}`,
                contentType: file.type
            }));

            const response = await uploadApi.getPresignedUrls(filesData);
            console.log('📤 Upload response:', response);
            const uploads = response.uploads || response.data?.uploads || [];
            const uploadedUrls = [];

            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                const uploadData = uploads[i];
                setUploadProgress(prev => ({ ...prev, [i]: { percent: 0, status: 'uploading' } }));

                try {
                    await uploadApi.uploadToS3(uploadData.uploadUrl || uploadData.presignedUrl, file, file.type);
                    
                    // Build correct public URL from response
                    let publicUrl = uploadData.publicUrl || uploadData.imageUrl;
                    if (!publicUrl && uploadData.key) {
                        // Fallback: construct URL from S3 bucket + key
                        const s3Bucket = 'findnest-images-647231754171.s3.us-east-1.amazonaws.com';
                        publicUrl = `https://${s3Bucket}/${uploadData.key}`;
                    }
                    
                    console.log('✅ Image uploaded:', { fileName: file.name, publicUrl });
                    uploadedUrls.push(publicUrl);
                    setUploadProgress(prev => ({ ...prev, [i]: { percent: 100, status: 'success' } }));
                } catch (err) {
                    setUploadProgress(prev => ({ ...prev, [i]: { percent: 0, status: 'error' } }));
                    throw err;
                }
            }

            return uploadedUrls;
        } catch (error) {
            throw new Error('Upload ảnh thất bại');
        }
    };

    // NAVIGATION
    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => prev - 1);
    };

    // SUBMIT
    const handleSubmit = async () => {
        if (!validateStep(2)) return;

        try {
            setLoading(true);

            let imageUrls = [];
            if (imageFiles.length > 0) {
                message.loading('Đang upload ảnh...', 0);
                imageUrls = await uploadImages();
                message.destroy();
                message.success(`Đã upload ${imageUrls.length} ảnh`);
            }

            const allAmenitiesMap = [...AMENITIES_LIST, ...customAmenities];
            const amenityLabels = formData.amenities.map(id => {
                const amenity = allAmenitiesMap.find(a => a.id === id);
                return amenity ? amenity.label : id;
            });

            const listingData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                price: Number(formData.price),
                area: Number(formData.area),
                address: {
                    street: formData.street.trim(),
                    ward: formData.ward.trim(),
                    district: formData.district.trim(),
                    city: formData.city.trim()
                },
                location: {
                    latitude: Number(coordinates.latitude),
                    longitude: Number(coordinates.longitude)
                },
                amenities: amenityLabels,
                images: imageUrls
            };

            await listingApi.createListing(listingData);
            message.success('Đăng bài thành công!');
            navigate('/landlord/my-listings');
        } catch (error) {
            message.error(error.message || 'Không thể đăng bài');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToListings = () => {
        if (window.confirm('Bạn có chắc muốn hủy? Các thông tin đã nhập sẽ bị mất.')) {
            navigate('/landlord/my-listings');
        }
    };

    // ⭐ ENHANCED STYLES
    const styles = {
        container: {
            minHeight: '100vh',
            background: 'linear-gradient(to bottom right, rgb(255 251 235), rgb(254 243 199), rgb(255 237 213))',
            padding: '40px 24px'
        },
        backButton: {
            maxWidth: '1400px',
            margin: '0 auto 24px auto',
            padding: '14px 24px',
            background: COLORS.white,
            border: `2px solid ${COLORS.border}`,
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            color: COLORS.text,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: 'fit-content',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        },
        titleCard: {
            maxWidth: '1400px',
            margin: '0 auto 32px auto',
            background: 'linear-gradient(to bottom right, white, rgb(239 246 255), rgb(255 237 213))',
            borderRadius: '24px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(91, 169, 211, 0.2)',
            position: 'relative',
            overflow: 'hidden'
        },
        titleCardOverlay: {
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '100%',
            background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'none\'/%3E%3Cpath d=\'M0 0l50 50-50 50z\' fill=\'%23fff\' opacity=\'.05\'/%3E%3C/svg%3E") repeat',
            opacity: 0.1
        },
        title: {
            fontSize: '42px',
            fontWeight: '900',
            margin: '0 0 12px 0',
            letterSpacing: '-1px',
            color: '#ff8c42',
            textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff',
            position: 'relative',
            zIndex: 1
        },
        subtitle: {
            fontSize: '18px',
            margin: 0,
            color: '#e06a1a',
            fontWeight: '500',
            position: 'relative',
            zIndex: 1
        },
        stepperCard: {
            maxWidth: '1400px',
            margin: '0 auto 32px auto',
            background: COLORS.white,
            borderRadius: '24px',
            border: `1px solid ${COLORS.border}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            padding: '40px 48px'
        },
        stepperContainer: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            position: 'relative'
        },
        stepItem: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            position: 'relative'
        },
        stepCircle: (stepNumber, currentStep) => {
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return {
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: '700',
                background: isCompleted
                    ? `linear-gradient(135deg, ${COLORS.success} 0%, #059669 100%)`
                    : isCurrent
                        ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`
                        : COLORS.gray,
                color: isCompleted || isCurrent ? COLORS.white : COLORS.textLight,
                border: `4px solid ${isCompleted ? COLORS.success : isCurrent ? COLORS.primary : COLORS.border}`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isCompleted || isCurrent
                    ? `0 8px 24px ${isCompleted ? COLORS.success : COLORS.primary}40`
                    : 'none',
                transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                position: 'relative',
                zIndex: 2
            };
        },
        stepTitle: (stepNumber, currentStep) => {
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return {
                fontSize: '18px',
                fontWeight: '700',
                color: isCompleted
                    ? COLORS.success
                    : isCurrent
                        ? COLORS.primary
                        : COLORS.textLight,
                textAlign: 'center',
                marginBottom: '4px',
                transition: 'all 0.3s ease'
            };
        },
        stepDesc: (stepNumber, currentStep) => {
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return {
                fontSize: '14px',
                color: isCompleted || isCurrent ? COLORS.text : COLORS.textLight,
                textAlign: 'center',
                fontWeight: '500'
            };
        },
        stepConnector: (stepNumber, currentStep) => {
            const isCompleted = stepNumber < currentStep;

            return {
                position: 'absolute',
                top: '40px',
                left: 'calc(50% + 60px)',
                width: 'calc(100% - 80px)',
                height: '4px',
                background: isCompleted
                    ? `linear-gradient(90deg, ${COLORS.success} 0%, ${COLORS.primary} 100%)`
                    : COLORS.border,
                transition: 'all 0.6s ease',
                borderRadius: '2px',
                zIndex: 1
            };
        },
        formCard: {
            maxWidth: '1400px',
            margin: '0 auto',
            background: COLORS.white,
            borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            overflow: 'hidden'
        },
        formContent: {
            padding: '56px 72px',
            minHeight: '600px'
        },
        stepHeader: {
            textAlign: 'center',
            marginBottom: '48px',
            padding: '32px',
            background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.white} 100%)`,
            borderRadius: '20px',
            border: `2px solid ${COLORS.primary}20`,
            position: 'relative',
            overflow: 'hidden'
        },
        stepHeaderIcon: {
            fontSize: '56px',
            color: COLORS.primary,
            marginBottom: '16px',
            animation: 'bounce 2s infinite'
        },
        formStepTitle: {
            fontSize: '32px',
            fontWeight: '800',
            color: COLORS.primary,
            margin: '12px 0 8px 0',
            letterSpacing: '-0.5px'
        },
        formStepDesc: {
            fontSize: '16px',
            color: COLORS.textLight,
            margin: 0,
            fontWeight: '500'
        },
        formItem: {
            marginBottom: '32px'
        },
        label: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '16px',
            fontWeight: '700',
            color: COLORS.text,
            marginBottom: '12px'
        },
        // ⭐ BEAUTIFUL AMENITIES GRID
        amenitiesContainer: {
            marginTop: '24px'
        },
        amenitiesControlBar: {
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            padding: '20px',
            background: `linear-gradient(135deg, ${COLORS.primaryLight}40 0%, ${COLORS.purpleLight}40 100%)`,
            borderRadius: '16px',
            border: `2px dashed ${COLORS.primary}30`
        },
        controlButton: (isActive = false) => ({
            flex: 1,
            padding: '16px 24px',
            border: `3px solid ${isActive ? COLORS.primary : COLORS.border}`,
            borderRadius: '14px',
            background: isActive
                ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`
                : COLORS.white,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontWeight: '700',
            fontSize: '16px',
            color: isActive ? COLORS.white : COLORS.text,
            boxShadow: isActive
                ? `0 8px 24px ${COLORS.primary}40`
                : '0 2px 8px rgba(0,0,0,0.04)',
            transform: isActive ? 'translateY(-2px)' : 'translateY(0)'
        }),
        amenitiesGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
        },
        amenityCard: (selected, color) => ({
            padding: '24px 20px',
            border: `3px solid ${selected ? color || COLORS.primary : COLORS.border}`,
            borderRadius: '16px',
            background: selected
                ? `linear-gradient(135deg, ${color || COLORS.primary}15 0%, ${COLORS.white} 100%)`
                : COLORS.white,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontWeight: '600',
            fontSize: '16px',
            color: selected ? color || COLORS.primary : COLORS.text,
            boxShadow: selected
                ? `0 8px 24px ${color || COLORS.primary}25`
                : '0 2px 8px rgba(0,0,0,0.04)',
            transform: selected ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
            position: 'relative',
            overflow: 'hidden'
        }),
        amenityIcon: (color) => ({
            fontSize: '28px',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${color || COLORS.primary}15`,
            borderRadius: '14px',
            color: color || COLORS.primary,
            flexShrink: 0
        }),
        amenityLabel: {
            flex: 1,
            fontSize: '16px',
            fontWeight: '600'
        },
        amenityCheckmark: {
            fontSize: '20px',
            color: COLORS.success,
            position: 'absolute',
            top: '12px',
            right: '12px'
        },
        customAmenityDelete: {
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: COLORS.error,
            color: COLORS.white,
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'all 0.2s ease',
            zIndex: 10
        },
        addAmenitySection: {
            padding: '24px',
            background: `linear-gradient(135deg, ${COLORS.accentLight} 0%, ${COLORS.white} 100%)`,
            borderRadius: '16px',
            border: `2px dashed ${COLORS.accent}`,
            marginTop: '16px'
        },
        addAmenityButton: {
            width: '100%',
            padding: '20px',
            border: `3px dashed ${COLORS.accent}`,
            borderRadius: '14px',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontWeight: '700',
            fontSize: '16px',
            color: COLORS.accent
        },
        addAmenityInputGroup: {
            display: 'flex',
            gap: '12px',
            marginTop: '16px',
            animation: 'slideDown 0.3s ease'
        },
        imageUploadArea: {
            border: `3px dashed ${COLORS.border}`,
            borderRadius: '20px',
            padding: '64px',
            textAlign: 'center',
            background: `linear-gradient(135deg, ${COLORS.gray} 0%, ${COLORS.white} 100%)`,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        },
        imagePreviewGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '24px',
            marginTop: '32px'
        },
        imagePreview: {
            position: 'relative',
            paddingBottom: '100%',
            borderRadius: '20px',
            overflow: 'hidden',
            border: `3px solid ${COLORS.border}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease'
        },
        buttonGroup: {
            display: 'flex',
            gap: '24px',
            padding: '32px 72px',
            background: `linear-gradient(180deg, ${COLORS.white} 0%, ${COLORS.gray} 100%)`,
            borderTop: `2px solid ${COLORS.border}`
        },
        button: {
            flex: 1,
            padding: '20px 32px',
            fontSize: '17px',
            fontWeight: '700',
            borderRadius: '16px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        },
        buttonPrimary: {
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
            color: COLORS.white
        },
        buttonSecondary: {
            background: COLORS.white,
            color: COLORS.text,
            border: `2px solid ${COLORS.border}`
        },
        buttonSuccess: {
            background: `linear-gradient(135deg, ${COLORS.success} 0%, #059669 100%)`,
            color: COLORS.white
        },
        // ⭐ MAP PICKER MODAL STYLES
        mapPickerModal: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
        },
        mapPickerContent: {
            background: COLORS.white,
            borderRadius: '24px',
            width: '100%',
            maxWidth: '1400px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'modalSlideIn 0.3s ease'
        },
        modalHeader: {
            padding: '28px 32px',
            borderBottom: `3px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.white} 100%)`
        },
        modalTitle: {
            margin: 0,
            fontSize: '26px',
            fontWeight: '800',
            color: COLORS.primary,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        modalDesc: {
            margin: '6px 0 0 0',
            fontSize: '15px',
            color: COLORS.textLight,
            fontWeight: '500'
        },
        closeButton: {
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: COLORS.gray,
            color: COLORS.text,
            fontSize: '22px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            fontWeight: '700'
        },
        mapContainer: {
            flex: 1,
            minHeight: '500px'
        },
        footerInfo: {
            padding: '20px 32px',
            borderTop: `2px solid ${COLORS.border}`,
            background: COLORS.gray,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        tipText: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '14px',
            color: COLORS.textLight,
            fontWeight: '500'
        },
        coordinatesLabel: {
            padding: '8px 16px',
            background: COLORS.primaryLight,
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            color: COLORS.primary
        }
    };

    // RENDER STEP CONTENT
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div>
                        <div style={styles.stepHeader}>
                            <div style={styles.stepHeaderIcon}>
                                <InfoCircleOutlined />
                            </div>
                            <h2 style={styles.formStepTitle}>Thông tin cơ bản</h2>
                            <p style={styles.formStepDesc}>Nhập tiêu đề, mô tả và thông tin giá cả</p>
                        </div>

                        <Row gutter={[24, 24]}>
                            <Col span={24}>
                                <div style={styles.formItem}>
                                    <label style={styles.label}>
                                        <EditOutlined />
                                        <span>Tiêu đề</span>
                                        <span style={{ color: COLORS.error }}>*</span>
                                    </label>
                                    <Input
                                        size="large"
                                        placeholder="VD: Phòng trọ đẹp gần trường ĐH..."
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        style={{
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`,
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                            </Col>

                            <Col span={24}>
                                <div style={styles.formItem}>
                                    <label style={styles.label}>
                                        <FileTextOutlined />
                                        <span>Mô tả chi tiết</span>
                                        <span style={{ color: COLORS.error }}>*</span>
                                    </label>
                                    <TextArea
                                        rows={6}
                                        placeholder="Mô tả về phòng trọ, tiện ích, vị trí..."
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        style={{
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`,
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                            </Col>

                            <Col span={12}>
                                <div style={styles.formItem}>
                                    <label style={styles.label}>
                                        <DollarOutlined />
                                        <span>Giá thuê (VNĐ/tháng)</span>
                                        <span style={{ color: COLORS.error }}>*</span>
                                    </label>
                                    <InputNumber
                                        size="large"
                                        min={100000}
                                        max={50000000}
                                        step={100000}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        placeholder="3,000,000"
                                        value={formData.price}
                                        onChange={(value) => handleChange('price', value)}
                                        style={{
                                            width: '100%',
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`
                                        }}
                                    />
                                </div>
                            </Col>

                            <Col span={12}>
                                <div style={styles.formItem}>
                                    <label style={styles.label}>
                                        <ExpandOutlined />
                                        <span>Diện tích (m²)</span>
                                        <span style={{ color: COLORS.error }}>*</span>
                                    </label>
                                    <InputNumber
                                        size="large"
                                        min={10}
                                        max={200}
                                        placeholder="25"
                                        value={formData.area}
                                        onChange={(value) => handleChange('area', value)}
                                        style={{
                                            width: '100%',
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`
                                        }}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </div>
                );

            case 2:
                return (
                    <div>
                        <div style={styles.stepHeader}>
                            <div style={styles.stepHeaderIcon}>
                                <EnvironmentOutlined />
                            </div>
                            <h2 style={styles.formStepTitle}>Vị trí & Tiện ích</h2>
                            <p style={styles.formStepDesc}>Chọn vị trí trên bản đồ hoặc nhập địa chỉ</p>
                        </div>

                        {/* Map Component */}
                        <div style={{ marginBottom: '40px' }}>
                            <InteractiveMapComponent
                                onLocationSelect={handleMapLocationSelect}
                                coordinates={coordinates}
                                isGeocoding={geocoding || isReverseGeocoding}
                            />
                        </div>

                        {/* Address Fields */}
                        <Row gutter={[24, 24]}>
                            <Col span={24}>
                                <div style={styles.formItem}>
                                    <label style={styles.label}>
                                        <HomeOutlined />
                                        <span>Địa chỉ (Số nhà, Đường)</span>
                                        <span style={{ color: COLORS.error }}>*</span>
                                    </label>
                                    <Input
                                        size="large"
                                        placeholder="VD: 123 Nguyễn Huệ"
                                        value={formData.street}
                                        onChange={(e) => handleChange('street', e.target.value)}
                                        style={{
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`,
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                            </Col>

                            <Col span={8}>
                                <div style={styles.formItem}>
                                    <label style={styles.label}>
                                        <BankOutlined />
                                        <span>Phường/Xã</span>
                                    </label>
                                    <Input
                                        size="large"
                                        placeholder="VD: Phường Bến Nghé"
                                        value={formData.ward}
                                        onChange={(e) => handleChange('ward', e.target.value)}
                                        style={{
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`,
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                            </Col>

                            <Col span={8}>
                                <div style={styles.formItem}>
                                    <label style={styles.label}>
                                        <CompassOutlined />
                                        <span>Quận/Huyện</span>
                                        <span style={{ color: COLORS.error }}>*</span>
                                    </label>
                                    <Input
                                        size="large"
                                        placeholder="VD: Quận 1"
                                        value={formData.district}
                                        onChange={(e) => handleChange('district', e.target.value)}
                                        style={{
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`,
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                            </Col>

                            <Col span={8}>
                                <div style={styles.formItem}>
                                    <label style={styles.label}>
                                        <GlobalOutlined />
                                        <span>Thành phố</span>
                                        <span style={{ color: COLORS.error }}>*</span>
                                    </label>
                                    <Select
                                        size="large"
                                        value={formData.city}
                                        onChange={(value) => handleChange('city', value)}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value="TP.HCM">TP. Hồ Chí Minh</Option>
                                        <Option value="Hà Nội">Hà Nội</Option>
                                        <Option value="Đà Nẵng">Đà Nẵng</Option>
                                    </Select>
                                </div>
                            </Col>

                            {/* Status Display */}
                            <Col span={24}>
                                <div style={{
                                    padding: '20px 24px',
                                    background: coordinatesFound
                                        ? `linear-gradient(135deg, ${COLORS.successLight} 0%, ${COLORS.white} 100%)`
                                        : `linear-gradient(135deg, ${COLORS.warningLight} 0%, ${COLORS.white} 100%)`,
                                    border: `3px solid ${coordinatesFound ? COLORS.success : COLORS.warning}40`,
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    {geocoding || isReverseGeocoding ? (
                                        <>
                                            <LoadingOutlined style={{ fontSize: '24px', color: COLORS.primary }} />
                                            <div>
                                                <div style={{ fontWeight: '700', color: COLORS.primary, marginBottom: '4px' }}>
                                                    Đang xử lý...
                                                </div>
                                                <div style={{ fontSize: '14px', color: COLORS.textLight }}>
                                                    {geocoding ? 'Đang tìm tọa độ từ địa chỉ' : 'Đang tìm địa chỉ từ bản đồ'}
                                                </div>
                                            </div>
                                        </>
                                    ) : coordinatesFound ? (
                                        <>
                                            <CheckOutlined style={{ fontSize: '24px', color: COLORS.success }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '700', color: COLORS.success, marginBottom: '4px' }}>
                                                    ✅ Vị trí đã được xác định
                                                </div>
                                                <div style={{ fontSize: '14px', color: COLORS.text }}>
                                                    Vĩ độ: {coordinates.latitude?.toFixed(6)} | Kinh độ: {coordinates.longitude?.toFixed(6)}
                                                </div>
                                                {mapPickedLocation && (
                                                    <div style={{ fontSize: '13px', color: COLORS.textLight, marginTop: '4px', fontStyle: 'italic' }}>
                                                        📍 Đã chọn từ bản đồ
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <EnvironmentOutlined style={{ fontSize: '24px', color: COLORS.warning }} />
                                            <div>
                                                <div style={{ fontWeight: '700', color: COLORS.warning, marginBottom: '4px' }}>
                                                    Chưa xác định vị trí
                                                </div>
                                                <div style={{ fontSize: '14px', color: COLORS.textLight }}>
                                                    Vui lòng nhập đầy đủ địa chỉ hoặc chọn trên bản đồ
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Col>

                            {/* ⭐ BEAUTIFUL AMENITIES SECTION */}
                            <Col span={24} style={{ marginTop: '32px' }}>
                                <div style={styles.formItem}>
                                    <label style={styles.label}>
                                        <StarOutlined />
                                        <span>Tiện ích</span>
                                    </label>

                                    {/* Control Bar */}
                                    <div style={styles.amenitiesControlBar}>
                                        <button
                                            type="button"
                                            onClick={toggleSelectAll}
                                            style={styles.controlButton(
                                                formData.amenities.length === [...AMENITIES_LIST, ...customAmenities].length
                                            )}
                                        >
                                            <CheckSquareOutlined style={{ fontSize: '20px' }} />
                                            <span>
                                                {formData.amenities.length === [...AMENITIES_LIST, ...customAmenities].length
                                                    ? 'Bỏ chọn tất cả'
                                                    : 'Chọn tất cả'}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Amenities Grid */}
                                    <div style={styles.amenitiesGrid}>
                                        {/* Default Amenities */}
                                        {AMENITIES_LIST.map(amenity => {
                                            const selected = formData.amenities.includes(amenity.id);
                                            return (
                                                <div
                                                    key={amenity.id}
                                                    style={styles.amenityCard(selected, amenity.color)}
                                                    onClick={() => toggleAmenity(amenity.id)}
                                                    onMouseEnter={(e) => {
                                                        if (!selected) {
                                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                                            e.currentTarget.style.boxShadow = `0 8px 24px ${amenity.color}20`;
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!selected) {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                                        }
                                                    }}
                                                >
                                                    {/* Amenity Icon - Use Ant Design Icon */}
                                                    <div style={styles.amenityIcon(amenity.color)}>
                                                        {amenity.icon}
                                                    </div>
                                                    <span style={styles.amenityLabel}>{amenity.label}</span>
                                                    {selected && (
                                                        <span style={styles.amenityCheckmark}>
                                                            <CheckOutlined />
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Custom Amenities */}
                                        {customAmenities.map(amenity => {
                                            const selected = formData.amenities.includes(amenity.id);
                                            return (
                                                <div
                                                    key={amenity.id}
                                                    style={styles.amenityCard(selected, amenity.color)}
                                                    onClick={() => toggleAmenity(amenity.id)}
                                                    onMouseEnter={(e) => {
                                                        const deleteBtn = e.currentTarget.querySelector('[data-delete]');
                                                        if (deleteBtn) deleteBtn.style.opacity = '1';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        const deleteBtn = e.currentTarget.querySelector('[data-delete]');
                                                        if (deleteBtn) deleteBtn.style.opacity = '0';
                                                    }}
                                                >
                                                    <div style={styles.amenityIcon(amenity.color)}>
                                                        {amenity.icon}
                                                    </div>
                                                    <span style={styles.amenityLabel}>{amenity.label}</span>
                                                    {selected && (
                                                        <span style={styles.amenityCheckmark}>
                                                            <CheckOutlined />
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        data-delete
                                                        style={styles.customAmenityDelete}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeCustomAmenity(amenity.id);
                                                        }}
                                                    >
                                                        <DeleteOutlined />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* ⭐ Add Custom Amenity Section */}
                                    {!showAddAmenityInput ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddAmenityInput(true)}
                                            style={styles.addAmenityButton}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = `${COLORS.accentLight}60`;
                                                e.currentTarget.style.borderColor = COLORS.accent;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.borderColor = COLORS.accent;
                                            }}
                                        >
                                            <PlusOutlined style={{ fontSize: '20px' }} />
                                            <span>Thêm tiện ích khác</span>
                                        </button>
                                    ) : (
                                        <div style={styles.addAmenitySection}>
                                            <div style={styles.addAmenityInputGroup}>
                                                <Input
                                                    size="large"
                                                    placeholder="VD: Máy nước nóng, Wifi tốc độ cao..."
                                                    value={newAmenityText}
                                                    onChange={(e) => setNewAmenityText(e.target.value)}
                                                    onPressEnter={handleAddCustomAmenity}
                                                    style={{
                                                        flex: 1,
                                                        borderRadius: '12px',
                                                        border: `2px solid ${COLORS.accent}`
                                                    }}
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddCustomAmenity}
                                                    style={{
                                                        padding: '12px 24px',
                                                        background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.error} 100%)`,
                                                        color: COLORS.white,
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        fontSize: '16px',
                                                        fontWeight: '700',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    <CheckOutlined />
                                                    Thêm
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowAddAmenityInput(false);
                                                        setNewAmenityText('');
                                                    }}
                                                    style={{
                                                        padding: '12px 24px',
                                                        background: COLORS.white,
                                                        color: COLORS.text,
                                                        border: `2px solid ${COLORS.border}`,
                                                        borderRadius: '12px',
                                                        fontSize: '16px',
                                                        fontWeight: '700',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </div>
                );

            case 3:
                return (
                    <div>
                        <div style={styles.stepHeader}>
                            <div style={styles.stepHeaderIcon}>
                                <CameraOutlined />
                            </div>
                            <h2 style={styles.formStepTitle}>Hình ảnh</h2>
                            <p style={styles.formStepDesc}>Tải lên hình ảnh phòng trọ (tối đa 5 ảnh)</p>
                        </div>

                        <Row gutter={[24, 24]}>
                            <Col span={24}>
                                <input
                                    type="file"
                                    id="imageUpload"
                                    multiple
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleImageSelect}
                                />

                                {imagePreviews.length < 5 && (
                                    <div
                                        style={styles.imageUploadArea}
                                        onClick={() => document.getElementById('imageUpload').click()}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = COLORS.primary;
                                            e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.white} 100%)`;
                                            e.currentTarget.style.transform = 'scale(1.01)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = COLORS.border;
                                            e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.gray} 0%, ${COLORS.white} 100%)`;
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                                            <UploadOutlined style={{ color: COLORS.primary }} />
                                        </div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: COLORS.text, marginBottom: '8px' }}>
                                            Tải ảnh lên
                                        </div>
                                        <div style={{ fontSize: '15px', color: COLORS.textLight, fontWeight: '500' }}>
                                            {imagePreviews.length}/5 ảnh đã chọn
                                        </div>
                                    </div>
                                )}

                                {imagePreviews.length > 0 && (
                                    <div style={styles.imagePreviewGrid}>
                                        {imagePreviews.map((preview, index) => (
                                            <div
                                                key={index}
                                                style={styles.imagePreview}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.05)';
                                                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                                                }}
                                            >
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index + 1}`}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => removeImage(index)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '12px',
                                                        right: '12px',
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: COLORS.error,
                                                        color: COLORS.white,
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '18px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                                {uploadProgress[index] && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: '6px',
                                                        background: uploadProgress[index].status === 'success'
                                                            ? COLORS.success
                                                            : uploadProgress[index].status === 'error'
                                                                ? COLORS.error
                                                                : COLORS.primary,
                                                        width: `${uploadProgress[index].percent}%`,
                                                        transition: 'width 0.3s ease'
                                                    }} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div style={styles.container}>
            {/* Animations */}
            <style>
                {`
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }

                    @keyframes slideDown {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    @keyframes modalSlideIn {
                        from {
                            opacity: 0;
                            transform: scale(0.95) translateY(-20px);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }
                `}
            </style>

            {/* Back Button */}
            <button
                style={styles.backButton}
                onClick={handleBackToListings}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = COLORS.gray;
                    e.currentTarget.style.borderColor = COLORS.primary;
                    e.currentTarget.style.color = COLORS.primary;
                    e.currentTarget.style.transform = 'translateX(-4px)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = COLORS.white;
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.color = COLORS.text;
                    e.currentTarget.style.transform = 'translateX(0)';
                }}
            >
                <LeftOutlined />
                <span>Quay lại Danh sách</span>
            </button>

            {/* ⭐ TITLE SECTION */}
            <div style={styles.titleCard}>
                <h1 style={styles.title}>Đăng phòng mới</h1>
                <p style={styles.subtitle}>Điền thông tin để bắt đầu cho thuê phòng trọ</p>
            </div>

            {/* ⭐ STEPPER SECTION */}
            <div style={styles.stepperCard}>
                <div style={styles.stepperContainer}>
                    {steps.map((step, index) => {
                        const stepNumber = index + 1;
                        const isCompleted = stepNumber < currentStep;
                        const isCurrent = stepNumber === currentStep;

                        return (
                            <div key={stepNumber} style={styles.stepItem}>
                                <div style={styles.stepCircle(stepNumber, currentStep)}>
                                    {isCompleted ? <CheckOutlined /> : step.icon}
                                </div>
                                {/* ⭐ FIX: Use renamed style function */}
                                <div style={styles.stepTitle(stepNumber, currentStep)}>
                                    {step.title}
                                </div>
                                {/* ⭐ FIX: Use renamed style function */}
                                <div style={styles.stepDesc(stepNumber, currentStep)}>
                                    {step.description}
                                </div>
                                {index < steps.length - 1 && (
                                    <div style={styles.stepConnector(stepNumber, currentStep)} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ⭐ FORM SECTION */}
            <div style={styles.formCard}>
                {/* Form Content */}
                <div style={styles.formContent}>
                    {renderStepContent()}
                </div>

                {/* Button Group */}
                <div style={styles.buttonGroup}>
                    {currentStep > 1 && (
                        <button
                            style={{ ...styles.button, ...styles.buttonSecondary }}
                            onClick={handlePrevious}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = COLORS.gray;
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = COLORS.white;
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <LeftOutlined />
                            <span>Quay lại</span>
                        </button>
                    )}

                    {currentStep < 3 ? (
                        <button
                            style={{ ...styles.button, ...styles.buttonPrimary }}
                            onClick={handleNext}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(91, 169, 211, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = SHADOWS.button;
                            }}
                        >
                            <span>Tiếp theo</span>
                            <RightOutlined />
                        </button>
                    ) : (
                        <button
                            style={{
                                ...styles.button,
                                ...styles.buttonSuccess,
                                background: loading
                                    ? COLORS.textLight
                                    : `linear-gradient(135deg, ${COLORS.success} 0%, #20C997 100%)`,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                            onClick={handleSubmit}
                            disabled={loading}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                            }}
                        >
                            {loading ? (
                                <>
                                    <LoadingOutlined />
                                    <span>Đang xử lý...</span>
                                </>
                            ) : (
                                <>
                                    <CheckOutlined />
                                    <span>Đăng phòng</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* ⭐ MAP PICKER MODAL - Using PickMapComponent */}
            {showMapPicker && (
                <div style={styles.mapPickerModal}>
                    <div style={styles.mapPickerContent}>
                        {/* Modal Header */}
                        <div style={styles.modalHeader}>
                            <div>
                                <h2 style={styles.modalTitle}>
                                    <EnvironmentOutlined style={{ fontSize: '30px' }} />
                                    Chọn vị trí trên bản đồ
                                </h2>
                                <p style={styles.modalDesc}>
                                    Click vào bản đồ hoặc kéo marker để chọn vị trí chính xác cho phòng trọ
                                </p>
                            </div>
                            <button
                                onClick={() => setShowMapPicker(false)}
                                style={styles.closeButton}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = COLORS.error;
                                    e.currentTarget.style.color = COLORS.white;
                                    e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = COLORS.gray;
                                    e.currentTarget.style.color = COLORS.text;
                                    e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                                }}
                            >
                                <CloseOutlined />
                            </button>
                        </div>

                        {/* Map Container */}
                        <div style={styles.mapContainer}>
                            <PickMapComponent
                                onLocationSelect={handleMapLocationSelect}
                                initialCenter={
                                    coordinates.latitude && coordinates.longitude
                                        ? [coordinates.longitude, coordinates.latitude]
                                        : [106.6297, 10.8231]
                                }
                                initialZoom={coordinates.latitude && coordinates.longitude ? 15 : 12}
                                currentCoordinates={
                                    coordinates.latitude && coordinates.longitude
                                        ? coordinates
                                        : null
                                }
                            />
                        </div>

                        {/* Footer Info */}
                        <div style={styles.footerInfo}>
                            <div style={styles.tipText}>
                                <span>💡 <strong>Tip:</strong> Kéo marker để điều chỉnh vị trí chính xác</span>
                            </div>
                            {coordinates.latitude && coordinates.longitude && (
                                <div style={styles.coordinatesLabel}>
                                    📍 {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add CSS for modal animation */}
            <style>
                {`
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}
            </style>
        </div>
    );
};

export default CreateListing;
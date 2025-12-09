import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Form,
    Button,
    Input,
    InputNumber,
    Select,
    Upload,
    message,
    Modal,
    Card,
    Row,
    Col,
    Space,
    Spin,
    Tag,
    Divider,
    Checkbox
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    ArrowLeftOutlined,
    CheckOutlined,
    EnvironmentOutlined,
    HomeOutlined,
    DollarOutlined,
    CameraOutlined,
    InfoCircleOutlined,
    StarOutlined,
    CloseOutlined,
    CheckSquareOutlined,
    PlusCircleOutlined,
    ExpandOutlined,
    WifiOutlined,
    ThunderboltOutlined,
    InboxOutlined,
    SyncOutlined,
    CarOutlined,
    SafetyOutlined,
    VerticalAlignTopOutlined,
    BuildOutlined
} from '@ant-design/icons';
import { listingApi, uploadApi } from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

const EditListing = () => {
    const { listingId } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // ⭐ ORANGE THEME COLORS
    const COLORS = {
        primary: '#FF8C42',        // ⭐ Changed from #5ba9d3
        primaryLight: '#FFF5ED',   // ⭐ Changed from #e8f4f8
        primaryDark: '#E67A2E',    // ⭐ Changed from #4a8fb5
        secondary: '#FFB366',      // ⭐ Changed from #7bc4e0
        white: '#FFFFFF',
        gray: '#F8F9FA',
        grayDark: '#E5E7EB',
        border: '#E0E6ED',
        text: '#2D3748',
        textLight: '#718096',
        success: '#28A745',
        error: '#DC3545',
        warning: '#FFC107',
        background: 'linear-gradient(135deg, #fffaf5 0%, #fff5ed 100%)' // ⭐ Orange tint background
    };

    // ⭐ PREDEFINED AMENITIES WITH EMOJIS
    const AMENITIES_LIST = [
        { label: 'WiFi', value: 'wifi', icon: <WifiOutlined />, color: '#3B82F6' },
        { label: 'Điều hòa', value: 'aircon', icon: <ThunderboltOutlined />, color: '#06B6D4' },
        { label: 'Tủ lạnh', value: 'fridge', icon: <InboxOutlined />, color: '#8B5CF6' },
        { label: 'Máy giặt', value: 'washing', icon: <SyncOutlined />, color: '#EC4899' },
        { label: 'Gửi xe', value: 'parking', icon: <CarOutlined />, color: '#F59E0B' },
        { label: 'An ninh 24/7', value: 'security', icon: <SafetyOutlined />, color: '#EF4444' },
        { label: 'Thang máy', value: 'elevator', icon: <VerticalAlignTopOutlined />, color: '#10B981' },
        { label: 'Ban công', value: 'balcony', icon: <BuildOutlined />, color: '#14B8A6' }
    ];

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // ⭐ ADD THIS - Force re-render when amenities change
    const [selectedAmenities, setSelectedAmenities] = useState([]);

    // Image states
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [deletedImages, setDeletedImages] = useState([]);

    const [formData, setFormData] = useState({});
    const [originalListing, setOriginalListing] = useState(null);

    // ⭐ CUSTOM AMENITIES STATE
    const [customAmenities, setCustomAmenities] = useState([]);
    const [newAmenityInput, setNewAmenityInput] = useState('');
    const [showAmenityInput, setShowAmenityInput] = useState(false);

    const steps = [
        {
            title: 'Thông tin cơ bản',
            description: 'Tiêu đề, mô tả, giá',
            icon: <InfoCircleOutlined />
        },
        {
            title: 'Vị trí & Tiện ích',
            description: 'Địa chỉ, diện tích',
            icon: <EnvironmentOutlined />
        },
        {
            title: 'Hình ảnh',
            description: 'Quản lý ảnh phòng',
            icon: <CameraOutlined />
        }
    ];

    // ⭐ ENHANCED STYLES
    const styles = {
        container: {
            minHeight: '100vh',
            background: COLORS.background
        },
        headerBar: {
            background: COLORS.white,
            boxShadow: '0 2px 12px rgba(91, 169, 211, 0.1)',
            borderBottom: `2px solid ${COLORS.border}`,
            padding: '20px 0',
            position: 'sticky',
            top: 0,
            zIndex: 100
        },
        backButton: {
            borderRadius: '12px',
            border: `2px solid ${COLORS.primary}`,
            color: COLORS.primary,
            fontWeight: '600',
            height: '44px',
            padding: '0 20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '15px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
        },
        content: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '40px 24px'
        },
        stepperCard: {
            background: COLORS.white,
            borderRadius: '24px',
            padding: '48px 72px',
            boxShadow: '0 8px 32px rgba(91, 169, 211, 0.12)',
            border: `2px solid ${COLORS.border}`,
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden'
        },
        stepperBackground: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${COLORS.primaryLight}15 0%, transparent 50%, ${COLORS.white} 100%)`,
            pointerEvents: 'none'
        },
        stepCard: {
            background: COLORS.white,
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)',
            border: `2px solid ${COLORS.border}`,
            marginBottom: '24px'
        },
        formItem: {
            marginBottom: '24px'
        },
        label: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '15px',
            fontWeight: '700',
            color: COLORS.text,
            marginBottom: '8px'
        },
        imageCard: {
            border: `2px solid ${COLORS.border}`,
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.3s ease',
            background: COLORS.gray
        },
        deleteImageBtn: {
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: COLORS.error,
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            color: COLORS.white,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(220, 53, 69, 0.4)',
            transition: 'all 0.2s ease',
            zIndex: 2
        },
        navigationBar: {
            background: COLORS.white,
            borderRadius: '20px',
            padding: '24px 32px',
            boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)',
            border: `2px solid ${COLORS.border}`,
            marginTop: '32px',
            position: 'sticky',
            bottom: '20px',
            zIndex: 50
        },
        actionButton: (type) => {
            const baseStyles = {
                borderRadius: '12px',
                fontWeight: '700',
                height: '52px',
                padding: '0 32px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
            };

            const typeStyles = {
                primary: {
                    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                    color: COLORS.white,
                    boxShadow: `0 4px 16px ${COLORS.primary}40`
                },
                secondary: {
                    background: COLORS.white,
                    border: `2px solid ${COLORS.primary}`,
                    color: COLORS.primary
                }
            };

            return { ...baseStyles, ...typeStyles[type] };
        }
    };

    useEffect(() => {
        fetchListingDetail();
    }, [listingId]);

    const fetchListingDetail = async () => {
        try {
            setLoading(true);
            console.log('📤 Fetching listing detail for edit:', listingId);

            const data = await listingApi.getListingById(listingId);
            console.log('📄 Loaded listing for edit:', data);

            setOriginalListing(data);

            // ⭐ FIX: PROPERLY SEPARATE AMENITIES
            const allAmenities = data.amenities || [];
            const predefinedValues = AMENITIES_LIST.map(a => a.value); // ['wifi', 'aircon', 'fridge'...]

            console.log('🔍 All amenities from API:', allAmenities);
            console.log('🔍 Predefined values:', predefinedValues);

            // Separate standard vs custom amenities
            const standardAmenities = [];
            const customAmenitiesFromData = [];

            allAmenities.forEach(amenity => {
                // Check if it's a predefined amenity (by value)
                if (predefinedValues.includes(amenity)) {
                    standardAmenities.push(amenity);
                } else {
                    // Check if it matches the label (for backwards compatibility)
                    const matchedAmenity = AMENITIES_LIST.find(a =>
                        a.label.toLowerCase().includes(amenity.toLowerCase()) ||
                        amenity.toLowerCase().includes(a.label.split(' ').slice(1).join(' ').toLowerCase())
                    );

                    if (matchedAmenity) {
                        standardAmenities.push(matchedAmenity.value);
                    } else {
                        // It's a custom amenity
                        customAmenitiesFromData.push(amenity);
                    }
                }
            });

            console.log('✅ Standard amenities:', standardAmenities);
            console.log('✅ Custom amenities:', customAmenitiesFromData);

            // Set custom amenities state
            setCustomAmenities(customAmenitiesFromData);

            // ⭐ FIX: Set form values with ALL amenities (standard + custom)
            const formValues = {
                title: data.title,
                description: data.description,
                price: data.price,
                area: data.area,
                street: data.address?.street || '',
                ward: data.address?.ward || '',
                district: data.address?.district || '',
                city: data.address?.city || '',
                amenities: [...standardAmenities, ...customAmenitiesFromData] // Include both!
            };

            console.log('📝 Form values:', formValues);

            form.setFieldsValue(formValues);
            setFormData(formValues);

            const images = data.images || data.imageUrls || [];
            setExistingImages(images);

            // ⭐ Force re-render to show selected amenities
            setTimeout(() => {
                form.setFieldsValue({ amenities: formValues.amenities });
                setSelectedAmenities([...formValues.amenities]); // ⭐ ADD THIS
            }, 100);

        } catch (error) {
            console.error('Fetch listing error:', error);
            message.error('Không thể tải thông tin bài đăng');
            navigate('/landlord/my-listings');
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (changedValues) => {
        setFormData(prev => ({ ...prev, ...changedValues }));
    };

    // ⭐ FIXED AMENITY HANDLERS
    const toggleAmenity = (value) => {
        const currentAmenities = form.getFieldValue('amenities') || [];
        const newAmenities = currentAmenities.includes(value)
            ? currentAmenities.filter(a => a !== value)
            : [...currentAmenities, value];

        form.setFieldValue('amenities', newAmenities);
        setSelectedAmenities([...newAmenities]); // ⭐ Force re-render
    };

    const toggleSelectAll = () => {
        const allAmenityIds = [
            ...AMENITIES_LIST.map(a => a.value),
            ...customAmenities
        ];

        const currentAmenities = form.getFieldValue('amenities') || [];

        let newAmenities;
        if (currentAmenities.length === allAmenityIds.length) {
            newAmenities = [];
        } else {
            newAmenities = allAmenityIds;
        }

        form.setFieldValue('amenities', newAmenities);
        setSelectedAmenities([...newAmenities]); // ⭐ Force re-render
    };

    const handleAddCustomAmenity = () => {
        const trimmed = newAmenityInput.trim();
        if (!trimmed) {
            message.warning('Vui lòng nhập tên tiện ích');
            return;
        }

        const allExistingAmenities = [
            ...AMENITIES_LIST.map(a => a.label.split(' ').slice(1).join(' ').toLowerCase()),
            ...customAmenities.map(a => a.toLowerCase())
        ];

        if (allExistingAmenities.includes(trimmed.toLowerCase())) {
            message.warning('Tiện ích này đã tồn tại');
            return;
        }

        const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

        setCustomAmenities(prev => [...prev, capitalized]);

        const currentAmenities = form.getFieldValue('amenities') || [];
        const newAmenities = [...currentAmenities, capitalized];

        form.setFieldValue('amenities', newAmenities);
        setSelectedAmenities([...newAmenities]); // ⭐ Force re-render

        setNewAmenityInput('');
        setShowAmenityInput(false);

        message.success(`✅ Đã thêm: ${capitalized}`);
    };

    const handleDeleteCustomAmenity = (amenity) => {
        setCustomAmenities(prev => prev.filter(a => a !== amenity));

        const currentAmenities = form.getFieldValue('amenities') || [];
        const newAmenities = currentAmenities.filter(a => a !== amenity);

        form.setFieldValue('amenities', newAmenities);
        setSelectedAmenities([...newAmenities]); // ⭐ Force re-render

        message.success('🗑️ Đã xóa tiện ích');
    };

    const handleDeleteExistingImage = (imageUrl) => {
        confirm({
            title: 'Xác nhận xóa ảnh',
            icon: <ExclamationCircleOutlined />,
            content: 'Bạn có chắc chắn muốn xóa ảnh này?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: () => {
                setExistingImages(prev => prev.filter(img => img !== imageUrl));
                setDeletedImages(prev => [...prev, imageUrl]);
                message.success('Đã đánh dấu xóa ảnh');
            }
        });
    };

    const handleNewImageUpload = ({ fileList }) => {
        setNewImages(fileList.map(file => file.originFileObj).filter(Boolean));
    };

    const uploadNewImages = async () => {
        if (newImages.length === 0) return [];

        try {
            message.loading('Đang upload ảnh...', 0);

            const fileMetadata = newImages.map(file => ({
                filename: `${Date.now()}-${file.name}`,
                contentType: file.type
            }));

            const response = await uploadApi.getPresignedUrls(fileMetadata);
            let uploads = response.uploads || response.data?.uploads || [];

            const uploadPromises = newImages.map(async (file, index) => {
                const { uploadUrl, publicUrl } = uploads[index];
                await uploadApi.uploadToS3(uploadUrl, file, file.type);
                return publicUrl;
            });

            const newImageUrls = await Promise.all(uploadPromises);
            message.destroy();
            return newImageUrls;

        } catch (error) {
            message.destroy();
            console.error('❌ Upload error:', error);
            throw new Error('Upload ảnh thất bại');
        }
    };

    // ⭐ FIXED handleSubmit - Remove invalid fields
    const handleSubmit = async () => {
        try {
            setSubmitting(true);

            const currentFormData = form.getFieldsValue(true);

            // Upload new images
            let newImageUrls = [];
            if (newImages.length > 0) {
                newImageUrls = await uploadNewImages();
            }

            const finalImages = [...existingImages, ...newImageUrls];

            // ⭐ GET ALL SELECTED AMENITIES
            const selectedAmenities = currentFormData.amenities || [];

            console.log('📦 Selected amenities:', selectedAmenities);
            console.log('📦 Custom amenities:', customAmenities);

            // ⭐ IMPORTANT: Use ONLY selected amenities (don't add customAmenities separately)
            // Because customAmenities are already included in the form's amenities field
            const finalAmenities = [...new Set(selectedAmenities)]; // Remove duplicates

            const updateData = {
                title: currentFormData.title?.toString().trim(),
                description: currentFormData.description?.toString().trim(),
                price: parseFloat(currentFormData.price) || 0,
                area: parseFloat(currentFormData.area) || 0,
                address: {
                    street: currentFormData.street?.toString().trim() || '',
                    ward: currentFormData.ward?.toString().trim() || '',
                    district: currentFormData.district?.toString().trim() || '',
                    city: currentFormData.city?.toString().trim() || ''
                },
                amenities: finalAmenities, // ✅ Only selected amenities
                images: finalImages
            };

            console.log('📤 Sending update data:', updateData);

            const result = await listingApi.updateListing(listingId, updateData);

            message.success('Cập nhật thành công!');
            setTimeout(() => navigate('/landlord/my-listings'), 1500);

        } catch (error) {
            console.error('❌ UPDATE ERROR:', error);
            message.error(error.message || 'Cập nhật thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const next = async () => {
        try {
            // Validate current step fields
            const currentFields = getCurrentStepFields();
            await form.validateFields(currentFields);
            setCurrentStep(currentStep + 1);
        } catch (error) {
            message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    const getCurrentStepFields = () => {
        switch (currentStep) {
            case 0:
                return ['title', 'description', 'price'];
            case 1:
                return ['street', 'district', 'city', 'area'];
            case 2:
                return [];
            default:
                return [];
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '70vh',
                    background: COLORS.white,
                    borderRadius: '24px',
                    margin: '60px auto',
                    maxWidth: '600px',
                    boxShadow: '0 8px 32px rgba(91, 169, 211, 0.15)',
                    padding: '48px'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        border: `6px solid ${COLORS.primaryLight}`,
                        borderTop: `6px solid ${COLORS.primary}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{
                        color: COLORS.text,
                        marginTop: '24px',
                        fontSize: '18px',
                        fontWeight: '600'
                    }}>
                        Đang tải thông tin bài đăng...
                    </p>
                </div>
            </div>
        );
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <Row gutter={[24, 24]}>
                        <Col span={24}>
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '0 auto 20px',
                                    background: `linear-gradient(135deg, ${COLORS.primary}20 0%, ${COLORS.primary}10 100%)`,
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <InfoCircleOutlined style={{ fontSize: '40px', color: COLORS.primary }} />
                                </div>
                                <h2 style={{
                                    fontSize: '28px',
                                    fontWeight: '800',
                                    color: COLORS.primary,
                                    marginBottom: '8px'
                                }}>
                                    Thông tin cơ bản
                                </h2>
                                <p style={{
                                    fontSize: '16px',
                                    color: COLORS.textLight,
                                    fontWeight: '500'
                                }}>
                                    Cập nhật tiêu đề, mô tả và giá thuê
                                </p>
                            </div>
                        </Col>

                        <Col span={24}>
                            <div style={styles.formItem}>
                                <label style={styles.label}>
                                    <HomeOutlined />
                                    <span>Tiêu đề bài đăng</span>
                                    <span style={{ color: COLORS.error }}>*</span>
                                </label>
                                <Form.Item
                                    name="title"
                                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Input
                                        placeholder="VD: Phòng trọ cao cấp gần trường đại học..."
                                        size="large"
                                        style={{
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`,
                                            fontSize: '15px'
                                        }}
                                    />
                                </Form.Item>
                            </div>
                        </Col>

                        <Col span={24}>
                            <div style={styles.formItem}>
                                <label style={styles.label}>
                                    <InfoCircleOutlined />
                                    <span>Mô tả chi tiết</span>
                                    <span style={{ color: COLORS.error }}>*</span>
                                </label>
                                <Form.Item
                                    name="description"
                                    rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <TextArea
                                        rows={6}
                                        placeholder="Mô tả chi tiết về phòng trọ, vị trí, tiện ích..."
                                        style={{
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`,
                                            fontSize: '15px'
                                        }}
                                    />
                                </Form.Item>
                            </div>
                        </Col>

                        <Col span={24}>
                            <div style={styles.formItem}>
                                <label style={styles.label}>
                                    <DollarOutlined />
                                    <span>Giá thuê (VNĐ/tháng)</span>
                                    <span style={{ color: COLORS.error }}>*</span>
                                </label>
                                <Form.Item
                                    name="price"
                                    rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <InputNumber
                                        min={100000}
                                        max={50000000}
                                        step={100000}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        placeholder="3,000,000"
                                        style={{
                                            width: '100%',
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`
                                        }}
                                        size="large"
                                    />
                                </Form.Item>
                            </div>
                        </Col>
                    </Row>
                );

            case 1:
                return (
                    <Row gutter={[24, 24]}>
                        <Col span={24}>
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '0 auto 20px',
                                    background: `linear-gradient(135deg, ${COLORS.primary}20 0%, ${COLORS.primary}10 100%)`,
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <EnvironmentOutlined style={{ fontSize: '40px', color: COLORS.primary }} />
                                </div>
                                <h2 style={{
                                    fontSize: '28px',
                                    fontWeight: '800',
                                    color: COLORS.primary,
                                    marginBottom: '8px'
                                }}>
                                    Vị trí & Tiện ích
                                </h2>
                                <p style={{
                                    fontSize: '16px',
                                    color: COLORS.textLight,
                                    fontWeight: '500'
                                }}>
                                    Cập nhật địa chỉ và thông tin chi tiết
                                </p>
                            </div>
                        </Col>

                        <Col span={24}>
                            <div style={styles.formItem}>
                                <label style={styles.label}>
                                    <EnvironmentOutlined />
                                    <span>Địa chỉ (Số nhà, Đường)</span>
                                    <span style={{ color: COLORS.error }}>*</span>
                                </label>
                                <Form.Item
                                    name="street"
                                    rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Input
                                        placeholder="VD: 123 Nguyễn Huệ"
                                        size="large"
                                        style={{
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`
                                        }}
                                    />
                                </Form.Item>
                            </div>
                        </Col>

                        <Col span={8}>
                            <div style={styles.formItem}>
                                <label style={styles.label}>
                                    <span>Phường/Xã</span>
                                </label>
                                <Form.Item name="ward" style={{ marginBottom: 0 }}>
                                    <Input
                                        placeholder="Phường/Xã"
                                        size="large"
                                        style={{
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`
                                        }}
                                    />
                                </Form.Item>
                            </div>
                        </Col>

                        <Col span={8}>
                            <div style={styles.formItem}>
                                <label style={styles.label}>
                                    <span>Quận/Huyện</span>
                                    <span style={{ color: COLORS.error }}>*</span>
                                </label>
                                <Form.Item
                                    name="district"
                                    rules={[{ required: true, message: 'Vui lòng nhập quận/huyện' }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Input
                                        placeholder="Quận/Huyện"
                                        size="large"
                                        style={{
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`
                                        }}
                                    />
                                </Form.Item>
                            </div>
                        </Col>

                        <Col span={8}>
                            <div style={styles.formItem}>
                                <label style={styles.label}>
                                    <span>Thành phố</span>
                                    <span style={{ color: COLORS.error }}>*</span>
                                </label>
                                <Form.Item
                                    name="city"
                                    rules={[{ required: true, message: 'Vui lòng chọn thành phố' }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Select
                                        size="large"
                                        placeholder="Chọn thành phố"
                                        style={{ width: '100%' }}
                                    >
                                        <Option value="TP.HCM">TP. Hồ Chí Minh</Option>
                                        <Option value="Hà Nội">Hà Nội</Option>
                                        <Option value="Đà Nẵng">Đà Nẵng</Option>
                                        <Option value="Hải Phòng">Hải Phòng</Option>
                                        <Option value="Cần Thơ">Cần Thơ</Option>
                                    </Select>
                                </Form.Item>
                            </div>
                        </Col>

                        <Col span={24}>
                            <div style={styles.formItem}>
                                <label style={styles.label}>
                                    <ExpandOutlined />
                                    <span>Diện tích (m²)</span>
                                    <span style={{ color: COLORS.error }}>*</span>
                                </label>
                                <Form.Item
                                    name="area"
                                    rules={[{ required: true, message: 'Vui lòng nhập diện tích' }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <InputNumber
                                        min={5}
                                        max={500}
                                        placeholder="25"
                                        style={{
                                            width: '100%',
                                            borderRadius: '12px',
                                            border: `2px solid ${COLORS.border}`
                                        }}
                                        size="large"
                                    />
                                </Form.Item>
                            </div>
                        </Col>

                        {/* ⭐ AMENITIES SECTION WITH selectedAmenities STATE */}
                        <Col span={24} style={{ marginTop: '32px' }}>
                            <div style={styles.formItem}>
                                <label style={styles.label}>
                                    <StarOutlined />
                                    <span>Tiện ích (Chọn tất cả phù hợp)</span>
                                </label>

                                <div style={{
                                    display: 'flex',
                                    gap: '16px',
                                    marginBottom: '24px',
                                    padding: '20px',
                                    background: `linear-gradient(135deg, ${COLORS.primaryLight}40 0%, ${COLORS.primaryLight}20 100%)`,
                                    borderRadius: '16px',
                                    border: `2px dashed ${COLORS.primary}30`
                                }}>
                                    <button
                                        type="button"
                                        onClick={toggleSelectAll}
                                        style={{
                                            flex: 1,
                                            padding: '16px 24px',
                                            border: `3px solid ${selectedAmenities.length === [...AMENITIES_LIST.map(a => a.value), ...customAmenities].length
                                                ? COLORS.primary
                                                : COLORS.border
                                                }`,
                                            borderRadius: '14px',
                                            background: selectedAmenities.length === [...AMENITIES_LIST.map(a => a.value), ...customAmenities].length
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
                                            color: selectedAmenities.length === [...AMENITIES_LIST.map(a => a.value), ...customAmenities].length
                                                ? COLORS.white
                                                : COLORS.text,
                                            boxShadow: selectedAmenities.length === [...AMENITIES_LIST.map(a => a.value), ...customAmenities].length
                                                ? `0 8px 24px ${COLORS.primary}40`
                                                : '0 2px 8px rgba(0,0,0,0.04)',
                                            transform: selectedAmenities.length === [...AMENITIES_LIST.map(a => a.value), ...customAmenities].length
                                                ? 'translateY(-2px)'
                                                : 'translateY(0)'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedAmenities.length !== [...AMENITIES_LIST.map(a => a.value), ...customAmenities].length) {
                                                e.currentTarget.style.background = COLORS.primaryLight;
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedAmenities.length !== [...AMENITIES_LIST.map(a => a.value), ...customAmenities].length) {
                                                e.currentTarget.style.background = COLORS.white;
                                            }
                                        }}
                                    >
                                        <CheckSquareOutlined style={{ fontSize: '20px' }} />
                                        <span>
                                            {selectedAmenities.length === [...AMENITIES_LIST.map(a => a.value), ...customAmenities].length
                                                ? 'Bỏ chọn tất cả'
                                                : 'Chọn tất cả'}
                                        </span>
                                    </button>
                                </div>

                                <Form.Item name="amenities" style={{ marginBottom: 0 }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                        gap: '20px',
                                        marginBottom: '24px'
                                    }}>
                                        {/* Default Amenities - USING ANT DESIGN ICONS */}
                                        {AMENITIES_LIST.map((amenity) => {
                                            const isSelected = selectedAmenities.includes(amenity.value);

                                            return (
                                                <div
                                                    key={amenity.value}
                                                    onClick={() => toggleAmenity(amenity.value)}
                                                    style={{
                                                        padding: '24px 20px',
                                                        border: `3px solid ${isSelected ? amenity.color : COLORS.border}`,
                                                        borderRadius: '16px',
                                                        background: isSelected
                                                            ? `linear-gradient(135deg, ${amenity.color}15 0%, ${COLORS.white} 100%)`
                                                            : COLORS.white,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '16px',
                                                        fontWeight: '600',
                                                        fontSize: '16px',
                                                        color: isSelected ? amenity.color : COLORS.text,
                                                        boxShadow: isSelected
                                                            ? `0 8px 24px ${amenity.color}25`
                                                            : '0 2px 8px rgba(0,0,0,0.04)',
                                                        transform: isSelected ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isSelected) {
                                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                                            e.currentTarget.style.boxShadow = `0 8px 24px ${amenity.color}20`;
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isSelected) {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                                        }
                                                    }}
                                                >
                                                    {/* ⭐ ANT DESIGN ICON - NOT EMOJI */}
                                                    <div style={{
                                                        fontSize: '28px',
                                                        width: '56px',
                                                        height: '56px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: `${amenity.color}15`,
                                                        borderRadius: '14px',
                                                        color: amenity.color,
                                                        flexShrink: 0
                                                    }}>
                                                        {amenity.icon}
                                                    </div>
                                                    <span style={{ flex: 1, fontSize: '16px', fontWeight: '600' }}>
                                                        {amenity.label}
                                                    </span>
                                                    {isSelected && (
                                                        <CheckOutlined style={{
                                                            fontSize: '20px',
                                                            color: COLORS.success,
                                                            position: 'absolute',
                                                            top: '12px',
                                                            right: '12px'
                                                        }} />
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Custom Amenities - FIXED DUPLICATE CHECK */}
                                        {customAmenities.map((amenity, index) => {
                                            const isSelected = selectedAmenities.includes(amenity);

                                            return (
                                                <div
                                                    key={`custom-${index}`}
                                                    onClick={() => toggleAmenity(amenity)}
                                                    style={{
                                                        padding: '24px 20px',
                                                        border: `3px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                                                        borderRadius: '16px',
                                                        background: isSelected
                                                            ? `linear-gradient(135deg, ${COLORS.primary}15 0%, ${COLORS.white} 100%)`
                                                            : COLORS.white,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '16px',
                                                        fontWeight: '600',
                                                        fontSize: '16px',
                                                        color: isSelected ? COLORS.primary : COLORS.text,
                                                        boxShadow: isSelected
                                                            ? `0 8px 24px ${COLORS.primary}25`
                                                            : '0 2px 8px rgba(0,0,0,0.04)',
                                                        transform: isSelected ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        const deleteBtn = e.currentTarget.querySelector('[data-delete-custom]');
                                                        if (deleteBtn) deleteBtn.style.opacity = '1';
                                                        if (!isSelected) {
                                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                                            e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.primary}20`;
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        const deleteBtn = e.currentTarget.querySelector('[data-delete-custom]');
                                                        if (deleteBtn) deleteBtn.style.opacity = '0';
                                                        if (!isSelected) {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                                        }
                                                    }}
                                                >
                                                    {/* ⭐ ANT DESIGN ICON */}
                                                    <div style={{
                                                        fontSize: '28px',
                                                        width: '56px',
                                                        height: '56px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: `${COLORS.primary}15`,
                                                        borderRadius: '14px',
                                                        color: COLORS.primary,
                                                        flexShrink: 0
                                                    }}>
                                                        <StarOutlined />  {/* ✅ Use StarOutlined for custom amenities */}
                                                    </div>
                                                    <span style={{ flex: 1, fontSize: '16px', fontWeight: '600' }}>
                                                        {amenity}  {/* ✅ Custom amenity is just a string, not object */}
                                                    </span>
                                                    {isSelected && (
                                                        <CheckOutlined style={{
                                                            fontSize: '20px',
                                                            color: COLORS.success,
                                                            position: 'absolute',
                                                            top: '12px',
                                                            right: '12px'
                                                        }} />
                                                    )}
                                                    <button
                                                        type="button"
                                                        data-delete-custom
                                                        style={{
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
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteCustomAmenity(amenity);
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1.15)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }}
                                                    >
                                                        <DeleteOutlined />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Form.Item>

                                {/* ⭐ Add Custom Amenity Section */}
                                {!showAmenityInput ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowAmenityInput(true)}
                                        style={{
                                            width: '100%',
                                            padding: '20px',
                                            border: `3px dashed ${COLORS.primary}`,
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
                                            color: COLORS.primary
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = `${COLORS.primaryLight}60`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <PlusOutlined style={{ fontSize: '20px' }} />
                                        <span>Thêm tiện ích khác</span>
                                    </button>
                                ) : (
                                    <div style={{
                                        padding: '24px',
                                        background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.white} 100%)`,
                                        borderRadius: '16px',
                                        border: `2px dashed ${COLORS.primary}`,
                                        marginTop: '16px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            gap: '12px',
                                            animation: 'slideDown 0.3s ease'
                                        }}>
                                            <Input
                                                size="large"
                                                placeholder="VD: Máy nước nóng, Wifi tốc độ cao..."
                                                value={newAmenityInput}
                                                onChange={(e) => setNewAmenityInput(e.target.value)}
                                                onPressEnter={handleAddCustomAmenity}
                                                style={{
                                                    flex: 1,
                                                    borderRadius: '12px',
                                                    border: `2px solid ${COLORS.primary}`
                                                }}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddCustomAmenity}
                                                style={{
                                                    padding: '12px 24px',
                                                    background: `linear-gradient(135deg, ${COLORS.success} 0%, #059669 100%)`,
                                                    color: COLORS.white,
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    fontSize: '16px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    whiteSpace: 'nowrap',
                                                    boxShadow: `0 4px 12px ${COLORS.success}30`
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.05)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                <CheckOutlined />
                                                Thêm
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAmenityInput(false);
                                                    setNewAmenityInput('');
                                                }}
                                                style={{
                                                    padding: '12px 24px',
                                                    background: COLORS.white,
                                                    color: COLORS.text,
                                                    border: `2px solid ${COLORS.border}`,
                                                    borderRadius: '12px',
                                                    fontSize: '16px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = COLORS.gray;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = COLORS.white;
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
                );

            case 2:
                return (
                    <Row gutter={[24, 24]}>
                        <Col span={24}>
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '0 auto 20px',
                                    background: `linear-gradient(135deg, ${COLORS.primary}20 0%, ${COLORS.primary}10 100%)`,
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <CameraOutlined style={{ fontSize: '40px', color: COLORS.primary }} />
                                </div>
                                <h2 style={{
                                    fontSize: '28px',
                                    fontWeight: '800',
                                    color: COLORS.primary,
                                    marginBottom: '8px'
                                }}>
                                    Quản lý hình ảnh
                                </h2>
                                <p style={{
                                    fontSize: '16px',
                                    color: COLORS.textLight,
                                    fontWeight: '500'
                                }}>
                                    Thêm hoặc xóa ảnh phòng trọ
                                </p>
                            </div>
                        </Col>

                        {/* Existing Images */}
                        <Col span={24}>
                            <div style={{
                                padding: '20px',
                                background: COLORS.primaryLight,
                                borderRadius: '16px',
                                border: `2px solid ${COLORS.primary}40`,
                                marginBottom: '24px'
                            }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: COLORS.primary,
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <CameraOutlined />
                                    Ảnh hiện tại ({existingImages.length})
                                </h3>
                                {existingImages.length > 0 ? (
                                    <Row gutter={[16, 16]}>
                                        {existingImages.map((image, index) => (
                                            <Col xs={12} sm={8} md={6} key={index}>
                                                <div style={styles.imageCard}>
                                                    <img
                                                        src={image}
                                                        alt={`Existing ${index + 1}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '180px',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteExistingImage(image)}
                                                        style={styles.deleteImageBtn}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1.15) rotate(90deg)';
                                                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 53, 69, 0.6)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4)';
                                                        }}
                                                    >
                                                        <DeleteOutlined style={{ fontSize: '16px' }} />
                                                    </button>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '32px',
                                        background: COLORS.white,
                                        borderRadius: '12px',
                                        color: COLORS.textLight
                                    }}>
                                        📷 Không có ảnh nào
                                    </div>
                                )}
                            </div>
                        </Col>

                        {/* Upload New Images */}
                        <Col span={24}>
                            <div style={{
                                padding: '20px',
                                background: COLORS.gray,
                                borderRadius: '16px',
                                border: `2px dashed ${COLORS.border}`
                            }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: COLORS.text,
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <PlusOutlined />
                                    Thêm ảnh mới
                                </h3>
                                <Upload
                                    listType="picture-card"
                                    fileList={newImages.map((file, index) => ({
                                        uid: `-new-${index}`,
                                        name: file.name,
                                        status: 'done',
                                        url: URL.createObjectURL(file)
                                    }))}
                                    onChange={handleNewImageUpload}
                                    beforeUpload={() => false}
                                    multiple
                                    accept="image/*"
                                    style={{ width: '100%' }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '20px',
                                        color: COLORS.primary
                                    }}>
                                        <PlusOutlined style={{ fontSize: '32px' }} />
                                        <span style={{
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}>
                                            Upload ảnh
                                        </span>
                                    </div>
                                </Upload>
                                <p style={{
                                    marginTop: '12px',
                                    fontSize: '13px',
                                    color: COLORS.textLight,
                                    textAlign: 'center',
                                    fontStyle: 'italic'
                                }}>
                                    Định dạng: JPG, PNG. Tối đa 5MB/ảnh
                                </p>
                            </div>
                        </Col>

                        {/* Summary */}
                        <Col span={24}>
                            <div style={{
                                padding: '20px 24px',
                                background: `linear-gradient(135deg, ${COLORS.primary}10 0%, ${COLORS.primary}05 100%)`,
                                borderRadius: '12px',
                                border: `2px solid ${COLORS.primary}30`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <span style={{
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        color: COLORS.text
                                    }}>
                                        Tổng số ảnh sau khi cập nhật:
                                    </span>
                                    <span style={{
                                        fontSize: '24px',
                                        fontWeight: '800',
                                        color: COLORS.primary,
                                        marginLeft: '12px'
                                    }}>
                                        {existingImages.length + newImages.length}
                                    </span>
                                    <span style={{
                                        fontSize: '14px',
                                        color: COLORS.textLight,
                                        marginLeft: '8px'
                                    }}>
                                        ảnh
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: COLORS.textLight,
                                    textAlign: 'right'
                                }}>
                                    <div> Ảnh hiện tại: {existingImages.length}</div>
                                    <div> Ảnh mới: {newImages.length}</div>
                                    {deletedImages.length > 0 && (
                                        <div style={{ color: COLORS.error }}>
                                            Đã xóa: {deletedImages.length}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Col>
                    </Row>
                );

            default:
                return null;
        }
    };

    return (
        <div style={styles.container}>
            {/* Header Bar */}
            <div style={styles.headerBar}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <button
                        onClick={() => navigate('/landlord/my-listings')}
                        style={styles.backButton}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = COLORS.primary;
                            e.currentTarget.style.color = COLORS.white;
                            e.currentTarget.style.transform = 'translateX(-4px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = COLORS.primary;
                            e.currentTarget.style.transform = 'translateX(0)';
                        }}
                    >
                        <ArrowLeftOutlined />
                        <span>Quay lại danh sách</span>
                    </button>

                    <div style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        color: COLORS.primary
                    }}>
                        Chỉnh sửa bài đăng
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={styles.content}>
                <Form
                    form={form}
                    layout="vertical"
                    onValuesChange={handleFormChange}
                >
                    {/* Stepper */}
                    <div style={styles.stepperCard}>
                        <div style={styles.stepperBackground} />

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '32px',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            {steps.map((step, index) => {
                                const stepNumber = index + 1;
                                const isCompleted = stepNumber < currentStep + 1;
                                const isCurrent = stepNumber === currentStep + 1;

                                return (
                                    <React.Fragment key={stepNumber}>
                                        {/* Step Item */}
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '16px',
                                            position: 'relative'
                                        }}>
                                            {/* Circle */}
                                            <div style={{
                                                width: '80px',
                                                height: '80px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '36px',
                                                fontWeight: '700',
                                                background: isCompleted
                                                    ? `linear-gradient(135deg, ${COLORS.primary}30 0%, ${COLORS.primary}20 100%)`
                                                    : isCurrent
                                                        ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`
                                                        : COLORS.white,
                                                color: isCompleted || isCurrent ? (isCurrent ? COLORS.white : COLORS.primary) : COLORS.textLight,
                                                border: `4px solid ${isCompleted ? COLORS.primary + '40' : isCurrent ? 'transparent' : COLORS.border}`,
                                                boxShadow: isCurrent
                                                    ? `0 8px 24px ${COLORS.primary}40, 0 0 0 4px ${COLORS.primaryLight}`
                                                    : isCompleted
                                                        ? `0 4px 12px ${COLORS.primary}20`
                                                        : '0 2px 8px rgba(0,0,0,0.05)',
                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                transform: isCurrent ? 'scale(1.05)' : 'scale(1)'
                                            }}>
                                                {isCompleted ? <CheckOutlined /> : step.icon}
                                            </div>

                                            {/* Text */}
                                            <div style={{ textAlign: 'center', maxWidth: '180px' }}>
                                                <div style={{
                                                    fontSize: '16px',
                                                    fontWeight: '700',
                                                    color: isCompleted || isCurrent ? COLORS.primary : COLORS.textLight,
                                                    marginBottom: '4px'
                                                }}>
                                                    {step.title}
                                                </div>
                                                <div style={{
                                                    fontSize: '13px',
                                                    color: COLORS.textLight,
                                                    fontWeight: '500'
                                                }}>
                                                    {step.description}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Connector Arrow */}
                                        {index < steps.length - 1 && (
                                            <div style={{
                                                width: '100px',
                                                height: '4px',
                                                background: stepNumber < currentStep + 1
                                                    ? `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`
                                                    : COLORS.border,
                                                borderRadius: '2px',
                                                position: 'relative',
                                                top: '-40px',
                                                transition: 'all 0.6s ease'
                                            }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    right: '-8px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    width: 0,
                                                    height: 0,
                                                    borderLeft: `8px solid ${stepNumber < currentStep + 1 ? COLORS.secondary : COLORS.border}`,
                                                    borderTop: '6px solid transparent',
                                                    borderBottom: '6px solid transparent',
                                                    transition: 'all 0.6s ease'
                                                }} />
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div style={styles.stepCard}>
                        {renderStepContent()}
                    </div>

                    {/* Navigation */}
                    <div style={styles.navigationBar}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                {currentStep > 0 && (
                                    <button
                                        type="button"
                                        onClick={prev}
                                        style={styles.actionButton('secondary')}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = COLORS.primaryLight;
                                            e.currentTarget.style.transform = 'translateX(-4px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = COLORS.white;
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                    >
                                        <ArrowLeftOutlined />
                                        Quay lại
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                {currentStep < steps.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={next}
                                        style={styles.actionButton('primary')}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                            e.currentTarget.style.boxShadow = `0 6px 24px ${COLORS.primary}60`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = `0 4px 16px ${COLORS.primary}40`;
                                        }}
                                    >
                                        Tiếp theo
                                        <ArrowLeftOutlined style={{ transform: 'rotate(180deg)' }} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        style={{
                                            ...styles.actionButton('primary'),
                                            opacity: submitting ? 0.7 : 1,
                                            cursor: submitting ? 'not-allowed' : 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!submitting) {
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                e.currentTarget.style.boxShadow = `0 6px 24px ${COLORS.primary}60`;
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = `0 4px 16px ${COLORS.primary}40`;
                                        }}
                                    >
                                        {submitting ? (
                                            <>
                                                <Spin size="small" />
                                                Đang cập nhật...
                                            </>
                                        ) : (
                                            <>
                                                <CheckOutlined />
                                                Lưu thay đổi
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </Form>
            </div>

            {/* Animations */}
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
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

                    .ant-upload-list-picture-card-container {
                        width: 150px !important;
                        height: 150px !important;
                    }

                    .ant-upload-select-picture-card {
                        width: 150px !important;
                        height: 150px !important;
                        border-radius: 12px !important;
                        border: 2px dashed ${COLORS.primary} !important;
                    }
                `}
            </style>
        </div>
    );
};

export default EditListing;
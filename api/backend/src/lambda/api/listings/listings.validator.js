

const CREATE_ALLOWED_FIELDS = [
    'title',
    'description',
    'address',
    'location',
    'price',
    'area',
    'images',
    'amenities'
];

const UPDATE_ALLOWED_FIELDS = [
    'title',
    'description',
    'address',
    'location',
    'price',
    'area',
    'images',
    'amenities'
];

const ADDRESS_ALLOWED_FIELDS = ['street', 'ward', 'district', 'city'];
const LOCATION_ALLOWED_FIELDS = ['latitude', 'longitude'];

const sanitizeObject = (input, allowedKeys) => {
    if (!input || typeof input !== 'object') {
        return undefined;
    }

    return Object.fromEntries(
        Object.entries(input).filter(([key]) => allowedKeys.includes(key))
    );
};

const buildSanitizedData = (data, allowedKeys) => {
    const sanitized = {};

    allowedKeys.forEach((key) => {
        if (data[key] === undefined) {
            return;
        }

        if (key === 'address') {
            const sanitizedAddress = sanitizeObject(data.address, ADDRESS_ALLOWED_FIELDS);
            if (sanitizedAddress && Object.keys(sanitizedAddress).length > 0) {
                sanitized.address = sanitizedAddress;
            }
            return;
        }

        if (key === 'location') {
            const sanitizedLocation = sanitizeObject(data.location, LOCATION_ALLOWED_FIELDS);
            if (sanitizedLocation && Object.keys(sanitizedLocation).length > 0) {
                sanitized.location = sanitizedLocation;
            }
            return;
        }

        sanitized[key] = data[key];
    });

    return sanitized;
};

export const validateCreateListing = (data = {}) => {
    const errors = [];

    const unexpectedFields = Object.keys(data).filter(
        (key) => !CREATE_ALLOWED_FIELDS.includes(key)
    );

    if (unexpectedFields.length > 0) {
        errors.push(`Các trường không hợp lệ: ${unexpectedFields.join(', ')}`);
    }

    // Required fields
    if (!data.title || data.title.trim() === '') {
        errors.push('Tiêu đề không được để trống');
    }

    if (!data.description || data.description.trim() === '') {
        errors.push('Mô tả không được để trống');
    }

    if (!data.address || typeof data.address !== 'object') {
        errors.push('Địa chỉ không hợp lệ');
    } else {
        if (!data.address.street) errors.push('Đường/Phố không được để trống');
        if (!data.address.ward) errors.push('Phường/Xã không được để trống');
        if (!data.address.district) errors.push('Quận/Huyện không được để trống');
        if (!data.address.city) errors.push('Tỉnh/Thành phố không được để trống');
    }

    if (!data.location || typeof data.location !== 'object') {
        errors.push('Vị trí không hợp lệ');
    } else {
        if (typeof data.location.latitude !== 'number') {
            errors.push('Latitude phải là số');
        }
        if (typeof data.location.longitude !== 'number') {
            errors.push('Longitude phải là số');
        }
    }

    if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
        errors.push('Giá thuê phải là số dương');
    }

    if (!data.area || typeof data.area !== 'number' || data.area <= 0) {
        errors.push('Diện tích phải là số dương');
    }

    // ownerId sẽ được lấy từ JWT token, không cần validate trong request body

    // Optional but validate if present
    if (data.images && !Array.isArray(data.images)) {
        errors.push('Images phải là mảng');
    }

    if (data.amenities && !Array.isArray(data.amenities)) {
        errors.push('Amenities phải là mảng');
    }

    const sanitizedData = buildSanitizedData(data, CREATE_ALLOWED_FIELDS);

    return {
        isValid: errors.length === 0,
        errors,
        sanitizedData
    };
};

export const validateUpdateListing = (data = {}) => {
    const errors = [];

    const unexpectedFields = Object.keys(data).filter(
        (key) => !UPDATE_ALLOWED_FIELDS.includes(key)
    );

    if (unexpectedFields.length > 0) {
        errors.push(`Các trường không hợp lệ: ${unexpectedFields.join(', ')}`);
    }

    // Không bắt buộc nhưng nếu có thì phải hợp lệ
    if (data.title !== undefined && data.title.trim() === '') {
        errors.push('Tiêu đề không được để trống');
    }

    if (data.price !== undefined && (typeof data.price !== 'number' || data.price <= 0)) {
        errors.push('Giá thuê phải là số dương');
    }

    if (data.area !== undefined && (typeof data.area !== 'number' || data.area <= 0)) {
        errors.push('Diện tích phải là số dương');
    }

    if (data.images !== undefined && !Array.isArray(data.images)) {
        errors.push('Images phải là mảng');
    }

    if (data.amenities !== undefined && !Array.isArray(data.amenities)) {
        errors.push('Amenities phải là mảng');
    }

    // Không cho phép update những field này
    if (data.listingId || data.createdAt || data.updatedAt) {
        errors.push('Không thể cập nhật listingId, createdAt, updatedAt');
    }

    const sanitizedData = buildSanitizedData(data, UPDATE_ALLOWED_FIELDS);

    return {
        isValid: errors.length === 0,
        errors,
        sanitizedData
    };
};
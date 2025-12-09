import React, { useEffect, useState } from 'react';
import { publicApi } from '../services/api';

const ListingDetailModal = ({ listingId, onClose, onFavoriteChange, onShowDirections }) => {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (listingId) {
      loadListingDetail();
    }
  }, [listingId]);

  const loadListingDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await publicApi.getListingDetail(listingId);
      setListing(data);

      // Check if in favorites
      try {
        const favorites = await publicApi.getFavorites();
        setIsFavorite(favorites.some(f => f.listingId === listingId));
      } catch (e) {
        console.log('Not logged in or error checking favorites');
      }
    } catch (err) {
      console.error('Error loading listing:', err);
      setError('Không thể tải thông tin phòng trọ');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);
    if (onFavoriteChange) onFavoriteChange(listingId, !previousState);

    try {
      if (previousState) {
        await publicApi.removeFavorite(listingId);
      } else {
        await publicApi.addFavorite(listingId);
      }
    } catch (err) {
      setIsFavorite(previousState);
      if (onFavoriteChange) onFavoriteChange(listingId, previousState);
      setError(err.message || 'Vui lòng đăng nhập để sử dụng tính năng này');
    }
  };

  if (!listingId) return null;

  return (
    <div className="fixed right-4 top-20 bottom-4 w-[450px] z-50">
      <div className="bg-white rounded-2xl shadow-2xl h-full flex flex-col border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Đóng
            </button>
          </div>
        ) : listing ? (
          <>
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-red-500 p-4 flex items-center gap-3 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white flex-1 line-clamp-1">{listing.title}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFavorite}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:scale-105 ${isFavorite
                      ? 'bg-white text-red-500'
                      : 'bg-white bg-opacity-90 text-gray-700 hover:bg-opacity-100'
                    }`}
                  title={isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                >
                  <svg className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-xs font-medium">{isFavorite ? "Đã thích" : "Yêu thích"}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="flex-shrink-0 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg transition-all"
                  title="Đóng"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* Images */}
              {listing.images?.length > 0 && (
                <div className="relative">
                  <img
                    src={listing.images[currentImageIndex]}
                    alt={listing.title}
                    className="w-full h-64 object-cover"
                  />
                  {listing.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1.5 transition-all"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % listing.images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1.5 transition-all"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs">
                        {currentImageIndex + 1} / {listing.images.length}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Details */}
              <div className="p-4">
                {/* Price & Area */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Giá thuê</div>
                    <div className="text-xl font-bold text-blue-600">
                      {(listing.price / 1000000).toFixed(1)}M đ<span className="text-sm font-normal">/tháng</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Diện tích</div>
                    <div className="text-xl font-bold text-gray-900">{listing.area} m²</div>
                  </div>
                </div>

                {/* Address */}
                <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-orange-600 mb-1">Địa chỉ</div>
                      <p className="text-sm text-gray-900">
                        {typeof listing.address === 'string'
                          ? listing.address
                          : `${listing.address.street}, ${listing.address.ward}, ${listing.address.district}, ${listing.address.city}`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 mb-2">📝 MÔ TẢ</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{listing.description}</p>
                </div>

                {/* Amenities */}
                {listing.amenities?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2">✨ TIỆN NGHI</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {listing.amenities.map((amenity, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Directions Button */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <button
                    onClick={() => {
                      if (onShowDirections && listing.location) {
                        onShowDirections({
                          lat: listing.location.latitude,
                          lng: listing.location.longitude,
                          name: listing.title
                        });
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Xem đường đi
                  </button>
                </div>

                {/* Contact */}
                {listing.contact && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-xs font-semibold text-gray-500 mb-3">📞 LIÊN HỆ</h3>
                    <div className="space-y-2">
                      {listing.contact.name && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-900">{listing.contact.name}</span>
                        </div>
                      )}
                      {listing.contact.phone && (
                        <a
                          href={`tel:${listing.contact.phone}`}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          {listing.contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ListingDetailModal;

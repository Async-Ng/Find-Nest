import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import MapComponent from '../../components/MapComponent';
import LoginForm from '../../components/user/loginComponent/LoginForm';
import OTPForm from '../../components/user/loginComponent/OTPForm';
import { setToken, setUser } from '../../redux/slices/authSlice';
import { X } from 'lucide-react';

const MapLoginPage = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(300);
  const [showLoginPanel, setShowLoginPanel] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLocationSelect = (location) => {
    console.log('Selected location:', location);
    setSelectedLocation(location);
  };

  const handleLoginSuccess = (phone, newUser, otp, expiresIn = 300) => {
    setPhoneNumber(phone);
    setIsNewUser(newUser);
    setOtpExpiresIn(expiresIn);
    setCurrentPage('otp');
  };

  const handleBack = () => {
    setCurrentPage('login');
  };

  const handleOtpSuccess = () => {
    // Cập nhật auth state
    dispatch(setUser({ phone: phoneNumber, isNewUser }));
    dispatch(setToken(localStorage.getItem('accessToken')));
    setShowLoginPanel(false);
    navigate('/user/listings');
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Full Map Background */}
      <div className="absolute inset-0">
        <MapComponent
          onLocationSelect={handleLocationSelect}
          center={[105.8047, 21.0285]}
          zoom={13}
        />
      </div>

      {/* Login Panel - Slide in from left */}
      {showLoginPanel && (
        <div className="absolute inset-0 z-10 flex items-center justify-center md:items-start md:justify-start p-4 md:p-0">
          {/* Overlay on mobile, transparent on desktop */}
          <div 
            className="absolute inset-0 bg-black/40 md:bg-transparent"
            onClick={() => setShowLoginPanel(false)}
          ></div>

          {/* Login Card */}
          <div className="relative z-20 w-full max-w-md bg-white rounded-2xl shadow-2xl md:rounded-r-2xl md:rounded-l-none md:m-0 md:h-full md:flex md:flex-col md:justify-center md:max-w-md p-8 md:p-10">
            {/* Close Button */}
            <button
              onClick={() => setShowLoginPanel(false)}
              className="absolute top-4 right-4 md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur-lg opacity-60"></div>
                  <div className="relative px-4 py-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">FindNest</span>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {currentPage === 'login' ? 'Chào mừng bạn' : 'Xác minh OTP'}
              </h2>
              <p className="text-slate-600 text-sm">
                {currentPage === 'login'
                  ? 'Đăng nhập để khám phá bất động sản tuyệt vời'
                  : 'Nhập mã OTP để hoàn tất đăng nhập'}
              </p>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              {currentPage === 'login' ? (
                <LoginForm onSuccess={handleLoginSuccess} />
              ) : (
                <OTPForm
                  phone={phoneNumber}
                  isNewUser={isNewUser}
                  expiresIn={otpExpiresIn}
                  onSuccess={handleOtpSuccess}
                  onBack={handleBack}
                />
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-xs text-gray-600">
                Bằng cách đăng nhập, bạn đồng ý với
                <br />
                <a href="#" className="text-orange-600 font-semibold hover:underline">
                  Điều khoản dịch vụ
                </a>
                {' '}và{' '}
                <a href="#" className="text-orange-600 font-semibold hover:underline">
                  Chính sách bảo mật
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Button when panel is hidden */}
      {!showLoginPanel && (
        <button
          onClick={() => setShowLoginPanel(true)}
          className="absolute top-4 right-4 z-10 px-4 py-2 bg-white text-orange-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          Đăng nhập
        </button>
      )}
    </div>
  );
};

export default MapLoginPage;

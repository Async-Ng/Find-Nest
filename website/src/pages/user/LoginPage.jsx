import React, { useState } from 'react';
import { Smartphone, Sparkles, Home, MapPin, Search, MessageSquare } from 'lucide-react';
import LoginForm from '../../components/user/loginComponent/LoginForm';
import OTPForm from '../../components/user/loginComponent/OTPForm';

const LoginPage = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(300);

  const handleLoginSuccess = (phone, newUser, otp, expiresIn = 300) => {
    setPhoneNumber(phone);
    setIsNewUser(newUser);
    setOtpExpiresIn(expiresIn);
    setCurrentPage('otp');
  };

  const handleBack = () => {
    setCurrentPage('login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
      {/* Premium Animated Background - Full Canvas */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Layer 1: Organic Morphing Blobs - Main Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-amber-600/50 via-orange-500/40 to-transparent rounded-full filter blur-3xl animate-organicMorph opacity-70" style={{ animation: 'organicMorph 12s ease-in-out infinite' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-tl from-orange-600/45 to-amber-500/30 rounded-full filter blur-3xl animate-organicMorph opacity-60" style={{ animationDelay: '2s', animation: 'organicMorph 14s ease-in-out infinite reverse' }}></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-gradient-to-br from-yellow-600/40 to-orange-400/25 rounded-full filter blur-3xl animate-spiralOrbit opacity-55" style={{ animation: 'spiralOrbit 10s linear infinite' }}></div>

        {/* Layer 2: Radiant Expanding Circles */}
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-gradient-to-br from-amber-500/60 to-transparent rounded-full filter blur-2xl animate-radiantExpand" style={{ animation: 'radiantExpand 6s ease-in-out infinite' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-56 h-56 bg-gradient-to-tl from-orange-600/55 to-transparent rounded-full filter blur-2xl animate-radiantExpand" style={{ animationDelay: '1s', animation: 'radiantExpand 7s ease-in-out infinite' }}></div>

        {/* Layer 3: Floating House Icons - Premium Positioned */}
        <div className="absolute top-10 right-10 text-9xl opacity-20 animate-floatingHouse" style={{ animation: 'floatingHouse 8s ease-in-out infinite' }}>🏠</div>
        <div className="absolute bottom-20 left-20 text-9xl opacity-18 animate-floatingHouse2" style={{ animation: 'floatingHouse2 10s ease-in-out infinite' }}>🏢</div>
        <div className="absolute top-1/2 right-1/4 text-8xl opacity-16 animate-floatingHouse3" style={{ animation: 'floatingHouse3 9s ease-in-out infinite' }}>🏘️</div>
        <div className="absolute bottom-1/3 right-10 text-8xl opacity-14 animate-float" style={{ animationDelay: '0.5s', animation: 'float 5s ease-in-out infinite' }}>🏠</div>
        <div className="absolute top-1/4 left-10 text-7xl opacity-12 animate-float" style={{ animationDelay: '1.5s', animation: 'float 6s ease-in-out infinite' }}>🏘️</div>

        {/* Layer 4: Animated Particles - Premium Floating */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`premium-particle-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? 'rgba(251, 146, 60, 0.9)' : i % 3 === 1 ? 'rgba(251, 191, 36, 0.8)' : 'rgba(234, 88, 12, 0.85)',
              animation: i % 3 === 0 ? 'floatingParticle 8s ease-out infinite' : i % 3 === 1 ? 'floatingParticle2 10s ease-out infinite' : 'floatingParticle3 12s ease-out infinite',
              animationDelay: `${i * 1.2}s`,
              boxShadow: i % 3 === 0 ? '0 0 25px rgba(251, 146, 60, 1)' : i % 3 === 1 ? '0 0 22px rgba(251, 191, 36, 0.9)' : '0 0 20px rgba(234, 88, 12, 1)'
            }}
          ></div>
        ))}

        {/* Layer 5: Dancing Gradient Mesh */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(251, 146, 60, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(234, 88, 12, 0.25) 0%, transparent 50%)',
          animation: 'dancingGradient 12s ease infinite',
          backgroundSize: '200% 200%'
        }}></div>

        {/* Layer 6: Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(148, 163, 184, 0.15) 25%, rgba(148, 163, 184, 0.15) 26%, transparent 27%, transparent 74%, rgba(148, 163, 184, 0.15) 75%, rgba(148, 163, 184, 0.15) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(148, 163, 184, 0.15) 25%, rgba(148, 163, 184, 0.15) 26%, transparent 27%, transparent 74%, rgba(148, 163, 184, 0.15) 75%, rgba(148, 163, 184, 0.15) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px',
          animation: 'moveGrid 20s linear infinite'
        }}></div>

        {/* Layer 7: Glowing Lines - Accent */}
        <div className="absolute top-1/4 left-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent filter blur-sm animate-glowingLine opacity-60" style={{ animation: 'glowingLine 5s ease-in-out infinite' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent filter blur-sm animate-glowingLine opacity-50" style={{ animationDelay: '1s', animation: 'glowingLine 6s ease-in-out infinite' }}></div>

        {/* Layer 8: Additional Depth Orbs */}
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-amber-600/40 rounded-full filter blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute bottom-1/2 right-1/3 w-40 h-40 bg-orange-600/35 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s', animationDuration: '7s' }}></div>

        {/* Radial gradient overlay for depth - Premium */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-900/10 to-slate-950/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header Section with Branding */}
          <div className="text-center mb-8 animate-fadeIn">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl blur-xl opacity-60 animate-pulse"></div>
                {/* Logo container */}
                <div className="relative px-4 py-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center gap-2">
                    <Home className="w-7 h-7 text-white animate-float" />
                    <span className="text-white font-black text-xl tracking-tight">FindNest</span>
                  </div>
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {currentPage === 'login' ? 'Tìm phòng trọ' : 'Xác thực'}
            </h1>
            <p className="text-slate-300 text-sm font-medium">
              {currentPage === 'login'
                ? '✨ Powered by AI - Tìm phòng trọ phù hợp với bạn'
                : 'Nhập mã OTP được gửi đến điện thoại'}
            </p>
          </div>

          {/* Progress Indicator - Housing themed */}
          <div className="mb-10 px-2">
            <div className="flex items-center justify-between mb-4">
              {/* Step 1 - Phone */}
              <div className="flex flex-col items-center flex-1">
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500 transform ${currentPage === 'login'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/50 scale-100 hover:scale-110'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-90'
                  }`}>
                  {currentPage === 'otp' ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <Smartphone className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs font-bold mt-2 transition-colors duration-300 ${currentPage === 'login' ? 'text-amber-400' : 'text-green-400'
                  }`}>
                  Số điện thoại
                </span>
              </div>

              {/* Progress Line */}
              <div className="flex-1 mx-3 mb-6">
                <div className={`h-1 rounded-full transition-all duration-700 ${currentPage === 'otp'
                    ? 'bg-gradient-to-r from-green-500 to-amber-500 shadow-lg shadow-amber-500/50'
                    : 'bg-slate-700'
                  }`}></div>
              </div>

              {/* Step 2 - OTP */}
              <div className="flex flex-col items-center flex-1">
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500 transform ${currentPage === 'otp'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/50 scale-100 hover:scale-110'
                    : 'bg-slate-700 text-slate-500 scale-90'
                  }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold mt-2 transition-colors duration-300 ${currentPage === 'otp' ? 'text-amber-400' : 'text-slate-500'
                  }`}>
                  Mã OTP
                </span>
              </div>
            </div>
          </div>

          {/* Main Card - Premium */}
          <div className="group relative mb-6">
            {/* Outer Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-all duration-500 animate-pulse"></div>

            {/* Main Card */}
            <div className="relative bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl hover:border-amber-500/30 transition-all duration-300">
              {/* Card Header - Housing themed gradient */}
              <div className="relative bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-10 overflow-hidden">
                {/* Header Glow */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full mix-blend-screen filter blur-2xl"></div>
                </div>

                <div className="relative text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {currentPage === 'login' ? '🏠 Bắt đầu tìm kiếm' : '✓ Xác thực ngay'}
                  </h2>
                  <p className="text-amber-100 text-xs font-medium">
                    {currentPage === 'login'
                      ? 'AI sẽ giúp bạn tìm phòng trọ hoàn hảo'
                      : 'Xác nhận danh tính để truy cập'}
                  </p>
                </div>
              </div>

              {/* Card Content */}
              <div className="px-8 py-8">
                <div className="animate-fadeIn">
                  {currentPage === 'login' ? (
                    <LoginForm onSuccess={handleLoginSuccess} />
                  ) : (
                    <OTPForm
                      phone={phoneNumber}
                      onBack={handleBack}
                      isNewUser={isNewUser}
                      initialCountdown={otpExpiresIn}
                    />
                  )}
                </div>
              </div>

              {/* Card Footer - Features Grid */}
              <div className="px-8 py-6 border-t border-slate-700/30 bg-slate-800/50">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center text-center group/feature hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-amber-400 mb-2 group-hover/feature:animate-spin" />
                    <p className="text-xs font-semibold text-slate-300">AI Smart</p>
                  </div>
                  <div className="flex flex-col items-center text-center border-l border-r border-slate-700 group/feature hover:scale-110 transition-transform">
                    <MapPin className="w-5 h-5 text-orange-400 mb-2 group-hover/feature:animate-bounce" />
                    <p className="text-xs font-semibold text-slate-300">Location</p>
                  </div>
                  <div className="flex flex-col items-center text-center group/feature hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5 text-yellow-400 mb-2 group-hover/feature:animate-pulse" />
                    <p className="text-xs font-semibold text-slate-300">Chat Now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Badges - AI Housing App focused */}
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-300 group hover:bg-slate-800/70 hover:shadow-lg hover:shadow-amber-500/20">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-amber-500/40 transition-colors">
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <p className="text-xs text-slate-300 font-medium">🤖 Tìm kiếm bằng AI - nhập mô tả, AI sẽ gợi ý</p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300 group hover:bg-slate-800/70 hover:shadow-lg hover:shadow-orange-500/20">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-orange-500/40 transition-colors">
                <MapPin className="w-3 h-3 text-orange-400" />
              </div>
              <p className="text-xs text-slate-300 font-medium">📍 Lọc theo vị trí - tìm gần công ty/trường học</p>
            </div>
          </div>

          {/* Why Choose FindNest Section */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 backdrop-blur-sm hover:border-amber-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20">
            <h3 className="text-sm font-bold text-amber-100 mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 animate-pulse" />
              Tại sao chọn FindNest?
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2 hover:text-amber-200 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>✨ AI tìm kiếm thông minh</span>
              </li>
              <li className="flex items-center gap-2 hover:text-amber-200 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                <span>🏠 Hàng nghìn phòng trọ xác thực</span>
              </li>
              <li className="flex items-center gap-2 hover:text-amber-200 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                <span>🔒 An toàn & bảo mật tuyệt đối</span>
              </li>
            </ul>
          </div>

          {/* Footer Text */}
          <div className="text-center text-xs text-slate-500 space-y-2">
            <p>Tìm phòng trọ nhanh chóng với <span className="text-amber-400 font-semibold">FindNest AI</span></p>
            <p className="flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span>Bảo vệ dữ liệu với mã hóa AWS</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

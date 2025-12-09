import React, { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, RefreshCw, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { saveAuthData, getHomeRoute } from '../../../utils/auth';
import { authApi } from '../../../services/api';

const OTPForm = ({ phone, onBack, isNewUser, initialCountdown = 300 }) => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(initialCountdown);
  const [resending, setResending] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const sendOTP = async () => {
    setResending(true);
    try {
      const data = await authApi.sendOtp(phone);

      if (data.success) {
        message.success('Mã OTP đã được gửi!');
        setCountdown(data.expiresIn || 300);
      } else if (data.error === 'TooManyRequests') {
        message.warning('OTP đã gửi, xin vui lòng chờ.');
        setCountdown(data.expiresIn || 300);
      } else {
        message.error(data.message || 'Có lỗi xảy ra khi gửi OTP');
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      message.error('Vui lòng nhập đủ 6 số');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.verifyOtp(phone, otp);

      if (data.success) {
        saveAuthData({
          accessToken: data.accessToken,
          idToken: data.idToken,
          refreshToken: data.refreshToken,
          user: data.user
        });
        message.success(
          isNewUser
            ? 'Chào mừng! Tài khoản của bạn đã được tạo thành công.'
            : 'Đăng nhập thành công!'
        );

        setTimeout(() => {
          const userType = data.user?.userType || 'user';
          const homeRoute = getHomeRoute(userType);
          navigate(homeRoute, { replace: true });
        }, 1000);
      } else {
        message.error(data.message || 'Xác thực OTP thất bại');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setOtp('');
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('OTP Verify Error:', err);
      message.error(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    
    if (value.length === 6) {
      setTimeout(() => handleVerify(), 300);
    }
  };



  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCountdownClass = () => {
    if (countdown > 30) return 'from-orange-600 to-orange-500';
    if (countdown > 10) return 'from-amber-600 to-amber-500';
    return 'from-red-600 to-red-500';
  };

  const isComplete = otp.length === 6;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-slate-900">Nhập mã OTP</h3>
        <p className="text-sm text-slate-600">
          Mã được gửi đến <span className="font-semibold text-slate-800">{phone}</span>
        </p>
      </div>

      {/* OTP Input Field */}
      <div className={`py-6 transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          maxLength="6"
          value={otp}
          onChange={handleChange}
          placeholder="Nhập mã OTP 6 số"
          autoComplete="off"
          className="w-full px-4 py-3 text-center text-2xl font-semibold tracking-widest bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
        />
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">Tiến độ</span>
          <span className="text-xs font-semibold text-blue-600">{otp.length}/6</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(otp.length / 6) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Countdown Timer */}
      {countdown > 0 && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 rounded-lg border border-gray-200">
          <Clock className="w-4 h-4 text-gray-600" />
          <span className={`text-sm font-medium ${
            countdown > 30 ? 'text-gray-700' : countdown > 10 ? 'text-orange-600' : 'text-red-600'
          }`}>
            Mã hết hạn trong {formatTime(countdown)}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-3 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>

        <button
          onClick={handleVerify}
          disabled={!isComplete || loading}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
            isComplete && !loading
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Xác nhận</span>
            </>
          )}
        </button>
      </div>

      {/* Resend Section */}
      <div className="text-center space-y-3 pt-2">
        {countdown > 0 ? (
          <p className="text-sm text-slate-600 font-medium">
            Gửi lại mã sau <span className="font-bold text-orange-600">{formatTime(countdown)}</span>
          </p>
        ) : (
          <button
            onClick={sendOTP}
            disabled={resending}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all disabled:opacity-50"
          >
            {resending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Gửi lại mã OTP</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Security Info */}
      <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-sm">🔒</span>
        <p className="text-xs text-gray-600">
          Mã OTP của bạn được bảo mật. Không chia sẻ với bất kỳ ai
        </p>
      </div>
    </div>
  );
};

export default OTPForm;

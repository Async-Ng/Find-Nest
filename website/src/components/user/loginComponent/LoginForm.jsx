import React, { useState } from 'react';
import { message } from 'antd';
import { Phone, Send, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../../services/api';

const LoginForm = ({ onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const formatPhoneNumber = (value) => {
    let formatted = value.replace(/\D/g, '');
    if (formatted.startsWith('0')) {
      formatted = '+84' + formatted.slice(1);
    } else if (!formatted.startsWith('+84')) {
      formatted = '+84' + formatted;
    }
    return formatted;
  };

  const handleChange = (e) => {
    const rawValue = e.target.value;
    setPhone(rawValue.replace(/\D/g, '').slice(0, 10));
    setError('');
  };

  const handleSubmit = async () => {
    if (!phone || phone.length !== 10) {
      setError('Vui lòng nhập số điện thoại hợp lệ (10 số)');
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);
    setLoading(true);
    try {
      const data = await authApi.sendOtp(formattedPhone);

      if (data.success) {
        message.success('Mã OTP đã được gửi thành công!');
        onSuccess(formattedPhone, data.isNewUser || false, data.otp, 300);
      } else if (data.error === 'TooManyRequests') {
        message.warning('OTP đã gửi, xin vui lòng chờ trước khi yêu cầu OTP mới.');
        onSuccess(formattedPhone, data.isNewUser || false, data.otp, data.expiresIn || 300);
      } else {
        message.error(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      console.error(err);
      
      // Handle rate limit errors
      if (err.isRateLimit || err.status === 429) {
        const waitTime = err.waitTime || 60;
        setError(`OTP đã gửi, xin vui lòng chờ ${waitTime} giây`);
        message.warning(`Xin vui lòng chờ ${waitTime} giây trước khi gửi OTP mới`);
      } else {
        message.error(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && phone.length === 10) {
      handleSubmit();
    }
  };

  const isValid = phone.length === 10;

  return (
    <div className="space-y-5">
      {/* Phone Input with Premium Style */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-700">
          Số điện thoại của bạn
        </label>
        <div className={`relative group transition-all duration-300 ${
          error ? 'transform scale-[0.98]' : ''
        }`}>
          {/* Input Wrapper with Gradient Border */}
          <div className={`relative rounded-2xl transition-all duration-300 ${
            error
              ? 'ring-2 ring-red-500/30 bg-red-50/50'
              : focused
              ? 'ring-2 ring-orange-400/30 bg-orange-50/30'
              : 'ring-1 ring-slate-200 bg-slate-50/50'
          }`}>
            <div className="absolute inset-px rounded-[15px] bg-white"></div>
            
            {/* Icon */}
            <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
              error
                ? 'text-red-500'
                : focused
                ? 'text-orange-600 scale-110'
                : 'text-slate-400'
            }`} />

            {/* Input */}
            <input
              type="tel"
              placeholder="0 123 456 789"
              value={phone}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={10}
              disabled={loading}
              className="relative w-full pl-12 pr-12 py-3.5 bg-transparent outline-none font-semibold text-slate-900 placeholder:text-slate-400 transition-all duration-300 disabled:opacity-50"
            />

            {/* Check Icon */}
            {isValid && !error && (
              <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-pulse" />
            )}
          </div>

          {/* Bottom Border Animation */}
          <div className={`absolute -bottom-1 left-0 right-0 h-1 rounded-full transition-all duration-300 ${
            error
              ? 'bg-red-500'
              : isValid
              ? 'bg-gradient-to-r from-orange-600 to-orange-400'
              : 'bg-slate-200'
          }`}></div>
        </div>

        {/* Error Message with Animation */}
        {error && (
          <div className="animate-slideDown flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        {/* Character Counter */}
        {!error && phone.length > 0 && (
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-600"></div>
              <span className="text-xs font-medium text-slate-600">{phone.length}/10 chữ số</span>
            </div>
            {isValid && (
              <span className="text-xs font-bold text-green-600 animate-pulse">✓ Sẵn sàng</span>
            )}
          </div>
        )}
      </div>

      {/* Submit Button with Premium Styling */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || loading}
        className={`w-full py-3.5 px-4 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2.5 transform ${
          isValid && !loading
            ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
            : 'bg-gradient-to-r from-slate-400 to-slate-300 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Đang gửi mã...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>Gửi mã OTP</span>
          </>
        )}
      </button>

      {/* Info Section */}
      <div className="pt-2 space-y-3">
        <div className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-xl border border-blue-200/50">
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs font-medium text-slate-700">
            Chúng tôi sẽ gửi mã xác thực đến số điện thoại của bạn
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

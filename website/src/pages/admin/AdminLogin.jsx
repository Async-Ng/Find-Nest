import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Home, AlertCircle } from 'lucide-react';
import { authApi } from '../../services/api';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.adminLogin(username, password);

      if (data.success || data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken || '');
        localStorage.setItem('idToken', data.idToken || '');
        localStorage.setItem('tokenType', data.tokenType || 'Bearer');
        localStorage.setItem('expiresIn', data.expiresIn || '3600');

        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError(error.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden hover-lift">
          {/* Header */}
          <div className="bg-linear-to-r from-slate-900 to-slate-800 px-8 pt-8 pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Home className="text-white" size={24} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white text-center">FindNest</h1>
            <p className="text-gray-300 text-center mt-2 text-sm">Admin Control Panel</p>
          </div>

          {/* Content */}
          <form onSubmit={handleLogin} className="px-8 py-8 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-slide-in-top">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-red-800 font-medium text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Username Input */}
            <div className="animate-slide-in-left" style={{animationDelay: '0.1s'}}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="animate-slide-in-left" style={{animationDelay: '0.2s'}}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl animate-slide-in-top hover-glow"
              style={{animationDelay: '0.3s'}}
            >
              <LogIn size={20} />
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <a href="#" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                Forgot password?
              </a>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-gray-600 text-center text-xs">
              © 2025 FindNest. All rights reserved.
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-4 border border-white border-opacity-20 animate-fade-in hover-lift" style={{animationDelay: '0.5s'}}>
          <p className="text-white text-sm text-center">
            Demo credentials available for testing. Contact administrator for access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { User, Mail, Phone, Calendar, LogOut, Loader, Edit2, X, Save, Upload, ImageIcon } from 'lucide-react';
import { userApi, uploadApi } from '../../services/api';
import { message } from 'antd';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/user/loginPage');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await userApi.getProfile();
        setProfile(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err.message || 'Không thể tải thông tin profile');
        message.error('Không thể tải thông tin profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    message.success('Đã đăng xuất thành công');
    navigate('/user/loginPage');
  };

  const openEditModal = () => {
    setEditData({
      fullName: profile?.fullName || '',
      phoneNumber: profile?.phoneNumber || '',
      businessName: profile?.businessName || '',
      businessAddress: profile?.businessAddress || '',
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditData({});
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const updatedProfile = await userApi.updateProfile(editData);
      setProfile(updatedProfile);
      message.success('Cập nhật hồ sơ thành công!');
      closeEditModal();
    } catch (err) {
      console.error('Failed to update profile:', err);
      message.error(err.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      message.error('Ảnh quá lớn (tối đa 5MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      message.error('Vui lòng chọn file ảnh');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    try {
      setIsUploadingAvatar(true);
      const filesData = [{
        filename: `avatar-${Date.now()}-${avatarFile.name}`,
        contentType: avatarFile.type
      }];

      const response = await uploadApi.getPresignedUrls(filesData);
      console.log('📤 Avatar upload response:', response);
      const uploads = response.uploads || response.data?.uploads || [];

      if (uploads.length === 0) {
        throw new Error('Không thể lấy URL upload');
      }

      const uploadData = uploads[0];
      await uploadApi.uploadToS3(uploadData.uploadUrl || uploadData.presignedUrl, avatarFile, avatarFile.type);

      // Build correct public URL from response
      let imageUrl = uploadData.publicUrl || uploadData.imageUrl;
      if (!imageUrl && uploadData.key) {
        const s3Bucket = 'findnest-images-647231754171.s3.us-east-1.amazonaws.com';
        imageUrl = `https://${s3Bucket}/${uploadData.key}`;
      }

      console.log('✅ Avatar uploaded:', { fileName: avatarFile.name, imageUrl });

      // Update profile with new avatar URL
      const updatedProfile = await userApi.updateProfile({
        ...editData,
        avatar: imageUrl
      });

      setProfile(updatedProfile);
      setAvatarFile(null);
      setAvatarPreview(null);
      message.success('Ảnh đại diện được cập nhật thành công!');
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      message.error(err.message || 'Không thể upload ảnh');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-amber-500 animate-spin" />
          <p className="text-slate-300 font-medium">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
        <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-red-500/30 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Lỗi Tải Dữ Liệu</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-amber-500/50 transition-all duration-300"
          >
            Thử Lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden py-8">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-amber-600/30 via-orange-500/20 to-transparent rounded-full filter blur-3xl opacity-40" style={{ animation: 'organicMorph 12s ease-in-out infinite' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-tl from-orange-600/25 to-amber-500/15 rounded-full filter blur-3xl opacity-30" style={{ animation: 'organicMorph 14s ease-in-out infinite reverse', animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Hồ Sơ Cá Nhân</h1>
          <p className="text-slate-300 text-sm">Xem và quản lý thông tin tài khoản của bạn</p>
        </div>

        {/* Profile Card */}
        <div className="group relative mb-6">
          {/* Outer Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-all duration-500"></div>

          {/* Main Card */}
          <div className="relative bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl">
            {/* Card Header */}
            <div className="relative bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-12 overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full mix-blend-screen filter blur-2xl"></div>
              </div>

              <div className="relative flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 relative group cursor-pointer"
                  onClick={() => profile?.userType === 'landlord' && fileInputRef.current?.click()}>
                  {avatarPreview || profile?.avatar ? (
                    <img
                      src={avatarPreview || profile?.avatar}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                  {profile?.userType === 'landlord' && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-left flex-1">
                  <h2 className="text-3xl font-bold text-white">{profile?.fullName || 'Người dùng'}</h2>
                  <p className="text-amber-100 text-sm font-medium capitalize">{profile?.userType || 'User'}</p>
                </div>
              </div>

              {/* Avatar Upload Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />

              {/* Avatar Upload Preview and Button */}
              {avatarFile && (
                <div className="mt-4 pt-4 border-t border-white/20 flex gap-3">
                  <button
                    onClick={handleUploadAvatar}
                    disabled={isUploadingAvatar}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/50 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Đang upload...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Ảnh
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-300"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>

            {/* Card Content */}
            <div className="px-8 py-8">
              <div className="space-y-6">
                {/* Phone Number */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Số Điện Thoại</p>
                    <p className="text-slate-200 text-sm mt-1">{profile?.phoneNumber || 'N/A'}</p>
                  </div>
                </div>

                {/* Account Type */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-yellow-500/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Loại Tài Khoản</p>
                    <p className="text-slate-200 text-sm mt-1 capitalize">
                      {profile?.userType === 'user' ? 'Người Tìm Phòng' : profile?.userType === 'landlord' ? 'Chủ Nhà Trọ' : 'Quản Trị Viên'}
                    </p>
                  </div>
                </div>

                {/* Created At */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-green-500/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Ngày Tạo Tài Khoản</p>
                    <p className="text-slate-200 text-sm mt-1">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Last Login */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Lần Đăng Nhập Cuối</p>
                    <p className="text-slate-200 text-sm mt-1">
                      {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Business Name - Only for Landlords */}
                {profile?.userType === 'landlord' && (
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Tên Doanh Nghiệp</p>
                      <p className="text-slate-200 text-sm mt-1">{profile?.businessName || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                )}

                {/* Business Address - Only for Landlords */}
                {profile?.userType === 'landlord' && (
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-pink-500/30 transition-all duration-300">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="w-5 h-5 text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Địa Chỉ Doanh Nghiệp</p>
                      <p className="text-slate-200 text-sm mt-1">{profile?.businessAddress || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-8 py-6 border-t border-slate-700/30 bg-slate-800/50 flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Quay Lại
              </button>
              <button
                onClick={openEditModal}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:shadow-lg hover:shadow-amber-600/50 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
              >
                <Edit2 className="w-4 h-4" />
                Chỉnh Sửa
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-600/50 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                Đăng Xuất
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 backdrop-blur-sm">
          <p className="text-xs text-slate-300">
            💡 <span className="font-semibold">Lưu ý:</span> Thông tin tài khoản này được bảo vệ bằng mã hóa AWS. Các dữ liệu cá nhân của bạn được giữ an toàn tuyệt đối.
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Chỉnh Sửa Hồ Sơ</h3>
                <button
                  onClick={closeEditModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-8 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Họ Tên</label>
                <input
                  type="text"
                  name="fullName"
                  value={editData.fullName || ''}
                  onChange={handleEditInputChange}
                  placeholder="Nhập họ tên"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Số Điện Thoại</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={editData.phoneNumber || ''}
                  onChange={handleEditInputChange}
                  placeholder="Nhập số điện thoại"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>

              {/* Business Name - Only for Landlords */}
              {profile?.userType === 'landlord' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Tên Doanh Nghiệp</label>
                  <input
                    type="text"
                    name="businessName"
                    value={editData.businessName || ''}
                    onChange={handleEditInputChange}
                    placeholder="Nhập tên doanh nghiệp"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              )}

              {/* Business Address - Only for Landlords */}
              {profile?.userType === 'landlord' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Địa Chỉ Doanh Nghiệp</label>
                  <textarea
                    name="businessAddress"
                    value={editData.businessAddress || ''}
                    onChange={handleEditInputChange}
                    placeholder="Nhập địa chỉ doanh nghiệp"
                    rows="3"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-slate-700/30 bg-slate-800/50 flex gap-3">
              <button
                onClick={closeEditModal}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:shadow-lg hover:shadow-amber-600/50 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu Thay Đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

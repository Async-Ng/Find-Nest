import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { User, Mail, Phone, Calendar, LogOut, Loader, Edit2, X, Save } from 'lucide-react';
import { userApi } from '../../services/api';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

const ProfileModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProfile();
    }
  }, [open]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await userApi.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      message.error('Không thể tải thông tin profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    message.success('Đã đăng xuất thành công');
    onClose();
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
    setEditData(prev => ({ ...prev, [name]: value }));
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

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      styles={{
        mask: { backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(4px)' }
      }}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader className="w-12 h-12 text-amber-500 animate-spin" />
          <p className="text-slate-600 font-medium">Đang tải thông tin...</p>
        </div>
      ) : (
        <div>
          {/* Profile Header */}
          <div className="relative bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-8 -mx-6 -mt-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{profile?.fullName || 'Người dùng'}</h2>
                <p className="text-amber-100 text-sm font-medium capitalize">{profile?.userType || 'User'}</p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto px-2">
            {/* Phone Number */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium uppercase">Số Điện Thoại</p>
                <p className="text-slate-800 text-sm mt-1">{profile?.phoneNumber || 'N/A'}</p>
              </div>
            </div>

            {/* Account Type */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium uppercase">Loại Tài Khoản</p>
                <p className="text-slate-800 text-sm mt-1 capitalize">
                  {profile?.userType === 'user' ? 'Người Tìm Phòng' : profile?.userType === 'landlord' ? 'Chủ Nhà Trọ' : 'Quản Trị Viên'}
                </p>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium uppercase">Ngày Tạo Tài Khoản</p>
                <p className="text-slate-800 text-sm mt-1">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Business Info for Landlords */}
            {profile?.userType === 'landlord' && (
              <>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium uppercase">Tên Doanh Nghiệp</p>
                    <p className="text-slate-800 text-sm mt-1">{profile?.businessName || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-pink-50 border border-pink-200">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium uppercase">Địa Chỉ Doanh Nghiệp</p>
                    <p className="text-slate-800 text-sm mt-1">{profile?.businessAddress || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              onClick={openEditModal}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:shadow-lg text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <Edit2 className="w-4 h-4" />
              Chỉnh Sửa
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Đăng Xuất
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[1100]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Chỉnh Sửa Hồ Sơ</h3>
              <button onClick={closeEditModal} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Họ Tên</label>
                <input
                  type="text"
                  name="fullName"
                  value={editData.fullName || ''}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Số Điện Thoại</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={editData.phoneNumber || ''}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {profile?.userType === 'landlord' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tên Doanh Nghiệp</label>
                    <input
                      type="text"
                      name="businessName"
                      value={editData.businessName || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Địa Chỉ Doanh Nghiệp</label>
                    <textarea
                      name="businessAddress"
                      value={editData.businessAddress || ''}
                      onChange={handleEditInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t flex gap-3">
              <button
                onClick={closeEditModal}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:shadow-lg text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lưu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProfileModal;

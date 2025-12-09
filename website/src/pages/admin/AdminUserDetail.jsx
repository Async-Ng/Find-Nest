import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Phone, Mail, Calendar, User, Home, AlertCircle, Building } from 'lucide-react';
import AdminLayout from '../../components/adminAuthComponent/AdminLayout';
import { adminApi } from '../../services/api';

const AdminUserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ role: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Get user from location state
    if (location.state?.user) {
      setUser(location.state.user);
      setEditData({ role: location.state.user.userType });
    } else {
      // If no user data in state, redirect back to users list
      navigate('/admin/users');
    }
  }, [userId, location, navigate]);

  const handleDelete = async () => {
    try {
      const data = await adminApi.deleteUser(userId);

      if (data.success || data.message === 'User deleted successfully') {
        navigate('/admin/users');
      } else {
        setError(data.message || 'Failed to delete user');
      }
    } catch (error) {
      setError(error.message || 'Error deleting user');
    }
  };

  const handleUpdateRole = async () => {
    if (editData.role === user.userType) {
      setEditMode(false);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const data = await adminApi.updateUserRole(userId, editData.role);

      if (data.success || data.message) {
        setUser({ ...user, userType: editData.role });
        setEditMode(false);
      } else {
        setError(data.message || 'Failed to update role');
      }
    } catch (error) {
      setError(error.message || 'Error updating role');
    } finally {
      setSaving(false);
    }
  };

  const getUserTypeBadge = (userType) => {
    const typeConfig = {
      user: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'User' },
      landlord: { bg: 'bg-green-100', text: 'text-green-800', label: 'Landlord' },
      admin: { bg: 'bg-red-100', text: 'text-red-800', label: 'Admin' },
    };

    const config = typeConfig[userType] || { bg: 'bg-gray-100', text: 'text-gray-800', label: userType };
    return (
      <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-semibold`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const InfoField = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-200 last:border-b-0">
      <div className="shrink-0 text-gray-400 mt-1">
        {Icon ? <Icon size={18} /> : null}
      </div>
      <div className="grow">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-1">{value || 'N/A'}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">User not found</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/admin/users')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{user.fullName}</h1>
                  <p className="text-gray-600 mt-1">{user.userId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEditMode(!editMode)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit2 size={18} />
                  {editMode ? 'Cancel' : 'Edit'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-slide-in-top">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-red-800 font-medium text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* User Header Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6 animate-fade-in hover-lift">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-linear-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shrink-0">
                <User className="text-white" size={40} />
              </div>
              <div className="grow">
                <h2 className="text-2xl font-bold text-gray-900">{user.fullName}</h2>
                <div className="mt-3 flex items-center gap-3">
                  {editMode ? (
                    <select
                      value={editData.role}
                      onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">User</option>
                      <option value="landlord">Landlord</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    getUserTypeBadge(user.userType)
                  )}
                  <span className="text-sm text-gray-600">{user.phoneNumber}</span>
                </div>
                {editMode && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleUpdateRole}
                      disabled={saving}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditData({ role: user.userType });
                      }}
                      className="px-3 py-1 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 stagger-children">
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-zoom-in">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Account Type</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {user.userType === 'user' ? 'User' : user.userType === 'landlord' ? 'Landlord' : 'Admin'}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-zoom-in">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Created</p>
              <p className="text-sm text-gray-900 mt-2 font-mono">{formatDate(user.createdAt).split(' ')[0]}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-zoom-in">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Last Login</p>
              <p className="text-sm text-gray-900 mt-2 font-mono">{formatDate(user.lastLoginAt).split(' ')[0]}</p>
            </div>
            {user.userType === 'landlord' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 animate-zoom-in">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Properties</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{properties.length}</p>
              </div>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Main Info */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 animate-slide-in-left">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h3>
              <div className="space-y-4">
                <InfoField label="User ID" value={user.userId} />
                <InfoField label="Full Name" value={user.fullName} icon={User} />
                <InfoField label="Phone Number" value={user.phoneNumber} icon={Phone} />
                <InfoField label="Email" value={user.email || 'N/A'} icon={Mail} />
                <InfoField label="Created At" value={formatDate(user.createdAt)} icon={Calendar} />
                <InfoField label="Last Login" value={formatDate(user.lastLoginAt)} icon={Calendar} />
              </div>
            </div>

            {/* Landlord Info */}
            {user.userType === 'landlord' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 animate-slide-in-right">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Business Info</h3>
                <div className="space-y-4">
                  <InfoField label="Business Name" value={user.businessName} icon={Building} />
                  <InfoField label="Business Address" value={user.businessAddress} />
                </div>
              </div>
            )}
          </div>

          {/* Landlord Properties */}
          {user.userType === 'landlord' && properties.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Home size={20} />
                Properties ({properties.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Address</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-700">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 stagger-children">
                    {properties.map((property, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 animate-slide-in-left" style={{animationDelay: `${idx * 0.05}s`}}>
                        <td className="px-6 py-4 text-gray-900 font-medium">{property.name}</td>
                        <td className="px-6 py-4 text-gray-600">{property.address}</td>
                        <td className="px-6 py-4 text-gray-600">{property.type}</td>
                        <td className="px-6 py-4 text-gray-900 font-semibold text-right">
                          {property.price ? `${property.price.toLocaleString('en-US')} ₫` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-zoom-in">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetail;

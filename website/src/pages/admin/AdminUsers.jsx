import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, AlertCircle, Users as UsersIcon, Edit2, Lock, Unlock } from 'lucide-react';
import AdminLayout from '../../components/adminAuthComponent/AdminLayout';
import { adminApi } from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    userType: '',
    search: '',
  });
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const navigate = useNavigate();

  // Fetch users data
  const fetchUsers = async (page = 1, userType = '', search = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getUsers(page, 20, userType, search);

      if (data.success || data.users) {
        // Đảm bảo tất cả user có status, mặc định là 'active'
        // Convert ENABLED/DISABLED to active/inactive
        const usersWithStatus = (data.users || []).map(user => ({
          ...user,
          status: user.status === 'ENABLED' ? 'active' : user.status === 'DISABLED' ? 'inactive' : (user.status || 'active')
        }));
        setUsers(usersWithStatus);
        setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 1 });
      } else {
        setError(data.message || 'Failed to load users');
      }
    } catch (error) {
      setError(error.message || 'Error loading users');
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, '', '');
  }, []);

  // Handle search
  const handleSearch = (value) => {
    setFilters({ ...filters, search: value });
    fetchUsers(1, filters.userType, value);
  };

  // Handle filter by user type
  const handleFilterUserType = (value) => {
    setFilters({ ...filters, userType: value });
    fetchUsers(1, value, filters.search);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    fetchUsers(page, filters.userType, filters.search);
  };

  // Handle toggle user status
  const handleToggleStatus = async (userId, currentStatus) => {
    setStatusUpdating(true);
    setError('');
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const data = await adminApi.updateUserStatus(userId, newStatus);

      if (data.success || data.message) {
        // Cập nhật UI ngay lập tức
        setUsers(users.map(user =>
          user.userId === userId
            ? { ...user, status: newStatus }
            : user
        ));
        setStatusConfirm(null);
      } else {
        setError(data.message || 'Failed to update user status');
      }
    } catch (error) {
      setError(error.message || 'Error updating user status');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    try {
      const data = await adminApi.deleteUser(userId);

      if (data.success || data.message === 'User deleted successfully') {
        setStatusConfirm(null);
        fetchUsers(pagination.page, filters.userType, filters.search);
      } else {
        setError(data.message || 'Failed to delete user');
      }
    } catch (error) {
      setError(error.message || 'Error deleting user');
    }
  };

  // Get user type badge
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

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      inactive: { bg: 'bg-red-100', text: 'text-red-800', label: 'Blocked' },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-semibold`}>
        {config.label}
      </span>
    );
  };

  // Format date
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

  const startIndex = (pagination.page - 1) * pagination.limit;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-2">Total: {pagination.total} users</p>
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

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 animate-slide-in-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* User Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Type</label>
                <select
                  value={filters.userType}
                  onChange={(e) => handleFilterUserType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                >
                  <option value="">All Types</option>
                  <option value="user">User</option>
                  <option value="landlord">Landlord</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilters({ userType: '', search: '' });
                    fetchUsers(1, '', '');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-zoom-in">
                {/* Table Header */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Business</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Last Login</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 stagger-children">
                      {users.map((user, idx) => (
                        <tr key={user.userId} className="hover:bg-gray-50 transition-colors animate-slide-in-left" style={{animationDelay: `${idx * 0.05}s`}}>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{user.fullName}</p>
                              <p className="text-xs text-gray-500">{user.userId?.substring(0, 8)}...</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">{getUserTypeBadge(user.userType)}</td>
                          <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.phoneNumber || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.email || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.businessName || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.lastLoginAt)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => navigate(`/admin/users/${user.userId}`, { state: { user } })}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit user"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => setStatusConfirm(user.userId)}
                                className={`p-2 rounded-lg transition-colors ${
                                  user.status === 'active'
                                    ? 'text-blue-600 hover:bg-blue-50'
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title={`${user.status === 'active' ? 'Lock' : 'Unlock'} user account`}
                              >
                                {user.status === 'active' ? <Unlock size={18} /> : <Lock size={18} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(startIndex + pagination.limit, pagination.total)} of {pagination.total} users
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            pagination.page === page
                              ? 'bg-orange-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
            </div>
          )}
        </div>

        {/* Status Confirmation Modal */}
        {statusConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-zoom-in">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Change Account Status</h3>
              <p className="text-gray-600 mb-6">
                {users.find(u => u.userId === statusConfirm)?.status === 'active'
                  ? 'Lock this account? The user will not be able to access the system.'
                  : 'Unlock this account? The user will be able to access the system again.'}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setStatusConfirm(null)}
                  disabled={statusUpdating}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleToggleStatus(statusConfirm, users.find(u => u.userId === statusConfirm)?.status)}
                  disabled={statusUpdating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {statusUpdating ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;

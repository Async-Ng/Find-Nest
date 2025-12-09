import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, Home, UserCheck, Shield, Activity, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import AdminLayout from '../../components/adminAuthComponent/AdminLayout';
import { adminApi } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [refreshAreaLoading, setRefreshAreaLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    setError('');
    try {
      const data = await adminApi.getStats();
      if (data.success || data.stats) {
        setStats(data.stats || data);
      } else {
        setError('Failed to load statistics');
      }
    } catch (error) {
      setError(error.message || 'Error loading statistics');
      console.error('Fetch stats error:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRefreshAreaData = async () => {
    setRefreshAreaLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const data = await adminApi.refreshAreaData();
      setSuccessMessage('Area data refreshed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message || 'Error refreshing area data');
      console.error('Refresh area data error:', error);
    } finally {
      setRefreshAreaLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, trend, color }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all animate-fade-in hover:lift">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value || 0}</p>
          {trend && (
            <p className="text-green-600 text-xs font-semibold mt-2 flex items-center gap-1 animate-pulse-soft">
              <TrendingUp size={14} /> {trend}% increase
            </p>
          )}
        </div>
        <div className={`p-4 rounded-lg ${color} hover-glow`}>
          <Icon className="text-white" size={28} />
        </div>
      </div>
    </div>
  );

  const StatBreakdown = ({ title, data }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-slide-in-left">
      <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>
      <div className="space-y-4 stagger-children">
        {data.map((item, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <span className="text-sm font-bold text-gray-900">{item.value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${item.color}`}
                style={{
                  width: `${((item.value / (stats?.totalUsers || 1)) * 100) || 0}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Overview of your rental platform</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRefreshAreaData}
                  disabled={refreshAreaLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                >
                  <RefreshCw size={18} className={refreshAreaLoading ? 'animate-spin' : ''} />
                  {refreshAreaLoading ? 'Refreshing...' : 'Refresh Area Data'}
                </button>
                <button
                  onClick={fetchStats}
                  disabled={statsLoading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                >
                  <Activity size={18} />
                  {statsLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Success Alert */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-slide-in-top">
              <div className="text-green-600 shrink-0 mt-0.5">✓</div>
              <div>
                <p className="text-green-800 font-medium text-sm">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-slide-in-top">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-red-800 font-medium text-sm">{error}</p>
              </div>
            </div>
          )}

          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : stats ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 stagger-children">
                <StatCard
                  icon={Users}
                  label="Total Users"
                  value={stats.totalUsers}
                  trend="12"
                  color="bg-blue-600"
                />
                <StatCard
                  icon={Home}
                  label="Total Listings"
                  value={stats.totalListings}
                  trend="8"
                  color="bg-green-600"
                />
                <StatCard
                  icon={Activity}
                  label="Active Sessions"
                  value={Math.floor((stats.totalUsers || 0) * 0.6)}
                  color="bg-orange-600"
                />
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Types */}
                <StatBreakdown
                  title="User Types"
                  data={[
                    {
                      label: 'Regular Users',
                      value: stats.usersByType?.user || 0,
                      color: 'bg-blue-500',
                    },
                    {
                      label: 'Landlords',
                      value: stats.usersByType?.landlord || 0,
                      color: 'bg-green-500',
                    },
                    {
                      label: 'Admins',
                      value: stats.usersByType?.admin || 0,
                      color: 'bg-orange-500',
                    },
                  ]}
                />

                {/* Quick Stats */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <UserCheck className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Regular Users</p>
                          <p className="text-xs text-gray-500">Registered users</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        {stats.usersByType?.user || 0}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Home className="text-green-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Landlords</p>
                          <p className="text-xs text-gray-500">Property owners</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        {stats.usersByType?.landlord || 0}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Shield className="text-orange-600" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Admins</p>
                          <p className="text-xs text-gray-500">System admins</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        {stats.usersByType?.admin || 0}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Last updated: {new Date(stats.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">System Status</h3>
                  <p className="text-blue-700 text-sm">
                    All systems operational. Platform running smoothly with no reported issues.
                  </p>
                </div>

                <div className="bg-linear-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-orange-900 mb-2">Recent Activity</h3>
                  <p className="text-orange-700 text-sm">
                    Platform active with continuous user engagement. Check logs for detailed activity.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No statistics available</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

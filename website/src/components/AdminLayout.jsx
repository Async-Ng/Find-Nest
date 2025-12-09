import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  LogOut,
  BarChart3,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
} from 'lucide-react';

const AdminLayout = ({ children, onRefresh, refreshLoading = false }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('tokenType');
    localStorage.removeItem('expiresIn');
    navigate('/admin/login');
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'dashboard';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/logs')) return 'logs';
    if (path.includes('/admin/requests')) return 'requests';
    return 'dashboard';
  };

  const selectedKey = getSelectedKey();

  const menuItems = [
    { key: 'dashboard', icon: BarChart3, label: 'Dashboard', path: '/admin/dashboard' },
    { key: 'users', icon: Users, label: 'Users', path: '/admin/users' },
    { key: 'requests', icon: FileText, label: 'Requests', path: '/admin/requests' },
    { key: 'logs', icon: FileText, label: 'Logs', path: '/admin/logs' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-linear-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } border-r border-slate-700 shadow-2xl z-40`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold">
                A
              </div>
              <span className="font-bold text-lg">Admin</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedKey === item.key;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
                title={collapsed ? item.label : ''}
              >
                <Icon size={20} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-700 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700 transition-all"
            title={collapsed ? 'Logout' : ''}
          >
            <LogOut size={20} />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between h-full px-8">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Refresh */}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={refreshLoading}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {refreshLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              )}

              {/* Settings */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

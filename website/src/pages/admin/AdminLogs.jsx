import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Eye, Copy, AlertCircle, Filter, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import AdminLayout from '../../components/adminAuthComponent/AdminLayout';
import { adminApi } from '../../services/api';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    filter: '',
    logLevel: '',
    startTime: null,
    endTime: null,
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [stats, setStats] = useState({
    totalLogs: 0,
    errorCount: 0,
    warningCount: 0,
  });
  const navigate = useNavigate();

  // Fetch logs data
  const fetchLogs = async (page = 1, filter = '', logLevel = '', startTime = null, endTime = null) => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getLogs(
        page,
        50,
        filter,
        logLevel,
        startTime?.toISOString(),
        endTime?.toISOString()
      );

      if (data) {
        // Handle different response structures
        let logsList = [];
        let totalLogs = 0;

        if (data.logs && data.logs.events && Array.isArray(data.logs.events)) {
          logsList = data.logs.events;
          totalLogs = data.logs.events.length;
        } else if (Array.isArray(data.logs)) {
          logsList = data.logs;
          totalLogs = data.logs.length;
        } else if (Array.isArray(data.events)) {
          logsList = data.events;
          totalLogs = data.events.length;
        } else if (Array.isArray(data)) {
          logsList = data;
          totalLogs = data.length;
        } else if (data.pagination && Array.isArray(data.pagination.events)) {
          logsList = data.pagination.events;
          totalLogs = data.pagination.events.length;
        }

        if (!Array.isArray(logsList)) {
          logsList = [];
        }

        setLogs(logsList);

        setPagination({
          page,
          limit: 50,
          total: data.pagination?.total || totalLogs || logsList.length,
          totalPages: data.pagination?.totalPages || Math.ceil((data.pagination?.total || totalLogs || logsList.length) / 50),
        });

        // Calculate stats
        const errorCount = logsList.filter(log => log && (log.logLevel === 'ERROR' || log.logLevel === 'error')).length;
        const warningCount = logsList.filter(log => log && (log.logLevel === 'WARNING' || log.logLevel === 'WARN' || log.logLevel === 'warning')).length;
        setStats({
          totalLogs: data.pagination?.total || totalLogs || logsList.length,
          errorCount,
          warningCount,
        });
      } else {
        setError('Failed to load logs');
        setLogs([]);
      }
    } catch (error) {
      setError(error.message || 'Error loading logs');
      console.error('Fetch logs error:', error);
      setLogs([]);
      setPagination({ page, limit: 50, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, '', '', null, null);
  }, []);

  // Handle search
  const handleSearch = (value) => {
    setFilters({ ...filters, filter: value });
    fetchLogs(1, value, filters.logLevel, filters.startTime, filters.endTime);
  };

  // Handle filter by log level
  const handleFilterLogLevel = (value) => {
    setFilters({ ...filters, logLevel: value });
    fetchLogs(1, filters.filter, value, filters.startTime, filters.endTime);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    fetchLogs(page, filters.filter, filters.logLevel, filters.startTime, filters.endTime);
  };

  // Get log level badge
  const getLogLevelBadge = (level) => {
    const levelConfig = {
      INFO: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Info },
      WARNING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertTriangle },
      WARN: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertTriangle },
      ERROR: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
      DEBUG: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Info },
      SUCCESS: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    };

    const config = levelConfig[level] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: Info };
    const IconComponent = config.icon;

    return (
      <div className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit`}>
        <IconComponent size={14} />
        {level}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      filter: '',
      logLevel: '',
      startTime: null,
      endTime: null,
    });
    fetchLogs(1, '', '', null, null);
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
                <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
                <p className="text-gray-600 mt-2">Monitor system activity from CloudWatch</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Download size={18} />
                Export
              </button>
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

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 stagger-children">
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-zoom-in">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Logs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{pagination.total}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-zoom-in">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Errors</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.errorCount}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-zoom-in">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Warnings</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.warningCount}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 animate-slide-in-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Logs</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={filters.filter}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Log Level Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Level</label>
                <select
                  value={filters.logLevel}
                  onChange={(e) => handleFilterLogLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                >
                  <option value="">All Levels</option>
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="ERROR">ERROR</option>
                  <option value="DEBUG">DEBUG</option>
                  <option value="SUCCESS">SUCCESS</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Filter size={18} />
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
          ) : logs.length > 0 ? (
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-zoom-in">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Timestamp</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Level</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Message</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User ID</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 stagger-children">
                      {logs.map((log, idx) => (
                        <tr key={log.id || log.timestamp + idx} className="hover:bg-gray-50 transition-colors animate-slide-in-left" style={{animationDelay: `${idx * 0.05}s`}}>
                          <td className="px-6 py-4 text-sm text-gray-600 font-mono">{formatDate(log.timestamp)}</td>
                          <td className="px-6 py-4">{getLogLevelBadge(log.logLevel)}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900 line-clamp-2">{log.message}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{log.source || 'CloudWatch'}</td>
                          <td className="px-6 py-4 text-xs text-gray-600 font-mono">{log.userId ? log.userId.substring(0, 12) + '...' : 'System'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedLog(log)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View details"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => handleCopyToClipboard(log.message)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Copy message"
                              >
                                <Copy size={18} />
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
                    Showing {startIndex + 1} to {Math.min(startIndex + pagination.limit, pagination.total)} of {pagination.total} logs
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ←
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
                      →
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No logs found</p>
            </div>
          )}
        </div>

        {/* Log Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50 animate-fade-in">
            <div className="bg-white w-full max-w-2xl h-full overflow-y-auto animate-slide-in-right">
              {/* Modal Header */}
              <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between sticky top-0">
                <h2 className="text-lg font-bold text-gray-900">Log Details</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Timestamp</label>
                  <p className="text-sm text-gray-900 font-mono">{formatDate(selectedLog.timestamp)}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Level</label>
                  <div>{getLogLevelBadge(selectedLog.logLevel)}</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Message</label>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 font-mono wrap-break-word">
                    {selectedLog.message}
                    <button
                      onClick={() => handleCopyToClipboard(selectedLog.message)}
                      className="ml-2 p-2 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Source</label>
                  <p className="text-sm text-gray-900">{selectedLog.source || 'CloudWatch'}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">User ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedLog.userId || 'System'}</p>
                </div>

                {selectedLog.logStream && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Log Stream</label>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 font-mono wrap-break-word">
                      {selectedLog.logStream}
                    </div>
                  </div>
                )}

                {selectedLog.statusCode && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Status Code</label>
                    <span className={`${selectedLog.statusCode >= 400 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} px-3 py-1 rounded-full text-sm font-semibold`}>
                      {selectedLog.statusCode}
                    </span>
                  </div>
                )}

                {selectedLog.requestId && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Request ID</label>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 font-mono wrap-break-word">
                      {selectedLog.requestId}
                    </div>
                  </div>
                )}

                {selectedLog.additionalInfo && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Additional Info</label>
                    <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-900 overflow-auto max-h-64">
                      {JSON.stringify(selectedLog.additionalInfo, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;

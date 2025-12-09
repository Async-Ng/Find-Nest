import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { notificationsApi } from '../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationsApi.getNotifications();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      setError('Không thể tải thông báo');
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on mount and setup polling
  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(
        notifications.map(notif =>
          notif.notificationId === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(
        notifications.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
      'PRICE_CHANGE': '📉',
      'NEW_LISTING': '🏠',
      'FAVORITE_UPDATED': '❤️',
      'LISTING_EXPIRED': '⏰',
      'MESSAGE': '💬',
      'SYSTEM': '⚙️',
    };
    return icons[type] || '🔔';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}m trước`;
    if (diffHours < 24) return `${diffHours}h trước`;
    if (diffDays < 7) return `${diffDays}d trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          borderRadius: '50%',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgb(250, 150, 82)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Bell size={24} color="#e06a1a" strokeWidth={1.5} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: 0,
            width: '380px',
            maxHeight: '500px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f9fafb',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#111' }}>
              Thông báo ({unreadCount} chưa đọc)
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={20} color="#6b7280" />
            </button>
          </div>

          {/* Mark All as Read Button */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#0a66c2',
                fontSize: '13px',
                fontWeight: '600',
                textAlign: 'left',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f9ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <CheckCheck size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Đánh dấu tất cả đã đọc
            </button>
          )}

          {/* Notifications List */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
            {loading && !notifications.length ? (
              <div
                style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  color: '#6b7280',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    border: '3px solid #e5e7eb',
                    borderTop: '3px solid #0a66c2',
                    margin: '0 auto 12px',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Đang tải...
              </div>
            ) : error ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#ef4444',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  color: '#9ca3af',
                }}
              >
                <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ margin: 0 }}>Không có thông báo</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.notificationId}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: notif.isRead ? '#ffffff' : '#f0f9ff',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = notif.isRead
                      ? '#f9fafb'
                      : '#e0f2fe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notif.isRead
                      ? '#ffffff'
                      : '#f0f9ff';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      {/* Icon + Title */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>
                          {getNotificationIcon(notif.type)}
                        </span>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '14px',
                            fontWeight: notif.isRead ? '500' : '600',
                            color: notif.isRead ? '#6b7280' : '#111',
                          }}
                        >
                          {notif.title}
                        </h4>
                      </div>

                      {/* Message */}
                      <p
                        style={{
                          margin: '4px 0 8px 26px',
                          fontSize: '13px',
                          color: '#6b7280',
                          lineHeight: '1.4',
                        }}
                      >
                        {notif.message}
                      </p>

                      {/* Date */}
                      <p
                        style={{
                          margin: 0,
                          fontSize: '12px',
                          color: '#9ca3af',
                          marginLeft: '26px',
                        }}
                      >
                        {formatDate(notif.createdAt)}
                      </p>
                    </div>

                    {/* Mark as Read Button */}
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.notificationId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#0a66c2',
                        }}
                        title="Đánh dấu đã đọc"
                      >
                        <Check size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

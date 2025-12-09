import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../services/api';

const TestNotifications = () => {
  const [notifications, setNotifications] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationsApi.getNotifications();
      console.log('📬 Notifications response:', data);
      setNotifications(data);
    } catch (err) {
      setError(err.message || 'Lỗi tải thông báo');
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔔 Test Notifications API</h1>
      
      <button 
        onClick={fetchNotifications}
        disabled={loading}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        {loading ? 'Đang tải...' : 'Refresh'}
      </button>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          ❌ Error: {error}
        </div>
      )}

      {notifications && (
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '20px', 
          borderRadius: '8px',
          overflow: 'auto'
        }}>
          <pre>{JSON.stringify(notifications, null, 2)}</pre>
        </div>
      )}

      {loading && (
        <div>⏳ Đang tải dữ liệu...</div>
      )}
    </div>
  );
};

export default TestNotifications;

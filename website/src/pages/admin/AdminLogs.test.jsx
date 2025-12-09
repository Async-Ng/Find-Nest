// src/pages/admin/AdminLogs.test.jsx
// File này để test API response
import React, { useEffect, useState } from 'react';
import { Button, Card, Space, Spin, message } from 'antd';
import { adminApi } from '../../services/api';

const AdminLogsTest = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const testFetchLogs = async () => {
    setLoading(true);
    try {
      console.log('Fetching logs...');
      const result = await adminApi.getLogs(1, 50, '', '', '', '');
      console.log('Full Response:', result);
      console.log('Type:', typeof result);
      console.log('Is Array:', Array.isArray(result));
      setData(result);
      message.success('Fetched logs successfully');
    } catch (error) {
      console.error('Error:', error);
      message.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="AdminLogs Test" style={{ margin: 20 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button type="primary" onClick={testFetchLogs} loading={loading}>
          Test Fetch Logs
        </Button>
        <Spin spinning={loading}>
          <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </Spin>
      </Space>
    </Card>
  );
};

export default AdminLogsTest;

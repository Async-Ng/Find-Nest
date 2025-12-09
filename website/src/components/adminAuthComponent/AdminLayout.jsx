import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Space, message } from 'antd';
import {
  LogoutOutlined,
  DashboardOutlined,
  FileTextOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CopyrightOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';

const { Header, Sider, Content } = Layout;

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
    message.success('Đã đăng xuất');
    navigate('/admin/login');
  };

  // Determine current selected key based on route
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'dashboard';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/logs')) return 'logs';
    if (path.includes('/admin/requests')) return 'requests';
    return 'dashboard';
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Bảng điều khiển',
      onClick: () => navigate('/admin/dashboard'),
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: 'Quản lý người dùng',
      onClick: () => navigate('/admin/users'),
    },
    {
      key: 'requests',
      icon: <FileTextOutlined />,
      label: 'Quản lý yêu cầu',
      onClick: () => navigate('/admin/requests'),
    },
    {
      key: 'logs',
      icon: <CopyrightOutlined />,
      label: 'Logs hệ thống',
      onClick: () => navigate('/admin/logs'),
    },

  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="admin-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="admin-sider"
        width={200}
        collapsedWidth={80}
      >
        <div className="admin-logo">
          <h2>{collapsed ? 'A' : 'Admin'}</h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>

      <Layout>
        <Header className="admin-header">
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          </Space>

          <div className="header-right">
            {onRefresh && (
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={onRefresh}
                loading={refreshLoading}
              />
            )}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" icon={<UserOutlined />}>
                Admin
              </Button>
            </Dropdown>
          </div>
        </Header>

        <Content className="admin-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;

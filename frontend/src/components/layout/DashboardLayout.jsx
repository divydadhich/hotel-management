import { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const { Content } = Layout;

const DashboardLayout = () => {
  const { sidebarCollapsed } = useSelector((state) => state.ui);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarWidth = sidebarCollapsed ? 76 : 250;

  return (
    <Layout className="dashboard-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <Layout
        className="dashboard-main-layout"
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
        <Content className="dashboard-content" style={{ margin: 24, minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;

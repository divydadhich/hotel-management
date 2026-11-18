import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const { Content } = Layout;

const DashboardLayout = () => {
  const { sidebarCollapsed } = useSelector((state) => state.ui);
  const sidebarWidth = sidebarCollapsed ? 80 : 250;

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar collapsed={sidebarCollapsed} />
      <Layout style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)', background: '#f8fafc' }}>
        <Navbar />
        <Content
          style={{
            margin: '24px',
            minHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;

import { Menu, Layout } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  TeamOutlined,
  AppstoreOutlined,
  TableOutlined,
  OrderedListOutlined,
  BarChartOutlined,
  SettingOutlined,
  CrownOutlined,
  FireOutlined,
  PercentageOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROLES, APP_NAME } from '../../utils/constants';

const { Sider } = Layout;

const getMenuItems = (role) => {
  const menus = {
    [ROLES.SUPER_ADMIN]: [
      { key: '/super/dashboard', icon: <DashboardOutlined />, label: 'Overview' },
      { key: '/super/tenants', icon: <ShopOutlined />, label: 'Businesses (Tenants)' },
      { key: '/super/plans', icon: <CrownOutlined />, label: 'SaaS Plans' },
    ],
    [ROLES.OWNER]: [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Analytics' },
      { key: '/orders', icon: <OrderedListOutlined />, label: 'Orders' },
      { key: '/menu', icon: <AppstoreOutlined />, label: 'Digital Menu' },
      { key: '/tables', icon: <TableOutlined />, label: 'Tables & QR' },
      { key: '/staff', icon: <TeamOutlined />, label: 'Staff' },
      { key: '/coupons', icon: <PercentageOutlined />, label: 'Discounts & Offers' },
      { key: '/reviews', icon: <StarOutlined />, label: 'Customer Reviews' },
      { key: '/profile', icon: <SettingOutlined />, label: 'Branding & Settings' },
    ],
    [ROLES.RECEPTIONIST]: [
      { key: '/receptionist', icon: <OrderedListOutlined />, label: 'Live Orders' },
      { key: '/tables', icon: <TableOutlined />, label: 'Tables & Sessions' },
    ],
    [ROLES.KITCHEN]: [
      { key: '/kitchen', icon: <FireOutlined />, label: 'Kitchen Display (KDS)' },
    ],
  };
  return menus[role] || [];
};

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const items = getMenuItems(user?.role);
  // Match current active route
  const selectedKey = items.find((item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`))?.key || '';

  return (
    <Sider
      collapsed={collapsed}
      width={250}
      collapsedWidth={80}
      style={{
        background: '#0f172a',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        boxShadow: '4px 0 24px 0 rgba(0,0,0,0.06)',
      }}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
        <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
          <span className="text-white font-extrabold text-base">H</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm tracking-wide truncate">{APP_NAME}</h1>
            <p className="text-indigo-400 text-[10px] uppercase font-bold tracking-wider">Multi-Tenant SaaS</p>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            border: 'none',
          }}
          theme="dark"
        />
      </div>
    </Sider>
  );
};

export default Sidebar;

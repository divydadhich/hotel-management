import { Menu, Layout, Drawer } from 'antd';
import {
  LayoutDashboard,
  Building2,
  Users,
  UtensilsCrossed,
  QrCode,
  ClipboardList,
  Settings,
  Crown,
  ChefHat,
  Percent,
  Star,
  ConciergeBell,
  Sparkles,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROLES, APP_NAME } from '../../utils/constants';

const { Sider } = Layout;

const getMenuItems = (role) => {
  const menus = {
    [ROLES.SUPER_ADMIN]: [
      { key: '/super/dashboard', icon: <LayoutDashboard size={18} strokeWidth={2} />, label: 'Overview' },
      { key: '/super/tenants', icon: <Building2 size={18} strokeWidth={2} />, label: 'Tenants & Properties' },
      { key: '/super/plans', icon: <Crown size={18} strokeWidth={2} />, label: 'Subscription Plans' },
    ],
    [ROLES.OWNER]: [
      { key: '/dashboard', icon: <LayoutDashboard size={18} strokeWidth={2} />, label: 'Operations & KPIs' },
      { key: '/orders', icon: <ClipboardList size={18} strokeWidth={2} />, label: 'Live Orders' },
      { key: '/menu', icon: <UtensilsCrossed size={18} strokeWidth={2} />, label: 'Digital Menu' },
      { key: '/tables', icon: <QrCode size={18} strokeWidth={2} />, label: 'Tables & QR Codes' },
      { key: '/staff', icon: <Users size={18} strokeWidth={2} />, label: 'Staff Roster' },
      { key: '/coupons', icon: <Percent size={18} strokeWidth={2} />, label: 'Promotions & Coupons' },
      { key: '/reviews', icon: <Star size={18} strokeWidth={2} />, label: 'Guest Feedback' },
      { key: '/profile', icon: <Settings size={18} strokeWidth={2} />, label: 'Property Settings' },
    ],
    [ROLES.RECEPTIONIST]: [
      { key: '/receptionist', icon: <ConciergeBell size={18} strokeWidth={2} />, label: 'Front Desk Orders' },
      { key: '/tables', icon: <QrCode size={18} strokeWidth={2} />, label: 'Table Sessions' },
    ],
    [ROLES.KITCHEN]: [
      { key: '/kitchen', icon: <ChefHat size={18} strokeWidth={2} />, label: 'Kitchen Display (KDS)' },
    ],
  };
  return menus[role] || [];
};

const Sidebar = ({ collapsed, mobileOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const items = getMenuItems(user?.role);
  const selectedKey = items.find((item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`))?.key || '';

  const renderContent = (isCollapsed) => (
    <div className="dashboard-sidebar-content flex flex-col h-full bg-white select-none">
      {/* Brand header */}
      <div className="dashboard-brand flex h-16 items-center gap-3 px-5 border-b border-slate-100 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100/80 flex items-center justify-center font-semibold text-base shadow-xs flex-shrink-0">
          <Sparkles size={18} className="text-emerald-700" strokeWidth={2.2} />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <h1 className="text-[14px] font-bold text-slate-900 tracking-tight leading-tight truncate">{APP_NAME}</h1>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-0.5 leading-none">Enterprise SaaS</p>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-3 px-1.5 custom-sidebar-menu">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          onClick={({ key }) => {
            navigate(key);
            onClose?.();
          }}
          style={{ background: 'transparent', border: 'none' }}
          theme="light"
        />
      </div>

      {/* Footer tenant context */}
      {!isCollapsed && (
        <div className="p-3.5 m-2.5 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-600 truncate">System Operational</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Sider
        collapsed={collapsed}
        width={244}
        collapsedWidth={76}
        className="dashboard-sidebar dashboard-sidebar-desktop"
        style={{
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {renderContent(collapsed)}
      </Sider>
      <Drawer
        placement="left"
        width={260}
        open={mobileOpen}
        onClose={onClose}
        closable={false}
        styles={{ body: { padding: 0 } }}
        className="dashboard-mobile-drawer"
      >
        {renderContent(false)}
      </Drawer>
    </>
  );
};

export default Sidebar;

import { Avatar, Badge, Button, Dropdown, Space, Typography } from 'antd';
import {
  PanelLeftClose,
  PanelLeft,
  Menu,
  Bell,
  Settings,
  LogOut,
  Building,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logoutUser } from '../../store/slices/authSlice';
import { getInitials } from '../../utils/formatters';
import toast from 'react-hot-toast';

const { Text } = Typography;

const Navbar = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarCollapsed } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const { notifications } = useSelector((state) => state.ui);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Signed out safely');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <Settings size={15} strokeWidth={2} />,
      label: <span className="text-xs font-medium text-slate-700">Property Settings</span>,
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogOut size={15} strokeWidth={2} className="text-rose-500" />,
      label: <span className="text-xs font-semibold text-rose-600">Sign Out</span>,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const roleLabels = {
    super_admin: 'Platform Super Admin',
    owner: 'Property Owner',
    receptionist: 'Reception & Front Desk',
    kitchen: 'Kitchen Operations',
  };

  return (
    <header className="dashboard-navbar flex items-center justify-between px-5 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 h-16 transition-all">
      {/* Left controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          aria-label="Toggle navigation drawer"
          onClick={() => {
            if (window.matchMedia('(max-width: 767px)').matches) {
              onMenuClick?.();
            } else {
              dispatch(toggleSidebar());
            }
          }}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-colors border border-slate-200/60"
        >
          <span className="hidden sm:inline-flex">
            {sidebarCollapsed ? <PanelLeft size={18} strokeWidth={2} /> : <PanelLeftClose size={18} strokeWidth={2} />}
          </span>
          <span className="inline-flex sm:hidden">
            <Menu size={18} strokeWidth={2} />
          </span>
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600">
            <Building size={14} strokeWidth={2} />
          </div>
          <div>
            <span className="text-slate-900 font-semibold text-[13px] block leading-tight">
              {user?.name || 'Workspace User'}
            </span>
            <span className="text-slate-400 text-[11px] font-medium leading-none">
              {roleLabels[user?.role] || user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <Space size="middle" className="items-center">
        <Badge count={unreadCount} size="small" color="#386b58">
          <button
            type="button"
            aria-label="View notifications"
            onClick={() => {
              if (unreadCount > 0) toast('No unread notifications');
              else toast('Inbox is up to date');
            }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 transition-colors border border-slate-200/50"
          >
            <Bell size={17} strokeWidth={2} />
          </button>
        </Badge>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors border border-transparent hover:border-slate-200/80">
            <Avatar
              size={34}
              style={{
                backgroundColor: '#386b58',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: 12,
              }}
              src={user?.avatar}
            >
              {getInitials(user?.name)}
            </Avatar>
            <div className="hidden md:block text-left">
              <Text className="text-slate-800 text-[12px] font-semibold block leading-tight">{user?.name}</Text>
              <Text className="text-slate-400 text-[10px] block leading-tight">{user?.email}</Text>
            </div>
          </div>
        </Dropdown>
      </Space>
    </header>
  );
};

export default Navbar;

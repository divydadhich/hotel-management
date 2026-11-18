import { Avatar, Badge, Button, Dropdown, Space, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logoutUser } from '../../store/slices/authSlice';
import { getInitials } from '../../utils/formatters';
import toast from 'react-hot-toast';

const { Text } = Typography;

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarCollapsed } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const { notifications } = useSelector((state) => state.ui);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: 'Business Settings',
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
      onClick: handleLogout,
    },
  ];

  const roleLabels = {
    super_admin: 'Platform Admin',
    owner: 'Hotel / Restaurant Owner',
    receptionist: 'Reception / Order Manager',
    kitchen: 'Kitchen Display',
  };

  return (
    <div
      className="flex items-center justify-between bg-white border-b border-slate-200/80 px-6 backdrop-blur sticky top-0 z-40"
      style={{ height: 64 }}
    >
      {/* Left controls */}
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => dispatch(toggleSidebar())}
          className="flex items-center justify-center text-slate-600 hover:text-indigo-600"
        />
        <div>
          <span className="text-slate-800 font-bold text-sm block leading-none">
            {user?.name || 'User'}
          </span>
          <span className="text-slate-400 text-xs font-medium">
            {roleLabels[user?.role] || user?.role}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <Space size="middle">
        <Badge count={unreadCount} size="small" color="#6366f1">
          <Button
            type="text"
            shape="circle"
            icon={<BellOutlined className="text-slate-600 text-base" />}
            onClick={() => {
              if (unreadCount > 0) toast('You have new notifications', { icon: '🔔' });
            }}
          />
        </Badge>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-xl px-2.5 py-1.5 transition-colors border border-transparent hover:border-slate-200">
            <Avatar
              size={36}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                fontWeight: 700,
                fontSize: 13,
              }}
              src={user?.avatar}
            >
              {getInitials(user?.name)}
            </Avatar>
            <div className="hidden sm:block text-left">
              <Text className="text-slate-700 text-xs font-bold block leading-tight">{user?.name}</Text>
              <Text className="text-slate-400 text-[10px] block">{user?.email}</Text>
            </div>
          </div>
        </Dropdown>
      </Space>
    </div>
  );
};

export default Navbar;

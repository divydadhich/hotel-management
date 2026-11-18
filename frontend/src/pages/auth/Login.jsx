import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider } from 'antd';
import {
  Mail,
  Lock,
  ArrowRight,
  QrCode,
  Building2,
  Users,
  ChefHat,
  ConciergeBell,
  Sparkles,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../../store/slices/authSlice';
import { ROLE_DASHBOARD_ROUTES } from '../../utils/constants';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

const demoAccounts = [
  { title: 'Platform administrator', email: 'admin@platform.com', password: 'SuperAdmin@123', icon: <Building2 size={16} strokeWidth={2} /> },
  { title: 'Restaurant owner', email: 'owner@royalpalace.com', password: 'Owner@123', icon: <Sparkles size={16} strokeWidth={2} /> },
  { title: 'Reception & front desk', email: 'reception@royalpalace.com', password: 'Staff@123', icon: <ConciergeBell size={16} strokeWidth={2} /> },
  { title: 'Kitchen display', email: 'kitchen@royalpalace.com', password: 'Staff@123', icon: <ChefHat size={16} strokeWidth={2} /> },
];

const Login = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useSelector((state) => state.auth);
  const from = location.state?.from?.pathname;

  const onFinish = async (values) => {
    const result = await dispatch(loginUser({ email: values.email, password: values.password }));
    if (loginUser.fulfilled.match(result)) {
      const { user } = result.payload;
      toast.success(`Welcome back, ${user.name}`);
      navigate(from || ROLE_DASHBOARD_ROUTES[user.role] || '/dashboard', { replace: true });
    }
  };

  const fillCredentials = async ({ email, password }) => {
    form.setFieldsValue({ email, password });
    await onFinish({ email, password });
  };

  return (
    <Card className="login-card">
      <div className="login-intro">
        <span className="login-eyebrow">ENTERPRISE HOSPITALITY SAAS</span>
        <Title level={2} className="!mb-1.5 !mt-2 !text-slate-900 !font-bold !tracking-tight">
          Sign In to Workspace
        </Title>
        <Text className="text-slate-500 text-xs">
          Access your multi-tenant property management and dining console.
        </Text>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          className="mb-5 rounded-lg text-xs"
          closable
        />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
        <Form.Item
          name="email"
          label={<span className="text-xs font-semibold text-slate-700">Email or Username</span>}
          rules={[{ required: true, message: 'Please enter your account email or role alias' }]}
        >
          <Input
            prefix={<Mail size={16} strokeWidth={2} className="text-slate-400 mr-1" />}
            placeholder="e.g. owner@royalpalace.com or owner"
            autoComplete="username"
            className="rounded-lg text-xs"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="text-xs font-semibold text-slate-700">Password</span>}
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password
            prefix={<Lock size={16} strokeWidth={2} className="text-slate-400 mr-1" />}
            placeholder="••••••••"
            autoComplete="current-password"
            className="rounded-lg text-xs"
          />
        </Form.Item>

        <Form.Item className="!mb-3 !mt-6">
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            icon={<ArrowRight size={15} strokeWidth={2} />}
            className="w-full !h-11 !rounded-lg !font-semibold text-xs shadow-xs"
            style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Console'}
          </Button>
        </Form.Item>
      </Form>

      <Button
        block
        icon={<QrCode size={15} strokeWidth={2} />}
        className="!h-10 !rounded-lg !font-medium text-xs text-slate-600 border-slate-200 hover:text-slate-900"
        onClick={() => navigate('/demo/customer')}
      >
        Preview Customer QR Menu
      </Button>

      <Divider className="!my-5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          One-Click Demo Logins
        </span>
      </Divider>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {demoAccounts.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() => fillCredentials(account)}
            className="login-demo-option p-2.5 rounded-lg border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center flex-shrink-0">
              {account.icon}
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xs font-semibold text-slate-800 leading-tight">{account.title}</span>
              <span className="block truncate text-[10px] text-slate-400 font-mono">{account.email}</span>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default Login;

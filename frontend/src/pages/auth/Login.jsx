import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, ArrowRightOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../../store/slices/authSlice';
import { ROLE_DASHBOARD_ROUTES } from '../../utils/constants';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

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
      toast.success(`Welcome back, ${user.name}!`);
      const destination = from || ROLE_DASHBOARD_ROUTES[user.role] || '/dashboard';
      navigate(destination, { replace: true });
    }
  };

  const fillCredentials = async (email, password) => {
    form.setFieldsValue({ email, password });
    await onFinish({ email, password });
  };

  return (
    <Card className="shadow-2xl rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-2 sm:p-4 text-white">
      <div className="text-center mb-6">
        <Title level={3} className="!text-white !font-bold !mb-1">
          Welcome to Workspace
        </Title>
        <Text className="text-slate-400 text-xs">
          Sign in to your hospitality management console
        </Text>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          className="mb-4 rounded-xl border-rose-500/20 bg-rose-500/10 text-rose-300"
          closable
        />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
        <Form.Item
          name="email"
          label={<span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Email or Role Username</span>}
          rules={[
            { required: true, message: 'Please enter your email or username (e.g. owner@royalpalace.com or owner)' },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-slate-500 mr-1" />}
            placeholder="owner@royalpalace.com or owner"
            className="rounded-xl bg-slate-800/80 border-slate-700 text-white placeholder-slate-500"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Password</span>}
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-500 mr-1" />}
            placeholder="••••••••"
            className="rounded-xl bg-slate-800/80 border-slate-700 text-white placeholder-slate-500"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined className="text-slate-400" />)}
          />
        </Form.Item>

        <Form.Item className="mt-6">
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            className="w-full h-12 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
          >
            {isLoading ? 'Authenticating...' : <><span>Sign In to Dashboard</span><ArrowRightOutlined /></>}
          </Button>
        </Form.Item>
      </Form>

      {/* Demo Quick Logins */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
          ⚡ One-Click Demo Logins
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => fillCredentials('admin@platform.com', 'SuperAdmin@123')}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-left transition-colors"
          >
            <div className="font-semibold text-indigo-400">Super Admin</div>
            <div className="text-[10px] text-slate-400">admin@platform.com</div>
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('owner@royalpalace.com', 'Owner@123')}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-left transition-colors"
          >
            <div className="font-semibold text-emerald-400">Restaurant Owner</div>
            <div className="text-[10px] text-slate-400">owner@royalpalace.com</div>
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('reception@royalpalace.com', 'Staff@123')}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-left transition-colors"
          >
            <div className="font-semibold text-sky-400">Receptionist</div>
            <div className="text-[10px] text-slate-400">reception@royalpalace.com</div>
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('kitchen@royalpalace.com', 'Staff@123')}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-left transition-colors"
          >
            <div className="font-semibold text-amber-400">Kitchen Display</div>
            <div className="text-[10px] text-slate-400">kitchen@royalpalace.com</div>
          </button>
        </div>
      </div>
    </Card>
  );
};

export default Login;

import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROLE_DASHBOARD_ROUTES } from '../utils/constants';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Result
        status="403"
        title="403 — Restricted Resource"
        subTitle={`Your current permission role (${user?.role?.replace('_', ' ') || 'guest'}) is not authorized to access this module.`}
        extra={
          <Button
            type="primary"
            onClick={() => navigate(user?.role ? ROLE_DASHBOARD_ROUTES[user.role] : '/login')}
            className="rounded-xl font-bold"
            style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
          >
            Return to My Workspace
          </Button>
        }
      />
    </div>
  );
};

export default Unauthorized;

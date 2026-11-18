import { Link, Outlet } from 'react-router-dom';
import { APP_NAME } from '../../utils/constants';
import { ShopOutlined } from '@ant-design/icons';

const AuthLayout = () => (
  <main className="auth-page">
    <header className="auth-brand">
      <Link to="/login" className="auth-brand-mark" aria-label={`${APP_NAME} home`}>
        <ShopOutlined />
      </Link>
      <div>
        <h1>{APP_NAME}</h1>
        <p>Hospitality, thoughtfully managed</p>
      </div>
    </header>

    <div className="auth-content">
      <Outlet />
    </div>

    <footer className="auth-footer">
      &copy; {new Date().getFullYear()} {APP_NAME}. Built for better guest experiences.
    </footer>
  </main>
);

export default AuthLayout;

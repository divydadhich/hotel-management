import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';
import CustomerLayout from '../components/layout/CustomerLayout';

// Auth
import Login from '../pages/auth/Login';

// Super Admin
import SuperAdminDashboard from '../pages/super-admin/SuperAdminDashboard';
import TenantList from '../pages/super-admin/TenantList';
import TenantCreate from '../pages/super-admin/TenantCreate';
import SubscriptionPlans from '../pages/super-admin/SubscriptionPlans';

// Owner
import OwnerDashboard from '../pages/owner/OwnerDashboard';
import MenuManagement from '../pages/owner/MenuManagement';
import TableManagement from '../pages/owner/TableManagement';
import OrderManagement from '../pages/owner/OrderManagement';
import StaffManagement from '../pages/owner/StaffManagement';
import CouponManagement from '../pages/owner/CouponManagement';
import ReviewManagement from '../pages/owner/ReviewManagement';
import BusinessProfile from '../pages/owner/BusinessProfile';

// Staff
import ReceptionistDashboard from '../pages/receptionist/ReceptionistDashboard';
import KitchenDashboard from '../pages/kitchen/KitchenDashboard';

// Customer QR Menu
import CustomerMenu from '../pages/customer/CustomerMenu';
import CustomerDemo from '../pages/customer/CustomerDemo';

// Fallbacks
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';

import { ROLES, ROLE_DASHBOARD_ROUTES } from '../utils/constants';

const AuthRedirect = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  if (isAuthenticated && user) {
    return <Navigate to={ROLE_DASHBOARD_ROUTES[user.role] || '/dashboard'} replace />;
  }
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public Customer QR Landing Routes */}
    <Route element={<CustomerLayout />}>
      <Route path="/demo/customer" element={<CustomerDemo />} />
      <Route path="/menu/:slug/table/:token" element={<CustomerMenu />} />
      <Route path="/menu/:slug" element={<CustomerMenu />} />
    </Route>

    {/* Auth Routes */}
    <Route element={<AuthLayout />}>
      <Route
        path="/login"
        element={
          <AuthRedirect>
            <Login />
          </AuthRedirect>
        }
      />
    </Route>

    {/* Authenticated Dashboard Routes */}
    <Route
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      {/* Super Admin */}
      <Route
        path="/super/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super/tenants"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <TenantList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super/tenants/new"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <TenantCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super/plans"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SubscriptionPlans />
          </ProtectedRoute>
        }
      />

      {/* Hotel / Restaurant Owner */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/menu"
        element={
          <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
            <MenuManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tables"
        element={
          <ProtectedRoute allowedRoles={[ROLES.OWNER, ROLES.RECEPTIONIST]}>
            <TableManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
            <OrderManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
            <StaffManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coupons"
        element={
          <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
            <CouponManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
            <ReviewManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
            <BusinessProfile />
          </ProtectedRoute>
        }
      />

      {/* Receptionist */}
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute allowedRoles={[ROLES.RECEPTIONIST]}>
            <ReceptionistDashboard />
          </ProtectedRoute>
        }
      />

      {/* Kitchen Display System */}
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute allowedRoles={[ROLES.KITCHEN]}>
            <KitchenDashboard />
          </ProtectedRoute>
        }
      />
    </Route>

    {/* Fallbacks */}
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/unauthorized" element={<Unauthorized />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;

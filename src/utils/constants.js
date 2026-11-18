export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  RECEPTIONIST: 'receptionist',
  KITCHEN: 'kitchen',
  CUSTOMER: 'customer',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'HotelSaaS';

export const STATUS_COLORS = {
  pending: 'orange',
  accepted: 'blue',
  rejected: 'red',
  preparing: 'purple',
  ready: 'cyan',
  served: 'green',
  completed: 'success',
  cancelled: 'default',
  paid: 'green',
  failed: 'red',
  refunded: 'volcano',
};

export const ROLE_DASHBOARD_ROUTES = {
  [ROLES.SUPER_ADMIN]: '/super/dashboard',
  [ROLES.OWNER]: '/dashboard',
  [ROLES.RECEPTIONIST]: '/receptionist',
  [ROLES.KITCHEN]: '/kitchen',
};

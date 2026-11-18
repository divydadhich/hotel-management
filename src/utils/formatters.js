export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatDate = (date, format = 'short') => {
  if (!date) return '-';
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return `${formatDate(date)} ${formatTime(date)}`;
};

export const truncateText = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

export const getStatusColor = (status) => {
  const colors = {
    pending: '#f97316',
    accepted: '#3b82f6',
    rejected: '#ef4444',
    preparing: '#8b5cf6',
    ready: '#06b6d4',
    served: '#10b981',
    completed: '#10b981',
    cancelled: '#6b7280',
    paid: '#10b981',
    failed: '#ef4444',
    refunded: '#f59e0b',
    active: '#10b981',
    inactive: '#6b7280',
    trial: '#3b82f6',
    expired: '#ef4444',
    grace_period: '#f59e0b',
  };
  return colors[status] || '#6b7280';
};

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

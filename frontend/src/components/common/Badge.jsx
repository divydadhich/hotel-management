import { Tag } from 'antd';

const StatusBadge = ({ status, text }) => {
  const colorMap = {
    pending: 'orange',
    accepted: 'blue',
    rejected: 'red',
    preparing: 'purple',
    ready: 'cyan',
    served: 'green',
    completed: 'green',
    cancelled: 'default',
    paid: 'green',
    failed: 'red',
    refunded: 'volcano',
    active: 'green',
    inactive: 'default',
    trial: 'processing',
    expired: 'error',
    grace_period: 'warning',
    available: 'green',
    occupied: 'orange',
    cleaning: 'purple',
  };

  const label = text || (status ? status.replace(/_/g, ' ').toUpperCase() : '');
  return (
    <Tag color={colorMap[status] || 'default'} className="rounded-md font-medium text-xs px-2.5 py-0.5">
      {label}
    </Tag>
  );
};

export default StatusBadge;

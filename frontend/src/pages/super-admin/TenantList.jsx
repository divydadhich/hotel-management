import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, Typography, Popconfirm, Card } from 'antd';
import {
  Plus,
  Search,
  ExternalLink,
  Building2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTenants, toggleTenantStatus } from '../../store/slices/tenantSlice';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;
const { Option } = Select;

const TenantList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tenants, isLoading, pagination } = useSelector((state) => state.tenant);
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: '', isActive: undefined });

  useEffect(() => {
    dispatch(fetchTenants(filters));
  }, [filters, dispatch]);

  const handleStatusToggle = async (tenant) => {
    try {
      await dispatch(toggleTenantStatus({ id: tenant._id, data: { isActive: !tenant.isActive } }));
      toast.success(`Business ${tenant.isActive ? 'deactivated' : 'activated'}`);
      dispatch(fetchTenants(filters));
    } catch {
      toast.error('Failed to change status');
    }
  };

  const handleSuspendToggle = async (tenant) => {
    try {
      await dispatch(toggleTenantStatus({ id: tenant._id, data: { isSuspended: !tenant.isSuspended } }));
      toast.success(`Business ${tenant.isSuspended ? 'unsuspended' : 'suspended'}`);
      dispatch(fetchTenants(filters));
    } catch {
      toast.error('Failed to change suspension state');
    }
  };

  const columns = [
    {
      title: 'Business Identity',
      dataIndex: 'name',
      key: 'name',
      render: (text, r) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{text}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-400 capitalize">{r.businessType || 'Restaurant'}</span>
            <span className="text-slate-300">•</span>
            <a
              href={`/menu/${r.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-800 text-[11px] font-mono hover:underline flex items-center gap-1"
            >
              <span>/menu/{r.slug}</span>
              <ExternalLink size={10} strokeWidth={2} />
            </a>
          </div>
        </div>
      ),
    },
    {
      title: 'Contact',
      dataIndex: 'email',
      key: 'email',
      render: (email, r) => (
        <div>
          <div className="text-xs text-slate-800 font-mono">{email || '-'}</div>
          <div className="text-[11px] text-slate-400 font-mono">{r.phone || '-'}</div>
        </div>
      ),
    },
    {
      title: 'City / Region',
      dataIndex: 'city',
      key: 'city',
      render: (city, r) => (
        <span className="text-xs text-slate-600">
          {city ? `${city}, ${r.state || ''}` : '-'}
        </span>
      ),
    },
    {
      title: 'Operating State',
      key: 'status',
      render: (_, r) => (
        <div className="space-y-1">
          <Tag color={r.isActive ? 'success' : 'default'} className="rounded text-[10px] uppercase font-semibold">
            {r.isActive ? 'Active' : 'Inactive'}
          </Tag>
          {r.isSuspended && (
            <Tag color="error" className="rounded text-[10px] uppercase font-semibold">
              Suspended
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => <span className="text-slate-500 text-xs">{formatDate(d)}</span>,
    },
    {
      title: 'Platform Actions',
      key: 'actions',
      align: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => handleStatusToggle(r)}
            className="rounded text-xs"
          >
            {r.isActive ? 'Deactivate' : 'Activate'}
          </Button>

          <Popconfirm
            title={r.isSuspended ? 'Lift business suspension?' : 'Suspend this business?'}
            description="Suspended tenants and their customers cannot access menus or place orders."
            onConfirm={() => handleSuspendToggle(r)}
            okText={r.isSuspended ? 'Unsuspend' : 'Suspend'}
            cancelText="Cancel"
            okButtonProps={{ danger: !r.isSuspended }}
          >
            <Button
              size="small"
              danger={!r.isSuspended}
              className="rounded text-xs"
            >
              {r.isSuspended ? 'Unsuspend' : 'Suspend'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <Title level={4} className="!mb-0.5 !font-bold !text-slate-900 !tracking-tight">
            Registered Tenant Fleet
          </Title>
          <Text className="text-slate-500 text-xs block">
            Monitor, inspect, activate, and manage business accounts across the platform
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={14} strokeWidth={2} />}
          onClick={() => navigate('/super/tenants/new')}
          className="rounded-lg font-medium text-xs h-9 px-4 shadow-xs"
          style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
        >
          Provision Business
        </Button>
      </div>

      <Card className="rounded-xl shadow-xs border border-slate-200/80 bg-white">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <Input
            placeholder="Search businesses by name, slug or email..."
            prefix={<Search size={14} strokeWidth={2} className="text-slate-400 mr-1" />}
            className="rounded-lg text-xs"
            style={{ width: 320 }}
            allowClear
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          />
          <Select
            placeholder="Filter by State"
            allowClear
            className="rounded-lg text-xs"
            style={{ width: 160 }}
            onChange={(val) => setFilters((f) => ({ ...f, isActive: val, page: 1 }))}
          >
            <Option value={true}>Active Only</Option>
            <Option value={false}>Inactive Only</Option>
          </Select>
        </div>

        <Table
          dataSource={tenants}
          columns={columns}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page) => setFilters((f) => ({ ...f, page })),
            showSizeChanger: false,
          }}
          size="middle"
          locale={{
            emptyText: (
              <EmptyState
                title="No tenants found"
                description="Try clearing search filters or provision a new restaurant/hotel account."
                action={() => navigate('/super/tenants/new')}
                actionText="Provision Business"
                icon={Building2}
              />
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default TenantList;

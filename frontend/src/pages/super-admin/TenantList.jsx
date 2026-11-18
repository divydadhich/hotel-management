import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, Typography, Popconfirm, Card } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  CheckOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTenants, toggleTenantStatus } from '../../store/slices/tenantSlice';
import { formatDate } from '../../utils/formatters';
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
      title: 'Business Info',
      dataIndex: 'name',
      key: 'name',
      render: (text, r) => (
        <div>
          <span className="font-bold text-slate-800 text-sm block">{text}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-400 capitalize">{r.businessType || 'Restaurant'}</span>
            <span className="text-slate-300">•</span>
            <a
              href={`/menu/${r.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 text-[11px] font-mono hover:underline flex items-center gap-1"
            >
              <span>/menu/{r.slug}</span>
              <LinkOutlined className="text-[10px]" />
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
          <div className="text-xs text-slate-700">{email || '-'}</div>
          <div className="text-[11px] text-slate-400">{r.phone || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'city',
      key: 'city',
      render: (city, r) => (
        <span className="text-xs text-slate-600">
          {city ? `${city}, ${r.state || ''}` : '-'}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Tag color={r.isActive ? 'green' : 'default'} className="rounded-md font-medium text-xs">
            {r.isActive ? 'Active' : 'Inactive'}
          </Tag>
          {r.isSuspended && (
            <Tag color="red" className="rounded-md font-medium text-xs">
              Suspended
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Onboarded',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => <span className="text-xs text-slate-500">{formatDate(d)}</span>,
    },
    {
      title: 'Admin Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title={`${record.isActive ? 'Deactivate' : 'Activate'} business operations?`}
            onConfirm={() => handleStatusToggle(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              className="rounded-lg text-xs"
              danger={record.isActive}
              icon={record.isActive ? <StopOutlined /> : <CheckOutlined />}
            >
              {record.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </Popconfirm>

          <Popconfirm
            title={`${record.isSuspended ? 'Lift suspension for' : 'Suspend'} this business?`}
            onConfirm={() => handleSuspendToggle(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              danger={!record.isSuspended}
              className="rounded-lg text-xs"
            >
              {record.isSuspended ? 'Unsuspend' : 'Suspend'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <Title level={4} className="!mb-0 !font-extrabold !text-slate-900">
            Registered Businesses
          </Title>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            {pagination?.total || 0} independent restaurants and hotels active on this SaaS platform
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/super/tenants/new')}
          className="rounded-xl font-semibold shadow-sm"
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
        >
          Add New Business
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3 mb-5">
          <Input
            placeholder="Search business name, slug or email..."
            prefix={<SearchOutlined className="text-slate-400" />}
            className="rounded-xl"
            style={{ width: 320 }}
            allowClear
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          />
          <Select
            placeholder="Filter by Status"
            allowClear
            className="rounded-xl"
            style={{ width: 170 }}
            onChange={(val) => setFilters((f) => ({ ...f, isActive: val, page: 1 }))}
          >
            <Option value="true">Active Only</Option>
            <Option value="false">Inactive Only</Option>
          </Select>
        </div>

        <Table
          dataSource={tenants}
          columns={columns}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            current: pagination?.page || 1,
            pageSize: pagination?.limit || 10,
            total: pagination?.total || 0,
            showSizeChanger: true,
            onChange: (page, limit) => setFilters((f) => ({ ...f, page, limit })),
          }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default TenantList;

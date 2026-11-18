import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Button, Typography, Space } from 'antd';
import {
  ShopOutlined,
  CheckCircleOutlined,
  OrderedListOutlined,
  UserOutlined,
  PlusOutlined,
  CrownOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import tenantService from '../../services/tenant.service';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tenantsRes] = await Promise.all([
          tenantService.getPlatformStats(),
          tenantService.fetchTenants({ limit: 5 }),
        ]);
        setStats(statsRes.data);
        setTenants(tenantsRes.data || []);
      } catch (err) {
        toast.error('Failed to load platform analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    {
      title: 'Business Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, r) => (
        <div>
          <span className="font-bold text-slate-800 text-sm block">{text}</span>
          <code className="text-[11px] text-slate-400 font-mono">/menu/{r.slug}</code>
        </div>
      ),
    },
    {
      title: 'Business Email',
      dataIndex: 'email',
      key: 'email',
      render: (e) => <span className="text-slate-600 text-xs">{e || '-'}</span>,
    },
    {
      title: 'City / Region',
      dataIndex: 'city',
      key: 'city',
      render: (c, r) => <span className="text-slate-600 text-xs">{c ? `${c}, ${r.country || 'India'}` : '-'}</span>,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, r) => (
        <Tag color={r.isActive && !r.isSuspended ? 'green' : r.isSuspended ? 'red' : 'default'} className="rounded-md font-medium">
          {r.isSuspended ? 'Suspended' : r.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => <span className="text-slate-500 text-xs">{formatDate(d)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <Title level={4} className="!mb-0 !font-extrabold !text-slate-900">
            Platform Master Console
          </Title>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            Monitor and administer all onboarded restaurants, hotels, subscriptions, and revenue
          </Text>
        </div>
        <Space>
          <Button
            icon={<CrownOutlined />}
            onClick={() => navigate('/super/plans')}
            className="rounded-xl font-semibold"
          >
            Manage Plans
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/super/tenants/new')}
            className="rounded-xl font-semibold shadow-sm"
            style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
          >
            Onboard New Hotel
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Registered Businesses"
            value={stats?.totalTenants ?? 0}
            icon={<ShopOutlined />}
            color="#6366f1"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Operations"
            value={stats?.activeTenants ?? 0}
            icon={<CheckCircleOutlined />}
            color="#10b981"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Platform Orders"
            value={stats?.totalOrders ?? 0}
            icon={<OrderedListOutlined />}
            color="#f59e0b"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Platform Staff"
            value={stats?.totalUsers ?? 0}
            icon={<UserOutlined />}
            color="#8b5cf6"
            loading={loading}
          />
        </Col>
      </Row>

      {/* Recent Onboarded Businesses */}
      <Card
        title={
          <span className="font-bold text-slate-800 text-sm">Recently Onboarded Businesses</span>
        }
        className="rounded-2xl shadow-sm border border-slate-100"
        extra={
          <Button
            type="link"
            onClick={() => navigate('/super/tenants')}
            className="text-xs font-semibold text-indigo-600 flex items-center gap-1"
          >
            <span>View All Businesses</span>
            <ArrowRightOutlined />
          </Button>
        }
      >
        <Table
          dataSource={tenants}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;

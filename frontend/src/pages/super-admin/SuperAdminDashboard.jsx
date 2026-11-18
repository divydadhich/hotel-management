import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Button, Typography, Space } from 'antd';
import {
  Building2,
  Crown,
  Plus,
  Users,
  CheckCircle2,
  ClipboardList,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import tenantService from '../../services/tenant.service';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
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
      } catch {
        toast.error('Failed to load platform analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    {
      title: 'Business Identity',
      dataIndex: 'name',
      key: 'name',
      render: (text, r) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{text}</span>
          <code className="text-[10px] text-slate-400 font-mono">/menu/{r.slug}</code>
        </div>
      ),
    },
    {
      title: 'Contact Email',
      dataIndex: 'email',
      key: 'email',
      render: (e) => <span className="text-slate-600 text-xs font-mono">{e || '-'}</span>,
    },
    {
      title: 'Location',
      dataIndex: 'city',
      key: 'city',
      render: (c, r) => <span className="text-slate-600 text-xs">{c ? `${c}, ${r.country || 'India'}` : '-'}</span>,
    },
    {
      title: 'Subscription Status',
      key: 'status',
      render: (_, r) => (
        <Tag
          color={r.isActive && !r.isSuspended ? 'success' : r.isSuspended ? 'error' : 'default'}
          className="rounded text-[10px] uppercase font-semibold"
        >
          {r.isSuspended ? 'Suspended' : r.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Onboarded Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => <span className="text-slate-500 text-xs">{formatDate(d)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <Title level={4} className="!mb-0.5 !font-bold !text-slate-900 !tracking-tight">
            SaaS Platform Administration Console
          </Title>
          <Text className="text-slate-500 text-xs block">
            Platform-wide multi-tenant fleet metrics, tenant lifecycle, and subscription management
          </Text>
        </div>
        <Space size="small">
          <Button
            icon={<Crown size={14} strokeWidth={2} />}
            onClick={() => navigate('/super/plans')}
            className="rounded-lg font-medium text-xs h-9 px-3.5 border-slate-200 text-slate-700"
          >
            Manage Plans
          </Button>
          <Button
            type="primary"
            icon={<Plus size={14} strokeWidth={2} />}
            onClick={() => navigate('/super/tenants/new')}
            className="rounded-lg font-medium text-xs h-9 px-4 shadow-xs"
            style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
          >
            Provision Business
          </Button>
        </Space>
      </div>

      {/* Primary KPI Metrics */}
      <Row gutter={[14, 14]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Registered Businesses"
            value={stats?.totalTenants ?? 0}
            icon={<Building2 size={18} strokeWidth={2.2} />}
            color="#386b58"
            subtitle={`${stats?.activeTenants ?? 0} active subscriptions`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Operations"
            value={stats?.activeTenants ?? 0}
            icon={<CheckCircle2 size={18} strokeWidth={2.2} />}
            color="#059669"
            subtitle="Verified live tenants"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Platform Guest Orders"
            value={stats?.totalOrders ?? 0}
            icon={<ClipboardList size={18} strokeWidth={2.2} />}
            color="#d97706"
            subtitle="Across all tenants"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Platform Dining Guests"
            value={stats?.totalCustomers ?? 0}
            icon={<Users size={18} strokeWidth={2.2} />}
            color="#2563eb"
            subtitle="Registered diners"
          />
        </Col>
      </Row>

      {/* Onboarded Tenants Table */}
      <Card
        title={
          <div className="flex items-center justify-between py-1">
            <span className="font-semibold text-slate-900 text-sm">Recently Provisioned Businesses</span>
            <Button
              type="text"
              onClick={() => navigate('/super/tenants')}
              icon={<ArrowRight size={14} strokeWidth={2} />}
              className="text-xs font-semibold text-emerald-800 flex items-center gap-1"
            >
              View All Tenants
            </Button>
          </div>
        }
        className="rounded-xl shadow-xs border border-slate-200/80 bg-white"
      >
        <Table
          dataSource={tenants}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={false}
          size="middle"
          locale={{
            emptyText: (
              <EmptyState
                title="No tenants onboarded yet"
                description="Click 'Provision Business' to create the first hospitality tenant on the platform."
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

export default SuperAdminDashboard;

import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, List, Tag, Select, Button, Space } from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  StarOutlined,
  AppstoreOutlined,
  QrcodeOutlined,
  FireOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import StatCard from '../../components/common/StatCard';
import tenantService from '../../services/tenant.service';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { InlineSpinner } from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;
const { Option } = Select;

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, ordersRes] = await Promise.all([
        tenantService.getAnalyticsSummary(),
        tenantService.getOrders({ limit: 5 }),
      ]);
      setData(summaryRes.data);
      setRecentOrders(ordersRes.data || []);
    } catch (err) {
      toast.error('Failed to load live analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = data?.stats || {};
  const graphData = data?.revenueGraph || [];
  const popularItems = data?.popularItems || [];

  const statusColors = {
    pending: 'orange',
    accepted: 'blue',
    preparing: 'purple',
    ready: 'cyan',
    served: 'green',
    completed: 'green',
    cancelled: 'default',
  };

  if (loading && !data) return <InlineSpinner text="Loading restaurant metrics..." />;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <Title level={4} className="!mb-0 !font-extrabold !text-slate-900">
            Operations & Revenue Analytics
          </Title>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            Real-time business performance calculated directly from live guest dining orders
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadData}
            className="rounded-xl font-medium"
          >
            Refresh Data
          </Button>
          <Button
            type="primary"
            icon={<QrcodeOutlined />}
            onClick={() => navigate('/tables')}
            className="rounded-xl font-semibold shadow-sm"
            style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
          >
            Manage Tables & QR
          </Button>
        </Space>
      </div>

      {/* Primary KPI Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(stats.todayRevenue)}
            icon={<DollarOutlined />}
            color="#10b981"
            change={stats.revenueChange}
            changeType={stats.revenueChange >= 0 ? 'up' : 'down'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Revenue (All Time)"
            value={formatCurrency(stats.totalRevenue)}
            icon={<DollarOutlined />}
            color="#6366f1"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Today's Orders"
            value={stats.todayOrders ?? 0}
            icon={<ShoppingOutlined />}
            color="#f59e0b"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Guest Orders"
            value={stats.totalOrders ?? 0}
            icon={<ShoppingOutlined />}
            color="#8b5cf6"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Average Order Value"
            value={formatCurrency(stats.avgOrderValue)}
            icon={<DollarOutlined />}
            color="#06b6d4"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Registered Guests"
            value={stats.totalCustomers ?? 0}
            icon={<UserOutlined />}
            color="#ec4899"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Guest Satisfaction"
            value={stats.avgRating > 0 ? `${stats.avgRating} / 5` : 'No reviews'}
            icon={<StarOutlined />}
            color="#f59e0b"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active / Occupied Tables"
            value={`${stats.occupiedTables || 0} / ${stats.totalTables || 0}`}
            icon={<AppstoreOutlined />}
            color="#3b82f6"
          />
        </Col>
      </Row>

      {/* Analytics Charts */}
      <Row gutter={[16, 16]}>
        {/* Revenue Trend Chart */}
        <Col xs={24} lg={16}>
          <Card
            title={<span className="font-bold text-slate-800 text-sm">Revenue Inflow (Last 7 Days)</span>}
            className="rounded-2xl shadow-sm border border-slate-100"
          >
            {graphData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <span>No order data in this timeframe yet. Place orders to see live revenue.</span>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(val) => [`₹${val}`, 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* Most Ordered Items */}
        <Col xs={24} lg={8}>
          <Card
            title={<span className="font-bold text-slate-800 text-sm">Top Bestselling Dishes</span>}
            className="rounded-2xl shadow-sm border border-slate-100"
          >
            {popularItems.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                No orders processed yet
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {popularItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-800 text-xs block">{item.name}</span>
                        <span className="text-[11px] text-slate-400">{item.quantity} portions served</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 text-xs">{formatCurrency(item.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Live Recent Orders Feed */}
      <Card
        title={<span className="font-bold text-slate-800 text-sm">Recent Guest Orders</span>}
        className="rounded-2xl shadow-sm border border-slate-100"
        extra={
          <Button type="link" onClick={() => navigate('/orders')} className="text-xs font-semibold text-indigo-600">
            View All Orders
          </Button>
        }
      >
        <List
          dataSource={recentOrders}
          renderItem={(order) => (
            <List.Item className="!py-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
                <div>
                  <span className="font-bold text-slate-800 text-sm">{order.orderNumber}</span>
                  <span className="text-slate-400 text-xs ml-3">
                    {order.table?.number ? `Table ${order.table.number}` : 'Counter / Takeaway'}
                  </span>
                  <span className="text-slate-300 mx-2">•</span>
                  <span className="text-slate-500 text-xs">{order.customerName || 'Guest'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 text-xs">{order.items?.length || 0} items</span>
                  <span className="font-black text-slate-900 text-sm">₹{order.grandTotal}</span>
                  <Tag color={statusColors[order.status] || 'default'} className="rounded-md capitalize text-xs">
                    {order.status}
                  </Tag>
                  <Tag color={order.paymentStatus === 'paid' ? 'green' : 'orange'} className="rounded-md uppercase text-[10px]">
                    {order.paymentStatus}
                  </Tag>
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default OwnerDashboard;

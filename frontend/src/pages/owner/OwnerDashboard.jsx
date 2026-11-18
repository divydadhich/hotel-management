import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, List, Tag, Button, Space } from 'antd';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Star,
  QrCode,
  RotateCw,
  TrendingUp,
  LayoutGrid,
  ArrowUpRight,
  Utensils,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '../../components/common/StatCard';
import tenantService from '../../services/tenant.service';
import { formatCurrency } from '../../utils/formatters';
import { InlineSpinner } from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

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
        tenantService.getOrders({ limit: 6 }),
      ]);
      setData(summaryRes.data);
      setRecentOrders(ordersRes.data || []);
    } catch {
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

  const statusBadgeClasses = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200/80',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200/80',
    preparing: 'bg-purple-50 text-purple-700 border-purple-200/80',
    ready: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
    served: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200/80',
  };

  if (loading && !data) return <InlineSpinner text="Loading metrics..." />;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <Title level={4} className="!mb-0.5 !font-bold !text-slate-900 !tracking-tight">
            Executive Performance Overview
          </Title>
          <Text className="text-slate-500 text-xs block">
            Real-time telemetry and revenue calculated directly from guest dining orders
          </Text>
        </div>
        <Space size="small">
          <Button
            icon={<RotateCw size={14} strokeWidth={2} />}
            onClick={loadData}
            className="rounded-lg font-medium text-xs h-9 px-3.5 border-slate-200 text-slate-700 hover:text-slate-900"
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<QrCode size={14} strokeWidth={2} />}
            onClick={() => navigate('/tables')}
            className="rounded-lg font-medium text-xs h-9 px-4 shadow-xs"
            style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
          >
            Manage Tables & QR
          </Button>
        </Space>
      </div>

      {/* KPI Cards Grid */}
      <Row gutter={[14, 14]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Today's Inflow"
            value={formatCurrency(stats.todayRevenue)}
            icon={<DollarSign size={18} strokeWidth={2.2} />}
            color="#386b58"
            change={stats.revenueChange}
            changeType={stats.revenueChange >= 0 ? 'up' : 'down'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Revenue (Gross)"
            value={formatCurrency(stats.totalRevenue)}
            icon={<TrendingUp size={18} strokeWidth={2.2} />}
            color="#059669"
            subtitle="All verified orders"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Today's Orders"
            value={stats.todayOrders ?? 0}
            icon={<ShoppingBag size={18} strokeWidth={2.2} />}
            color="#d97706"
            subtitle={`${stats.totalOrders ?? 0} lifetime orders`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Average Ticket Value"
            value={formatCurrency(stats.avgOrderValue)}
            icon={<DollarSign size={18} strokeWidth={2.2} />}
            color="#2563eb"
            subtitle="Per completed order"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Registered Guests"
            value={stats.totalCustomers ?? 0}
            icon={<Users size={18} strokeWidth={2.2} />}
            color="#7c3aed"
            subtitle="Unique guest accounts"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Guest Satisfaction"
            value={stats.avgRating > 0 ? `${stats.avgRating} / 5.0` : 'No reviews'}
            icon={<Star size={18} strokeWidth={2.2} />}
            color="#eab308"
            subtitle={`${stats.reviewCount || 0} customer reviews`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Occupancy"
            value={`${stats.occupiedTables || 0} / ${stats.totalTables || 0}`}
            icon={<LayoutGrid size={18} strokeWidth={2.2} />}
            color="#0284c7"
            subtitle={`${stats.availableTables || 0} tables open`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Dining Volume"
            value={stats.totalOrders ?? 0}
            icon={<Utensils size={18} strokeWidth={2.2} />}
            color="#475569"
            subtitle="All guest sessions"
          />
        </Col>
      </Row>

      {/* Analytics Charts & Bestsellers */}
      <Row gutter={[16, 16]}>
        {/* Revenue Trend Area Chart */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="font-semibold text-slate-900 text-sm block">Revenue Trend</span>
                  <span className="text-slate-400 text-xs font-normal">Daily incoming gross receipts over the last 7 days</span>
                </div>
              </div>
            }
            className="rounded-xl shadow-xs border border-slate-200/80 bg-white"
          >
            {graphData.length === 0 ? (
              <div className="h-68 flex flex-col items-center justify-center text-slate-400 text-xs">
                <span>No order data in this timeframe yet. Placed orders will display live revenue here.</span>
              </div>
            ) : (
              <div className="h-68 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#386b58" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#386b58" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(val) => [`₹${val}`, 'Gross Revenue']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#386b58" strokeWidth={2.2} fillOpacity={1} fill="url(#revenueGlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* Top Bestselling Dishes */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="py-1">
                <span className="font-semibold text-slate-900 text-sm block">Top Selling Dishes</span>
                <span className="text-slate-400 text-xs font-normal">Ranked by aggregate order volume</span>
              </div>
            }
            className="rounded-xl shadow-xs border border-slate-200/80 bg-white"
          >
            {popularItems.length === 0 ? (
              <div className="h-68 flex items-center justify-center text-slate-400 text-xs">
                No dish orders recorded yet
              </div>
            ) : (
              <div className="space-y-3.5 py-1">
                {popularItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 text-xs block truncate">{item.name}</span>
                        <span className="text-[11px] text-slate-400">{item.quantity} portions ordered</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-xs whitespace-nowrap ml-2">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Live Recent Orders Feed */}
      <Card
        title={
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="font-semibold text-slate-900 text-sm block">Recent Guest Orders</span>
              <span className="text-slate-400 text-xs font-normal">Latest guest transactions placed via table QR and counter</span>
            </div>
            <Button
              type="text"
              onClick={() => navigate('/orders')}
              icon={<ArrowUpRight size={14} strokeWidth={2} />}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              View All Orders
            </Button>
          </div>
        }
        className="rounded-xl shadow-xs border border-slate-200/80 bg-white"
      >
        <List
          dataSource={recentOrders}
          renderItem={(order) => (
            <List.Item className="!py-3 !px-2 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 rounded-lg transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-slate-900 text-xs bg-slate-100 px-2 py-1 rounded">
                    {order.orderNumber}
                  </span>
                  <span className="text-slate-600 text-xs font-medium">
                    {order.table?.number ? `Table ${order.table.number}` : 'Counter / Takeaway'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 text-xs">{order.customerName || 'Walk-in Guest'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs">{order.items?.length || 0} items</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">₹{order.grandTotal}</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border capitalize ${
                      statusBadgeClasses[order.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {order.status}
                  </span>
                  <Tag
                    color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                    className="rounded text-[10px] uppercase font-semibold m-0"
                  >
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

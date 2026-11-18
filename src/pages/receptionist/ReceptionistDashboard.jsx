import { useEffect, useState } from 'react';
import {
  Card,
  Tabs,
  Typography,
  Tag,
  Button,
  Badge,
  Row,
  Col,
  Space,
  Select,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  CloseOutlined,
  SoundOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import useSocket from '../../hooks/useSocket';
import tenantService from '../../services/tenant.service';
import { formatTime, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

const ReceptionistDashboard = () => {
  const { onEvent } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const loadLiveOrders = async () => {
    setLoading(true);
    try {
      const res = await tenantService.getOrders({ limit: 50 });
      setOrders(res.data || []);
    } catch {
      toast.error('Failed to load incoming orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveOrders();
  }, []);

  // Real-time socket listener for incoming orders
  useEffect(() => {
    const cleanupNewOrder = onEvent('order:new', ({ order }) => {
      toast.custom(
        (t) => (
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/50 flex items-center gap-3">
            <span className="text-2xl animate-bounce">🛎️</span>
            <div>
              <p className="font-bold text-sm">NEW ORDER: #{order.orderNumber}</p>
              <p className="text-xs text-slate-400">
                {order.table?.number ? `Table ${order.table.number}` : 'Takeaway'} • ₹{order.grandTotal}
              </p>
            </div>
          </div>
        ),
        { duration: 6000 }
      );

      // Play chime if enabled
      if (soundEnabled) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        } catch {}
      }

      setOrders((prev) => [order, ...prev.filter((o) => o._id !== order._id)]);
    });

    const cleanupStatusUpdate = onEvent('order:status_updated', ({ orderId, status, order }) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status, ...(order || {}) } : o))
      );
    });

    return () => {
      if (cleanupNewOrder) cleanupNewOrder();
      if (cleanupStatusUpdate) cleanupStatusUpdate();
    };
  }, [onEvent, soundEnabled]);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await tenantService.updateOrderStatus(orderId, { status });
      toast.success(`Order marked as ${status}`);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleCollectPayment = async (orderId) => {
    try {
      await tenantService.updatePaymentStatus(orderId, { paymentStatus: 'paid' });
      toast.success('Payment marked as PAID (Cash / Counter)');
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, paymentStatus: 'paid' } : o))
      );
    } catch {
      toast.error('Failed to update payment status');
    }
  };

  const filterOrders = (statusGroup) => {
    if (statusGroup === 'new') return orders.filter((o) => o.status === 'pending');
    if (statusGroup === 'active') return orders.filter((o) => ['accepted', 'preparing', 'ready'].includes(o.status));
    if (statusGroup === 'served') return orders.filter((o) => o.status === 'served');
    if (statusGroup === 'completed') return orders.filter((o) => ['completed', 'cancelled'].includes(o.status));
    return orders;
  };

  const renderOrderCard = (order) => (
    <Card
      key={order._id}
      className={`rounded-2xl shadow-sm border mb-4 transition-all ${
        order.status === 'pending'
          ? 'border-indigo-400/80 bg-indigo-50/20 ring-2 ring-indigo-500/10'
          : 'border-slate-100 bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 text-base">{order.orderNumber}</span>
            <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg text-xs">
              {order.table?.number ? `Table ${order.table.number}` : 'Counter Takeaway'}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">
            Guest: <strong>{order.customerName || 'Guest'}</strong> • {formatTime(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-black text-slate-900 block">₹{order.grandTotal}</span>
          <Tag color={order.paymentStatus === 'paid' ? 'green' : 'orange'} className="rounded-md uppercase text-[10px]">
            {order.paymentStatus} ({order.paymentMethod})
          </Tag>
        </div>
      </div>

      {/* Items list */}
      <div className="bg-slate-50 p-3 rounded-xl mb-4 space-y-1.5 border border-slate-100">
        {order.items?.map((it, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-800">
              {it.quantity}× {it.name}
              {it.specialInstructions && (
                <span className="text-amber-600 block text-[11px] font-normal italic">
                  Note: {it.specialInstructions}
                </span>
              )}
            </span>
            <span className="text-slate-500">₹{it.subtotal}</span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div>
          {order.paymentStatus !== 'paid' && (
            <Button
              size="small"
              onClick={() => handleCollectPayment(order._id)}
              className="rounded-lg text-xs font-semibold text-emerald-600 border-emerald-300 hover:bg-emerald-50"
            >
              Collect Cash (₹{order.grandTotal})
            </Button>
          )}
        </div>

        <Space>
          {order.status === 'pending' && (
            <>
              <Button
                size="small"
                danger
                onClick={() => handleUpdateStatus(order._id, 'rejected')}
                className="rounded-lg text-xs"
              >
                Reject
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={() => handleUpdateStatus(order._id, 'accepted')}
                className="rounded-lg text-xs font-bold"
                style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
              >
                Accept Order ✓
              </Button>
            </>
          )}
          {order.status === 'accepted' && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleUpdateStatus(order._id, 'preparing')}
              className="rounded-lg text-xs font-semibold"
              style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
            >
              Send to Kitchen
            </Button>
          )}
          {order.status === 'ready' && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleUpdateStatus(order._id, 'served')}
              className="rounded-lg text-xs font-bold"
              style={{ backgroundColor: '#06b6d4', borderColor: '#06b6d4' }}
            >
              Mark Served to Table
            </Button>
          )}
          {order.status === 'served' && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleUpdateStatus(order._id, 'completed')}
              className="rounded-lg text-xs font-bold"
              style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
            >
              Complete Order ✓
            </Button>
          )}
        </Space>
      </div>
    </Card>
  );

  const newCount = filterOrders('new').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <Title level={4} className="!mb-0 !font-extrabold !text-slate-900">
            Front Desk & Order Reception
          </Title>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            Real-time incoming orders with instant Socket.IO push alerts and table occupancy status
          </Text>
        </div>
        <Space>
          <Button
            icon={<SoundOutlined />}
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              toast.success(`Sound alerts ${!soundEnabled ? 'Enabled' : 'Disabled'}`);
            }}
            className={`rounded-xl font-medium ${soundEnabled ? 'text-indigo-600 border-indigo-200' : 'text-slate-400'}`}
          >
            Sound {soundEnabled ? 'ON' : 'OFF'}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadLiveOrders} className="rounded-xl font-medium">
            Sync
          </Button>
        </Space>
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100">
        <Tabs
          defaultActiveKey="new"
          items={[
            {
              key: 'new',
              label: (
                <Badge count={newCount} offset={[10, 0]} color="#6366f1">
                  <span className="font-bold">New Incoming ({newCount})</span>
                </Badge>
              ),
              children: (
                <div>
                  {filterOrders('new').length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs">
                      No pending orders. Waiting for guests to scan table QR...
                    </div>
                  ) : (
                    filterOrders('new').map(renderOrderCard)
                  )}
                </div>
              ),
            },
            {
              key: 'active',
              label: `Kitchen In-Progress (${filterOrders('active').length})`,
              children: (
                <div>
                  {filterOrders('active').length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs">No active orders</div>
                  ) : (
                    filterOrders('active').map(renderOrderCard)
                  )}
                </div>
              ),
            },
            {
              key: 'served',
              label: `Served at Table (${filterOrders('served').length})`,
              children: (
                <div>
                  {filterOrders('served').length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs">No currently served orders</div>
                  ) : (
                    filterOrders('served').map(renderOrderCard)
                  )}
                </div>
              ),
            },
            {
              key: 'completed',
              label: `Completed History`,
              children: (
                <div>
                  {filterOrders('completed').length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs">No completed orders today</div>
                  ) : (
                    filterOrders('completed').slice(0, 20).map(renderOrderCard)
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ReceptionistDashboard;

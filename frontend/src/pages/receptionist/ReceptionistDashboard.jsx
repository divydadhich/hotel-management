import { useEffect, useState } from 'react';
import {
  Card,
  Tabs,
  Typography,
  Tag,
  Button,
  Row,
  Col,
  Space,
} from 'antd';
import {
  Bell,
  Check,
  X,
  Volume2,
  VolumeX,
  RotateCw,
  Clock,
  ConciergeBell,
} from 'lucide-react';
import useSocket from '../../hooks/useSocket';
import tenantService from '../../services/tenant.service';
import { formatTime } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
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
        () => (
          <div className="bg-white text-slate-800 p-4 rounded-xl shadow-lg border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Bell size={18} strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900">NEW ORDER: {order.orderNumber}</p>
              <p className="text-[11px] text-slate-500">
                {order.table?.number ? `Table ${order.table.number}` : 'Counter'} • ₹{order.grandTotal}
              </p>
            </div>
          </div>
        ),
        { duration: 6000 }
      );

      // Play subtle chime if enabled
      if (soundEnabled) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
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
      toast.success('Payment recorded as Paid');
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
      className={`rounded-xl shadow-xs border mb-3.5 transition-all ${
        order.status === 'pending'
          ? 'border-emerald-600/50 bg-emerald-50/15'
          : 'border-slate-200/80 bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900 text-sm">{order.orderNumber}</span>
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200/70">
              {order.table?.number ? `Table ${order.table.number}` : 'Counter / Takeaway'}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Guest: <strong>{order.customerName || 'Walk-in'}</strong> • {formatTime(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-base font-bold text-slate-900 block leading-tight">
            ₹{order.grandTotal}
          </span>
          <Tag
            color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
            className="rounded text-[10px] uppercase font-semibold m-0 mt-1"
          >
            {order.paymentStatus} ({order.paymentMethod?.replace('_', ' ')})
          </Tag>
        </div>
      </div>

      {/* Items list */}
      <div className="bg-slate-50/80 p-3 rounded-lg mb-3 space-y-1.5 border border-slate-100">
        {order.items?.map((it, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <span className="text-slate-800 font-medium">
              <span className="font-mono font-semibold text-slate-700">{it.quantity}×</span> {it.name}
              {it.specialInstructions && (
                <span className="text-amber-700 block text-[11px] font-normal italic">
                  Note: {it.specialInstructions}
                </span>
              )}
            </span>
            <span className="font-mono text-slate-500">₹{it.subtotal}</span>
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
              className="rounded text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
            >
              Collect Cash (₹{order.grandTotal})
            </Button>
          )}
        </div>

        <Space size="small">
          {order.status === 'pending' && (
            <>
              <Button
                size="small"
                danger
                onClick={() => handleUpdateStatus(order._id, 'rejected')}
                className="rounded text-xs"
              >
                Reject
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={() => handleUpdateStatus(order._id, 'accepted')}
                className="rounded text-xs font-semibold"
                style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
              >
                Accept Order
              </Button>
            </>
          )}

          {order.status === 'accepted' && (
            <Button
              size="small"
              onClick={() => handleUpdateStatus(order._id, 'preparing')}
              className="rounded text-xs font-medium"
            >
              Send to Kitchen
            </Button>
          )}

          {order.status === 'ready' && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleUpdateStatus(order._id, 'served')}
              className="rounded text-xs font-semibold bg-emerald-600 border-emerald-600"
            >
              Mark Served
            </Button>
          )}

          {order.status === 'served' && (
            <Button
              size="small"
              onClick={() => handleUpdateStatus(order._id, 'completed')}
              className="rounded text-xs font-medium"
            >
              Close Order
            </Button>
          )}
        </Space>
      </div>
    </Card>
  );

  const pendingCount = filterOrders('new').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <Title level={4} className="!mb-0.5 !font-bold !text-slate-900 !tracking-tight">
            Front Desk & Order Reception
          </Title>
          <Text className="text-slate-500 text-xs block">
            Monitor incoming digital guest orders in real time, confirm payment, and dispatch to kitchen
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={soundEnabled ? <Volume2 size={14} strokeWidth={2} /> : <VolumeX size={14} strokeWidth={2} />}
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`rounded-lg text-xs h-9 px-3 ${soundEnabled ? 'text-emerald-800 border-emerald-200' : 'text-slate-400'}`}
          >
            {soundEnabled ? 'Chime Active' : 'Muted'}
          </Button>
          <Button
            icon={<RotateCw size={14} strokeWidth={2} />}
            onClick={loadLiveOrders}
            className="rounded-lg text-xs h-9 px-3.5 border-slate-200 text-slate-700"
          >
            Refresh
          </Button>
        </div>
      </div>

      <Card className="rounded-xl shadow-xs border border-slate-200/80 bg-white">
        <Tabs
          defaultActiveKey="new"
          items={[
            {
              key: 'new',
              label: (
                <span className="flex items-center gap-2 text-xs font-medium">
                  <span>Incoming Queue</span>
                  {pendingCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </span>
              ),
              children: (
                <div>
                  {filterOrders('new').length === 0 ? (
                    <EmptyState
                      title="No incoming orders"
                      description="New table QR or counter orders will appear here instantaneously via WebSocket."
                      icon={ConciergeBell}
                    />
                  ) : (
                    filterOrders('new').map(renderOrderCard)
                  )}
                </div>
              ),
            },
            {
              key: 'active',
              label: <span className="text-xs font-medium">Kitchen Active ({filterOrders('active').length})</span>,
              children: (
                <div>
                  {filterOrders('active').length === 0 ? (
                    <EmptyState title="No active preparation" description="Orders accepted by reception will show progress here." icon={Clock} />
                  ) : (
                    filterOrders('active').map(renderOrderCard)
                  )}
                </div>
              ),
            },
            {
              key: 'served',
              label: <span className="text-xs font-medium">Served ({filterOrders('served').length})</span>,
              children: (
                <div>
                  {filterOrders('served').length === 0 ? (
                    <EmptyState title="No served orders pending payment" description="Dishes served to tables." icon={Check} />
                  ) : (
                    filterOrders('served').map(renderOrderCard)
                  )}
                </div>
              ),
            },
            {
              key: 'all',
              label: <span className="text-xs font-medium">All Live Orders ({orders.length})</span>,
              children: (
                <div>
                  {orders.length === 0 ? (
                    <EmptyState title="No orders on record today" icon={ConciergeBell} />
                  ) : (
                    orders.map(renderOrderCard)
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

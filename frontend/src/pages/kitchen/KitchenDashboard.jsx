import { useEffect, useState } from 'react';
import { Row, Col, Typography, Button, Space } from 'antd';
import {
  ChefHat,
  Clock,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import useSocket from '../../hooks/useSocket';
import tenantService from '../../services/tenant.service';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

const formatElapsed = (createdAt) => {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  return `${mins}m ago`;
};

const KitchenDashboard = () => {
  const { onEvent } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadKitchenOrders = async () => {
    setLoading(true);
    try {
      const res = await tenantService.getOrders({ limit: 40 });
      setOrders(res.data || []);
    } catch {
      toast.error('Failed to load kitchen queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKitchenOrders();
    const interval = setInterval(() => {
      setOrders((prev) => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Real-time socket updates for kitchen
  useEffect(() => {
    const cleanupNew = onEvent('kitchen:new_order', ({ order }) => {
      toast.custom(
        () => (
          <div className="bg-slate-900 text-white font-medium p-3.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs">
            <ChefHat size={18} className="text-amber-400" />
            <span>Incoming Kitchen Ticket: #{order.orderNumber}</span>
          </div>
        ),
        { duration: 8000 }
      );
      setOrders((prev) => [order, ...prev.filter((o) => o._id !== order._id)]);
    });

    const cleanupUpdate = onEvent('kitchen:order_updated', ({ orderId, status, order }) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status, ...(order || {}) } : o))
      );
    });

    return () => {
      if (cleanupNew) cleanupNew();
      if (cleanupUpdate) cleanupUpdate();
    };
  }, [onEvent]);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await tenantService.updateOrderStatus(orderId, { status });
      toast.success(`Ticket marked as ${status.toUpperCase()}`);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
    } catch {
      toast.error('Failed to update ticket');
    }
  };

  const incomingOrders = orders.filter((o) => ['pending', 'accepted'].includes(o.status));
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  const renderKitchenTicket = (order, borderClass, actionBtn) => {
    const elapsedMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    const isDelayed = elapsedMinutes >= 20;

    return (
      <div
        key={order._id}
        className={`rounded-xl border p-4 bg-white shadow-2xs mb-3.5 transition-all ${borderClass}`}
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-2.5 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-slate-900 tracking-tight leading-none">
                {order.orderNumber}
              </span>
              <span className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded text-xs border border-slate-200/60">
                {order.table?.number ? `Table ${order.table.number}` : 'Takeaway'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1 font-mono">
              Guest: {order.customerName || 'Walk-in'}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded font-semibold ${
                isDelayed
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Clock size={12} strokeWidth={2} />
              <span>{formatElapsed(order.createdAt)}</span>
            </span>
          </div>
        </div>

        {/* Ordered Items with Special Notes */}
        <div className="space-y-2 mb-4">
          {order.items?.map((it, idx) => (
            <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div className="flex justify-between items-start text-xs font-semibold text-slate-900">
                <span className="flex-1">
                  <span className="font-mono text-slate-600 mr-1.5">{it.quantity}×</span>
                  <span>{it.name}</span>
                </span>
                {it.variant?.name && (
                  <span className="text-[10px] text-slate-400 uppercase ml-2">[{it.variant.name}]</span>
                )}
              </div>
              {it.specialInstructions && (
                <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-start gap-1 text-amber-700 text-[11px] font-medium">
                  <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                  <span>{it.specialInstructions}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ticket Action Button */}
        <div>{actionBtn}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <Title level={4} className="!mb-0.5 !font-bold !text-slate-900 !tracking-tight">
            Kitchen Display System (KDS)
          </Title>
          <Text className="text-slate-500 text-xs block">
            High-contrast chef ticketing console with live preparation timers and instant status progression
          </Text>
        </div>
        <Button
          icon={<RotateCw size={14} strokeWidth={2} />}
          onClick={loadKitchenOrders}
          className="rounded-lg text-xs h-9 px-3.5 border-slate-200 text-slate-700"
        >
          Refresh Queue
        </Button>
      </div>

      {/* 3-Column KDS Board */}
      <Row gutter={[16, 16]}>
        {/* Column 1: Incoming */}
        <Col xs={24} md={8}>
          <div className="bg-slate-100/70 p-3.5 rounded-xl border border-slate-200/70 min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3.5">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Flame size={14} className="text-amber-600" />
                <span>To Prepare ({incomingOrders.length})</span>
              </span>
            </div>

            {incomingOrders.length === 0 ? (
              <EmptyState title="No orders to prepare" description="New orders will appear here automatically." icon={ChefHat} />
            ) : (
              incomingOrders.map((o) =>
                renderKitchenTicket(
                  o,
                  'border-amber-200 bg-amber-50/15',
                  <Button
                    type="primary"
                    block
                    onClick={() => handleUpdateStatus(o._id, 'preparing')}
                    className="rounded-lg text-xs font-semibold h-9 shadow-xs"
                    style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
                  >
                    Start Cooking
                  </Button>
                )
              )
            )}
          </div>
        </Col>

        {/* Column 2: In Cooking */}
        <Col xs={24} md={8}>
          <div className="bg-slate-100/70 p-3.5 rounded-xl border border-slate-200/70 min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3.5">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock size={14} className="text-blue-600" />
                <span>On The Stove ({preparingOrders.length})</span>
              </span>
            </div>

            {preparingOrders.length === 0 ? (
              <EmptyState title="Kitchen clear" description="Dishes currently cooking will appear here." icon={Clock} />
            ) : (
              preparingOrders.map((o) =>
                renderKitchenTicket(
                  o,
                  'border-blue-200 bg-blue-50/15',
                  <Button
                    type="primary"
                    block
                    onClick={() => handleUpdateStatus(o._id, 'ready')}
                    className="rounded-lg text-xs font-semibold h-9 bg-emerald-600 border-emerald-600 shadow-xs"
                  >
                    Mark Ready for Pickup
                  </Button>
                )
              )
            )}
          </div>
        </Col>

        {/* Column 3: Ready */}
        <Col xs={24} md={8}>
          <div className="bg-slate-100/70 p-3.5 rounded-xl border border-slate-200/70 min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3.5">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Ready for Waiter ({readyOrders.length})</span>
              </span>
            </div>

            {readyOrders.length === 0 ? (
              <EmptyState title="No orders waiting" description="Plated dishes awaiting server pickup." icon={CheckCircle2} />
            ) : (
              readyOrders.map((o) =>
                renderKitchenTicket(
                  o,
                  'border-emerald-200 bg-emerald-50/20',
                  <Button
                    block
                    onClick={() => handleUpdateStatus(o._id, 'served')}
                    className="rounded-lg text-xs font-semibold h-9 text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                  >
                    Confirm Plated & Served
                  </Button>
                )
              )
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default KitchenDashboard;

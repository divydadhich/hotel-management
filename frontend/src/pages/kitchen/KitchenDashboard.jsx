import { useEffect, useState } from 'react';
import { Row, Col, Typography, Button, Badge } from 'antd';
import {
  FireOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import useSocket from '../../hooks/useSocket';
import tenantService from '../../services/tenant.service';
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
      // Re-render elapsed timers every minute
      setOrders((prev) => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Real-time socket updates for kitchen
  useEffect(() => {
    const cleanupNew = onEvent('kitchen:new_order', ({ order }) => {
      toast.custom(
        () => (
          <div className="bg-amber-500 text-black font-black p-4 rounded-2xl shadow-2xl flex items-center gap-3 text-base">
            <span>🔥 NEW KITCHEN TICKET: #{order.orderNumber}</span>
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

  const renderKitchenTicket = (order, borderClass, actionBtn) => (
    <div
      key={order._id}
      className={`rounded-2xl border-2 p-5 bg-slate-900 text-white shadow-xl mb-4 ${borderClass}`}
    >
      <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-2xl text-white tracking-wide">{order.orderNumber}</span>
            <span className="bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-xl text-sm uppercase">
              {order.table?.number ? `Table ${order.table.number}` : 'Takeaway'}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Guest: {order.customerName || 'Dine-in Guest'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20">
          <ClockCircleOutlined />
          <span>{formatElapsed(order.createdAt)}</span>
        </div>
      </div>

      {/* Dishes to prepare */}
      <div className="space-y-3 mb-5">
        {order.items?.map((it, idx) => (
          <div key={idx} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <div className="flex justify-between items-start">
              <span className="font-extrabold text-base text-white leading-tight">
                {it.name}
              </span>
              <span className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center flex-shrink-0 ml-2">
                ×{it.quantity}
              </span>
            </div>
            {it.variant && (
              <span className="text-indigo-400 text-xs font-semibold block mt-1">
                Variant: {it.variant.name}
              </span>
            )}
            {it.specialInstructions && (
              <div className="mt-2 text-xs font-bold text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                ⚠️ Kitchen Note: {it.specialInstructions}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Ticket Action Button */}
      <div className="flex justify-end">{actionBtn(order)}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 rounded-3xl space-y-6">
      {/* KDS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-amber-500/20">
            <FireOutlined />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Kitchen Display System (KDS)
            </h1>
            <p className="text-slate-400 text-xs font-medium">
              Live preparation queue • Optimized for high-visibility tablet mounting
            </p>
          </div>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadKitchenOrders}
          className="rounded-xl font-bold bg-slate-800 border-slate-700 text-white hover:text-white hover:border-slate-600"
        >
          Sync Queue
        </Button>
      </div>

      {/* 3-Column Ticket Board */}
      <Row gutter={[20, 20]}>
        {/* Column 1: Incoming / Queued */}
        <Col xs={24} lg={8}>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 min-h-[500px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <span className="font-black text-sm uppercase tracking-wider text-amber-400">
                1. Incoming / Queued
              </span>
              <span className="bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-xs">
                {incomingOrders.length}
              </span>
            </div>

            {incomingOrders.length === 0 ? (
              <div className="text-center py-24 text-slate-600 text-xs">
                No orders waiting in queue
              </div>
            ) : (
              incomingOrders.map((order) =>
                renderKitchenTicket(order, 'border-amber-500/50', (o) => (
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => handleUpdateStatus(o._id, 'preparing')}
                    className="w-full h-12 rounded-xl font-black text-sm shadow-lg shadow-amber-500/20"
                    style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#000' }}
                  >
                    Start Cooking 🔥
                  </Button>
                ))
              )
            )}
          </div>
        </Col>

        {/* Column 2: In Preparation */}
        <Col xs={24} lg={8}>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 min-h-[500px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <span className="font-black text-sm uppercase tracking-wider text-purple-400">
                2. On Stove / Preparing
              </span>
              <span className="bg-purple-500 text-white font-black px-2.5 py-0.5 rounded-full text-xs">
                {preparingOrders.length}
              </span>
            </div>

            {preparingOrders.length === 0 ? (
              <div className="text-center py-24 text-slate-600 text-xs">
                Nothing currently cooking
              </div>
            ) : (
              preparingOrders.map((order) =>
                renderKitchenTicket(order, 'border-purple-500/50', (o) => (
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => handleUpdateStatus(o._id, 'ready')}
                    className="w-full h-12 rounded-xl font-black text-sm shadow-lg shadow-emerald-500/20"
                    style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                  >
                    Mark Ready to Serve ✓
                  </Button>
                ))
              )
            )}
          </div>
        </Col>

        {/* Column 3: Ready for Pickup */}
        <Col xs={24} lg={8}>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 min-h-[500px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <span className="font-black text-sm uppercase tracking-wider text-cyan-400">
                3. Ready on Pass Counter
              </span>
              <span className="bg-cyan-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-xs">
                {readyOrders.length}
              </span>
            </div>

            {readyOrders.length === 0 ? (
              <div className="text-center py-24 text-slate-600 text-xs">
                No plated dishes waiting on pass
              </div>
            ) : (
              readyOrders.map((order) =>
                renderKitchenTicket(order, 'border-cyan-500/50', (o) => (
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => handleUpdateStatus(o._id, 'served')}
                    className="w-full h-12 rounded-xl font-black text-sm"
                    style={{ backgroundColor: '#06b6d4', borderColor: '#06b6d4' }}
                  >
                    Handed to Waiter ✓
                  </Button>
                ))
              )
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default KitchenDashboard;

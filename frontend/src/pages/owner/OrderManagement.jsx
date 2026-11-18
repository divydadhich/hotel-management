import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Typography,
  Card,
  Modal,
  Divider,
} from 'antd';
import {
  Search,
  Receipt,
  RotateCw,
  Printer,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import tenantService from '../../services/tenant.service';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;
const { Option } = Select;

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ status: '', search: '' });

  // Receipt modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = async (page = 1) => {
    setLoading(true);
    try {
      const res = await tenantService.getOrders({
        page,
        limit: pagination.limit,
        status: filters.status || undefined,
        search: filters.search || undefined,
      });
      setOrders(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(1);
  }, [filters]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await tenantService.updateOrderStatus(orderId, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      loadOrders(pagination.page);
    } catch {
      toast.error('Failed to update order status');
    }
  };

  const handlePaymentChange = async (orderId, newStatus) => {
    try {
      await tenantService.updatePaymentStatus(orderId, { paymentStatus: newStatus });
      toast.success(`Payment updated to ${newStatus}`);
      loadOrders(pagination.page);
    } catch {
      toast.error('Failed to update payment status');
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const statusBadgeClasses = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200/80',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200/80',
    preparing: 'bg-purple-50 text-purple-700 border-purple-200/80',
    ready: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
    served: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200/80',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200/80',
  };

  const columns = [
    {
      title: 'Order Identifier',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (num, r) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">{num}</span>
          <span className="text-slate-400 text-[11px] font-sans">{formatDateTime(r.createdAt)}</span>
        </div>
      ),
    },
    {
      title: 'Table / Source',
      key: 'table',
      render: (_, r) => (
        <span className="font-semibold text-slate-700 text-xs bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60 inline-block">
          {r.table?.number ? `Table ${r.table.number}` : 'Takeaway / Counter'}
        </span>
      ),
    },
    {
      title: 'Guest Info',
      key: 'guest',
      render: (_, r) => (
        <div>
          <span className="text-slate-900 text-xs font-semibold block">{r.customerName || 'Walk-in Guest'}</span>
          <span className="text-slate-400 text-[11px] font-mono">{r.customerPhone || '-'}</span>
        </div>
      ),
    },
    {
      title: 'Order Items Snapshot',
      key: 'items',
      render: (_, r) => (
        <div className="text-xs text-slate-600 max-w-xs space-y-0.5">
          {r.items?.map((it, i) => (
            <div key={i} className="truncate text-[11px]">
              <span className="font-semibold text-slate-700 font-mono">{it.quantity}×</span> {it.name}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Grand Total',
      key: 'amount',
      render: (_, r) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">₹{r.grandTotal}</span>
          <span className="text-[10px] text-slate-400 capitalize">{r.paymentMethod?.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      title: 'Kitchen Status',
      key: 'status',
      render: (_, r) => (
        <Select
          size="small"
          value={r.status}
          onChange={(val) => handleStatusChange(r._id, val)}
          className="w-28 rounded-md text-xs"
        >
          <Option value="pending">Pending</Option>
          <Option value="accepted">Accepted</Option>
          <Option value="preparing">Preparing</Option>
          <Option value="ready">Ready</Option>
          <Option value="served">Served</Option>
          <Option value="completed">Completed</Option>
          <Option value="cancelled">Cancelled</Option>
        </Select>
      ),
    },
    {
      title: 'Payment',
      key: 'paymentStatus',
      render: (_, r) => (
        <Select
          size="small"
          value={r.paymentStatus}
          onChange={(val) => handlePaymentChange(r._id, val)}
          className="w-24 rounded-md text-xs"
        >
          <Option value="pending">Pending</Option>
          <Option value="paid">Paid</Option>
          <Option value="refunded">Refunded</Option>
          <Option value="failed">Failed</Option>
        </Select>
      ),
    },
    {
      title: 'Bill & Receipt',
      key: 'actions',
      align: 'right',
      render: (_, r) => (
        <Button
          size="small"
          icon={<Receipt size={13} strokeWidth={2} />}
          onClick={() => {
            setSelectedOrder(r);
            setReceiptModalOpen(true);
          }}
          className="rounded-md text-xs border-slate-200"
        >
          View Bill
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <Title level={4} className="!mb-0.5 !font-bold !text-slate-900 !tracking-tight">
            Live Orders & Billing Register
          </Title>
          <Text className="text-slate-500 text-xs block">
            Real-time status transitions, verified itemized bills, and payment status verification
          </Text>
        </div>
        <Button
          icon={<RotateCw size={14} strokeWidth={2} />}
          onClick={() => loadOrders(pagination.page)}
          className="rounded-lg font-medium text-xs h-9 px-3.5 border-slate-200 text-slate-700 hover:text-slate-900"
        >
          Refresh Feed
        </Button>
      </div>

      <Card className="rounded-xl shadow-xs border border-slate-200/80 bg-white">
        <div className="flex flex-wrap gap-3 mb-5">
          <Input
            placeholder="Search by Order # or Customer..."
            prefix={<Search size={14} strokeWidth={2} className="text-slate-400 mr-1" />}
            className="rounded-lg text-xs"
            style={{ width: 280 }}
            allowClear
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <Select
            placeholder="Filter by Status"
            allowClear
            className="rounded-lg text-xs"
            style={{ width: 160 }}
            onChange={(val) => setFilters((f) => ({ ...f, status: val }))}
          >
            <Option value="pending">Pending</Option>
            <Option value="accepted">Accepted</Option>
            <Option value="preparing">Preparing</Option>
            <Option value="ready">Ready</Option>
            <Option value="served">Served</Option>
            <Option value="completed">Completed</Option>
          </Select>
        </div>

        <Table
          dataSource={orders}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (p) => loadOrders(p),
            showSizeChanger: false,
          }}
          size="middle"
          locale={{
            emptyText: (
              <EmptyState
                title="No orders found"
                description="Orders placed by customers via table QR or counter will appear here in real time."
                icon={FileText}
              />
            ),
          }}
        />
      </Card>

      {/* Printable Receipt Modal */}
      <Modal
        title={
          <div className="flex items-center justify-between pr-6">
            <span className="font-semibold text-slate-900 text-sm">
              Bill Invoice {selectedOrder?.orderNumber}
            </span>
            <Button
              type="text"
              size="small"
              icon={<Printer size={14} strokeWidth={2} />}
              onClick={printReceipt}
              className="text-xs text-slate-600"
            >
              Print Bill
            </Button>
          </div>
        }
        open={receiptModalOpen}
        onCancel={() => setReceiptModalOpen(false)}
        footer={null}
        width={420}
      >
        {selectedOrder && (
          <div className="py-2 text-xs text-slate-800">
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h3 className="font-bold text-base text-slate-900 tracking-tight">DINING BILL RECEIPT</h3>
              <p className="text-slate-400 text-[11px] mt-0.5">Hotel & Restaurant Management Platform</p>
              <div className="flex justify-between text-slate-500 text-[11px] mt-2">
                <span>Date: {formatDateTime(selectedOrder.createdAt)}</span>
                <span className="font-semibold text-slate-800">
                  {selectedOrder.table?.number ? `Table ${selectedOrder.table.number}` : 'Counter Takeaway'}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              <div className="flex justify-between font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                <span>Item</span>
                <span className="text-right">Amount</span>
              </div>
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-slate-400 text-[11px] block">
                      {item.quantity} × ₹{item.price}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900">₹{item.subtotal}</span>
                </div>
              ))}
            </div>

            {/* Financial summary breakdown */}
            <div className="py-3 space-y-1.5 border-b border-dashed border-slate-300 text-slate-600">
              <div className="flex justify-between">
                <span>Item Subtotal</span>
                <span className="font-mono">₹{selectedOrder.subtotal}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({selectedOrder.couponCode || 'Promo'})</span>
                  <span className="font-mono">-₹{selectedOrder.discountAmount}</span>
                </div>
              )}
              {selectedOrder.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Taxes (GST)</span>
                  <span className="font-mono">₹{selectedOrder.taxAmount}</span>
                </div>
              )}
              {selectedOrder.serviceChargeAmount > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge</span>
                  <span className="font-mono">₹{selectedOrder.serviceChargeAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="font-mono text-base">₹{selectedOrder.grandTotal}</span>
              </div>
            </div>

            {/* Payment info */}
            <div className="pt-3 flex justify-between items-center text-[11px]">
              <div>
                <span className="text-slate-400 block">Payment Method</span>
                <span className="font-semibold capitalize text-slate-700">
                  {selectedOrder.paymentMethod?.replace('_', ' ')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Status</span>
                <Tag
                  color={selectedOrder.paymentStatus === 'paid' ? 'success' : 'warning'}
                  className="rounded text-[10px] uppercase font-semibold m-0"
                >
                  {selectedOrder.paymentStatus}
                </Tag>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderManagement;

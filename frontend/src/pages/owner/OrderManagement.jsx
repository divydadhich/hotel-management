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
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import tenantService from '../../services/tenant.service';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters';
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
      toast.success(`Payment marked as ${newStatus}`);
      loadOrders(pagination.page);
    } catch {
      toast.error('Failed to update payment status');
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const statusColors = {
    pending: 'orange',
    accepted: 'blue',
    preparing: 'purple',
    ready: 'cyan',
    served: 'green',
    completed: 'green',
    cancelled: 'default',
    rejected: 'red',
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (num, r) => (
        <div>
          <span className="font-extrabold text-slate-800 text-sm block">{num}</span>
          <span className="text-slate-400 text-xs">{formatDateTime(r.createdAt)}</span>
        </div>
      ),
    },
    {
      title: 'Table',
      key: 'table',
      render: (_, r) => (
        <span className="font-bold text-slate-700 text-xs bg-slate-100 px-2.5 py-1 rounded-lg">
          {r.table?.number ? `Table ${r.table.number}` : 'Takeaway'}
        </span>
      ),
    },
    {
      title: 'Guest Info',
      key: 'guest',
      render: (_, r) => (
        <div>
          <span className="text-slate-800 text-xs font-semibold block">{r.customerName || 'Guest'}</span>
          <span className="text-slate-400 text-[11px]">{r.customerPhone || '-'}</span>
        </div>
      ),
    },
    {
      title: 'Items Snapshot',
      key: 'items',
      render: (_, r) => (
        <div className="text-xs text-slate-600 max-w-xs">
          {r.items?.map((it, i) => (
            <div key={i} className="truncate">
              {it.quantity}× {it.name}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, r) => (
        <div>
          <span className="font-black text-slate-900 text-sm block">₹{r.grandTotal}</span>
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
          className="w-32 rounded-lg text-xs"
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
          className="w-28 rounded-lg text-xs"
        >
          <Option value="pending">Pending</Option>
          <Option value="paid">Paid</Option>
          <Option value="refunded">Refunded</Option>
          <Option value="failed">Failed</Option>
        </Select>
      ),
    },
    {
      title: 'Invoice',
      key: 'actions',
      render: (_, r) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedOrder(r);
            setReceiptModalOpen(true);
          }}
          className="rounded-lg text-xs"
        >
          View Bill
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <Title level={4} className="!mb-0 !font-extrabold !text-slate-900">
            Guest Orders & Billing Ledger
          </Title>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            Immutable invoice snapshots, payment confirmations, and real-time order lifecycle tracking
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => loadOrders(pagination.page)}
          className="rounded-xl font-medium"
        >
          Refresh Feed
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3 mb-5">
          <Input
            placeholder="Search by Order # or Customer..."
            prefix={<SearchOutlined className="text-slate-400" />}
            className="rounded-xl"
            style={{ width: 280 }}
            allowClear
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <Select
            placeholder="Filter by Status"
            allowClear
            className="rounded-xl"
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
          }}
          size="middle"
        />
      </Card>

      {/* Bill Receipt Modal */}
      <Modal
        title={<span className="font-black text-slate-900">Official Dining Invoice</span>}
        open={receiptModalOpen}
        onCancel={() => setReceiptModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setReceiptModalOpen(false)} className="rounded-xl">
            Close
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={printReceipt}
            className="rounded-xl font-semibold"
            style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
          >
            Print Tax Invoice
          </Button>,
        ]}
      >
        {selectedOrder && (
          <div className="p-2 space-y-4 text-xs font-mono">
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="font-black text-base uppercase text-slate-800">TAX INVOICE</h2>
              <p className="text-slate-400 text-[11px]">Order #{selectedOrder.orderNumber}</p>
              <p className="text-slate-500 text-[11px] mt-1">
                {formatDateTime(selectedOrder.createdAt)} • Table {selectedOrder.table?.number || '-'}
              </p>
            </div>

            <div className="space-y-2 py-2">
              {selectedOrder.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-slate-800">
                  <span>
                    {it.quantity}× {it.name}
                  </span>
                  <span>₹{it.subtotal}</span>
                </div>
              ))}
            </div>

            <Divider className="my-2 border-dashed" />

            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span>₹{selectedOrder.subtotal}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({selectedOrder.couponCode || 'Promo'}):</span>
                  <span>-₹{selectedOrder.discountAmount}</span>
                </div>
              )}
              {selectedOrder.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({selectedOrder.taxRate}%):</span>
                  <span>₹{selectedOrder.taxAmount}</span>
                </div>
              )}
              {selectedOrder.serviceChargeAmount > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge ({selectedOrder.serviceChargeRate}%):</span>
                  <span>₹{selectedOrder.serviceChargeAmount}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-300 font-black text-sm text-slate-900">
                <span>GRAND TOTAL:</span>
                <span>₹{selectedOrder.grandTotal}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-dashed border-slate-300 text-center text-slate-400 text-[10px]">
              Payment: {selectedOrder.paymentMethod?.toUpperCase()} • Status: {selectedOrder.paymentStatus?.toUpperCase()}
              <br />
              Thank you for dining with us!
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderManagement;

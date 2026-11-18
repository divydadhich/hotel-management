import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  Card,
  Popconfirm,
  DatePicker,
} from 'antd';
import {
  Plus,
  Trash2,
  Percent,
  Tag as TagIcon,
  Calendar,
} from 'lucide-react';
import tenantService from '../../services/tenant.service';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;
const { Option } = Select;

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await tenantService.getCoupons();
      setCoupons(res.data?.coupons || []);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async () => {
    try {
      const values = await form.validateFields();
      await tenantService.createCoupon({
        ...values,
        code: values.code.toUpperCase().trim(),
        validUntil: values.validUntil ? values.validUntil.toISOString() : null,
      });
      toast.success(`Coupon ${values.code} created`);
      setModalOpen(false);
      form.resetFields();
      loadCoupons();
    } catch {
      // validation error
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      await tenantService.deleteCoupon(id);
      toast.success('Coupon removed');
      loadCoupons();
    } catch {
      toast.error('Failed to remove coupon');
    }
  };

  const columns = [
    {
      title: 'Coupon Code',
      dataIndex: 'code',
      key: 'code',
      render: (code) => (
        <span className="font-mono font-bold text-xs bg-purple-50 text-purple-700 border border-purple-200/80 px-2.5 py-1 rounded inline-block">
          {code}
        </span>
      ),
    },
    {
      title: 'Discount Value',
      key: 'discount',
      render: (_, r) => (
        <span className="font-semibold text-slate-900 text-xs font-mono">
          {r.discountType === 'percentage' ? `${r.discountValue}% OFF` : `₹${r.discountValue} Flat OFF`}
        </span>
      ),
    },
    {
      title: 'Min Order',
      dataIndex: 'minOrderAmount',
      key: 'minOrder',
      render: (min) => <span className="text-slate-600 text-xs font-mono">{min > 0 ? `₹${min}` : 'No minimum'}</span>,
    },
    {
      title: 'Redemption Count',
      key: 'usage',
      render: (_, r) => (
        <span className="text-slate-600 text-xs font-mono">
          {r.usedCount} redemptions {r.usageLimit ? `/ ${r.usageLimit} max` : '(Unlimited)'}
        </span>
      ),
    },
    {
      title: 'Valid Through',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (vu) => <span className="text-slate-500 text-xs">{vu ? formatDate(vu) : 'Never expires'}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (act) => (
        <Tag color={act ? 'success' : 'default'} className="rounded text-[10px] uppercase font-semibold">
          {act ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, r) => (
        <Popconfirm
          title="Delete this promotional coupon?"
          onConfirm={() => handleDeleteCoupon(r._id)}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger icon={<Trash2 size={13} strokeWidth={2} />} className="rounded" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <Title level={4} className="!mb-0.5 !font-bold !text-slate-900 !tracking-tight">
            Promotional Coupons & Discounts
          </Title>
          <Text className="text-slate-500 text-xs block">
            Configure percentage discounts, flat bill rebates, minimum cart requirements, and expiry limits
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={14} strokeWidth={2} />}
          onClick={() => {
            form.resetFields();
            setModalOpen(true);
          }}
          className="rounded-lg font-medium text-xs h-9 px-4 shadow-xs"
          style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
        >
          Create Coupon
        </Button>
      </div>

      <Card className="rounded-xl shadow-xs border border-slate-200/80 bg-white">
        <Table
          dataSource={coupons}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={false}
          size="middle"
          locale={{
            emptyText: (
              <EmptyState
                title="No active coupons"
                description="Launch promotional campaigns by configuring discount codes for dining guests."
                action={() => {
                  form.resetFields();
                  setModalOpen(true);
                }}
                actionText="Create Coupon"
                icon={TagIcon}
              />
            ),
          }}
        />
      </Card>

      {/* Coupon Modal */}
      <Modal
        title={<span className="font-semibold text-slate-900 text-sm">Create Promotional Coupon</span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreateCoupon}
        okText="Publish Coupon"
        okButtonProps={{ style: { backgroundColor: '#386b58', borderColor: '#386b58' }, className: 'rounded-lg text-xs font-medium' }}
        cancelButtonProps={{ className: 'rounded-lg text-xs' }}
        width={480}
      >
        <Form form={form} layout="vertical" className="mt-4" requiredMark={false}>
          <Form.Item
            name="code"
            label={<span className="text-xs font-medium text-slate-700">Coupon Promo Code</span>}
            rules={[{ required: true, message: 'Please enter uppercase code (e.g. FESTIVE20)' }]}
          >
            <Input placeholder="e.g. WELCOME10" className="uppercase font-mono rounded-lg text-xs" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="discountType"
              label={<span className="text-xs font-medium text-slate-700">Discount Logic</span>}
              initialValue="percentage"
              rules={[{ required: true }]}
            >
              <Select className="rounded-lg text-xs">
                <Option value="percentage">Percentage (%)</Option>
                <Option value="fixed">Fixed Amount (₹)</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="discountValue"
              label={<span className="text-xs font-medium text-slate-700">Discount Value</span>}
              rules={[{ required: true }]}
            >
              <InputNumber min={1} className="w-full rounded-lg text-xs" placeholder="e.g. 15" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="minOrderAmount"
              label={<span className="text-xs font-medium text-slate-700">Minimum Bill (₹)</span>}
              initialValue={0}
            >
              <InputNumber min={0} className="w-full rounded-lg text-xs" placeholder="0 = No limit" />
            </Form.Item>
            <Form.Item
              name="maxDiscountAmount"
              label={<span className="text-xs font-medium text-slate-700">Cap Max Discount (₹)</span>}
            >
              <InputNumber min={1} className="w-full rounded-lg text-xs" placeholder="Optional cap" />
            </Form.Item>
          </div>
          <Form.Item
            name="validUntil"
            label={<span className="text-xs font-medium text-slate-700">Expiry Date (Optional)</span>}
          >
            <DatePicker className="w-full rounded-lg text-xs" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CouponManagement;

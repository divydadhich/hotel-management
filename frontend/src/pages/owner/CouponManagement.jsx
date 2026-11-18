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
import { PlusOutlined, DeleteOutlined, PercentageOutlined } from '@ant-design/icons';
import tenantService from '../../services/tenant.service';
import { formatDate } from '../../utils/formatters';
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
      toast.success(`Coupon ${values.code} created!`);
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
      render: (code) => <Tag color="purple" className="font-mono font-bold text-sm px-2.5 py-0.5">{code}</Tag>,
    },
    {
      title: 'Discount Value',
      key: 'discount',
      render: (_, r) => (
        <span className="font-bold text-slate-800 text-xs">
          {r.discountType === 'percentage' ? `${r.discountValue}% OFF` : `₹${r.discountValue} Flat OFF`}
        </span>
      ),
    },
    {
      title: 'Min Order',
      dataIndex: 'minOrderAmount',
      key: 'minOrder',
      render: (min) => <span className="text-slate-600 text-xs">{min > 0 ? `₹${min}` : 'No minimum'}</span>,
    },
    {
      title: 'Usage / Limit',
      key: 'usage',
      render: (_, r) => (
        <span className="text-slate-600 text-xs">
          {r.usedCount} used {r.usageLimit ? `/ ${r.usageLimit} max` : '(Unlimited)'}
        </span>
      ),
    },
    {
      title: 'Expiration',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (d) => <span className="text-slate-500 text-xs">{d ? formatDate(d) : 'Never expires'}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Popconfirm
          title="Delete this promotional coupon?"
          onConfirm={() => handleDeleteCoupon(r._id)}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger icon={<DeleteOutlined />} className="rounded-lg text-xs" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <Title level={4} className="!mb-0 !font-extrabold !text-slate-900">
            Promotional Coupons & Discounts
          </Title>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            Run festival discounts, customer loyalty codes, and automated cart savings
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setModalOpen(true);
          }}
          className="rounded-xl font-semibold shadow-sm"
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
        >
          Create Coupon
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100">
        <Table
          dataSource={coupons}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>

      <Modal
        title="Create Promotional Coupon"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreateCoupon}
        okText="Create Promo Code"
      >
        <Form form={form} layout="vertical" className="mt-4" requiredMark={false}>
          <Form.Item
            name="code"
            label="Coupon Code (e.g. WELCOME20)"
            rules={[{ required: true }]}
          >
            <Input placeholder="FESTIVAL15" className="rounded-xl font-mono uppercase" />
          </Form.Item>
          <Form.Item
            name="discountType"
            label="Discount Type"
            initialValue="percentage"
            rules={[{ required: true }]}
          >
            <Select className="rounded-xl">
              <Option value="percentage">Percentage Discount (%)</Option>
              <Option value="fixed">Fixed Rupee Discount (₹)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="discountValue"
            label="Discount Amount / Percentage"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} className="w-full rounded-xl" placeholder="e.g. 15 for 15% or 100 for ₹100" />
          </Form.Item>
          <Form.Item name="minOrderAmount" label="Minimum Cart Value (₹)" initialValue={0}>
            <InputNumber min={0} className="w-full rounded-xl" />
          </Form.Item>
          <Form.Item name="maxDiscount" label="Maximum Discount Cap (₹ - optional)">
            <InputNumber min={1} className="w-full rounded-xl" />
          </Form.Item>
          <Form.Item name="usageLimit" label="Overall Usage Limit (optional)">
            <InputNumber min={1} className="w-full rounded-xl" placeholder="Leave empty for unlimited" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CouponManagement;

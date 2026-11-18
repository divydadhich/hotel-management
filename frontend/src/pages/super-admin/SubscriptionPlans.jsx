import { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge, Typography, Modal, Form, Input, InputNumber, Switch } from 'antd';
import {
  Crown,
  Plus,
  Pencil,
  Check,
  CheckCircle2,
} from 'lucide-react';
import tenantService from '../../services/tenant.service';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form] = Form.useForm();

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await tenantService.getPlans();
      setPlans(res.data?.plans || []);
    } catch {
      toast.error('Failed to load plans');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openModal = (plan = null) => {
    setEditingPlan(plan);
    if (plan) {
      form.setFieldsValue({
        ...plan,
        features: plan.features?.join('\n'),
      });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        features: values.features ? values.features.split('\n').filter(Boolean) : [],
      };
      if (editingPlan) {
        await tenantService.updatePlan(editingPlan._id, payload);
        toast.success('Subscription plan updated');
      } else {
        await tenantService.createPlan(payload);
        toast.success('New plan added');
      }
      setModalOpen(false);
      fetchPlans();
    } catch {
      // validation error
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <Title level={4} className="!mb-0.5 !font-bold !text-slate-900 !tracking-tight">
            SaaS Subscription Tiers & Quotas
          </Title>
          <Text className="text-slate-500 text-xs block">
            Configure monthly & annual pricing, table allocations, and automated tenant feature gates
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={14} strokeWidth={2} />}
          onClick={() => openModal()}
          className="rounded-lg font-medium text-xs h-9 px-4 shadow-xs"
          style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
        >
          Add New Plan
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {plans.map((plan) => (
          <Col xs={24} md={8} key={plan._id}>
            <div className={`rounded-xl border p-5 bg-white h-full flex flex-col justify-between shadow-2xs relative ${plan.isPopular ? 'border-emerald-600/70 ring-1 ring-emerald-600/30' : 'border-slate-200/80'}`}>
              {plan.isPopular && (
                <div className="absolute -top-2.5 right-4 bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Popular Choice
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {plan.trialDays ? `${plan.trialDays}d trial` : 'No trial'}
                  </span>
                </div>
                <p className="text-slate-500 text-xs mb-4 min-h-[36px]">{plan.description}</p>

                <div className="mb-5 pb-4 border-b border-slate-100 font-mono">
                  <span className="text-2xl font-bold text-slate-900">₹{plan.monthlyPrice}</span>
                  <span className="text-slate-400 text-xs font-sans"> / month</span>
                  {plan.yearlyPrice && (
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      or ₹{plan.yearlyPrice} / year
                    </span>
                  )}
                </div>

                {/* Limits */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-sans">Max Tables:</span>
                    <strong className="text-slate-800">{plan.limits?.maxTables || 'Unlimited'}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-sans">Staff Accounts:</span>
                    <strong className="text-slate-800">{plan.limits?.maxStaff || 'Unlimited'}</strong>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 mb-4">
                  {plan.features?.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check size={13} strokeWidth={2.5} className="text-emerald-700 mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Button
                  block
                  icon={<Pencil size={13} strokeWidth={2} />}
                  onClick={() => openModal(plan)}
                  className="rounded-lg text-xs font-medium h-9 border-slate-200 text-slate-700"
                >
                  Edit Configuration
                </Button>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Plan Modal */}
      <Modal
        title={<span className="font-semibold text-slate-900 text-sm">{editingPlan ? 'Edit SaaS Tier' : 'Create Subscription Tier'}</span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editingPlan ? 'Save Changes' : 'Create Plan'}
        okButtonProps={{ style: { backgroundColor: '#386b58', borderColor: '#386b58' }, className: 'rounded-lg text-xs font-medium' }}
        cancelButtonProps={{ className: 'rounded-lg text-xs' }}
        width={500}
      >
        <Form form={form} layout="vertical" className="mt-4" requiredMark={false}>
          <Form.Item name="name" label={<span className="text-xs font-medium text-slate-700">Tier Name</span>} rules={[{ required: true }]}>
            <Input placeholder="e.g. Starter Cafe, Pro Dining, Enterprise" className="rounded-lg text-xs" />
          </Form.Item>
          <Form.Item name="slug" label={<span className="text-xs font-medium text-slate-700">Machine Slug</span>} rules={[{ required: true }]}>
            <Input placeholder="e.g. starter, pro, enterprise" className="rounded-lg text-xs font-mono" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="monthlyPrice" label={<span className="text-xs font-medium text-slate-700">Monthly Cost (₹)</span>} rules={[{ required: true }]}>
              <InputNumber min={0} className="w-full rounded-lg text-xs" />
            </Form.Item>
            <Form.Item name="yearlyPrice" label={<span className="text-xs font-medium text-slate-700">Yearly Cost (₹)</span>}>
              <InputNumber min={0} className="w-full rounded-lg text-xs" />
            </Form.Item>
          </div>
          <Form.Item name="description" label={<span className="text-xs font-medium text-slate-700">Tier Description</span>}>
            <Input.TextArea rows={2} placeholder="Target customer persona and overview" className="rounded-lg text-xs" />
          </Form.Item>
          <Form.Item name="features" label={<span className="text-xs font-medium text-slate-700">Included Features (one per line)</span>}>
            <Input.TextArea rows={4} placeholder="Up to 10 Tables&#10;Digital QR Ordering&#10;Kitchen Display System" className="rounded-lg text-xs font-mono" />
          </Form.Item>
          <Form.Item name="isPopular" label={<span className="text-xs font-medium text-slate-700">Flag as Most Popular</span>} valuePropName="checked">
            <Switch size="small" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubscriptionPlans;

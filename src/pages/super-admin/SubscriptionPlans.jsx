import { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge, Typography, Modal, Form, Input, InputNumber, Switch } from 'antd';
import { PlusOutlined, EditOutlined, CheckOutlined, CrownOutlined } from '@ant-design/icons';
import tenantService from '../../services/tenant.service';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <Title level={4} className="!mb-0 !font-extrabold !text-slate-900">
            SaaS Subscription Plans
          </Title>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            Configure pricing tiers, table quotas, feature availability and limits for tenant businesses
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
          className="rounded-xl font-semibold shadow-sm"
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
        >
          Add New Plan
        </Button>
      </div>

      <Row gutter={[20, 20]}>
        {plans.map((plan) => (
          <Col xs={24} md={8} key={plan._id}>
            <Badge.Ribbon text={plan.isPopular ? 'Most Popular' : ''} color="#6366f1">
              <Card
                className="rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between"
                actions={[
                  <Button
                    key="edit"
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => openModal(plan)}
                    className="font-semibold text-xs text-indigo-600"
                  >
                    Edit Plan Settings
                  </Button>,
                ]}
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-base shadow-sm"
                      style={{ backgroundColor: plan.color || '#6366f1' }}
                    >
                      <CrownOutlined />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{plan.name}</h3>
                      <span className="text-[11px] text-slate-400 font-mono">tier: {plan.slug}</span>
                    </div>
                  </div>

                  <p className="text-slate-500 text-xs mb-6 min-h-[32px]">{plan.description}</p>

                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">₹{plan.monthlyPrice}</span>
                      <span className="text-slate-500 text-xs font-medium">/month</span>
                    </div>
                    {plan.trialDays > 0 && (
                      <span className="inline-block mt-1 text-emerald-600 text-[11px] font-bold">
                        ✓ {plan.trialDays} days full-access free trial
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 mb-6">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Features & Entitlements</p>
                    {plan.features?.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckOutlined className="text-emerald-500 flex-shrink-0 text-[10px]" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Quota: <strong>{plan.limits?.maxTables === -1 ? 'Unlimited' : `${plan.limits?.maxTables} Tables`}</strong></span>
                  <span className={plan.isActive ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                    ● {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>

      <Modal
        title={editingPlan ? 'Edit Subscription Tier' : 'Create New Subscription Tier'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editingPlan ? 'Update Plan' : 'Save Plan'}
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-4" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="name" label="Plan Display Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Pro Platinum" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="slug" label="Identifier Slug" rules={[{ required: true }]}>
                <Input placeholder="pro-platinum" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="monthlyPrice" label="Monthly Fee (₹)" rules={[{ required: true }]}>
                <InputNumber min={0} className="w-full rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="trialDays" label="Free Trial Days">
                <InputNumber min={0} className="w-full rounded-xl" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Short Marketing Description">
            <Input.TextArea rows={2} className="rounded-xl" />
          </Form.Item>
          <Form.Item name="features" label="Features List (one feature per line)">
            <Input.TextArea rows={4} placeholder="20 Tables&#10;Online Payments&#10;Kitchen Display System" className="rounded-xl" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name={['limits', 'maxTables']} label="Max Tables (-1 = unlimited)">
                <InputNumber min={-1} className="w-full rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['limits', 'maxStaff']} label="Max Staff (-1 = unlimited)">
                <InputNumber min={-1} className="w-full rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['limits', 'maxMenuItems']} label="Max Menu Items">
                <InputNumber min={-1} className="w-full rounded-xl" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isPopular" label="Highlight as Popular" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubscriptionPlans;

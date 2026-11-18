import { useState, useEffect } from 'react';
import { Steps, Card, Form, Input, Button, Select, Typography, Row, Col, Divider, Tag } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createTenant } from '../../store/slices/tenantSlice';
import tenantService from '../../services/tenant.service';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;
const { Option } = Select;

const TenantCreate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const res = await tenantService.getPlans();
        setPlans(res.data?.plans || []);
        if (res.data?.plans?.length > 0) {
          form.setFieldsValue({ planId: res.data.plans[0]._id });
        }
      } catch (err) {
        toast.error('Failed to load subscription plans');
      }
      setLoadingPlans(false);
    };
    fetchPlans();
  }, [form]);

  const steps = [
    { title: 'Business Info', description: 'Name, Slug & Address' },
    { title: 'Owner Account', description: 'Admin Login Credentials' },
    { title: 'Subscription Plan', description: 'Select Tier & Limits' },
    { title: 'Confirm & Provision', description: 'Instant Setup' },
  ];

  const nextStep = async () => {
    try {
      const values = await form.validateFields();
      setFormData((prev) => ({ ...prev, ...values }));
      setCurrentStep((s) => s + 1);
    } catch {
      // Validation error
    }
  };

  const prevStep = () => setCurrentStep((s) => s - 1);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        tenantData: {
          name: formData.name,
          slug: formData.slug.toLowerCase().trim(),
          email: formData.businessEmail,
          phone: formData.businessPhone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country || 'India',
          businessType: formData.businessType || 'restaurant',
          welcomeMessage: `Welcome to ${formData.name}! Browse menu & place your order.`,
        },
        ownerData: {
          name: formData.ownerName,
          email: formData.ownerEmail,
          password: formData.ownerPassword,
          phone: formData.ownerPhone,
        },
        planId: formData.planId,
      };

      const result = await dispatch(createTenant(payload));
      if (createTenant.fulfilled.match(result)) {
        toast.success(`Business ${formData.name} successfully onboarded!`);
        navigate('/super/tenants');
      } else {
        toast.error(result.payload || 'Failed to onboard business');
      }
    } catch {
      toast.error('Something went wrong during onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlan = plans.find((p) => p._id === (formData.planId || form.getFieldValue('planId')));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/super/tenants')}
          shape="circle"
        />
        <div>
          <Title level={4} className="!mb-0 !font-extrabold !text-slate-900">
            Onboard New Business
          </Title>
          <Text className="text-slate-500 text-xs">
            Create an isolated multi-tenant environment with dedicated menu, staff, and branding
          </Text>
        </div>
      </div>

      <Card className="rounded-3xl shadow-sm border border-slate-100 p-2 sm:p-6">
        <Steps current={currentStep} items={steps} className="mb-8" />

        <Form form={form} layout="vertical" requiredMark={false} size="large">
          {currentStep === 0 && (
            <div className="space-y-4">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="name"
                    label={<span className="font-semibold text-slate-700 text-xs uppercase">Business / Hotel Name</span>}
                    rules={[{ required: true, message: 'Please enter business name' }]}
                  >
                    <Input
                      placeholder="e.g. Grand Horizon Hotel & Bistro"
                      className="rounded-xl"
                      onChange={(e) => {
                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        form.setFieldsValue({ slug });
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="slug"
                    label={<span className="font-semibold text-slate-700 text-xs uppercase">URL Slug (Unique Domain Path)</span>}
                    rules={[
                      { required: true, message: 'Please provide slug' },
                      { pattern: /^[a-z0-9-]+$/, message: 'Only lowercase letters, numbers, and hyphens' },
                    ]}
                  >
                    <Input
                      placeholder="grand-horizon"
                      addonBefore="app.com/menu/"
                      className="rounded-xl font-mono text-xs"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="businessEmail"
                    label={<span className="font-semibold text-slate-700 text-xs uppercase">Official Business Email</span>}
                    rules={[
                      { required: true, message: 'Business email is required' },
                      { type: 'email', message: 'Enter a valid email' },
                    ]}
                  >
                    <Input placeholder="contact@grandhorizon.com" className="rounded-xl" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="businessPhone"
                    label={<span className="font-semibold text-slate-700 text-xs uppercase">Contact Phone</span>}
                  >
                    <Input placeholder="+91 98765 00000" className="rounded-xl" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="businessType"
                    label={<span className="font-semibold text-slate-700 text-xs uppercase">Business Type</span>}
                    initialValue="restaurant"
                  >
                    <Select className="rounded-xl">
                      <Option value="restaurant">Restaurant & Dine-in</Option>
                      <Option value="hotel">Hotel / Resort</Option>
                      <Option value="cafe">Cafe / Bakery</Option>
                      <Option value="bar">Bar & Brewery</Option>
                      <Option value="other">Food Court / Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="city"
                    label={<span className="font-semibold text-slate-700 text-xs uppercase">City</span>}
                  >
                    <Input placeholder="Mumbai" className="rounded-xl" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="state"
                    label={<span className="font-semibold text-slate-700 text-xs uppercase">State</span>}
                  >
                    <Input placeholder="Maharashtra" className="rounded-xl" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="address"
                    label={<span className="font-semibold text-slate-700 text-xs uppercase">Full Address</span>}
                  >
                    <Input.TextArea placeholder="Plot 42, Bandra West, Seaface Avenue" rows={2} className="rounded-xl" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="ownerName"
                    label={<span className="font-semibold text-slate-700 text-xs uppercase">Owner Full Name</span>}
                    rules={[{ required: true, message: 'Please enter owner name' }]}
                  >
                    <Input placeholder="Ananya Sharma" className="rounded-xl" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="ownerEmail"
                    label={<span className="font-semibold text-slate-700 text-xs uppercase">Owner Login Email</span>}
                    rules={[
                      { required: true, message: 'Owner email is required' },
                      { type: 'email', message: 'Enter a valid email' },
                    ]}
                  >
                    <Input placeholder="owner@grandhorizon.com" className="rounded-xl" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="ownerPassword"
                    label={<span className="font-semibold text-slate-700 text-xs uppercase">Account Password</span>}
                    rules={[
                      { required: true, message: 'Password is required' },
                      { min: 8, message: 'Password must be at least 8 characters' },
                    ]}
                  >
                    <Input.Password placeholder="••••••••" className="rounded-xl" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="ownerPhone"
                    label={<span className="font-semibold text-slate-700 text-xs uppercase">Owner Mobile</span>}
                  >
                    <Input placeholder="+91 98765 11111" className="rounded-xl" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <Form.Item
                name="planId"
                label={<span className="font-semibold text-slate-700 text-xs uppercase">Choose Subscription Plan</span>}
                rules={[{ required: true, message: 'Please select a plan' }]}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((p) => {
                    const isSelected = (formData.planId || form.getFieldValue('planId')) === p._id;
                    return (
                      <div
                        key={p._id}
                        onClick={() => {
                          form.setFieldsValue({ planId: p._id });
                          setFormData((prev) => ({ ...prev, planId: p._id }));
                        }}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20'
                            : 'border-slate-200 hover:border-indigo-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-extrabold text-slate-800 text-base">{p.name}</span>
                          {p.isPopular && <Tag color="purple">Popular</Tag>}
                        </div>
                        <div className="text-2xl font-black text-slate-900 mb-2">
                          ₹{p.monthlyPrice}
                          <span className="text-slate-400 text-xs font-normal"> /mo</span>
                        </div>
                        <p className="text-slate-500 text-xs mb-3">{p.description}</p>
                        <ul className="space-y-1 text-xs text-slate-600">
                          {p.features?.slice(0, 4).map((f, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <CheckCircleOutlined className="text-emerald-500 text-[11px]" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </Form.Item>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <Title level={5} className="!mb-3 !text-slate-800">
                  Onboarding Summary
                </Title>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase">Business Name</span>
                    <span className="font-bold text-slate-800 text-sm">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase">Customer Menu URL</span>
                    <span className="font-mono text-indigo-600 font-bold">/menu/{formData.slug}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase">Owner Account</span>
                    <span className="font-bold text-slate-800">{formData.ownerName} ({formData.ownerEmail})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase">Selected Tier</span>
                    <span className="font-bold text-emerald-600">{selectedPlan?.name || 'Selected Plan'} (₹{selectedPlan?.monthlyPrice}/mo)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Divider />

          <div className="flex justify-between items-center">
            <Button disabled={currentStep === 0} onClick={prevStep} className="rounded-xl">
              Back
            </Button>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/super/tenants')} className="rounded-xl">
                Cancel
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button
                  type="primary"
                  onClick={nextStep}
                  className="rounded-xl font-semibold shadow-sm"
                  style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={submitting}
                  className="rounded-xl font-bold shadow-md shadow-emerald-500/20"
                  style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                >
                  Provision & Launch Tenant
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default TenantCreate;

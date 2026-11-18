import { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  InputNumber,
  Switch,
  Divider,
} from 'antd';
import { SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import tenantService from '../../services/tenant.service';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

const BusinessProfile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await tenantService.getMyTenantProfile();
        const t = res.data?.tenant;
        setTenant(t);
        if (t) {
          form.setFieldsValue({
            name: t.name,
            email: t.email,
            phone: t.phone,
            address: t.address,
            city: t.city,
            state: t.state,
            country: t.country,
            gstNumber: t.gstNumber,
            primaryColor: t.primaryColor || '#dc2626',
            secondaryColor: t.secondaryColor || '#991b1b',
            welcomeMessage: t.welcomeMessage,
            description: t.description,
            logo: t.logo,
            coverImage: t.coverImage,
          });
        }
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [form]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      await tenantService.updateMyTenantProfile(values);
      toast.success('Branding & Business Settings updated successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={4} className="!mb-0 !font-extrabold !text-slate-900">
            Business Profile & White-Label Branding
          </Title>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            Customize your brand identity, colors, logo, and digital menu appearance for customers
          </Text>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          className="rounded-xl font-bold shadow-sm"
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
        >
          Save All Changes
        </Button>
      </div>

      <Form form={form} layout="vertical" requiredMark={false} size="large">
        {/* Core Info */}
        <Card title={<span className="font-bold text-slate-800 text-sm">Restaurant Profile</span>} className="rounded-2xl shadow-sm border border-slate-100 mb-6">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="Business Display Name" rules={[{ required: true }]}>
                <Input placeholder="Royal Palace Restaurant" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="Contact Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="owner@royalpalace.com" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label="Phone Number">
                <Input placeholder="+91 98765 43210" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="gstNumber" label="GST / Tax Identification">
                <Input placeholder="07AAAAA0000A1Z5" className="rounded-xl uppercase font-mono" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="city" label="City">
                <Input placeholder="New Delhi" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="state" label="State">
                <Input placeholder="Delhi" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="country" label="Country" initialValue="India">
                <Input className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address" label="Physical Address">
                <Input.TextArea rows={2} placeholder="123 MG Road, Connaught Place" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Restaurant Tagline / Description">
                <Input.TextArea rows={2} placeholder="Authentic Indian royal dining & sizzler bar" className="rounded-xl" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Dynamic Brand Customization */}
        <Card title={<span className="font-bold text-slate-800 text-sm">Brand Colors & Visual Identity</span>} className="rounded-2xl shadow-sm border border-slate-100 mb-6">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="primaryColor" label="Primary Accent Color">
                <div className="flex items-center gap-3">
                  <Input type="color" className="w-16 h-12 p-1 rounded-xl cursor-pointer" />
                  <Input placeholder="#dc2626" className="rounded-xl font-mono" />
                </div>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="secondaryColor" label="Secondary Brand Color">
                <div className="flex items-center gap-3">
                  <Input type="color" className="w-16 h-12 p-1 rounded-xl cursor-pointer" />
                  <Input placeholder="#991b1b" className="rounded-xl font-mono" />
                </div>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="welcomeMessage" label="Guest Digital Welcome Message">
                <Input.TextArea rows={2} placeholder="Welcome to Royal Palace! Scan, Browse & Order." className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="logo" label="Logo Image URL">
                <Input placeholder="https://example.com/logo.png" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="coverImage" label="Header Cover Banner Image URL">
                <Input placeholder="https://example.com/cover.jpg" className="rounded-xl" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

export default BusinessProfile;

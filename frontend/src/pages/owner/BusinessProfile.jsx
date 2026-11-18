import { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  Save,
  Building,
  Palette,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Check,
} from 'lucide-react';
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
            primaryColor: t.primaryColor || '#386b58',
            secondaryColor: t.secondaryColor || '#8b5cf6',
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
      toast.success('Property settings and branding updated');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <Title level={4} className="!mb-0.5 !font-bold !text-slate-900 !tracking-tight">
            Property Branding & White-Label Config
          </Title>
          <Text className="text-slate-500 text-xs block">
            Configure hotel/restaurant identity, contact information, GST registration, and customer menu colorways
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Save size={14} strokeWidth={2} />}
          loading={saving}
          onClick={handleSave}
          className="rounded-lg font-medium text-xs h-9 px-4 shadow-xs"
          style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
        >
          Save Changes
        </Button>
      </div>

      <Form form={form} layout="vertical" requiredMark={false}>
        {/* Core Profile */}
        <Card
          title={
            <div className="flex items-center gap-2 py-1 text-slate-900 font-semibold text-xs uppercase tracking-wider">
              <Building size={15} strokeWidth={2} className="text-slate-500" />
              <span>Core Business Profile</span>
            </div>
          }
          className="rounded-xl shadow-xs border border-slate-200/80 bg-white mb-6"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label={<span className="text-xs font-medium text-slate-700">Business Display Name</span>} rules={[{ required: true }]}>
                <Input placeholder="e.g. Royal Palace Restaurant" className="rounded-lg text-xs" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label={<span className="text-xs font-medium text-slate-700">Public Contact Email</span>} rules={[{ type: 'email' }]}>
                <Input placeholder="contact@royalpalace.com" className="rounded-lg text-xs font-mono" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label={<span className="text-xs font-medium text-slate-700">Phone Number</span>}>
                <Input placeholder="+91 98765 43210" className="rounded-lg text-xs font-mono" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="gstNumber" label={<span className="text-xs font-medium text-slate-700">GST Registration Number</span>}>
                <Input placeholder="07AAAAA0000A1Z5" className="rounded-lg text-xs font-mono uppercase" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="address" label={<span className="text-xs font-medium text-slate-700">Physical Address</span>}>
                <Input placeholder="Plot 12, Civil Lines, Near City Palace" className="rounded-lg text-xs" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="city" label={<span className="text-xs font-medium text-slate-700">City</span>}>
                <Input placeholder="Jaipur" className="rounded-lg text-xs" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="state" label={<span className="text-xs font-medium text-slate-700">State</span>}>
                <Input placeholder="Rajasthan" className="rounded-lg text-xs" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="country" label={<span className="text-xs font-medium text-slate-700">Country</span>} initialValue="India">
                <Input className="rounded-lg text-xs" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="description" label={<span className="text-xs font-medium text-slate-700">Property Description</span>}>
                <Input.TextArea rows={2} placeholder="Fine dining experience featuring traditional and modern fusion delicacies..." className="rounded-lg text-xs" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Branding & Theme */}
        <Card
          title={
            <div className="flex items-center gap-2 py-1 text-slate-900 font-semibold text-xs uppercase tracking-wider">
              <Palette size={15} strokeWidth={2} className="text-slate-500" />
              <span>Digital Menu White-Label Customization</span>
            </div>
          }
          className="rounded-xl shadow-xs border border-slate-200/80 bg-white"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="welcomeMessage" label={<span className="text-xs font-medium text-slate-700">Guest Welcome Greeting</span>}>
                <Input placeholder="Welcome! Scan to place your table order." className="rounded-lg text-xs" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="primaryColor" label={<span className="text-xs font-medium text-slate-700">Brand Primary Color</span>}>
                <div className="flex items-center gap-2">
                  <Input type="color" className="w-12 h-9 p-0.5 rounded cursor-pointer" />
                  <Input placeholder="#386b58" className="rounded-lg text-xs font-mono" />
                </div>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="secondaryColor" label={<span className="text-xs font-medium text-slate-700">Accent Tone</span>}>
                <div className="flex items-center gap-2">
                  <Input type="color" className="w-12 h-9 p-0.5 rounded cursor-pointer" />
                  <Input placeholder="#8b5cf6" className="rounded-lg text-xs font-mono" />
                </div>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="logo" label={<span className="text-xs font-medium text-slate-700">Brand Logo URL</span>}>
                <Input placeholder="https://cdn.example.com/logo.png" className="rounded-lg text-xs font-mono" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="coverImage" label={<span className="text-xs font-medium text-slate-700">Header Cover Banner URL</span>}>
                <Input placeholder="https://cdn.example.com/banner.jpg" className="rounded-lg text-xs font-mono" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

export default BusinessProfile;

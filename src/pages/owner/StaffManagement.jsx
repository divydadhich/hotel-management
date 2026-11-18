import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Card,
  Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import tenantService from '../../services/tenant.service';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;
const { Option } = Select;

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await tenantService.getStaff();
      setStaff(res.data?.staff || []);
    } catch {
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async () => {
    try {
      const values = await form.validateFields();
      await tenantService.createStaff(values);
      toast.success(`Staff account for ${values.name} created!`);
      setModalOpen(false);
      form.resetFields();
      loadStaff();
    } catch {
      // validation error
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      await tenantService.deleteStaff(id);
      toast.success('Staff account removed');
      loadStaff();
    } catch {
      toast.error('Failed to remove staff account');
    }
  };

  const columns = [
    {
      title: 'Staff Member',
      dataIndex: 'name',
      key: 'name',
      render: (name, r) => (
        <div>
          <span className="font-bold text-slate-800 text-sm block">{name}</span>
          <span className="text-slate-400 text-xs">{r.email}</span>
        </div>
      ),
    },
    {
      title: 'Assigned Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'kitchen' ? 'purple' : 'blue'} className="rounded-md capitalize text-xs">
          {role === 'kitchen' ? '👨‍🍳 Kitchen Staff' : '🛎️ Receptionist / Cashier'}
        </Tag>
      ),
    },
    {
      title: 'Mobile Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (p) => <span className="text-slate-600 text-xs">{p || '-'}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (act) => (
        <Tag color={act ? 'green' : 'default'} className="rounded-md text-xs">
          {act ? 'Active' : 'Deactivated'}
        </Tag>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => <span className="text-slate-500 text-xs">{formatDate(d)}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Popconfirm
          title="Remove this staff account?"
          onConfirm={() => handleDeleteStaff(r._id)}
          okText="Remove"
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
            Staff & Employee Accounts
          </Title>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            Provision dedicated credentials for your reception desk and kitchen displays
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
          Add Staff Member
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100">
        <Table
          dataSource={staff}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>

      <Modal
        title="Add Staff Member"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreateStaff}
        okText="Create Account"
      >
        <Form form={form} layout="vertical" className="mt-4" requiredMark={false}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Ramesh Kumar" className="rounded-xl" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Login Email"
            rules={[{ required: true }, { type: 'email' }]}
          >
            <Input placeholder="ramesh@royalpalace.com" className="rounded-xl" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Initial Password"
            rules={[{ required: true }, { min: 8 }]}
          >
            <Input.Password placeholder="Min 8 characters" className="rounded-xl" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Assigned Department Role"
            rules={[{ required: true }]}
            initialValue="receptionist"
          >
            <Select className="rounded-xl">
              <Option value="receptionist">🛎️ Receptionist / Order Manager</Option>
              <Option value="kitchen">👨‍🍳 Kitchen Staff (KDS Display)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="Mobile Phone">
            <Input placeholder="+91 98765 00000" className="rounded-xl" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffManagement;

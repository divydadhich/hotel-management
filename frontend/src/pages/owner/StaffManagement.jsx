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
import {
  Plus,
  Trash2,
  Users,
  ShieldCheck,
  Mail,
  Phone,
  KeyRound,
} from 'lucide-react';
import tenantService from '../../services/tenant.service';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
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
      toast.success(`Staff account for ${values.name} provisioned`);
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
      toast.success('Staff account deactivated');
      loadStaff();
    } catch {
      toast.error('Failed to remove staff account');
    }
  };

  const columns = [
    {
      title: 'Employee Name & Email',
      dataIndex: 'name',
      key: 'name',
      render: (name, r) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{name}</span>
          <span className="text-slate-400 text-[11px] font-mono">{r.email}</span>
        </div>
      ),
    },
    {
      title: 'Department Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag
          color={role === 'kitchen' ? 'purple' : 'blue'}
          className="rounded text-[11px] font-medium capitalize"
        >
          {role === 'kitchen' ? 'Kitchen Display' : 'Front Desk / Cashier'}
        </Tag>
      ),
    },
    {
      title: 'Contact Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (p) => <span className="text-slate-600 text-xs font-mono">{p || '-'}</span>,
    },
    {
      title: 'Access State',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (act) => (
        <Tag color={act ? 'success' : 'default'} className="rounded text-[10px] uppercase font-semibold">
          {act ? 'Active' : 'Deactivated'}
        </Tag>
      ),
    },
    {
      title: 'Enrolled On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => <span className="text-slate-500 text-xs">{formatDate(d)}</span>,
    },
    {
      title: 'Action',
      key: 'actions',
      align: 'right',
      render: (_, r) => (
        <Popconfirm
          title="Deactivate this staff account?"
          description="They will no longer be able to log in to their assigned portal."
          onConfirm={() => handleDeleteStaff(r._id)}
          okText="Deactivate"
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
            Staff & Employee Roster
          </Title>
          <Text className="text-slate-500 text-xs block">
            Manage granular credentials for receptionists, cashier desks, and kitchen display terminals
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
          Add Staff Member
        </Button>
      </div>

      <Card className="rounded-xl shadow-xs border border-slate-200/80 bg-white">
        <Table
          dataSource={staff}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={false}
          size="middle"
          locale={{
            emptyText: (
              <EmptyState
                title="No staff members registered"
                description="Create staff logins for your front desk managers and kitchen chefs."
                action={() => {
                  form.resetFields();
                  setModalOpen(true);
                }}
                actionText="Add Staff Member"
                icon={Users}
              />
            ),
          }}
        />
      </Card>

      {/* Provision Staff Modal */}
      <Modal
        title={<span className="font-semibold text-slate-900 text-sm">Provision Staff Account</span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreateStaff}
        okText="Create Account"
        okButtonProps={{ style: { backgroundColor: '#386b58', borderColor: '#386b58' }, className: 'rounded-lg text-xs font-medium' }}
        cancelButtonProps={{ className: 'rounded-lg text-xs' }}
        width={500}
      >
        <Form form={form} layout="vertical" className="mt-4" requiredMark={false}>
          <Form.Item name="name" label={<span className="text-xs font-medium text-slate-700">Full Name</span>} rules={[{ required: true }]}>
            <Input placeholder="e.g. Ramesh Kumar" className="rounded-lg text-xs" />
          </Form.Item>
          <Form.Item
            name="email"
            label={<span className="text-xs font-medium text-slate-700">Login Email</span>}
            rules={[{ required: true }, { type: 'email' }]}
          >
            <Input placeholder="e.g. ramesh@royalpalace.com" className="rounded-lg text-xs font-mono" />
          </Form.Item>
          <Form.Item
            name="password"
            label={<span className="text-xs font-medium text-slate-700">Initial Password</span>}
            rules={[{ required: true }, { min: 8 }]}
          >
            <Input.Password placeholder="At least 8 characters" className="rounded-lg text-xs" />
          </Form.Item>
          <Form.Item
            name="role"
            label={<span className="text-xs font-medium text-slate-700">Assigned Department</span>}
            rules={[{ required: true }]}
            initialValue="receptionist"
          >
            <Select className="rounded-lg text-xs">
              <Option value="receptionist">Receptionist / Front Desk Manager</Option>
              <Option value="kitchen">Kitchen Staff (KDS Display Terminal)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone" label={<span className="text-xs font-medium text-slate-700">Mobile Phone</span>}>
            <Input placeholder="+91 98765 43210" className="rounded-lg text-xs font-mono" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffManagement;

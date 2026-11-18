import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  Space,
  Popconfirm,
  Divider,
} from 'antd';
import {
  Plus,
  QrCode,
  Download,
  Printer,
  RotateCw,
  Trash2,
  Users,
  Eye,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import tenantService from '../../services/tenant.service';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;
const { Option } = Select;

const TableManagement = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [form] = Form.useForm();

  const loadTables = async () => {
    setLoading(true);
    try {
      const res = await tenantService.getTables();
      setTables(res.data?.tables || []);
    } catch {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleCreateTable = async () => {
    try {
      const values = await form.validateFields();
      await tenantService.createTable(values);
      toast.success(`Table ${values.number} created with QR code`);
      setTableModalOpen(false);
      form.resetFields();
      loadTables();
    } catch {
      // validation error
    }
  };

  const handleRegenerateQR = async (id) => {
    try {
      const res = await tenantService.regenerateQR(id);
      toast.success('QR Code regenerated. Previous QR revoked.');
      setSelectedTable(res.data?.table);
      loadTables();
    } catch {
      toast.error('Failed to regenerate QR');
    }
  };

  const handleResetTable = async (id) => {
    try {
      await tenantService.resetTable(id);
      toast.success('Table session cleared and marked Available');
      loadTables();
    } catch {
      toast.error('Failed to reset table');
    }
  };

  const handleDeleteTable = async (id) => {
    try {
      await tenantService.deleteTable(id);
      toast.success('Table removed');
      loadTables();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete table with active orders');
    }
  };

  const downloadQRPNG = (table) => {
    if (!table.qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = table.qrCodeUrl;
    a.download = `QRCode-Table-${table.number}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded QR Code for Table ${table.number}`);
  };

  const printQR = (table) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>QR Standee - Table ${table.number}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 40px 20px; margin: 0; background: #fff; }
            .card { border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 36px 28px; max-width: 320px; margin: 0 auto; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
            h1 { font-size: 22px; font-weight: 800; margin: 0 0 6px 0; color: #0f172a; letter-spacing: -0.02em; }
            p { font-size: 13px; color: #64748b; margin: 0 0 24px 0; line-height: 1.4; }
            .qr-wrap { background: #fafafa; border: 1px solid #f1f5f9; border-radius: 16px; padding: 14px; display: inline-block; margin-bottom: 20px; }
            img { width: 200px; height: 200px; display: block; border-radius: 8px; }
            .table-badge { display: inline-block; background: #386b58; color: #ffffff; font-weight: 700; padding: 7px 22px; border-radius: 999px; font-size: 14px; letter-spacing: 0.02em; }
            .hint { font-size: 11px; color: #94a3b8; margin-top: 22px; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Scan to View Menu</h1>
            <p>Scan with your mobile camera to explore our menu and order directly</p>
            <div class="qr-wrap">
              <img src="${table.qrCodeUrl}" alt="Table ${table.number} QR" />
            </div>
            <div>
              <span class="table-badge">Table ${table.number}</span>
            </div>
            <div class="hint">No app download required • Fast & Contactless</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const statusStyles = {
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    occupied: 'bg-amber-50 text-amber-700 border-amber-200/80',
    order_pending: 'bg-purple-50 text-purple-700 border-purple-200/80',
    cleaning: 'bg-blue-50 text-blue-700 border-blue-200/80',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <Title level={4} className="!mb-0.5 !font-bold !text-slate-900 !tracking-tight">
            Tables & Contactless QR Fleet
          </Title>
          <Text className="text-slate-500 text-xs block">
            Provision unique QR tokens, print branded table tent cards, and manage live dining occupancy
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={<Eye size={14} strokeWidth={2} />}
            onClick={() => navigate('/demo/customer')}
            className="rounded-lg font-medium text-xs h-9 px-3.5 border-slate-200 text-slate-700 hover:text-slate-900"
          >
            Preview Guest Menu
          </Button>
          <Button
            type="primary"
            icon={<Plus size={14} strokeWidth={2} />}
            onClick={() => {
              form.resetFields();
              setTableModalOpen(true);
            }}
            className="rounded-lg font-medium text-xs h-9 px-4 shadow-xs"
            style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
          >
            Add New Table
          </Button>
        </div>
      </div>

      {tables.length === 0 && !loading ? (
        <Card className="rounded-xl border border-slate-200/80 bg-white">
          <EmptyState
            title="No dining tables created"
            description="Add your first table to automatically generate a cryptographic ordering QR code."
            action={() => setTableModalOpen(true)}
            actionText="Create Table"
            icon={QrCode}
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {tables.map((table) => (
            <Col xs={24} sm={12} md={8} lg={6} key={table._id}>
              <Card className="rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all duration-200 shadow-2xs overflow-hidden">
                <div className="p-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 block mb-0.5">
                        {table.section || 'Dining Hall'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-none">
                        Table {table.number}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border capitalize ${
                        statusStyles[table.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {table.status?.replace('_', ' ')}
                    </span>
                  </div>

                  {/* QR Image Preview */}
                  <div
                    onClick={() => {
                      setSelectedTable(table);
                      setQrModalOpen(true);
                    }}
                    className="cursor-pointer group relative my-3 p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center justify-center hover:bg-slate-100/70 transition-colors"
                  >
                    {table.qrCodeUrl ? (
                      <img
                        src={table.qrCodeUrl}
                        alt={`Table ${table.number} QR`}
                        className="w-28 h-28 object-contain rounded"
                      />
                    ) : (
                      <div className="w-28 h-28 flex items-center justify-center text-slate-400">
                        <QrCode size={36} strokeWidth={1.5} />
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-700 font-medium mt-1 flex items-center gap-1">
                      <Eye size={11} strokeWidth={2} /> Click to expand
                    </span>
                  </div>

                  {/* Metadata info */}
                  <div className="flex items-center justify-between text-xs text-slate-500 py-1.5 border-t border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Users size={13} strokeWidth={2} className="text-slate-400" />
                      <span>{table.capacity || 4} Guests</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 truncate max-w-[100px]">
                      {table.qrToken ? `...${table.qrToken.slice(-6)}` : '-'}
                    </span>
                  </div>

                  {/* Quick Card Actions */}
                  <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-100">
                    <Button
                      size="small"
                      icon={<Download size={12} strokeWidth={2} />}
                      onClick={() => downloadQRPNG(table)}
                      className="rounded text-[11px] h-7 px-1 text-slate-600"
                    >
                      PNG
                    </Button>
                    <Button
                      size="small"
                      icon={<Printer size={12} strokeWidth={2} />}
                      onClick={() => printQR(table)}
                      className="rounded text-[11px] h-7 px-1 text-slate-600"
                    >
                      Print
                    </Button>
                    <Popconfirm
                      title="Clear table session?"
                      description="Marks this table Available and closes active session."
                      onConfirm={() => handleResetTable(table._id)}
                      okText="Reset"
                      cancelText="Cancel"
                    >
                      <Button
                        size="small"
                        icon={<RotateCw size={12} strokeWidth={2} />}
                        className="rounded text-[11px] h-7 px-1 text-slate-600"
                      >
                        Reset
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create Table Modal */}
      <Modal
        title={<span className="font-semibold text-slate-900 text-sm">Add Table & Generate QR</span>}
        open={tableModalOpen}
        onCancel={() => setTableModalOpen(false)}
        onOk={handleCreateTable}
        okText="Create Table"
        okButtonProps={{ style: { backgroundColor: '#386b58', borderColor: '#386b58' }, className: 'rounded-lg text-xs font-medium' }}
        cancelButtonProps={{ className: 'rounded-lg text-xs' }}
      >
        <Form form={form} layout="vertical" className="mt-4" requiredMark={false}>
          <Form.Item
            name="number"
            label={<span className="text-xs font-medium text-slate-700">Table Number / Identifier</span>}
            rules={[{ required: true, message: 'Please enter table number (e.g. 01, T-12, Rooftop-3)' }]}
          >
            <Input placeholder="e.g. 01" className="rounded-lg text-xs" />
          </Form.Item>
          <Form.Item
            name="section"
            label={<span className="text-xs font-medium text-slate-700">Dining Section (Optional)</span>}
            initialValue="Main Hall"
          >
            <Input placeholder="e.g. Indoor, Rooftop, Patio, AC Section" className="rounded-lg text-xs" />
          </Form.Item>
          <Form.Item
            name="capacity"
            label={<span className="text-xs font-medium text-slate-700">Seating Capacity</span>}
            initialValue={4}
          >
            <InputNumber min={1} max={50} className="w-full rounded-lg text-xs" />
          </Form.Item>
        </Form>
      </Modal>

      {/* QR Details & Actions Modal */}
      <Modal
        title={
          <span className="font-semibold text-slate-900 text-sm">
            Table {selectedTable?.number} — Contactless QR Code
          </span>
        }
        open={qrModalOpen}
        onCancel={() => setQrModalOpen(false)}
        footer={null}
        width={420}
      >
        {selectedTable && (
          <div className="py-2 text-center">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl inline-block my-2">
              <img
                src={selectedTable.qrCodeUrl}
                alt={`Table ${selectedTable.number} QR`}
                className="w-56 h-56 mx-auto object-contain"
              />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1 break-all px-4">
              {selectedTable.qrToken ? `Token: ${selectedTable.qrToken}` : ''}
            </p>

            <Divider className="my-4" />

            <div className="grid grid-cols-2 gap-2 text-left mb-4">
              <Button
                icon={<Download size={14} strokeWidth={2} />}
                onClick={() => downloadQRPNG(selectedTable)}
                className="rounded-lg text-xs font-medium h-9"
              >
                Download PNG
              </Button>
              <Button
                type="primary"
                icon={<Printer size={14} strokeWidth={2} />}
                onClick={() => printQR(selectedTable)}
                className="rounded-lg text-xs font-medium h-9"
                style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
              >
                Print Standee Card
              </Button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Popconfirm
                title="Regenerate QR Code?"
                description="The printed QR code will stop working immediately."
                onConfirm={() => handleRegenerateQR(selectedTable._id)}
                okText="Regenerate"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" icon={<RotateCw size={12} strokeWidth={2} />} className="text-xs text-amber-700">
                  Revoke & Regenerate
                </Button>
              </Popconfirm>

              <Popconfirm
                title="Delete this table?"
                description="This table cannot be restored."
                onConfirm={async () => {
                  await handleDeleteTable(selectedTable._id);
                  setQrModalOpen(false);
                }}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger icon={<Trash2 size={12} strokeWidth={2} />} className="text-xs">
                  Delete Table
                </Button>
              </Popconfirm>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TableManagement;

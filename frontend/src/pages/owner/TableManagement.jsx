import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
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
  PlusOutlined,
  QrcodeOutlined,
  DownloadOutlined,
  PrinterOutlined,
  ReloadOutlined,
  ClearOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import tenantService from '../../services/tenant.service';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;
const { Option } = Select;

const TableManagement = () => {
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
      toast.success(`Table ${values.number} created with dedicated QR code!`);
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
      toast.success('QR Code regenerated! Previous QR is now revoked.');
      setSelectedTable(res.data?.table);
      loadTables();
    } catch {
      toast.error('Failed to regenerate QR');
    }
  };

  const handleResetTable = async (id) => {
    try {
      await tenantService.resetTable(id);
      toast.success('Table session closed and marked Available');
      loadTables();
    } catch {
      toast.error('Failed to reset table');
    }
  };

  const handleDeleteTable = async (id) => {
    try {
      await tenantService.deleteTable(id);
      toast.success('Table deleted');
      loadTables();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete table with active orders');
    }
  };

  const downloadQRPNG = (table) => {
    if (!table.qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = table.qrCodeUrl;
    a.download = `QRCode-${table.number}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded QR Code for ${table.number}`);
  };

  const printQR = (table) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - Table ${table.number}</title>
          <style>
            body { font-family: 'Inter', sans-serif; text-align: center; padding: 40px; margin: 0; }
            .card { border: 2px solid #e2e8f0; border-radius: 24px; padding: 32px; max-width: 340px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
            h1 { font-size: 24px; margin: 0 0 4px 0; color: #0f172a; }
            p { font-size: 13px; color: #64748b; margin: 0 0 20px 0; }
            img { width: 220px; height: 220px; border-radius: 12px; }
            .table-badge { display: inline-block; background: #6366f1; color: white; font-weight: bold; padding: 6px 16px; border-radius: 999px; margin-top: 16px; font-size: 14px; }
            .hint { font-size: 11px; color: #94a3b8; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Scan to Order</h1>
            <p>Scan with your phone camera to view menu & place order</p>
            <img src="${table.qrCodeUrl}" alt="QR Code" />
            <div>
              <span class="table-badge">Table ${table.number}</span>
            </div>
            <div class="hint">No app download required • Powered by HotelSaaS</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const statusColors = {
    available: 'green',
    occupied: 'orange',
    order_pending: 'purple',
    cleaning: 'blue',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <Title level={4} className="!mb-0 !font-extrabold !text-slate-900">
            Table & QR Code Management
          </Title>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            Generate cryptographic table QR codes, download printable tent cards, and manage live occupancy
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setTableModalOpen(true);
          }}
          className="rounded-xl font-semibold shadow-sm"
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
        >
          Add New Table
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {tables.map((table) => (
          <Col xs={24} sm={12} md={8} lg={6} key={table._id}>
            <Card
              className="rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300"
              actions={[
                <Button
                  key="qr"
                  type="text"
                  icon={<QrcodeOutlined />}
                  onClick={() => {
                    setSelectedTable(table);
                    setQrModalOpen(true);
                  }}
                  className="text-xs font-semibold text-indigo-600"
                >
                  View QR
                </Button>,
                <Button
                  key="print"
                  type="text"
                  icon={<PrinterOutlined />}
                  onClick={() => printQR(table)}
                  className="text-xs font-semibold text-slate-600"
                >
                  Print
                </Button>,
                <Popconfirm
                  key="reset"
                  title="Reset table to Available?"
                  description="Closes dining session for the customer."
                  onConfirm={() => handleResetTable(table._id)}
                  okText="Reset"
                  cancelText="Cancel"
                >
                  <Button type="text" icon={<ClearOutlined />} className="text-xs text-amber-600">
                    Reset
                  </Button>
                </Popconfirm>,
              ]}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight leading-none">
                    {table.number}
                  </h3>
                  <span className="text-slate-400 text-xs font-medium mt-1 block">
                    {table.label || `Table ${table.number}`}
                  </span>
                </div>
                <Tag color={statusColors[table.status] || 'default'} className="rounded-md capitalize text-xs">
                  {table.status?.replace('_', ' ')}
                </Tag>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <span>Capacity: <strong>{table.capacity || 4} Guests</strong></span>
              </div>

              {/* QR Preview Thumbnail */}
              <div
                onClick={() => {
                  setSelectedTable(table);
                  setQrModalOpen(true);
                }}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
              >
                {table.qrCodeUrl ? (
                  <img src={table.qrCodeUrl} alt="QR Thumbnail" className="w-24 h-24 object-contain rounded-lg" />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center text-slate-300">
                    <QrcodeOutlined className="text-4xl" />
                  </div>
                )}
                <span className="text-[11px] text-indigo-600 font-semibold mt-2">Click to inspect</span>
              </div>

              <div className="flex justify-end mt-3">
                <Popconfirm
                  title="Delete table?"
                  onConfirm={() => handleDeleteTable(table._id)}
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} className="text-xs">
                    Remove Table
                  </Button>
                </Popconfirm>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Add Table Modal */}
      <Modal
        title="Add Restaurant Table"
        open={tableModalOpen}
        onCancel={() => setTableModalOpen(false)}
        onOk={handleCreateTable}
        okText="Generate Table & QR"
      >
        <Form form={form} layout="vertical" className="mt-4" requiredMark={false}>
          <Form.Item
            name="number"
            label="Table Number / Code"
            rules={[{ required: true, message: 'Please specify table number (e.g. T-06)' }]}
          >
            <Input placeholder="e.g. T-06, VIP-01, Patio-3" className="rounded-xl" />
          </Form.Item>
          <Form.Item name="label" label="Friendly Display Label">
            <Input placeholder="e.g. Window Booth 2, Outdoor Gazebo" className="rounded-xl" />
          </Form.Item>
          <Form.Item name="capacity" label="Seating Capacity (Guests)" initialValue={4}>
            <InputNumber min={1} max={50} className="w-full rounded-xl" />
          </Form.Item>
          <Form.Item name="description" label="Notes / Floor Location">
            <Input.TextArea rows={2} placeholder="e.g. Near bar, requires high chair" className="rounded-xl" />
          </Form.Item>
        </Form>
      </Modal>

      {/* QR Details & Download Modal */}
      <Modal
        title={
          <span className="font-extrabold text-slate-900">
            Table {selectedTable?.number} — QR Code
          </span>
        }
        open={qrModalOpen}
        onCancel={() => setQrModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalOpen(false)} className="rounded-xl">
            Close
          </Button>,
          <Button
            key="print"
            icon={<PrinterOutlined />}
            onClick={() => printQR(selectedTable)}
            className="rounded-xl"
          >
            Print Card
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => downloadQRPNG(selectedTable)}
            className="rounded-xl"
            style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
          >
            Download PNG
          </Button>,
        ]}
      >
        {selectedTable && (
          <div className="text-center py-4 space-y-4">
            <div className="p-4 bg-white border border-slate-200 rounded-3xl inline-block shadow-sm">
              <img src={selectedTable.qrCodeUrl} alt="Table QR Code" className="w-56 h-56 mx-auto object-contain" />
            </div>

            <div>
              <p className="text-xs text-slate-400 font-mono break-all px-4">
                {selectedTable.qrCodeData}
              </p>
              <div className="mt-2 text-xs text-slate-500">
                Seating Capacity: <strong>{selectedTable.capacity} guests</strong> • Status: <strong>{selectedTable.status}</strong>
              </div>
            </div>

            <Divider />

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-800">
              <p className="font-bold mb-1">🔐 Security & Anti-Fraud Notice</p>
              <p className="mb-2">
                Table tokens are cryptographically generated. If a table card is damaged or compromised, you can revoke the URL and regenerate a new token below.
              </p>
              <Popconfirm
                title="Revoke current QR and regenerate a new cryptographic token?"
                onConfirm={() => handleRegenerateQR(selectedTable._id)}
                okText="Regenerate"
                cancelText="Cancel"
              >
                <Button size="small" icon={<ReloadOutlined />} danger className="rounded-lg text-xs">
                  Revoke & Regenerate QR
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

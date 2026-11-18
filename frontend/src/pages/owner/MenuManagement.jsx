import { useEffect, useState } from 'react';
import {
  Tabs,
  Card,
  Table,
  Button,
  Space,
  Tag,
  Switch,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import tenantService from '../../services/tenant.service';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;
const { Option } = Select;

const MenuManagement = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm] = Form.useForm();

  // Item Modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        tenantService.getCategories(),
        tenantService.getMenuItems(),
      ]);
      setCategories(catRes.data?.categories || []);
      setItems(itemRes.data?.items || []);
    } catch {
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Category actions
  const openCategoryModal = (cat = null) => {
    setEditingCategory(cat);
    if (cat) catForm.setFieldsValue(cat);
    else catForm.resetFields();
    setCatModalOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      const values = await catForm.validateFields();
      if (editingCategory) {
        await tenantService.updateCategory(editingCategory._id, values);
        toast.success('Category updated');
      } else {
        await tenantService.createCategory(values);
        toast.success('Category created');
      }
      setCatModalOpen(false);
      loadData();
    } catch {
      // validation error
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await tenantService.deleteCategory(id);
      toast.success('Category deleted');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  // Item actions
  const openItemModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      itemForm.setFieldsValue({
        ...item,
        categoryId: item.categoryId?._id || item.categoryId,
      });
    } else {
      itemForm.resetFields();
      itemForm.setFieldsValue({
        isVeg: true,
        isAvailable: true,
        preparationTime: 15,
        spiceLevel: 'none',
      });
    }
    setItemModalOpen(true);
  };

  const handleSaveItem = async () => {
    try {
      const values = await itemForm.validateFields();
      if (editingItem) {
        await tenantService.updateMenuItem(editingItem._id, values);
        toast.success('Menu item updated');
      } else {
        await tenantService.createMenuItem(values);
        toast.success('Menu item added');
      }
      setItemModalOpen(false);
      loadData();
    } catch {
      // validation error
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await tenantService.deleteMenuItem(id);
      toast.success('Menu item deleted');
      loadData();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await tenantService.toggleItemAvailability(id);
      toast.success('Availability toggled');
      loadData();
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  const itemColumns = [
    {
      title: 'Item Details',
      key: 'item',
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <span
            className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center flex-shrink-0 ${
              r.isVeg ? 'border-emerald-600' : 'border-rose-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${r.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`}
            />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">{r.name}</span>
              {r.isBestseller && <Tag color="gold" className="text-[10px]">⭐ Bestseller</Tag>}
              {r.isFeatured && <Tag color="purple" className="text-[10px]">Featured</Tag>}
            </div>
            <p className="text-slate-400 text-xs line-clamp-1 max-w-sm mt-0.5">{r.description || 'No description'}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: ['categoryId', 'name'],
      key: 'category',
      render: (cat) => <span className="text-slate-600 text-xs font-semibold">{cat || '-'}</span>,
    },
    {
      title: 'Price',
      key: 'price',
      render: (_, r) => (
        <div>
          {r.discountedPrice ? (
            <div>
              <span className="font-extrabold text-slate-900 text-sm">₹{r.discountedPrice}</span>
              <span className="text-slate-400 line-through text-xs ml-1">₹{r.price}</span>
            </div>
          ) : (
            <span className="font-extrabold text-slate-900 text-sm">₹{r.price}</span>
          )}
        </div>
      ),
    },
    {
      title: 'In Stock / Live',
      key: 'isAvailable',
      render: (_, r) => (
        <Switch
          checked={r.isAvailable}
          onChange={() => handleToggleAvailability(r._id)}
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openItemModal(r)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this item from menu?"
            onConfirm={() => handleDeleteItem(r._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const categoryColumns = [
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-bold text-slate-800 text-sm">{text}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (d) => <span className="text-slate-500 text-xs">{d || '-'}</span>,
    },
    {
      title: 'Sort Order',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      render: (so) => <Tag>{so || 0}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openCategoryModal(r)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this category?"
            description="Items inside this category must be deleted or moved first."
            onConfirm={() => handleDeleteCategory(r._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <Title level={4} className="!mb-0 !font-extrabold !text-slate-900">
            Digital Menu Management
          </Title>
          <Text className="text-slate-500 text-xs mt-0.5 block">
            Configure dishes, categories, preparation times, prices, and instant item availability
          </Text>
        </div>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => openCategoryModal()} className="rounded-xl font-semibold">
            Add Category
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openItemModal()}
            className="rounded-xl font-semibold shadow-sm"
            style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
          >
            Add Menu Item
          </Button>
        </Space>
      </div>

      <Card className="rounded-2xl shadow-sm border border-slate-100">
        <Tabs
          defaultActiveKey="items"
          items={[
            {
              key: 'items',
              label: `Dishes & Items (${items.length})`,
              children: (
                <Table
                  dataSource={items}
                  columns={itemColumns}
                  rowKey="_id"
                  loading={loading}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  size="middle"
                />
              ),
            },
            {
              key: 'categories',
              label: `Categories (${categories.length})`,
              children: (
                <Table
                  dataSource={categories}
                  columns={categoryColumns}
                  rowKey="_id"
                  loading={loading}
                  pagination={false}
                  size="middle"
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Category Modal */}
      <Modal
        title={editingCategory ? 'Edit Category' : 'Create Menu Category'}
        open={catModalOpen}
        onCancel={() => setCatModalOpen(false)}
        onOk={handleSaveCategory}
        okText={editingCategory ? 'Update' : 'Create'}
      >
        <Form form={catForm} layout="vertical" className="mt-4" requiredMark={false}>
          <Form.Item name="name" label="Category Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Starters, Main Course, Sizzlers" className="rounded-xl" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Short summary" className="rounded-xl" />
          </Form.Item>
          <Form.Item name="sortOrder" label="Display Order Sequence" initialValue={0}>
            <InputNumber min={0} className="w-full rounded-xl" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Menu Item Modal */}
      <Modal
        title={editingItem ? 'Edit Dish' : 'Add New Dish to Menu'}
        open={itemModalOpen}
        onCancel={() => setItemModalOpen(false)}
        onOk={handleSaveItem}
        okText={editingItem ? 'Save Changes' : 'Add Item'}
        width={680}
      >
        <Form form={itemForm} layout="vertical" className="mt-4" requiredMark={false}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="name" label="Dish Name" rules={[{ required: true }]}>
                <Input placeholder="Paneer Butter Masala" className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="categoryId" label="Category" rules={[{ required: true }]}>
                <Select placeholder="Select Category" className="rounded-xl">
                  {categories.map((c) => (
                    <Option key={c._id} value={c._id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="price" label="Base Price (₹)" rules={[{ required: true }]}>
                <InputNumber min={0} className="w-full rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountedPrice" label="Special Offer Price (₹ - optional)">
                <InputNumber min={0} className="w-full rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Dish Description">
                <Input.TextArea rows={2} placeholder="Ingredients, flavors, textures..." className="rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isVeg" label="Food Type" valuePropName="checked" initialValue={true}>
                <Select className="rounded-xl">
                  <Option value={true}>🟢 Pure Vegetarian</Option>
                  <Option value={false}>🔴 Non-Vegetarian</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="preparationTime" label="Prep Time (Minutes)" initialValue={15}>
                <InputNumber min={1} className="w-full rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="spiceLevel" label="Spice Intensity" initialValue="none">
                <Select className="rounded-xl">
                  <Option value="none">None</Option>
                  <Option value="mild">Mild</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="hot">Hot 🌶️</Option>
                  <Option value="extra_hot">Extra Hot 🌶️🌶️</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isBestseller" label="Mark as Bestseller" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isFeatured" label="Showcase in Featured" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManagement;

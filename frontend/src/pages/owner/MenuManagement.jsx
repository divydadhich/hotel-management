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
  Plus,
  Pencil,
  Trash2,
  UtensilsCrossed,
  FolderTree,
} from 'lucide-react';
import tenantService from '../../services/tenant.service';
import EmptyState from '../../components/common/EmptyState';
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
        toast.success('Category updated successfully');
      } else {
        await tenantService.createCategory(values);
        toast.success('Category created successfully');
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
        toast.success('Menu dish updated');
      } else {
        await tenantService.createMenuItem(values);
        toast.success('New dish added to menu');
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
      toast.success('Dish removed from menu');
      loadData();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await tenantService.toggleItemAvailability(id);
      toast.success('Item availability toggled');
      loadData();
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  const itemColumns = [
    {
      title: 'Dish & Details',
      key: 'item',
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <span
            className={`w-3.5 h-3.5 border rounded-xs flex items-center justify-center flex-shrink-0 ${
              r.isVeg ? 'border-emerald-600 bg-emerald-50/50' : 'border-rose-600 bg-rose-50/50'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${r.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`}
            />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-xs truncate">{r.name}</span>
              {r.isBestseller && (
                <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-semibold">
                  Bestseller
                </span>
              )}
              {r.isFeatured && (
                <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-semibold">
                  Featured
                </span>
              )}
            </div>
            <p className="text-slate-400 text-[11px] line-clamp-1 max-w-sm mt-0.5">{r.description || 'No description provided'}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: ['categoryId', 'name'],
      key: 'category',
      render: (cat) => <span className="text-slate-600 text-xs font-medium">{cat || '-'}</span>,
    },
    {
      title: 'Price',
      key: 'price',
      render: (_, r) => (
        <div className="font-mono">
          {r.discountedPrice ? (
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-slate-900 text-xs">₹{r.discountedPrice}</span>
              <span className="text-slate-400 line-through text-[11px]">₹{r.price}</span>
            </div>
          ) : (
            <span className="font-bold text-slate-900 text-xs">₹{r.price}</span>
          )}
        </div>
      ),
    },
    {
      title: 'Live on Menu',
      key: 'isAvailable',
      render: (_, r) => (
        <Switch
          size="small"
          checked={r.isAvailable}
          onChange={() => handleToggleAvailability(r._id)}
          className={r.isAvailable ? 'bg-emerald-600' : ''}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button
            size="small"
            icon={<Pencil size={13} strokeWidth={2} />}
            onClick={() => openItemModal(r)}
            className="rounded text-xs border-slate-200 hover:border-slate-300"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this dish?"
            description="It will be immediately removed from the customer QR menu."
            onConfirm={() => handleDeleteItem(r._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<Trash2 size={13} strokeWidth={2} />} className="rounded" />
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
      render: (text) => <span className="font-semibold text-slate-900 text-xs">{text}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (d) => <span className="text-slate-500 text-xs">{d || '-'}</span>,
    },
    {
      title: 'Sequence',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      render: (so) => <Tag className="rounded text-[11px] font-mono">{so || 0}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button
            size="small"
            icon={<Pencil size={13} strokeWidth={2} />}
            onClick={() => openCategoryModal(r)}
            className="rounded text-xs border-slate-200 hover:border-slate-300"
          >
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
            <Button size="small" danger icon={<Trash2 size={13} strokeWidth={2} />} className="rounded" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <Title level={4} className="!mb-0.5 !font-bold !text-slate-900 !tracking-tight">
            Digital Menu Architecture
          </Title>
          <Text className="text-slate-500 text-xs block">
            Maintain dish offerings, categories, pricing, allergens, and live availability
          </Text>
        </div>
        <Space size="small">
          <Button
            icon={<Plus size={14} strokeWidth={2} />}
            onClick={() => openCategoryModal()}
            className="rounded-lg font-medium text-xs h-9 px-3.5 border-slate-200 text-slate-700 hover:text-slate-900"
          >
            New Category
          </Button>
          <Button
            type="primary"
            icon={<Plus size={14} strokeWidth={2} />}
            onClick={() => openItemModal()}
            className="rounded-lg font-medium text-xs h-9 px-4 shadow-xs"
            style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
          >
            Add Menu Dish
          </Button>
        </Space>
      </div>

      <Card className="rounded-xl shadow-xs border border-slate-200/80 bg-white">
        <Tabs
          defaultActiveKey="items"
          items={[
            {
              key: 'items',
              label: (
                <span className="flex items-center gap-2 text-xs font-medium">
                  <UtensilsCrossed size={14} strokeWidth={2} />
                  <span>Dishes & Items ({items.length})</span>
                </span>
              ),
              children: (
                <Table
                  dataSource={items}
                  columns={itemColumns}
                  rowKey="_id"
                  loading={loading}
                  pagination={{ pageSize: 12, showSizeChanger: true }}
                  size="middle"
                  locale={{
                    emptyText: (
                      <EmptyState
                        title="No dishes in catalog"
                        description="Add your first menu item to populate the digital dining menu."
                        action={() => openItemModal()}
                        actionText="Add Menu Dish"
                        icon={UtensilsCrossed}
                      />
                    ),
                  }}
                />
              ),
            },
            {
              key: 'categories',
              label: (
                <span className="flex items-center gap-2 text-xs font-medium">
                  <FolderTree size={14} strokeWidth={2} />
                  <span>Categories ({categories.length})</span>
                </span>
              ),
              children: (
                <Table
                  dataSource={categories}
                  columns={categoryColumns}
                  rowKey="_id"
                  loading={loading}
                  pagination={false}
                  size="middle"
                  locale={{
                    emptyText: (
                      <EmptyState
                        title="No menu categories"
                        description="Create structured categories such as Starters, Mains, and Beverages."
                        action={() => openCategoryModal()}
                        actionText="Create Category"
                        icon={FolderTree}
                      />
                    ),
                  }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Category Modal */}
      <Modal
        title={<span className="font-semibold text-slate-900 text-sm">{editingCategory ? 'Edit Category' : 'Create Menu Category'}</span>}
        open={catModalOpen}
        onCancel={() => setCatModalOpen(false)}
        onOk={handleSaveCategory}
        okText={editingCategory ? 'Save Changes' : 'Create Category'}
        okButtonProps={{ style: { backgroundColor: '#386b58', borderColor: '#386b58' }, className: 'rounded-lg text-xs font-medium' }}
        cancelButtonProps={{ className: 'rounded-lg text-xs' }}
      >
        <Form form={catForm} layout="vertical" className="mt-4" requiredMark={false}>
          <Form.Item name="name" label={<span className="text-xs font-medium text-slate-700">Category Name</span>} rules={[{ required: true }]}>
            <Input placeholder="e.g. Starters, Main Course, Beverages" className="rounded-lg text-xs" />
          </Form.Item>
          <Form.Item name="description" label={<span className="text-xs font-medium text-slate-700">Description</span>}>
            <Input.TextArea rows={2} placeholder="Optional category subtitle or note" className="rounded-lg text-xs" />
          </Form.Item>
          <Form.Item name="sortOrder" label={<span className="text-xs font-medium text-slate-700">Display Order Sequence</span>} initialValue={0}>
            <InputNumber min={0} className="w-full rounded-lg text-xs" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Menu Item Modal */}
      <Modal
        title={<span className="font-semibold text-slate-900 text-sm">{editingItem ? 'Edit Dish Details' : 'Add Dish to Menu'}</span>}
        open={itemModalOpen}
        onCancel={() => setItemModalOpen(false)}
        onOk={handleSaveItem}
        okText={editingItem ? 'Save Changes' : 'Create Dish'}
        okButtonProps={{ style: { backgroundColor: '#386b58', borderColor: '#386b58' }, className: 'rounded-lg text-xs font-medium' }}
        cancelButtonProps={{ className: 'rounded-lg text-xs' }}
        width={640}
      >
        <Form form={itemForm} layout="vertical" className="mt-4" requiredMark={false}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="name" label={<span className="text-xs font-medium text-slate-700">Dish Name</span>} rules={[{ required: true }]}>
                <Input placeholder="e.g. Paneer Butter Masala" className="rounded-lg text-xs" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="categoryId" label={<span className="text-xs font-medium text-slate-700">Category</span>} rules={[{ required: true }]}>
                <Select placeholder="Select Category" className="rounded-lg text-xs">
                  {categories.map((c) => (
                    <Option key={c._id} value={c._id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="price" label={<span className="text-xs font-medium text-slate-700">Base Price (₹)</span>} rules={[{ required: true }]}>
                <InputNumber min={0} className="w-full rounded-lg text-xs" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountedPrice" label={<span className="text-xs font-medium text-slate-700">Special Offer Price (₹ - optional)</span>}>
                <InputNumber min={0} className="w-full rounded-lg text-xs" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label={<span className="text-xs font-medium text-slate-700">Dish Description & Ingredients</span>}>
                <Input.TextArea rows={2} placeholder="Flavors, preparation notes, allergen notice..." className="rounded-lg text-xs" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isVeg" label={<span className="text-xs font-medium text-slate-700">Food Classification</span>} valuePropName="checked" initialValue={true}>
                <Select className="rounded-lg text-xs">
                  <Option value={true}>Vegetarian</Option>
                  <Option value={false}>Non-vegetarian</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="preparationTime" label={<span className="text-xs font-medium text-slate-700">Prep Time (mins)</span>} initialValue={15}>
                <InputNumber min={1} className="w-full rounded-lg text-xs" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="spiceLevel" label={<span className="text-xs font-medium text-slate-700">Spice Level</span>} initialValue="none">
                <Select className="rounded-lg text-xs">
                  <Option value="none">None</Option>
                  <Option value="mild">Mild</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="hot">Hot</Option>
                  <Option value="extra_hot">Extra Hot</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isBestseller" label={<span className="text-xs font-medium text-slate-700">Highlight as Bestseller</span>} valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isFeatured" label={<span className="text-xs font-medium text-slate-700">Showcase on Home Banner</span>} valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManagement;

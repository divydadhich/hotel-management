import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Drawer, Input, Tag } from 'antd';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  QrCode,
  ShoppingCart,
  Building2,
  Sparkles,
  Search,
} from 'lucide-react';

const categories = ['All day', 'Starters', 'Mains', 'Desserts', 'Drinks'];

const dishes = [
  { id: 1, name: 'Garden herb paneer', category: 'Starters', description: 'Charred paneer, mint chutney, toasted seeds', price: 320, label: 'Guest favourite', image: 'image-one', veg: true },
  { id: 2, name: 'Slow-cooked tomato curry', category: 'Mains', description: 'A house recipe with warming spices and cream', price: 460, label: 'House special', image: 'image-two', veg: true },
  { id: 3, name: 'Seasonal greens salad', category: 'Starters', description: 'Local leaves, citrus dressing, crisp lentils', price: 280, label: '', image: 'image-three', veg: true },
  { id: 4, name: 'Saffron rice pudding', category: 'Desserts', description: 'Slow-simmered rice, saffron, pistachio', price: 210, label: '', image: 'image-four', veg: true },
  { id: 5, name: 'House lemonade', category: 'Drinks', description: 'Fresh lemon, garden mint, a touch of honey', price: 140, label: '', image: 'image-three', veg: true },
  { id: 6, name: 'Roasted pepper kebab', category: 'Mains', description: 'Smoky peppers, house masala, warm flatbread', price: 390, label: '', image: 'image-two', veg: true },
];

const orderStages = ['Order received', 'Being prepared', 'Ready to serve', 'Served'];

const CustomerDemo = () => {
  const [category, setCategory] = useState('All day');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [orderStage, setOrderStage] = useState(-1);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const visibleDishes = useMemo(() => dishes.filter((dish) => {
    const matchesCategory = category === 'All day' || dish.category === category;
    const matchesSearch = `${dish.name} ${dish.description}`.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [category, search]);

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const updateQuantity = (dish, amount) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === dish.id);
      if (!existing && amount > 0) return [...current, { ...dish, quantity: 1 }];
      return current
        .map((item) => item.id === dish.id ? { ...item, quantity: item.quantity + amount } : item)
        .filter((item) => item.quantity > 0);
    });
    setOrderStage(-1);
  };

  const getQuantity = (id) => cart.find((item) => item.id === id)?.quantity || 0;

  const placeDemoOrder = (event) => {
    event.preventDefault();
    if (cart.length > 0) {
      setOrderStage(0);
      setMobileCartOpen(false);
    }
  };

  const cartContents = (
    <>
      {orderStage >= 0 ? (
        <div className="p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">Demo order #1048</p>
              <h2 className="m-0 text-lg font-bold text-slate-900">Order Placed{customerName ? `, ${customerName}` : ''}</h2>
              <p className="mb-0 mt-1 text-xs text-slate-500">Live order status from the kitchen to your table.</p>
            </div>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-800"><Clock size={16} strokeWidth={2} /></span>
          </div>
          <div className="space-y-3.5">
            {orderStages.map((stage, index) => (
              <div key={stage} className={`flex items-center gap-3 text-xs ${index <= orderStage ? 'text-emerald-800 font-semibold' : 'text-slate-400'}`}>
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${index <= orderStage ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                  {index < orderStage ? <CheckCircle2 size={13} strokeWidth={2.5} /> : index + 1}
                </span>
                <span>{stage}</span>
              </div>
            ))}
          </div>
          {orderStage < orderStages.length - 1 ? (
            <Button
              type="primary"
              block
              className="!mt-6 !h-10 !rounded-lg text-xs font-semibold"
              style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
              onClick={() => setOrderStage((stage) => stage + 1)}
            >
              Simulate Next Status Update
            </Button>
          ) : (
            <p className="mb-0 mt-5 rounded-lg bg-emerald-50 p-3 text-center text-xs font-medium text-emerald-800 border border-emerald-200">
              Your order is served! Customer can now submit ratings.
            </p>
          )}
          <button type="button" className="mt-4 w-full text-xs font-medium text-slate-500 underline-offset-4 hover:underline" onClick={() => { setOrderStage(-1); setCart([]); }}>
            Reset demo session
          </button>
        </div>
      ) : (
        <form onSubmit={placeDemoOrder} className="flex h-full flex-col">
          <div className="border-b border-slate-100 p-4">
            <h2 className="m-0 text-sm font-bold text-slate-900">Your Table Order</h2>
            <p className="mb-0 mt-0.5 text-xs text-slate-400">Table 04 • Contactless Ordering</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <p>Your cart is empty.</p>
                <p className="mt-1">Tap + on any dish to add to your order.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate font-semibold text-slate-800">{item.name}</p>
                    <p className="m-0 text-[11px] font-mono text-slate-400">₹{item.price * item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="grid h-6 w-6 place-items-center rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                      onClick={() => updateQuantity(item, -1)}
                    >
                      <Minus size={11} strokeWidth={2.5} />
                    </button>
                    <span className="w-4 text-center font-mono font-bold text-slate-800">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="grid h-6 w-6 place-items-center rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                      onClick={() => updateQuantity(item, 1)}
                    >
                      <Plus size={11} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {cart.length > 0 && (
            <div className="border-t border-slate-100 p-4">
              <label htmlFor="customer-name" className="mb-1 block text-xs font-semibold text-slate-700">
                Your name (optional)
              </label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Priya"
                className="mb-3 rounded-lg text-xs"
              />
              <div className="mb-3 flex justify-between text-xs text-slate-500">
                <span>Total Bill (Incl. taxes)</span>
                <span className="font-mono font-bold text-slate-900 text-sm">₹{subtotal}</span>
              </div>
              <Button
                type="primary"
                htmlType="submit"
                block
                className="!h-10 !rounded-lg text-xs font-semibold"
                style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
              >
                Place Order (₹{subtotal})
              </Button>
            </div>
          )}
        </form>
      )}
    </>
  );

  return (
    <div className="customer-demo-page min-h-screen bg-slate-50/50 pb-20">
      {/* Top Header */}
      <header className="customer-demo-header bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="customer-demo-container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/login" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft size={14} strokeWidth={2} />
              <span>Back to Console</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-900">Royal Palace Digital Menu</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
            Table 04
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="customer-demo-container pt-6">
        <div className="customer-demo-menu-grid">
          {/* Menu Items Section */}
          <div>
            <div className="mb-5 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      category === c
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Search dishes..."
                prefix={<Search size={14} className="text-slate-400 mr-1" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-56 rounded-lg text-xs"
                allowClear
              />
            </div>

            <div className="customer-demo-dish-grid">
              {visibleDishes.map((dish) => {
                const qty = getQuantity(dish.id);
                return (
                  <div key={dish.id} className="customer-demo-dish flex flex-col justify-between border border-slate-200/80 rounded-xl bg-white p-3.5 shadow-2xs hover:border-slate-300 transition-all">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 border border-emerald-600 rounded-xs flex items-center justify-center flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          </span>
                          <h3 className="font-semibold text-slate-900 text-xs truncate">{dish.name}</h3>
                        </div>
                        {dish.label && (
                          <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-semibold flex-shrink-0">
                            {dish.label}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2 mb-3">
                        {dish.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-mono font-bold text-slate-900 text-xs">₹{dish.price}</span>
                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => updateQuantity(dish, 1)}
                          className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            className="w-6 h-6 rounded border border-slate-200 text-xs text-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                            onClick={() => updateQuantity(dish, -1)}
                          >
                            <Minus size={11} strokeWidth={2.5} />
                          </button>
                          <span className="font-mono font-bold text-xs text-slate-800">{qty}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            className="w-6 h-6 rounded border border-slate-200 text-xs text-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                            onClick={() => updateQuantity(dish, 1)}
                          >
                            <Plus size={11} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Desktop Cart */}
          <aside className="customer-demo-cart shadow-xs">
            {cartContents}
          </aside>
        </div>
      </main>

      {/* Mobile Cart Floating Trigger */}
      {cart.length > 0 && orderStage < 0 && (
        <div className="customer-demo-mobile-cart fixed bottom-4 left-4 right-4 z-40 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="w-full bg-emerald-800 text-white py-3 px-4 rounded-xl font-semibold text-xs shadow-lg flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart size={15} strokeWidth={2} />
              <span>{itemCount} items</span>
            </span>
            <span>View Order (₹{subtotal})</span>
          </button>
        </div>
      )}

      {/* Mobile Cart Drawer */}
      <Drawer
        title="Your Table Order"
        placement="bottom"
        open={mobileCartOpen}
        onClose={() => setMobileCartOpen(false)}
        height="80%"
        styles={{ body: { padding: 0 } }}
      >
        {cartContents}
      </Drawer>
    </div>
  );
};

export default CustomerDemo;

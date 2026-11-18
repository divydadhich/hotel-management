import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Badge,
  Drawer,
  Typography,
  Spin,
  Tag,
  Input,
  Radio,
  Rate,
  Modal,
  Divider,
} from 'antd';
import {
  ShoppingCartOutlined,
  PlusOutlined,
  MinusOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  DollarOutlined,
  StarFilled,
} from '@ant-design/icons';
import tenantService from '../../services/tenant.service';
import useSocket from '../../hooks/useSocket';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

const CustomerMenu = () => {
  const { slug, token } = useParams();
  const { onEvent } = useSocket();

  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState(null);
  const [settings, setSettings] = useState(null);
  const [menu, setMenu] = useState([]);
  const [table, setTable] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVegOnly, setFilterVegOnly] = useState(false);

  // Cart
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialNote, setSpecialNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [couponCode, setCouponCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Active placed order tracking
  const [activeOrder, setActiveOrder] = useState(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [error, setError] = useState(null);

  // Load menu and table verification
  useEffect(() => {
    const loadRestaurant = async () => {
      setLoading(true);
      try {
        const menuRes = await tenantService.getPublicMenu(slug);
        setTenant(menuRes.data?.tenant);
        setSettings(menuRes.data?.settings || {});
        setMenu(menuRes.data?.menu || []);

        if (menuRes.data?.menu?.length > 0) {
          setActiveCategory(menuRes.data.menu[0]._id);
        }

        if (token) {
          try {
            const tableRes = await tenantService.verifyTable(slug, token);
            setTable(tableRes.data?.table);
          } catch {
            setError('Invalid or expired Table QR Code. Please scan a valid QR at your table.');
          }
        }
      } catch {
        setError('Restaurant not found or digital menu is currently offline.');
      } finally {
        setLoading(false);
      }
    };
    loadRestaurant();
  }, [slug, token]);

  // Socket listener for order status changes if customer has an active order
  useEffect(() => {
    if (!activeOrder?._id) return;

    const cleanupStatus = onEvent('order:status_changed', ({ orderId, status, order }) => {
      if (orderId === activeOrder._id) {
        setActiveOrder((prev) => ({ ...prev, status, ...(order || {}) }));
        toast(`Order Status: ${status.toUpperCase()}`, { icon: '🛎️' });
        if (status === 'served' || status === 'completed') {
          // Trigger review prompt
          setReviewModalOpen(true);
        }
      }
    });

    return () => {
      if (cleanupStatus) cleanupStatus();
    };
  }, [activeOrder, onEvent]);

  // Cart operations
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c._id === item._id);
      if (existing) {
        return prev.map((c) => (c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { ...item, quantity: 1, unitPrice: item.discountedPrice || item.price }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const existing = prev.find((c) => c._id === itemId);
      if (existing?.quantity > 1) {
        return prev.map((c) => (c._id === itemId ? { ...c, quantity: c.quantity - 1 } : c));
      }
      return prev.filter((c) => c._id !== itemId);
    });
  };

  const getQuantity = (itemId) => cart.find((c) => c._id === itemId)?.quantity || 0;

  // Pricing calculations
  const subtotal = cart.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const discountAmount = discountInfo?.discountAmount || 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = settings?.taxRate || 0;
  const taxAmount = Math.round((taxableAmount * taxRate) / 100);
  const serviceChargeRate = settings?.serviceChargeRate || 0;
  const serviceChargeAmount = Math.round((taxableAmount * serviceChargeRate) / 100);
  const grandTotal = taxableAmount + taxAmount + serviceChargeAmount;

  const totalItemsCount = cart.reduce((sum, it) => sum + it.quantity, 0);

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await tenantService.validateCoupon({
        code: couponCode,
        tenantId: tenant?.id,
        orderAmount: subtotal,
      });
      setDiscountInfo(res.data);
      toast.success(`Coupon ${couponCode} applied! Saved ₹${res.data.discountAmount}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    }
  };

  // Place Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!table) {
      toast.error('Table identification is required. Please scan the QR code located on your table.');
      return;
    }

    setPlacingOrder(true);
    try {
      const payload = {
        tenantId: tenant.id,
        tableId: table.id,
        items: cart.map((it) => ({
          menuItemId: it._id,
          name: it.name,
          quantity: it.quantity,
          specialInstructions: it.specialInstructions,
        })),
        customerName: customerName || 'Guest',
        customerPhone,
        notes: specialNote,
        paymentMethod,
        couponCode: discountInfo?.code,
      };

      const res = await tenantService.publicPlaceOrder(payload);
      const placed = res.data?.order;
      setActiveOrder(placed);
      setCart([]);
      setCartOpen(false);

      if (paymentMethod === 'online' && window.Razorpay) {
        // Trigger Razorpay online payment flow
        try {
          const payOrderRes = await tenantService.createPaymentOrder({ orderId: placed._id });
          const payData = payOrderRes.data;

          const options = {
            key: payData.keyId,
            amount: payData.amount,
            currency: payData.currency,
            name: tenant.name,
            description: `Dining Order #${placed.orderNumber}`,
            order_id: payData.gatewayOrderId,
            handler: async (response) => {
              try {
                await tenantService.verifyPayment({
                  orderId: placed._id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                toast.success('Payment Successful! Order Confirmed.');
                setActiveOrder((prev) => ({ ...prev, paymentStatus: 'paid', status: 'accepted' }));
              } catch {
                toast.error('Payment verification failed');
              }
            },
            prefill: {
              name: customerName,
              contact: customerPhone,
            },
            theme: { color: tenant.primaryColor || '#6366f1' },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch {
          toast.error('Online checkout failed. You can pay with Cash or at the counter.');
        }
      } else {
        toast.success(`Order #${placed.orderNumber} placed! Waiter will serve your table.`);
      }

      setTrackingModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Submit Review
  const handleSubmitReview = async () => {
    try {
      await tenantService.submitReview({
        orderId: activeOrder._id,
        overallRating: reviewRating,
        foodRating,
        serviceRating,
        comment: reviewComment,
        customerName: customerName || activeOrder.customerName,
      });
      toast.success('Thank you for your valuable feedback!');
      setReviewModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Spin size="large" />
        <p className="mt-4 text-slate-500 font-semibold text-xs tracking-wider uppercase">
          Loading Digital Menu...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm text-center border border-slate-100">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 text-3xl rounded-2xl flex items-center justify-center mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Notice</h2>
          <p className="text-slate-500 text-xs leading-relaxed mb-6">{error}</p>
          <Button
            type="primary"
            onClick={() => window.location.reload()}
            className="rounded-xl w-full font-bold"
            style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
          >
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  // Filter items
  const activeCatObj = menu.find((c) => c._id === activeCategory);
  let displayItems = activeCatObj?.items || [];
  if (filterVegOnly) {
    displayItems = displayItems.filter((i) => i.isVeg);
  }
  if (searchQuery.trim()) {
    displayItems = displayItems.filter(
      (i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const primaryColor = tenant?.primaryColor || '#6366f1';

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-28 relative shadow-2xl">
      {/* Restaurant Header */}
      <div
        className="relative text-white p-6 pt-10 rounded-b-3xl shadow-lg"
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #1e1b4b 100%)` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Open For Dine-In</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">{tenant?.name}</h1>
            <p className="text-white/80 text-xs mt-1 max-w-xs">{tenant?.welcomeMessage}</p>
          </div>
          {table && (
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/30 text-center flex-shrink-0">
              <span className="text-[10px] uppercase font-bold text-white/80 block">Table</span>
              <span className="text-lg font-black text-white leading-tight">{table.number}</span>
            </div>
          )}
        </div>

        {/* Search bar inside header */}
        <div className="mt-5">
          <Input
            placeholder="Search our delicious dishes..."
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-2xl bg-white text-slate-800 border-none shadow-md py-2.5"
            allowClear
          />
        </div>
      </div>

      {/* Filter and Categories Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 py-3 shadow-xs">
        {/* Veg filter toggle */}
        <div className="px-4 mb-2.5 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Categories</span>
          <button
            onClick={() => setFilterVegOnly(!filterVegOnly)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              filterVegOnly
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Veg Only</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-1">
          {menu.map((cat) => {
            const isSelected = activeCategory === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat._id)}
                className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                  isSelected ? 'text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                style={isSelected ? { backgroundColor: primaryColor } : {}}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Dishes List */}
      <div className="p-4 space-y-3">
        {displayItems.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">
            No dishes matching your filter in this category.
          </div>
        ) : (
          displayItems.map((item) => {
            const qty = getQuantity(item._id);
            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/80 flex gap-3.5 items-start hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center flex-shrink-0 ${
                        item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                    </span>
                    <h3 className="font-extrabold text-slate-800 text-sm leading-tight truncate">{item.name}</h3>
                  </div>

                  {item.isBestseller && (
                    <Tag color="gold" className="text-[10px] font-bold rounded-md mb-1.5">
                      ⭐ Bestseller
                    </Tag>
                  )}

                  <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-3">
                    {item.description || 'Delicious freshly prepared dish.'}
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      {item.discountedPrice ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-slate-900 text-base">₹{item.discountedPrice}</span>
                          <span className="text-slate-400 line-through text-xs font-semibold">₹{item.price}</span>
                        </div>
                      ) : (
                        <span className="font-black text-slate-900 text-base">₹{item.price}</span>
                      )}
                    </div>

                    {/* Add / Qty Controls */}
                    {qty === 0 ? (
                      <Button
                        type="primary"
                        onClick={() => addToCart(item)}
                        className="rounded-xl font-bold text-xs h-8 px-4 shadow-sm"
                        style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                      >
                        ADD +
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-2 py-1">
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="w-6 h-6 rounded-lg bg-white text-indigo-700 font-bold flex items-center justify-center shadow-xs"
                        >
                          <MinusOutlined className="text-[10px]" />
                        </button>
                        <span className="font-extrabold text-xs text-indigo-900 w-4 text-center">{qty}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-6 h-6 rounded-lg bg-white text-indigo-700 font-bold flex items-center justify-center shadow-xs"
                        >
                          <PlusOutlined className="text-[10px]" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
          <div
            onClick={() => setCartOpen(true)}
            className="p-4 rounded-3xl shadow-2xl flex items-center justify-between text-white cursor-pointer active:scale-98 transition-transform"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <ShoppingCartOutlined className="text-xl" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-white/80 block leading-none">
                  {totalItemsCount} {totalItemsCount === 1 ? 'Dish' : 'Dishes'} in Cart
                </span>
                <span className="text-lg font-black tracking-tight leading-tight">₹{grandTotal}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 font-extrabold text-sm bg-white/20 backdrop-blur px-4 py-2 rounded-2xl">
              <span>View Bill</span>
              <span>→</span>
            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-between">
            <span className="font-black text-slate-900 text-base">Your Dining Cart</span>
            {table && <Tag color="purple">Table {table.number}</Tag>}
          </div>
        }
        placement="bottom"
        height="auto"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        styles={{ body: { maxHeight: '82vh', overflowY: 'auto' } }}
        className="rounded-t-3xl"
      >
        <div className="space-y-4">
          {/* Items in cart */}
          <div className="space-y-3">
            {cart.map((it) => (
              <div key={it._id} className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex-1 pr-2">
                  <span className="font-bold text-slate-800 text-xs block leading-tight">{it.name}</span>
                  <span className="text-slate-400 text-[11px]">₹{it.unitPrice} each</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeFromCart(it._id)}
                    className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center"
                  >
                    <MinusOutlined className="text-[10px]" />
                  </button>
                  <span className="font-extrabold text-xs text-slate-800 w-4 text-center">{it.quantity}</span>
                  <button
                    onClick={() => addToCart(it)}
                    className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center"
                  >
                    <PlusOutlined className="text-[10px]" />
                  </button>
                </div>
                <span className="w-16 text-right font-black text-slate-900 text-xs">
                  ₹{it.unitPrice * it.quantity}
                </span>
              </div>
            ))}
          </div>

          {/* Coupon Code Input */}
          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Enter Promo Code (e.g. ROYAL10)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="rounded-xl uppercase font-mono text-xs"
            />
            <Button onClick={handleApplyCoupon} className="rounded-xl font-bold text-xs">
              Apply
            </Button>
          </div>

          {/* Bill Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs text-slate-600 border border-slate-100">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span>₹{subtotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount Applied:</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span>{settings?.taxName || 'GST'} ({taxRate}%):</span>
                <span>₹{taxAmount}</span>
              </div>
            )}
            {serviceChargeAmount > 0 && (
              <div className="flex justify-between">
                <span>{settings?.serviceChargeName || 'Service Charge'} ({serviceChargeRate}%):</span>
                <span>₹{serviceChargeAmount}</span>
              </div>
            )}
            <Divider className="my-1.5" />
            <div className="flex justify-between font-black text-base text-slate-900">
              <span>Grand Total:</span>
              <span>₹{grandTotal}</span>
            </div>
          </div>

          {/* Guest Info & Special Notes */}
          <div className="space-y-2.5">
            <Input
              placeholder="Your Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="rounded-xl text-xs py-2"
            />
            <Input
              placeholder="Phone Number (for SMS & e-receipt)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="rounded-xl text-xs py-2"
            />
            <Input.TextArea
              rows={2}
              placeholder="Special cooking instructions (e.g. Less spicy, no onion)"
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              className="rounded-xl text-xs"
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Payment Option
            </label>
            <Radio.Group
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full grid grid-cols-2 gap-2"
            >
              <Radio.Button value="online" className="!h-auto !py-2.5 text-center !rounded-xl">
                <CreditCardOutlined className="mr-1" /> Online (UPI / Card)
              </Radio.Button>
              <Radio.Button value="cash" className="!h-auto !py-2.5 text-center !rounded-xl">
                <DollarOutlined className="mr-1" /> Pay at Counter
              </Radio.Button>
            </Radio.Group>
          </div>

          {/* Order Placement Button */}
          <Button
            type="primary"
            size="large"
            loading={placingOrder}
            onClick={handlePlaceOrder}
            className="w-full h-12 rounded-2xl font-black text-sm shadow-xl"
            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
          >
            Confirm & Send to Kitchen (₹{grandTotal})
          </Button>
        </div>
      </Drawer>

      {/* Live Order Tracking Modal */}
      <Modal
        title={
          <span className="font-black text-slate-900">
            Live Order Status: #{activeOrder?.orderNumber}
          </span>
        }
        open={trackingModalOpen}
        onCancel={() => setTrackingModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setTrackingModalOpen(false)} className="rounded-xl">
            Close & Keep Browsing
          </Button>,
        ]}
      >
        {activeOrder && (
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 text-3xl flex items-center justify-center mx-auto">
              <ClockCircleOutlined />
            </div>

            <div>
              <span className="text-xs uppercase font-bold text-slate-400">Current Progress</span>
              <h2 className="text-2xl font-black text-slate-900 capitalize mt-1">
                {activeOrder.status === 'pending'
                  ? 'Sent to Kitchen 🛎️'
                  : activeOrder.status === 'preparing'
                  ? 'Currently Cooking on Stove 🔥'
                  : activeOrder.status === 'ready'
                  ? 'Dish is Ready on Pass! 🍽️'
                  : activeOrder.status === 'served'
                  ? 'Served at Your Table! Enjoy 😋'
                  : activeOrder.status}
              </h2>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-1 text-left">
              <p>Table: <strong>{table?.number || '-'}</strong></p>
              <p>Total Bill: <strong>₹{activeOrder.grandTotal}</strong></p>
              <p>Payment: <strong className="uppercase">{activeOrder.paymentStatus} ({activeOrder.paymentMethod})</strong></p>
            </div>
          </div>
        )}
      </Modal>

      {/* Review Modal after order is served */}
      <Modal
        title={<span className="font-black text-slate-900">How was your meal?</span>}
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        onOk={handleSubmitReview}
        okText="Submit Rating"
      >
        <div className="py-2 space-y-4">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-2">Overall Dining Experience</p>
            <Rate value={reviewRating} onChange={setReviewRating} className="text-amber-400 text-2xl" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-center pt-2 border-t border-slate-100">
            <div>
              <p className="text-[11px] text-slate-500 mb-1">Food Taste</p>
              <Rate value={foodRating} onChange={setFoodRating} className="text-amber-400 text-base" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 mb-1">Hospitality & Service</p>
              <Rate value={serviceRating} onChange={setServiceRating} className="text-amber-400 text-base" />
            </div>
          </div>

          <Input.TextArea
            rows={3}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share your compliments or suggestions for the chef..."
            className="rounded-xl text-xs"
          />
        </div>
      </Modal>
    </div>
  );
};

export default CustomerMenu;

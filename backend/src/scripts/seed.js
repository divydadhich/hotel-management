require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const QRCode = require('qrcode');

const Tenant = require('../models/Tenant.model');
const User = require('../models/User.model');
const SubscriptionPlan = require('../models/SubscriptionPlan.model');
const Subscription = require('../models/Subscription.model');
const BusinessSettings = require('../models/BusinessSettings.model');
const Table = require('../models/Table.model');
const MenuCategory = require('../models/MenuCategory.model');
const MenuItem = require('../models/MenuItem.model');
const Order = require('../models/Order.model');
const Review = require('../models/Review.model');
const Coupon = require('../models/Coupon.model');
const Customer = require('../models/Customer.model');
const { ROLES } = require('../constants/roles');
const { SUBSCRIPTION_STATUS } = require('../constants/subscriptionStatus');

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-saas';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for seeding');

    // 1. Super Admin
    let superAdmin = await User.findOne({ email: process.env.SUPER_ADMIN_EMAIL || 'admin@platform.com', tenantId: null });
    if (!superAdmin) {
      const passwordHash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123', 12);
      superAdmin = await User.create({
        name: 'Platform Super Admin',
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@platform.com',
        passwordHash,
        role: ROLES.SUPER_ADMIN,
        tenantId: null,
      });
      console.log('✅ Created Super Admin:', superAdmin.email);
    } else {
      console.log('ℹ️  Super Admin already exists:', superAdmin.email);
    }

    // 2. Subscription Plans
    const plans = [
      {
        name: 'Basic',
        slug: 'basic',
        monthlyPrice: 999,
        yearlyPrice: 9999,
        trialDays: 14,
        sortOrder: 1,
        description: 'Perfect for small cafes & bistros getting started',
        features: [
          'Up to 5 Tables',
          'Digital QR Menu',
          'Table QR Ordering',
          'Basic Order Management',
          'Cash & Counter Payments',
        ],
        limits: { maxTables: 5, maxStaff: 2, maxMenuItems: 30, maxCategories: 5 },
        color: '#6366f1',
      },
      {
        name: 'Pro',
        slug: 'pro',
        monthlyPrice: 2499,
        yearlyPrice: 24999,
        trialDays: 14,
        sortOrder: 2,
        isPopular: true,
        description: 'For busy restaurants requiring online payments & kitchen displays',
        features: [
          'Up to 20 Tables',
          'Digital QR Menu & Ordering',
          'Razorpay Online Payments',
          'Kitchen Display System (KDS)',
          'Staff & Waiter Management',
          'Customer Ratings & Reviews',
          'Real-time Revenue Analytics',
          'Discounts & Coupon Codes',
        ],
        limits: { maxTables: 20, maxStaff: 10, maxMenuItems: 200, maxCategories: 20 },
        color: '#8b5cf6',
      },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        monthlyPrice: 4999,
        yearlyPrice: 49999,
        trialDays: 30,
        sortOrder: 3,
        description: 'For hotel chains, resorts, and high-volume multi-floor dining',
        features: [
          'Unlimited Tables',
          'Unlimited Staff Accounts',
          'All Pro Features Included',
          'Multi-Room / Multi-Floor support',
          'Custom Brand Colors & Domain',
          'Advanced Financial & Sales Exports',
          'Priority 24/7 Dedicated Support',
        ],
        limits: { maxTables: -1, maxStaff: -1, maxMenuItems: -1, maxCategories: -1 },
        color: '#f59e0b',
      },
    ];

    for (const planData of plans) {
      const existing = await SubscriptionPlan.findOne({ slug: planData.slug });
      if (!existing) {
        await SubscriptionPlan.create(planData);
        console.log(`✅ Subscription plan created: ${planData.name}`);
      } else {
        console.log(`ℹ️  Subscription plan already exists: ${planData.name}`);
      }
    }

    // 3. Demo Tenant: "Royal Palace Restaurant"
    let tenant = await Tenant.findOne({ slug: 'royal-palace' });
    if (tenant) {
      // Clean up for fresh seed
      await User.deleteMany({ tenantId: tenant._id });
      await Table.deleteMany({ tenantId: tenant._id });
      await MenuCategory.deleteMany({ tenantId: tenant._id });
      await MenuItem.deleteMany({ tenantId: tenant._id });
      await BusinessSettings.deleteMany({ tenantId: tenant._id });
      await Subscription.deleteMany({ tenantId: tenant._id });
      await Order.deleteMany({ tenantId: tenant._id });
      await Review.deleteMany({ tenantId: tenant._id });
      await Coupon.deleteMany({ tenantId: tenant._id });
      await Customer.deleteMany({ tenantId: tenant._id });
      await Tenant.deleteOne({ _id: tenant._id });
      console.log('🔄 Re-seeding Royal Palace...');
    }

    {
      tenant = await Tenant.create({
        name: 'Royal Palace Restaurant',
        slug: 'royal-palace',
        email: 'owner@royalpalace.com',
        phone: '+91 98765 43210',
        address: '123 MG Road, Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        gstNumber: '07AAAAA0000A1Z5',
        currency: 'INR',
        primaryColor: '#dc2626',
        secondaryColor: '#991b1b',
        welcomeMessage: 'Welcome to Royal Palace! Scan, Browse & Order.',
        description: 'Authentic Indian royal cuisine & fine dining experience.',
        businessType: 'restaurant',
      });
      console.log('✅ Demo tenant created: Royal Palace Restaurant');

      // Tenant Owner
      const ownerHash = await bcrypt.hash('Owner@123', 12);
      await User.create({
        name: 'Rajesh Singhania',
        email: 'owner@royalpalace.com',
        passwordHash: ownerHash,
        role: ROLES.OWNER,
        tenantId: tenant._id,
        phone: '+91 98765 43210',
      });
      console.log('✅ Tenant Owner created: owner@royalpalace.com / Owner@123');

      // Receptionist
      const staffHash = await bcrypt.hash('Staff@123', 12);
      await User.create({
        name: 'Pooja Verma',
        email: 'reception@royalpalace.com',
        passwordHash: staffHash,
        role: ROLES.RECEPTIONIST,
        tenantId: tenant._id,
        phone: '+91 98765 43211',
      });
      console.log('✅ Receptionist created: reception@royalpalace.com / Staff@123');

      // Kitchen Staff
      await User.create({
        name: 'Chef Sanjeev',
        email: 'kitchen@royalpalace.com',
        passwordHash: staffHash,
        role: ROLES.KITCHEN,
        tenantId: tenant._id,
        phone: '+91 98765 43212',
      });
      console.log('✅ Kitchen Staff created: kitchen@royalpalace.com / Staff@123');

      // Trial Subscription
      const proPlan = await SubscriptionPlan.findOne({ slug: 'pro' });
      if (proPlan) {
        await Subscription.create({
          tenantId: tenant._id,
          planId: proPlan._id,
          status: SUBSCRIPTION_STATUS.TRIAL,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        });
        console.log('✅ Pro Trial subscription attached');
      }

      // Business Settings
      await BusinessSettings.create({
        tenantId: tenant._id,
        taxRate: 5,
        taxName: 'GST (5%)',
        serviceChargeRate: 5,
        serviceChargeName: 'Service Charge (5%)',
        enableOnlinePayment: true,
        enableCashPayment: true,
        enablePayAtCounter: true,
        enableReviews: true,
        enableCoupons: true,
        notificationEmail: 'orders@royalpalace.com',
      });
      console.log('✅ Business Settings configured');

      // Tables with actual QR code Data URLs
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const tablesData = [
        { number: 'T-01', label: 'Main Hall Table 1', capacity: 2 },
        { number: 'T-02', label: 'Main Hall Table 2', capacity: 4 },
        { number: 'T-03', label: 'Window View Table 3', capacity: 4 },
        { number: 'T-04', label: 'Family Booth Table 4', capacity: 6 },
        { number: 'T-05', label: 'Outdoor Garden Table 5', capacity: 8 },
      ];

      const createdTables = [];
      for (const t of tablesData) {
        const token = crypto.randomBytes(24).toString('hex');
        const qrUrl = `${frontendUrl}/menu/royal-palace/table/${token}`;
        const qrCodeUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2 });
        const createdTable = await Table.create({
          tenantId: tenant._id,
          number: t.number,
          label: t.label,
          capacity: t.capacity,
          token,
          qrCodeData: qrUrl,
          qrCodeUrl,
          status: 'available',
        });
        createdTables.push(createdTable);
      }
      console.log(`✅ ${createdTables.length} tables generated with QR data`);

      // Menu Categories
      const catStarters = await MenuCategory.create({
        tenantId: tenant._id,
        name: 'Royal Starters',
        slug: 'royal-starters',
        sortOrder: 1,
        description: 'Tandoori & sizzler appetizers',
      });

      const catMain = await MenuCategory.create({
        tenantId: tenant._id,
        name: 'Main Course',
        slug: 'main-course',
        sortOrder: 2,
        description: 'Rich curries, biryanis & fresh breads',
      });

      const catBeverages = await MenuCategory.create({
        tenantId: tenant._id,
        name: 'Beverages & Mocktails',
        slug: 'beverages-mocktails',
        sortOrder: 3,
        description: 'Coolers, lassis, and hot specials',
      });

      const catDesserts = await MenuCategory.create({
        tenantId: tenant._id,
        name: 'Royal Desserts',
        slug: 'royal-desserts',
        sortOrder: 4,
        description: 'Traditional sweet delicacies',
      });
      console.log('✅ 4 Menu Categories created');

      // Menu Items
      const items = await MenuItem.insertMany([
        {
          tenantId: tenant._id,
          categoryId: catStarters._id,
          name: 'Paneer Malai Tikka',
          description: 'Cubes of fresh cottage cheese marinated in cream, cashew paste, and aromatic green cardamom.',
          price: 320,
          discountedPrice: 290,
          isVeg: true,
          isBestseller: true,
          preparationTime: 15,
          spiceLevel: 'mild',
        },
        {
          tenantId: tenant._id,
          categoryId: catStarters._id,
          name: 'Tandoori Chicken Kebab',
          description: 'Classic spring chicken grilled on charcoal skewers with authentic red masala marinade.',
          price: 380,
          discountedPrice: 350,
          isVeg: false,
          isBestseller: true,
          preparationTime: 20,
          spiceLevel: 'medium',
        },
        {
          tenantId: tenant._id,
          categoryId: catMain._id,
          name: 'Dal Makhani Bukhara',
          description: 'Whole black lentils simmered overnight on clay oven with tomatoes, butter and rich cream.',
          price: 280,
          isVeg: true,
          isBestseller: true,
          isFeatured: true,
          preparationTime: 12,
          spiceLevel: 'mild',
        },
        {
          tenantId: tenant._id,
          categoryId: catMain._id,
          name: 'Butter Chicken Royalty',
          description: 'Succulent boneless tandoori chicken cooked in velvety tomato, makhani butter and fenugreek gravy.',
          price: 420,
          isVeg: false,
          isFeatured: true,
          isBestseller: true,
          preparationTime: 15,
          spiceLevel: 'mild',
        },
        {
          tenantId: tenant._id,
          categoryId: catMain._id,
          name: 'Dum Hyderabadi Mutton Biryani',
          description: 'Fragrant aged long-grain basmati rice layered with tender baby goat meat and royal saffron.',
          price: 490,
          isVeg: false,
          isFeatured: true,
          preparationTime: 25,
          spiceLevel: 'medium',
        },
        {
          tenantId: tenant._id,
          categoryId: catBeverages._id,
          name: 'Kesar Mango Lassi',
          description: 'Thick organic curd churned with Alphonso mango pulp and Kashmiri saffron threads.',
          price: 140,
          isVeg: true,
          isBestseller: true,
          preparationTime: 5,
        },
        {
          tenantId: tenant._id,
          categoryId: catBeverages._id,
          name: 'Masala Cutting Chai',
          description: 'Handcrafted tea infused with crushed ginger, green cardamom, cloves, and cinnamon.',
          price: 60,
          isVeg: true,
          preparationTime: 5,
        },
        {
          tenantId: tenant._id,
          categoryId: catDesserts._id,
          name: 'Shahi Kesar Gulab Jamun',
          description: 'Hot golden milk-solid dumplings soaked in rose water & saffron sugar elixir.',
          price: 160,
          isVeg: true,
          isBestseller: true,
          preparationTime: 5,
        },
      ]);
      console.log(`✅ ${items.length} Menu Items seeded with accurate pricing`);

      // Demo Coupon
      await Coupon.create({
        tenantId: tenant._id,
        code: 'ROYAL10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 500,
        maxDiscount: 200,
        isActive: true,
      });
      console.log('✅ Coupon ROYAL10 (10% off) created');

      // Demo Customers & Orders for initial analytics
      const customer = await Customer.create({
        tenantId: tenant._id,
        name: 'Arjun Kapoor',
        phone: '9876543299',
        email: 'arjun@example.com',
        orderCount: 1,
        totalSpent: 1050,
      });

      const demoOrder = await Order.create({
        tenantId: tenant._id,
        orderNumber: 'ORD-0001',
        tableId: createdTables[0]._id,
        customerName: 'Arjun Kapoor',
        customerPhone: '9876543299',
        items: [
          {
            menuItemId: items[0]._id,
            name: items[0].name,
            price: 290,
            quantity: 2,
            subtotal: 580,
          },
          {
            menuItemId: items[2]._id,
            name: items[2].name,
            price: 280,
            quantity: 1,
            subtotal: 280,
          },
          {
            menuItemId: items[5]._id,
            name: items[5].name,
            price: 140,
            quantity: 1,
            subtotal: 140,
          },
        ],
        subtotal: 1000,
        discountAmount: 100,
        couponCode: 'ROYAL10',
        taxRate: 5,
        taxAmount: 45,
        serviceChargeRate: 5,
        serviceChargeAmount: 45,
        grandTotal: 990,
        status: 'served',
        paymentStatus: 'paid',
        paymentMethod: 'cash',
      });

      // Review
      await Review.create({
        tenantId: tenant._id,
        orderId: demoOrder._id,
        overallRating: 5,
        foodRating: 5,
        serviceRating: 5,
        comment: 'Outstanding food and exceptional ambiance! The Dal Makhani was simply divine.',
        customerName: 'Arjun Kapoor',
      });
      console.log('✅ Initial demo order and 5-star customer review seeded');
    }

    console.log('\n======================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('🔑 Credentials to test:');
    console.log('1. Super Admin: admin@platform.com     / SuperAdmin@123');
    console.log('2. Owner:       owner@royalpalace.com  / Owner@123');
    console.log('3. Receptionist:reception@royalpalace.com / Staff@123');
    console.log('4. Kitchen:     kitchen@royalpalace.com   / Staff@123');
    console.log('======================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();

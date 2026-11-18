# 🏨 Multi-Tenant Restaurant & Hotel Management SaaS Platform

A production-grade, commercial multi-tenant SaaS platform built for restaurants, hotels, cafes, and multi-location food businesses. The system allows multiple independent businesses to operate securely from a single deployment while maintaining complete data isolation, dynamic branding, custom digital QR menus, table ordering, real-time Kitchen Display System (KDS), receptionist order management, and real-time revenue analytics.

---

## ⚡ Tech Stack

- **Frontend:** React.js 18 + Vite
- **Styling & UI:** Tailwind CSS v4 + Ant Design (`antd`)
- **State Management:** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- **API Client:** Axios with JWT request & token-refresh interceptors
- **Real-Time Communication:** Socket.IO Client & Server
- **Charts & Visualizations:** Recharts
- **QR Generation:** Cryptographic random UUIDs + `qrcode` engine
- **Payments:** Razorpay Gateway with modular provider abstraction (plus Cash & Pay-at-Counter)
- **Backend:** Node.js + Express.js v5
- **Database:** MongoDB with Mongoose (Strict tenant-level query isolation)
- **Security:** Helmet, Mongo-Sanitize, BCrypt password hashing, JWT rotating refresh cookies, Rate-limiting

---

## 🔑 Default Seeded Demo Credentials

Run `npm run seed` inside `backend/` to populate these ready-to-use accounts:

| Role | Email | Password | Scope |
|---|---|---|---|
| **Super Admin** | `admin@platform.com` | `SuperAdmin@123` | Platform-wide master control |
| **Restaurant Owner** | `owner@royalpalace.com` | `Owner@123` | Royal Palace Restaurant |
| **Receptionist / Cashier** | `reception@royalpalace.com` | `Staff@123` | Royal Palace Restaurant |
| **Kitchen Staff (KDS)** | `kitchen@royalpalace.com` | `Staff@123` | Royal Palace Restaurant |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18+ (tested on Node v22)
- **MongoDB:** Running locally on port `27017` or a MongoDB Atlas URI

### 2. Backend Setup
```bash
cd backend
npm install
npm run seed     # Seeds demo tenant, plans, tables, dishes, and users
npm run dev      # Starts Express & Socket.IO on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Starts Vite React dev server on http://localhost:5173
```

---

## 📱 User Journeys & Core Modules

### 1. Customer QR Code Ordering (`/menu/:slug/table/:token`)
- Guest scans table QR with smartphone camera.
- System automatically resolves tenant brand (`Royal Palace`), active table (`Table T-01`), and live menu.
- Browse categories (Starters, Main Course, Beverages, Desserts).
- Veg / Non-Veg filter, search dishes, view bestseller tags.
- Customize dish quantities and add special cooking instructions.
- Real-time cart calculation with GST tax, service charges, and promo code discounts (`ROYAL10`).
- Pay online via Razorpay or choose Pay at Counter.
- Real-time live status tracking (Sent to Kitchen → Preparing → Ready → Served).
- Submit 5-star customer review with food & service ratings after dining.

### 2. Kitchen Display System (KDS) (`/kitchen`)
- Mountable on kitchen tablets and large monitors.
- High-contrast, dark-mode 3-column ticket board (Incoming → Preparing → Ready on Pass).
- Displays dishes, exact quantities, variant specifications, and special kitchen instructions.
- Live elapsed preparation timer to ensure timely service.

### 3. Receptionist & Cashier Console (`/receptionist`)
- Real-time incoming order audio chime alert via Socket.IO.
- Accept or reject incoming customer orders with a single tap.
- Mark orders as served to table and collect cash / counter payments.
- Live table occupancy tracking.

### 4. Restaurant Owner Management (`/dashboard`)
- **Revenue Analytics:** Today's revenue, all-time revenue, average order value, daily trend graph via Recharts.
- **Top Dishes:** Bestselling dish analytics.
- **Menu Management (`/menu`):** Dynamic category & item CRUD with prices, variants, add-ons, and instant out-of-stock toggles.
- **Table Management (`/tables`):** Add tables, preview QR codes, download PNG, generate printable tent cards, revoke/regenerate QR tokens, reset table sessions.
- **Orders Ledger (`/orders`):** Searchable order history, status updates, printable tax invoice receipts.
- **Staff Accounts (`/staff`):** Provision isolated logins for receptionists and kitchen tablets.
- **Discount Coupons (`/coupons`):** Create promo codes with percentage/fixed discounts and usage caps.
- **Guest Reviews (`/reviews`):** Monitor customer ratings and publish owner replies.
- **White-Label Branding (`/profile`):** Customize primary/secondary brand colors, logo, welcome message, and tax rates.

### 5. Super Admin Platform Console (`/super/dashboard`)
- Cross-platform metrics: total onboarded businesses, active tenants, total platform orders.
- Tenant Directory (`/super/tenants`): Activate, deactivate, or suspend businesses.
- Onboard New Hotel (`/super/tenants/new`): 4-step wizard to provision a new isolated tenant.
- Subscription Plans (`/super/plans`): Configure pricing tiers (Basic, Pro, Enterprise) and table limits.

---

## 🔒 Multi-Tenant Data Isolation Architecture

1. **Authentication Token Payload:**
   Every JWT issued contains the authenticated user's verified `tenantId` and `role`.
2. **Backend Middleware (`tenantIsolation.middleware.js`):**
   - Automatically derives `tenantId` from verified token claims.
   - Enforces strict query scoping on all MongoDB operations.
   - Prevents any tenant from accessing or modifying another tenant's records even if manipulated IDs are supplied.
3. **Public Route Table Tokens:**
   - Table QR URLs use cryptographically random 48-character hex tokens (`/menu/:slug/table/:token`), never exposing predictable sequential database IDs.
   - Revocation & regeneration instantaneously invalidates compromised table QR codes.

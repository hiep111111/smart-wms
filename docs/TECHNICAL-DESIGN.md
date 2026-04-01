# TECHNICAL DESIGN — Smart WMS

> Technical document for the development team. Read after REQUIREMENTS.md and SPECIFICATION.md.
> Stack: Next.js 15 App Router · Tailwind CSS v4 · Prisma ORM · SQLite · Jose JWT
> Team size: 1–2 people · Timeline: short · Priority: simple, easy to maintain

---

## PART 1 — TECH STACK

### 1.1 Core Stack (Fixed)

| Technology | Version | Reason |
|-----------|---------|-------|
| **Next.js** | 15 (App Router) | Server Actions eliminate the need to write separate APIs, significantly reducing boilerplate. RSC enables fast page loads without an additional fetching layer. |
| **React** | 19 | Bundled with Next.js 15, not a separate choice. |
| **TypeScript** | 5 | Catches errors early, Prisma generates accurate types, good IDE support for small teams. |
| **Tailwind CSS** | v4 | Utility-first, no complex design system needed. v4 requires no config file. |
| **Prisma ORM** | 7 | Type-safe queries, auto-generate migrations, Prisma Studio for direct DB inspection. |
| **SQLite** | via libsql | Zero infrastructure for v1. If scaling is needed later, migrate to Turso (distributed libSQL) without changing code. |
| **Jose** | 6 | Pure JS (does not use Node crypto API), works in Next.js middleware Edge Runtime. |
| **bcryptjs** | 3 | Secure password hashing, pure JS. |

### 1.2 Additional Libraries

#### QR Code

```
npm install html5-qrcode qrcode
npm install --save-dev @types/qrcode
```

| Library | Purpose | Why chosen |
|----------|----------|-----------|
| `html5-qrcode` | Scan QR via camera / image upload | Simple API, supports both mobile camera and desktop upload. No WebAssembly setup required. |
| `qrcode` | Generate QR image for printing | Zero deps, outputs SVG/PNG/DataURL. Used for product and location QR print pages. |

#### 3D Warehouse Map

```
npm install three @react-three/fiber @react-three/drei
npm install --save-dev @types/three
```

| Library | Purpose | Why chosen |
|----------|----------|-----------|
| `three` | WebGL rendering engine | The standard for 3D on the web. |
| `@react-three/fiber` | React wrapper for Three.js | Write 3D components like regular React components, instead of imperative Three.js manipulation. |
| `@react-three/drei` | Helper components | OrbitControls, Text, Html overlays — avoids writing from scratch. |

> **Note:** Use `dynamic import` with `{ ssr: false }` for the entire 3D scene to prevent SSR crashes.

#### Charts & Analytics

```
npm install recharts
```

| Library | Purpose | Why chosen |
|----------|----------|-----------|
| `recharts` | Bar, Line, Pie charts for dashboard | React-native (does not use D3 DOM), good TypeScript support, responsive by default. Lighter than Chart.js with React. |

#### Export & Utilities

```
npm install xlsx date-fns sonner
```

| Library | Purpose | Why chosen |
|----------|----------|-----------|
| `xlsx` | Export reports to Excel/CSV | Standard library for Excel export, also handles CSV. |
| `date-fns` | Date formatting | Tree-shakeable, no global state like moment.js. Vietnamese locale available. |
| `sonner` | Toast notifications | Minimal, beautiful by default, integrates with Next.js App Router without a complex Provider. |

### 1.3 Dependencies Summary

```json
{
  "dependencies": {
    "@prisma/adapter-libsql": "^7.5.0",
    "@prisma/client": "^7.5.0",
    "@libsql/client": "^0.17.2",
    "@react-three/drei": "^9",
    "@react-three/fiber": "^8",
    "bcryptjs": "^3.0.3",
    "date-fns": "^3",
    "html5-qrcode": "^2",
    "jose": "^6.2.2",
    "next": "16.2.0",
    "qrcode": "^1",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "recharts": "^2",
    "sonner": "^1",
    "three": "^0.170",
    "xlsx": "^0.18"
  }
}
```

---

## PART 2 — ARCHITECTURE

### 2.1 Data Flow Overview

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│                                                         │
│  React Components (RSC + Client Components)             │
│  ├── Server Components: render directly from DB         │
│  └── Client Components: interactive UI, 3D map, QR      │
└───────────────┬─────────────────────────────────────────┘
                │  HTTP (Server Actions / fetch)
                ▼
┌─────────────────────────────────────────────────────────┐
│                 NEXT.JS 15 SERVER                        │
│                                                         │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │ middleware  │   │ Server       │   │ Route       │  │
│  │ (JWT auth  │   │ Actions      │   │ Handlers    │  │
│  │  + RBAC)   │   │ src/actions/ │   │ app/api/    │  │
│  └──────┬──────┘   └──────┬───────┘   └──────┬──────┘  │
│         │                 │                   │         │
│         └─────────────────┴───────────────────┘         │
│                           │                             │
│                    ┌──────▼──────┐                      │
│                    │  Prisma ORM │                      │
│                    │  src/lib/   │                      │
│                    │  prisma/db  │                      │
│                    └──────┬──────┘                      │
└───────────────────────────┼─────────────────────────────┘
                            │  SQL
                            ▼
                    ┌──────────────┐
                    │   SQLite     │
                    │  (libsql)    │
                    └──────────────┘
```

**Rule for choosing Server Action vs Route Handler:**
- **Server Action**: CRUD operations (form submit, mutations) — simple, type-safe, no fetch() needed
- **Route Handler (`app/api/`)**: only use when streaming is needed (QR scan real-time) or for external webhooks

### 2.2 API Structure

Grouped by domain. All are called via Server Actions unless noted otherwise.

```
src/actions/
│
├── auth/
│   ├── login.ts          — POST: authenticate, set JWT cookie
│   └── logout.ts         — POST: clear cookie, redirect /login
│
├── users/
│   ├── getUsers.ts       — GET: user list (Admin only)
│   ├── createUser.ts     — POST: create user
│   ├── updateUser.ts     — PUT: update role, isActive
│   ├── deleteUser.ts     — DELETE: soft delete
│   └── updatePermissions.ts — PUT: dynamic permissions
│
├── products/
│   ├── getProducts.ts    — GET: list + search/filter
│   ├── getProduct.ts     — GET: detail + stock by location
│   ├── createProduct.ts  — POST: create product + validate SKU unique
│   ├── updateProduct.ts  — PUT: update information
│   └── deleteProduct.ts  — DELETE: check stock > 0 before deleting
│
├── locations/
│   ├── getLocations.ts   — GET: list + filter by status
│   ├── getLocation.ts    — GET: detail + current inventory
│   ├── createLocation.ts — POST: create location + validate coordinates unique
│   ├── updateLocation.ts — PUT: update label/status
│   └── deleteLocation.ts — DELETE: check if stock remains
│
├── inventory/
│   ├── createInbound.ts  — POST: Goods Receipt (IN)
│   ├── createOutbound.ts — POST: Goods Issue (OUT), validate quantity
│   ├── createTransfer.ts — POST: Location Transfer (TRANSFER), atomic
│   └── getMovements.ts   — GET: history + filter by type/date/product
│
├── reports/
│   ├── getDashboardStats.ts — GET: KPI cards, total stock
│   ├── getStockReport.ts    — GET: detailed stock report
│   ├── getMovementReport.ts — GET: receipt/issue report by period
│   └── exportReport.ts      — POST: generate xlsx buffer → download
│
└── scanner/
    └── resolveQR.ts      — POST: decode QR string → product/location lookup
```

### 2.3 Authentication Flow

```
[1] User enters username + password
        │
        ▼
[2] Server Action: login.ts
    ├── Prisma: find user by username
    ├── bcryptjs: compare password hash
    └── If fail → return error message

        │ (if successful)
        ▼
[3] Jose: sign JWT (HS256)
    Payload: { userId, username, role, permissions[] }
    Expires: 8 hours
        │
        ▼
[4] Set HTTP-only cookie: wms_session=<jwt>
    Flags: HttpOnly, SameSite=Strict, Secure (production)
        │
        ▼
[5] Redirect → /dashboard

[6] Each subsequent request:
        │
        ▼
    middleware.ts
    ├── Read cookie wms_session
    ├── Jose: verify + decrypt JWT
    ├── Inject user info into request headers
    └── If invalid/expired → redirect /login

[7] Logout:
    logout.ts → delete cookie → redirect /login
```

### 2.4 Middleware & RBAC

**2 protection layers:**

```
LAYER 1 — ROUTE LEVEL (middleware.ts)
─────────────────────────────────────
Check: is there a valid JWT?
- Missing / expired → /login
- Valid → inject { userId, role, permissions } into header x-user-info

Applies to: all /dashboard/** routes
Does not apply to: /login, /api/*, /_next/*, /favicon.ico


LAYER 2 — ACTION LEVEL (each Server Action)
─────────────────────────────────────────
Check: does the role have permission to perform this action?

src/lib/auth/checkPermission.ts
  └── getSession() → read header x-user-info
  └── hasPermission(session, requiredPermission) → boolean
  └── If no permission → throw Error("UNAUTHORIZED")
```

**Permission check pattern in every Server Action:**

```typescript
// Standard pattern for every Server Action requiring auth
export async function createProduct(data: CreateProductInput) {
  const session = await getSession()
  if (!hasPermission(session, 'product:create')) {
    throw new Error('UNAUTHORIZED')
  }
  // ... business logic
}
```

**Permission Map (condensed from SPECIFICATION.md):**

```
product:create    → Admin, Director, Vice Director, Head Warehouse, Warehouse Staff*
product:edit      → Admin, Director, Vice Director, Head Warehouse
product:delete    → Admin, Director

location:create   → Admin, Director, Vice Director, Head Warehouse
location:edit     → Admin, Director, Vice Director, Head Warehouse

inventory:in      → Admin, Director, Vice Director, Head Warehouse, Warehouse Staff*, Office Staff*
inventory:out     → Admin, Director, Vice Director, Head Warehouse, Warehouse Staff*, Office Staff*
inventory:transfer→ Admin, Director, Vice Director, Head Warehouse, Warehouse Staff*

report:view       → Admin, Director, Vice Director, Head Warehouse, Chief Accountant, Vice Accountant, Accounting Staff*
report:export     → Admin, Director, Vice Director, Chief Accountant, Vice Accountant

user:manage       → Admin only
permission:grant  → Admin, Head Warehouse (for Warehouse Staff), Chief/Vice Accountant (for Accounting Staff)

* = if granted dynamic permission
```

---

## PART 3 — MODULE STRUCTURE

### 3.1 Dependency Diagram

```
           ┌──────────┐
           │  shared  │  (UI components, hooks, utils)
           └────┬─────┘
                │ (used by all modules)
    ┌───────────┼──────────────────────────┐
    │           │                          │
    ▼           ▼                          ▼
┌───────┐  ┌─────────┐              ┌──────────┐
│ auth  │  │ products│              │ reports  │
└───┬───┘  └────┬────┘              └────┬─────┘
    │            │                       │
    │       ┌────┴─────┐                 │
    │       │ locations│                 │
    │       └────┬─────┘                 │
    │            │                       │
    │       ┌────▼──────┐                │
    │       │ inventory │────────────────┘
    │       └────┬──────┘
    │            │
    │       ┌────┴────┐
    │       │   map   │
    │       └─────────┘
    │
    │       ┌─────────┐
    └──────▶│  users  │
            └─────────┘
```

### 3.2 Module Details

---

#### MODULE: `auth`
**Function:** User authentication, JWT session management, permission checks

```
src/
├── app/(auth)/
│   ├── layout.tsx              — Login page layout (no sidebar)
│   └── login/
│       └── page.tsx            — Login page
├── actions/auth/
│   ├── login.ts                — Server Action: authenticate, set cookie
│   └── logout.ts               — Server Action: clear cookie
└── lib/auth/
    ├── session.ts              — getSession(), createSession(), deleteSession()
    ├── permissions.ts          — hasPermission(), PERMISSION_MAP constant
    └── checkPermission.ts      — Guard function used in Server Actions
```

**Dependencies:** `jose`, `bcryptjs`, Prisma `User` model

---

#### MODULE: `users`
**Function:** User account management, dynamic permission assignment

```
src/
├── app/dashboard/users/
│   ├── page.tsx                — User list (table + search)
│   ├── new/
│   │   └── page.tsx            — Create new user form
│   └── [id]/
│       └── page.tsx            — Detail + edit form + dynamic permission grant
├── actions/users/
│   ├── getUsers.ts
│   ├── createUser.ts
│   ├── updateUser.ts
│   ├── deleteUser.ts
│   └── updatePermissions.ts
└── components/users/
    ├── UserTable.tsx
    ├── UserForm.tsx
    └── PermissionEditor.tsx    — Dynamic permission grant UI
```

**Dependencies:** `auth` module (session + permission check), Prisma `User` model

---

#### MODULE: `products`
**Function:** Product CRUD, view stock by location, generate QR codes

```
src/
├── app/dashboard/products/
│   ├── page.tsx                — Product list (table, search, category filter)
│   ├── new/
│   │   └── page.tsx            — Create product form
│   └── [id]/
│       └── page.tsx            — Detail: info + stock by location + history
├── actions/products/
│   ├── getProducts.ts
│   ├── getProduct.ts
│   ├── createProduct.ts
│   ├── updateProduct.ts
│   └── deleteProduct.ts
└── components/products/
    ├── ProductTable.tsx
    ├── ProductForm.tsx
    ├── StockByLocation.tsx     — Stock breakdown table by location
    └── ProductQRCode.tsx       — Generate + display QR (using `qrcode`)
```

**Dependencies:** `auth`, `qrcode`, Prisma `Product` + `Inventory` models

---

#### MODULE: `locations`
**Function:** Warehouse location CRUD, 3D coordinate management, view stock at location

```
src/
├── app/dashboard/locations/
│   ├── page.tsx                — Location list (table + filter by status)
│   ├── new/
│   │   └── page.tsx            — Create location form (label, x, y, z, status)
│   └── [id]/
│       └── page.tsx            — Detail: inventory + location QR code
├── actions/locations/
│   ├── getLocations.ts
│   ├── getLocation.ts
│   ├── createLocation.ts
│   ├── updateLocation.ts
│   └── deleteLocation.ts
└── components/locations/
    ├── LocationTable.tsx
    ├── LocationForm.tsx
    ├── LocationInventory.tsx   — List of products currently at this location
    └── LocationQRCode.tsx
```

**Dependencies:** `auth`, `qrcode`, Prisma `Location` + `Inventory` models

---

#### MODULE: `inventory`
**Function:** Goods Receipt (IN), Goods Issue (OUT), Location Transfer (TRANSFER), history

```
src/
├── app/dashboard/
│   ├── scanner/
│   │   └── page.tsx            — QR scan → auto-fill receipt/issue form
│   └── movements/
│       └── page.tsx            — Transaction history (filter by type/date/product)
├── actions/inventory/
│   ├── createInbound.ts        — Goods Receipt: increase Inventory, write StockMovement
│   ├── createOutbound.ts       — Goods Issue: validate quantity, decrease Inventory
│   ├── createTransfer.ts       — Transfer: atomic decrease + increase
│   └── getMovements.ts         — History with pagination
└── components/inventory/
    ├── InboundForm.tsx          — Goods receipt form
    ├── OutboundForm.tsx         — Goods issue form (shows current stock)
    ├── TransferForm.tsx         — Location transfer form
    ├── MovementTable.tsx        — History table
    └── QRScanner.tsx           — Camera scanner (using `html5-qrcode`, client-only)
```

**Dependencies:** `auth`, `products`, `locations`, `html5-qrcode`, Prisma `Inventory` + `StockMovement` models

**Important note:** `createTransfer` uses Prisma `$transaction()` to ensure atomicity.

---

#### MODULE: `map`
**Function:** Visualize warehouse in 3D, view real-time status of each location

```
src/
├── app/dashboard/map/
│   └── page.tsx                — Map page (load 3D scene)
├── actions/kho/
│   └── getLocations.ts         — Already exists: fetch all locations + status + stock
└── components/kho/
    ├── WarehouseMap.tsx         — Already exists: wrapper with dynamic import
    ├── WarehouseScene.tsx       — Three.js scene (OrbitControls, lighting)
    ├── LocationBlock.tsx        — A single location cell (color by status)
    └── LocationTooltip.tsx     — Hover popup: label, goods, quantity
```

**Dependencies:** `three`, `@react-three/fiber`, `@react-three/drei`, `locations` module

**Note:** All Three.js components must have `'use client'` and be wrapped with `dynamic(() => import(...), { ssr: false })`.

---

#### MODULE: `reports`
**Function:** Dashboard KPIs, stock reports, receipt/issue reports, Excel export

```
src/
├── app/dashboard/
│   └── page.tsx                — Dashboard (KPI cards + charts)
├── actions/reports/
│   ├── getDashboardStats.ts    — Total products, total locations, today's IN/OUT
│   ├── getStockReport.ts       — Stock by product/category
│   ├── getMovementReport.ts    — Receipt/issue by day/week/month
│   └── exportReport.ts         — Generate xlsx → return Buffer
└── components/reports/
    ├── KPICard.tsx              — Card displaying a single metric
    ├── StockBarChart.tsx        — Stock bar chart (recharts)
    ├── MovementLineChart.tsx    — Receipt/issue trend line chart
    └── ExportButton.tsx         — Trigger export + download
```

**Dependencies:** `auth`, `recharts`, `xlsx`, `date-fns`, aggregated Prisma queries

---

#### MODULE: `shared`
**Function:** Shared UI components, hooks, utilities

```
src/
├── components/ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Table.tsx
│   ├── Modal.tsx
│   ├── Badge.tsx               — Display status (AVAILABLE/FULL/RESERVED)
│   ├── Sidebar.tsx             — Dashboard navigation sidebar
│   ├── PageHeader.tsx          — Page title + breadcrumb
│   └── LoadingSpinner.tsx
├── hooks/
│   ├── useToast.ts             — Wrapper for sonner
│   └── useDebounce.ts          — Search debounce
└── lib/
    ├── prisma/
    │   └── db.ts               — Prisma client singleton (already exists)
    ├── utils/
    │   ├── format.ts           — formatDate, formatNumber (using date-fns)
    │   └── cn.ts               — classnames helper (Tailwind merge)
    └── types/
        └── index.ts            — Shared TypeScript types
```

**Dependencies:** `sonner`, `date-fns`, no dependency on other modules

---

### 3.3 Full File Structure

```
smart-wms/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── middleware.ts
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── globals.css
    │   ├── (auth)/
    │   │   ├── layout.tsx
    │   │   └── login/page.tsx
    │   └── dashboard/
    │       ├── layout.tsx          ← needs to be created (sidebar + nav)
    │       ├── page.tsx            ← dashboard home
    │       ├── products/...
    │       ├── locations/...
    │       ├── map/page.tsx
    │       ├── scanner/page.tsx
    │       ├── movements/page.tsx
    │       └── users/...
    ├── actions/
    │   ├── auth/
    │   ├── users/
    │   ├── products/
    │   ├── locations/
    │   ├── inventory/
    │   └── reports/
    ├── components/
    │   ├── ui/
    │   ├── users/
    │   ├── products/
    │   ├── locations/
    │   ├── inventory/
    │   ├── kho/                ← map components
    │   └── reports/
    ├── lib/
    │   ├── auth/
    │   ├── prisma/
    │   ├── utils/
    │   └── types/
    └── generated/
        └── prisma/             ← auto-generated, do not edit manually
```

### 3.4 Suggested Build Order

Build in dependency order to avoid being blocked:

```
Sprint 1: shared + auth
  → Basic UI components (Button, Input, Table, Sidebar)
  → Complete login page
  → Dashboard layout with navigation

Sprint 2: products + locations
  → Product CRUD (no inventory yet)
  → Location CRUD
  → QR generation

Sprint 3: inventory
  → Goods Receipt form (IN)
  → Goods Issue form (OUT) with validation
  → Transaction history
  → QR Scanner integration

Sprint 4: map + reports
  → 3D Warehouse Map
  → Dashboard KPIs + charts
  → Excel Export

Sprint 5: users + permissions
  → User management (Admin only)
  → Dynamic permission UI
  → Transfer (TRANSFER) operation
```

# TECHNICAL DESIGN — Smart WMS

> Tài liệu kỹ thuật cho team phát triển. Đọc sau REQUIREMENTS.md và SPECIFICATION.md.
> Stack: Next.js 15 App Router · Tailwind CSS v4 · Prisma ORM · SQLite · Jose JWT
> Team size: 1–2 người · Timeline: ngắn · Ưu tiên: đơn giản, dễ maintain

---

## PHẦN 1 — TECH STACK

### 1.1 Stack Cốt Lõi (Giữ Nguyên)

| Công nghệ | Version | Lý do |
|-----------|---------|-------|
| **Next.js** | 15 (App Router) | Server Actions loại bỏ nhu cầu viết API riêng, giảm boilerplate đáng kể. RSC giúp trang load nhanh mà không cần thêm fetching layer. |
| **React** | 19 | Bundled với Next.js 15, không phải lựa chọn riêng. |
| **TypeScript** | 5 | Bắt lỗi sớm, Prisma generate types chính xác, IDE support tốt cho team nhỏ. |
| **Tailwind CSS** | v4 | Utility-first, không cần design system phức tạp. v4 không cần config file. |
| **Prisma ORM** | 7 | Type-safe queries, auto-generate migration, Prisma Studio để inspect DB trực tiếp. |
| **SQLite** | via libsql | Zero infrastructure cho v1. Nếu cần scale sau, migrate sang Turso (distributed libSQL) mà không đổi code. |
| **Jose** | 6 | Thuần JS (không dùng Node crypto API), hoạt động trong Edge Runtime của Next.js middleware. |
| **bcryptjs** | 3 | Password hashing an toàn, pure JS. |

### 1.2 Thư Viện Bổ Sung

#### QR Code

```
npm install html5-qrcode qrcode
npm install --save-dev @types/qrcode
```

| Thư viện | Mục đích | Lý do chọn |
|----------|----------|-----------|
| `html5-qrcode` | Scan QR qua camera / upload ảnh | API đơn giản, hỗ trợ cả mobile camera và desktop upload. Không cần WebAssembly setup. |
| `qrcode` | Generate QR image để in | Zero deps, output SVG/PNG/DataURL. Dùng cho trang in QR sản phẩm & vị trí. |

#### 3D Warehouse Map

```
npm install three @react-three/fiber @react-three/drei
npm install --save-dev @types/three
```

| Thư viện | Mục đích | Lý do chọn |
|----------|----------|-----------|
| `three` | WebGL rendering engine | Tiêu chuẩn cho 3D web. |
| `@react-three/fiber` | React wrapper cho Three.js | Viết 3D components như React components thông thường, không phải thao tác Three.js imperative. |
| `@react-three/drei` | Helper components | OrbitControls, Text, Html overlays — tránh viết từ đầu. |

> **Lưu ý:** Dùng `dynamic import` với `{ ssr: false }` cho toàn bộ 3D scene để tránh SSR crash.

#### Charts & Analytics

```
npm install recharts
```

| Thư viện | Mục đích | Lý do chọn |
|----------|----------|-----------|
| `recharts` | Bar, Line, Pie charts cho dashboard | React-native (không dùng D3 DOM), TypeScript support tốt, responsive mặc định. Nhẹ hơn Chart.js với React. |

#### Export & Tiện Ích

```
npm install xlsx date-fns sonner
```

| Thư viện | Mục đích | Lý do chọn |
|----------|----------|-----------|
| `xlsx` | Export báo cáo ra Excel/CSV | Library chuẩn cho Excel export, xử lý được cả CSV. |
| `date-fns` | Format ngày tháng | Tree-shakeable, không global state như moment.js. Tiếng Việt locale có sẵn. |
| `sonner` | Toast notifications | Minimal, đẹp mặc định, tích hợp với Next.js App Router không cần Provider phức tạp. |

### 1.3 Tổng Hợp dependencies

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

## PHẦN 2 — ARCHITECTURE

### 2.1 Tổng Quan Luồng Dữ Liệu

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│                                                         │
│  React Components (RSC + Client Components)             │
│  ├── Server Components: render trực tiếp từ DB          │
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

**Quy tắc chọn Server Action vs Route Handler:**
- **Server Action**: CRUD operations (form submit, mutations) — đơn giản, type-safe, không cần fetch()
- **Route Handler (`app/api/`)**: chỉ dùng khi cần streaming (QR scan real-time) hoặc webhook từ ngoài

### 2.2 API Structure

Nhóm theo domain. Tất cả đều được gọi qua Server Actions trừ trường hợp ghi chú riêng.

```
src/actions/
│
├── auth/
│   ├── login.ts          — POST: xác thực, set JWT cookie
│   └── logout.ts         — POST: xoá cookie, redirect /login
│
├── users/
│   ├── getUsers.ts       — GET: danh sách users (Admin only)
│   ├── createUser.ts     — POST: tạo user
│   ├── updateUser.ts     — PUT: cập nhật role, isActive
│   ├── deleteUser.ts     — DELETE: soft delete
│   └── updatePermissions.ts — PUT: dynamic permissions
│
├── products/
│   ├── getProducts.ts    — GET: list + search/filter
│   ├── getProduct.ts     — GET: chi tiết + tồn kho theo vị trí
│   ├── createProduct.ts  — POST: tạo sản phẩm + validate SKU unique
│   ├── updateProduct.ts  — PUT: cập nhật thông tin
│   └── deleteProduct.ts  — DELETE: kiểm tra tồn kho > 0 trước khi xoá
│
├── locations/
│   ├── getLocations.ts   — GET: danh sách + filter by status
│   ├── getLocation.ts    — GET: chi tiết + inventory hiện tại
│   ├── createLocation.ts — POST: tạo vị trí + validate toạ độ unique
│   ├── updateLocation.ts — PUT: cập nhật label/status
│   └── deleteLocation.ts — DELETE: kiểm tra còn hàng không
│
├── inventory/
│   ├── createInbound.ts  — POST: Nhập kho (IN)
│   ├── createOutbound.ts — POST: Xuất kho (OUT), validate quantity
│   ├── createTransfer.ts — POST: Chuyển vị trí (TRANSFER), atomic
│   └── getMovements.ts   — GET: lịch sử + filter by type/date/product
│
├── reports/
│   ├── getDashboardStats.ts — GET: KPI cards, tổng tồn kho
│   ├── getStockReport.ts    — GET: báo cáo tồn kho chi tiết
│   ├── getMovementReport.ts — GET: báo cáo nhập/xuất theo kỳ
│   └── exportReport.ts      — POST: generate xlsx buffer → download
│
└── scanner/
    └── resolveQR.ts      — POST: decode QR string → product/location lookup
```

### 2.3 Authentication Flow

```
[1] User nhập username + password
        │
        ▼
[2] Server Action: login.ts
    ├── Prisma: tìm user theo username
    ├── bcryptjs: compare password hash
    └── Nếu fail → trả về error message

        │ (nếu thành công)
        ▼
[3] Jose: ký JWT (HS256)
    Payload: { userId, username, role, permissions[] }
    Expires: 8 giờ
        │
        ▼
[4] Set HTTP-only cookie: wms_session=<jwt>
    Flags: HttpOnly, SameSite=Strict, Secure (production)
        │
        ▼
[5] Redirect → /dashboard

[6] Mỗi request tiếp theo:
        │
        ▼
    middleware.ts
    ├── Đọc cookie wms_session
    ├── Jose: verify + decrypt JWT
    ├── Inject user info vào request headers
    └── Nếu invalid/expired → redirect /login

[7] Logout:
    logout.ts → delete cookie → redirect /login
```

### 2.4 Middleware & RBAC

**2 lớp bảo vệ:**

```
LỚP 1 — ROUTE LEVEL (middleware.ts)
─────────────────────────────────────
Kiểm tra: có JWT hợp lệ không?
- Không có / hết hạn → /login
- Có → inject { userId, role, permissions } vào header x-user-info

Áp dụng cho: tất cả /dashboard/** routes
Không áp dụng cho: /login, /api/*, /_next/*, /favicon.ico


LỚP 2 — ACTION LEVEL (mỗi Server Action)
─────────────────────────────────────────
Kiểm tra: role có quyền thực hiện action này không?

src/lib/auth/checkPermission.ts
  └── getSession() → đọc header x-user-info
  └── hasPermission(session, requiredPermission) → boolean
  └── Nếu không có quyền → throw Error("UNAUTHORIZED")
```

**Permission check pattern trong mọi Server Action:**

```typescript
// Mẫu chuẩn cho mọi Server Action cần auth
export async function createProduct(data: CreateProductInput) {
  const session = await getSession()
  if (!hasPermission(session, 'product:create')) {
    throw new Error('UNAUTHORIZED')
  }
  // ... business logic
}
```

**Permission Map (rút gọn từ SPECIFICATION.md):**

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
permission:grant  → Admin, Head Warehouse (cho Warehouse Staff), Chief/Vice Accountant (cho Accounting Staff)

* = nếu được cấp dynamic permission
```

---

## PHẦN 3 — MODULE STRUCTURE

### 3.1 Sơ Đồ Dependency

```
           ┌──────────┐
           │  shared  │  (UI components, hooks, utils)
           └────┬─────┘
                │ (tất cả modules đều dùng)
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

### 3.2 Chi Tiết Từng Module

---

#### MODULE: `auth`
**Chức năng:** Xác thực người dùng, quản lý session JWT, kiểm tra quyền

```
src/
├── app/(auth)/
│   ├── layout.tsx              — Layout trang login (không có sidebar)
│   └── login/
│       └── page.tsx            — Trang đăng nhập
├── actions/auth/
│   ├── login.ts                — Server Action: xác thực, set cookie
│   └── logout.ts               — Server Action: xoá cookie
└── lib/auth/
    ├── session.ts              — getSession(), createSession(), deleteSession()
    ├── permissions.ts          — hasPermission(), PERMISSION_MAP constant
    └── checkPermission.ts      — Guard function dùng trong Server Actions
```

**Dependencies:** `jose`, `bcryptjs`, Prisma `User` model

---

#### MODULE: `users`
**Chức năng:** Quản lý tài khoản người dùng, phân quyền động

```
src/
├── app/dashboard/users/
│   ├── page.tsx                — Danh sách users (table + search)
│   ├── new/
│   │   └── page.tsx            — Form tạo user mới
│   └── [id]/
│       └── page.tsx            — Chi tiết + form chỉnh sửa + cấp quyền động
├── actions/users/
│   ├── getUsers.ts
│   ├── createUser.ts
│   ├── updateUser.ts
│   ├── deleteUser.ts
│   └── updatePermissions.ts
└── components/users/
    ├── UserTable.tsx
    ├── UserForm.tsx
    └── PermissionEditor.tsx    — UI cấp quyền động
```

**Dependencies:** `auth` module (session + permission check), Prisma `User` model

---

#### MODULE: `products`
**Chức năng:** CRUD sản phẩm, xem tồn kho theo vị trí, generate QR

```
src/
├── app/dashboard/products/
│   ├── page.tsx                — Danh sách sản phẩm (table, search, filter category)
│   ├── new/
│   │   └── page.tsx            — Form tạo sản phẩm
│   └── [id]/
│       └── page.tsx            — Chi tiết: info + tồn kho theo vị trí + lịch sử
├── actions/products/
│   ├── getProducts.ts
│   ├── getProduct.ts
│   ├── createProduct.ts
│   ├── updateProduct.ts
│   └── deleteProduct.ts
└── components/products/
    ├── ProductTable.tsx
    ├── ProductForm.tsx
    ├── StockByLocation.tsx     — Bảng tồn kho phân theo vị trí
    └── ProductQRCode.tsx       — Generate + hiển thị QR (dùng `qrcode`)
```

**Dependencies:** `auth`, `qrcode`, Prisma `Product` + `Inventory` models

---

#### MODULE: `locations`
**Chức năng:** CRUD vị trí kho, quản lý toạ độ 3D, xem hàng trong vị trí

```
src/
├── app/dashboard/locations/
│   ├── page.tsx                — Danh sách vị trí (table + filter by status)
│   ├── new/
│   │   └── page.tsx            — Form tạo vị trí (label, x, y, z, status)
│   └── [id]/
│       └── page.tsx            — Chi tiết: inventory + QR code vị trí
├── actions/locations/
│   ├── getLocations.ts
│   ├── getLocation.ts
│   ├── createLocation.ts
│   ├── updateLocation.ts
│   └── deleteLocation.ts
└── components/locations/
    ├── LocationTable.tsx
    ├── LocationForm.tsx
    ├── LocationInventory.tsx   — Danh sách sản phẩm đang ở vị trí này
    └── LocationQRCode.tsx
```

**Dependencies:** `auth`, `qrcode`, Prisma `Location` + `Inventory` models

---

#### MODULE: `inventory`
**Chức năng:** Nhập kho (IN), Xuất kho (OUT), Chuyển vị trí (TRANSFER), lịch sử

```
src/
├── app/dashboard/
│   ├── scanner/
│   │   └── page.tsx            — QR scan → auto-fill form nhập/xuất
│   └── movements/
│       └── page.tsx            — Lịch sử giao dịch (filter by type/date/product)
├── actions/inventory/
│   ├── createInbound.ts        — Nhập kho: tăng Inventory, ghi StockMovement
│   ├── createOutbound.ts       — Xuất kho: validate quantity, giảm Inventory
│   ├── createTransfer.ts       — Chuyển: atomic decrease + increase
│   └── getMovements.ts         — Lịch sử có pagination
└── components/inventory/
    ├── InboundForm.tsx          — Form nhập kho
    ├── OutboundForm.tsx         — Form xuất kho (hiện số lượng tồn)
    ├── TransferForm.tsx         — Form chuyển vị trí
    ├── MovementTable.tsx        — Bảng lịch sử
    └── QRScanner.tsx           — Camera scanner (dùng `html5-qrcode`, client-only)
```

**Dependencies:** `auth`, `products`, `locations`, `html5-qrcode`, Prisma `Inventory` + `StockMovement` models

**Lưu ý quan trọng:** `createTransfer` dùng Prisma `$transaction()` để đảm bảo atomicity.

---

#### MODULE: `map`
**Chức năng:** Visualize kho 3D, xem trạng thái từng vị trí real-time

```
src/
├── app/dashboard/map/
│   └── page.tsx                — Trang bản đồ (load 3D scene)
├── actions/kho/
│   └── getLocations.ts         — Đã có: lấy tất cả locations + status + tồn kho
└── components/kho/
    ├── WarehouseMap.tsx         — Đã có: wrapper với dynamic import
    ├── WarehouseScene.tsx       — Three.js scene (OrbitControls, lighting)
    ├── LocationBlock.tsx        — Một ô vị trí (màu theo status)
    └── LocationTooltip.tsx     — Popup khi hover: label, hàng, số lượng
```

**Dependencies:** `three`, `@react-three/fiber`, `@react-three/drei`, `locations` module

**Lưu ý:** Toàn bộ Three.js components phải có `'use client'` và được wrap bởi `dynamic(() => import(...), { ssr: false })`.

---

#### MODULE: `reports`
**Chức năng:** Dashboard KPIs, báo cáo tồn kho, báo cáo nhập xuất, export Excel

```
src/
├── app/dashboard/
│   └── page.tsx                — Dashboard (KPI cards + charts)
├── actions/reports/
│   ├── getDashboardStats.ts    — Tổng sản phẩm, tổng vị trí, IN/OUT hôm nay
│   ├── getStockReport.ts       — Tồn kho theo sản phẩm/category
│   ├── getMovementReport.ts    — Nhập xuất theo ngày/tuần/tháng
│   └── exportReport.ts         — Generate xlsx → trả về Buffer
└── components/reports/
    ├── KPICard.tsx              — Card hiển thị một chỉ số
    ├── StockBarChart.tsx        — Bar chart tồn kho (recharts)
    ├── MovementLineChart.tsx    — Line chart xu hướng nhập xuất
    └── ExportButton.tsx         — Trigger export + download
```

**Dependencies:** `auth`, `recharts`, `xlsx`, `date-fns`, Prisma queries tổng hợp

---

#### MODULE: `shared`
**Chức năng:** UI components dùng chung, hooks, utilities

```
src/
├── components/ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Table.tsx
│   ├── Modal.tsx
│   ├── Badge.tsx               — Hiển thị status (AVAILABLE/FULL/RESERVED)
│   ├── Sidebar.tsx             — Navigation sidebar dashboard
│   ├── PageHeader.tsx          — Tiêu đề trang + breadcrumb
│   └── LoadingSpinner.tsx
├── hooks/
│   ├── useToast.ts             — Wrapper cho sonner
│   └── useDebounce.ts          — Search debounce
└── lib/
    ├── prisma/
    │   └── db.ts               — Prisma client singleton (đã có)
    ├── utils/
    │   ├── format.ts           — formatDate, formatNumber (dùng date-fns)
    │   └── cn.ts               — classnames helper (Tailwind merge)
    └── types/
        └── index.ts            — Shared TypeScript types
```

**Dependencies:** `sonner`, `date-fns`, không phụ thuộc module khác

---

### 3.3 Cấu Trúc File Đầy Đủ

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
    │       ├── layout.tsx          ← cần tạo (sidebar + nav)
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
        └── prisma/             ← auto-generated, không edit tay
```

### 3.4 Thứ Tự Build Đề Xuất

Build theo thứ tự dependency để không bị block:

```
Sprint 1: shared + auth
  → UI components cơ bản (Button, Input, Table, Sidebar)
  → Login page hoàn chỉnh
  → Dashboard layout với navigation

Sprint 2: products + locations
  → CRUD sản phẩm (không cần tồn kho)
  → CRUD vị trí
  → QR generation

Sprint 3: inventory
  → Form nhập kho (IN)
  → Form xuất kho (OUT) với validation
  → Lịch sử giao dịch
  → QR Scanner integration

Sprint 4: map + reports
  → 3D Warehouse Map
  → Dashboard KPIs + charts
  → Export Excel

Sprint 5: users + permissions
  → User management (Admin only)
  → Dynamic permission UI
  → Transfer (TRANSFER) operation
```

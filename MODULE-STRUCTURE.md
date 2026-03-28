# MODULE STRUCTURE — Smart WMS

> Tài liệu chi tiết cấu trúc module cho developer.
> Đọc sau TECHNICAL-DESIGN.md.
> 8 modules · Next.js 15 App Router · TypeScript strict

---

## 1. SƠ ĐỒ TỔNG QUAN

### 1.1 Dependency Graph

```
                        ┌─────────────────────────────────┐
                        │           shared                 │
                        │  (UI · hooks · utils · types)    │
                        └──┬──────┬──────┬──────┬──────┬──┘
                           │      │      │      │      │
                    ┌──────┘  ┌───┘  ┌───┘  ┌───┘  ┌──┘
                    ▼         ▼      ▼      ▼      ▼
                ┌──────┐  ┌───────┐ ┌──┐  ┌────────────┐
                │ auth │  │products│ │  │  │  reports   │
                └──┬───┘  └───┬───┘ │  │  └────────────┘
                   │          │     │  │         ▲
                   ▼          ▼     │  │         │
                ┌──────┐  ┌─────────┴┐ │  ┌──────┴──────┐
                │users │  │ locations│ │  │  inventory  │
                └──────┘  └─────┬────┘ │  └──────┬──────┘
                                │      │         │
                                └──────┘         │
                                    ▼            │
                                ┌───────┐        │
                                │  map  │◄───────┘
                                └───────┘
```

### 1.2 Quy Tắc Dependency

| Quy tắc | Mô tả |
|---------|-------|
| `shared` không import module nào | Tránh circular dependency |
| `auth` chỉ import `shared` | Auth là nền tảng, không phụ thuộc domain logic |
| Domain modules import `auth` để guard | Mọi action đều qua permission check |
| `inventory` import `products` + `locations` | Cần validate product/location khi tạo movement |
| `map` import `locations` | Render 3D dựa trên location data |
| `reports` import `inventory` data | Aggregate movement data cho analytics |

---

## 2. CHI TIẾT TỪNG MODULE

---

### MODULE 1: `auth`

**Chức năng chính:** Xác thực người dùng, tạo/huỷ session JWT, cung cấp permission guard cho toàn hệ thống.

#### Files

```
src/
├── app/(auth)/
│   ├── layout.tsx                    — Layout không có sidebar (chỉ cho trang login)
│   └── login/
│       └── page.tsx                  — Trang đăng nhập, gọi loginAction
│
├── actions/auth/
│   ├── login.ts                      — Xác thực username/password, set JWT cookie
│   └── logout.ts                     — Xoá cookie wms_session, redirect /login
│
└── lib/auth/
    ├── session.ts                    — getSession() · createSession() · deleteSession()
    ├── permissions.ts                — PERMISSION_MAP · hasPermission() · Permission type
    └── checkPermission.ts            — requirePermission() guard dùng trong Server Actions
```

#### Types

```typescript
// lib/auth/session.ts
type SessionPayload = {
  userId: string
  username: string
  role: Role
  permissions: Permission[]   // dynamic permissions được cấp bởi manager
  iat: number
  exp: number
}

// lib/auth/permissions.ts
type Permission =
  | 'product:create' | 'product:edit' | 'product:delete'
  | 'location:create' | 'location:edit' | 'location:delete'
  | 'inventory:in' | 'inventory:out' | 'inventory:transfer'
  | 'report:view' | 'report:export'
  | 'user:manage' | 'permission:grant'

type Role =
  | 'ADMIN' | 'DIRECTOR' | 'VICE_DIRECTOR'
  | 'HEAD_WAREHOUSE' | 'WAREHOUSE_STAFF'
  | 'OFFICE_STAFF'
  | 'CHIEF_ACCOUNTANT' | 'VICE_ACCOUNTANT' | 'ACCOUNTING_STAFF'
  | 'SALES_STAFF'
```

#### Input / Output

| | Input | Output |
|--|-------|--------|
| `login.ts` | `{ username, password }` | `void` (set cookie) hoặc `{ error: string }` |
| `logout.ts` | — | `void` (xoá cookie, redirect) |
| `getSession()` | — | `SessionPayload \| null` |
| `hasPermission()` | `(session, permission)` | `boolean` |
| `requirePermission()` | `(permission)` | `SessionPayload` hoặc throw `UNAUTHORIZED` |

#### Dependencies

- **Thư viện:** `jose` (JWT sign/verify), `bcryptjs` (password compare)
- **Prisma model:** `User`
- **Module:** `shared` (types)

---

### MODULE 2: `users`

**Chức năng chính:** Quản lý tài khoản (CRUD), gán role, cấp/thu hồi dynamic permissions.

#### Files

```
src/
├── app/dashboard/users/
│   ├── page.tsx                      — Danh sách users: table + search + filter role
│   ├── new/
│   │   └── page.tsx                  — Form tạo user mới
│   └── [id]/
│       └── page.tsx                  — Chi tiết: form edit + PermissionEditor
│
├── actions/users/
│   ├── getUsers.ts                   — Danh sách users, filter by role/search
│   ├── getUser.ts                    — Chi tiết một user + permissions hiện tại
│   ├── createUser.ts                 — Tạo user mới, hash password
│   ├── updateUser.ts                 — Cập nhật role, isActive
│   ├── deleteUser.ts                 — Soft delete (không xoá khỏi DB)
│   └── updatePermissions.ts          — Cập nhật dynamic permissions cho user
│
└── components/users/
    ├── UserTable.tsx                 — Table: username, role, status, actions
    ├── UserForm.tsx                  — Form: username, password, role (controlled)
    ├── RoleBadge.tsx                 — Badge hiển thị role với màu tương ứng
    └── PermissionEditor.tsx          — Checkbox list cấp quyền động (role-aware)
```

#### Types

```typescript
// actions/users/getUsers.ts
type UserListItem = {
  id: string
  username: string
  role: Role
  isActive: boolean
  createdAt: Date
}

// actions/users/getUser.ts
type UserDetail = UserListItem & {
  permissions: Permission[]
}

// actions/users/createUser.ts
type CreateUserInput = {
  username: string
  password: string
  role: Role
}

// actions/users/updatePermissions.ts
type UpdatePermissionsInput = {
  userId: string
  permissions: Permission[]
}
```

#### Input / Output

| Action | Input | Output |
|--------|-------|--------|
| `getUsers` | `{ search?, role? }` | `UserListItem[]` |
| `getUser` | `userId: string` | `UserDetail` |
| `createUser` | `CreateUserInput` | `{ id: string }` hoặc `{ error }` |
| `updateUser` | `{ id, role?, isActive? }` | `void` hoặc `{ error }` |
| `deleteUser` | `userId: string` | `void` hoặc `{ error }` |
| `updatePermissions` | `UpdatePermissionsInput` | `void` hoặc `{ error }` |

#### Dependencies

- **Module:** `auth` (requirePermission, SessionPayload, Role, Permission)
- **Module:** `shared` (UserTable, UserForm, Badge, Button)
- **Prisma model:** `User`

---

### MODULE 3: `products`

**Chức năng chính:** CRUD sản phẩm, tìm kiếm/lọc theo category, xem tồn kho phân theo vị trí, generate QR code SKU.

#### Files

```
src/
├── app/dashboard/products/
│   ├── page.tsx                      — List: table + search SKU/tên + filter category
│   ├── new/
│   │   └── page.tsx                  — Form tạo sản phẩm mới
│   └── [id]/
│       └── page.tsx                  — Chi tiết: info + StockByLocation + lịch sử gần đây
│
├── actions/products/
│   ├── getProducts.ts                — List với search + pagination
│   ├── getProduct.ts                 — Chi tiết + tồn kho theo từng vị trí
│   ├── createProduct.ts              — Tạo mới, validate SKU unique
│   ├── updateProduct.ts              — Cập nhật thông tin (không đổi SKU)
│   └── deleteProduct.ts              — Xoá: chặn nếu còn tồn kho > 0
│
└── components/products/
    ├── ProductTable.tsx              — Table: SKU, tên, category, unit, tổng tồn kho
    ├── ProductForm.tsx               — Form: SKU, name, description, category, unit
    ├── StockByLocation.tsx           — Table: vị trí | số lượng | status vị trí
    └── ProductQRCode.tsx             — QR từ SKU: hiển thị + nút in (dùng `qrcode`)
```

#### Types

```typescript
// actions/products/getProducts.ts
type ProductListItem = {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  totalStock: number            // sum(inventory.quantity)
}

// actions/products/getProduct.ts
type ProductDetail = ProductListItem & {
  description: string | null
  stockByLocation: {
    locationId: string
    locationLabel: string
    quantity: number
    locationStatus: LocationStatus
  }[]
  recentMovements: MovementSummary[]
}

// actions/products/createProduct.ts
type CreateProductInput = {
  sku: string
  name: string
  description?: string
  category: string
  unit: string
}
```

#### Input / Output

| Action | Input | Output |
|--------|-------|--------|
| `getProducts` | `{ search?, category?, page? }` | `{ items: ProductListItem[], total: number }` |
| `getProduct` | `productId: string` | `ProductDetail` |
| `createProduct` | `CreateProductInput` | `{ id: string }` hoặc `{ error }` |
| `updateProduct` | `{ id } & Partial<CreateProductInput>` | `void` hoặc `{ error }` |
| `deleteProduct` | `productId: string` | `void` hoặc `{ error: 'HAS_STOCK' \| ... }` |

#### Dependencies

- **Module:** `auth` (requirePermission)
- **Module:** `shared` (Table, Form components, Badge, Button)
- **Thư viện:** `qrcode` (generate QR image từ SKU string)
- **Prisma models:** `Product`, `Inventory`, `StockMovement`

---

### MODULE 4: `locations`

**Chức năng chính:** CRUD vị trí kho với toạ độ 3D (x, y, z), quản lý trạng thái, xem hàng đang chứa, generate QR code vị trí.

#### Files

```
src/
├── app/dashboard/locations/
│   ├── page.tsx                      — List: table + filter by status (AVAILABLE/FULL/RESERVED)
│   ├── new/
│   │   └── page.tsx                  — Form tạo vị trí (label, x, y, z, status)
│   └── [id]/
│       └── page.tsx                  — Chi tiết: LocationInventory + QR code
│
├── actions/locations/
│   ├── getLocations.ts               — List + filter status + include tổng tồn kho
│   ├── getLocation.ts                — Chi tiết + inventory hiện tại
│   ├── createLocation.ts             — Tạo mới, validate (x,y,z) unique + label unique
│   ├── updateLocation.ts             — Cập nhật label hoặc status (manual override)
│   └── deleteLocation.ts             — Xoá: chặn nếu còn hàng
│
└── components/locations/
    ├── LocationTable.tsx             — Table: label, toạ độ, status badge, tổng hàng
    ├── LocationForm.tsx              — Form: label, x (int), y (int), z (int), status
    ├── LocationInventory.tsx         — Table: sản phẩm | SKU | số lượng trong vị trí này
    ├── LocationQRCode.tsx            — QR từ locationId/label: hiển thị + in
    └── StatusBadge.tsx               — Badge màu cho AVAILABLE/FULL/RESERVED
```

#### Types

```typescript
// actions/locations/getLocations.ts
type LocationListItem = {
  id: string
  label: string
  x: number
  y: number
  z: number
  status: LocationStatus          // 'AVAILABLE' | 'FULL' | 'RESERVED'
  totalStock: number
}

// actions/locations/getLocation.ts
type LocationDetail = LocationListItem & {
  inventory: {
    productId: string
    productName: string
    sku: string
    quantity: number
  }[]
}

type LocationStatus = 'AVAILABLE' | 'FULL' | 'RESERVED'

// actions/locations/createLocation.ts
type CreateLocationInput = {
  label: string
  x: number
  y: number
  z: number
  status?: LocationStatus
}
```

#### Input / Output

| Action | Input | Output |
|--------|-------|--------|
| `getLocations` | `{ status?, includeStock? }` | `LocationListItem[]` |
| `getLocation` | `locationId: string` | `LocationDetail` |
| `createLocation` | `CreateLocationInput` | `{ id: string }` hoặc `{ error }` |
| `updateLocation` | `{ id, label?, status? }` | `void` hoặc `{ error }` |
| `deleteLocation` | `locationId: string` | `void` hoặc `{ error: 'HAS_STOCK' \| ... }` |

#### Dependencies

- **Module:** `auth` (requirePermission)
- **Module:** `shared` (Table, Form, Badge, Button)
- **Thư viện:** `qrcode`
- **Prisma models:** `Location`, `Inventory`

---

### MODULE 5: `inventory`

**Chức năng chính:** Nhập kho (IN), Xuất kho (OUT), Chuyển vị trí (TRANSFER), xem lịch sử giao dịch, QR scan để auto-fill form.

#### Files

```
src/
├── app/dashboard/
│   ├── scanner/
│   │   └── page.tsx                  — Camera scan QR → hiển thị InboundForm/OutboundForm
│   └── movements/
│       └── page.tsx                  — Lịch sử: filter type/date/product/location + pagination
│
├── actions/inventory/
│   ├── createInbound.ts              — IN: upsert Inventory (+qty), insert StockMovement, cập nhật location status
│   ├── createOutbound.ts             — OUT: validate qty ≤ tồn kho, giảm Inventory, insert StockMovement
│   ├── createTransfer.ts             — TRANSFER: Prisma $transaction (OUT nguồn + IN đích), insert 2 StockMovements
│   ├── getMovements.ts               — Lịch sử với filter + pagination
│   └── getStockAtLocation.ts         — Lấy tồn kho của product tại một location (dùng trong OutboundForm)
│
└── components/inventory/
    ├── QRScanner.tsx                 — 'use client' · html5-qrcode · gọi resolveQR action
    ├── InboundForm.tsx               — Form: product (search), location (search), quantity, note
    ├── OutboundForm.tsx              — Form: product, location, quantity + hiện tồn kho hiện tại
    ├── TransferForm.tsx              — Form: product, from location, to location, quantity
    ├── MovementTable.tsx             — Table: type badge | product | location | qty | user | time
    └── MovementTypeFilter.tsx        — Tab/select filter: ALL / IN / OUT / TRANSFER
```

#### Types

```typescript
// actions/inventory/createInbound.ts
type CreateInboundInput = {
  productId: string
  locationId: string
  quantity: number
  note?: string
}

// actions/inventory/createOutbound.ts
type CreateOutboundInput = {
  productId: string
  locationId: string
  quantity: number
  note?: string
}

// actions/inventory/createTransfer.ts
type CreateTransferInput = {
  productId: string
  fromLocationId: string
  toLocationId: string
  quantity: number
  note?: string
}

// actions/inventory/getMovements.ts
type MovementFilter = {
  type?: 'IN' | 'OUT' | 'TRANSFER'
  productId?: string
  locationId?: string
  fromDate?: Date
  toDate?: Date
  page?: number
  pageSize?: number
}

type MovementItem = {
  id: string
  type: 'IN' | 'OUT' | 'TRANSFER'
  quantity: number
  product: { id: string; name: string; sku: string }
  location: { id: string; label: string }
  fromLocation?: { id: string; label: string }   // chỉ có khi TRANSFER
  user: { id: string; username: string }
  note: string | null
  createdAt: Date
}
```

#### Input / Output

| Action | Input | Output |
|--------|-------|--------|
| `createInbound` | `CreateInboundInput` | `{ movementId: string }` hoặc `{ error }` |
| `createOutbound` | `CreateOutboundInput` | `{ movementId: string }` hoặc `{ error: 'INSUFFICIENT_STOCK' \| ... }` |
| `createTransfer` | `CreateTransferInput` | `{ movementId: string }` hoặc `{ error }` |
| `getMovements` | `MovementFilter` | `{ items: MovementItem[], total: number }` |
| `getStockAtLocation` | `{ productId, locationId }` | `{ quantity: number }` |

#### Business Rules

- OUT: `quantity ≤ inventory.quantity` tại location — nếu không đủ → trả lỗi `INSUFFICIENT_STOCK`
- TRANSFER: dùng `prisma.$transaction()` — nếu một bên fail thì rollback cả hai
- Sau mỗi IN/OUT/TRANSFER: auto-update `location.status` dựa trên tổng tồn kho mới
- Mọi giao dịch đều ghi `StockMovement` với `userId` từ session

#### Dependencies

- **Module:** `auth` (requirePermission, getSession cho userId)
- **Module:** `products` (search/validate product)
- **Module:** `locations` (search/validate location)
- **Module:** `shared` (Form, Table, Button, Input)
- **Thư viện:** `html5-qrcode` (QRScanner component)
- **Prisma models:** `Inventory`, `StockMovement`, `Location`

---

### MODULE 6: `map`

**Chức năng chính:** Hiển thị kho 3D (WebGL), visualize trạng thái từng vị trí bằng màu sắc, tooltip khi hover.

#### Files

```
src/
├── app/dashboard/map/
│   └── page.tsx                      — Load WarehouseMap (dynamic, ssr:false) + fetch locations
│
├── actions/kho/
│   └── getLocations.ts               — Lấy tất cả locations với status + tồn kho (đã có)
│
└── components/kho/
    ├── WarehouseMap.tsx              — dynamic import wrapper (ssr: false) — đã có
    ├── WarehouseScene.tsx            — 'use client' · Canvas · OrbitControls · lighting setup
    ├── LocationBlock.tsx             — Một ô 3D: Box mesh, màu theo status, onClick handler
    ├── LocationTooltip.tsx           — Html overlay (drei) khi hover: label, sản phẩm, số lượng
    └── MapLegend.tsx                 — Chú thích màu: xanh=AVAILABLE, đỏ=FULL, vàng=RESERVED
```

#### Types

```typescript
// Dùng LocationListItem từ module locations
type LocationListItem = {
  id: string
  label: string
  x: number                   // trục X trong scene 3D
  y: number                   // trục Y (chiều cao tầng)
  z: number                   // trục Z
  status: LocationStatus
  totalStock: number
}

// Props nội bộ
type LocationBlockProps = {
  location: LocationListItem
  onSelect: (location: LocationListItem) => void
  isSelected: boolean
}
```

#### Input / Output

| Component/Action | Input | Output |
|-----------------|-------|--------|
| `page.tsx` | — (fetch server-side) | Render `<WarehouseMap locations={...} />` |
| `WarehouseScene` | `locations: LocationListItem[]` | WebGL 3D scene |
| `LocationBlock` | `LocationBlockProps` | Một ô box 3D |
| `LocationTooltip` | `location: LocationListItem` | HTML overlay popup |

#### Màu sắc theo Status

| Status | Màu | Three.js color |
|--------|-----|----------------|
| `AVAILABLE` | Xanh lá | `#22c55e` |
| `FULL` | Đỏ | `#ef4444` |
| `RESERVED` | Vàng | `#eab308` |

#### Dependencies

- **Module:** `locations` (getLocations action, LocationListItem type)
- **Module:** `shared` (MapLegend dùng Badge)
- **Thư viện:** `three`, `@react-three/fiber`, `@react-three/drei`
- **Lưu ý:** Tất cả components trong `components/kho/` đều cần `'use client'`

---

### MODULE 7: `reports`

**Chức năng chính:** Dashboard KPI cards, charts tồn kho & nhập xuất, báo cáo chi tiết, export Excel/CSV.

#### Files

```
src/
├── app/dashboard/
│   └── page.tsx                      — Dashboard home: KPIs + StockBarChart + MovementLineChart
│
├── actions/reports/
│   ├── getDashboardStats.ts          — KPI: tổng SP, tổng vị trí, IN/OUT hôm nay, cảnh báo tồn thấp
│   ├── getStockReport.ts             — Tồn kho chi tiết: theo product, theo category, theo location
│   ├── getMovementReport.ts          — Nhập xuất: group by ngày/tuần/tháng, filter date range
│   └── exportReport.ts               — Generate xlsx Buffer → stream download
│
└── components/reports/
    ├── KPICard.tsx                   — Card: icon + label + value + trend indicator
    ├── KPIGrid.tsx                   — Grid 4 cột chứa các KPICard
    ├── StockBarChart.tsx             — Recharts BarChart: tồn kho top 10 sản phẩm
    ├── MovementLineChart.tsx         — Recharts LineChart: IN vs OUT theo ngày
    ├── StockReportTable.tsx          — Table chi tiết tồn kho (sortable)
    └── ExportButton.tsx              — Button trigger export, gọi exportReport action
```

#### Types

```typescript
// actions/reports/getDashboardStats.ts
type DashboardStats = {
  totalProducts: number
  totalLocations: number
  availableLocations: number
  inboundToday: number
  outboundToday: number
  lowStockAlerts: number            // products có totalStock < minStockLevel (v1.1)
}

// actions/reports/getStockReport.ts
type StockReportItem = {
  productId: string
  sku: string
  productName: string
  category: string
  unit: string
  totalStock: number
  locationCount: number             // số vị trí đang chứa sản phẩm này
}

// actions/reports/getMovementReport.ts
type MovementReportFilter = {
  groupBy: 'day' | 'week' | 'month'
  fromDate: Date
  toDate: Date
  type?: 'IN' | 'OUT'
}

type MovementReportPoint = {
  date: string                      // ISO date string cho trục X
  inbound: number
  outbound: number
}
```

#### Input / Output

| Action | Input | Output |
|--------|-------|--------|
| `getDashboardStats` | — | `DashboardStats` |
| `getStockReport` | `{ category?, search? }` | `StockReportItem[]` |
| `getMovementReport` | `MovementReportFilter` | `MovementReportPoint[]` |
| `exportReport` | `{ type: 'stock' \| 'movement', filter? }` | `Buffer` (xlsx) |

#### Dependencies

- **Module:** `auth` (requirePermission: `report:view`, `report:export`)
- **Module:** `shared` (KPICard, Button, Badge)
- **Module:** `inventory` (aggregate từ StockMovement)
- **Thư viện:** `recharts`, `xlsx`, `date-fns`
- **Prisma models:** `Product`, `Inventory`, `StockMovement`, `Location`

---

### MODULE 8: `shared`

**Chức năng chính:** UI primitives dùng chung, hooks tái sử dụng, utility functions, TypeScript types toàn hệ thống. **Không import module domain nào.**

#### Files

```
src/
├── components/ui/
│   ├── Button.tsx                    — variant: primary|secondary|danger|ghost · size: sm|md|lg
│   ├── Input.tsx                     — text input với label, error state, helper text
│   ├── Select.tsx                    — dropdown với options array hoặc children
│   ├── Textarea.tsx                  — multiline input
│   ├── Table.tsx                     — generic table: columns config + data array
│   ├── Pagination.tsx                — prev/next + page numbers, nhận page + total + onChange
│   ├── Modal.tsx                     — dialog overlay với backdrop, title, children, onClose
│   ├── Badge.tsx                     — inline badge: variant dựa trên string value
│   ├── Spinner.tsx                   — loading indicator (inline hoặc fullpage)
│   ├── EmptyState.tsx                — placeholder khi list rỗng (icon + message + optional CTA)
│   ├── Sidebar.tsx                   — 'use client' · navigation links · active state · logout
│   ├── DashboardLayout.tsx           — Sidebar + main content area layout
│   └── PageHeader.tsx                — h1 + optional breadcrumb + optional action button slot
│
├── hooks/
│   ├── useToast.ts                   — wrap sonner toast() với preset types (success/error/info)
│   ├── useDebounce.ts                — debounce value, dùng cho search inputs
│   └── useLocalStorage.ts            — persist state to localStorage (dùng cho map camera state)
│
└── lib/
    ├── prisma/
    │   └── db.ts                     — PrismaClient singleton (đã có)
    ├── auth/
    │   ├── session.ts                — (định nghĩa tại module auth, re-export ở đây nếu cần)
    │   ├── permissions.ts
    │   └── checkPermission.ts
    ├── utils/
    │   ├── format.ts                 — formatDate() · formatNumber() · formatQuantity()
    │   ├── cn.ts                     — classnames merge helper (clsx + tailwind-merge)
    │   └── error.ts                  — parseActionError() · ActionError type
    └── types/
        └── index.ts                  — re-export tất cả shared types
```

#### Types Dùng Chung (`lib/types/index.ts`)

```typescript
// Prisma enums
export type LocationStatus = 'AVAILABLE' | 'FULL' | 'RESERVED'
export type MovementType = 'IN' | 'OUT' | 'TRANSFER'
export type Role = /* ... 10 roles ... */
export type Permission = /* ... 14 permissions ... */

// Action response wrapper
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

// Common pagination
export type PaginationParams = {
  page: number
  pageSize: number
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// Movement summary (dùng trong product detail)
export type MovementSummary = {
  id: string
  type: MovementType
  quantity: number
  createdAt: Date
  location: { label: string }
  user: { username: string }
}
```

#### UI Component API Summary

| Component | Props chính |
|-----------|-------------|
| `Button` | `variant`, `size`, `loading`, `onClick`, `type` |
| `Input` | `label`, `error`, `helperText`, ...input attrs |
| `Table` | `columns: Column<T>[]`, `data: T[]`, `loading` |
| `Pagination` | `page`, `total`, `pageSize`, `onChange` |
| `Modal` | `open`, `onClose`, `title`, `children` |
| `Badge` | `value: string`, `colorMap?: Record<string, string>` |
| `PageHeader` | `title`, `breadcrumb?`, `action?: ReactNode` |

#### Dependencies

- **Thư viện:** `sonner`, `date-fns`
- **Không import module domain nào**

---

## 3. FOLDER STRUCTURE TOÀN PROJECT

```
smart-wms/
│
├── REQUIREMENTS.md
├── SPECIFICATION.md
├── TECHNICAL-DESIGN.md
├── MODULE-STRUCTURE.md
├── CLAUDE.md
├── AGENTS.md
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── next-env.d.ts
├── prisma.config.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
└── src/
    │
    ├── middleware.ts                         ← JWT verify + RBAC route guard
    │
    ├── app/
    │   ├── layout.tsx                        ← Root layout (fonts, sonner Toaster)
    │   ├── page.tsx                          ← Redirect → /login
    │   ├── globals.css
    │   │
    │   ├── (auth)/                           ← Route group: không có sidebar
    │   │   ├── layout.tsx
    │   │   └── login/
    │   │       └── page.tsx
    │   │
    │   └── dashboard/                        ← Protected routes
    │       ├── layout.tsx                    ← DashboardLayout (sidebar + content)
    │       ├── page.tsx                      ← Dashboard home (KPIs + charts)
    │       │
    │       ├── products/
    │       │   ├── page.tsx                  ← Product list
    │       │   ├── new/
    │       │   │   └── page.tsx              ← Create product
    │       │   └── [id]/
    │       │       └── page.tsx              ← Product detail
    │       │
    │       ├── locations/
    │       │   ├── page.tsx                  ← Location list
    │       │   ├── new/
    │       │   │   └── page.tsx              ← Create location
    │       │   └── [id]/
    │       │       └── page.tsx              ← Location detail
    │       │
    │       ├── map/
    │       │   └── page.tsx                  ← 3D Warehouse Map
    │       │
    │       ├── scanner/
    │       │   └── page.tsx                  ← QR Scanner + IN/OUT forms
    │       │
    │       ├── movements/
    │       │   └── page.tsx                  ← Movement history
    │       │
    │       └── users/                        ← Admin only
    │           ├── page.tsx                  ← User list
    │           ├── new/
    │           │   └── page.tsx              ← Create user
    │           └── [id]/
    │               └── page.tsx              ← User detail + permission editor
    │
    ├── actions/                              ← Server Actions (no 'use client')
    │   ├── auth/
    │   │   ├── login.ts
    │   │   └── logout.ts
    │   ├── users/
    │   │   ├── getUsers.ts
    │   │   ├── getUser.ts
    │   │   ├── createUser.ts
    │   │   ├── updateUser.ts
    │   │   ├── deleteUser.ts
    │   │   └── updatePermissions.ts
    │   ├── products/
    │   │   ├── getProducts.ts
    │   │   ├── getProduct.ts
    │   │   ├── createProduct.ts
    │   │   ├── updateProduct.ts
    │   │   └── deleteProduct.ts
    │   ├── locations/
    │   │   ├── getLocations.ts               ← dùng bởi cả locations module và map module
    │   │   ├── getLocation.ts
    │   │   ├── createLocation.ts
    │   │   ├── updateLocation.ts
    │   │   └── deleteLocation.ts
    │   ├── inventory/
    │   │   ├── createInbound.ts
    │   │   ├── createOutbound.ts
    │   │   ├── createTransfer.ts
    │   │   ├── getMovements.ts
    │   │   └── getStockAtLocation.ts
    │   └── reports/
    │       ├── getDashboardStats.ts
    │       ├── getStockReport.ts
    │       ├── getMovementReport.ts
    │       └── exportReport.ts
    │
    ├── components/
    │   ├── ui/                               ← shared module UI primitives
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Select.tsx
    │   │   ├── Textarea.tsx
    │   │   ├── Table.tsx
    │   │   ├── Pagination.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Spinner.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── DashboardLayout.tsx
    │   │   └── PageHeader.tsx
    │   ├── users/
    │   │   ├── UserTable.tsx
    │   │   ├── UserForm.tsx
    │   │   ├── RoleBadge.tsx
    │   │   └── PermissionEditor.tsx
    │   ├── products/
    │   │   ├── ProductTable.tsx
    │   │   ├── ProductForm.tsx
    │   │   ├── StockByLocation.tsx
    │   │   └── ProductQRCode.tsx
    │   ├── locations/
    │   │   ├── LocationTable.tsx
    │   │   ├── LocationForm.tsx
    │   │   ├── LocationInventory.tsx
    │   │   ├── LocationQRCode.tsx
    │   │   └── StatusBadge.tsx
    │   ├── inventory/
    │   │   ├── QRScanner.tsx                 ← 'use client' · html5-qrcode
    │   │   ├── InboundForm.tsx
    │   │   ├── OutboundForm.tsx
    │   │   ├── TransferForm.tsx
    │   │   ├── MovementTable.tsx
    │   │   └── MovementTypeFilter.tsx
    │   ├── kho/                              ← map module components
    │   │   ├── WarehouseMap.tsx              ← dynamic import wrapper
    │   │   ├── WarehouseScene.tsx            ← 'use client' · three.js scene
    │   │   ├── LocationBlock.tsx             ← 'use client' · Box mesh
    │   │   ├── LocationTooltip.tsx           ← 'use client' · drei Html overlay
    │   │   └── MapLegend.tsx
    │   └── reports/
    │       ├── KPICard.tsx
    │       ├── KPIGrid.tsx
    │       ├── StockBarChart.tsx             ← 'use client' · recharts
    │       ├── MovementLineChart.tsx         ← 'use client' · recharts
    │       ├── StockReportTable.tsx
    │       └── ExportButton.tsx
    │
    ├── lib/
    │   ├── prisma/
    │   │   └── db.ts                         ← PrismaClient singleton
    │   ├── auth/
    │   │   ├── session.ts
    │   │   ├── permissions.ts
    │   │   └── checkPermission.ts
    │   ├── utils/
    │   │   ├── format.ts
    │   │   ├── cn.ts
    │   │   └── error.ts
    │   └── types/
    │       └── index.ts
    │
    ├── hooks/
    │   ├── useToast.ts
    │   ├── useDebounce.ts
    │   └── useLocalStorage.ts
    │
    └── generated/
        └── prisma/                           ← auto-generated, KHÔNG edit tay
```

---

## 4. CROSS-MODULE COMMUNICATION

### 4.1 Cách modules giao tiếp

Tất cả communication đều qua **function calls trực tiếp** (không qua HTTP) nhờ Next.js Server Actions chạy trên server:

```
Page (RSC) → import action → action gọi Prisma trực tiếp
                           → action import lib/auth/checkPermission
                           → action import types từ lib/types
```

Không có message queue, không có event bus, không có REST giữa modules nội bộ.

### 4.2 Shared Data Points

| Data | Được dùng bởi |
|------|--------------|
| `LocationListItem` | `locations`, `map`, `inventory` (form dropdowns) |
| `ProductListItem` | `products`, `inventory` (form dropdowns), `reports` |
| `SessionPayload` | Mọi module qua `requirePermission()` |
| `MovementType` (IN/OUT/TRANSFER) | `inventory`, `reports`, `shared/types` |
| `LocationStatus` (AVAILABLE/FULL/RESERVED) | `locations`, `map`, `shared/types` |

### 4.3 Action Return Convention

Tất cả mutations dùng `ActionResult<T>` để xử lý lỗi nhất quán:

```typescript
// Pattern chuẩn cho mọi mutation action
export async function createProduct(data: CreateProductInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('product:create')
    // ... logic
    return { success: true, data: { id: product.id } }
  } catch (e) {
    return { success: false, error: parseActionError(e) }
  }
}
```

# MODULE STRUCTURE — Smart WMS

> Detailed module structure document for developers.
> Read after TECHNICAL-DESIGN.md.
> 8 modules · Next.js 15 App Router · TypeScript strict

---

## 1. OVERVIEW DIAGRAM

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

### 1.2 Dependency Rules

| Rule | Description |
|---------|-------|
| `shared` does not import any module | Prevents circular dependencies |
| `auth` only imports `shared` | Auth is the foundation, does not depend on domain logic |
| Domain modules import `auth` for guards | Every action goes through a permission check |
| `inventory` imports `products` + `locations` | Needs to validate product/location when creating a movement |
| `map` imports `locations` | 3D rendering is based on location data |
| `reports` imports `inventory` data | Aggregates movement data for analytics |

---

## 2. MODULE DETAILS

---

### MODULE 1: `auth`

**Main function:** User authentication, create/destroy JWT session, provide permission guard for the entire system.

#### Files

```
src/
├── app/(auth)/
│   ├── layout.tsx                    — Layout without sidebar (login page only)
│   └── login/
│       └── page.tsx                  — Login page, calls loginAction
│
├── actions/auth/
│   ├── login.ts                      — Authenticate username/password, set JWT cookie
│   └── logout.ts                     — Delete cookie wms_session, redirect /login
│
└── lib/auth/
    ├── session.ts                    — getSession() · createSession() · deleteSession()
    ├── permissions.ts                — PERMISSION_MAP · hasPermission() · Permission type
    └── checkPermission.ts            — requirePermission() guard used in Server Actions
```

#### Types

```typescript
// lib/auth/session.ts
type SessionPayload = {
  userId: string
  username: string
  role: Role
  permissions: Permission[]   // dynamic permissions granted by manager
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
| `login.ts` | `{ username, password }` | `void` (set cookie) or `{ error: string }` |
| `logout.ts` | — | `void` (delete cookie, redirect) |
| `getSession()` | — | `SessionPayload \| null` |
| `hasPermission()` | `(session, permission)` | `boolean` |
| `requirePermission()` | `(permission)` | `SessionPayload` or throw `UNAUTHORIZED` |

#### Dependencies

- **Libraries:** `jose` (JWT sign/verify), `bcryptjs` (password compare)
- **Prisma model:** `User`
- **Module:** `shared` (types)

---

### MODULE 2: `users`

**Main function:** Account management (CRUD), role assignment, grant/revoke dynamic permissions.

#### Files

```
src/
├── app/dashboard/users/
│   ├── page.tsx                      — User list: table + search + filter by role
│   ├── new/
│   │   └── page.tsx                  — Create new user form
│   └── [id]/
│       └── page.tsx                  — Detail: edit form + PermissionEditor
│
├── actions/users/
│   ├── getUsers.ts                   — User list, filter by role/search
│   ├── getUser.ts                    — Single user detail + current permissions
│   ├── createUser.ts                 — Create new user, hash password
│   ├── updateUser.ts                 — Update role, isActive
│   ├── deleteUser.ts                 — Soft delete (does not remove from DB)
│   └── updatePermissions.ts          — Update dynamic permissions for user
│
└── components/users/
    ├── UserTable.tsx                 — Table: username, role, status, actions
    ├── UserForm.tsx                  — Form: username, password, role (controlled)
    ├── RoleBadge.tsx                 — Badge displaying role with corresponding color
    └── PermissionEditor.tsx          — Checkbox list for granting dynamic permissions (role-aware)
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
| `createUser` | `CreateUserInput` | `{ id: string }` or `{ error }` |
| `updateUser` | `{ id, role?, isActive? }` | `void` or `{ error }` |
| `deleteUser` | `userId: string` | `void` or `{ error }` |
| `updatePermissions` | `UpdatePermissionsInput` | `void` or `{ error }` |

#### Dependencies

- **Module:** `auth` (requirePermission, SessionPayload, Role, Permission)
- **Module:** `shared` (UserTable, UserForm, Badge, Button)
- **Prisma model:** `User`

---

### MODULE 3: `products`

**Main function:** Product CRUD, search/filter by category, view stock broken down by location, generate QR code for SKU.

#### Files

```
src/
├── app/dashboard/products/
│   ├── page.tsx                      — List: table + search SKU/name + filter category
│   ├── new/
│   │   └── page.tsx                  — Create new product form
│   └── [id]/
│       └── page.tsx                  — Detail: info + StockByLocation + recent history
│
├── actions/products/
│   ├── getProducts.ts                — List with search + pagination
│   ├── getProduct.ts                 — Detail + stock breakdown by location
│   ├── createProduct.ts              — Create new, validate SKU unique
│   ├── updateProduct.ts              — Update information (SKU cannot be changed)
│   └── deleteProduct.ts              — Delete: block if stock > 0
│
└── components/products/
    ├── ProductTable.tsx              — Table: SKU, name, category, unit, total stock
    ├── ProductForm.tsx               — Form: SKU, name, description, category, unit
    ├── StockByLocation.tsx           — Table: location | quantity | location status
    └── ProductQRCode.tsx             — QR from SKU: display + print button (using `qrcode`)
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
| `createProduct` | `CreateProductInput` | `{ id: string }` or `{ error }` |
| `updateProduct` | `{ id } & Partial<CreateProductInput>` | `void` or `{ error }` |
| `deleteProduct` | `productId: string` | `void` or `{ error: 'HAS_STOCK' \| ... }` |

#### Dependencies

- **Module:** `auth` (requirePermission)
- **Module:** `shared` (Table, Form components, Badge, Button)
- **Libraries:** `qrcode` (generate QR image from SKU string)
- **Prisma models:** `Product`, `Inventory`, `StockMovement`

---

### MODULE 4: `locations`

**Main function:** Warehouse location CRUD with 3D coordinates (x, y, z), status management, view stored goods, generate location QR codes.

#### Files

```
src/
├── app/dashboard/locations/
│   ├── page.tsx                      — List: table + filter by status (AVAILABLE/FULL/RESERVED)
│   ├── new/
│   │   └── page.tsx                  — Create location form (label, x, y, z, status)
│   └── [id]/
│       └── page.tsx                  — Detail: LocationInventory + QR code
│
├── actions/locations/
│   ├── getLocations.ts               — List + filter status + include total stock
│   ├── getLocation.ts                — Detail + current inventory
│   ├── createLocation.ts             — Create new, validate (x,y,z) unique + label unique
│   ├── updateLocation.ts             — Update label or status (manual override)
│   └── deleteLocation.ts             — Delete: block if stock remains
│
└── components/locations/
    ├── LocationTable.tsx             — Table: label, coordinates, status badge, total stock
    ├── LocationForm.tsx              — Form: label, x (int), y (int), z (int), status
    ├── LocationInventory.tsx         — Table: product | SKU | quantity at this location
    ├── LocationQRCode.tsx            — QR from locationId/label: display + print
    └── StatusBadge.tsx               — Color badge for AVAILABLE/FULL/RESERVED
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
| `createLocation` | `CreateLocationInput` | `{ id: string }` or `{ error }` |
| `updateLocation` | `{ id, label?, status? }` | `void` or `{ error }` |
| `deleteLocation` | `locationId: string` | `void` or `{ error: 'HAS_STOCK' \| ... }` |

#### Dependencies

- **Module:** `auth` (requirePermission)
- **Module:** `shared` (Table, Form, Badge, Button)
- **Libraries:** `qrcode`
- **Prisma models:** `Location`, `Inventory`

---

### MODULE 5: `inventory`

**Main function:** Goods Receipt (IN), Goods Issue (OUT), Location Transfer (TRANSFER), view transaction history, QR scan to auto-fill forms.

#### Files

```
src/
├── app/dashboard/
│   ├── scanner/
│   │   └── page.tsx                  — Camera scan QR → display InboundForm/OutboundForm
│   └── movements/
│       └── page.tsx                  — History: filter type/date/product/location + pagination
│
├── actions/inventory/
│   ├── createInbound.ts              — IN: upsert Inventory (+qty), insert StockMovement, update location status
│   ├── createOutbound.ts             — OUT: validate qty ≤ stock, decrease Inventory, insert StockMovement
│   ├── createTransfer.ts             — TRANSFER: Prisma $transaction (OUT from source + IN to destination), insert 2 StockMovements
│   ├── getMovements.ts               — History with filter + pagination
│   └── getStockAtLocation.ts         — Get stock of product at a location (used in OutboundForm)
│
└── components/inventory/
    ├── QRScanner.tsx                 — 'use client' · html5-qrcode · calls resolveQR action
    ├── InboundForm.tsx               — Form: product (search), location (search), quantity, note
    ├── OutboundForm.tsx              — Form: product, location, quantity + shows current stock
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
  fromLocation?: { id: string; label: string }   // only present for TRANSFER
  user: { id: string; username: string }
  note: string | null
  createdAt: Date
}
```

#### Input / Output

| Action | Input | Output |
|--------|-------|--------|
| `createInbound` | `CreateInboundInput` | `{ movementId: string }` or `{ error }` |
| `createOutbound` | `CreateOutboundInput` | `{ movementId: string }` or `{ error: 'INSUFFICIENT_STOCK' \| ... }` |
| `createTransfer` | `CreateTransferInput` | `{ movementId: string }` or `{ error }` |
| `getMovements` | `MovementFilter` | `{ items: MovementItem[], total: number }` |
| `getStockAtLocation` | `{ productId, locationId }` | `{ quantity: number }` |

#### Business Rules

- OUT: `quantity ≤ inventory.quantity` at location — if insufficient → return `INSUFFICIENT_STOCK` error
- TRANSFER: uses `prisma.$transaction()` — if one side fails, both rollback
- After each IN/OUT/TRANSFER: auto-update `location.status` based on new total stock
- Every transaction writes a `StockMovement` with `userId` from session

#### Dependencies

- **Module:** `auth` (requirePermission, getSession for userId)
- **Module:** `products` (search/validate product)
- **Module:** `locations` (search/validate location)
- **Module:** `shared` (Form, Table, Button, Input)
- **Libraries:** `html5-qrcode` (QRScanner component)
- **Prisma models:** `Inventory`, `StockMovement`, `Location`

---

### MODULE 6: `map`

**Main function:** Display warehouse in 3D (WebGL), visualize each location's status by color, tooltip on hover.

#### Files

```
src/
├── app/dashboard/map/
│   └── page.tsx                      — Load WarehouseMap (dynamic, ssr:false) + fetch locations
│
├── actions/kho/
│   └── getLocations.ts               — Fetch all locations with status + stock (already exists)
│
└── components/kho/
    ├── WarehouseMap.tsx              — dynamic import wrapper (ssr: false) — already exists
    ├── WarehouseScene.tsx            — 'use client' · Canvas · OrbitControls · lighting setup
    ├── LocationBlock.tsx             — A single 3D cell: Box mesh, color by status, onClick handler
    ├── LocationTooltip.tsx           — Html overlay (drei) on hover: label, goods, quantity
    └── MapLegend.tsx                 — Color legend: green=AVAILABLE, red=FULL, yellow=RESERVED
```

#### Types

```typescript
// Uses LocationListItem from the locations module
type LocationListItem = {
  id: string
  label: string
  x: number                   // X axis in 3D scene
  y: number                   // Y axis (floor height)
  z: number                   // Z axis
  status: LocationStatus
  totalStock: number
}

// Internal props
type LocationBlockProps = {
  location: LocationListItem
  onSelect: (location: LocationListItem) => void
  isSelected: boolean
}
```

#### Input / Output

| Component/Action | Input | Output |
|-----------------|-------|--------|
| `page.tsx` | — (server-side fetch) | Render `<WarehouseMap locations={...} />` |
| `WarehouseScene` | `locations: LocationListItem[]` | WebGL 3D scene |
| `LocationBlock` | `LocationBlockProps` | A single 3D box cell |
| `LocationTooltip` | `location: LocationListItem` | HTML overlay popup |

#### Color by Status

| Status | Color | Three.js color |
|--------|-----|----------------|
| `AVAILABLE` | Green | `#22c55e` |
| `FULL` | Red | `#ef4444` |
| `RESERVED` | Yellow | `#eab308` |

#### Dependencies

- **Module:** `locations` (getLocations action, LocationListItem type)
- **Module:** `shared` (MapLegend uses Badge)
- **Libraries:** `three`, `@react-three/fiber`, `@react-three/drei`
- **Note:** All components in `components/kho/` require `'use client'`

---

### MODULE 7: `reports`

**Main function:** Dashboard KPI cards, stock & receipt/issue charts, detailed reports, Excel/CSV export.

#### Files

```
src/
├── app/dashboard/
│   └── page.tsx                      — Dashboard home: KPIs + StockBarChart + MovementLineChart
│
├── actions/reports/
│   ├── getDashboardStats.ts          — KPI: total products, total locations, today's IN/OUT, low stock alerts
│   ├── getStockReport.ts             — Detailed stock: by product, by category, by location
│   ├── getMovementReport.ts          — Receipt/issue: group by day/week/month, filter date range
│   └── exportReport.ts               — Generate xlsx Buffer → stream download
│
└── components/reports/
    ├── KPICard.tsx                   — Card: icon + label + value + trend indicator
    ├── KPIGrid.tsx                   — 4-column grid containing KPICards
    ├── StockBarChart.tsx             — Recharts BarChart: top 10 products by stock
    ├── MovementLineChart.tsx         — Recharts LineChart: IN vs OUT by day
    ├── StockReportTable.tsx          — Detailed stock table (sortable)
    └── ExportButton.tsx              — Button to trigger export, calls exportReport action
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
  lowStockAlerts: number            // products with totalStock < minStockLevel (v1.1)
}

// actions/reports/getStockReport.ts
type StockReportItem = {
  productId: string
  sku: string
  productName: string
  category: string
  unit: string
  totalStock: number
  locationCount: number             // number of locations currently holding this product
}

// actions/reports/getMovementReport.ts
type MovementReportFilter = {
  groupBy: 'day' | 'week' | 'month'
  fromDate: Date
  toDate: Date
  type?: 'IN' | 'OUT'
}

type MovementReportPoint = {
  date: string                      // ISO date string for X axis
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
- **Module:** `inventory` (aggregate from StockMovement)
- **Libraries:** `recharts`, `xlsx`, `date-fns`
- **Prisma models:** `Product`, `Inventory`, `StockMovement`, `Location`

---

### MODULE 8: `shared`

**Main function:** Shared UI primitives, reusable hooks, utility functions, system-wide TypeScript types. **Does not import any domain module.**

#### Files

```
src/
├── components/ui/
│   ├── Button.tsx                    — variant: primary|secondary|danger|ghost · size: sm|md|lg
│   ├── Input.tsx                     — text input with label, error state, helper text
│   ├── Select.tsx                    — dropdown with options array or children
│   ├── Textarea.tsx                  — multiline input
│   ├── Table.tsx                     — generic table: columns config + data array
│   ├── Pagination.tsx                — prev/next + page numbers, accepts page + total + onChange
│   ├── Modal.tsx                     — dialog overlay with backdrop, title, children, onClose
│   ├── Badge.tsx                     — inline badge: variant based on string value
│   ├── Spinner.tsx                   — loading indicator (inline or fullpage)
│   ├── EmptyState.tsx                — placeholder when list is empty (icon + message + optional CTA)
│   ├── Sidebar.tsx                   — 'use client' · navigation links · active state · logout
│   ├── DashboardLayout.tsx           — Sidebar + main content area layout
│   └── PageHeader.tsx                — h1 + optional breadcrumb + optional action button slot
│
├── hooks/
│   ├── useToast.ts                   — wraps sonner toast() with preset types (success/error/info)
│   ├── useDebounce.ts                — debounce value, used for search inputs
│   └── useLocalStorage.ts            — persist state to localStorage (used for map camera state)
│
└── lib/
    ├── prisma/
    │   └── db.ts                     — PrismaClient singleton (already exists)
    ├── auth/
    │   ├── session.ts                — (defined in auth module, re-exported here if needed)
    │   ├── permissions.ts
    │   └── checkPermission.ts
    ├── utils/
    │   ├── format.ts                 — formatDate() · formatNumber() · formatQuantity()
    │   ├── cn.ts                     — classnames merge helper (clsx + tailwind-merge)
    │   └── error.ts                  — parseActionError() · ActionError type
    └── types/
        └── index.ts                  — re-export all shared types
```

#### Shared Types (`lib/types/index.ts`)

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

// Movement summary (used in product detail)
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

| Component | Key Props |
|-----------|-------------|
| `Button` | `variant`, `size`, `loading`, `onClick`, `type` |
| `Input` | `label`, `error`, `helperText`, ...input attrs |
| `Table` | `columns: Column<T>[]`, `data: T[]`, `loading` |
| `Pagination` | `page`, `total`, `pageSize`, `onChange` |
| `Modal` | `open`, `onClose`, `title`, `children` |
| `Badge` | `value: string`, `colorMap?: Record<string, string>` |
| `PageHeader` | `title`, `breadcrumb?`, `action?: ReactNode` |

#### Dependencies

- **Libraries:** `sonner`, `date-fns`
- **Does not import any domain module**

---

## 3. FULL PROJECT FOLDER STRUCTURE

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
    │   ├── (auth)/                           ← Route group: no sidebar
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
    │   │   ├── getLocations.ts               ← used by both locations module and map module
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
        └── prisma/                           ← auto-generated, do NOT edit manually
```

---

## 4. CROSS-MODULE COMMUNICATION

### 4.1 How Modules Communicate

All communication happens via **direct function calls** (not HTTP) thanks to Next.js Server Actions running on the server:

```
Page (RSC) → import action → action calls Prisma directly
                           → action imports lib/auth/checkPermission
                           → action imports types from lib/types
```

No message queues, no event bus, no REST between internal modules.

### 4.2 Shared Data Points

| Data | Used by |
|------|--------------|
| `LocationListItem` | `locations`, `map`, `inventory` (form dropdowns) |
| `ProductListItem` | `products`, `inventory` (form dropdowns), `reports` |
| `SessionPayload` | Every module via `requirePermission()` |
| `MovementType` (IN/OUT/TRANSFER) | `inventory`, `reports`, `shared/types` |
| `LocationStatus` (AVAILABLE/FULL/RESERVED) | `locations`, `map`, `shared/types` |

### 4.3 Action Return Convention

All mutations use `ActionResult<T>` for consistent error handling:

```typescript
// Standard pattern for every mutation action
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

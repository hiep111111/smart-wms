# Smart WMS — Architecture

## 1. System Architecture Overview

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Client Components  (hydrated, interactive)    │   │
│  │  • QR Scanner  • 3D Map  • Charts  • Forms           │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │ fetch / form action                  │
└───────────────────────┼─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                   NEXT.JS 15 SERVER                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Middleware  (src/middleware.ts)                     │   │
│  │  • JWT verification  • Route protection  • Redirect  │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │  App Router  (src/app/)                             │   │
│  │  • Server Components (data fetch at render)         │   │
│  │  • Layouts  • Pages                                 │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │  Server Actions  (src/modules/*/actions.ts)         │   │
│  │  • Zod validation  • RBAC check  • Business logic   │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │  Prisma ORM  (src/lib/prisma.ts)                    │   │
│  │  • Query builder  • Transaction manager             │   │
│  └────────────────────┬────────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                     DATABASE                                │
│  SQLite / libsql  (dev.db)                                  │
│  • Users  • Products  • Locations                           │
│  • StockMovements  • CurrentStock  • Permissions            │
└─────────────────────────────────────────────────────────────┘
```

### Three Layers

| Layer | Technologies | Responsibility |
|-------|-------------|----------------|
| **Client** | React 19, Tailwind CSS v4, Three.js, html5-qrcode, recharts | Rendering, interactivity, QR scanning, 3D visualization |
| **Server** | Next.js 15 App Router, Server Actions, Jose JWT, Zod | Auth, RBAC, business logic, data aggregation |
| **Database** | Prisma ORM, SQLite/libsql | Persistence, constraints, atomic transactions |

### Request Lifecycle

```
1. Browser request arrives
       │
2. middleware.ts runs
   ├─ No cookie → redirect /login
   └─ Valid JWT → attach session → continue
       │
3. Server Component renders (layout → page)
   └─ Calls Prisma directly to load initial data
       │
4. User triggers mutation (form submit / button)
   └─ Server Action invoked
       ├─ Zod validates input
       ├─ getSession() verifies JWT
       ├─ hasPermission() checks RBAC
       ├─ Business logic executes
       ├─ prisma.$transaction() persists changes
       └─ revalidatePath() → return ActionResult<T>
       │
5. React re-renders with fresh server data
```

---

## 2. Frontend Architecture

### Component Hierarchy

```
RootLayout  (src/app/layout.tsx)
│
├── AuthLayout  (src/app/(auth)/layout.tsx)
│   └── LoginPage  (src/app/(auth)/login/page.tsx)
│       └── LoginForm  (src/modules/auth/components/LoginForm.tsx)  [client]
│
└── DashboardLayout  (src/app/(dashboard)/layout.tsx)
    ├── Sidebar  (src/modules/shared/components/Sidebar.tsx)  [client]
    ├── Header   (src/modules/shared/components/Header.tsx)   [client]
    │
    ├── DashboardPage   → ReportWidgets, KPICards, Charts     [mixed]
    ├── UsersPage       → UserTable, UserForm                 [mixed]
    ├── ProductsPage    → ProductTable, ProductForm, QRPanel  [mixed]
    ├── LocationsPage   → LocationTable, LocationForm         [mixed]
    ├── InventoryPage   → MovementForm, MovementHistory       [mixed]
    ├── MapPage         → WarehouseMap                        [client]
    └── ReportsPage     → ReportFilters, ExportButton         [mixed]
```

**[server]** = React Server Component (default); **[client]** = `"use client"` directive; **[mixed]** = server page wraps client sub-components.

### State Management

Smart WMS uses **no global client state library** (no Redux, Zustand, or Context for app state). Strategy by concern:

| Concern | Approach |
|---------|----------|
| Server data (lists, detail) | Server Components fetch via Prisma at render time |
| Mutation results | Server Actions return `ActionResult<T>`; `useActionState` or `useTransition` on client |
| Re-fetching after mutation | `revalidatePath()` inside Server Action invalidates Next.js cache |
| Local UI state (modals, tabs) | `useState` / `useReducer` in Client Components |
| Form state | React `useActionState` hook bound to Server Action |

### Data Fetching Pattern

```
// Server Component — direct Prisma call, no HTTP
async function ProductsPage() {
  const products = await getProducts()   // src/modules/products/queries.ts
  return <ProductTable data={products} />
}

// Client Component — calls Server Action
"use client"
async function handleSubmit(formData: FormData) {
  const result = await createProduct(formData)  // Server Action
  if (!result.success) showToast(result.error)
}
```

### Routing Structure

```
/                          → redirect to /dashboard
/login                     → (auth) group, no middleware protection
/(dashboard)/dashboard     → KPI overview
/(dashboard)/users         → user management
/(dashboard)/products      → product catalog
/(dashboard)/products/[id] → product detail + QR
/(dashboard)/locations     → location management
/(dashboard)/inventory     → IN / OUT / TRANSFER
/(dashboard)/inventory/[id]→ movement detail / approval
/(dashboard)/map           → 3D warehouse view
/(dashboard)/reports       → analytics + export
```

Middleware `matcher` covers all `/(dashboard)/(.*)` routes.

---

## 3. Backend Architecture

### API Design Pattern

Smart WMS uses **Server Actions exclusively** for all mutations and queries initiated by user interaction. There is no separate REST API layer between modules. The only traditional HTTP endpoints are:

| Route | Purpose |
|-------|---------|
| `POST /api/auth/login` | Exchange credentials for JWT cookie |
| `POST /api/auth/logout` | Clear JWT cookie |
| `GET  /api/health` | Uptime check |

All other data operations (CRUD, approvals, stock movements) go through Server Actions in `src/modules/*/actions.ts`.

### Server Action Flow

```
Client calls: createStockMovement(formData)
       │
       ▼
┌─────────────────────────────────────────────────┐
│  1. Input Validation (Zod)                      │
│     const parsed = movementSchema.safeParse()   │
│     if (!parsed.success) return { error }       │
└────────────────────────┬────────────────────────┘
                         │
┌────────────────────────▼────────────────────────┐
│  2. Session Check (Jose)                        │
│     const session = await getSession()          │
│     if (!session) redirect('/login')            │
└────────────────────────┬────────────────────────┘
                         │
┌────────────────────────▼────────────────────────┐
│  3. Permission Check (RBAC)                     │
│     const allowed = hasPermission(              │
│       session.role, session.permissions,        │
│       'inventory:create'                        │
│     )                                           │
│     if (!allowed) return { error: 'Forbidden' } │
└────────────────────────┬────────────────────────┘
                         │
┌────────────────────────▼────────────────────────┐
│  4. Business Logic                              │
│     • Validate stock availability (OUT/TRANSFER)│
│     • Determine approval requirement            │
│     • Build movement record                     │
└────────────────────────┬────────────────────────┘
                         │
┌────────────────────────▼────────────────────────┐
│  5. Prisma Transaction                          │
│     prisma.$transaction([                       │
│       createStockMovement(...),                 │
│       updateCurrentStock(...),                  │
│     ])                                          │
└────────────────────────┬────────────────────────┘
                         │
┌────────────────────────▼────────────────────────┐
│  6. Cache Invalidation + Return                 │
│     revalidatePath('/inventory')                │
│     return { success: true, data: movement }    │
└─────────────────────────────────────────────────┘
```

### Middleware Chain

```typescript
// src/middleware.ts
export const config = {
  matcher: ['/(dashboard)(.*)'],
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const session = await verifyJWT(token)   // jose verification
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Attach session to header for Server Components
  const response = NextResponse.next()
  response.headers.set('x-session', JSON.stringify(session))
  return response
}
```

### Error Handling Strategy

All Server Actions return `ActionResult<T>` — errors are **data, not exceptions**:

```typescript
type ActionResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string }
```

Rules:
- Server Actions **never throw** to the client.
- Prisma errors are caught and translated to user-readable strings.
- Unexpected errors are logged server-side and return a generic `"System error"` message.
- Client components read `result.success` to branch between success UI and error toast.

---

## 4. Database Architecture

### Entity Relationship Diagram

```
┌──────────┐       ┌──────────────────┐       ┌──────────────┐
│  User    │       │  StockMovement   │       │  Product     │
│──────────│       │──────────────────│       │──────────────│
│ id       │◄──────│ created_by (FK)  │──────►│ id           │
│ username │       │ approved_by (FK) │       │ sku (unique) │
│ password │       │ product_id  (FK) │       │ name         │
│ role     │       │ location_id (FK) │       │ unit         │
│ name     │       │ type (IN/OUT/TR) │       │ description  │
│ is_active│       │ quantity         │       │ qr_code      │
└──────────┘       │ status           │       │ created_at   │
                   │ note             │       └──────┬───────┘
                   │ created_at       │              │
                   └──────────────────┘              │
                                                     │
┌──────────────┐       ┌──────────────────┐          │
│  Location    │       │  CurrentStock    │◄─────────┘
│──────────────│       │──────────────────│
│ id           │◄──────│ product_id  (FK) │
│ code (unique)│       │ location_id (FK) │
│ name         │◄──────│ quantity         │
│ zone         │       │ updated_at       │
│ row          │       └──────────────────┘
│ col          │
│ level        │       ┌──────────────────┐
│ status       │       │  Permission      │
│ x, y, z      │       │──────────────────│
│ qr_code      │       │ id               │
└──────────────┘       │ grantor_id  (FK) │──► User
                       │ grantee_id  (FK) │──► User
                       │ permission_key   │
                       │ granted_at       │
                       └──────────────────┘
```

**Cardinalities:**
- `User` 1──N `StockMovement` (via `created_by`)
- `User` 1──N `StockMovement` (via `approved_by`, nullable)
- `Product` 1──N `StockMovement`
- `Location` 1──N `StockMovement`
- `Product` M──N `Location` via `CurrentStock` (composite PK: product_id + location_id)
- `User` 1──N `Permission` (grantor and grantee)

### Indexing Strategy

| Table | Index | Reason |
|-------|-------|--------|
| `StockMovement` | `(product_id, created_at DESC)` | Product movement history pagination |
| `StockMovement` | `(location_id, created_at DESC)` | Location movement history |
| `StockMovement` | `(status, created_at DESC)` | Pending approvals dashboard |
| `CurrentStock` | `(product_id)` | Stock level lookup by product |
| `CurrentStock` | `(location_id)` | Stock level lookup by location |
| `Product` | `sku` UNIQUE | QR scan lookup |
| `Location` | `code` UNIQUE | QR scan lookup |
| `Permission` | `(grantee_id, permission_key)` | Permission check per user |

### Transaction Patterns

**IN movement** (atomic):
```
prisma.$transaction([
  createStockMovement({ type: 'IN', ... }),
  upsertCurrentStock({ product_id, location_id, increment: quantity }),
])
```

**OUT movement** (atomic, with pre-check):
```
// Pre-check outside transaction (read)
const stock = await getCurrentStock(product_id, location_id)
if (stock.quantity < quantity) return { error: 'Không đủ tồn kho' }

// Transaction (write)
prisma.$transaction([
  createStockMovement({ type: 'OUT', ... }),
  decrementCurrentStock({ product_id, location_id, quantity }),
])
```

**TRANSFER movement** (atomic, two location updates):
```
prisma.$transaction([
  createStockMovement({ type: 'TRANSFER', from_location_id, to_location_id, ... }),
  decrementCurrentStock({ product_id, location_id: from_location_id, quantity }),
  upsertCurrentStock({ product_id, location_id: to_location_id, increment: quantity }),
])
```

---

## 5. Security Architecture

### Authentication Flow

```
1. User submits /login form
       │
2. POST /api/auth/login
   ├─ Find user by username in DB
   ├─ bcryptjs.compare(password, user.password_hash)
   └─ On failure → return 401
       │
3. Sign JWT (jose)
   payload = {
     sub: user.id,
     role: user.role,
     name: user.name,
   }
   secret = process.env.JWT_SECRET
   expiration = '8h'
       │
4. Set HttpOnly cookie
   Set-Cookie: session=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/
       │
5. Redirect to /dashboard
       │
6. Every subsequent request
   └─ middleware.ts reads cookie → verifyJWT(token)
      ├─ Expired / invalid → redirect /login + clear cookie
      └─ Valid → inject session → proceed to route
       │
7. Logout: POST /api/auth/logout
   └─ Clear session cookie → redirect /login
```

### Authorization Layers

**Layer 1 — Middleware (Route Level)**

```
/(dashboard)/users/*     → roles: ADMIN
/(dashboard)/reports/*   → roles: ADMIN, DIRECTOR, VICE_DIRECTOR,
                                   HEAD_ACCOUNTANT, VICE_ACCOUNTANT
/(dashboard)/inventory/* → roles: all warehouse + office + accounting roles
/(dashboard)/map/*       → roles: all authenticated users
```

**Layer 2 — Server Action (Operation Level)**

Each Server Action calls `hasPermission(session, actionKey)` before executing:

```
inventory:create          → warehouse staff, office staff (+ dynamic grant)
inventory:approve         → admin, director, vice_director, head_warehouse
inventory:view_all        → management + accounting roles
product:create            → admin, head_warehouse
product:edit              → admin, head_warehouse
user:manage               → admin only
report:export             → accounting + management roles
location:manage           → admin, head_warehouse
```

### RBAC Model

```
Role Groups:
┌─────────────────────────────────────────────────────────┐
│ Admin Group     │ ADMIN, DIRECTOR, VICE_DIRECTOR         │
│ Warehouse Group │ HEAD_WAREHOUSE, WAREHOUSE_STAFF        │
│ Office Group    │ OFFICE_STAFF                           │
│ Accounting Group│ CHIEF_ACCOUNTANT, VICE_ACCOUNTANT,     │
│                 │ ACCOUNTING_STAFF                       │
│ Sales Group     │ SALES_STAFF                            │
└─────────────────────────────────────────────────────────┘

Dynamic Permissions (stored in Permission table):
• HEAD_WAREHOUSE  can grant/revoke 4 permissions → WAREHOUSE_STAFF
• CHIEF_ACCOUNTANT can grant/revoke 3 permissions → ACCOUNTING_STAFF
• VICE_ACCOUNTANT  can grant/revoke 3 permissions → ACCOUNTING_STAFF

Permission check algorithm:
  hasPermission(session, key):
    1. Check role's static permission set (hardcoded map)
    2. If not in static set, query Permission table for dynamic grant
    3. Return true only if found in either
```

### Validation Layers

```
Layer 1 — HTML5 Client Validation
  • required, minLength, maxLength, pattern on <input>
  • Immediate feedback, prevents trivial bad requests

Layer 2 — Zod Client Schema (optional, for complex forms)
  • Validates before calling Server Action
  • Provides field-level error messages in UI

Layer 3 — Zod Server Schema (in every Server Action)
  • Authoritative validation; never skipped
  • Rejects malformed data even if client is bypassed

Layer 4 — Prisma Schema Constraints
  • @unique, @relation, not-null at DB level
  • Last line of defence; catches race conditions
```

---

## 6. Integration Points

### QR Scanner Integration

```
┌─────────────────────────────────────────────────────────┐
│  QRScannerModal  [client component]                     │
│                                                         │
│  1. html5-qrcode initializes camera stream              │
│     new Html5Qrcode('reader')                           │
│     .start({ facingMode: 'environment' }, config,       │
│             onScanSuccess, onScanError)                 │
│                                                         │
│  2. onScanSuccess(decodedText: string)                  │
│     └─ calls Server Action: resolveQRCode(decodedText)  │
│                                                         │
│  3. Server Action: resolveQRCode                        │
│     ├─ Try: product = findProductBySKU(decodedText)     │
│     ├─ Try: location = findLocationByCode(decodedText)  │
│     └─ Return: { type: 'product'|'location', data }     │
│                                                         │
│  4. Parent form pre-fills fields:                       │
│     • If product → set product_id in MovementForm       │
│     • If location → set location_id in MovementForm     │
│                                                         │
│  5. QR generation (display on product/location page)    │
│     qrcode.toDataURL(sku_or_code) → <img src={dataUrl}> │
└─────────────────────────────────────────────────────────┘
```

### 3D Map Rendering Pipeline

```
┌─────────────────────────────────────────────────────────┐
│  MapPage  [server component]                            │
│                                                         │
│  1. Fetch locations at render time                      │
│     const locations = await getLocations()             │
│     // returns LocationListItem[] with x,y,z + status   │
│                                                         │
│  2. Pass to client component                            │
│     <WarehouseMap locations={locations} />              │
└────────────────────────────┬────────────────────────────┘
                             │ serialized props
┌────────────────────────────▼────────────────────────────┐
│  WarehouseMap  [client component — "use client"]        │
│                                                         │
│  3. Three.js / R3F scene setup                          │
│     <Canvas>                                            │
│       <ambientLight />                                  │
│       <OrbitControls />   (@react-three/drei)           │
│       {locations.map(loc =>                             │
│         <LocationBox key={loc.id} location={loc} />     │
│       )}                                                │
│     </Canvas>                                           │
│                                                         │
│  4. LocationBox renders a <mesh>                        │
│     position={[loc.x, loc.y, loc.z]}                    │
│     color mapped from LocationStatus:                   │
│       AVAILABLE  → green (#22c55e)                      │
│       OCCUPIED   → blue  (#3b82f6)                      │
│       RESERVED   → amber (#f59e0b)                      │
│       INACTIVE   → gray  (#6b7280)                      │
│                                                         │
│  5. Click on box → show LocationDetailPanel             │
│     (stock levels, current products)                    │
└─────────────────────────────────────────────────────────┘
```

### Export / Report Generation Flow

```
┌─────────────────────────────────────────────────────────┐
│  ReportsPage  [server component]                        │
│                                                         │
│  1. Initial data load at render                         │
│     const summary = await getReportSummary(filters)     │
│     → feeds recharts charts (client components)         │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  ExportButton  [client component]                       │
│                                                         │
│  2. User clicks Export → calls Server Action            │
│     const result = await exportReport(filters)          │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  exportReport  [Server Action]                          │
│                                                         │
│  3. Query Prisma for full dataset matching filters       │
│                                                         │
│  4. Build xlsx workbook server-side                     │
│     const wb = XLSX.utils.book_new()                    │
│     const ws = XLSX.utils.json_to_sheet(rows)           │
│     XLSX.utils.book_append_sheet(wb, ws, 'Report')      │
│     const buffer = XLSX.write(wb, { type: 'base64' })   │
│                                                         │
│  5. Return base64 string                                │
│     return { success: true, data: buffer }              │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  ExportButton  (after action resolves)                  │
│                                                         │
│  6. Client triggers download                            │
│     const blob = base64ToBlob(result.data,              │
│       'application/vnd.openxmlformats-...')             │
│     const url = URL.createObjectURL(blob)               │
│     a.href = url; a.download = 'report.xlsx'; a.click() │
│     URL.revokeObjectURL(url)                            │
└─────────────────────────────────────────────────────────┘
```

**Chart rendering** (separate from export):
- `recharts` components are Client Components receiving data as props from the Server Component page.
- No additional server round-trip for chart data; same dataset used for both display and export.
- `date-fns` formats date labels and calculates date ranges for filters.

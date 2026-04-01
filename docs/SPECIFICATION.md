# Smart WMS — System Specification & Requirement Document

> **Version:** 1.0.0
> **Date:** 2026-03-21
> **Status:** Draft — Approved for Development
> **Tech Stack:** Next.js 15 · Tailwind CSS v4 · Prisma ORM · SQLite · Jose (JWT)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User Personas & Authorization Matrix](#2-user-personas--authorization-matrix)
3. [Feature List (Prioritized)](#3-feature-list-prioritized)
4. [Data Model Reference](#4-data-model-reference)
5. [Sitemap & Screen Specifications](#5-sitemap--screen-specifications)
6. [User Flows](#6-user-flows)
7. [Business Rules Catalog](#7-business-rules-catalog)
8. [Smart Features Specification](#8-smart-features-specification)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Glossary](#10-glossary)

---

## 1. Project Overview

**Smart WMS** (Smart Warehouse Management System) is an internal web application that enables small and medium-sized businesses to fully digitize warehouse operations: from goods receipt, goods issue, and location transfer to real-time inventory tracking on a 3D spatial map.

**Core Differentiators (Smart Features):**
- 3D virtual warehouse map with Cartesian coordinates (X, Y, Z) — staff know exactly which floor, aisle, and cell an item is in.
- QR code scanning for instant lookup and touchless transactions.
- Automatic optimal location suggestions during goods receipt based on actual warehouse state.
- Proactive alerts when inventory reaches the minimum threshold.

**Version 1.0 Scope:**
- Manages up to 1 physical warehouse with multiple shelf aisles.
- 10 user roles divided into 4 groups: Administration (Admin, Director, Deputy Director), Warehouse (Warehouse Manager, Warehouse Staff), Accounting (Chief Accountant, Deputy Accountant, Accounting Staff), Sales (Sales Staff). The Office group (Office Staff) supports voucher creation.
- No multi-warehouse, lot tracking, or ERP integration in this scope.

---

## 2. User Personas & Authorization Matrix

### 2.1 Persona 1 — Admin

| Attribute | Details |
|---|---|
| **Actual Role** | System administrator, typically the IT department head or a senior warehouse manager granted system-level access |
| **Primary Goal** | Keep the system running smoothly, configure permissions, control all warehouse data |
| **Device Used** | Desktop / Laptop |
| **Fixed Permissions** | Full CRUD: User, Product, Location; approve receipt/issue vouchers; view and export full audit log; configure alert thresholds; grant dynamic permissions to all staff |

---

### 2.2 Persona 2 — Director

| Attribute | Details |
|---|---|
| **Actual Role** | Senior executive of the business |
| **Primary Goal** | Get a high-level overview of warehouse status, approve important vouchers, view reports for business decisions |
| **Device Used** | Desktop / Laptop / Tablet |
| **Fixed Permissions** | Full system access equivalent to Admin; approve receipt/issue vouchers; manage all staff; view and export all reports |

---

### 2.3 Persona 3 — Deputy Director

| Attribute | Details |
|---|---|
| **Actual Role** | Deputy executive, supports the Director in operations |
| **Primary Goal** | Handle daily voucher approvals, monitor operational reports, manage personnel |
| **Device Used** | Desktop / Laptop |
| **Fixed Permissions** | Full system access equivalent to Admin; approve receipt/issue vouchers; manage all staff; view and export all reports |

---

### 2.4 Persona 4 — Warehouse Manager

| Attribute | Details |
|---|---|
| **Actual Role** | Person in charge of the warehouse, responsible for all receipt/issue operations and stock arrangement |
| **Primary Goal** | Supervise warehouse staff, approve vouchers, monitor warehouse map and reports |
| **Device Used** | Laptop / Tablet |
| **Fixed Permissions** | Approve receipt/issue vouchers; view warehouse map; view warehouse reports; manage and grant dynamic permissions to warehouse staff in department; export warehouse reports |

---

### 2.5 Persona 5 — Warehouse Staff

| Attribute | Details |
|---|---|
| **Actual Role** | Loader, receiver, or picker working directly on the warehouse floor |
| **Primary Goal** | Perform receipt/issue operations quickly via QR, with zero location errors |
| **Device Used** | Mobile phone (QR camera) / Shelf-mounted tablet |
| **Fixed Permissions** | No default permissions after account creation |
| **Dynamic Permissions** (granted by Warehouse Manager) | Goods Receipt (create IN voucher); Goods Issue (create OUT voucher); View warehouse map; View movement history |

---

### 2.6 Persona 6 — Office Staff

| Attribute | Details |
|---|---|
| **Actual Role** | Administrative or order coordination staff, does not work directly on the warehouse floor |
| **Primary Goal** | Create receipt/issue vouchers per order, monitor inventory to support sales |
| **Device Used** | Desktop / Laptop |
| **Fixed Permissions** | Create goods receipt vouchers; create goods issue vouchers; view inventory; view operational reports; view inventory forecast |

---

### 2.7 Persona 7 — Chief Accountant

| Attribute | Details |
|---|---|
| **Actual Role** | Head of the accounting department, responsible for warehouse financial figures |
| **Primary Goal** | View and export financial reports, manage accounting staff |
| **Device Used** | Desktop / Laptop |
| **Fixed Permissions** | View all financial reports; export reports (CSV/PDF); manage accounting staff in department; grant dynamic permissions to accounting staff |

---

### 2.8 Persona 8 — Deputy Accountant

| Attribute | Details |
|---|---|
| **Actual Role** | Deputy head of accounting, supports the Chief Accountant |
| **Primary Goal** | View financial reports, manage and assign permissions to accounting staff |
| **Device Used** | Desktop / Laptop |
| **Fixed Permissions** | View all financial reports (cannot export files); manage accounting staff in department; grant dynamic permissions to accounting staff |

---

### 2.9 Persona 9 — Accounting Staff

| Attribute | Details |
|---|---|
| **Actual Role** | Frontline accounting employee, works with warehouse data as assigned |
| **Primary Goal** | Access reports and inventory data assigned to them |
| **Device Used** | Desktop / Laptop |
| **Fixed Permissions** | No default permissions after account creation |
| **Dynamic Permissions** (granted by Chief Accountant or Deputy Accountant) | View reports by type (specific types designated); View inventory; View movement history |

---

### 2.10 Persona 10 — Sales Staff

| Attribute | Details |
|---|---|
| **Actual Role** | Salesperson who needs inventory data to advise customers and plan sales |
| **Primary Goal** | Check actual inventory and view low-stock alerts to commit accurately to customers |
| **Device Used** | Desktop / Laptop / Phone |
| **Fixed Permissions** | View product list and inventory (read-only); view inventory forecast and low-stock alerts |

---

### 2.11 Authorization Matrix

> Note: **(d)** = dynamic permission, granted by superior; **(dept)** = within own department only.

| Feature / Resource | Admin | Dir | Dep Dir | WH Mgr | WH Staff | Office | Chief Acct | Dep Acct | Acct Staff | Sales |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| View Overview Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Users (CRUD) | ✅ | ✅ | ✅ | ✅ (dept) | ❌ | ❌ | ✅ (dept) | ✅ (dept) | ❌ | ❌ |
| Manage Products (CRUD) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Product List | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ (d) | ✅ |
| Manage Locations (CRUD) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Warehouse Map | ✅ | ✅ | ✅ | ✅ | ✅ (d) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Goods Receipt (create IN voucher) | ✅ | ✅ | ✅ | ✅ | ✅ (d) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Goods Issue (create OUT voucher) | ✅ | ✅ | ✅ | ✅ | ✅ (d) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve receipt/issue vouchers | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View movement history (all) | ✅ | ✅ | ✅ | ✅ | ✅ (d) | ❌ | ❌ | ❌ | ✅ (d) | ❌ |
| View movement history (own) | ✅ | ✅ | ✅ | ✅ | ✅ (d) | ✅ | ❌ | ❌ | ❌ | ❌ |
| View financial reports | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ (d) | ❌ |
| Export reports (CSV/PDF) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View inventory forecast | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Configure alert thresholds | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View stock alerts | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Grant dynamic permissions to subordinates | ✅ | ❌ | ❌ | ✅ (WH Staff) | ❌ | ❌ | ✅ (Acct Staff) | ✅ (Acct Staff) | ❌ | ❌ |

---

## 3. Feature List (Prioritized)

### 3.1 Must-Have (P0 — Version 1.0)

#### F-01: Authentication & Authorization
**Description:** Login system using username/password, JWT session, auto-redirect by role.
**Business Logic:**
- JWT is signed with `SESSION_SECRET` and stored in an HTTP-only cookie.
- Middleware checks the token on every `/dashboard/**` route.
- If the token expires (24h), redirect to `/login`.
- If Staff attempts to access an Admin-only route (e.g. `/dashboard/users`), return 403 and redirect to Dashboard.

---

#### F-02: Overview Dashboard
**Description:** Home page after login, provides a quick view of warehouse status.
**Business Logic:**
- Real-time calculations: total SKUs in storage, total locations, warehouse fill rate (% FULL locations / total locations).
- Priority alerts: display list of products with `quantity < minStockLevel` (if configured).
- Recent activity: 10 most recent StockMovements for the day.

---

#### F-03: Product Management
**Description:** CRUD product catalog; each product is linked to a unique SKU (used to generate QR codes).
**Business Logic:**
- `sku` must be unique system-wide — validate before create/update.
- Deleting a Product is not allowed if it still has stock (`inventory.quantity > 0`) — display a clear error message.
- When viewing product details, show total inventory (sum of all `inventory.quantity`) and the list of locations currently storing that product.

---

#### F-04: Location Management
**Description:** CRUD warehouse cell locations; each location has a unique 3D coordinate (X, Y, Z).
**Business Logic:**
- The combination `(x, y, z)` must be unique — no two locations can share the same coordinates.
- The `label` is auto-generated following the convention: `A{x:02d}-S{y:02d}-T{z:02d}` (e.g. `A01-S03-T05`). Admin can override.
- Deleting a Location is not allowed if it still holds stock (`inventory.quantity > 0`).
- Status transitions: AVAILABLE → RESERVED (Admin sets manually to prepare for a new shipment) → FULL (system sets automatically when `quantity > 0`) → AVAILABLE (system resets automatically when `quantity = 0`).

**Location Status:**
| Status | Display Color | Meaning |
|---|---|---|
| `AVAILABLE` | Green | Empty, ready to receive stock |
| `FULL` | Red | Currently holding stock |
| `RESERVED` | Amber | Reserved, awaiting incoming stock |

---

#### F-05: Goods Receipt — IN
**Description:** Record goods entering a specific warehouse location.
**Business Logic:**
- Find product by SKU (scan QR or type manually).
- Find location by label or select from the map.
- If the `(productId, locationId)` pair already exists in `Inventory`: `quantity += inputQuantity`.
- If it does not exist: create a new Inventory record with `quantity = inputQuantity`.
- After receipt: update `Location.status = FULL`, create a `StockMovement` with `type = IN`.
- If the location is already `FULL` with a different SKU: **warn** the staff member but still allow the operation (one location can hold multiple SKUs within v1 system limits).

---

#### F-06: Goods Issue — OUT
**Description:** Record goods leaving the warehouse.
**Business Logic:**
- Find product by SKU.
- System returns a list of all locations currently holding that product (with `quantity`).
- Staff selects the issue location.
- Validate: `inputQuantity <= inventory.quantity` — **mandatory**, issuing beyond stock is not permitted. Return a clear error.
- After issue: `inventory.quantity -= inputQuantity`. If `quantity = 0`, automatically update `Location.status = AVAILABLE` and delete the Inventory record (or retain it with `quantity = 0` depending on config).
- Create a `StockMovement` with `type = OUT`.

---

#### F-07: Warehouse Map — 3D Visualization
**Description:** Display the warehouse layout as a 3D space (Three.js / isometric 2.5D), with color-coded status.
**Business Logic:**
- Render all Locations using their actual `(x, y, z)` coordinates.
- Color by `status` (see F-04 table).
- Clicking a cell: display a detail popup (label, status, list of goods stored, total quantity).
- Filters: filter by floor `z` (view each layer), filter by product (highlight cells containing that SKU).
- Auto-update after each transaction (re-fetch data).

---

#### F-08: QR Scanner
**Description:** Screen for scanning QR codes via device camera to look up products and perform transactions.
**Business Logic:**
- QR codes are generated from `Product.sku` (format: plain text SKU).
- After a successful scan: immediately display product information (name, SKU, total stock, list of locations).
- Staff selects action: [Goods Receipt] or [Goods Issue].
- Integrates "Smart Suggestion": automatically suggests the optimal location (see F-S01).
- Supports manual SKU entry if camera is unavailable.

---

#### F-09: Audit Log / Stock Movement History
**Description:** Full list of all receipt/issue/transfer transactions over time.
**Business Logic:**
- Each transaction records: type (IN/OUT/TRANSFER), quantity, product, location, user, timestamp.
- For TRANSFER: store 2 records (OUT from old location, IN to new location) or add `fromLocationId` / `toLocationId` fields.
- Filter by: transaction type, date range, product, user.
- Admin: sees all. Staff: sees only their own transactions.
- No record may be edited or deleted — immutable audit trail.

---

### 3.2 Should-Have (P1 — Version 1.1)

#### F-10: Location Transfer
**Description:** Move a quantity of stock from location A to location B within the same warehouse.
**Business Logic:**
- Atomic transaction: OUT from source and IN to destination occur in the same DB transaction.
- Validate: destination must be AVAILABLE or FULL (same SKU).
- Create a `StockMovement` with `type = TRANSFER`, including `fromLocationId` and `toLocationId`.

---

#### F-11: Stock Alert
**Description:** System automatically alerts when inventory hits a threshold.
**Business Logic:**
- Admin configures `minStockLevel` and `maxStockLevel` per Product.
- Background job (or on-demand when loading Dashboard): scan all Inventory, compare `sum(quantity)` against thresholds.
- Display alert badge on sidebar and banner on Dashboard.
- Alert states: `LOW_STOCK` (below min), `OUT_OF_STOCK` (= 0), `OVERSTOCK` (above max).

---

#### F-12: Generate & Print Product QR Codes
**Description:** From the product detail page, Admin can generate and print a QR code containing the SKU.
**Business Logic:**
- Generate QR code client-side from `Product.sku` (using the `qrcode` library or equivalent).
- Support printing a QR page with a template: product name, SKU, QR code image, creation date.
- Batch print: select multiple products and print all QR codes in one go.

---

#### F-13: Reports & Export
**Description:** Export inventory and transaction data to CSV file.
**Business Logic:**
- Current inventory report: Product | SKU | Total Quantity | Locations.
- Transaction report: filter by date range, export CSV.
- Only Admin has export permission.

---

#### F-14: User Management
**Description:** Admin manages staff accounts.
**Business Logic:**
- Create new account: username must be unique, password is auto-hashed with bcrypt.
- Change role (ADMIN / STAFF).
- Disable account (soft disable — add `isActive` field) instead of deleting, to preserve transaction history.
- Admin cannot delete their own account.

---

## 4. Data Model Reference

Based on the current `schema.prisma`. This section notes fields to be added for versions 1.0 and 1.1.

### 4.1 Current Models (already implemented)

```
User          → id, username, passwordHash, role, createdAt
Product       → id, sku, name, description, category, unit, createdAt, updatedAt
Location      → id, label, x, y, z, status
Inventory     → id, productId, locationId, quantity
StockMovement → id, type, quantity, productId, locationId, userId, createdAt
```

### 4.2 Fields to Add (Schema Extension — v1.1)

| Model | New Field | Type | Description |
|---|---|---|---|
| `Product` | `minStockLevel` | `Int?` | Minimum stock alert threshold |
| `Product` | `maxStockLevel` | `Int?` | Maximum stock alert threshold |
| `Product` | `imageUrl` | `String?` | Product image (URL or base64) |
| `User` | `isActive` | `Boolean` | Soft disable account |
| `StockMovement` | `note` | `String?` | Free-text note for the transaction |
| `StockMovement` | `fromLocationId` | `String?` | Source location (for type = TRANSFER) |

> **Rule:** All schema changes must go through Planning Mode (`/plan`) before writing a migration.

---

## 5. Sitemap & Screen Specifications

```
/login                          → Login screen
/dashboard                      → Overview dashboard
/dashboard/products             → Product list
/dashboard/products/new         → Create new product
/dashboard/products/[id]        → Product detail / Edit
/dashboard/locations            → Location list
/dashboard/locations/new        → Create new location
/dashboard/map                  → 3D warehouse map
/dashboard/scanner              → QR Scanner
/dashboard/movements            → Transaction log (Audit Log)
/dashboard/users                → User management (Admin only)
/dashboard/users/new            → Create new account (Admin only)
```

---

### 5.1 Screen: `/login`
**Purpose:** Authenticate the user.
**Display:**
- Logo / system name "Smart WMS".
- Form: Username, Password, Login button.
- Inline error message on incorrect credentials.

**Navigation flow:** Success → `/dashboard`. Active session → auto-redirect from `/login` to `/dashboard`.

---

### 5.2 Screen: `/dashboard`
**Purpose:** Provide a quick overview of warehouse status.
**Display:**

**KPI Cards (top row):**
- Total SKUs currently in storage.
- Total locations / Locations in use / Locations available.
- Warehouse fill rate (progress bar, %).
- Number of active stock alerts.

**Table: Stock Alerts (if any):**
- List of `LOW_STOCK` / `OUT_OF_STOCK` products.
- Each row: SKU, Product Name, Current Stock, Minimum Threshold, Status Badge.

**Table: Recent Activity:**
- 10 most recent StockMovements.
- Each row: Timestamp, Type (IN/OUT/TRANSFER badge), Product, Location, Quantity, Performed By.

**Quick Actions (Staff):**
- [Scan QR] button → `/dashboard/scanner`.
- [View Map] button → `/dashboard/map`.

---

### 5.3 Screen: `/dashboard/products`
**Purpose:** View and manage the product catalog.
**Display:**
- Search bar (by name or SKU, real-time filter).
- Filter by Category.
- Product table: SKU | Name | Category | Unit | Total Stock | Alert Status | Actions.
- [Add Product] button (Admin only).
- Pagination: 20 products per page.

**Row actions:**
- [View Details] → `/dashboard/products/[id]`
- [Create QR] — open modal to view and print QR code (Admin only).
- [Delete] — shown only when stock = 0, with a confirm dialog (Admin only).

---

### 5.4 Screen: `/dashboard/products/[id]`
**Purpose:** View product details and edit product information.
**Display:**
- Edit form: SKU (read-only), Name, Category, Unit, Description, Min/Max stock threshold (Admin only).
- **Inventory Panel:** Table of locations currently holding this product (Label, X/Y/Z, Quantity). Total: N units across M locations.
- **QR Code Panel:** Display the SKU QR image, [Print QR] button.
- **History Panel:** 20 most recent transactions related to this product.

---

### 5.5 Screen: `/dashboard/locations`
**Purpose:** View and manage warehouse locations.
**Display:**
- Filter by status (AVAILABLE / FULL / RESERVED) and by floor Z.
- Location table: Label | Coordinates (X, Y, Z) | Status | Goods Stored | Quantity | Actions.
- [Add Location] button (Admin only).

**Admin row actions:**
- Change status (e.g. set RESERVED).
- Delete (only when stock = 0).

---

### 5.6 Screen: `/dashboard/map`
**Purpose:** Visualize the 3D warehouse space.
**Display:**
- 3D canvas (or isometric 2.5D) rendering all Locations.
- Color legend: Green (AVAILABLE), Red (FULL), Yellow (RESERVED).
- **Controls:**
  - "Floor" slider (Z-axis filter): show only cells on the selected floor Z.
  - "Find by Product" dropdown: enter SKU → highlight all cells containing that product.
  - [Reset view] button.
- **Popup on cell click:**
  - Location label, X/Y/Z coordinates.
  - Status.
  - List of goods stored (SKU, Name, Quantity).
  - [Receive Stock Here] / [Issue Stock] buttons → navigate to Scanner with location pre-filled.

---

### 5.7 Screen: `/dashboard/scanner`
**Purpose:** Main interface for staff to perform transactions via QR.
**Design:** Mobile-first, large font, large tap targets.
**Display:**

**Step 1 — Scan/Enter Product:**
- Live camera preview area (using `html5-qrcode` or equivalent).
- Manual SKU entry field (fallback).
- After scan: display product card (name, SKU, thumbnail image, current total stock).

**Step 2 — Select Action:**
- Large buttons: [GOODS RECEIPT] (green) / [GOODS ISSUE] (red).

**Step 3 — Enter Transaction Details:**
- Quantity field (numeric keypad-friendly).
- Select location (dropdown or scan location QR).
- **Smart Suggestion** (see F-S01): automatically suggests the optimal location.
- Optional notes field.
- [Confirm Transaction] button.

**Step 4 — Confirmation:**
- Success screen with summary: transaction type, product, location, quantity, timestamp.
- [New Transaction] button to return to Step 1.

---

### 5.8 Screen: `/dashboard/movements`
**Purpose:** Full transaction log — Audit Trail.
**Display:**
- **Filters:**
  - Transaction Type: All / IN / OUT / TRANSFER.
  - Date range.
  - Search by SKU or product name.
  - Search by user (Admin only).
- **Table:**
  - Timestamp | Type | Product (SKU + Name) | Location | Quantity | Performed By | Note.
- **Export CSV button** (Admin only).
- Pagination: 50 rows per page.

---

### 5.9 Screen: `/dashboard/users` (Admin only)
**Purpose:** Manage staff accounts.
**Display:**
- Table: Username | Role | Status (Active/Inactive) | Created Date | Actions.
- Actions: [Change Role], [Disable / Activate], [Reset Password].
- [Add New Account] button.

---

## 6. User Flows

### 6.1 User Flow: Goods Receipt via QR Scanner

**Actor:** Warehouse Staff or Admin
**Trigger:** New goods shipment arrives at the warehouse and needs to be recorded in the system
**Preconditions:** The goods already exist in the Product catalog (have a SKU and QR code), staff is logged in

```
[Start]
    │
    ▼
[1] Staff opens the app on their phone
    → Taps [Scan QR] from Dashboard or sidebar
    → System navigates to /dashboard/scanner

    │
    ▼
[2] Staff uses camera to scan the QR code on the shipment
    → (If QR cannot be read) → Manually type SKU into text field
    → System calls API: GET /api/products?sku={sku}

    │
    ├─── [FAIL: SKU not found] ──→ Display error "Product code not found in system"
    │                               → Ask staff to check again or report to Admin to add the product
    │
    ▼ [SUCCESS]
[3] System displays Product Card:
    - Product name, SKU, Unit
    - Current total stock: N [units] across M locations
    - List of locations currently holding stock (if any)

    │
    ▼
[4] Staff taps [GOODS RECEIPT]
    → System moves to the detail entry step

    │
    ▼
[5] Staff enters the quantity to receive
    → Validate: positive integer, > 0

    │
    ▼
[6] System automatically calls "Smart Location Suggestion":
    → Find locations currently holding the same SKU (prioritize consolidation)
    → If none: find nearest AVAILABLE location (Euclidean distance from warehouse entrance)
    → Display Top 3 suggestions (see F-S01 for details)

    │
    ▼
[7] Staff selects a location:
    ├── Choose one of the suggestions
    ├── Manual search by location label
    └── Scan location QR code (if shelves have QR labels)

    │
    ├─── [Location is RESERVED for a different SKU] ─→ Display warning "This location is reserved for other goods"
    │                                                   → Ask to confirm proceed or choose another location
    │
    ▼ [Valid location]
[8] Staff (optional) enters a note
    → e.g. "Shipment from Supplier ABC, date 21/03/2026"

    │
    ▼
[9] Staff taps [Confirm Transaction]
    → System displays confirmation modal:
      "Receive 50 Boxes of SP-001 into location A03-S01-T02. Confirm?"
    → [Confirm] / [Cancel] buttons

    │
    ▼
[10] After confirmation — System executes:
    a) Upsert Inventory record (productId, locationId, quantity += N)
    b) Update Location.status = FULL
    c) Create StockMovement record (type=IN, quantity=N, productId, locationId, userId, note)
    → All within 1 DB transaction

    │
    ├─── [DB Error] ─→ Rollback, display technical error, ask to retry
    │
    ▼ [SUCCESS]
[11] Success screen:
    ✅ Large success icon
    - Summary: GOODS RECEIPT | SP-001 | A03-S01-T02 | +50 Boxes | 14:32:05
    - [New Transaction] button → Return to Step 1
    - [Back to Dashboard] button

[End]
```

---

### 6.2 User Flow: Goods Issue by Order

**Actor:** Warehouse Staff or Admin
**Trigger:** An issue order is received (sales order, production request, etc.)
**Preconditions:** Product stock > 0

```
[Start]
    │
    ▼
[1] Staff opens /dashboard/scanner
    → Scans QR or enters SKU of the product to issue

    │
    ▼
[2] System displays Product Card + list of locations currently holding stock:
    ┌─────────────────────────────────┐
    │ SP-001 - Product A              │
    │ Total stock: 150 Boxes          │
    │                                 │
    │ Locations with stock:           │
    │ A01-S02-T01: 80 Boxes  [Select] │
    │ A03-S01-T02: 50 Boxes  [Select] │
    │ B02-S04-T03: 20 Boxes  [Select] │
    └─────────────────────────────────┘

    │
    ▼
[3] Staff taps [GOODS ISSUE]

    │
    ▼
[4] Staff enters the quantity to issue

    │
    ▼
[5] Staff selects the issue location:
    ├── Choose from suggestion list (Smart: prioritize location nearest to the exit — lowest Z)
    └── Manual search

    │
    ▼
[6] System validates:
    ├─── [inputQuantity > inventory.quantity at that location]
    │       → ERROR: "Issue quantity (N) exceeds stock at this location (M)"
    │       → Do not allow to proceed
    │
    ▼ [Valid]
[7] Confirm transaction (same as step 9 of the Receipt flow)

    │
    ▼
[8] System executes:
    a) inventory.quantity -= inputQuantity
    b) If quantity = 0: Location.status = AVAILABLE, delete/zero Inventory record
    c) Check stock alert: if sum(quantity) of product < minStockLevel → flag LOW_STOCK
    d) Create StockMovement (type=OUT)
    → Within 1 DB transaction

    │
    ▼
[9] Success screen with goods issue summary.
    - If low stock alert triggered: display an additional yellow warning banner.

[End]
```

---

### 6.3 User Flow: Location Transfer

**Actor:** Warehouse Staff or Admin
**Trigger:** Need to reorganize the warehouse, free up locations, or consolidate stock

```
[Start]
    │
    ▼
[1] From the warehouse map (Map), staff clicks a source cell (FULL)
    → Popup appears → Tap [Move Stock]
    OR from /dashboard/scanner select action [TRANSFER]

    │
    ▼
[2] System displays Transfer form:
    - Product: [pre-filled if entered from Map]
    - Source location: [pre-filled] — shows current quantity
    - Transfer quantity: [enter]
    - Destination location: [select — Smart Suggestion prioritizes nearest AVAILABLE location]

    │
    ▼
[3] Validate:
    - Quantity > 0 and ≤ stock at source
    - Destination ≠ source
    - Destination is not RESERVED (or RESERVED for the same SKU)

    │
    ▼
[4] Confirm → System executes atomic transaction:
    a) OUT from (productId, fromLocationId): quantity -= N
    b) IN to (productId, toLocationId): quantity += N (upsert)
    c) Update status of both locations
    d) Create StockMovement (type=TRANSFER, fromLocationId, toLocationId)

    │
    ▼
[5] Success — Warehouse map automatically updates colors for both locations.

[End]
```

---

## 7. Business Rules Catalog

This is a condensed list of all business rules in the system, for reference when writing code.

| ID | Rule | Scope | Severity |
|---|---|---|---|
| BR-01 | `(x, y, z)` of a Location must be unique system-wide | Location | ERROR — block |
| BR-02 | `Product.sku` must be unique | Product | ERROR — block |
| BR-03 | Cannot delete a Product while it still has stock | Product | ERROR — block |
| BR-04 | Cannot delete a Location while it still holds stock | Location | ERROR — block |
| BR-05 | Issue quantity cannot exceed stock at the selected location | OUT transaction | ERROR — block |
| BR-06 | Inventory quantity can never be negative | Inventory | ERROR — block (DB constraint) |
| BR-07 | Every IN/OUT/TRANSFER transaction must be written to StockMovement | Transaction | SYSTEM — auto |
| BR-08 | StockMovement is immutable — no edits or deletes | Audit | SYSTEM — no UI |
| BR-09 | When Inventory quantity = 0, Location.status = AVAILABLE | Location | SYSTEM — auto |
| BR-10 | When Inventory quantity > 0, Location.status = FULL | Location | SYSTEM — auto |
| BR-11 | Transfer is atomic (both legs succeed or both rollback) | Transfer | SYSTEM — DB transaction |
| BR-12 | Staff can only view their own Audit Log entries | Authorization | AUTH — middleware |
| BR-13 | Admin cannot delete their own account | User | ERROR — block |

---

## 8. Smart Features Specification

### F-S01: Smart Location Suggestion

**Triggered:** After scanning a product QR code and selecting [GOODS RECEIPT].

**Suggestion algorithm (in priority order):**

```
1. CONSOLIDATION:
   → Find all Locations currently holding this productId
   → Prioritize the location nearest to the warehouse entrance (assumed at x=0, y=0)
   → Distance = sqrt(x² + y²) (ignoring z to avoid suggesting high floors)
   → If found: add to suggestion list with label "Has same product"

2. NEAREST AVAILABLE:
   → Find all Locations with status = AVAILABLE
   → Sort by Euclidean distance from point (0, 0, 0)
   → Take top 3 nearest
   → Label: "Nearest empty location"

3. RESERVED FOR THIS SKU:
   → Find Location with status = RESERVED currently holding the same productId
   → This location was pre-reserved by Admin
   → Highest priority, display "Reserved" badge
```

**Output:** List of up to 3 suggested locations, each displaying:
- Location label, X/Y/Z coordinates.
- Reason for suggestion (colored badge).
- Current quantity (if same product is already there).

---

### F-S02: Real-time Stock Status on 3D Map

**Description:** The warehouse map reflects actual state immediately after each transaction.

**Mechanism:** After each successful transaction API call (IN/OUT/TRANSFER), the client invalidates the cache and re-fetches data for the Map component. No WebSocket needed for v1.0.

---

### F-S03: Proactive Stock Alerts

**Description:** The system calculates and displays alerts without users having to actively check.

**Mechanism:**
- After each OUT transaction: server-side checks the total stock of that product.
- If `sum(quantity) <= Product.minStockLevel`: add a record to the `StockAlert` table (or compute on-the-fly).
- The alert badge on the sidebar is calculated via a lightweight API call: `GET /api/alerts/count`.
- Dashboard displays the full list.

---

## 9. Non-Functional Requirements

### 9.1 Performance
- Dashboard page loads in < 2 seconds (with < 10,000 transactions).
- QR Scanner responds after scan in < 500ms.
- 3D warehouse map renders in < 3 seconds with 200 locations.

### 9.2 Security
- Passwords hashed with `bcrypt` (cost factor ≥ 12).
- JWT session in HTTP-only cookie, SameSite=Strict.
- Input sanitization on all forms — prevent SQL Injection (handled by Prisma ORM), XSS.
- Rate limiting on `/api/auth/login`: maximum 10 attempts / 5 minutes / IP.

### 9.3 Usability
- Mobile-first for the QR Scanner screen.
- Minimum font size 16px on mobile.
- Status colors must meet WCAG AA contrast ratio.
- Basic goods receipt operation completable in ≤ 3 taps on mobile.

### 9.4 Reliability
- All warehouse transactions must be written to the Audit Log — no "silent" transactions.
- All stock-changing operations must be within a DB transaction to ensure consistency.

---

## 10. Glossary

| Term | Definition |
|---|---|
| **SKU** (Stock Keeping Unit) | Unique identifier for a product in the system |
| **Location** | A physical cell in the warehouse, identified by coordinates (X, Y, Z) |
| **Inventory** | A record representing the quantity of a SKU currently at a specific Location |
| **StockMovement** | A history record for every change in goods quantity or position |
| **IN** | Goods receipt transaction — goods arrive and are placed at a location |
| **OUT** | Goods issue transaction — goods leave a location |
| **TRANSFER** | Internal transfer transaction — goods move from location A to location B |
| **X (Row)** | Horizontal axis — aisle number in the warehouse |
| **Y (Section)** | Depth axis — cell number along an aisle |
| **Z (Tier/Level)** | Vertical axis — shelf tier number |
| **Consolidation** | Strategy to consolidate all goods of the same SKU into as few locations as possible |
| **Atomic transaction** | A group of DB operations that all succeed or all fail (all-or-nothing) |
| **Audit Trail** | An immutable log recording all significant data changes |

---

*This document is the definitive guide for the entire Smart WMS v1.0 and v1.1 development process. Any significant business changes must be updated in this document before writing code.*

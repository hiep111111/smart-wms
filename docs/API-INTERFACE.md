# Smart WMS — API Interface Reference

> **Version:** 1.0.0  
> **Date:** 2026-04-01  
> **Status:** Draft  
> **Note:** This document defines the intended REST API surface. The current implementation uses Next.js Server Actions; this serves as the contract for future REST API development or frontend integration reference.

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Shared Interfaces](#2-shared-interfaces)
3. [Auth Module](#3-auth-module)
4. [Users Module](#4-users-module)
5. [Products Module](#5-products-module)
6. [Locations Module](#6-locations-module)
7. [Inventory Module](#7-inventory-module)
8. [Movements Module](#8-movements-module)
9. [Reports Module](#9-reports-module)
10. [Permissions Module](#10-permissions-module)
11. [Error Code Reference](#11-error-code-reference)

---

## 1. API Overview

### Base URL

```
/api/v1
```

### Authentication

All protected endpoints require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The token is obtained from the `POST /auth/login` endpoint. Session duration: **8 hours**.

### Request Format

```
Content-Type: application/json
```

### Standard Response Envelope

**Success:**
```typescript
interface ApiSuccess<T> {
  success: true;
  data: T;
}
```

**Error:**
```typescript
interface ApiError {
  success: false;
  error: {
    code: ErrorCode;       // machine-readable error code
    message: string;       // human-readable description
    details?: unknown;     // optional validation details
  };
}
```

### HTTP Status Codes

| Status | Meaning |
|--------|---------|
| `200` | OK — successful GET / PATCH |
| `201` | Created — successful POST |
| `204` | No Content — successful DELETE |
| `400` | Bad Request — validation error |
| `401` | Unauthorized — missing or invalid JWT |
| `403` | Forbidden — authenticated but insufficient role/permission |
| `404` | Not Found — resource does not exist |
| `409` | Conflict — uniqueness violation (e.g. duplicate SKU) |
| `422` | Unprocessable Entity — business rule violation (e.g. insufficient stock) |
| `500` | Internal Server Error |

---

## 2. Shared Interfaces

### Role Enum

```typescript
enum Role {
  ADMIN              = "ADMIN",
  DIRECTOR           = "DIRECTOR",
  DEPUTY_DIRECTOR    = "DEPUTY_DIRECTOR",
  WAREHOUSE_MANAGER  = "WAREHOUSE_MANAGER",
  WAREHOUSE_STAFF    = "WAREHOUSE_STAFF",
  OFFICE_STAFF       = "OFFICE_STAFF",
  CHIEF_ACCOUNTANT   = "CHIEF_ACCOUNTANT",
  DEPUTY_ACCOUNTANT  = "DEPUTY_ACCOUNTANT",
  ACCOUNTING_STAFF   = "ACCOUNTING_STAFF",
  SALES_STAFF        = "SALES_STAFF",
}
```

### Permission Enum

Dynamic permissions that can be granted to Warehouse Staff (by Warehouse Manager) and Accounting Staff (by Chief Accountant or Deputy Accountant):

```typescript
enum Permission {
  // Warehouse Staff permissions (granted by Warehouse Manager)
  STOCK_IN              = "STOCK_IN",            // Create goods receipt voucher
  STOCK_OUT             = "STOCK_OUT",           // Create goods issue voucher
  VIEW_WAREHOUSE_MAP    = "VIEW_WAREHOUSE_MAP",  // View 3D warehouse map
  VIEW_MOVEMENT_HISTORY = "VIEW_MOVEMENT_HISTORY", // View stock movement log

  // Accounting Staff permissions (granted by Chief Accountant / Deputy Accountant)
  VIEW_REPORTS          = "VIEW_REPORTS",        // View reports (by type)
  VIEW_INVENTORY        = "VIEW_INVENTORY",      // View inventory levels
  VIEW_MOVEMENTS_ACCT   = "VIEW_MOVEMENTS_ACCT", // View movement history
}
```

### Voucher & Movement Enums

```typescript
enum VoucherStatus {
  PENDING  = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

enum MovementType {
  IN       = "IN",
  OUT      = "OUT",
  TRANSFER = "TRANSFER",
}

enum LocationStatus {
  AVAILABLE = "AVAILABLE",
  FULL      = "FULL",
  RESERVED  = "RESERVED",
}
```

### Pagination

```typescript
interface PaginationQuery {
  page?: number;   // default: 1
  limit?: number;  // default: 20, max: 100
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### Session Payload (JWT Claims)

```typescript
interface SessionPayload {
  userId: string;
  username: string;
  role: Role;
  permissions: Permission[];  // populated for WAREHOUSE_STAFF and ACCOUNTING_STAFF
  iat: number;
  exp: number;
}
```

### Base Entity Shapes

```typescript
interface UserBase {
  id: string;
  username: string;
  role: Role;
  createdAt: string; // ISO 8601
}

interface ProductBase {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  minQuantity: number;
  createdAt: string;
  updatedAt: string;
}

interface LocationBase {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  status: LocationStatus;
}

interface InventoryRecord {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  product: ProductBase;
  location: LocationBase;
}

interface StockMovement {
  id: string;
  type: MovementType;
  quantity: number;
  productId: string;
  locationId: string;
  userId: string;
  voucherStatus: VoucherStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  note: string | null;
  createdAt: string;
  product: Pick<ProductBase, "id" | "sku" | "name">;
  location: Pick<LocationBase, "id" | "label">;
  user: Pick<UserBase, "id" | "username">;
}
```

---

## 3. Auth Module

### POST /auth/login

Authenticates a user and returns a JWT.

**Roles:** Public (no auth required)

**Request Body:**
```typescript
interface LoginRequest {
  username: string;
  password: string;
}
```

**Response `200`:**
```typescript
interface LoginResponse {
  token: string;           // JWT — expires in 8 hours
  user: UserBase & {
    permissions: Permission[];
  };
}
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `INVALID_CREDENTIALS` | 401 | Username not found or password incorrect |
| `ACCOUNT_DISABLED` | 403 | Account has been deactivated |
| `VALIDATION_ERROR` | 400 | Missing username or password |

---

### POST /auth/logout

Invalidates the current session.

**Roles:** Any authenticated user

**Request Body:** _(none)_

**Response `204`:** _(no body)_

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `UNAUTHORIZED` | 401 | No valid token provided |

---

### POST /auth/refresh

Issues a new JWT before the current one expires.

**Roles:** Any authenticated user

**Request Body:** _(none)_

**Response `200`:**
```typescript
interface RefreshResponse {
  token: string; // new JWT — 8-hour expiry from now
}
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `UNAUTHORIZED` | 401 | Token missing, expired, or invalid |

---

## 4. Users Module

### GET /users

List all users. Managers see only their department's staff.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER` (warehouse dept only), `CHIEF_ACCOUNTANT` (accounting dept only), `DEPUTY_ACCOUNTANT` (accounting dept only)

**Query Parameters:**
```typescript
interface GetUsersQuery extends PaginationQuery {
  role?: Role;
  search?: string; // searches username
}
```

**Response `200`:**
```typescript
type GetUsersResponse = PaginatedResponse<UserBase>;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `FORBIDDEN` | 403 | Role not in allowed list |

---

### POST /users

Create a new user account.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`

**Request Body:**
```typescript
interface CreateUserRequest {
  username: string;   // 3–50 chars, alphanumeric + underscore
  password: string;   // min 8 chars
  role: Role;
}
```

**Response `201`:**
```typescript
type CreateUserResponse = UserBase;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `DUPLICATE_USERNAME` | 409 | Username already taken |
| `FORBIDDEN` | 403 | Insufficient role |
| `VALIDATION_ERROR` | 400 | Invalid username format or weak password |

---

### GET /users/:id

Get a single user by ID.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER` (own dept), `CHIEF_ACCOUNTANT` (own dept), `DEPUTY_ACCOUNTANT` (own dept), or **self** (any role)

**Response `200`:**
```typescript
interface GetUserResponse extends UserBase {
  permissions: Permission[]; // populated for WAREHOUSE_STAFF and ACCOUNTING_STAFF
}
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `USER_NOT_FOUND` | 404 | No user with that ID |
| `FORBIDDEN` | 403 | Not self and not an allowed manager |

---

### PUT /users/:id

Update a user's details or role.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER` (own dept staff only), `CHIEF_ACCOUNTANT` (own dept staff only), `DEPUTY_ACCOUNTANT` (own dept staff only)

**Request Body:**
```typescript
interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: Role;
}
```

**Response `200`:**
```typescript
type UpdateUserResponse = UserBase;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `USER_NOT_FOUND` | 404 | No user with that ID |
| `FORBIDDEN` | 403 | Trying to edit outside managed scope |
| `DUPLICATE_USERNAME` | 409 | New username already taken |
| `VALIDATION_ERROR` | 400 | Invalid field values |

---

### DELETE /users/:id

Delete a user account.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`

**Response `204`:** _(no body)_

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `USER_NOT_FOUND` | 404 | No user with that ID |
| `FORBIDDEN` | 403 | Insufficient role |
| `CANNOT_DELETE_SELF` | 409 | Admin attempting to delete own account |

---

## 5. Products Module

### GET /products

List all products.

**Roles:** All authenticated users

**Query Parameters:**
```typescript
interface GetProductsQuery extends PaginationQuery {
  search?: string;   // searches sku, name
  category?: string;
  lowStock?: boolean; // if true, return only items below minQuantity
}
```

**Response `200`:**
```typescript
interface ProductWithStock extends ProductBase {
  totalQuantity: number; // sum of quantity across all locations
}

type GetProductsResponse = PaginatedResponse<ProductWithStock>;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `UNAUTHORIZED` | 401 | No valid token |

---

### POST /products

Create a new product.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`

**Request Body:**
```typescript
interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;         // default: "Cái"
  minQuantity?: number;  // default: 0
}
```

**Response `201`:**
```typescript
type CreateProductResponse = ProductBase;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `DUPLICATE_SKU` | 409 | SKU already exists |
| `FORBIDDEN` | 403 | Insufficient role |
| `VALIDATION_ERROR` | 400 | Missing required fields |

---

### GET /products/:id

Get a single product with inventory breakdown by location.

**Roles:** All authenticated users

**Response `200`:**
```typescript
interface GetProductResponse extends ProductBase {
  totalQuantity: number;
  inventory: Array<{
    location: LocationBase;
    quantity: number;
  }>;
}
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `PRODUCT_NOT_FOUND` | 404 | No product with that ID |

---

### PUT /products/:id

Update product details.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`

**Request Body:**
```typescript
interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  minQuantity?: number;
}
```

**Response `200`:**
```typescript
type UpdateProductResponse = ProductBase;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `PRODUCT_NOT_FOUND` | 404 | No product with that ID |
| `FORBIDDEN` | 403 | Insufficient role |

---

### DELETE /products/:id

Delete a product. Blocked if the product has active inventory.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`

**Response `204`:** _(no body)_

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `PRODUCT_NOT_FOUND` | 404 | No product with that ID |
| `FORBIDDEN` | 403 | Insufficient role |
| `PRODUCT_HAS_STOCK` | 409 | Product still has quantity > 0 in warehouse |

---

### GET /products/:id/qr

Returns QR code data (base64 PNG) encoding the product's SKU.

**Roles:** All authenticated users

**Response `200`:**
```typescript
interface QRCodeResponse {
  sku: string;
  qrBase64: string; // data:image/png;base64,...
}
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `PRODUCT_NOT_FOUND` | 404 | No product with that ID |

---

## 6. Locations Module

### GET /locations

List all warehouse locations.

**Roles:** All authenticated users

**Query Parameters:**
```typescript
interface GetLocationsQuery extends PaginationQuery {
  status?: LocationStatus;
  x?: number; // filter by aisle/row
  y?: number; // filter by shelf/section
  z?: number; // filter by level/tier
}
```

**Response `200`:**
```typescript
interface LocationWithInventory extends LocationBase {
  currentQuantity: number; // total items stored at this location
}

type GetLocationsResponse = PaginatedResponse<LocationWithInventory>;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `UNAUTHORIZED` | 401 | No valid token |

---

### POST /locations

Create a new warehouse location.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`

**Request Body:**
```typescript
interface CreateLocationRequest {
  label: string;  // e.g. "Dãy-A-Kệ-01-Tầng-05"
  x: number;
  y: number;
  z: number;
}
```

**Response `201`:**
```typescript
type CreateLocationResponse = LocationBase;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `DUPLICATE_LABEL` | 409 | Label already exists |
| `DUPLICATE_COORDINATES` | 409 | (x, y, z) already occupied |
| `FORBIDDEN` | 403 | Insufficient role |
| `VALIDATION_ERROR` | 400 | Missing required fields |

---

### GET /locations/:id

Get a single location with current inventory.

**Roles:** All authenticated users

**Response `200`:**
```typescript
interface GetLocationResponse extends LocationBase {
  inventory: Array<{
    product: Pick<ProductBase, "id" | "sku" | "name" | "unit">;
    quantity: number;
  }>;
}
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `LOCATION_NOT_FOUND` | 404 | No location with that ID |

---

### PUT /locations/:id

Update location label or coordinates.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER`

**Request Body:**
```typescript
interface UpdateLocationRequest {
  label?: string;
  x?: number;
  y?: number;
  z?: number;
}
```

**Response `200`:**
```typescript
type UpdateLocationResponse = LocationBase;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `LOCATION_NOT_FOUND` | 404 | No location with that ID |
| `FORBIDDEN` | 403 | Insufficient role |
| `DUPLICATE_LABEL` | 409 | New label already taken |
| `DUPLICATE_COORDINATES` | 409 | New (x, y, z) already occupied |

---

### DELETE /locations/:id

Delete a warehouse location. Blocked if location has active inventory.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`

**Response `204`:** _(no body)_

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `LOCATION_NOT_FOUND` | 404 | No location with that ID |
| `FORBIDDEN` | 403 | Insufficient role |
| `LOCATION_HAS_STOCK` | 409 | Location still holds items |

---

### PATCH /locations/:id/status

Manually override a location's status.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER`

**Request Body:**
```typescript
interface UpdateLocationStatusRequest {
  status: LocationStatus;
}
```

**Response `200`:**
```typescript
type UpdateLocationStatusResponse = LocationBase;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `LOCATION_NOT_FOUND` | 404 | No location with that ID |
| `FORBIDDEN` | 403 | Insufficient role |
| `VALIDATION_ERROR` | 400 | Invalid status value |

---

## 7. Inventory Module

### GET /inventory

View current stock levels across all product-location pairs.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER`, `WAREHOUSE_STAFF`¹, `OFFICE_STAFF`, `CHIEF_ACCOUNTANT`, `DEPUTY_ACCOUNTANT`, `ACCOUNTING_STAFF`², `SALES_STAFF`

> ¹ Requires `VIEW_WAREHOUSE_MAP` or `VIEW_MOVEMENT_HISTORY` permission  
> ² Requires `VIEW_INVENTORY` dynamic permission

**Query Parameters:**
```typescript
interface GetInventoryQuery extends PaginationQuery {
  productId?: string;
  locationId?: string;
  minQuantity?: number;
  maxQuantity?: number;
}
```

**Response `200`:**
```typescript
type GetInventoryResponse = PaginatedResponse<InventoryRecord>;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `FORBIDDEN` | 403 | Role not permitted or dynamic permission not granted |

---

### POST /inventory/stock-in

Create a goods receipt (IN) voucher. Requires approval before stock is updated.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER`, `OFFICE_STAFF`, `WAREHOUSE_STAFF` (requires `STOCK_IN` permission)

**Request Body:**
```typescript
interface StockInRequest {
  productId: string;
  locationId: string;
  quantity: number;       // must be > 0
  note?: string;
}
```

**Response `201`:**
```typescript
interface StockInResponse {
  movement: StockMovement; // voucherStatus: "PENDING" (for WAREHOUSE_STAFF / OFFICE_STAFF)
                           // voucherStatus: "APPROVED" (for ADMIN / DIRECTOR / DEPUTY_DIRECTOR / WAREHOUSE_MANAGER — auto-approved)
}
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `PRODUCT_NOT_FOUND` | 404 | Product does not exist |
| `LOCATION_NOT_FOUND` | 404 | Location does not exist |
| `FORBIDDEN` | 403 | Role not permitted or `STOCK_IN` not granted |
| `VALIDATION_ERROR` | 400 | quantity ≤ 0 |

---

### POST /inventory/stock-out

Create a goods issue (OUT) voucher. Validates available stock and **blocks** if insufficient.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER`, `OFFICE_STAFF`, `WAREHOUSE_STAFF` (requires `STOCK_OUT` permission)

**Request Body:**
```typescript
interface StockOutRequest {
  productId: string;
  locationId: string;
  quantity: number;       // must be > 0
  note?: string;
}
```

**Response `201`:**
```typescript
interface StockOutResponse {
  movement: StockMovement; // voucherStatus: "PENDING" or "APPROVED" (same rules as stock-in)
}
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `PRODUCT_NOT_FOUND` | 404 | Product does not exist |
| `LOCATION_NOT_FOUND` | 404 | Location does not exist |
| `INSUFFICIENT_STOCK` | 422 | Requested quantity exceeds available stock at the location — **transaction is blocked** |
| `FORBIDDEN` | 403 | Role not permitted or `STOCK_OUT` not granted |
| `VALIDATION_ERROR` | 400 | quantity ≤ 0 |

---

### POST /inventory/transfer

Move stock from one location to another within the warehouse.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER`, `WAREHOUSE_STAFF` (requires both `STOCK_IN` and `STOCK_OUT` permissions)

**Request Body:**
```typescript
interface TransferRequest {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;        // must be > 0
  note?: string;
}
```

**Response `201`:**
```typescript
interface TransferResponse {
  outMovement: StockMovement; // type: "TRANSFER", from location
  inMovement: StockMovement;  // type: "TRANSFER", to location
}
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `PRODUCT_NOT_FOUND` | 404 | Product does not exist |
| `LOCATION_NOT_FOUND` | 404 | Source or destination does not exist |
| `SAME_LOCATION` | 400 | fromLocationId equals toLocationId |
| `INSUFFICIENT_STOCK` | 422 | Not enough stock at source location — **blocked** |
| `FORBIDDEN` | 403 | Role not permitted or required permissions not granted |

---

## 8. Movements Module

### GET /movements

List stock movement history with filtering.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER`, `WAREHOUSE_STAFF`¹, `OFFICE_STAFF`, `CHIEF_ACCOUNTANT`, `DEPUTY_ACCOUNTANT`, `ACCOUNTING_STAFF`²

> ¹ Requires `VIEW_MOVEMENT_HISTORY` dynamic permission  
> ² Requires `VIEW_MOVEMENTS_ACCT` dynamic permission

**Query Parameters:**
```typescript
interface GetMovementsQuery extends PaginationQuery {
  type?: MovementType;
  productId?: string;
  locationId?: string;
  userId?: string;
  voucherStatus?: VoucherStatus;
  dateFrom?: string;  // ISO 8601 date
  dateTo?: string;    // ISO 8601 date
}
```

**Response `200`:**
```typescript
type GetMovementsResponse = PaginatedResponse<StockMovement>;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `FORBIDDEN` | 403 | Role not permitted or dynamic permission not granted |

---

### GET /movements/:id

Get a single movement record.

**Roles:** Same as `GET /movements`

**Response `200`:**
```typescript
type GetMovementResponse = StockMovement;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `MOVEMENT_NOT_FOUND` | 404 | No movement with that ID |
| `FORBIDDEN` | 403 | Role not permitted |

---

### GET /movements/export

Export movement history as CSV or Excel.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER`, `CHIEF_ACCOUNTANT`

**Query Parameters:**
```typescript
interface ExportMovementsQuery {
  format: "csv" | "xlsx";
  type?: MovementType;
  productId?: string;
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
}
```

**Response `200`:**
```
Content-Type: text/csv | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="movements-export.<format>"
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `FORBIDDEN` | 403 | Role not in allowed list |
| `VALIDATION_ERROR` | 400 | Invalid format value |

---

### PATCH /movements/:id/approve

Approve or reject a pending voucher. Stock is updated **only upon approval**.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER`

**Request Body:**
```typescript
interface ApproveVoucherRequest {
  action: "APPROVE" | "REJECT";
  note?: string;
}
```

**Response `200`:**
```typescript
type ApproveVoucherResponse = StockMovement; // voucherStatus updated
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `MOVEMENT_NOT_FOUND` | 404 | No movement with that ID |
| `VOUCHER_NOT_PENDING` | 409 | Voucher is already approved or rejected |
| `FORBIDDEN` | 403 | Role not in allowed list |
| `INSUFFICIENT_STOCK` | 422 | Stock dropped below required level between creation and approval (OUT only) |

---

## 9. Reports Module

### GET /reports/dashboard

Returns aggregate statistics for the dashboard overview.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER`, `CHIEF_ACCOUNTANT`, `DEPUTY_ACCOUNTANT`, `ACCOUNTING_STAFF`¹, `SALES_STAFF`

> ¹ Requires `VIEW_REPORTS` dynamic permission

**Response `200`:**
```typescript
interface DashboardStats {
  totalProducts: number;
  totalLocations: number;
  totalLocationsOccupied: number;
  totalStockValue: number;              // sum of all quantities across all locations
  pendingVouchers: number;              // vouchers awaiting approval
  movementsToday: number;
  lowStockAlerts: number;               // products below minQuantity
  recentMovements: StockMovement[];     // last 10
}

type GetDashboardResponse = DashboardStats;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `FORBIDDEN` | 403 | Role not permitted or `VIEW_REPORTS` not granted |

---

### GET /reports/forecast

Returns inventory forecast — items predicted to run out based on issue rate.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER`, `CHIEF_ACCOUNTANT`, `DEPUTY_ACCOUNTANT`, `SALES_STAFF`

**Query Parameters:**
```typescript
interface ForecastQuery {
  days?: number;        // forecast horizon in days (default: 30)
  categoryId?: string;
}
```

**Response `200`:**
```typescript
interface ForecastItem {
  product: ProductBase;
  currentQuantity: number;
  avgDailyUsage: number;       // average units issued per day (last 30 days)
  daysUntilStockout: number | null; // null if no usage history
  predictedStockoutDate: string | null; // ISO 8601 or null
  isBelowMin: boolean;
}

interface ForecastResponse {
  items: ForecastItem[];
  generatedAt: string; // ISO 8601
}
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `FORBIDDEN` | 403 | Role not permitted |

---

### GET /reports/alerts

Returns current low-stock alerts (products below minQuantity).

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER`, `SALES_STAFF`

**Response `200`:**
```typescript
interface AlertItem {
  product: ProductBase;
  currentQuantity: number;
  minQuantity: number;
  shortage: number; // minQuantity - currentQuantity
}

interface AlertsResponse {
  alerts: AlertItem[];
  total: number;
  generatedAt: string;
}
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `FORBIDDEN` | 403 | Role not permitted |

---

### GET /reports/export

Export a full inventory or movement report.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER`, `CHIEF_ACCOUNTANT`

**Query Parameters:**
```typescript
interface ExportReportQuery {
  reportType: "inventory" | "movements" | "forecast" | "alerts";
  format: "csv" | "xlsx";
  dateFrom?: string;
  dateTo?: string;
}
```

**Response `200`:**
```
Content-Type: text/csv | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="<reportType>-report.<format>"
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `FORBIDDEN` | 403 | Role not permitted |
| `VALIDATION_ERROR` | 400 | Invalid reportType or format |

---

## 10. Permissions Module

### GET /permissions/:userId

Get the dynamic permissions currently assigned to a user.

**Roles:** `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR`, `WAREHOUSE_MANAGER` (own dept only), `CHIEF_ACCOUNTANT` (own dept only), `DEPUTY_ACCOUNTANT` (own dept only), or **self**

**Response `200`:**
```typescript
interface GetPermissionsResponse {
  userId: string;
  role: Role;
  permissions: Permission[];
}
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `USER_NOT_FOUND` | 404 | No user with that ID |
| `FORBIDDEN` | 403 | Not self and not a scoped manager |
| `PERMISSIONS_NOT_APPLICABLE` | 400 | User's role does not support dynamic permissions (only WAREHOUSE_STAFF and ACCOUNTING_STAFF can have them) |

---

### PUT /permissions/:userId

Assign or revoke dynamic permissions for a subordinate.

**Roles:**
- `WAREHOUSE_MANAGER` — can assign `STOCK_IN`, `STOCK_OUT`, `VIEW_WAREHOUSE_MAP`, `VIEW_MOVEMENT_HISTORY` to `WAREHOUSE_STAFF` in their department
- `CHIEF_ACCOUNTANT` — can assign `VIEW_REPORTS`, `VIEW_INVENTORY`, `VIEW_MOVEMENTS_ACCT` to `ACCOUNTING_STAFF` in their department
- `DEPUTY_ACCOUNTANT` — same as `CHIEF_ACCOUNTANT` for accounting permissions
- `ADMIN`, `DIRECTOR`, `DEPUTY_DIRECTOR` — can assign any permission to any eligible user

**Request Body:**
```typescript
interface UpdatePermissionsRequest {
  permissions: Permission[]; // full replacement — omitted permissions are revoked
}
```

**Response `200`:**
```typescript
type UpdatePermissionsResponse = GetPermissionsResponse;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `USER_NOT_FOUND` | 404 | No user with that ID |
| `FORBIDDEN` | 403 | Target user outside manager's department or wrong role |
| `PERMISSIONS_NOT_APPLICABLE` | 400 | Target user's role cannot have dynamic permissions |
| `INVALID_PERMISSION` | 400 | Permission not valid for target user's role |

---

### GET /permissions/my

Returns the caller's own dynamic permissions.

**Roles:** Any authenticated user (meaningful for `WAREHOUSE_STAFF` and `ACCOUNTING_STAFF`)

**Response `200`:**
```typescript
type GetMyPermissionsResponse = GetPermissionsResponse;
```

**Error Cases:**
| Code | Status | Condition |
|------|--------|-----------|
| `UNAUTHORIZED` | 401 | No valid token |

---

## 11. Error Code Reference

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `UNAUTHORIZED` | 401 | JWT missing, malformed, or expired |
| `FORBIDDEN` | 403 | Authenticated but insufficient role or permission |
| `VALIDATION_ERROR` | 400 | Request body / query params failed validation |
| `INVALID_CREDENTIALS` | 401 | Wrong username or password |
| `ACCOUNT_DISABLED` | 403 | User account has been deactivated |
| `USER_NOT_FOUND` | 404 | No user found with the given ID |
| `DUPLICATE_USERNAME` | 409 | Username already in use |
| `CANNOT_DELETE_SELF` | 409 | Cannot delete one's own account |
| `PRODUCT_NOT_FOUND` | 404 | No product found with the given ID |
| `DUPLICATE_SKU` | 409 | SKU already registered to another product |
| `PRODUCT_HAS_STOCK` | 409 | Cannot delete product with existing inventory |
| `LOCATION_NOT_FOUND` | 404 | No location found with the given ID |
| `DUPLICATE_LABEL` | 409 | Location label already in use |
| `DUPLICATE_COORDINATES` | 409 | (x, y, z) coordinate already occupied |
| `LOCATION_HAS_STOCK` | 409 | Cannot delete location that holds items |
| `INSUFFICIENT_STOCK` | 422 | Stock OUT or TRANSFER quantity exceeds available stock — **transaction blocked** |
| `SAME_LOCATION` | 400 | Transfer source and destination are identical |
| `MOVEMENT_NOT_FOUND` | 404 | No movement record with the given ID |
| `VOUCHER_NOT_PENDING` | 409 | Voucher already approved or rejected |
| `VOUCHER_PENDING_APPROVAL` | 422 | Operation requires an approved voucher |
| `PERMISSIONS_NOT_APPLICABLE` | 400 | User role does not support dynamic permissions |
| `INVALID_PERMISSION` | 400 | Permission key not valid for the target role |
| `INTERNAL_ERROR` | 500 | Unhandled server-side error |

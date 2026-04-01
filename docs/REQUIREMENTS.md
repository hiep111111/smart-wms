# Smart WMS - Detailed Requirements

## 1. System Overview
Smart WMS (Smart Warehouse Management System) supports QR code scanning to track goods receipts/issues, manage virtual warehouse locations, and forecast inventory.

## 2. Database Entities
- **User**: Account management (Admin, Warehouse Staff, Office Staff, Accountant, Sale, Director).
- **Product**: Product information (SKU, Name, Unit, MinQuantity - for restock alerts).
- **Location**: Warehouse location (Zone, Row, Shelf, Level).
- **StockMovement**: Movement log (Type: IN/OUT, Quantity, ProductID, LocationID, UserID). A product can exist in multiple Locations simultaneously; total stock = sum of quantities across all Locations.

## 3. Core Features
- **QR Scanning**:
  - Scan product SKU code to retrieve product information.
  - Scan Location code to identify the put-away/pick location.
- **Inventory Management**:
  - Goods Receipt (IN): Increase stock at a specific Location.
  - Goods Issue (OUT): Decrease stock and validate balance. If stock at the Location is insufficient, the system **completely blocks** the transaction and displays a clear warning.
- **Virtual Warehouse Map**:
  - Display warehouse layout as a Grid (X, Y).
  - Cell status: Empty (White), Has Stock (Green), Full (Red).
- **Reporting & Analytics**:
  - Dashboard with inventory statistics.
  - Forecast: Alert items with quantity < MinQuantity. Forecast is based on goods issue history: calculate "item X will run out in N days at the current consumption rate".

## 4. Authorization (RBAC)

### 4.1 Role List by Group

| Group | Role | Fixed Permissions |
|---|---|---|
| **Administration** | Admin | Full system access; approve receipt/issue vouchers; manage all staff |
| **Administration** | Director | Full system access; approve receipt/issue vouchers; manage all staff |
| **Administration** | Deputy Director | Full system access; approve receipt/issue vouchers; manage all staff |
| **Warehouse** | Warehouse Manager | Approve receipt/issue vouchers; view warehouse map; view warehouse reports; manage warehouse staff in department |
| **Warehouse** | Warehouse Staff | Permissions dynamically granted by Warehouse Manager (see section 4.2) |
| **Office** | Office Staff | Create receipt/issue vouchers; view inventory; view reports |
| **Accounting** | Chief Accountant | View all financial reports; export reports; manage accounting staff in department |
| **Accounting** | Deputy Accountant | View all financial reports (cannot export); manage accounting staff in department |
| **Accounting** | Accounting Staff | Permissions dynamically granted by Chief Accountant or Deputy Accountant (see section 4.2) |
| **Sales** | Sales Staff | View inventory; view low-stock forecast |

### 4.2 Dynamic Permissions (granted by superior to subordinate)

**Warehouse Manager** can tick/untick each of the following permissions for each **Warehouse Staff**:
- Goods Receipt (create IN voucher)
- Goods Issue (create OUT voucher)
- View warehouse map
- View movement history

**Chief Accountant** and **Deputy Accountant** can both tick/untick each of the following permissions for each **Accounting Staff**:
- View reports by type (specify report type)
- View inventory
- View movement history

### 4.3 Staff Management

- **Admin / Director / Deputy Director**: view and manage all staff in the system.
- **Warehouse Manager**: view and manage only warehouse staff in their own department.
- **Chief Accountant**: view and manage only accounting staff in their own department.
- **Deputy Accountant**: view and manage only accounting staff in their own department.

### 4.4 Voucher Approval Rules

- Receipt/issue vouchers created by Warehouse Staff or Office Staff must be approved by **Admin, Director, Deputy Director, or Warehouse Manager** before stock is updated.

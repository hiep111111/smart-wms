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

**Smart WMS** (Hệ thống Quản lý Kho Thông minh) là ứng dụng web nội bộ cho phép doanh nghiệp vừa và nhỏ số hóa toàn bộ quy trình vận hành kho hàng: từ nhập kho, xuất kho, điều chuyển vị trí đến theo dõi tồn kho theo thời gian thực trên bản đồ không gian 3D.

**Điểm khác biệt cốt lõi (Smart Features):**
- Sơ đồ kho ảo 3D với tọa độ Cartesian (X, Y, Z) — nhân viên biết chính xác hàng đang ở tầng nào, dãy nào, ô nào.
- Quét mã QR để tra cứu tức thì và thực hiện giao dịch không cần gõ phím.
- Tự động gợi ý vị trí tối ưu khi nhập hàng dựa trên trạng thái thực tế của kho.
- Cảnh báo proactive khi tồn kho chạm ngưỡng tối thiểu.

**Phạm vi phiên bản 1.0:**
- Quản lý tối đa 1 kho vật lý với nhiều dãy kệ.
- Hai vai trò người dùng: Admin và Staff.
- Không hỗ trợ multi-warehouse, lot tracking, hay tích hợp ERP trong phạm vi này.

---

## 2. User Personas & Authorization Matrix

### 2.1 Persona A — Quản trị viên (Admin)

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò thực tế** | Quản lý kho / Trưởng bộ phận logistics |
| **Mục tiêu chính** | Có cái nhìn tổng quan về toàn bộ kho, kiểm soát danh mục hàng hóa và vị trí, phân tích dữ liệu để ra quyết định |
| **Nỗi đau hiện tại** | Phải đối chiếu nhiều file Excel thủ công, không biết hàng thực sự đang ở đâu, khó phát hiện sai lệch tồn kho |
| **Thiết bị sử dụng** | Chủ yếu Desktop/Laptop, đôi khi tablet |
| **Mức độ tech** | Trung bình — biết dùng phần mềm quản lý, không cần đọc code |

**Quyền hạn đầy đủ của Admin:**
- Toàn quyền CRUD: User, Product, Location, Inventory.
- Xem và export toàn bộ Audit Log (StockMovement).
- Cấu hình ngưỡng cảnh báo tồn kho (min/max stock level) cho từng sản phẩm.
- Quản lý sơ đồ kho: thêm/xóa/sửa vị trí (Location), thay đổi trạng thái vị trí.
- Thực hiện mọi giao dịch nhập/xuất/điều chuyển.
- Reset mật khẩu người dùng.

---

### 2.2 Persona B — Nhân viên vận hành (Warehouse Staff)

| Thuộc tính | Chi tiết |
|---|---|
| **Vai trò thực tế** | Nhân viên kho — bốc xếp, kiểm nhận hàng, soạn hàng |
| **Mục tiêu chính** | Thực hiện nhanh các lệnh nhập/xuất/điều chuyển, tra cứu vị trí hàng hóa, không sai sót |
| **Nỗi đau hiện tại** | Tốn thời gian đi tìm hàng trong kho lớn, ghi chép thủ công dễ nhầm, không biết vị trí nào còn trống |
| **Thiết bị sử dụng** | Điện thoại di động (camera QR), tablet gắn kệ |
| **Mức độ tech** | Cơ bản — chỉ cần thao tác đơn giản, màn hình rõ ràng |

**Quyền hạn giới hạn của Staff:**
- Xem danh sách sản phẩm và tồn kho (read-only).
- Sử dụng màn hình QR Scanner để thực hiện giao dịch nhập/xuất/điều chuyển.
- Xem lịch sử giao dịch của **chính mình** trong ngày.
- Xem bản đồ kho 3D (read-only) — không thể sửa vị trí.
- **Không thể:** xem log của người khác, xóa dữ liệu, quản lý user, quản lý cấu hình hệ thống.

---

### 2.3 Authorization Matrix (Ma trận phân quyền)

| Tính năng / Resource | Admin | Staff |
|---|:---:|:---:|
| Xem Dashboard tổng quan | ✅ | ✅ (giới hạn) |
| Quản lý User (CRUD) | ✅ | ❌ |
| Quản lý Product (CRUD) | ✅ | ❌ |
| Xem danh sách Product | ✅ | ✅ |
| Quản lý Location (CRUD) | ✅ | ❌ |
| Xem bản đồ kho 3D | ✅ | ✅ |
| Nhập kho (QR / Manual) | ✅ | ✅ |
| Xuất kho (QR / Manual) | ✅ | ✅ |
| Điều chuyển vị trí | ✅ | ✅ |
| Xem Audit Log (toàn bộ) | ✅ | ❌ |
| Xem Audit Log (của mình) | ✅ | ✅ |
| Export dữ liệu (CSV) | ✅ | ❌ |
| Cấu hình ngưỡng cảnh báo | ✅ | ❌ |
| Xem cảnh báo tồn kho | ✅ | ✅ (chỉ xem) |

---

## 3. Feature List (Prioritized)

### 3.1 Must-Have (P0 — Phiên bản 1.0)

#### F-01: Xác thực & Phân quyền (Authentication & Authorization)
**Mô tả:** Hệ thống đăng nhập bằng username/password, session JWT, tự động redirect theo role.
**Business Logic:**
- JWT được ký bằng `SESSION_SECRET`, lưu trong HTTP-only cookie.
- Middleware kiểm tra token trên mọi route `/dashboard/**`.
- Nếu token hết hạn (24h), redirect về `/login`.
- Nếu Staff cố truy cập route Admin-only (ví dụ `/dashboard/users`), trả về 403 và redirect về Dashboard.

---

#### F-02: Dashboard Tổng quan (Overview Dashboard)
**Mô tả:** Trang chủ sau khi đăng nhập, cung cấp cái nhìn nhanh về tình trạng kho.
**Business Logic:**
- Tính toán real-time: tổng SKU đang lưu trữ, tổng vị trí, tỷ lệ lấp đầy kho (% vị trí FULL / tổng vị trí).
- Cảnh báo ưu tiên: hiển thị danh sách sản phẩm có `quantity < minStockLevel` (nếu đã cấu hình).
- Hoạt động gần nhất: 10 StockMovement mới nhất trong ngày.

---

#### F-03: Quản lý Sản phẩm (Product Management)
**Mô tả:** CRUD danh mục sản phẩm, mỗi sản phẩm gắn với SKU duy nhất (dùng để tạo mã QR).
**Business Logic:**
- `sku` phải unique toàn hệ thống — validate trước khi tạo/sửa.
- Không cho phép xóa Product nếu còn tồn kho (`inventory.quantity > 0`) — hiển thị thông báo lỗi rõ ràng.
- Khi xem chi tiết sản phẩm, hiển thị tổng tồn kho (sum of all `inventory.quantity`) và danh sách các vị trí đang lưu trữ sản phẩm đó.

---

#### F-04: Quản lý Vị trí Kho (Location Management)
**Mô tả:** CRUD các ô vị trí trong kho, mỗi vị trí có tọa độ 3D duy nhất (X, Y, Z).
**Business Logic:**
- Tổ hợp `(x, y, z)` phải unique — không thể có 2 vị trí cùng tọa độ.
- Nhãn `label` được auto-generate theo convention: `A{x:02d}-S{y:02d}-T{z:02d}` (Ví dụ: `A01-S03-T05`). Admin có thể override.
- Không cho phép xóa Location nếu còn hàng trong đó (`inventory.quantity > 0`).
- Thay đổi trạng thái: AVAILABLE → RESERVED (Admin đặt thủ công để chuẩn bị cho lô hàng mới) → FULL (hệ thống tự set khi `quantity > 0`) → AVAILABLE (hệ thống tự reset khi `quantity = 0`).

**Trạng thái vị trí:**
| Status | Màu hiển thị | Ý nghĩa |
|---|---|---|
| `AVAILABLE` | Xanh lá | Trống, có thể nhập hàng vào |
| `FULL` | Đỏ | Đang có hàng |
| `RESERVED` | Vàng cam | Đã đặt chỗ, chờ nhập hàng |

---

#### F-05: Nhập kho (Goods Receipt — IN)
**Mô tả:** Ghi nhận hàng hóa nhập vào một vị trí cụ thể trong kho.
**Business Logic:**
- Tìm kiếm sản phẩm bằng SKU (quét QR hoặc gõ tay).
- Tìm kiếm vị trí bằng label hoặc chọn từ bản đồ.
- Nếu cặp `(productId, locationId)` đã tồn tại trong `Inventory`: `quantity += inputQuantity`.
- Nếu chưa tồn tại: tạo bản ghi Inventory mới với `quantity = inputQuantity`.
- Sau khi nhập: cập nhật `Location.status = FULL`, tạo `StockMovement` với `type = IN`.
- Nếu vị trí đang ở trạng thái `FULL` với sản phẩm khác loại: **cảnh báo** nhân viên nhưng vẫn cho phép (1 vị trí có thể chứa nhiều SKU trong giới hạn hệ thống v1).

---

#### F-06: Xuất kho (Goods Issue — OUT)
**Mô tả:** Ghi nhận hàng hóa xuất khỏi kho.
**Business Logic:**
- Tìm kiếm sản phẩm bằng SKU.
- Hệ thống trả về danh sách tất cả vị trí đang có sản phẩm đó (kèm `quantity`).
- Nhân viên chọn vị trí xuất hàng.
- Validate: `inputQuantity <= inventory.quantity` — **bắt buộc**, không được xuất quá tồn kho. Trả về lỗi rõ ràng.
- Sau khi xuất: `inventory.quantity -= inputQuantity`. Nếu `quantity = 0`, tự động cập nhật `Location.status = AVAILABLE` và xóa bản ghi Inventory (hoặc giữ lại với `quantity = 0` tùy config).
- Tạo `StockMovement` với `type = OUT`.

---

#### F-07: Bản đồ Kho 3D (Warehouse Map — 3D Visualization)
**Mô tả:** Hiển thị sơ đồ kho dạng không gian 3D (Three.js / isometric 2.5D), mã hóa trạng thái bằng màu sắc.
**Business Logic:**
- Render tất cả Location theo tọa độ `(x, y, z)` thực tế.
- Màu sắc theo `status` (xem bảng F-04).
- Khi click vào một ô vị trí: hiển thị popup chi tiết (label, status, danh sách hàng hóa đang chứa, tổng số lượng).
- Bộ lọc: lọc theo tầng `z` (xem từng tầng/layer), lọc theo sản phẩm (highlight các ô đang chứa SKU đó).
- Tự động cập nhật sau mỗi giao dịch (re-fetch data).

---

#### F-08: QR Scanner
**Mô tả:** Màn hình quét mã QR bằng camera thiết bị để tra cứu và thực hiện giao dịch.
**Business Logic:**
- Mã QR được tạo từ `Product.sku` (format: plain text SKU).
- Sau khi quét thành công: hiển thị thông tin sản phẩm ngay lập tức (tên, SKU, tổng tồn kho, danh sách vị trí).
- Nhân viên chọn hành động: [Nhập kho] hoặc [Xuất kho].
- Tích hợp "Smart Suggestion": tự động gợi ý vị trí tối ưu (xem F-S01).
- Hỗ trợ nhập SKU thủ công nếu camera không hoạt động.

---

#### F-09: Nhật ký Giao dịch (Audit Log / Stock Movement History)
**Mô tả:** Danh sách toàn bộ giao dịch nhập/xuất/điều chuyển theo thời gian.
**Business Logic:**
- Mỗi giao dịch lưu: loại (IN/OUT/TRANSFER), số lượng, sản phẩm, vị trí, người thực hiện, thời điểm.
- Đối với TRANSFER: lưu 2 bản ghi (OUT từ vị trí cũ, IN vào vị trí mới) hoặc thêm field `fromLocationId` / `toLocationId`.
- Lọc theo: loại giao dịch, khoảng thời gian, sản phẩm, người thực hiện.
- Admin: xem tất cả. Staff: chỉ xem giao dịch do mình thực hiện.
- Không được phép xóa hay sửa bất kỳ bản ghi nào — immutable audit trail.

---

### 3.2 Should-Have (P1 — Phiên bản 1.1)

#### F-10: Điều chuyển Vị trí (Location Transfer)
**Mô tả:** Di chuyển một lượng hàng từ vị trí A sang vị trí B trong cùng kho.
**Business Logic:**
- Là giao dịch nguyên tử: OUT từ nguồn và IN vào đích xảy ra trong cùng 1 transaction DB.
- Validate: vị trí đích phải ở trạng thái AVAILABLE hoặc FULL (cùng SKU).
- Tạo `StockMovement` với `type = TRANSFER`, kèm `fromLocationId` và `toLocationId`.

---

#### F-11: Cảnh báo Tồn kho (Stock Alert)
**Mô tả:** Hệ thống tự động cảnh báo khi tồn kho chạm ngưỡng.
**Business Logic:**
- Admin cấu hình `minStockLevel` và `maxStockLevel` cho từng Product.
- Background job (hoặc on-demand khi load Dashboard): quét tất cả Inventory, so sánh `sum(quantity)` với ngưỡng.
- Hiển thị badge cảnh báo trên sidebar và banner trên Dashboard.
- Trạng thái cảnh báo: `LOW_STOCK` (dưới min), `OUT_OF_STOCK` (= 0), `OVERSTOCK` (trên max).

---

#### F-12: Tạo & In mã QR sản phẩm
**Mô tả:** Từ trang chi tiết sản phẩm, Admin có thể tạo và in mã QR chứa SKU.
**Business Logic:**
- Generate QR code client-side từ `Product.sku` (dùng thư viện `qrcode` hoặc tương đương).
- Hỗ trợ in trang QR với template: tên sản phẩm, SKU, QR code image, ngày tạo.
- Batch print: chọn nhiều sản phẩm và in tất cả QR trong 1 lần.

---

#### F-13: Báo cáo & Export
**Mô tả:** Xuất dữ liệu tồn kho và giao dịch ra file CSV.
**Business Logic:**
- Báo cáo tồn kho hiện tại: Product | SKU | Total Quantity | Locations.
- Báo cáo giao dịch: lọc theo khoảng thời gian, xuất CSV.
- Chỉ Admin mới có quyền export.

---

#### F-14: Quản lý Người dùng (User Management)
**Mô tả:** Admin quản lý tài khoản nhân viên.
**Business Logic:**
- Tạo tài khoản mới: username unique, auto-hash password với bcrypt.
- Thay đổi role (ADMIN / STAFF).
- Vô hiệu hóa tài khoản (soft disable — thêm `isActive` field) thay vì xóa, để giữ lại lịch sử giao dịch.
- Admin không thể tự xóa tài khoản của mình.

---

## 4. Data Model Reference

Dựa trên `schema.prisma` hiện tại. Phần này ghi chú các trường cần bổ sung cho phiên bản 1.0 và 1.1.

### 4.1 Model hiện tại (đã triển khai)

```
User          → id, username, passwordHash, role, createdAt
Product       → id, sku, name, description, category, unit, createdAt, updatedAt
Location      → id, label, x, y, z, status
Inventory     → id, productId, locationId, quantity
StockMovement → id, type, quantity, productId, locationId, userId, createdAt
```

### 4.2 Trường cần bổ sung (Schema Extension — v1.1)

| Model | Field mới | Type | Mô tả |
|---|---|---|---|
| `Product` | `minStockLevel` | `Int?` | Ngưỡng cảnh báo tồn kho tối thiểu |
| `Product` | `maxStockLevel` | `Int?` | Ngưỡng cảnh báo tồn kho tối đa |
| `Product` | `imageUrl` | `String?` | Ảnh sản phẩm (URL hoặc base64) |
| `User` | `isActive` | `Boolean` | Soft disable tài khoản |
| `StockMovement` | `note` | `String?` | Ghi chú tự do cho giao dịch |
| `StockMovement` | `fromLocationId` | `String?` | Nguồn (cho type = TRANSFER) |

> **Quy tắc:** Mọi thay đổi schema phải qua Planning Mode (`/plan`) trước khi viết migration.

---

## 5. Sitemap & Screen Specifications

```
/login                          → Màn hình đăng nhập
/dashboard                      → Dashboard tổng quan
/dashboard/products             → Danh sách sản phẩm
/dashboard/products/new         → Tạo sản phẩm mới
/dashboard/products/[id]        → Chi tiết / Sửa sản phẩm
/dashboard/locations            → Danh sách vị trí kho
/dashboard/locations/new        → Tạo vị trí mới
/dashboard/map                  → Bản đồ kho 3D
/dashboard/scanner              → QR Scanner
/dashboard/movements            → Nhật ký giao dịch (Audit Log)
/dashboard/users                → Quản lý người dùng (Admin only)
/dashboard/users/new            → Tạo tài khoản mới (Admin only)
```

---

### 5.1 Màn hình: `/login`
**Mục đích:** Xác thực người dùng.
**Nội dung hiển thị:**
- Logo / tên hệ thống "Smart WMS".
- Form: Username, Password, nút Đăng nhập.
- Thông báo lỗi inline nếu sai thông tin.

**Luồng điều hướng:** Thành công → `/dashboard`. Session còn hạn → auto redirect từ `/login` về `/dashboard`.

---

### 5.2 Màn hình: `/dashboard`
**Mục đích:** Cung cấp cái nhìn tổng quan nhanh về tình trạng kho.
**Nội dung hiển thị:**

**KPI Cards (hàng đầu):**
- Tổng số SKU đang lưu kho.
- Tổng vị trí / Vị trí đang sử dụng / Vị trí còn trống.
- Tỷ lệ lấp đầy kho (progress bar, %).
- Số cảnh báo tồn kho đang hoạt động.

**Bảng: Cảnh báo Tồn kho (nếu có):**
- Danh sách sản phẩm `LOW_STOCK` / `OUT_OF_STOCK`.
- Mỗi dòng: SKU, Tên sản phẩm, Tồn kho hiện tại, Ngưỡng tối thiểu, Badge trạng thái.

**Bảng: Hoạt động gần nhất:**
- 10 StockMovement mới nhất.
- Mỗi dòng: Thời gian, Loại (IN/OUT/TRANSFER badge), Sản phẩm, Vị trí, Số lượng, Người thực hiện.

**Quick Actions (Staff):**
- Nút [Quét QR] → `/dashboard/scanner`.
- Nút [Xem bản đồ] → `/dashboard/map`.

---

### 5.3 Màn hình: `/dashboard/products`
**Mục đích:** Xem và quản lý danh mục sản phẩm.
**Nội dung hiển thị:**
- Thanh tìm kiếm (theo tên hoặc SKU, real-time filter).
- Bộ lọc theo Category.
- Bảng sản phẩm: SKU | Tên | Danh mục | Đơn vị | Tổng tồn kho | Trạng thái cảnh báo | Hành động.
- Nút [Thêm sản phẩm] (Admin only).
- Pagination: 20 sản phẩm/trang.

**Hành động trên mỗi dòng:**
- [Xem chi tiết] → `/dashboard/products/[id]`
- [Tạo QR] — mở modal xem và in QR code (Admin only).
- [Xóa] — chỉ hiện khi tồn kho = 0, có confirm dialog (Admin only).

---

### 5.4 Màn hình: `/dashboard/products/[id]`
**Mục đích:** Xem chi tiết và chỉnh sửa thông tin sản phẩm.
**Nội dung hiển thị:**
- Form chỉnh sửa: SKU (read-only), Tên, Danh mục, Đơn vị, Mô tả, Ngưỡng min/max stock (Admin only).
- **Panel Tồn kho:** Bảng các vị trí đang chứa sản phẩm này (Label, X/Y/Z, Số lượng). Tổng cộng: N đơn vị tại M vị trí.
- **Panel QR Code:** Hiển thị QR image của SKU, nút [In QR].
- **Panel Lịch sử:** 20 giao dịch gần nhất liên quan đến sản phẩm này.

---

### 5.5 Màn hình: `/dashboard/locations`
**Mục đích:** Xem và quản lý các vị trí trong kho.
**Nội dung hiển thị:**
- Bộ lọc theo trạng thái (AVAILABLE / FULL / RESERVED) và theo tầng Z.
- Bảng vị trí: Label | Tọa độ (X, Y, Z) | Trạng thái | Hàng hóa đang chứa | Số lượng | Hành động.
- Nút [Thêm vị trí] (Admin only).

**Thao tác Admin trên mỗi dòng:**
- Thay đổi trạng thái (ví dụ: đặt RESERVED).
- Xóa (chỉ khi tồn kho = 0).

---

### 5.6 Màn hình: `/dashboard/map`
**Mục đích:** Trực quan hóa không gian kho 3D.
**Nội dung hiển thị:**
- Canvas 3D (hoặc isometric 2.5D) rendering tất cả Location.
- Legend màu sắc: Xanh lá (AVAILABLE), Đỏ (FULL), Vàng (RESERVED).
- **Thanh điều khiển:**
  - Slider "Tầng" (Z-axis filter): chỉ hiện các ô thuộc tầng Z đã chọn.
  - Dropdown "Tìm theo sản phẩm": nhập SKU → highlight tất cả ô chứa sản phẩm đó.
  - Nút [Reset view].
- **Popup khi click vào ô:**
  - Label vị trí, tọa độ X/Y/Z.
  - Trạng thái.
  - Danh sách hàng hóa đang chứa (SKU, Tên, Số lượng).
  - Nút [Nhập hàng vào đây] / [Xuất hàng] → điều hướng đến Scanner với vị trí đã điền sẵn.

---

### 5.7 Màn hình: `/dashboard/scanner`
**Mục đích:** Giao diện chính cho nhân viên thực hiện giao dịch qua QR.
**Thiết kế:** Mobile-first, font chữ lớn, nút bấm to.
**Nội dung hiển thị:**

**Bước 1 — Quét/Nhập sản phẩm:**
- Vùng camera live preview (dùng `html5-qrcode` hoặc tương đương).
- Ô nhập SKU thủ công (fallback).
- Sau khi quét: hiển thị card sản phẩm (tên, SKU, ảnh thumbnail, tổng tồn kho hiện tại).

**Bước 2 — Chọn hành động:**
- Nút lớn: [NHẬP KHO] (màu xanh) / [XUẤT KHO] (màu đỏ).

**Bước 3 — Nhập chi tiết giao dịch:**
- Ô số lượng (numeric keypad-friendly).
- Chọn vị trí (dropdown hoặc quét QR vị trí).
- **Smart Suggestion** (xem F-S01): gợi ý vị trí tối ưu tự động.
- Ô ghi chú tùy chọn.
- Nút [Xác nhận giao dịch].

**Bước 4 — Xác nhận:**
- Màn hình thành công với summary: loại GD, sản phẩm, vị trí, số lượng, thời gian.
- Nút [Giao dịch mới] để quay về Bước 1.

---

### 5.8 Màn hình: `/dashboard/movements`
**Mục đích:** Nhật ký toàn bộ giao dịch — Audit Trail.
**Nội dung hiển thị:**
- **Bộ lọc:**
  - Loại GD: Tất cả / IN / OUT / TRANSFER.
  - Khoảng ngày.
  - Tìm theo SKU hoặc tên sản phẩm.
  - Tìm theo người thực hiện (Admin only).
- **Bảng:**
  - Thời gian | Loại | Sản phẩm (SKU + Tên) | Vị trí | Số lượng | Người thực hiện | Ghi chú.
- **Nút Export CSV** (Admin only).
- Pagination: 50 dòng/trang.

---

### 5.9 Màn hình: `/dashboard/users` (Admin only)
**Mục đích:** Quản lý tài khoản nhân viên.
**Nội dung hiển thị:**
- Bảng: Username | Role | Trạng thái (Active/Inactive) | Ngày tạo | Hành động.
- Hành động: [Thay đổi role], [Vô hiệu hóa / Kích hoạt], [Reset mật khẩu].
- Nút [Thêm tài khoản mới].

---

## 6. User Flows

### 6.1 User Flow: Nhập hàng bằng QR Scanner

**Actor:** Warehouse Staff hoặc Admin
**Trigger:** Xe hàng mới vào kho, cần ghi nhận vào hệ thống
**Điều kiện tiên quyết:** Hàng hóa đã có trong danh mục Product (có SKU và QR), nhân viên đã đăng nhập

```
[Bắt đầu]
    │
    ▼
[1] Nhân viên mở ứng dụng trên điện thoại
    → Nhấn nút [Quét QR] từ Dashboard hoặc sidebar
    → Hệ thống điều hướng đến /dashboard/scanner

    │
    ▼
[2] Nhân viên dùng camera quét mã QR trên kiện hàng
    → (Nếu QR không đọc được) → Nhập SKU thủ công vào ô text
    → Hệ thống gọi API: GET /api/products?sku={sku}

    │
    ├─── [FAIL: SKU không tồn tại] ──→ Hiển thị lỗi "Mã hàng không tìm thấy trong hệ thống"
    │                                   → Yêu cầu nhân viên kiểm tra lại hoặc báo Admin thêm sản phẩm
    │
    ▼ [SUCCESS]
[3] Hệ thống hiển thị Product Card:
    - Tên sản phẩm, SKU, Đơn vị
    - Tổng tồn kho hiện tại: N [đơn vị] tại M vị trí
    - Danh sách vị trí đang có hàng (nếu có)

    │
    ▼
[4] Nhân viên nhấn nút [NHẬP KHO]
    → Hệ thống chuyển sang step nhập chi tiết

    │
    ▼
[5] Nhân viên nhập số lượng cần nhập kho
    → Validate: số nguyên dương, > 0

    │
    ▼
[6] Hệ thống tự động gọi "Smart Location Suggestion":
    → Tìm vị trí đang chứa cùng SKU đó (ưu tiên gom hàng về 1 chỗ)
    → Nếu không có: tìm vị trí AVAILABLE gần nhất (khoảng cách Euclidean từ cửa kho)
    → Hiển thị Top 3 gợi ý (xem F-S01 chi tiết)

    │
    ▼
[7] Nhân viên chọn vị trí:
    ├── Chọn 1 trong các gợi ý
    ├── Tìm kiếm thủ công bằng label vị trí
    └── Quét QR vị trí (nếu các kệ có dán QR)

    │
    ├─── [Vị trí đang RESERVED bởi SKU khác] ─→ Hiển thị cảnh báo "Vị trí này đã đặt chỗ cho hàng khác"
    │                                             → Hỏi xác nhận tiếp tục hay chọn vị trí khác
    │
    ▼ [Vị trí hợp lệ]
[8] Nhân viên (tùy chọn) nhập ghi chú
    → Ví dụ: "Lô hàng từ NCC ABC, ngày 21/03/2026"

    │
    ▼
[9] Nhân viên nhấn [Xác nhận giao dịch]
    → Hệ thống hiển thị modal xác nhận:
      "Nhập 50 Thùng SP-001 vào vị trí A03-S01-T02. Xác nhận?"
    → Nút [Xác nhận] / [Hủy]

    │
    ▼
[10] Sau khi xác nhận — Hệ thống thực hiện:
    a) Upsert bản ghi Inventory (productId, locationId, quantity += N)
    b) Cập nhật Location.status = FULL
    c) Tạo bản ghi StockMovement (type=IN, quantity=N, productId, locationId, userId, note)
    → Toàn bộ trong 1 DB transaction

    │
    ├─── [DB Error] ─→ Rollback, hiển thị lỗi kỹ thuật, yêu cầu thử lại
    │
    ▼ [SUCCESS]
[11] Màn hình thành công:
    ✅ Icon thành công lớn
    - Tóm tắt: NHẬP KHO | SP-001 | A03-S01-T02 | +50 Thùng | 14:32:05
    - Nút [Giao dịch mới] → Quay về Bước 1
    - Nút [Về Dashboard]

[Kết thúc]
```

---

### 6.2 User Flow: Xuất hàng theo lệnh

**Actor:** Warehouse Staff hoặc Admin
**Trigger:** Có lệnh xuất hàng (đơn hàng, yêu cầu sản xuất, v.v.)
**Điều kiện tiên quyết:** Hàng hóa đang tồn kho > 0

```
[Bắt đầu]
    │
    ▼
[1] Nhân viên mở /dashboard/scanner
    → Quét QR hoặc nhập SKU sản phẩm cần xuất

    │
    ▼
[2] Hệ thống hiển thị Product Card + danh sách vị trí đang chứa:
    ┌─────────────────────────────────┐
    │ SP-001 - Sản phẩm A             │
    │ Tổng tồn: 150 Thùng             │
    │                                 │
    │ Vị trí đang có hàng:            │
    │ A01-S02-T01: 80 Thùng  [Chọn]  │
    │ A03-S01-T02: 50 Thùng  [Chọn]  │
    │ B02-S04-T03: 20 Thùng  [Chọn]  │
    └─────────────────────────────────┘

    │
    ▼
[3] Nhân viên nhấn [XUẤT KHO]

    │
    ▼
[4] Nhân viên nhập số lượng cần xuất

    │
    ▼
[5] Nhân viên chọn vị trí xuất hàng:
    ├── Chọn từ danh sách gợi ý (Smart: ưu tiên vị trí gần lối ra nhất — Z thấp nhất)
    └── Tìm kiếm thủ công

    │
    ▼
[6] Hệ thống validate:
    ├─── [inputQuantity > inventory.quantity tại vị trí đó]
    │       → LỖI: "Số lượng xuất (N) vượt quá tồn kho tại vị trí này (M)"
    │       → Không cho phép tiếp tục
    │
    ▼ [Hợp lệ]
[7] Xác nhận giao dịch (tương tự bước 9 của luồng Nhập)

    │
    ▼
[8] Hệ thống thực hiện:
    a) inventory.quantity -= inputQuantity
    b) Nếu quantity = 0: Location.status = AVAILABLE, xóa/zero bản ghi Inventory
    c) Kiểm tra cảnh báo tồn kho: nếu sum(quantity) của product < minStockLevel → flag LOW_STOCK
    d) Tạo StockMovement (type=OUT)
    → Trong 1 DB transaction

    │
    ▼
[9] Màn hình thành công với summary xuất kho.
    - Nếu có cảnh báo tồn kho thấp: hiển thị thêm banner cảnh báo vàng.

[Kết thúc]
```

---

### 6.3 User Flow: Điều chuyển Vị trí (Transfer)

**Actor:** Warehouse Staff hoặc Admin
**Trigger:** Cần tổ chức lại kho, giải phóng vị trí, gom hàng

```
[Bắt đầu]
    │
    ▼
[1] Từ bản đồ kho (Map), nhân viên click vào ô nguồn (FULL)
    → Popup hiện ra → Nhấn [Di chuyển hàng]
    HOẶC từ /dashboard/scanner chọn hành động [ĐIỀU CHUYỂN]

    │
    ▼
[2] Hệ thống hiển thị form Transfer:
    - Sản phẩm: [đã điền nếu vào từ Map]
    - Vị trí nguồn: [đã điền] — hiển thị số lượng hiện tại
    - Số lượng điều chuyển: [nhập]
    - Vị trí đích: [chọn — Smart Suggestion ưu tiên vị trí AVAILABLE gần nhất]

    │
    ▼
[3] Validate:
    - Số lượng > 0 và ≤ tồn kho tại nguồn
    - Vị trí đích ≠ vị trí nguồn
    - Vị trí đích không phải RESERVED (hoặc RESERVED bởi cùng SKU)

    │
    ▼
[4] Xác nhận → Hệ thống thực hiện transaction nguyên tử:
    a) OUT từ (productId, fromLocationId): quantity -= N
    b) IN vào (productId, toLocationId): quantity += N (upsert)
    c) Cập nhật status 2 vị trí
    d) Tạo StockMovement (type=TRANSFER, fromLocationId, toLocationId)

    │
    ▼
[5] Thành công — Bản đồ kho tự cập nhật màu sắc 2 vị trí.

[Kết thúc]
```

---

## 7. Business Rules Catalog

Đây là danh sách cô đọng tất cả business rules trong hệ thống, để làm tham chiếu khi viết code.

| ID | Rule | Scope | Severity |
|---|---|---|---|
| BR-01 | `(x, y, z)` của Location phải unique trong toàn hệ thống | Location | ERROR — block |
| BR-02 | `Product.sku` phải unique | Product | ERROR — block |
| BR-03 | Không xóa Product khi còn tồn kho | Product | ERROR — block |
| BR-04 | Không xóa Location khi còn hàng | Location | ERROR — block |
| BR-05 | Số lượng xuất không vượt tồn kho tại vị trí | OUT transaction | ERROR — block |
| BR-06 | Tồn kho không bao giờ âm | Inventory | ERROR — block (DB constraint) |
| BR-07 | Mọi giao dịch IN/OUT/TRANSFER phải ghi vào StockMovement | Transaction | SYSTEM — auto |
| BR-08 | StockMovement là immutable — không cho sửa/xóa | Audit | SYSTEM — no UI |
| BR-09 | Khi quantity Inventory = 0, Location.status = AVAILABLE | Location | SYSTEM — auto |
| BR-10 | Khi quantity Inventory > 0, Location.status = FULL | Location | SYSTEM — auto |
| BR-11 | Transfer là atomic (cả 2 legs thành công hoặc cả 2 rollback) | Transfer | SYSTEM — DB transaction |
| BR-12 | Staff chỉ xem Audit Log của chính mình | Authorization | AUTH — middleware |
| BR-13 | Admin không tự xóa tài khoản của mình | User | ERROR — block |

---

## 8. Smart Features Specification

### F-S01: Smart Location Suggestion (Gợi ý vị trí thông minh)

**Kích hoạt:** Sau khi quét QR sản phẩm và chọn hành động [NHẬP KHO].

**Thuật toán gợi ý (theo thứ tự ưu tiên):**

```
1. CONSOLIDATION (Gom hàng):
   → Tìm tất cả Location đang có cùng productId này
   → Ưu tiên vị trí gần cửa kho nhất (giả định cửa kho tại x=0, y=0)
   → Khoảng cách = sqrt(x² + y²) (bỏ qua z để tránh gợi ý tầng cao)
   → Nếu tìm thấy: đưa vào danh sách gợi ý với label "Đang có hàng cùng loại"

2. NEAREST AVAILABLE:
   → Tìm tất cả Location có status = AVAILABLE
   → Sắp xếp theo khoảng cách Euclidean từ điểm (0, 0, 0)
   → Lấy top 3 gần nhất
   → Label: "Vị trí trống gần nhất"

3. RESERVED FOR THIS SKU:
   → Tìm Location có status = RESERVED và đang chứa cùng productId
   → Đây là vị trí đã được Admin đặt chỗ trước
   → Ưu tiên cao nhất, hiển thị badge "Đã đặt chỗ"
```

**Output:** Danh sách tối đa 3 vị trí gợi ý, mỗi item hiển thị:
- Label vị trí, tọa độ X/Y/Z.
- Lý do gợi ý (badge màu).
- Số lượng hiện tại (nếu đang có hàng cùng loại).

---

### F-S02: Real-time Stock Status trên 3D Map

**Mô tả:** Bản đồ kho phản ánh trạng thái thực tế ngay sau mỗi giao dịch.

**Cơ chế:** Sau mỗi API call giao dịch thành công (IN/OUT/TRANSFER), client invalidate cache và re-fetch data cho Map component. Không cần WebSocket cho v1.0.

---

### F-S03: Cảnh báo Tồn kho Proactive

**Mô tả:** Hệ thống tự tính và hiển thị cảnh báo mà không cần người dùng chủ động tra cứu.

**Cơ chế:**
- Sau mỗi giao dịch OUT: server-side kiểm tra tổng tồn kho của product đó.
- Nếu `sum(quantity) <= Product.minStockLevel`: thêm bản ghi vào bảng `StockAlert` (hoặc computed on-the-fly).
- Badge cảnh báo trên sidebar được tính bằng API call nhẹ: `GET /api/alerts/count`.
- Dashboard hiển thị danh sách đầy đủ.

---

## 9. Non-Functional Requirements

### 9.1 Hiệu năng (Performance)
- Trang Dashboard load trong < 2 giây (với dữ liệu < 10,000 giao dịch).
- QR Scanner phản hồi sau khi quét < 500ms.
- Bản đồ kho 3D render < 3 giây với 200 vị trí.

### 9.2 Bảo mật (Security)
- Mật khẩu hash bằng `bcrypt` (cost factor ≥ 12).
- JWT session trong HTTP-only cookie, SameSite=Strict.
- Input sanitization trên tất cả form — tránh SQL Injection (Prisma ORM đã xử lý), XSS.
- Rate limiting trên `/api/auth/login`: tối đa 10 lần thử/5 phút/IP.

### 9.3 Khả năng sử dụng (Usability)
- Mobile-first cho màn hình QR Scanner.
- Font size tối thiểu 16px trên mobile.
- Màu sắc trạng thái phải đạt WCAG AA contrast ratio.
- Thao tác nhập kho cơ bản hoàn thành trong ≤ 3 lần tap trên mobile.

### 9.4 Độ tin cậy (Reliability)
- Tất cả giao dịch kho phải được ghi vào Audit Log — không có giao dịch "im lặng".
- Mọi thao tác thay đổi tồn kho phải trong DB transaction để đảm bảo tính nhất quán.

---

## 10. Glossary

| Thuật ngữ | Định nghĩa |
|---|---|
| **SKU** (Stock Keeping Unit) | Mã định danh duy nhất của một sản phẩm trong hệ thống |
| **Location** | Một ô vị trí vật lý trong kho, được định danh bằng tọa độ (X, Y, Z) |
| **Inventory** | Bản ghi thể hiện số lượng của một SKU đang ở một Location cụ thể |
| **StockMovement** | Bản ghi lịch sử mỗi lần hàng hóa thay đổi số lượng hoặc vị trí |
| **IN** | Giao dịch nhập kho — hàng đến và được đặt vào một vị trí |
| **OUT** | Giao dịch xuất kho — hàng rời khỏi một vị trí |
| **TRANSFER** | Giao dịch điều chuyển nội bộ — hàng di chuyển từ vị trí A sang vị trí B |
| **X (Row)** | Chiều ngang — số thứ tự dãy kệ trong kho |
| **Y (Section)** | Chiều sâu — số thứ tự ô trên một dãy kệ |
| **Z (Tier/Level)** | Chiều cao — số thứ tự tầng của kệ |
| **Consolidation** | Chiến lược gom tất cả hàng cùng SKU về ít vị trí nhất có thể |
| **Atomic transaction** | Nhóm các thao tác DB xảy ra cùng lúc hoặc không xảy ra (all-or-nothing) |
| **Audit Trail** | Nhật ký bất biến ghi lại tất cả thay đổi dữ liệu quan trọng |

---

*Tài liệu này là kim chỉ nam cho toàn bộ quá trình phát triển Smart WMS v1.0 và v1.1. Mọi thay đổi nghiệp vụ đáng kể phải được cập nhật vào tài liệu này trước khi viết code.*

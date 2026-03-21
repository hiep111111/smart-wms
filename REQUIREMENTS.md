# Smart WMS - Detailed Requirements

## 1. Tổng quan hệ thống
Hệ thống quản lý kho thông minh (Smart WMS) hỗ trợ quét mã QR để theo dõi nhập/xuất hàng, quản lý vị trí kho ảo và dự báo tồn kho.

## 2. Các thực thể dữ liệu (Database Entities)
- **User**: Quản lý tài khoản (Admin, Warehouse Staff, Office Staff, Kế toán, Sale, Giám đốc).
- **Product**: Thông tin sản phẩm (SKU, Name, Unit, MinQuantity - để cảnh báo nhập hàng).
- **Location**: Vị trí trong kho (Zone, Row, Shelf, Level).
- **StockMovement**: Nhật ký biến động (Type: IN/OUT, Quantity, ProductID, LocationID, UserID). Một sản phẩm có thể tồn tại ở nhiều Location cùng lúc; tồn kho tổng = tổng số lượng trên tất cả các Location.

## 3. Các tính năng cốt lõi (Core Features)
- **QR Scanning**: 
  - Quét mã SKU sản phẩm để truy xuất thông tin.
  - Quét mã Location để xác định vị trí đặt/lấy hàng.
- **Inventory Management**:
  - Nhập hàng (IN): Tăng tồn kho tại một Location cụ thể.
  - Xuất hàng (OUT): Giảm tồn kho và kiểm tra số dư. Nếu tồn kho tại Location không đủ, hệ thống **chặn hoàn toàn** giao dịch và hiển thị cảnh báo rõ ràng.
- **Virtual Warehouse Map**: 
  - Hiển thị sơ đồ kho dạng Grid (X, Y).
  - Trạng thái ô kho: Trống (Trắng), Có hàng (Xanh), Đầy (Đỏ).
- **Reporting & Analytics**:
  - Dashboard thống kê hàng tồn.
  - Dự báo (Forecast): Cảnh báo các mặt hàng có số lượng < MinQuantity. Dự báo dựa trên lịch sử xuất hàng: tính toán "hàng X sẽ hết sau N ngày với tốc độ tiêu thụ hiện tại".

## 4. Phân quyền (RBAC)

### 4.1 Danh sách vai trò theo nhóm

| Nhóm | Vai trò | Quyền cố định |
|---|---|---|
| **Quản trị** | Admin | Toàn quyền hệ thống; phê duyệt phiếu nhập/xuất; quản lý tất cả nhân viên |
| **Quản trị** | Giám đốc | Toàn quyền hệ thống; phê duyệt phiếu nhập/xuất; quản lý tất cả nhân viên |
| **Quản trị** | Phó Giám đốc | Toàn quyền hệ thống; phê duyệt phiếu nhập/xuất; quản lý tất cả nhân viên |
| **Kho** | Thủ kho | Phê duyệt phiếu nhập/xuất; xem sơ đồ kho; xem báo cáo kho; quản lý nhân viên kho trong bộ phận |
| **Kho** | Nhân viên kho | Quyền do Thủ kho cấp động (xem mục 4.2) |
| **Văn phòng** | Nhân viên văn phòng | Tạo phiếu nhập/xuất; xem tồn kho; xem báo cáo |
| **Kế toán** | Kế toán trưởng | Xem toàn bộ báo cáo tài chính; xuất báo cáo; quản lý nhân viên kế toán trong bộ phận |
| **Kế toán** | Kế toán phó | Xem toàn bộ báo cáo tài chính (không được xuất); quản lý nhân viên kế toán trong bộ phận |
| **Kế toán** | Nhân viên kế toán | Quyền do Kế toán trưởng hoặc Kế toán phó cấp động (xem mục 4.2) |
| **Kinh doanh** | Nhân viên Sale | Xem tồn kho; xem dự báo hàng sắp hết |

### 4.2 Quyền động (cấp trên cấp cho cấp dưới)

**Thủ kho** có thể tick/untick từng quyền sau cho từng **Nhân viên kho**:
- Nhập hàng (tạo phiếu IN)
- Xuất hàng (tạo phiếu OUT)
- Xem sơ đồ kho
- Xem lịch sử biến động

**Kế toán trưởng** và **Kế toán phó** đều có thể tick/untick từng quyền sau cho từng **Nhân viên kế toán**:
- Xem báo cáo theo loại (chỉ định loại báo cáo cụ thể)
- Xem tồn kho
- Xem lịch sử biến động

### 4.3 Quản lý nhân viên

- **Admin / Giám đốc / Phó Giám đốc**: xem và quản lý tất cả nhân viên trong hệ thống.
- **Thủ kho**: chỉ xem và quản lý nhân viên kho trong bộ phận mình.
- **Kế toán trưởng**: chỉ xem và quản lý nhân viên kế toán trong bộ phận mình.
- **Kế toán phó**: chỉ xem và quản lý nhân viên kế toán trong bộ phận mình.

### 4.4 Quy tắc phê duyệt phiếu

- Phiếu nhập/xuất hàng do Nhân viên kho, Nhân viên văn phòng tạo phải được **Admin, Giám đốc, Phó Giám đốc hoặc Thủ kho** phê duyệt trước khi tồn kho thay đổi.
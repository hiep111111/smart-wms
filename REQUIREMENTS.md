# Smart WMS - Detailed Requirements

## 1. Tổng quan hệ thống
Hệ thống quản lý kho thông minh (Smart WMS) hỗ trợ quét mã QR để theo dõi nhập/xuất hàng, quản lý vị trí kho ảo và dự báo tồn kho.

## 2. Các thực thể dữ liệu (Database Entities)
- **User**: Quản lý tài khoản (Admin, Warehouse Staff).
- **Product**: Thông tin sản phẩm (SKU, Name, Unit, MinQuantity - để cảnh báo nhập hàng).
- **Location**: Vị trí trong kho (Zone, Row, Shelf, Level).
- **StockMovement**: Nhật ký biến động (Type: IN/OUT, Quantity, ProductID, LocationID, UserID).

## 3. Các tính năng cốt lõi (Core Features)
- **QR Scanning**: 
  - Quét mã SKU sản phẩm để truy xuất thông tin.
  - Quét mã Location để xác định vị trí đặt/lấy hàng.
- **Inventory Management**:
  - Nhập hàng (IN): Tăng tồn kho tại một Location cụ thể.
  - Xuất hàng (OUT): Giảm tồn kho và kiểm tra số dư.
- **Virtual Warehouse Map**: 
  - Hiển thị sơ đồ kho dạng Grid (X, Y).
  - Trạng thái ô kho: Trống (Trắng), Có hàng (Xanh), Đầy (Đỏ).
- **Reporting & Analytics**:
  - Dashboard thống kê hàng tồn.
  - Dự báo (Forecast): Cảnh báo các mặt hàng có số lượng < MinQuantity.

## 4. Phân quyền (RBAC)
- **Admin**: Quản lý User, cấu hình sơ đồ kho, xem báo cáo tổng quát.
- **Staff**: Thực hiện quét QR, nhập/xuất hàng, xem sơ đồ kho.
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Bat dau xoa du lieu cu...");
  // Clear existing data safely to avoid conflicts
  await db.stockMovement.deleteMany();
  await db.inventory.deleteMany();
  await db.permission.deleteMany();
  await db.user.deleteMany();
  await db.location.deleteMany();
  await db.product.deleteMany();

  console.log("Xoa hoan tat. Bat dau chen du lieu...");

  // Insert Users
  const passwordHashAdmin = await bcrypt.hash('admin123', 10);
  const passwordHashQuanly = await bcrypt.hash('quanly123', 10);
  const passwordHashThukho = await bcrypt.hash('thukho123', 10);
  const passwordHashKetoan = await bcrypt.hash('ketoan123', 10);

  const admin = await db.user.create({
    data: { username: 'admin', passwordHash: passwordHashAdmin, role: 'ADMIN' }
  });
  const quanly = await db.user.create({
    data: { username: 'quanly', passwordHash: passwordHashQuanly, role: 'WAREHOUSE_MANAGER' }
  });
  const thukho = await db.user.create({
    data: { username: 'thukho', passwordHash: passwordHashThukho, role: 'WAREHOUSE_STAFF' }
  });
  const ketoan = await db.user.create({
    data: { username: 'ketoan', passwordHash: passwordHashKetoan, role: 'CHIEF_ACCOUNTANT' }
  });

  console.log("Chen nguoi dung hoan tat.");

  // Insert Products
  const productsData = [
    { sku: "IP-15-PRM-256", name: "iPhone 15 Pro Max 256GB", category: "Điện thoại", unit: "Chiếc", minQuantity: 10 },
    { sku: "SS-S24-ULT-512", name: "Samsung Galaxy S24 Ultra 512GB", category: "Điện thoại", unit: "Chiếc", minQuantity: 5 },
    { sku: "MAC-M3-PRO-14", name: "MacBook Pro 14 inch M3 Pro", category: "Laptop", unit: "Chiếc", minQuantity: 3 },
    { sku: "DELL-U2723QE", name: "Màn hình Dell UltraSharp 27 4K", category: "Màn hình", unit: "Chiếc", minQuantity: 5 },
    { sku: "LOGI-MX-MASTER-3S", name: "Chuột Logitech MX Master 3S", category: "Phụ kiện", unit: "Cái", minQuantity: 20 },
    { sku: "KEY-AKKO-3098", name: "Bàn phím cơ AKKO 3098", category: "Phụ kiện", unit: "Cái", minQuantity: 15 },
  ];

  const products = [];
  for (const p of productsData) {
    const prod = await db.product.create({ data: p });
    products.push(prod);
  }

  // Helper variables to easily access products by SKU
  const ip = products.find(p => p.sku === "IP-15-PRM-256")!;
  const mac = products.find(p => p.sku === "MAC-M3-PRO-14")!;
  const ss = products.find(p => p.sku === "SS-S24-ULT-512")!;
  const logi = products.find(p => p.sku === "LOGI-MX-MASTER-3S")!;

  console.log("Chen san pham hoan tat.");

  // Insert Locations
  const locationsData = [
    // Khu A (Đồ Apple)
    { label: "A-01-01", x: 1, y: 1, z: 1 },
    { label: "A-01-02", x: 1, y: 1, z: 2 },
    { label: "A-02-01", x: 1, y: 2, z: 1 },
    { label: "A-02-02", x: 1, y: 2, z: 2 },
    // Khu B (Đồ Samsung/Dell)
    { label: "B-01-01", x: 2, y: 1, z: 1 },
    { label: "B-01-02", x: 2, y: 1, z: 2 },
    { label: "B-02-01", x: 2, y: 2, z: 1 },
    // Khu C (Phụ kiện)
    { label: "C-01-01", x: 3, y: 1, z: 1 },
    { label: "C-01-02", x: 3, y: 1, z: 2 },
    { label: "C-02-01", x: 3, y: 2, z: 1 },
    { label: "C-02-02", x: 3, y: 2, z: 2 },
  ];

  const locations = [];
  for (const l of locationsData) {
    const loc = await db.location.create({ data: l });
    locations.push(loc);
  }

  const locA0101 = locations.find(l => l.label === "A-01-01")!;
  const locA0201 = locations.find(l => l.label === "A-02-01")!;
  const locB0101 = locations.find(l => l.label === "B-01-01")!;
  const locC0101 = locations.find(l => l.label === "C-01-01")!;

  console.log("Chen chi tiet vi tri kho hoan tat.");

  // Insert Initial Inventory & Update Location Status
  const inventorySetup = [
    { productId: ip.id, locationId: locA0101.id, quantity: 50, locationLabel: "A-01-01" },
    { productId: mac.id, locationId: locA0201.id, quantity: 20, locationLabel: "A-02-01" },
    { productId: ss.id, locationId: locB0101.id, quantity: 30, locationLabel: "B-01-01" },
    { productId: logi.id, locationId: locC0101.id, quantity: 100, locationLabel: "C-01-01" },
  ];

  for (const setup of inventorySetup) {
    // Insert Inventory
    await db.inventory.create({
      data: {
        productId: setup.productId,
        locationId: setup.locationId,
        quantity: setup.quantity,
      }
    });

    // Update location status
    await db.location.update({
      where: { id: setup.locationId },
      data: { status: "FULL" }
    });

    // Create Stock Movement
    await db.stockMovement.create({
      data: {
        type: "IN",
        quantity: setup.quantity,
        productId: setup.productId,
        locationId: setup.locationId,
        userId: admin.id,
        voucherStatus: "APPROVED",
        approvedBy: admin.id,
        approvedAt: new Date(),
        note: "Initial system stock-in"
      }
    });
  }

  console.log("✅ Đã chèn dữ liệu thực tế vào Database thành công!");
}

main()
  .catch((e) => {
    console.error("Lỗi khi chèn dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

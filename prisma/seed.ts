import { config } from "dotenv";
config();

import bcrypt from "bcryptjs";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma";

const adapter = new PrismaLibSql({ url: process.env["DATABASE_URL"] ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data (order matters for FK constraints)
  await prisma.inventory.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.location.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // 1. Users
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.createMany({
    data: [
      {
        username: "admin",
        passwordHash,
        role: "ADMIN",
        isActive: true,
        permissions: "[]",
      },
      {
        username: "manager",
        passwordHash,
        role: "WAREHOUSE_MANAGER",
        isActive: true,
        permissions: "[]",
      },
      {
        username: "staff",
        passwordHash,
        role: "WAREHOUSE_STAFF",
        isActive: true,
        permissions: JSON.stringify(["STOCK_IN", "STOCK_OUT", "VIEW_WAREHOUSE_MAP", "VIEW_MOVEMENT_HISTORY"]),
      },
    ],
  });
  console.log("✓ Users: admin, manager, staff");

  // 2. 10 Locations — 2 rows (X) × 5 columns (Y), single level (Z=1)
  const locationData: { label: string; x: number; y: number; z: number }[] = [];
  for (let x = 1; x <= 2; x++) {
    for (let y = 1; y <= 5; y++) {
      locationData.push({
        label: `Khu-${x === 1 ? "A" : "B"}-Ke-0${y}-Tang-01`,
        x,
        y,
        z: 1,
      });
    }
  }
  await prisma.location.createMany({ data: locationData });
  console.log(`✓ Locations: ${locationData.length} vị trí`);

  // 3. 5 Products
  const products = [
    { sku: "IP15-128-BLK", name: "iPhone 15 128GB Black", category: "Điện thoại", unit: "Cái", minQuantity: 5 },
    { sku: "SS-S24-256-WHT", name: "Samsung Galaxy S24 256GB White", category: "Điện thoại", unit: "Cái", minQuantity: 5 },
    { sku: "MBA-M3-512", name: "MacBook Air M3 512GB", category: "Laptop", unit: "Chiếc", minQuantity: 3 },
    { sku: "APS-PRO11-WIFI", name: "iPad Pro 11 Wi-Fi 256GB", category: "Máy tính bảng", unit: "Chiếc", minQuantity: 3 },
    { sku: "SNY-WH1000XM5", name: "Sony WH-1000XM5 Headphones", category: "Phụ kiện", unit: "Cái", minQuantity: 10 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }
  console.log(`✓ Products: ${products.length} sản phẩm`);

  // 4. Seed Inventory — assign each product to 2 locations
  const allLocations = await prisma.location.findMany({ orderBy: { label: "asc" } });
  const allProducts = await prisma.product.findMany();

  const inventoryData = allProducts.flatMap((product, pi) => {
    const locs = allLocations.slice(pi * 2, pi * 2 + 2);
    return locs.map((loc) => ({
      productId: product.id,
      locationId: loc.id,
      quantity: Math.floor(Math.random() * 50) + 10,
    }));
  });

  await prisma.inventory.createMany({ data: inventoryData });
  console.log(`✓ Inventory: ${inventoryData.length} bản ghi tồn kho`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

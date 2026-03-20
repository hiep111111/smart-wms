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

  // 1. Admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordHash },
    create: {
      username: "admin",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("✓ User: admin");

  // 2. 100 Locations — X(1-5) × Y(1-10) × Z(1-2)
  const locationData: { label: string; x: number; y: number; z: number }[] = [];
  for (let x = 1; x <= 5; x++) {
    for (let y = 1; y <= 10; y++) {
      for (let z = 1; z <= 2; z++) {
        locationData.push({
          label: `Khu-A-X${x}-Y${y}-Z${z}`,
          x,
          y,
          z,
        });
      }
    }
  }
  await prisma.location.createMany({ data: locationData });
  console.log(`✓ Locations: ${locationData.length} vị trí`);

  // 3. 5 Products
  const products = [
    { sku: "IP15-128-BLK", name: "iPhone 15 128GB Black", category: "Điện thoại", unit: "Cái" },
    { sku: "SS-S24-256-WHT", name: "Samsung Galaxy S24 256GB White", category: "Điện thoại", unit: "Cái" },
    { sku: "MBA-M3-512", name: "MacBook Air M3 512GB", category: "Laptop", unit: "Chiếc" },
    { sku: "APS-PRO11-WIFI", name: "iPad Pro 11 Wi-Fi 256GB", category: "Máy tính bảng", unit: "Chiếc" },
    { sku: "SNY-WH1000XM5", name: "Sony WH-1000XM5 Headphones", category: "Phụ kiện", unit: "Cái" },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }
  console.log(`✓ Products: ${products.length} sản phẩm`);

  // 4. Seed Inventory — gán mỗi sản phẩm vào 3 location cố định
  const allLocations = await prisma.location.findMany({ take: 15, orderBy: { label: "asc" } });
  const allProducts = await prisma.product.findMany();

  const inventoryData = allProducts.flatMap((product, pi) => {
    const locs = allLocations.slice(pi * 3, pi * 3 + 3);
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

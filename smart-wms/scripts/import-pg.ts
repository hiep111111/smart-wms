import "dotenv/config";
import { db as prisma } from "../src/lib/prisma/db";
import fs from "fs";
import path from "path";

async function main() {
  const dumpPath = path.join(process.cwd(), "data-dump.json");
  if (!fs.existsSync(dumpPath)) {
    console.error("❌ Không tìm thấy file data-dump.json! Hãy chạy script export-sqlite trước.");
    process.exit(1);
  }

  const rawData = fs.readFileSync(dumpPath, "utf-8");
  const data = JSON.parse(rawData);

  console.log("Đang bơm dữ liệu vào PostgreSQL...");

  // Import in order to respect foreign key constraints
  
  // 1. Users
  if (data.users && data.users.length > 0) {
    console.log(`Importing ${data.users.length} Users...`);
    await prisma.user.createMany({ data: data.users, skipDuplicates: true });
  }

  // 2. Products
  if (data.products && data.products.length > 0) {
    console.log(`Importing ${data.products.length} Products...`);
    await prisma.product.createMany({ data: data.products, skipDuplicates: true });
  }

  // 3. Locations
  if (data.locations && data.locations.length > 0) {
    console.log(`Importing ${data.locations.length} Locations...`);
    await prisma.location.createMany({ data: data.locations, skipDuplicates: true });
  }

  // 4. Inventories
  if (data.inventories && data.inventories.length > 0) {
    console.log(`Importing ${data.inventories.length} Inventories...`);
    await prisma.inventory.createMany({ data: data.inventories, skipDuplicates: true });
  }

  // 5. Stock Movements
  if (data.movements && data.movements.length > 0) {
    console.log(`Importing ${data.movements.length} Stock Movements...`);
    await prisma.stockMovement.createMany({ data: data.movements, skipDuplicates: true });
  }

  // 6. Permissions
  if (data.permissions && data.permissions.length > 0) {
    console.log(`Importing ${data.permissions.length} Permissions...`);
    await prisma.permission.createMany({ data: data.permissions, skipDuplicates: true });
  }

  console.log("✅ HOÀN TẤT! Dữ liệu đã được chuyển sang PostgreSQL thành công!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi import dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

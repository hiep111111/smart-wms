import { db as prisma } from "../src/lib/prisma/db";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Đang xuất dữ liệu từ SQLite...");

  const users = await prisma.user.findMany();
  const products = await prisma.product.findMany();
  const locations = await prisma.location.findMany();
  const inventories = await prisma.inventory.findMany();
  const movements = await prisma.stockMovement.findMany();
  const permissions = await prisma.permission.findMany();

  const data = {
    users,
    products,
    locations,
    inventories,
    movements,
    permissions,
  };

  const dumpPath = path.join(process.cwd(), "data-dump.json");
  fs.writeFileSync(dumpPath, JSON.stringify(data, null, 2));

  console.log(`✅ Đã xuất thành công ${users.length} users, ${products.length} products, ${locations.length} locations.`);
  console.log(`✅ File dữ liệu được lưu tại: ${dumpPath}`);
}

main()
  .catch((e) => {
    console.error("Lỗi khi xuất dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

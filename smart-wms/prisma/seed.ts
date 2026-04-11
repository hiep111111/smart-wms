import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: hashedPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  for (const p of [
    { sku: "IP-15-PRO", name: "iPhone 15 Pro Max 256GB", category: "Dien Thoai", minQuantity: 10 },
    { sku: "SS-S24-ULT", name: "Samsung Galaxy S24 Ultra", category: "Dien Thoai", minQuantity: 5 },
    { sku: "MAC-M3-14", name: "MacBook Pro 14 M3", category: "Laptop", minQuantity: 2 },
  ]) {
    await prisma.product.upsert({ where: { sku: p.sku }, update: {}, create: p });
  }

  for (const l of [
    { label: "A01-S01-T01", x: 1, y: 1, z: 1 },
    { label: "A01-S01-T02", x: 1, y: 1, z: 2 },
    { label: "A01-S02-T01", x: 1, y: 2, z: 1 },
    { label: "A01-S02-T02", x: 1, y: 2, z: 2 },
  ]) {
    await prisma.location.upsert({ where: { label: l.label }, update: {}, create: l });
  }

  console.log("✓ Seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

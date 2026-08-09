import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

function resolveDatabaseUrl() {
  if (process.env.VERCEL || process.env.USE_TMP_DB === "1") {
    const target = "/tmp/blessing-mall.db";
    const candidates = [
      path.join(process.cwd(), "prisma", "seed.db"),
      path.join(process.cwd(), "prisma", "dev.db"),
      path.join(process.cwd(), "prisma", "prod.db"),
    ];
    if (!fs.existsSync(target)) {
      const source = candidates.find((p) => fs.existsSync(p));
      if (source) {
        fs.copyFileSync(source, target);
      }
    }
    return `file:${target}`;
  }
  return process.env.DATABASE_URL || "file:./dev.db";
}

const datasourceUrl = resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  seedPromise: Promise<void> | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: datasourceUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

async function seedIfEmpty() {
  const users = await prisma.user.count();
  if (users > 0) return;

  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.createMany({
    data: [
      {
        name: "Raymond Owner",
        email: "owner@blessingmall.co.tz",
        passwordHash,
        role: "OWNER",
      },
      {
        name: "Amina Manager",
        email: "manager@blessingmall.co.tz",
        passwordHash,
        role: "MANAGER",
      },
      {
        name: "Juma Attendant",
        email: "attendant@blessingmall.co.tz",
        passwordHash,
        role: "ATTENDANT",
      },
    ],
  });

  await prisma.setting.createMany({
    data: [
      { key: "shop_name", value: "Blessing Mall Supermarket" },
      { key: "shop_location", value: "Dar es Salaam, Tanzania" },
      { key: "shop_phone", value: "+255 655 786 630" },
      { key: "currency", value: "TZS" },
      { key: "vat_rate", value: "18" },
      { key: "receipt_footer", value: "Thank you for shopping at Blessing Mall." },
    ],
  });

  const bev = await prisma.category.create({
    data: { name: "Beverages", nameSw: "Vinywaji" },
  });
  const food = await prisma.category.create({
    data: { name: "Food Staples", nameSw: "Vyakula vya Msingi" },
  });

  await prisma.product.createMany({
    data: [
      {
        sku: "BV-001",
        barcode: "6001001000011",
        name: "Coca-Cola 500ml",
        categoryId: bev.id,
        costPrice: 700,
        sellPrice: 1000,
        stockQty: 120,
        reorderLevel: 30,
        unit: "bottle",
      },
      {
        sku: "FD-001",
        barcode: "6001002000018",
        name: "Dona Sembe 1kg",
        categoryId: food.id,
        costPrice: 1800,
        sellPrice: 2500,
        stockQty: 60,
        reorderLevel: 15,
        unit: "pack",
      },
      {
        sku: "FD-003",
        barcode: "6001002000032",
        name: "Sugar 1kg",
        categoryId: food.id,
        costPrice: 2800,
        sellPrice: 3500,
        stockQty: 8,
        reorderLevel: 20,
        unit: "pack",
      },
    ],
  });

  await prisma.supplier.create({
    data: {
      name: "Bakhresa Food Products",
      phone: "+255 22 211 1111",
      address: "Dar es Salaam",
    },
  });
}

export async function ensureDb() {
  if (!globalForPrisma.seedPromise) {
    globalForPrisma.seedPromise = seedIfEmpty().catch((err) => {
      globalForPrisma.seedPromise = undefined;
      console.error("ensureDb failed", err);
    });
  }
  await globalForPrisma.seedPromise;
}

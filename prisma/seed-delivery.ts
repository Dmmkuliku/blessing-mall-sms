import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Delivery seed: training data + forced first-run setup. */
async function main() {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  // Temporary handover password — must be changed during first-run setup / staff policy
  const passwordHash = await bcrypt.hash("ChangeMe#2026", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Store Owner",
        email: "owner@blessingmall.co.tz",
        passwordHash,
        role: Role.OWNER,
      },
      {
        name: "Store Manager",
        email: "manager@blessingmall.co.tz",
        passwordHash,
        role: Role.MANAGER,
      },
      {
        name: "Cashier",
        email: "attendant@blessingmall.co.tz",
        passwordHash,
        role: Role.ATTENDANT,
      },
    ],
  });

  await prisma.setting.createMany({
    data: [
      { key: "shop_name", value: "Blessing Mall Supermarket" },
      { key: "shop_location", value: "Dar es Salaam, Tanzania" },
      { key: "shop_phone", value: "" },
      { key: "currency", value: "TZS" },
      { key: "vat_rate", value: "18" },
      { key: "receipt_footer", value: "Thank you for shopping with us." },
      { key: "setup_complete", value: "0" },
    ],
  });

  const categories = await Promise.all(
    [
      { name: "Beverages", nameSw: "Vinywaji" },
      { name: "Food Staples", nameSw: "Vyakula vya Msingi" },
      { name: "Dairy & Eggs", nameSw: "Maziwa na Mayai" },
      { name: "Household", nameSw: "Vifaa vya Nyumbani" },
      { name: "Personal Care", nameSw: "Huduma Binafsi" },
      { name: "Snacks", nameSw: "Vitamu" },
    ].map((c) => prisma.category.create({ data: c }))
  );

  const [bev, food, dairy, house, care, snacks] = categories;

  const products = [
    { sku: "BV-001", barcode: "6001001000011", name: "Coca-Cola 500ml", categoryId: bev.id, costPrice: 700, sellPrice: 1000, stockQty: 120, reorderLevel: 30, unit: "bottle" },
    { sku: "BV-002", barcode: "6001001000028", name: "Azam Cola 500ml", categoryId: bev.id, costPrice: 600, sellPrice: 900, stockQty: 95, reorderLevel: 25, unit: "bottle" },
    { sku: "BV-003", barcode: "6001001000035", name: "Kilimanjaro Water 1.5L", categoryId: bev.id, costPrice: 800, sellPrice: 1200, stockQty: 80, reorderLevel: 20, unit: "bottle" },
    { sku: "FD-001", barcode: "6001002000018", name: "Dona Sembe 1kg", categoryId: food.id, costPrice: 1800, sellPrice: 2500, stockQty: 60, reorderLevel: 15, unit: "pack" },
    { sku: "FD-002", barcode: "6001002000025", name: "Kahawa Coffee 250g", categoryId: food.id, costPrice: 4500, sellPrice: 6000, stockQty: 40, reorderLevel: 10, unit: "pack" },
    { sku: "FD-003", barcode: "6001002000032", name: "Sugar 1kg", categoryId: food.id, costPrice: 2800, sellPrice: 3500, stockQty: 8, reorderLevel: 20, unit: "pack" },
    { sku: "FD-004", barcode: "6001002000049", name: "Cooking Oil 1L", categoryId: food.id, costPrice: 4500, sellPrice: 5800, stockQty: 35, reorderLevel: 12, unit: "bottle" },
    { sku: "FD-005", barcode: "6001002000056", name: "Rice Bora 5kg", categoryId: food.id, costPrice: 14000, sellPrice: 17500, stockQty: 28, reorderLevel: 8, unit: "bag" },
    { sku: "DY-001", barcode: "6001003000015", name: "Tanga Fresh Milk 500ml", categoryId: dairy.id, costPrice: 1200, sellPrice: 1600, stockQty: 50, reorderLevel: 15, unit: "pack" },
    { sku: "DY-002", barcode: "6001003000022", name: "Eggs Tray (30)", categoryId: dairy.id, costPrice: 12000, sellPrice: 15000, stockQty: 18, reorderLevel: 5, unit: "tray" },
    { sku: "HH-001", barcode: "6001004000012", name: "Omo Detergent 1kg", categoryId: house.id, costPrice: 5500, sellPrice: 7200, stockQty: 22, reorderLevel: 8, unit: "pack" },
    { sku: "HH-002", barcode: "6001004000029", name: "Toilet Paper 10 Rolls", categoryId: house.id, costPrice: 6500, sellPrice: 8500, stockQty: 15, reorderLevel: 6, unit: "pack" },
    { sku: "PC-001", barcode: "6001005000019", name: "Colgate Toothpaste 100ml", categoryId: care.id, costPrice: 2800, sellPrice: 3800, stockQty: 45, reorderLevel: 12, unit: "tube" },
    { sku: "PC-002", barcode: "6001005000026", name: "Geisha Soap 125g", categoryId: care.id, costPrice: 900, sellPrice: 1300, stockQty: 70, reorderLevel: 20, unit: "bar" },
    { sku: "SN-001", barcode: "6001006000016", name: "Crisps Masala 40g", categoryId: snacks.id, costPrice: 700, sellPrice: 1000, stockQty: 90, reorderLevel: 25, unit: "pack" },
    { sku: "SN-002", barcode: "6001006000023", name: "Biscuit Nice 200g", categoryId: snacks.id, costPrice: 1500, sellPrice: 2200, stockQty: 5, reorderLevel: 15, unit: "pack" },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  await prisma.supplier.createMany({
    data: [
      {
        name: "Bakhresa Food Products",
        phone: "+255 22 211 1111",
        email: "orders@bakhresa.co.tz",
        address: "Dar es Salaam",
      },
      {
        name: "Coca-Cola Kwanza",
        phone: "+255 22 286 0000",
        email: "sales@ccbkl.co.tz",
        address: "Mikocheni, DSM",
      },
    ],
  });

  console.log("Delivery database ready.");
  console.log("Temporary password for all seeded users: ChangeMe#2026");
  console.log("Complete /setup on first launch before live use.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, Role, PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  const password = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.create({
    data: {
      name: "Raymond Owner",
      email: "owner@blessingmall.co.tz",
      passwordHash: password,
      role: Role.OWNER,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Amina Manager",
      email: "manager@blessingmall.co.tz",
      passwordHash: password,
      role: Role.MANAGER,
    },
  });

  const attendant = await prisma.user.create({
    data: {
      name: "Juma Attendant",
      email: "attendant@blessingmall.co.tz",
      passwordHash: password,
      role: Role.ATTENDANT,
    },
  });

  await prisma.setting.createMany({
    data: [
      { key: "shop_name", value: "Blessing Mall Supermarket" },
      { key: "shop_location", value: "Dar es Salaam, Tanzania" },
      { key: "shop_phone", value: "+255 655 786 630" },
      { key: "currency", value: "TZS" },
      { key: "vat_rate", value: "18" },
      { key: "receipt_footer", value: "Asante kwa kununua Blessing Mall!" },
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
    { sku: "BV-001", barcode: "6001001000011", name: "Coca-Cola 500ml", nameSw: "Coca-Cola 500ml", categoryId: bev.id, costPrice: 700, sellPrice: 1000, stockQty: 120, reorderLevel: 30, unit: "bottle" },
    { sku: "BV-002", barcode: "6001001000028", name: "Azam Cola 500ml", nameSw: "Azam Cola 500ml", categoryId: bev.id, costPrice: 600, sellPrice: 900, stockQty: 95, reorderLevel: 25, unit: "bottle" },
    { sku: "BV-003", barcode: "6001001000035", name: "Kilimanjaro Water 1.5L", nameSw: "Maji Kilimanjaro 1.5L", categoryId: bev.id, costPrice: 800, sellPrice: 1200, stockQty: 80, reorderLevel: 20, unit: "bottle" },
    { sku: "FD-001", barcode: "6001002000018", name: "Dona Sembe 1kg", nameSw: "Sembe Dona 1kg", categoryId: food.id, costPrice: 1800, sellPrice: 2500, stockQty: 60, reorderLevel: 15, unit: "pack" },
    { sku: "FD-002", barcode: "6001002000025", name: "Kahawa Coffee 250g", nameSw: "Kahawa 250g", categoryId: food.id, costPrice: 4500, sellPrice: 6000, stockQty: 40, reorderLevel: 10, unit: "pack" },
    { sku: "FD-003", barcode: "6001002000032", name: "Sugar 1kg", nameSw: "Sukari 1kg", categoryId: food.id, costPrice: 2800, sellPrice: 3500, stockQty: 8, reorderLevel: 20, unit: "pack" },
    { sku: "FD-004", barcode: "6001002000049", name: "Cooking Oil 1L", nameSw: "Mafuta ya Kupikia 1L", categoryId: food.id, costPrice: 4500, sellPrice: 5800, stockQty: 35, reorderLevel: 12, unit: "bottle" },
    { sku: "FD-005", barcode: "6001002000056", name: "Rice Bora 5kg", nameSw: "Mchele Bora 5kg", categoryId: food.id, costPrice: 14000, sellPrice: 17500, stockQty: 28, reorderLevel: 8, unit: "bag" },
    { sku: "DY-001", barcode: "6001003000015", name: "Tanga Fresh Milk 500ml", nameSw: "Maziwa Tanga 500ml", categoryId: dairy.id, costPrice: 1200, sellPrice: 1600, stockQty: 50, reorderLevel: 15, unit: "pack" },
    { sku: "DY-002", barcode: "6001003000022", name: "Eggs Tray (30)", nameSw: "Mayai Trei (30)", categoryId: dairy.id, costPrice: 12000, sellPrice: 15000, stockQty: 18, reorderLevel: 5, unit: "tray" },
    { sku: "HH-001", barcode: "6001004000012", name: "Omo Detergent 1kg", nameSw: "Omo 1kg", categoryId: house.id, costPrice: 5500, sellPrice: 7200, stockQty: 22, reorderLevel: 8, unit: "pack" },
    { sku: "HH-002", barcode: "6001004000029", name: "Toilet Paper 10 Rolls", nameSw: "Karatasi ya Choo", categoryId: house.id, costPrice: 6500, sellPrice: 8500, stockQty: 15, reorderLevel: 6, unit: "pack" },
    { sku: "PC-001", barcode: "6001005000019", name: "Colgate Toothpaste 100ml", nameSw: "Dawa ya Meno Colgate", categoryId: care.id, costPrice: 2800, sellPrice: 3800, stockQty: 45, reorderLevel: 12, unit: "tube" },
    { sku: "PC-002", barcode: "6001005000026", name: "Geisha Soap 125g", nameSw: "Sabuni Geisha", categoryId: care.id, costPrice: 900, sellPrice: 1300, stockQty: 70, reorderLevel: 20, unit: "bar" },
    { sku: "SN-001", barcode: "6001006000016", name: "Crisps Masala 40g", nameSw: "Crisps Masala", categoryId: snacks.id, costPrice: 700, sellPrice: 1000, stockQty: 90, reorderLevel: 25, unit: "pack" },
    { sku: "SN-002", barcode: "6001006000023", name: "Biscuit Nice 200g", nameSw: "Biskuti Nice", categoryId: snacks.id, costPrice: 1500, sellPrice: 2200, stockQty: 5, reorderLevel: 15, unit: "pack" },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  const supplier = await prisma.supplier.create({
    data: {
      name: "Bakhresa Food Products",
      phone: "+255 22 211 1111",
      email: "orders@bakhresa.co.tz",
      address: "Dar es Salaam",
    },
  });

  await prisma.supplier.create({
    data: {
      name: "Coca-Cola Kwanza",
      phone: "+255 22 286 0000",
      email: "sales@ccbkl.co.tz",
      address: "Mikocheni, DSM",
    },
  });

  const sugar = await prisma.product.findUniqueOrThrow({ where: { sku: "FD-003" } });
  const biscuits = await prisma.product.findUniqueOrThrow({ where: { sku: "SN-002" } });

  await prisma.purchase.create({
    data: {
      reference: "PO-2026-0001",
      supplierId: supplier.id,
      userId: manager.id,
      status: "RECEIVED",
      totalCost: sugar.costPrice * 20 + biscuits.costPrice * 30,
      notes: "Weekly dry goods restock",
      items: {
        create: [
          { productId: sugar.id, qty: 20, unitCost: sugar.costPrice },
          { productId: biscuits.id, qty: 30, unitCost: biscuits.costPrice },
        ],
      },
    },
  });

  const coke = await prisma.product.findUniqueOrThrow({ where: { sku: "BV-001" } });
  const oil = await prisma.product.findUniqueOrThrow({ where: { sku: "FD-004" } });

  const saleItems = [
    { product: coke, qty: 2 },
    { product: oil, qty: 1 },
  ];
  const subtotal = saleItems.reduce((s, i) => s + i.product.sellPrice * i.qty, 0);
  const vatAmount = Math.round(subtotal * 0.18);
  const total = subtotal + vatAmount;

  await prisma.sale.create({
    data: {
      receiptNo: "RCP-10001",
      userId: attendant.id,
      customerName: "Walk-in",
      paymentMethod: PaymentMethod.MPESA,
      subtotal,
      vatAmount,
      total,
      paidAmount: total,
      changeAmount: 0,
      items: {
        create: saleItems.map((i) => ({
          productId: i.product.id,
          qty: i.qty,
          unitPrice: i.product.sellPrice,
          costPrice: i.product.costPrice,
          vatRate: i.product.vatRate,
          lineTotal: i.product.sellPrice * i.qty,
        })),
      },
    },
  });

  await prisma.expense.createMany({
    data: [
      {
        userId: owner.id,
        category: "Utilities",
        description: "Electricity bill - LUUKU",
        amount: 185000,
      },
      {
        userId: manager.id,
        category: "Transport",
        description: "Supplier delivery tip & fuel",
        amount: 45000,
      },
      {
        userId: owner.id,
        category: "Rent",
        description: "Shop rent - August",
        amount: 800000,
      },
    ],
  });

  console.log("Seeded Blessing Mall SMS");
  console.log("Logins (password: password123):");
  console.log("  owner@blessingmall.co.tz");
  console.log("  manager@blessingmall.co.tz");
  console.log("  attendant@blessingmall.co.tz");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

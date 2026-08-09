import type { AppRole } from "./permissions";

export type User = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  active?: boolean;
  createdAt?: string;
};

export type Category = {
  id: string;
  name: string;
  nameSw?: string | null;
};

export type Product = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  nameSw?: string | null;
  categoryId: string;
  category?: Category;
  costPrice: number;
  sellPrice: number;
  stockQty: number;
  reorderLevel: number;
  unit: string;
  vatRate: number;
  active: boolean;
};

export type Supplier = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  active?: boolean;
  createdAt?: string;
};

export type PaymentMethod =
  | "CASH"
  | "MPESA"
  | "TIGO_PESA"
  | "AIRTEL_MONEY"
  | "HALOPESA"
  | "CARD"
  | "BANK";

export type SaleItem = {
  id?: string;
  productId: string;
  product?: Product;
  qty: number;
  unitPrice: number;
  costPrice?: number;
  vatRate?: number;
  lineTotal: number;
};

export type Sale = {
  id: string;
  receiptNo: string;
  userId: string;
  user?: Pick<User, "id" | "name">;
  customerName?: string | null;
  paymentMethod: PaymentMethod;
  subtotal: number;
  vatAmount: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  createdAt: string;
  items?: SaleItem[];
};

export type PurchaseItem = {
  id?: string;
  productId: string;
  product?: Product;
  qty: number;
  unitCost: number;
};

export type Purchase = {
  id: string;
  reference: string;
  supplierId: string;
  supplier?: Supplier;
  userId: string;
  user?: Pick<User, "id" | "name">;
  status: "DRAFT" | "RECEIVED" | "CANCELLED";
  totalCost: number;
  notes?: string | null;
  createdAt: string;
  items?: PurchaseItem[];
};

export type Expense = {
  id: string;
  userId: string;
  user?: Pick<User, "id" | "name">;
  category: string;
  description: string;
  amount: number;
  spentAt: string;
  createdAt?: string;
};

export type DashboardData = {
  todaySales: number;
  todayTransactions: number;
  lowStockCount: number;
  todayExpenses?: number;
  monthExpenses?: number;
  salesLast7Days: { date: string; total: number }[];
  lowStockProducts: Product[];
  recentSales: Sale[];
};

export type ShopSettings = {
  shop_name?: string;
  shop_location?: string;
  shop_phone?: string;
  currency?: string;
  vat_rate?: string;
  receipt_footer?: string;
  [key: string]: string | undefined;
};

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "MPESA", label: "M-Pesa" },
  { value: "TIGO_PESA", label: "Tigo Pesa" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
  { value: "HALOPESA", label: "HaloPesa" },
  { value: "CARD", label: "Card" },
  { value: "BANK", label: "Bank" },
];

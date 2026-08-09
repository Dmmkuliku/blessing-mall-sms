# Blessing Mall SMS

Supermarket management system for **Blessing Mall** (Tanzania), inspired by [StockApp Africa](https://app.stockapp.africa/) workflows.

## Features

- Role-based access: Store Attendant, Store Manager, Store Owner
- POS / Mauzo with Cash, M-Pesa, Tigo Pesa, Airtel Money, HaloPesa, Card, Bank
- Inventory & low-stock reorder alerts (TZS pricing, 18% VAT)
- Purchases / goods received from suppliers
- Expense & cash-flow tracking
- Sales, product performance, and payment reports
- Staff accounts and shop settings

## Demo logins

Password for all: `password123`

| Role | Email |
|------|-------|
| Owner | owner@blessingmall.co.tz |
| Manager | manager@blessingmall.co.tz |
| Attendant | attendant@blessingmall.co.tz |

## Local setup

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js 15 · Prisma · SQLite · Tailwind CSS · Recharts

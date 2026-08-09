# Blessing Mall Supermarket Management System

Retail operations platform for **Blessing Mall** (Dar es Salaam, Tanzania), inspired by StockApp Africa workflows.

## Capabilities

- Role-based access: Cashier, Store Manager, Store Owner
- Point of Sale with Cash, M-Pesa, Tigo Pesa, Airtel Money, HaloPesa, Card, and Bank
- Inventory with low-stock alerts (TZS pricing, 18% VAT)
- Purchases / goods received and supplier records
- Expense tracking and cash-flow reports
- Sales and product performance reports
- Staff accounts and shop settings

## Security practices

- HTTP-only session cookies with secure flags in production
- Password hashing (bcrypt)
- Sign-in rate limiting
- Role-based API authorisation
- Cost prices hidden from cashier accounts
- Security response headers (frame denial, nosniff, referrer policy, HSTS in production)
- Generic authentication error messages to reduce account enumeration

## Demo accounts (local / training only)

Password for seeded demo users: `password123`

| Role | Email |
|------|-------|
| Owner | owner@blessingmall.co.tz |
| Manager | manager@blessingmall.co.tz |
| Cashier | attendant@blessingmall.co.tz |

Change these passwords before any live store use. Do not process real card or mobile-money secrets in the demo environment.

## Local setup

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js 15 · Prisma · SQLite · Tailwind CSS · Recharts

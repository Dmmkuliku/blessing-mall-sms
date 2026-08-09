# Blessing Mall SMS — Installation Guide (Windows Laptops)

This guide is for installing the system on **institute / customer Windows laptops** for local use (no cloud required after setup).

## What you need

1. Windows 10 or 11 laptop
2. Internet connection **during installation only** (to download Node.js packages)
3. Node.js **LTS 20+** from [https://nodejs.org](https://nodejs.org)
4. This project folder (USB copy or extracted ZIP)

## Install steps

1. Copy the full project folder to a permanent location, for example:
   - `C:\BlessingMall\blessing-mall-sms`
2. Install Node.js LTS if it is not already installed. Restart the laptop after installing Node.js.
3. Open the project folder and go into `setup`.
4. Double-click **`install.bat`**.
5. Wait until you see **Installation complete**.
6. A Desktop shortcut named **Blessing Mall SMS** is created automatically.

Installation will:
- create a secure `.env` file
- install dependencies
- create the local database in `data\blessing-mall.db`
- build the application
- create Start / Stop launchers

## Daily use

1. Double-click **START Blessing Mall.bat** or the Desktop shortcut.
2. Keep the black console window open while staff use the system.
3. Browser opens at `http://127.0.0.1:3000/setup` on first run.
4. Complete **First-run setup** (shop details + owner password).
5. After setup, staff sign in from the home page by role.

To stop the system: double-click **STOP Blessing Mall.bat**.

## First-run security (important)

Temporary seeded passwords after install:

| Role | Email | Temporary password |
|------|-------|--------------------|
| Owner | owner@blessingmall.co.tz | ChangeMe#2026 |
| Manager | manager@blessingmall.co.tz | ChangeMe#2026 |
| Cashier | attendant@blessingmall.co.tz | ChangeMe#2026 |

During first-run setup, set a **strong owner password**. Then change manager and cashier passwords from Staff (owner only) or by recreating accounts.

## Data location

- Database: `data\blessing-mall.db`
- Back up this file daily to USB or OneDrive.
- Logs folder: `logs\` (reserved for local operation notes)

## Offline use

After a successful install and build, the laptop can run **without internet**.
Internet is only required again if you reinstall dependencies or update the app.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Node.js was not found` | Install Node.js LTS, restart, run `install.bat` again |
| Browser shows connection refused | Start the system with **START Blessing Mall.bat** and wait for “Ready” |
| Port already in use | Run **STOP Blessing Mall.bat**, then start again |
| Need a clean database | Stop the app, delete `data\blessing-mall.db`, run `npx prisma db push` and `npx tsx prisma/seed-delivery.ts` from the project folder |

## Support contact

Record your delivery support contact here before handover:

- Name: ______________________
- Phone: ______________________
- Email: ______________________

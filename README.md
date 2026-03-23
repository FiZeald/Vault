# Vault

A Swedish-language family home management web app. Track everything in your home — inventory, warranties, receipts, tasks, service reminders, economy, and checklists — all in one place.

**Live:** [vault.gtdoit.com](https://vault.gtdoit.com)

---

## Features

- **Inventory** — catalogue your belongings with photos, purchase date, price, and location
- **Warranties** — track warranty expiry dates with alerts before they run out
- **Receipts** — store digital receipts linked to items
- **Tasks** — family to-do list with priorities, due dates, and member assignment
- **Service & maintenance** — recurring service reminders with history log
- **Economy** — budget categories, income/expense tracking, monthly overview
- **Checklists** — shared shopping and task lists stored locally per family
- **Multi-family** — one account can belong to multiple families and switch between them
- **Dark / light theme** — respects system preference, toggleable

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla JS SPA, CSS custom properties |
| Backend | PHP 7.4+, PDO |
| Database | MySQL / MariaDB |
| Auth | Custom JWT (bcrypt passwords) |
| Server | Apache + mod_rewrite |

No frameworks, no build step — deploy by uploading files.

---

## Project structure

```
public_html/vault.gtdoit/
├── index.html              # Single-page app shell
├── .htaccess               # Rewrites /api/* → api/index.php
├── api/
│   └── index.php           # API router
├── includes/
│   ├── config.php          # ← create from config.example.php (not in git)
│   ├── auth.php            # JWT helpers
│   ├── db.php              # PDO connection
│   └── routes/             # One file per resource
│       ├── auth.php
│       ├── items.php
│       ├── tasks.php
│       ├── services.php
│       ├── receipts.php
│       ├── economy.php
│       └── family.php
├── js/
│   ├── core/               # State, utils, routing, auth UI
│   └── pages/              # One file per page/feature
└── uploads/                # User-uploaded photos (not in git)
```

---

## Setup

### 1. Database

Import `vault_schema.sql` into a fresh MySQL/MariaDB database via phpMyAdmin or CLI:

```bash
mysql -u user -p database_name < vault_schema.sql
```

### 2. Configuration

```bash
cp public_html/vault.gtdoit/includes/config.example.php \
   public_html/vault.gtdoit/includes/config.php
```

Edit `config.php` with your database credentials, JWT secret, SMTP settings, and app URL.

### 3. Deploy

Upload the `public_html/vault.gtdoit/` directory to your web host. Apache with `mod_rewrite` is required.

The `includes/` and `uploads/` directories are protected by `.htaccess` — direct HTTP access is blocked.

### 4. First login

Register a new account at the app URL. The first user registered with the `ADMIN_EMAIL` address defined in `config.php` gets admin access.

---

## API

All endpoints live under `/api/` and require a `Bearer` token except auth routes.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/items` | Inventory |
| GET/POST | `/api/tasks` | Tasks |
| GET/POST | `/api/services` | Service reminders |
| POST | `/api/services/:id/done` | Mark service done |
| GET/POST | `/api/receipts` | Receipts |
| GET/POST | `/api/economy/transactions` | Transactions |
| GET/POST | `/api/economy/categories` | Budget categories |
| GET/POST | `/api/family/list` | Families |
| POST | `/api/family/join` | Join via invite code |
| GET | `/api/upload` | Photo upload |

<?php
/**
 * Vault — Configuration
 * Copy this file to config.php and fill in your values.
 * config.php is blocked by .htaccess and excluded from git.
 *
 * ── Hetzner setup ──────────────────────────────────────────────────
 * Database host:  find in Hetzner Cloud Console → Databases → Overview
 * Database port:  3306 (MySQL) — set DB_SSL=true for managed databases
 * PHP version:    set to 8.1+ in KonsoleH control panel (or via .htaccess
 *                 AddHandler directive — see root .htaccess)
 */

// ── Database ────────────────────────────────────────────────────────
define('DB_HOST', 'your-db-host.your-database.de');  // Hetzner managed DB host
define('DB_PORT', 3306);
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_database_password');
define('DB_SSL',  true);   // true for Hetzner managed database (external host)

// ── Auth ────────────────────────────────────────────────────────────
define('JWT_SECRET',      'change-this-to-a-long-random-string-min-32-chars');
define('JWT_EXPIRY_DAYS', 30);

// ── Uploads ─────────────────────────────────────────────────────────
define('UPLOAD_DIR',  __DIR__ . '/../uploads/');
define('UPLOAD_URL',  '/uploads/');
define('MAX_UPLOAD_MB', 10);

// ── Mail (SMTP) ──────────────────────────────────────────────────────
define('SMTP_HOST',     'mail.yourdomain.com');
define('SMTP_PORT',     587);
define('SMTP_USER',     'noreply@yourdomain.com');
define('SMTP_PASS',     'your_smtp_password');
define('SMTP_FROM',     'noreply@yourdomain.com');
define('SMTP_FROM_NAME','Vault');

// ── App ──────────────────────────────────────────────────────────────
define('APP_URL',     'https://vault.gtdoit.com');
define('ADMIN_EMAIL', 'admin@gtdoit.com');

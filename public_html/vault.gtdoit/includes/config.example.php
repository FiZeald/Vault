<?php
/**
 * Vault — Configuration
 * Copy this file to config.php and fill in your values.
 * config.php is blocked by .htaccess and excluded from git.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_database_password');

define('JWT_SECRET',      'change-this-to-a-long-random-string');
define('JWT_EXPIRY_DAYS', 30);

define('UPLOAD_DIR',  __DIR__ . '/../uploads/');
define('UPLOAD_URL',  '/uploads/');
define('MAX_UPLOAD_MB', 10);

define('SMTP_HOST',     'mail.yourdomain.com');
define('SMTP_PORT',     587);
define('SMTP_USER',     'noreply@yourdomain.com');
define('SMTP_PASS',     'your_smtp_password');
define('SMTP_FROM',     'noreply@yourdomain.com');
define('SMTP_FROM_NAME','Vault');
define('APP_URL',       'https://yourdomain.com');
define('ADMIN_EMAIL',   'admin@yourdomain.com');

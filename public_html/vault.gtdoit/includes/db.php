<?php
require_once __DIR__ . '/config.php';

function get_db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;

    $port = defined('DB_PORT') ? (int)DB_PORT : 3306;
    $dsn  = 'mysql:host='.DB_HOST.';port='.$port.';dbname='.DB_NAME.';charset=utf8mb4';

    // SSL required for Hetzner managed databases (external host)
    $ssl = defined('DB_SSL') && DB_SSL;
    $opts = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    if ($ssl) {
        $opts[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        $opts[PDO::MYSQL_ATTR_SSL_CA]                 = true;
    }

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $opts);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Databasfel: ' . $e->getMessage()]);
        exit;
    }
    return $pdo;
}
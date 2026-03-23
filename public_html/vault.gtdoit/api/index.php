<?php
// ── Vault API — router ─────────────────────────────────────────────
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/routes/seed.php';
require_once __DIR__ . '/../includes/routes/auth.php';
require_once __DIR__ . '/../includes/routes/family.php';
require_once __DIR__ . '/../includes/routes/items.php';
require_once __DIR__ . '/../includes/routes/tasks.php';
require_once __DIR__ . '/../includes/routes/services.php';
require_once __DIR__ . '/../includes/routes/receipts.php';
require_once __DIR__ . '/../includes/routes/economy.php';

$route = trim($_GET['_route'] ?? '', '/');
$parts = explode('/', $route);
$base  = $parts[0] ?? '';
$s1    = $parts[1] ?? '';
$s2    = $parts[2] ?? '';
$id    = is_numeric($s1) ? (int)$s1 : (is_numeric($s2) ? (int)$s2 : null);
$m     = $_SERVER['REQUEST_METHOD'];

try {
    match(true) {
        // Auth
        $base==='auth' && $s1==='login'    && $m==='POST' => r_login(),
        $base==='auth' && $s1==='register' && $m==='POST' => r_register(),
        $base==='auth' && $s1==='me'       && $m==='GET'  => r_me(),
        $base==='auth' && $s1==='forgot'   && $m==='POST' => r_forgot(),
        $base==='auth' && $s1==='reset'    && $m==='POST' => r_reset(),

        // Family
        $base==='family' && $s1==='list'    && $m==='GET'  => fam_list(),
        $base==='family' && $s1==='members' && $m==='GET'  => fam_members(),
        $base==='family' && $s1==='create'  && $m==='POST' => fam_create(),
        $base==='family' && $s1==='join'    && $m==='POST' => fam_join(),
        $base==='family' && $s1==='switch'  && $m==='POST' => fam_switch(),
        $base==='family' && $s1==='leave'   && $m==='POST' => fam_leave(),
        $base==='family' && $s1==='invite'  && $m==='POST' => fam_invite_email(),

        // Categories
        $base==='categories' && $m==='GET'                      => cat_list(),
        $base==='categories' && $m==='POST'                     => cat_create(),
        $base==='categories' && $id!==null && $m==='PUT'        => cat_update($id),
        $base==='categories' && $id!==null && $m==='DELETE'     => cat_delete($id),

        // Items
        $base==='items' && $m==='GET'   && $id===null           => item_list(),
        $base==='items' && $m==='GET'   && $id!==null           => item_get($id),
        $base==='items' && $m==='POST'  && $id===null           => item_create(),
        $base==='items' && $m==='PUT'   && $id!==null           => item_update($id),
        $base==='items' && $m==='DELETE'&& $id!==null           => item_delete($id),
        $base==='upload'                && $m==='POST'           => upload_file(),

        // Tasks
        $base==='tasks' && $m==='GET'                           => task_list(),
        $base==='tasks' && $m==='POST'  && $id===null           => task_create(),
        $base==='tasks' && $m==='PUT'   && $id!==null           => task_update($id),
        $base==='tasks' && $m==='DELETE'&& $id!==null           => task_delete($id),

        // Services
        $base==='services' && $m==='GET'                        => svc_list(),
        $base==='services' && $m==='POST'  && $id===null        => svc_create(),
        $base==='services' && $m==='PUT'   && $id!==null        => svc_update($id),
        $base==='services' && $s2==='done' && $m==='POST'       => svc_done($id),
        $base==='services' && $m==='DELETE'&& $id!==null        => svc_delete($id),

        // Receipts
        $base==='receipts' && $m==='GET'                        => rec_list(),
        $base==='receipts' && $m==='POST'  && $id===null        => rec_create(),
        $base==='receipts' && $m==='PUT'   && $id!==null        => rec_update($id),
        $base==='receipts' && $m==='DELETE'&& $id!==null        => rec_delete($id),

        // Economy
        $base==='economy' && $s1==='summary'                    => eco_summary(),
        $base==='economy' && $s1==='transactions_bulk_delete' && $m==='POST' => eco_trans_bulk_delete(),
        $base==='economy' && $s1==='transactions' && $m==='GET' => eco_trans_list(),
        $base==='economy' && $s1==='transactions' && $m==='POST'&& $id===null => eco_trans_create(),
        $base==='economy' && $s1==='transactions' && $m==='PUT' && $id!==null => eco_trans_update($id),
        $base==='economy' && $s1==='transactions' && $m==='DELETE'&& $id!==null => eco_trans_delete($id),
        $base==='economy' && $s1==='categories'  && $m==='GET'  => eco_cats_list(),
        $base==='economy' && $s1==='categories'  && $m==='POST' => eco_cats_create(),
        $base==='economy' && $s1==='categories'  && $m==='PUT'  && $id!==null => eco_cats_update($id),
        $base==='economy' && $s1==='categories'  && $m==='DELETE' && $id!==null => eco_cats_delete($id),
        $base==='economy' && $s1==='import'      && $m==='POST' => eco_import(),

        default => json_die(['error' => 'Okänd route: ' . $route], 404),
    };
} catch (Throwable $e) {
    json_die(['error' => $e->getMessage()], 500);
}
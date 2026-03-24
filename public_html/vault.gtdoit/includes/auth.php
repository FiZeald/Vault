<?php
require_once __DIR__ . '/config.php';

function hash_pw(string $p): string { return password_hash($p, PASSWORD_BCRYPT, ['cost'=>12]); }
function verify_pw(string $p, string $h): bool { return password_verify($p, $h); }

function b64e(string $d): string { return rtrim(strtr(base64_encode($d),'+/','-_'),'='); }
function b64d(string $d): string { return base64_decode(strtr($d,'-_','+/').str_repeat('=',(4-strlen($d)%4)%4)); }

function create_token(int $uid): string {
    $h = b64e(json_encode(['alg'=>'HS256','typ'=>'JWT']));
    $p = b64e(json_encode(['sub'=>$uid,'iat'=>time(),'exp'=>time()+(JWT_EXPIRY_DAYS*86400)]));
    $s = b64e(hash_hmac('sha256',"$h.$p",JWT_SECRET,true));
    return "$h.$p.$s";
}

function verify_token(string $t): ?int {
    $parts = explode('.',$t);
    if(count($parts)!==3) return null;
    [$h,$p,$s] = $parts;
    if(!hash_equals(b64e(hash_hmac('sha256',"$h.$p",JWT_SECRET,true)),$s)) return null;
    $d = json_decode(b64d($p),true);
    if(!$d || $d['exp']<time()) return null;
    return (int)$d['sub'];
}

function get_bearer(): ?string {
    $a = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if(str_starts_with($a,'Bearer ')) return substr($a,7);
    return null;
}

function require_auth(): array {
    $t = get_bearer();
    if(!$t) json_die(['error'=>'Ej inloggad'],401);
    $uid = verify_token($t);
    if(!$uid) json_die(['error'=>'Ogiltig session'],401);
    $db = get_db();
    $s = $db->prepare('SELECT u.id,u.email,u.username,u.active_family_id,u.avatar_color,uf.family_role
        FROM users u
        LEFT JOIN user_families uf ON uf.user_id=u.id AND uf.family_id=u.active_family_id
        WHERE u.id=?');
    $s->execute([$uid]);
    $u = $s->fetch();
    if(!$u) json_die(['error'=>'Användare saknas'],401);
    if(!$u['active_family_id']) json_die(['error'=>'Ingen aktiv familj'],403);
    return $u;
}

// ── Request helpers ───────────────────────────────────────────────
function body(): array {
    static $p=null;
    if($p!==null) return $p;
    $p = json_decode(file_get_contents('php://input'),true)??[];
    return $p;
}
function sf(string $k, string $d=''): string { return trim((string)(body()[$k]??$d)); }
function intf(string $k, int $d=0): int { $v=body()[$k]??null; return($v===null||$v==='') ? $d:(int)$v; }
function ff(string $k, float $d=0): float { $v=body()[$k]??null; return($v===null||$v==='') ? $d:(float)$v; }
function df(string $k): ?string { $v=trim((string)(body()[$k]??'')); if(!$v||$v==='0000-00-00') return null; return preg_match('/^\d{4}-\d{2}-\d{2}$/',$v)?$v:null; }

// ── Response helpers ──────────────────────────────────────────────
function jout(mixed $d, int $c=200): never { http_response_code($c); echo json_encode($d,JSON_UNESCAPED_UNICODE); exit; }
function json_die(mixed $d, int $c=400): never { jout($d,$c); }

// ── Activity log helper ───────────────────────────────────────────
function log_act(int $family_id, ?int $user_id, ?string $username, string $action, string $entity_type, ?int $entity_id = null, ?string $entity_name = null): void {
    try {
        get_db()->prepare('INSERT INTO activity_log (family_id,user_id,username,action,entity_type,entity_id,entity_name) VALUES (?,?,?,?,?,?,?)')
            ->execute([$family_id, $user_id, $username, $action, $entity_type, $entity_id, $entity_name]);
    } catch (\Throwable $e) { /* non-fatal */ }
}

// ── Inventory snapshot helper ─────────────────────────────────────
function update_snapshot(int $family_id): void {
    try {
        $db = get_db();
        $s  = $db->prepare('SELECT COALESCE(SUM(price),0) AS total_value, COUNT(*) AS item_count FROM items WHERE family_id=?');
        $s->execute([$family_id]);
        $r  = $s->fetch();
        $db->prepare('INSERT INTO inventory_snapshots (family_id,snapshot_date,total_value,item_count) VALUES (?,CURDATE(),?,?) ON DUPLICATE KEY UPDATE total_value=VALUES(total_value),item_count=VALUES(item_count)')
            ->execute([$family_id, $r['total_value'], $r['item_count']]);
    } catch (\Throwable $e) { /* non-fatal */ }
}

// ── Email / SMTP (native PHP mail as fallback) ────────────────────
function send_email(string $to, string $subject, string $html): bool {
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . SMTP_FROM_NAME . " <" . SMTP_FROM . ">\r\n";
    $headers .= "Reply-To: " . SMTP_FROM . "\r\n";
    return mail($to, $subject, $html, $headers);
}
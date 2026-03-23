<?php
// ── Auth routes ────────────────────────────────────────────────────

function r_login(): never {
    $email = strtolower(sf('email')); $pw = sf('password');
    $s = get_db()->prepare('SELECT id,password FROM users WHERE email=?');
    $s->execute([$email]); $r = $s->fetch();
    if (!$r || !verify_pw($pw, $r['password'])) json_die(['error' => 'Fel e-post eller lösenord'], 401);
    jout(['token' => create_token((int)$r['id']), 'user' => user_payload((int)$r['id'])]);
}

function r_register(): never {
    $email = strtolower(sf('email')); $name = sf('username'); $pw = sf('password');
    if (!$email || !$name || !$pw) json_die(['error' => 'Alla fält krävs']);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_die(['error' => 'Ogiltig e-postadress']);
    if (strlen($pw) < 6) json_die(['error' => 'Lösenord minst 6 tecken']);
    $db = get_db();
    $c = $db->prepare('SELECT id FROM users WHERE email=?'); $c->execute([$email]);
    if ($c->fetch()) json_die(['error' => 'E-postadressen finns redan'], 409);
    $colors = ['#5B8EF0','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4'];
    $db->prepare('INSERT INTO users (email,username,password,avatar_color) VALUES (?,?,?,?)')->execute([$email, $name, hash_pw($pw), $colors[array_rand($colors)]]);
    $uid = (int)$db->lastInsertId();
    $invite = strtoupper(bin2hex(random_bytes(3)));
    $db->prepare('INSERT INTO families (name,invite_code,owner_id) VALUES (?,?,?)')->execute([$name . "s vault", $invite, $uid]);
    $fid = (int)$db->lastInsertId();
    $db->prepare('INSERT INTO user_families (user_id,family_id,family_role) VALUES (?,?,?)')->execute([$uid, $fid, 'owner']);
    $db->prepare('UPDATE users SET active_family_id=? WHERE id=?')->execute([$fid, $uid]);
    seed_categories($db, $fid);
    seed_budget_categories($db, $fid);
    jout(['token' => create_token($uid), 'user' => user_payload($uid)], 201);
}

function r_me(): never {
    $u = require_auth(); jout(user_payload($u['id']));
}

function r_forgot(): never {
    $email = strtolower(sf('email'));
    $db = get_db();
    $s = $db->prepare('SELECT id,username FROM users WHERE email=?'); $s->execute([$email]); $u = $s->fetch();
    if (!$u) { jout(['ok' => true]); }
    $token = bin2hex(random_bytes(32));
    $db->prepare('INSERT INTO password_resets (user_id,token,expires_at) VALUES (?,?,?)')->execute([$u['id'], $token, date('Y-m-d H:i:s', time() + 3600)]);
    $link = APP_URL . '/?reset=' . $token;
    $html = '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0A0D14;color:#E8EDFB;padding:32px">
<div style="max-width:480px;margin:0 auto;background:#111622;border-radius:16px;padding:32px;border:1px solid #1E2740">
  <h2>🔐 Vault — Återställ lösenord</h2>
  <p>Hej ' . htmlspecialchars($u['username']) . ',</p>
  <p>Klicka på länken nedan för att återställa ditt lösenord (giltig 1 timme):</p>
  <p style="margin:24px 0"><a href="' . $link . '" style="background:#4F7FFF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Återställ lösenord →</a></p>
  <p style="font-size:12px;color:#4A5475">Om du inte begärde detta kan du ignorera detta mail.</p>
</div></body></html>';
    send_email($email, 'Vault — återställ lösenord', $html);
    jout(['ok' => true]);
}

function r_reset(): never {
    $token = sf('token'); $pw = sf('password');
    if (!$token || strlen($pw) < 6) json_die(['error' => 'Token och lösenord (min 6 tecken) krävs']);
    $db = get_db();
    $s = $db->prepare('SELECT id,user_id FROM password_resets WHERE token=? AND used=0 AND expires_at>NOW()');
    $s->execute([$token]); $r = $s->fetch();
    if (!$r) json_die(['error' => 'Ogiltig eller utgången länk'], 410);
    $db->prepare('UPDATE users SET password=? WHERE id=?')->execute([hash_pw($pw), $r['user_id']]);
    $db->prepare('UPDATE password_resets SET used=1 WHERE id=?')->execute([$r['id']]);
    jout(['ok' => true]);
}

function user_payload(int $uid): array {
    $s = get_db()->prepare('SELECT u.id,u.email,u.username,u.active_family_id,u.avatar_color,
        f.name AS family_name,f.invite_code,uf.family_role
        FROM users u
        LEFT JOIN families f ON f.id=u.active_family_id
        LEFT JOIN user_families uf ON uf.user_id=u.id AND uf.family_id=u.active_family_id
        WHERE u.id=?');
    $s->execute([$uid]); $r = $s->fetch();
    return ['id' => (int)$r['id'], 'email' => $r['email'], 'username' => $r['username'],
        'active_family_id' => $r['active_family_id'] ? (int)$r['active_family_id'] : null,
        'avatar_color' => $r['avatar_color'], 'family_name' => $r['family_name'],
        'invite_code' => $r['invite_code'], 'family_role' => $r['family_role']];
}

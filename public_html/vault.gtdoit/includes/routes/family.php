<?php
// ── Family routes ──────────────────────────────────────────────────

function fam_list(): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT f.id,f.name,f.invite_code,uf.family_role,f.created_at
        FROM families f JOIN user_families uf ON uf.family_id=f.id AND uf.user_id=?
        ORDER BY f.created_at');
    $s->execute([$u['id']]); jout($s->fetchAll());
}

function fam_members(): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT u.id,u.username,u.email,u.avatar_color,uf.family_role
        FROM users u JOIN user_families uf ON uf.user_id=u.id AND uf.family_id=?
        ORDER BY uf.family_role DESC,u.username');
    $s->execute([$u['active_family_id']]); jout($s->fetchAll());
}

function fam_create(): never {
    $u = require_auth(); $name = sf('name');
    if (!$name) json_die(['error' => 'Namn krävs']);
    $db = get_db();
    $inv = strtoupper(bin2hex(random_bytes(3)));
    $db->prepare('INSERT INTO families (name,invite_code,owner_id) VALUES (?,?,?)')->execute([$name, $inv, $u['id']]);
    $fid = (int)$db->lastInsertId();
    $db->prepare('INSERT INTO user_families (user_id,family_id,family_role) VALUES (?,?,?)')->execute([$u['id'], $fid, 'owner']);
    $db->prepare('UPDATE users SET active_family_id=? WHERE id=?')->execute([$fid, $u['id']]);
    seed_categories($db, $fid);
    seed_budget_categories($db, $fid);
    jout(['id' => $fid, 'name' => $name, 'invite_code' => $inv, 'family_role' => 'owner'], 201);
}

function fam_join(): never {
    $u = require_auth(); $code = strtoupper(trim(sf('invite_code')));
    if (!$code) json_die(['error' => 'Kod krävs']);
    $db = get_db();
    $s = $db->prepare('SELECT id,name FROM families WHERE invite_code=?'); $s->execute([$code]); $f = $s->fetch();
    if (!$f) json_die(['error' => 'Ogiltig kod'], 404);
    $c = $db->prepare('SELECT id FROM user_families WHERE user_id=? AND family_id=?'); $c->execute([$u['id'], $f['id']]);
    if ($c->fetch()) json_die(['error' => 'Du är redan med'], 409);
    $db->prepare('INSERT INTO user_families (user_id,family_id,family_role) VALUES (?,?,?)')->execute([$u['id'], $f['id'], 'member']);
    $db->prepare('UPDATE users SET active_family_id=? WHERE id=?')->execute([$f['id'], $u['id']]);
    jout(['id' => (int)$f['id'], 'family_name' => $f['name'], 'invite_code' => $code]);
}

function fam_switch(): never {
    $u = require_auth(); $fid = intf('family_id');
    $db = get_db();
    $c = $db->prepare('SELECT id FROM user_families WHERE user_id=? AND family_id=?'); $c->execute([$u['id'], $fid]);
    if (!$c->fetch()) json_die(['error' => 'Ej behörig'], 403);
    $db->prepare('UPDATE users SET active_family_id=? WHERE id=?')->execute([$fid, $u['id']]);
    jout(['ok' => true, 'active_family_id' => $fid]);
}

function fam_leave(): never {
    $u = require_auth(); $fid = intf('family_id') ?: (int)$u['active_family_id'];
    $db = get_db();
    $s = $db->prepare('SELECT owner_id FROM families WHERE id=?'); $s->execute([$fid]); $f = $s->fetch();
    if ($f && (int)$f['owner_id'] === (int)$u['id']) json_die(['error' => 'Ägaren kan inte lämna'], 403);
    $db->prepare('DELETE FROM user_families WHERE user_id=? AND family_id=?')->execute([$u['id'], $fid]);
    $o = $db->prepare('SELECT family_id FROM user_families WHERE user_id=? LIMIT 1'); $o->execute([$u['id']]); $r = $o->fetch();
    $db->prepare('UPDATE users SET active_family_id=? WHERE id=?')->execute([$r ? $r['family_id'] : null, $u['id']]);
    jout(['ok' => true]);
}

function fam_delete(): never {
    $u = require_auth(); $fid = intf('family_id');
    if (!$fid) json_die(['error' => 'family_id krävs'], 400);
    $db = get_db();
    // Only owner can delete
    $s = $db->prepare('SELECT owner_id FROM families WHERE id=?');
    $s->execute([$fid]); $f = $s->fetch();
    if (!$f) json_die(['error' => 'Familjen hittades inte'], 404);
    if ((int)$f['owner_id'] !== (int)$u['id']) json_die(['error' => 'Endast ägaren kan ta bort familjen'], 403);
    // Cascade: transactions, budget_categories, receipts, services, tasks, items, categories, user_families, families
    foreach (['transactions','budget_categories','receipts','services','tasks','items','categories','user_families'] as $tbl) {
        $db->prepare("DELETE FROM `$tbl` WHERE family_id=?")->execute([$fid]);
    }
    // Reset active_family_id for all members who had this as active
    $db->prepare('UPDATE users SET active_family_id=NULL WHERE active_family_id=?')->execute([$fid]);
    $db->prepare('DELETE FROM families WHERE id=?')->execute([$fid]);
    jout(['ok' => true]);
}

function fam_kick(): never {
    $u = require_auth(); $target_id = intf('user_id');
    if (!$target_id) json_die(['error' => 'user_id krävs'], 400);
    $fid = (int)$u['active_family_id'];
    $db = get_db();
    // Only owner can kick
    $s = $db->prepare('SELECT owner_id FROM families WHERE id=?'); $s->execute([$fid]); $f = $s->fetch();
    if (!$f) json_die(['error' => 'Familjen hittades inte'], 404);
    if ((int)$f['owner_id'] !== (int)$u['id']) json_die(['error' => 'Endast ägaren kan sparka ut medlemmar'], 403);
    if ((int)$target_id === (int)$u['id']) json_die(['error' => 'Du kan inte sparka ut dig själv'], 400);
    $db->prepare('DELETE FROM user_families WHERE user_id=? AND family_id=?')->execute([$target_id, $fid]);
    // Reset active_family_id for kicked user if it was this family
    $db->prepare('UPDATE users SET active_family_id=NULL WHERE id=? AND active_family_id=?')->execute([$target_id, $fid]);
    jout(['ok' => true]);
}

function fam_invite_email(): never {
    $u = require_auth(); $email = strtolower(sf('email'));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_die(['error' => 'Ogiltig e-post']);
    $db = get_db();
    $s = $db->prepare('SELECT name,invite_code FROM families WHERE id=?'); $s->execute([$u['active_family_id']]); $f = $s->fetch();
    if (!$f) json_die(['error' => 'Familj saknas'], 404);
    $link = APP_URL . '/?join=' . $f['invite_code'];
    $html = '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0A0D14;color:#E8EDFB;padding:32px">
<div style="max-width:480px;margin:0 auto;background:#111622;border-radius:16px;padding:32px;border:1px solid #1E2740">
  <div style="text-align:center;margin-bottom:24px"><div style="display:inline-block;background:#4F7FFF;border-radius:12px;padding:12px 18px;font-size:24px">🔐</div>
  <h1 style="font-size:22px;margin:12px 0 4px">Vault — Inbjudan</h1></div>
  <p>Du har blivit inbjuden att gå med i <strong>' . htmlspecialchars($f['name']) . '</strong>.</p>
  <div style="text-align:center;margin:24px 0">
    <div style="background:#1D2538;border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="font-size:11px;color:#8B96B8;margin-bottom:8px;letter-spacing:1px">INBJUDNINGSKOD</div>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#7BA3FF">' . $f['invite_code'] . '</div>
    </div>
    <a href="' . $link . '" style="display:inline-block;background:#4F7FFF;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Gå med direkt →</a>
  </div>
  <p style="font-size:12px;color:#4A5475">Logga in på <a href="' . APP_URL . '" style="color:#7BA3FF">' . APP_URL . '</a> och välj "Gå med".</p>
</div></body></html>';
    if (!send_email($email, 'Du är inbjuden till ' . $f['name'] . ' på Vault', $html)) json_die(['error' => 'Kunde inte skicka mail'], 500);
    jout(['ok' => true]);
}
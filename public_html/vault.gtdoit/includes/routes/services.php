<?php
// ── Services ───────────────────────────────────────────────────────

function svc_list(): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT s.*,i.name AS item_name FROM services s LEFT JOIN items i ON i.id=s.item_id WHERE s.family_id=? ORDER BY s.next_date ASC');
    $s->execute([$u['active_family_id']]); jout($s->fetchAll());
}

function svc_create(): never {
    $u = require_auth(); $title = sf('title'); if (!$title) json_die(['error' => 'Titel krävs']);
    $db = get_db(); $iid = intf('item_id') ?: null;
    $db->prepare('INSERT INTO services (family_id,created_by,item_id,title,last_date,next_date,interval_days,cost,notes) VALUES (?,?,?,?,?,?,?,?,?)')->execute([$u['active_family_id'], $u['id'], $iid, $title, df('last_date'), df('next_date'), intf('interval_days'), ff('cost') ?: null, sf('notes')]);
    $id = $db->lastInsertId();
    $s = get_db()->prepare('SELECT s.*,i.name AS item_name FROM services s LEFT JOIN items i ON i.id=s.item_id WHERE s.id=?');
    $s->execute([$id]); jout($s->fetch(), 201);
}

function svc_update(int $id): never {
    $u = require_auth(); $title = sf('title'); if (!$title) json_die(['error' => 'Titel krävs']);
    $db = get_db(); $iid = intf('item_id') ?: null;
    $db->prepare('UPDATE services SET title=?,item_id=?,last_date=?,next_date=?,interval_days=?,cost=?,notes=? WHERE id=? AND family_id=?')->execute([$title, $iid, df('last_date'), df('next_date'), intf('interval_days'), ff('cost') ?: null, sf('notes'), $id, $u['active_family_id']]);
    $s = get_db()->prepare('SELECT s.*,i.name AS item_name FROM services s LEFT JOIN items i ON i.id=s.item_id WHERE s.id=?');
    $s->execute([$id]); jout($s->fetch());
}

function svc_done(int $id): never {
    $u = require_auth(); $db = get_db();
    $s = $db->prepare('SELECT * FROM services WHERE id=? AND family_id=?'); $s->execute([$id, $u['active_family_id']]); $sv = $s->fetch();
    if (!$sv) json_die(['error' => 'Saknas'], 404);
    $today = date('Y-m-d');
    if ((int)$sv['interval_days'] > 0) {
        $next = date('Y-m-d', strtotime("+{$sv['interval_days']} days"));
        $db->prepare('UPDATE services SET last_date=?,next_date=? WHERE id=?')->execute([$today, $next, $id]);
        $s2 = get_db()->prepare('SELECT s.*,i.name AS item_name FROM services s LEFT JOIN items i ON i.id=s.item_id WHERE s.id=?');
        $s2->execute([$id]); jout($s2->fetch());
    } else {
        $db->prepare('DELETE FROM services WHERE id=?')->execute([$id]);
        jout(['deleted' => true]);
    }
}

function svc_delete(int $id): never {
    $u = require_auth();
    get_db()->prepare('DELETE FROM services WHERE id=? AND family_id=?')->execute([$id, $u['active_family_id']]);
    jout(['ok' => true]);
}

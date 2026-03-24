<?php
// ── Checklists (DB-backed) ─────────────────────────────────────────

function cl_list(): never {
    $u  = require_auth();
    $db = get_db();
    $fid = $u['active_family_id'];

    $s = $db->prepare('SELECT * FROM checklists WHERE family_id=? ORDER BY sort_order, created_at');
    $s->execute([$fid]);
    $lists = $s->fetchAll();

    if ($lists) {
        $ids          = array_column($lists, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $si = $db->prepare("SELECT * FROM checklist_items WHERE checklist_id IN ($placeholders) ORDER BY sort_order, created_at");
        $si->execute($ids);
        $byList = [];
        foreach ($si->fetchAll() as $it) {
            $byList[$it['checklist_id']][] = $it;
        }
        foreach ($lists as &$cl) {
            $cl['items'] = $byList[$cl['id']] ?? [];
        }
    }
    jout($lists ?: []);
}

function cl_create(): never {
    $u     = require_auth();
    $title = sf('title');
    if (!$title) json_die(['error' => 'Titel krävs']);
    $db = get_db();
    $db->prepare('INSERT INTO checklists (family_id,created_by,title,icon,color) VALUES (?,?,?,?,?)')
       ->execute([$u['active_family_id'], $u['id'], $title, sf('icon') ?: '📋', sf('color') ?: '#4F7FFF']);
    $id = $db->lastInsertId();
    $s  = $db->prepare('SELECT * FROM checklists WHERE id=?'); $s->execute([$id]);
    $cl = $s->fetch();
    $cl['items'] = [];
    jout($cl, 201);
}

function cl_update(int $id): never {
    $u = require_auth();
    get_db()->prepare('UPDATE checklists SET title=?,icon=?,color=? WHERE id=? AND family_id=?')
            ->execute([sf('title'), sf('icon') ?: '📋', sf('color') ?: '#4F7FFF', $id, $u['active_family_id']]);
    $s = get_db()->prepare('SELECT * FROM checklists WHERE id=?'); $s->execute([$id]); jout($s->fetch());
}

function cl_delete(int $id): never {
    $u = require_auth();
    get_db()->prepare('DELETE FROM checklists WHERE id=? AND family_id=?')->execute([$id, $u['active_family_id']]);
    jout(['ok' => true]);
}

function cl_item_create(int $cl_id): never {
    $u    = require_auth();
    $text = sf('text');
    if (!$text) json_die(['error' => 'Text krävs']);
    $db = get_db();
    // Verify checklist belongs to this family
    $s = $db->prepare('SELECT id FROM checklists WHERE id=? AND family_id=?');
    $s->execute([$cl_id, $u['active_family_id']]);
    if (!$s->fetch()) json_die(['error' => 'Ej hittad'], 404);
    $db->prepare('INSERT INTO checklist_items (checklist_id,text,sort_order) VALUES (?,?,?)')
       ->execute([$cl_id, $text, (int)sf('sort_order')]);
    $id = $db->lastInsertId();
    $s  = $db->prepare('SELECT * FROM checklist_items WHERE id=?'); $s->execute([$id]); jout($s->fetch(), 201);
}

function cl_item_toggle(int $id): never {
    $u  = require_auth();
    $db = get_db();
    $s  = $db->prepare(
        'SELECT ci.* FROM checklist_items ci
         JOIN checklists cl ON cl.id=ci.checklist_id
         WHERE ci.id=? AND cl.family_id=?'
    );
    $s->execute([$id, $u['active_family_id']]);
    $it = $s->fetch();
    if (!$it) json_die(['error' => 'Ej hittad'], 404);
    $done    = $it['done'] ? 0 : 1;
    $done_at = $done ? date('Y-m-d H:i:s') : null;
    $db->prepare('UPDATE checklist_items SET done=?,done_at=? WHERE id=?')->execute([$done, $done_at, $id]);
    $s = $db->prepare('SELECT * FROM checklist_items WHERE id=?'); $s->execute([$id]); jout($s->fetch());
}

function cl_item_delete(int $id): never {
    $u = require_auth();
    get_db()->prepare(
        'DELETE ci FROM checklist_items ci
         JOIN checklists cl ON cl.id=ci.checklist_id
         WHERE ci.id=? AND cl.family_id=?'
    )->execute([$id, $u['active_family_id']]);
    jout(['ok' => true]);
}

function cl_clear_done(int $cl_id): never {
    $u  = require_auth();
    $db = get_db();
    $s  = $db->prepare('SELECT id FROM checklists WHERE id=? AND family_id=?');
    $s->execute([$cl_id, $u['active_family_id']]);
    if (!$s->fetch()) json_die(['error' => 'Ej hittad'], 404);
    $db->prepare('DELETE FROM checklist_items WHERE checklist_id=? AND done=1')->execute([$cl_id]);
    jout(['ok' => true]);
}

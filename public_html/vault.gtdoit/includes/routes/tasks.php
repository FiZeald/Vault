<?php
// ── Tasks ──────────────────────────────────────────────────────────

function task_list(): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT t.*,u.username AS assigned_name
        FROM tasks t LEFT JOIN users u ON u.id=t.assigned_to
        WHERE t.family_id=?
        ORDER BY t.done ASC, FIELD(t.priority,"urgent","high","medium","low"), t.due_date ASC, t.created_at DESC');
    $s->execute([$u['active_family_id']]); jout($s->fetchAll());
}

function task_create(): never {
    $u = require_auth(); $title = sf('title'); if (!$title) json_die(['error' => 'Titel krävs']);
    $db = get_db(); $at = intf('assigned_to') ?: null;
    $db->prepare('INSERT INTO tasks (family_id,created_by,assigned_to,title,description,priority,category,due_date) VALUES (?,?,?,?,?,?,?,?)')->execute([$u['active_family_id'], $u['id'], $at, $title, sf('description'), sf('priority') ?: 'medium', sf('category'), df('due_date')]);
    $id = $db->lastInsertId();
    $s = get_db()->prepare('SELECT t.*,u.username AS assigned_name FROM tasks t LEFT JOIN users u ON u.id=t.assigned_to WHERE t.id=?');
    $s->execute([$id]); jout($s->fetch(), 201);
}

function task_update(int $id): never {
    $u = require_auth(); $db = get_db();
    $done = (int)(bool)(body()['done'] ?? false);
    $at = intf('assigned_to') ?: null;
    $db->prepare('UPDATE tasks SET title=?,description=?,priority=?,category=?,due_date=?,done=?,assigned_to=?,
        done_at=IF(?=1 AND done=0,NOW(),done_at) WHERE id=? AND family_id=?')
        ->execute([sf('title'), sf('description'), sf('priority') ?: 'medium', sf('category'), df('due_date'), $done, $at, $done, $id, $u['active_family_id']]);
    $s = get_db()->prepare('SELECT t.*,u.username AS assigned_name FROM tasks t LEFT JOIN users u ON u.id=t.assigned_to WHERE t.id=?');
    $s->execute([$id]); jout($s->fetch());
}

function task_delete(int $id): never {
    $u = require_auth();
    get_db()->prepare('DELETE FROM tasks WHERE id=? AND family_id=?')->execute([$id, $u['active_family_id']]);
    jout(['ok' => true]);
}

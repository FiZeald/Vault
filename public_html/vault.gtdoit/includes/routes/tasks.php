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
    $interval = max(0, intf('interval_days', 0));
    $db->prepare('INSERT INTO tasks (family_id,created_by,assigned_to,title,description,priority,category,due_date,interval_days) VALUES (?,?,?,?,?,?,?,?,?)')
       ->execute([$u['active_family_id'], $u['id'], $at, $title, sf('description'), sf('priority') ?: 'medium', sf('category'), df('due_date'), $interval]);
    $id = $db->lastInsertId();
    $s  = get_db()->prepare('SELECT t.*,u.username AS assigned_name FROM tasks t LEFT JOIN users u ON u.id=t.assigned_to WHERE t.id=?');
    $s->execute([$id]);
    log_act($u['active_family_id'], $u['id'], $u['username'], 'create', 'task', $id, $title);
    jout($s->fetch(), 201);
}

function task_update(int $id): never {
    $u   = require_auth();
    $db  = get_db();
    $b   = body();
    $done = (int)(bool)($b['done'] ?? false);
    $at   = intf('assigned_to') ?: null;
    $interval = max(0, intf('interval_days', 0));

    // Fetch old state before update
    $old = $db->prepare('SELECT * FROM tasks WHERE id=? AND family_id=?');
    $old->execute([$id, $u['active_family_id']]);
    $existing = $old->fetch();
    if (!$existing) json_die(['error' => 'Ej hittad'], 404);

    $db->prepare('UPDATE tasks SET title=?,description=?,priority=?,category=?,due_date=?,done=?,assigned_to=?,interval_days=?,
        done_at=IF(?=1 AND done=0,NOW(),done_at) WHERE id=? AND family_id=?')
       ->execute([sf('title'), sf('description'), sf('priority') ?: 'medium', sf('category'), df('due_date'), $done, $at, $interval, $done, $id, $u['active_family_id']]);

    // If task just got marked done and has interval, create next occurrence
    if ($done && !$existing['done'] && $interval > 0) {
        $title    = sf('title') ?: $existing['title'];
        $due_date = date('Y-m-d', strtotime('+' . $interval . ' days'));
        $db->prepare('INSERT INTO tasks (family_id,created_by,assigned_to,title,description,priority,category,due_date,interval_days) VALUES (?,?,?,?,?,?,?,?,?)')
           ->execute([$u['active_family_id'], $existing['created_by'], $existing['assigned_to'], $title, $existing['description'], $existing['priority'], $existing['category'], $due_date, $interval]);
        log_act($u['active_family_id'], $u['id'], $u['username'], 'recurring_create', 'task', (int)$db->lastInsertId(), $title);
    }

    $s = get_db()->prepare('SELECT t.*,u.username AS assigned_name FROM tasks t LEFT JOIN users u ON u.id=t.assigned_to WHERE t.id=?');
    $s->execute([$id]);
    if ($done && !$existing['done']) log_act($u['active_family_id'], $u['id'], $u['username'], 'done', 'task', $id, sf('title') ?: $existing['title']);
    jout($s->fetch());
}

function task_delete(int $id): never {
    $u  = require_auth();
    $s  = get_db()->prepare('SELECT title FROM tasks WHERE id=? AND family_id=?'); $s->execute([$id, $u['active_family_id']]); $row = $s->fetch();
    get_db()->prepare('DELETE FROM tasks WHERE id=? AND family_id=?')->execute([$id, $u['active_family_id']]);
    if ($row) log_act($u['active_family_id'], $u['id'], $u['username'], 'delete', 'task', $id, $row['title']);
    jout(['ok' => true]);
}

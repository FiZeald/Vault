<?php
// ── Activity log ───────────────────────────────────────────────────

function activity_list(): never {
    $u     = require_auth();
    $limit = max(10, min(100, intf('limit', 40)));
    $s = get_db()->prepare(
        'SELECT * FROM activity_log WHERE family_id=? ORDER BY created_at DESC LIMIT ?'
    );
    $s->execute([$u['active_family_id'], $limit]);
    jout($s->fetchAll());
}

function inventory_snapshots_list(): never {
    $u = require_auth();
    $s = get_db()->prepare(
        'SELECT * FROM inventory_snapshots WHERE family_id=? ORDER BY snapshot_date ASC LIMIT 90'
    );
    $s->execute([$u['active_family_id']]);
    jout($s->fetchAll());
}

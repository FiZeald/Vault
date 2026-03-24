<?php
// ── Notification settings ──────────────────────────────────────────

function notif_get(): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT * FROM notification_settings WHERE family_id=? AND user_id=?');
    $s->execute([$u['active_family_id'], $u['id']]);
    $row = $s->fetch();
    if (!$row) {
        // Return defaults
        jout(['family_id' => $u['active_family_id'], 'user_id' => $u['id'], 'email_enabled' => 1, 'email_service_days' => 7, 'email_warranty_days' => 30]);
    }
    jout($row);
}

function notif_save(): never {
    $u = require_auth();
    $enabled  = (int)(bool)(body()['email_enabled'] ?? true);
    $svc_days  = max(1, min(90, intf('email_service_days',  7)));
    $warr_days = max(1, min(365, intf('email_warranty_days', 30)));
    $db = get_db();
    $db->prepare(
        'INSERT INTO notification_settings (family_id,user_id,email_enabled,email_service_days,email_warranty_days) VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE email_enabled=VALUES(email_enabled),email_service_days=VALUES(email_service_days),email_warranty_days=VALUES(email_warranty_days)'
    )->execute([$u['active_family_id'], $u['id'], $enabled, $svc_days, $warr_days]);
    $s = $db->prepare('SELECT * FROM notification_settings WHERE family_id=? AND user_id=?');
    $s->execute([$u['active_family_id'], $u['id']]);
    jout($s->fetch());
}

<?php
/**
 * Vault — Email notification cron job
 *
 * Run daily via cron:
 *   0 8 * * * php /path/to/vault.gtdoit/notify_cron.php >> /var/log/vault_notify.log 2>&1
 *
 * Sends reminders to users who have email_enabled=1 in notification_settings:
 *  - Service/underhåll due within email_service_days days
 *  - Warranty expiring within email_warranty_days days
 */
declare(strict_types=1);

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';

$db  = get_db();
$now = date('Y-m-d');

// ── Fetch all users with notifications enabled ─────────────────────
$ns = $db->prepare(
    'SELECT ns.*, u.email, u.username, f.name AS family_name
     FROM notification_settings ns
     JOIN users u  ON u.id  = ns.user_id
     JOIN families f ON f.id = ns.family_id
     WHERE ns.email_enabled = 1'
);
$ns->execute();
$settings = $ns->fetchAll();

$sent = 0;

foreach ($settings as $cfg) {
    $fid       = (int)$cfg['family_id'];
    $uid       = (int)$cfg['user_id'];
    $svc_days  = (int)$cfg['email_service_days'];
    $warr_days = (int)$cfg['email_warranty_days'];
    $to        = $cfg['email'];
    $name      = $cfg['username'];
    $fam       = $cfg['family_name'];

    // ── Service reminders ──────────────────────────────────────────
    $svc_cutoff = date('Y-m-d', strtotime("+$svc_days days"));
    $s = $db->prepare(
        'SELECT * FROM services WHERE family_id=? AND next_date IS NOT NULL AND next_date <= ? AND next_date >= ? ORDER BY next_date ASC'
    );
    $s->execute([$fid, $svc_cutoff, $now]);
    $svcs = $s->fetchAll();

    // ── Warranty reminders ────────────────────────────────────────
    $warr_cutoff = date('Y-m-d', strtotime("+$warr_days days"));
    $w = $db->prepare(
        'SELECT * FROM items WHERE family_id=? AND warranty IS NOT NULL AND warranty <= ? AND warranty >= ? ORDER BY warranty ASC'
    );
    $w->execute([$fid, $warr_cutoff, $now]);
    $warrs = $w->fetchAll();

    if (empty($svcs) && empty($warrs)) continue;

    // ── Build email ───────────────────────────────────────────────
    $html  = "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body style='font-family:sans-serif;color:#1a1a2e;max-width:600px;margin:auto;padding:20px'>";
    $html .= "<h2 style='color:#4F7FFF'>📋 Vault – Påminnelser för {$fam}</h2>";
    $html .= "<p>Hej {$name}, här är dina kommande händelser:</p>";

    if (!empty($svcs)) {
        $html .= "<h3 style='color:#F59E0B'>🔧 Service & underhåll</h3><ul>";
        foreach ($svcs as $svc) {
            $days_left = (int)round((strtotime($svc['next_date']) - strtotime($now)) / 86400);
            $label = $days_left <= 0 ? '⚠️ Förfallen' : "om $days_left dagar";
            $html .= "<li><strong>{$svc['title']}</strong> — {$svc['next_date']} ({$label})</li>";
        }
        $html .= "</ul>";
    }

    if (!empty($warrs)) {
        $html .= "<h3 style='color:#EF4444'>🛡️ Garantier</h3><ul>";
        foreach ($warrs as $item) {
            $days_left = (int)round((strtotime($item['warranty']) - strtotime($now)) / 86400);
            $label = $days_left <= 0 ? '⚠️ Utgången' : "om $days_left dagar";
            $html .= "<li><strong>{$item['name']}</strong> — garanti t.o.m. {$item['warranty']} ({$label})</li>";
        }
        $html .= "</ul>";
    }

    $html .= "<p style='margin-top:24px'><a href='" . APP_URL . "' style='background:#4F7FFF;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none'>Öppna Vault</a></p>";
    $html .= "<p style='font-size:11px;color:#888;margin-top:24px'>Du kan stänga av dessa e-postmeddelanden i inställningarna.</p>";
    $html .= "</body></html>";

    $subject = "Vault — " . count($svcs) + count($warrs) . " kommande händelse(r) för $fam";
    if (send_email($to, $subject, $html)) {
        $sent++;
        echo date('Y-m-d H:i:s') . " Sent to $to ({$fam}): " . count($svcs) . " svc, " . count($warrs) . " warr\n";
    } else {
        echo date('Y-m-d H:i:s') . " FAILED to send to $to\n";
    }
}

echo date('Y-m-d H:i:s') . " Done. Sent $sent emails.\n";

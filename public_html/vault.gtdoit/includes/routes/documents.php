<?php
// ── Item documents (PDF / image attachments) ───────────────────────

function doc_list(int $item_id): never {
    $u = require_auth();
    // Verify item belongs to family
    $s = get_db()->prepare('SELECT id FROM items WHERE id=? AND family_id=?');
    $s->execute([$item_id, $u['active_family_id']]);
    if (!$s->fetch()) json_die(['error' => 'Ej hittad'], 404);
    $s = get_db()->prepare('SELECT * FROM item_documents WHERE item_id=? ORDER BY created_at DESC');
    $s->execute([$item_id]); jout($s->fetchAll());
}

function doc_upload(int $item_id): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT id FROM items WHERE id=? AND family_id=?');
    $s->execute([$item_id, $u['active_family_id']]);
    if (!$s->fetch()) json_die(['error' => 'Ej hittad'], 404);

    if (!isset($_FILES['file'])) json_die(['error' => 'Ingen fil']);
    $f = $_FILES['file'];
    if ($f['error'] !== UPLOAD_ERR_OK) json_die(['error' => 'Fel ' . $f['error']]);
    if ($f['size'] > MAX_UPLOAD_MB * 1024 * 1024) json_die(['error' => 'Max ' . MAX_UPLOAD_MB . 'MB']);

    $fi   = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($fi, $f['tmp_name']);
    finfo_close($fi);
    $ok = [
        'image/jpeg'       => 'jpg',
        'image/png'        => 'png',
        'image/webp'       => 'webp',
        'application/pdf'  => 'pdf',
    ];
    if (!isset($ok[$mime])) json_die(['error' => 'Tillåts: jpg,png,webp,pdf']);

    $ext  = $ok[$mime];
    $name = 'doc_' . $u['id'] . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
    if (!move_uploaded_file($f['tmp_name'], UPLOAD_DIR . $name)) json_die(['error' => 'Kunde ej spara'], 500);

    $label = trim($_POST['label'] ?? '') ?: 'Dokument';
    $url   = UPLOAD_URL . $name;
    $db    = get_db();
    $db->prepare('INSERT INTO item_documents (item_id,family_id,created_by,label,file_url,file_type,file_size) VALUES (?,?,?,?,?,?,?)')
       ->execute([$item_id, $u['active_family_id'], $u['id'], $label, $url, $ext, $f['size']]);
    $id = $db->lastInsertId();
    $s  = $db->prepare('SELECT * FROM item_documents WHERE id=?');
    $s->execute([$id]);
    log_act($u['active_family_id'], $u['id'], $u['username'], 'create', 'document', $id, $label);
    jout($s->fetch(), 201);
}

function doc_delete(int $doc_id): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT d.* FROM item_documents d JOIN items i ON i.id=d.item_id WHERE d.id=? AND d.family_id=?');
    $s->execute([$doc_id, $u['active_family_id']]);
    $doc = $s->fetch();
    if (!$doc) json_die(['error' => 'Ej hittad'], 404);
    get_db()->prepare('DELETE FROM item_documents WHERE id=?')->execute([$doc_id]);
    log_act($u['active_family_id'], $u['id'], $u['username'], 'delete', 'document', $doc_id, $doc['label']);
    jout(['ok' => true]);
}

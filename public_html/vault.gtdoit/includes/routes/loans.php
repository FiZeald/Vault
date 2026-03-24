<?php
// ── Item loans (lent to / return tracking) ─────────────────────────

function loan_list(int $item_id): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT id FROM items WHERE id=? AND family_id=?');
    $s->execute([$item_id, $u['active_family_id']]);
    if (!$s->fetch()) json_die(['error' => 'Ej hittad'], 404);
    $s = get_db()->prepare('SELECT * FROM item_loans WHERE item_id=? ORDER BY loan_date DESC');
    $s->execute([$item_id]); jout($s->fetchAll());
}

function loan_create(int $item_id): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT id,name FROM items WHERE id=? AND family_id=?');
    $s->execute([$item_id, $u['active_family_id']]);
    $item = $s->fetch();
    if (!$item) json_die(['error' => 'Ej hittad'], 404);

    $to = sf('loaned_to'); if (!$to) json_die(['error' => 'Låntagare krävs']);
    $loan_date   = df('loan_date')   ?: date('Y-m-d');
    $return_date = df('return_date');

    $db = get_db();
    $db->prepare('INSERT INTO item_loans (item_id,family_id,created_by,loaned_to,loan_date,return_date,notes) VALUES (?,?,?,?,?,?,?)')
       ->execute([$item_id, $u['active_family_id'], $u['id'], $to, $loan_date, $return_date, sf('notes')]);
    $id = $db->lastInsertId();

    // Update item status to 'lent'
    $db->prepare('UPDATE items SET status=? WHERE id=?')->execute(['lent', $item_id]);

    $s = $db->prepare('SELECT * FROM item_loans WHERE id=?'); $s->execute([$id]);
    log_act($u['active_family_id'], $u['id'], $u['username'], 'loan', 'item', $item_id, $item['name'] . ' → ' . $to);
    jout($s->fetch(), 201);
}

function loan_return(int $loan_id): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT l.*,i.name AS item_name FROM item_loans l JOIN items i ON i.id=l.item_id WHERE l.id=? AND l.family_id=?');
    $s->execute([$loan_id, $u['active_family_id']]);
    $loan = $s->fetch();
    if (!$loan) json_die(['error' => 'Ej hittad'], 404);

    $db = get_db();
    $db->prepare('UPDATE item_loans SET returned_at=NOW() WHERE id=?')->execute([$loan_id]);

    // If no other active loans for this item, set status back to 'ok'
    $s2 = $db->prepare('SELECT COUNT(*) FROM item_loans WHERE item_id=? AND returned_at IS NULL');
    $s2->execute([$loan['item_id']]);
    if ((int)$s2->fetchColumn() === 0) {
        $db->prepare('UPDATE items SET status=? WHERE id=?')->execute(['ok', $loan['item_id']]);
    }

    log_act($u['active_family_id'], $u['id'], $u['username'], 'return', 'item', $loan['item_id'], $loan['item_name']);
    $s3 = $db->prepare('SELECT * FROM item_loans WHERE id=?'); $s3->execute([$loan_id]);
    jout($s3->fetch());
}

function loan_delete(int $loan_id): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT * FROM item_loans WHERE id=? AND family_id=?');
    $s->execute([$loan_id, $u['active_family_id']]);
    if (!$s->fetch()) json_die(['error' => 'Ej hittad'], 404);
    get_db()->prepare('DELETE FROM item_loans WHERE id=?')->execute([$loan_id]);
    jout(['ok' => true]);
}

function loans_active(): never {
    $u = require_auth();
    $s = get_db()->prepare(
        'SELECT l.*,i.name AS item_name FROM item_loans l
         JOIN items i ON i.id=l.item_id
         WHERE l.family_id=? AND l.returned_at IS NULL
         ORDER BY l.loan_date ASC'
    );
    $s->execute([$u['active_family_id']]); jout($s->fetchAll());
}

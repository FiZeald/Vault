<?php
// ── Seed — standardkategorier vid ny familj ────────────────────────

function seed_categories(PDO $db, int $fid): void {
    $cats = [
        ['Elektronik',      '📺', '#5B8EF0', 0],
        ['Fordon',          '🚗', '#F59E0B', 1],
        ['Vitvaror',        '🍳', '#10B981', 2],
        ['Möbler',          '🛋️', '#8B5CF6', 3],
        ['Verktyg',         '🔧', '#06B6D4', 4],
        ['Kläder & Skor',   '👗', '#EC4899', 5],
        ['Sport & Fritid',  '⚽', '#F04F6C', 6],
        ['Trädgård',        '🌳', '#22C55E', 7],
        ['Husdjur',         '🐕', '#F97316', 8],
        ['Hälsa & Vård',    '🩺', '#14B8A6', 9],
        ['Barn & Leksaker', '🧸', '#A78BFA', 10],
        ['Övrigt',          '📦', '#6B7280', 11],
    ];
    $st = $db->prepare('INSERT IGNORE INTO categories (family_id,name,icon,color,sort_order) VALUES (?,?,?,?,?)');
    foreach ($cats as [$name, $icon, $color, $ord]) $st->execute([$fid, $name, $icon, $color, $ord]);
}

function seed_budget_categories(PDO $db, int $fid): void {
    $cats = [
        ['Boende & Hyra',      '🏠', '#5B8EF0', 'expense', null],
        ['Mat & Dagligvaror',  '🛒', '#10B981', 'expense', null],
        ['Transport',          '🚗', '#F59E0B', 'expense', null],
        ['Restaurang & Café',  '🍽️', '#EC4899', 'expense', null],
        ['Nöje & Shopping',    '🎬', '#8B5CF6', 'expense', null],
        ['El & Värme',         '💡', '#F97316', 'expense', null],
        ['Försäkringar',       '🛡️', '#06B6D4', 'expense', null],
        ['Hälsa & Apotek',     '🩺', '#14B8A6', 'expense', null],
        ['Barn & Skola',       '🎒', '#A78BFA', 'expense', null],
        ['Sparande',           '🏦', '#22C55E', 'expense', null],
        ['Övrigt',             '💸', '#6B7280', 'expense', null],
        ['Lön',                '💼', '#10B981', 'income',  null],
        ['Bidrag & Ersättning','🏛️', '#5B8EF0', 'income',  null],
        ['Övrig inkomst',      '💰', '#F59E0B', 'income',  null],
    ];
    $st = $db->prepare('INSERT IGNORE INTO budget_categories (family_id,name,icon,color,type,budget) VALUES (?,?,?,?,?,?)');
    foreach ($cats as [$name, $icon, $color, $type, $budget]) $st->execute([$fid, $name, $icon, $color, $type, $budget]);
}

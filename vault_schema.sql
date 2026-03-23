-- ═══════════════════════════════════════════════════════════════════════
-- VAULT v3 — Komplett databasschema
-- Kör i phpMyAdmin → SQL på en TOM databas
-- ═══════════════════════════════════════════════════════════════════════

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS budget_categories;
DROP TABLE IF EXISTS receipts;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS user_families;
DROP TABLE IF EXISTS families;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email            VARCHAR(191)  NOT NULL UNIQUE,
    username         VARCHAR(100)  NOT NULL,
    password         VARCHAR(255)  NOT NULL,
    active_family_id INT UNSIGNED  NULL DEFAULT NULL,
    avatar_color     VARCHAR(7)    NOT NULL DEFAULT '#5B8EF0',
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_resets (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED  NOT NULL,
    token      VARCHAR(64)   NOT NULL UNIQUE,
    expires_at TIMESTAMP     NOT NULL,
    used       TINYINT(1)    NOT NULL DEFAULT 0,
    created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE families (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150)  NOT NULL,
    invite_code CHAR(6)       NOT NULL UNIQUE,
    owner_id    INT UNSIGNED  NOT NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fam_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users ADD CONSTRAINT fk_user_active_family
    FOREIGN KEY (active_family_id) REFERENCES families(id) ON DELETE SET NULL;

CREATE TABLE user_families (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED  NOT NULL,
    family_id   INT UNSIGNED  NOT NULL,
    family_role ENUM('owner','member') NOT NULL DEFAULT 'member',
    joined_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_uf (user_id, family_id),
    CONSTRAINT fk_uf_user   FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_uf_family FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    family_id  INT UNSIGNED  NOT NULL,
    name       VARCHAR(100)  NOT NULL,
    icon       VARCHAR(10)   NOT NULL DEFAULT '📦',
    color      VARCHAR(7)    NOT NULL DEFAULT '#5B8EF0',
    sort_order INT           NOT NULL DEFAULT 0,
    created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cat (family_id, name),
    CONSTRAINT fk_cat_fam FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE items (
    id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    family_id   INT UNSIGNED  NOT NULL,
    created_by  INT UNSIGNED  NOT NULL,
    name        VARCHAR(200)  NOT NULL,
    category    VARCHAR(100)  NOT NULL DEFAULT 'Övrigt',
    location    VARCHAR(150)  NULL,
    purchased   DATE          NULL,
    price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    warranty    DATE          NULL,
    serial      VARCHAR(100)  NULL,
    notes       TEXT          NULL,
    photo       VARCHAR(500)  NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_fam  FOREIGN KEY (family_id)  REFERENCES families(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_user FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tasks (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    family_id   INT UNSIGNED  NOT NULL,
    created_by  INT UNSIGNED  NOT NULL,
    assigned_to INT UNSIGNED  NULL,
    title       VARCHAR(200)  NOT NULL,
    description TEXT          NULL,
    priority    ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    category    VARCHAR(100)  NULL,
    due_date    DATE          NULL,
    done        TINYINT(1)    NOT NULL DEFAULT 0,
    done_at     TIMESTAMP     NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_fam  FOREIGN KEY (family_id)  REFERENCES families(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_user FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE services (
    id            INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
    family_id     INT UNSIGNED      NOT NULL,
    created_by    INT UNSIGNED      NOT NULL,
    item_id       INT UNSIGNED      NULL,
    title         VARCHAR(200)      NOT NULL,
    last_date     DATE              NULL,
    next_date     DATE              NULL,
    interval_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    cost          DECIMAL(10,2)     NULL,
    notes         TEXT              NULL,
    created_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_svc_fam  FOREIGN KEY (family_id)  REFERENCES families(id) ON DELETE CASCADE,
    CONSTRAINT fk_svc_user FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_svc_item FOREIGN KEY (item_id)    REFERENCES items(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE receipts (
    id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    family_id    INT UNSIGNED  NOT NULL,
    created_by   INT UNSIGNED  NOT NULL,
    item_id      INT UNSIGNED  NULL,
    title        VARCHAR(200)  NOT NULL,
    amount       DECIMAL(10,2) NULL,
    store        VARCHAR(150)  NULL,
    receipt_date DATE          NULL,
    notes        TEXT          NULL,
    photo        VARCHAR(500)  NULL,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rec_fam  FOREIGN KEY (family_id)  REFERENCES families(id) ON DELETE CASCADE,
    CONSTRAINT fk_rec_user FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_rec_item FOREIGN KEY (item_id)    REFERENCES items(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE budget_categories (
    id         INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    family_id  INT UNSIGNED  NOT NULL,
    name       VARCHAR(100)  NOT NULL,
    icon       VARCHAR(10)   NOT NULL DEFAULT '💰',
    color      VARCHAR(7)    NOT NULL DEFAULT '#5B8EF0',
    type       ENUM('income','expense') NOT NULL DEFAULT 'expense',
    budget     DECIMAL(10,2) NULL,
    created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_bcat (family_id, name, type),
    CONSTRAINT fk_bcat_fam FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transactions (
    id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    family_id   INT UNSIGNED  NOT NULL,
    created_by  INT UNSIGNED  NOT NULL,
    category_id INT UNSIGNED  NULL,
    type        ENUM('income','expense') NOT NULL DEFAULT 'expense',
    amount      DECIMAL(10,2) NOT NULL,
    description VARCHAR(200)  NOT NULL,
    note        TEXT          NULL,
    trans_date  DATE          NOT NULL,
    source_file VARCHAR(200)  NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tr_fam  FOREIGN KEY (family_id)   REFERENCES families(id)          ON DELETE CASCADE,
    CONSTRAINT fk_tr_user FOREIGN KEY (created_by)  REFERENCES users(id)             ON DELETE CASCADE,
    CONSTRAINT fk_tr_cat  FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_items_fam   ON items        (family_id);
CREATE INDEX idx_tasks_fam   ON tasks        (family_id, done);
CREATE INDEX idx_svc_next    ON services     (family_id, next_date);
CREATE INDEX idx_rec_date    ON receipts     (family_id, receipt_date DESC);
CREATE INDEX idx_tr_date     ON transactions (family_id, trans_date DESC);
CREATE INDEX idx_tr_type     ON transactions (family_id, type, trans_date);
CREATE INDEX idx_pr_token    ON password_resets (token);

SET FOREIGN_KEY_CHECKS = 1;

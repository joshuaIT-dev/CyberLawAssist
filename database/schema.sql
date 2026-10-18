-- CyberLawAssist database plan: MariaDB 10.4.32 (installed XAMPP version).
-- Installation schema. database/setup.php creates it; database/migrate.php handles existing installations.
-- No sample accounts, passwords, personal records, or legal content are seeded.
CREATE DATABASE IF NOT EXISTS cyberlawassist
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cyberlawassist;
SET time_zone = '+00:00';

CREATE TABLE users (
  id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(50) NULL,
  admin_number VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NULL,
  policy_version VARCHAR(20) NULL,
  policy_accepted_at DATETIME NULL,
  password_hash VARCHAR(255) NOT NULL,
  login_failures INT UNSIGNED NOT NULL DEFAULT 0,
  login_locked_until DATETIME NULL,
  session_version INT UNSIGNED NOT NULL DEFAULT 1,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  ui_language ENUM('en', 'tl') NOT NULL DEFAULT 'en',
  chat_language ENUM('auto', 'en', 'tl', 'taglish') NOT NULL DEFAULT 'auto',
  email_updates TINYINT(1) NOT NULL DEFAULT 1,
  privacy_reminders TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_admin_number (admin_number),
  KEY ix_users_role_status (role, status)
) ENGINE=InnoDB;

CREATE TABLE chat_conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title VARCHAR(120) NOT NULL,
  is_pinned TINYINT(1) NOT NULL DEFAULT 0,
  last_topic VARCHAR(80) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_chat_owner_sort (user_id, is_pinned, updated_at),
  CONSTRAINT fk_chat_owner FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE chat_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  request_key VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  sender ENUM('user', 'assistant') NOT NULL,
  body TEXT NOT NULL,
  language ENUM('auto', 'en', 'tl', 'taglish') NOT NULL DEFAULT 'auto',
  delivery_status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
  response_meta JSON NULL COMMENT 'Assistant topic, intent_id, kind, match_score, sources, suggestions',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_chat_request_sender (conversation_id, request_key, sender),
  KEY ix_chat_message_order (conversation_id, id),
  CONSTRAINT fk_chat_message_conversation FOREIGN KEY (conversation_id)
    REFERENCES chat_conversations (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE support_threads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_support_user (user_id),
  KEY ix_support_recent (updated_at),
  CONSTRAINT fk_support_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE support_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  thread_id BIGINT UNSIGNED NOT NULL,
  sender_user_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  sender_role ENUM('user', 'admin') NOT NULL,
  request_key VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_support_request (thread_id, sender_user_id, request_key),
  KEY ix_support_message_order (thread_id, id),
  KEY ix_support_sender (sender_user_id),
  CONSTRAINT fk_support_message_thread FOREIGN KEY (thread_id)
    REFERENCES support_threads (id) ON DELETE CASCADE,
  CONSTRAINT fk_support_message_sender FOREIGN KEY (sender_user_id)
    REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE checklist_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  request_key VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NULL,
  label VARCHAR(500) NOT NULL,
  is_completed TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_checklist_owner_order (user_id, sort_order, id),
  UNIQUE KEY uq_checklist_request (user_id, request_key),
  CONSTRAINT fk_checklist_owner FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE case_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference VARCHAR(32) NULL COMMENT 'Assigned after insert within the same transaction',
  visitor_name VARCHAR(120) NULL COMMENT 'NULL only for a retained incomplete legacy record',
  contact_number VARCHAR(50) NULL,
  concern_type ENUM('online_harassment', 'account_access', 'online_fraud', 'identity_theft', 'other') NOT NULL,
  visit_date DATE NULL COMMENT 'Required for new intake; unknown legacy dates stay NULL',
  assigned_staff VARCHAR(120) NULL,
  status ENUM('for_review', 'in_progress', 'referred', 'completed') NOT NULL DEFAULT 'for_review',
  factual_notes TEXT NULL,
  is_legacy TINYINT(1) NOT NULL DEFAULT 0,
  created_by CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  request_key VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NULL,
  revision INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_case_reference (reference),
  KEY ix_case_report_date_status (visit_date, status),
  KEY ix_case_created_by (created_by),
  UNIQUE KEY uq_case_request (created_by, request_key),
  CONSTRAINT fk_case_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  recipient_user_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NULL COMMENT 'NULL means a broadcast to audience',
  audience ENUM('all', 'guest', 'user', 'admin') NOT NULL,
  kind ENUM('notification', 'alert') NOT NULL DEFAULT 'notification',
  title_en VARCHAR(160) NOT NULL,
  body_en TEXT NOT NULL,
  title_tl VARCHAR(160) NULL,
  body_tl TEXT NULL,
  action_tab VARCHAR(40) NULL,
  support_thread_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_notification_recipient (recipient_user_id, kind, created_at),
  KEY ix_notification_audience (audience, kind, created_at),
  KEY ix_notification_support (support_thread_id),
  CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_user_id) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_notification_support FOREIGN KEY (support_thread_id) REFERENCES support_threads (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE notification_reads (
  notification_id BIGINT UNSIGNED NOT NULL,
  user_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id, user_id),
  KEY ix_notification_read_user (user_id, notification_id),
  CONSTRAINT fk_notification_read_notice FOREIGN KEY (notification_id) REFERENCES notifications (id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_read_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE law_topics (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  law_reference VARCHAR(100) NOT NULL DEFAULT 'RA 10175',
  section_reference VARCHAR(160) NULL,
  source_urls JSON NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_law_slug (slug),
  KEY ix_law_public_order (is_published, sort_order)
) ENGINE=InnoDB;

CREATE TABLE law_translations (
  law_topic_id INT UNSIGNED NOT NULL,
  language ENUM('en', 'tl', 'taglish') NOT NULL,
  title VARCHAR(200) NOT NULL,
  summary TEXT NOT NULL,
  legal_text LONGTEXT NULL,
  penalties TEXT NULL,
  fines TEXT NULL,
  evidence_guidance TEXT NULL,
  next_steps TEXT NULL,
  PRIMARY KEY (law_topic_id, language),
  CONSTRAINT fk_law_translation_topic FOREIGN KEY (law_topic_id) REFERENCES law_topics (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE office_contacts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  contact_type ENUM('office', 'agency') NOT NULL,
  name VARCHAR(200) NOT NULL,
  address TEXT NULL,
  phone VARCHAR(50) NULL,
  website_url VARCHAR(1000) NULL,
  source_url VARCHAR(1000) NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_office_slug (slug),
  KEY ix_office_public_order (is_active, sort_order)
) ENGINE=InnoDB;

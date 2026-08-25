-- ============================================================
-- Migration 0001: Initial schema
-- Includes all tables, indexes, enums, RLS policies, and DB roles
-- ============================================================

-- ─── ENUM TYPES ──────────────────────────────────────────────
CREATE TYPE "UserRole" AS ENUM (
  'BD_AGENT', 'ESTIMATION_ENGINEER', 'DESIGN_ENGINEER', 'ADMIN'
);

CREATE TYPE "ProjectStatus" AS ENUM (
  'received', 'assigned', 'in_progress', 'delivered', 'sent_to_client'
);

CREATE TYPE "PriorityLevel" AS ENUM (
  'low', 'medium', 'high', 'urgent'
);

CREATE TYPE "AuditEventType" AS ENUM (
  'USER_LOGIN_SUCCESS', 'USER_LOGIN_FAILURE',
  'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE',
  'PROJECT_SUBMITTED', 'PROJECT_ASSIGNED', 'PROJECT_REASSIGNED',
  'DELIVERABLE_UPLOADED', 'SEND_TO_CLIENT_SUCCESS', 'SEND_TO_CLIENT_FAILURE',
  'CHAT_MESSAGE_SENT', 'USER_ACCOUNT_CREATED', 'USER_ACCOUNT_UPDATED',
  'USER_ACCOUNT_DEACTIVATED', 'ROLE_CHANGED'
);

-- ─── TABLES ──────────────────────────────────────────────────

CREATE TABLE "users" (
  "id"               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "full_name"        VARCHAR(255) NOT NULL,
  "email"            VARCHAR(255) NOT NULL UNIQUE,
  "password_hash"    VARCHAR(255) NOT NULL,
  "role"             "UserRole"   NOT NULL,
  "totp_secret"      VARCHAR(255),
  "is_active"        BOOLEAN      NOT NULL DEFAULT TRUE,
  "lockout_until"    TIMESTAMPTZ,
  "failed_2fa_count" INT          NOT NULL DEFAULT 0,
  "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE "refresh_tokens" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash"  VARCHAR(255) NOT NULL UNIQUE,
  "expires_at"  TIMESTAMPTZ  NOT NULL,
  "revoked"     BOOLEAN      NOT NULL DEFAULT FALSE,
  "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user_id ON "refresh_tokens"("user_id");

CREATE TABLE "password_reset_tokens" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash"  VARCHAR(255) NOT NULL UNIQUE,
  "expires_at"  TIMESTAMPTZ  NOT NULL,
  "used"        BOOLEAN      NOT NULL DEFAULT FALSE,
  "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE "projects" (
  "id"                 UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  "reference_number"   VARCHAR(20)    NOT NULL UNIQUE,
  "bd_agent_id"        UUID           NOT NULL REFERENCES "users"("id"),
  "client_name"        VARCHAR(255)   NOT NULL,
  "client_email"       VARCHAR(255)   NOT NULL,
  "client_phone"       VARCHAR(50)    NOT NULL,
  "scope_description"  TEXT           NOT NULL,
  "requested_deadline" DATE           NOT NULL,
  "status"             "ProjectStatus" NOT NULL DEFAULT 'received',
  "internal_deadline"  DATE,
  "priority"           "PriorityLevel",
  "admin_instructions" TEXT,
  "assigned_to"        UUID           REFERENCES "users"("id"),
  "project_type"       VARCHAR(50),
  "submitted_at"       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updated_at"         TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_projects_bd_agent_id ON "projects"("bd_agent_id");
CREATE INDEX idx_projects_assigned_to ON "projects"("assigned_to");
CREATE INDEX idx_projects_status      ON "projects"("status");

CREATE TABLE "project_status_history" (
  "id"          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id"  UUID            NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "from_status" "ProjectStatus",
  "to_status"   "ProjectStatus" NOT NULL,
  "changed_by"  UUID            NOT NULL REFERENCES "users"("id"),
  "changed_at"  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "notes"       TEXT
);
CREATE INDEX idx_psh_project_id ON "project_status_history"("project_id");

CREATE TABLE "project_files" (
  "id"            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id"    UUID        NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "original_name" VARCHAR(500) NOT NULL,
  "s3_key"        VARCHAR(1000) NOT NULL UNIQUE,
  "mime_type"     VARCHAR(100) NOT NULL,
  "size_bytes"    BIGINT       NOT NULL,
  "uploaded_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_project_files_project_id ON "project_files"("project_id");

CREATE TABLE "deliverables" (
  "id"            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id"    UUID        NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "engineer_id"   UUID        NOT NULL REFERENCES "users"("id"),
  "original_name" VARCHAR(500) NOT NULL,
  "s3_key"        VARCHAR(1000) NOT NULL UNIQUE,
  "mime_type"     VARCHAR(100) NOT NULL,
  "size_bytes"    BIGINT       NOT NULL,
  "uploaded_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_deliverables_project_id ON "deliverables"("project_id");

CREATE TABLE "client_delivery_log" (
  "id"              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id"      UUID        NOT NULL REFERENCES "projects"("id"),
  "sent_by"         UUID        NOT NULL REFERENCES "users"("id"),
  "recipient_email" VARCHAR(255) NOT NULL,
  "subject"         VARCHAR(500) NOT NULL,
  "delivery_method" VARCHAR(20)  NOT NULL,
  "sent_at"         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "success"         BOOLEAN      NOT NULL,
  "error_message"   TEXT
);

CREATE TABLE "chat_threads" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "employee_id" UUID        NOT NULL UNIQUE REFERENCES "users"("id"),
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "chat_messages" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "thread_id" UUID        NOT NULL REFERENCES "chat_threads"("id") ON DELETE CASCADE,
  "sender_id" UUID        NOT NULL REFERENCES "users"("id"),
  "content"   TEXT        NOT NULL,
  "sent_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "read_at"   TIMESTAMPTZ
);
CREATE INDEX idx_chat_messages_thread_id ON "chat_messages"("thread_id");
CREATE INDEX idx_chat_messages_thread_sent ON "chat_messages"("thread_id", "sent_at");

CREATE TABLE "notifications" (
  "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "event_type" VARCHAR(100) NOT NULL,
  "title"      VARCHAR(255) NOT NULL,
  "body"       TEXT         NOT NULL,
  "metadata"   JSONB,
  "read"       BOOLEAN      NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_read ON "notifications"("user_id", "read");

CREATE TABLE "audit_log" (
  "id"          BIGSERIAL    PRIMARY KEY,
  "event_type"  "AuditEventType" NOT NULL,
  "actor_id"    UUID         REFERENCES "users"("id"),
  "actor_role"  "UserRole",
  "target_id"   UUID,
  "metadata"    JSONB,
  "occurred_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_log_actor_id    ON "audit_log"("actor_id");
CREATE INDEX idx_audit_log_event_type  ON "audit_log"("event_type");
CREATE INDEX idx_audit_log_occurred_at ON "audit_log"("occurred_at");

-- ─── DB ROLES ────────────────────────────────────────────────
-- The application uses a single connection user (the DATABASE_URL user)
-- but sets session variables per request for RLS evaluation.
-- These roles are referenced in policies; the app role needs BYPASSRLS
-- disabled so policies are always enforced.

-- ─── ROW-LEVEL SECURITY ──────────────────────────────────────

-- projects
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" FORCE ROW LEVEL SECURITY;

CREATE POLICY projects_bd_isolation ON "projects"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_user_role', TRUE) = 'BD_AGENT'
    AND "bd_agent_id"::text = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY projects_engineer_isolation ON "projects"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_user_role', TRUE) IN ('ESTIMATION_ENGINEER','DESIGN_ENGINEER')
    AND "assigned_to"::text = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY projects_admin_all ON "projects"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_user_role', TRUE) = 'ADMIN'
  );

-- project_files
ALTER TABLE "project_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_files" FORCE ROW LEVEL SECURITY;

CREATE POLICY project_files_bd_isolation ON "project_files"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_user_role', TRUE) = 'BD_AGENT'
    AND "project_id" IN (
      SELECT id FROM "projects"
      WHERE "bd_agent_id"::text = current_setting('app.current_user_id', TRUE)
    )
  );

CREATE POLICY project_files_engineer_isolation ON "project_files"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_user_role', TRUE) IN ('ESTIMATION_ENGINEER','DESIGN_ENGINEER')
    AND "project_id" IN (
      SELECT id FROM "projects"
      WHERE "assigned_to"::text = current_setting('app.current_user_id', TRUE)
    )
  );

CREATE POLICY project_files_admin_all ON "project_files"
  FOR ALL
  TO PUBLIC
  USING (current_setting('app.current_user_role', TRUE) = 'ADMIN');

-- deliverables
ALTER TABLE "deliverables" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deliverables" FORCE ROW LEVEL SECURITY;

CREATE POLICY deliverables_engineer_isolation ON "deliverables"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_user_role', TRUE) IN ('ESTIMATION_ENGINEER','DESIGN_ENGINEER')
    AND "engineer_id"::text = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY deliverables_admin_all ON "deliverables"
  FOR ALL
  TO PUBLIC
  USING (current_setting('app.current_user_role', TRUE) = 'ADMIN');

-- chat_messages
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_messages" FORCE ROW LEVEL SECURITY;

CREATE POLICY chat_messages_employee_isolation ON "chat_messages"
  AS RESTRICTIVE
  USING (
    current_setting('app.current_user_role', TRUE) IN ('BD_AGENT','ESTIMATION_ENGINEER','DESIGN_ENGINEER')
    AND "thread_id" IN (
      SELECT id FROM "chat_threads"
      WHERE "employee_id" = current_setting('app.current_user_id', TRUE)::UUID
    )
  );

CREATE POLICY chat_messages_admin_all ON "chat_messages"
  AS PERMISSIVE
  USING (current_setting('app.current_user_role', TRUE) = 'ADMIN');

-- notifications
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" FORCE ROW LEVEL SECURITY;

CREATE POLICY notifications_own_only ON "notifications"
  AS RESTRICTIVE
  USING (
    "user_id" = current_setting('app.current_user_id', TRUE)::UUID
  );

-- audit_log — no RLS needed; access is blocked at the API layer (Admin-only endpoint)
-- The app DB user has INSERT privilege only; SELECT is granted to admin queries via application

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON "projects"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

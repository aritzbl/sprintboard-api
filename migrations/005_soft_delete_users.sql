ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

DROP INDEX IF EXISTS "IDX_users_role_display_name";

CREATE INDEX IF NOT EXISTS "IDX_users_role_display_name"
  ON users (role, "displayName")
  WHERE deleted_at IS NULL;

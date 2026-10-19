-- Per-project role of a member (nullable, as in ProjectMemberOrmEntity).
-- The entity had this column but no migration: production only got it because
-- DB_SYNCHRONIZE=false was being read as true. Idempotent, safe to re-run.
ALTER TABLE project_members
  ADD COLUMN IF NOT EXISTS role VARCHAR(20);

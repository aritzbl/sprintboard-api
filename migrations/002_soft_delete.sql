-- Run once in Neon before deploying the soft-delete feature with
-- DB_SYNCHRONIZE=false. Existing records stay active (deleted_at = NULL).
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE epics ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects (deleted_at);
CREATE INDEX IF NOT EXISTS idx_tickets_deleted_at ON tickets (deleted_at);
CREATE INDEX IF NOT EXISTS idx_epics_deleted_at ON epics (deleted_at);
CREATE INDEX IF NOT EXISTS idx_sprints_deleted_at ON sprints (deleted_at);
CREATE INDEX IF NOT EXISTS idx_project_members_deleted_at ON project_members (deleted_at);

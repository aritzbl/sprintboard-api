-- Query indexes for the most frequently opened workspace views.
-- All project-scoped indexes ignore logically deleted rows.

CREATE INDEX IF NOT EXISTS "IDX_projects_active_created_at"
  ON projects ("createdAt")
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS "IDX_epics_active_project_created_at"
  ON epics (project_id, "createdAt")
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS "IDX_sprints_active_project_status_created_at"
  ON sprints (project_id, status, "createdAt")
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS "IDX_project_members_active_project_created_at"
  ON project_members ("projectId", "createdAt")
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS "IDX_users_role_display_name"
  ON users (role, "displayName");

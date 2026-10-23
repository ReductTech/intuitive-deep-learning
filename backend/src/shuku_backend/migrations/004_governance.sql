ALTER TABLE shuku_business.courses ADD COLUMN deleting boolean NOT NULL DEFAULT false;
ALTER TABLE shuku_business.courses ADD COLUMN hidden_from text CHECK(hidden_from IN ('draft','published'));
ALTER TABLE shuku_business.workspaces ADD COLUMN deleted_at double precision;
ALTER TABLE shuku_business.workspaces DROP CONSTRAINT workspaces_target_course_id_owner_id_base_release_id_key;
CREATE UNIQUE INDEX active_workspace_base ON shuku_business.workspaces(target_course_id,owner_id,base_release_id) WHERE deleted_at IS NULL;
ALTER TABLE shuku_business.contributions ALTER COLUMN revision_id DROP NOT NULL;
ALTER TABLE shuku_business.contributions DROP CONSTRAINT contributions_revision_id_fkey;
ALTER TABLE shuku_business.contributions ADD FOREIGN KEY(revision_id) REFERENCES shuku_business.revisions(id) ON DELETE SET NULL;
CREATE TABLE shuku_business.removals (
 id uuid PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('course','workspace')),
 resource_id uuid NOT NULL, requested_by uuid NOT NULL REFERENCES shuku_business.users(id),
 title text NOT NULL, resource_ids jsonb NOT NULL,
 state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','cleaning','succeeded')),
 task_id uuid NOT NULL UNIQUE REFERENCES shuku_business.tasks(id),
 created_at double precision NOT NULL, finished_at double precision,
 UNIQUE(kind,resource_id)
);
CREATE TABLE shuku_business.removal_objects (
 removal_id uuid NOT NULL REFERENCES shuku_business.removals(id),
 sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
 result text CHECK(result IN ('removed','shared')),
 PRIMARY KEY(removal_id,sha256)
);

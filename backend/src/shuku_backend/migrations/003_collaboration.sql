CREATE TABLE shuku_business.workspaces (
 id uuid PRIMARY KEY REFERENCES shuku_business.courses(id),
 target_course_id uuid NOT NULL REFERENCES shuku_business.courses(id),
 owner_id uuid NOT NULL REFERENCES shuku_business.users(id),
 base_release_id uuid NOT NULL REFERENCES shuku_business.releases(id),
 created_at double precision NOT NULL,
 UNIQUE(target_course_id,owner_id,base_release_id), CHECK(id<>target_course_id)
);
CREATE TABLE shuku_business.contributions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES shuku_business.workspaces(id),
 target_course_id uuid NOT NULL REFERENCES shuku_business.courses(id),
 revision_id uuid NOT NULL UNIQUE REFERENCES shuku_business.revisions(id),
 target_head uuid NOT NULL REFERENCES shuku_business.revisions(id),
 artifact_hash text NOT NULL, summary text NOT NULL,
 status text NOT NULL CHECK(status IN ('pending','approved','rejected','superseded','merging','merged')),
 score integer CHECK(score BETWEEN 0 AND 10), note text NOT NULL DEFAULT '',
 reviewer_id uuid REFERENCES shuku_business.users(id), decided_at double precision,
 merger_id uuid REFERENCES shuku_business.users(id),
 merged_revision uuid UNIQUE REFERENCES shuku_business.revisions(id),
 created_at double precision NOT NULL, merged_at double precision
);
CREATE INDEX contribution_target ON shuku_business.contributions(target_course_id,status);
CREATE INDEX workspace_owner ON shuku_business.workspaces(owner_id,created_at);

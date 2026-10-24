CREATE TABLE shuku_business.github_repositories (
 course_id uuid PRIMARY KEY REFERENCES shuku_business.courses ON DELETE CASCADE,
 installation_id bigint NOT NULL CHECK(installation_id>0),
 repository_id bigint UNIQUE NOT NULL CHECK(repository_id>0),
 owner text NOT NULL, name text NOT NULL, default_branch text NOT NULL,
 initial_sha text NOT NULL, allow_destroy boolean NOT NULL DEFAULT false,
 created_at double precision NOT NULL
);
CREATE TABLE shuku_business.github_revisions (
 revision_id uuid PRIMARY KEY REFERENCES shuku_business.revisions ON DELETE CASCADE,
 course_id uuid NOT NULL REFERENCES shuku_business.github_repositories ON DELETE CASCADE,
 base_sha text NOT NULL, branch text NOT NULL, commit_sha text,
 pr_number bigint, merge_sha text, release_id bigint, release_version text, release_note text
);
CREATE TABLE shuku_business.github_jobs (
 id uuid PRIMARY KEY, course_id uuid NOT NULL REFERENCES shuku_business.github_repositories ON DELETE CASCADE,
 kind text NOT NULL, subject text NOT NULL, payload jsonb NOT NULL,
 task_id uuid UNIQUE NOT NULL REFERENCES shuku_business.tasks,
 requested_by uuid NOT NULL REFERENCES shuku_business.users,
 created_at double precision NOT NULL, UNIQUE(course_id,kind,subject)
);
CREATE TABLE shuku_business.github_deliveries (
 delivery_id uuid PRIMARY KEY, digest text NOT NULL, event text NOT NULL,
 course_id uuid REFERENCES shuku_business.github_repositories ON DELETE CASCADE,
 received_at double precision NOT NULL
);
CREATE TABLE shuku_business.github_external_prs (
 course_id uuid NOT NULL REFERENCES shuku_business.github_repositories ON DELETE CASCADE,
 number bigint NOT NULL, head_sha text NOT NULL, base_sha text NOT NULL,
 title text NOT NULL, author text NOT NULL, state text NOT NULL,
 review_state text NOT NULL DEFAULT 'pending', reviewer_id uuid REFERENCES shuku_business.users,
 approved_sha text, merge_sha text, updated_at double precision NOT NULL,
 PRIMARY KEY(course_id,number)
);
CREATE INDEX github_jobs_course_time ON shuku_business.github_jobs(course_id,created_at DESC);
ALTER TABLE shuku_business.feedback ADD COLUMN github_number bigint;
ALTER TABLE shuku_business.feedback ADD COLUMN github_state text;
ALTER TABLE shuku_business.messages ALTER COLUMN feedback_id DROP NOT NULL;
ALTER TABLE shuku_business.messages ADD COLUMN course_id uuid REFERENCES shuku_business.courses ON DELETE CASCADE;
ALTER TABLE shuku_business.messages DROP CONSTRAINT messages_kind_check;
ALTER TABLE shuku_business.messages ADD CONSTRAINT messages_kind_check CHECK(kind IN ('feedback_received','feedback_updated','github_pr'));

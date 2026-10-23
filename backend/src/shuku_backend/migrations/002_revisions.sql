CREATE TABLE shuku_business.revisions (
 id uuid PRIMARY KEY, course_id uuid NOT NULL REFERENCES shuku_business.courses(id),
 author_id uuid NOT NULL REFERENCES shuku_business.users(id), source_hash text NOT NULL,
 state text NOT NULL CHECK(state IN ('building','ready','failed')),
 files jsonb NOT NULL, artifact_hash text, created_at double precision NOT NULL
);
ALTER TABLE shuku_business.courses ADD COLUMN head_revision uuid REFERENCES shuku_business.revisions(id);
CREATE TABLE shuku_business.reviews (
 id uuid PRIMARY KEY, revision_id uuid NOT NULL UNIQUE REFERENCES shuku_business.revisions(id),
 course_id uuid NOT NULL REFERENCES shuku_business.courses(id),
 status text NOT NULL CHECK(status IN ('pending','approved','rejected','superseded','published')),
 note text NOT NULL DEFAULT '', reviewer_id uuid REFERENCES shuku_business.users(id),
 artifact_hash text NOT NULL, created_at double precision NOT NULL, decided_at double precision
);
CREATE TABLE shuku_business.releases (
 id uuid PRIMARY KEY, course_id uuid NOT NULL REFERENCES shuku_business.courses(id),
 revision_id uuid NOT NULL UNIQUE REFERENCES shuku_business.revisions(id), version text NOT NULL,
 note text NOT NULL, publisher_id uuid NOT NULL REFERENCES shuku_business.users(id),
 created_at double precision NOT NULL, UNIQUE(course_id,version)
);
ALTER TABLE shuku_business.courses ADD COLUMN current_release uuid REFERENCES shuku_business.releases(id);
CREATE INDEX revision_course ON shuku_business.revisions(course_id,created_at);

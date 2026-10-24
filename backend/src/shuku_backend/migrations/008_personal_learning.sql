CREATE TABLE shuku_business.favorites (
 user_id uuid NOT NULL REFERENCES shuku_business.users(id) ON DELETE CASCADE,
 resource text NOT NULL, course_id uuid REFERENCES shuku_business.courses(id) ON DELETE CASCADE,
 created_at double precision NOT NULL, PRIMARY KEY(user_id,resource)
);
CREATE TABLE shuku_business.learning_states (
 user_id uuid NOT NULL REFERENCES shuku_business.users(id) ON DELETE CASCADE,
 resource text NOT NULL, version text NOT NULL,
 course_id uuid REFERENCES shuku_business.courses(id) ON DELETE CASCADE,
 revision_id uuid REFERENCES shuku_business.revisions(id) ON DELETE CASCADE,
 page_id text NOT NULL, mode text NOT NULL CHECK(mode IN ('guide','ppt')),
 completed jsonb NOT NULL DEFAULT '[]', state_version integer NOT NULL CHECK(state_version>0),
 updated_at double precision NOT NULL, PRIMARY KEY(user_id,resource,version)
);
CREATE INDEX learning_recent ON shuku_business.learning_states(user_id,updated_at DESC,resource,version);

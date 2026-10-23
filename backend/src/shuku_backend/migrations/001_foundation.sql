CREATE TABLE shuku_business.users (
 id uuid PRIMARY KEY, username text NOT NULL UNIQUE, display_name text NOT NULL,
 role text NOT NULL CHECK(role IN ('learner','creator','admin')),
 active boolean NOT NULL DEFAULT true
);
CREATE TABLE shuku_business.sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES shuku_business.users(id),
 expires_at double precision NOT NULL
);
CREATE INDEX sessions_expiry ON shuku_business.sessions(expires_at);
CREATE TABLE shuku_business.login_attempts (
 peer_key text PRIMARY KEY, failures integer NOT NULL DEFAULT 0,
 until_at double precision NOT NULL
);
CREATE TABLE shuku_business.courses (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES shuku_business.users(id),
 module_id uuid NOT NULL, title text NOT NULL, description text NOT NULL DEFAULT '',
 category text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','hidden')),
 created_at double precision NOT NULL
);
CREATE INDEX courses_owner ON shuku_business.courses(owner_id);
CREATE TABLE shuku_business.course_managers (
 course_id uuid NOT NULL REFERENCES shuku_business.courses(id),
 user_id uuid NOT NULL REFERENCES shuku_business.users(id), PRIMARY KEY(course_id,user_id)
);
CREATE TABLE shuku_business.audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid REFERENCES shuku_business.users(id), action text NOT NULL,
 object_id text NOT NULL, created_at double precision NOT NULL
);
CREATE TABLE shuku_business.tasks (
 id uuid PRIMARY KEY, kind text NOT NULL, resource_key text NOT NULL,
 idempotency_key text NOT NULL UNIQUE, request_hash text NOT NULL,
 payload jsonb NOT NULL, status text NOT NULL DEFAULT 'queued'
 CHECK(status IN ('queued','running','succeeded','failed')),
 attempts integer NOT NULL DEFAULT 0, max_attempts integer NOT NULL DEFAULT 3,
 available_at double precision NOT NULL, lease_until double precision,
 lease_token uuid, checkpoint jsonb NOT NULL DEFAULT '{}',
 result jsonb, error_code text, created_at double precision NOT NULL
);
CREATE INDEX task_claim ON shuku_business.tasks(status,available_at);
CREATE TABLE shuku_business.task_leases (
 resource_key text PRIMARY KEY, task_id uuid NOT NULL REFERENCES shuku_business.tasks(id),
 lease_token uuid NOT NULL, expires_at double precision NOT NULL
);

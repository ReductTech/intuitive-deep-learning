CREATE TABLE shuku_business.github_identities (
 user_id uuid PRIMARY KEY REFERENCES shuku_business.users ON DELETE CASCADE,
 client_id text NOT NULL, github_id bigint NOT NULL CHECK(github_id>0),
 login text NOT NULL, credentials text NOT NULL, expires_at double precision,
 verified_at double precision NOT NULL, granted_creator boolean NOT NULL DEFAULT false,
 UNIQUE(client_id,github_id)
);
CREATE TABLE shuku_business.github_identity_flows (
 user_id uuid PRIMARY KEY REFERENCES shuku_business.users ON DELETE CASCADE,
 flow_id uuid NOT NULL, client_id text NOT NULL, device text NOT NULL,
 user_code text NOT NULL, expires_at double precision NOT NULL,
 next_poll double precision NOT NULL, interval_seconds integer NOT NULL CHECK(interval_seconds>=5),
 created_at double precision NOT NULL, pending_credentials text,
 previous_id bigint, completed boolean NOT NULL DEFAULT false
);

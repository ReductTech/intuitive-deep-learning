CREATE TABLE shuku_business.feedback (
 id uuid PRIMARY KEY, release_id uuid NOT NULL REFERENCES shuku_business.releases(id) ON DELETE CASCADE,
 reporter_id uuid NOT NULL REFERENCES shuku_business.users(id),
 request_key uuid NOT NULL, request_hash text NOT NULL,
 message text NOT NULL, location text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved','dismissed')),
 reply text NOT NULL DEFAULT '', status_version integer NOT NULL DEFAULT 0,
 handler_id uuid REFERENCES shuku_business.users(id),
 created_at double precision NOT NULL, updated_at double precision NOT NULL,
 UNIQUE(reporter_id,request_key)
);
CREATE INDEX feedback_release ON shuku_business.feedback(release_id,created_at);
CREATE INDEX feedback_reporter ON shuku_business.feedback(reporter_id,created_at);
CREATE TABLE shuku_business.messages (
 id uuid PRIMARY KEY, recipient_id uuid NOT NULL REFERENCES shuku_business.users(id),
 feedback_id uuid NOT NULL REFERENCES shuku_business.feedback(id) ON DELETE CASCADE,
 event_key text NOT NULL, kind text NOT NULL CHECK(kind IN ('feedback_received','feedback_updated')),
 title text NOT NULL, summary text NOT NULL,
 created_at double precision NOT NULL, read_at double precision,
 UNIQUE(recipient_id,event_key)
);
CREATE INDEX messages_recipient_order ON shuku_business.messages(recipient_id,created_at DESC,id DESC);
CREATE INDEX messages_unread ON shuku_business.messages(recipient_id) WHERE read_at IS NULL;

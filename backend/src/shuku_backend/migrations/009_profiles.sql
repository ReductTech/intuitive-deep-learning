CREATE TABLE shuku_business.profiles (
 user_id uuid PRIMARY KEY REFERENCES shuku_business.users(id) ON DELETE CASCADE,
 bio text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '',
 updated_at double precision NOT NULL
);

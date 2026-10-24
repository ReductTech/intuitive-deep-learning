ALTER TABLE shuku_business.github_revisions ADD COLUMN external boolean NOT NULL DEFAULT false;
ALTER TABLE shuku_business.github_external_prs ADD COLUMN local_revision_id uuid REFERENCES shuku_business.revisions ON DELETE SET NULL;

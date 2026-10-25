"""MySQL 8.0.16+ schema, managed with SQLAlchemy Core; all names are scoped to shuku_."""
from sqlalchemy import (MetaData, Table, Column, String, Text, CHAR, Integer, BigInteger, Boolean, Double, JSON, ForeignKey, CheckConstraint, UniqueConstraint, Index, Computed, text)
metadata = MetaData(naming_convention={"pk":"pk_%(table_name)s", "uq":"uq_%(table_name)s_%(column_0_name)s", "ck":"ck_%(table_name)s_%(constraint_name)s"})

def table(name, *items):
    return Table("shuku_"+name, metadata, *items, mysql_engine="InnoDB", mysql_charset="utf8mb4", mysql_collate="utf8mb4_bin")

users = table('users',
    Column('id', CHAR(36), primary_key=True),
    Column('username', String(100), nullable=False, unique=True),
    Column('display_name', Text(), nullable=False),
    Column('role', String(20), nullable=False),
    Column('active', Boolean(), nullable=False, server_default=text('true')),
    CheckConstraint("role IN ('learner','creator','admin')", name="rule_1")
)

sessions = table('sessions',
    Column('token_hash', String(64), primary_key=True),
    Column('user_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_sessions_user_id"), nullable=False),
    Column('expires_at', Double(), nullable=False)
)

login_attempts = table('login_attempts',
    Column('peer_key', String(128), primary_key=True),
    Column('failures', Integer(), nullable=False, server_default=text('0')),
    Column('until_at', Double(), nullable=False)
)

courses = table('courses',
    Column('id', CHAR(36), primary_key=True),
    Column('owner_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_courses_owner_id"), nullable=False),
    Column('module_id', CHAR(36), nullable=False),
    Column('title', Text(), nullable=False),
    Column('description', Text(), nullable=False, server_default=text("('')")),
    Column('category', Text(), nullable=False, server_default=text("('')")),
    Column('status', String(30), nullable=False, server_default=text("'draft'")),
    Column('created_at', Double(), nullable=False),
    Column('head_revision', CHAR(36), ForeignKey("shuku_revisions.id", ondelete="RESTRICT", use_alter=True, name="fk_courses_head_revision"), nullable=True),
    Column('current_release', CHAR(36), ForeignKey("shuku_releases.id", ondelete="RESTRICT", use_alter=True, name="fk_courses_current_release"), nullable=True),
    Column('deleting', Boolean(), nullable=False, server_default=text('false')),
    Column('hidden_from', String(20), nullable=True),
    CheckConstraint("status IN ('draft','published','hidden')", name="rule_1"),
    CheckConstraint("hidden_from IN ('draft','published')", name="rule_2")
)

course_managers = table('course_managers',
    Column('course_id', CHAR(36), ForeignKey("shuku_courses.id", ondelete="RESTRICT", use_alter=True, name="fk_course_managers_course_id"), primary_key=True),
    Column('user_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_course_managers_user_id"), primary_key=True)
)

audit = table('audit',
    Column('id', BigInteger(), primary_key=True, autoincrement=True),
    Column('user_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_audit_user_id"), nullable=True),
    Column('action', String(100), nullable=False),
    Column('object_id', String(255), nullable=False),
    Column('created_at', Double(), nullable=False)
)

tasks = table('tasks',
    Column('id', CHAR(36), primary_key=True),
    Column('kind', String(80), nullable=False),
    Column('resource_key', String(255), nullable=False),
    Column('idempotency_key', String(255), nullable=False, unique=True),
    Column('request_hash', String(64), nullable=False),
    Column('payload', JSON(), nullable=False),
    Column('status', String(30), nullable=False, server_default=text("'queued'")),
    Column('attempts', Integer(), nullable=False, server_default=text('0')),
    Column('max_attempts', Integer(), nullable=False, server_default=text('3')),
    Column('available_at', Double(), nullable=False),
    Column('lease_until', Double(), nullable=True),
    Column('lease_token', CHAR(36), nullable=True),
    Column('checkpoint', JSON(), nullable=False, server_default=text("('{}')")),
    Column('result', JSON(), nullable=True),
    Column('error_code', String(100), nullable=True),
    Column('created_at', Double(), nullable=False),
    CheckConstraint("status IN ('queued','running','succeeded','failed')", name="rule_1")
)

task_leases = table('task_leases',
    Column('resource_key', String(255), primary_key=True),
    Column('task_id', CHAR(36), ForeignKey("shuku_tasks.id", ondelete="RESTRICT", use_alter=True, name="fk_task_leases_task_id"), nullable=False),
    Column('lease_token', CHAR(36), nullable=False),
    Column('expires_at', Double(), nullable=False)
)

revisions = table('revisions',
    Column('id', CHAR(36), primary_key=True),
    Column('course_id', CHAR(36), ForeignKey("shuku_courses.id", ondelete="RESTRICT", use_alter=True, name="fk_revisions_course_id"), nullable=False),
    Column('author_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_revisions_author_id"), nullable=False),
    Column('source_hash', String(64), nullable=False),
    Column('state', String(30), nullable=False),
    Column('files', JSON(), nullable=False),
    Column('artifact_hash', String(64), nullable=True),
    Column('created_at', Double(), nullable=False),
    CheckConstraint("state IN ('building','ready','failed')", name="rule_1")
)

reviews = table('reviews',
    Column('id', CHAR(36), primary_key=True),
    Column('revision_id', CHAR(36), ForeignKey("shuku_revisions.id", ondelete="RESTRICT", use_alter=True, name="fk_reviews_revision_id"), nullable=False, unique=True),
    Column('course_id', CHAR(36), ForeignKey("shuku_courses.id", ondelete="RESTRICT", use_alter=True, name="fk_reviews_course_id"), nullable=False),
    Column('status', String(30), nullable=False),
    Column('note', Text(), nullable=False, server_default=text("('')")),
    Column('reviewer_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_reviews_reviewer_id"), nullable=True),
    Column('artifact_hash', String(64), nullable=False),
    Column('created_at', Double(), nullable=False),
    Column('decided_at', Double(), nullable=True),
    CheckConstraint("status IN ('pending','approved','rejected','superseded','published')", name="rule_1")
)

releases = table('releases',
    Column('id', CHAR(36), primary_key=True),
    Column('course_id', CHAR(36), ForeignKey("shuku_courses.id", ondelete="RESTRICT", use_alter=True, name="fk_releases_course_id"), nullable=False),
    Column('revision_id', CHAR(36), ForeignKey("shuku_revisions.id", ondelete="RESTRICT", use_alter=True, name="fk_releases_revision_id"), nullable=False, unique=True),
    Column('version', String(100), nullable=False),
    Column('note', Text(), nullable=False),
    Column('publisher_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_releases_publisher_id"), nullable=False),
    Column('created_at', Double(), nullable=False),
    UniqueConstraint('course_id', 'version')
)

workspaces = table('workspaces',
    Column('id', CHAR(36), ForeignKey("shuku_courses.id", ondelete="RESTRICT", use_alter=True, name="fk_workspaces_id"), primary_key=True),
    Column('target_course_id', CHAR(36), ForeignKey("shuku_courses.id", ondelete="RESTRICT", use_alter=True, name="fk_workspaces_target_course_id"), nullable=False),
    Column('owner_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_workspaces_owner_id"), nullable=False),
    Column('base_release_id', CHAR(36), ForeignKey("shuku_releases.id", ondelete="RESTRICT", use_alter=True, name="fk_workspaces_base_release_id"), nullable=False),
    Column('created_at', Double(), nullable=False),
    Column('deleted_at', Double(), nullable=True),
    Column("active_base", Integer(), Computed("CASE WHEN deleted_at IS NULL THEN 1 ELSE NULL END", persisted=True)),
    CheckConstraint('id<>target_course_id', name="rule_1"),
    UniqueConstraint("target_course_id", "owner_id", "base_release_id", "active_base", name="active_workspace_base")
)

contributions = table('contributions',
    Column('id', CHAR(36), primary_key=True),
    Column('workspace_id', CHAR(36), ForeignKey("shuku_workspaces.id", ondelete="RESTRICT", use_alter=True, name="fk_contributions_workspace_id"), nullable=False),
    Column('target_course_id', CHAR(36), ForeignKey("shuku_courses.id", ondelete="RESTRICT", use_alter=True, name="fk_contributions_target_course_id"), nullable=False),
    Column('revision_id', CHAR(36), ForeignKey("shuku_revisions.id", ondelete="SET NULL", use_alter=True, name="fk_contributions_revision_id"), nullable=True, unique=True),
    Column('target_head', CHAR(36), ForeignKey("shuku_revisions.id", ondelete="RESTRICT", use_alter=True, name="fk_contributions_target_head"), nullable=False),
    Column('artifact_hash', String(64), nullable=False),
    Column('summary', Text(), nullable=False),
    Column('status', String(30), nullable=False),
    Column('score', Integer(), nullable=True),
    Column('note', Text(), nullable=False, server_default=text("('')")),
    Column('reviewer_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_contributions_reviewer_id"), nullable=True),
    Column('decided_at', Double(), nullable=True),
    Column('merger_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_contributions_merger_id"), nullable=True),
    Column('merged_revision', CHAR(36), ForeignKey("shuku_revisions.id", ondelete="RESTRICT", use_alter=True, name="fk_contributions_merged_revision"), nullable=True, unique=True),
    Column('created_at', Double(), nullable=False),
    Column('merged_at', Double(), nullable=True),
    CheckConstraint("status IN ('pending','approved','rejected','superseded','merging','merged')", name="rule_1"),
    CheckConstraint('score BETWEEN 0 AND 10', name="rule_2")
)

removals = table('removals',
    Column('id', CHAR(36), primary_key=True),
    Column('kind', String(80), nullable=False),
    Column('resource_id', CHAR(36), nullable=False),
    Column('requested_by', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_removals_requested_by"), nullable=False),
    Column('title', Text(), nullable=False),
    Column('resource_ids', JSON(), nullable=False),
    Column('state', String(30), nullable=False, server_default=text("'queued'")),
    Column('task_id', CHAR(36), ForeignKey("shuku_tasks.id", ondelete="RESTRICT", use_alter=True, name="fk_removals_task_id"), nullable=False, unique=True),
    Column('created_at', Double(), nullable=False),
    Column('finished_at', Double(), nullable=True),
    CheckConstraint("kind IN ('course','workspace')", name="rule_1"),
    CheckConstraint("state IN ('queued','cleaning','succeeded')", name="rule_2"),
    UniqueConstraint('kind', 'resource_id')
)

removal_objects = table('removal_objects',
    Column('removal_id', CHAR(36), ForeignKey("shuku_removals.id", ondelete="RESTRICT", use_alter=True, name="fk_removal_objects_removal_id"), primary_key=True),
    Column('sha256', String(64), primary_key=True),
    Column('result', String(20), nullable=True),
    CheckConstraint("sha256 REGEXP '^[a-f0-9]{64}$'", name="rule_1"),
    CheckConstraint("result IN ('removed','shared')", name="rule_2")
)

feedback = table('feedback',
    Column('id', CHAR(36), primary_key=True),
    Column('release_id', CHAR(36), ForeignKey("shuku_releases.id", ondelete="CASCADE", use_alter=True, name="fk_feedback_release_id"), nullable=False),
    Column('reporter_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_feedback_reporter_id"), nullable=False),
    Column('request_key', CHAR(36), nullable=False),
    Column('request_hash', String(64), nullable=False),
    Column('message', Text(), nullable=False),
    Column('location', Text(), nullable=False, server_default=text("('')")),
    Column('status', String(30), nullable=False, server_default=text("'open'")),
    Column('reply', Text(), nullable=False, server_default=text("('')")),
    Column('status_version', Integer(), nullable=False, server_default=text('0')),
    Column('handler_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_feedback_handler_id"), nullable=True),
    Column('created_at', Double(), nullable=False),
    Column('updated_at', Double(), nullable=False),
    Column('github_number', BigInteger(), nullable=True),
    Column('github_state', Text(), nullable=True),
    CheckConstraint("status IN ('open','in_progress','resolved','dismissed')", name="rule_1"),
    UniqueConstraint('reporter_id', 'request_key')
)

messages = table('messages',
    Column('id', CHAR(36), primary_key=True),
    Column('recipient_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_messages_recipient_id"), nullable=False),
    Column('feedback_id', CHAR(36), ForeignKey("shuku_feedback.id", ondelete="CASCADE", use_alter=True, name="fk_messages_feedback_id"), nullable=True),
    Column('event_key', String(512), nullable=False),
    Column('kind', String(80), nullable=False),
    Column('title', Text(), nullable=False),
    Column('summary', Text(), nullable=False),
    Column('created_at', Double(), nullable=False),
    Column('read_at', Double(), nullable=True),
    Column('course_id', CHAR(36), ForeignKey("shuku_courses.id", ondelete="CASCADE", use_alter=True, name="fk_messages_course_id"), nullable=True),
    CheckConstraint("kind IN ('feedback_received','feedback_updated','github_pr')", name="rule_1"),
    UniqueConstraint('recipient_id', 'event_key')
)

github_repositories = table('github_repositories',
    Column('course_id', CHAR(36), ForeignKey("shuku_courses.id", ondelete="CASCADE", use_alter=True, name="fk_github_repositories_course_id"), primary_key=True),
    Column('installation_id', BigInteger(), nullable=False),
    Column('repository_id', BigInteger(), nullable=False, unique=True),
    Column('owner', String(100), nullable=False),
    Column('name', String(100), nullable=False),
    Column('default_branch', String(255), nullable=False),
    Column('initial_sha', String(64), nullable=False),
    Column('allow_destroy', Boolean(), nullable=False, server_default=text('false')),
    Column('created_at', Double(), nullable=False),
    CheckConstraint('installation_id>0', name="rule_1"),
    CheckConstraint('repository_id>0', name="rule_2")
)

github_revisions = table('github_revisions',
    Column('revision_id', CHAR(36), ForeignKey("shuku_revisions.id", ondelete="CASCADE", use_alter=True, name="fk_github_revisions_revision_id"), primary_key=True),
    Column('course_id', CHAR(36), ForeignKey("shuku_github_repositories.course_id", ondelete="CASCADE", use_alter=True, name="fk_github_revisions_course_id"), nullable=False),
    Column('base_sha', String(64), nullable=False),
    Column('branch', String(255), nullable=False),
    Column('commit_sha', String(64), nullable=True),
    Column('pr_number', BigInteger(), nullable=True),
    Column('merge_sha', String(64), nullable=True),
    Column('release_id', BigInteger(), nullable=True),
    Column('release_version', String(100), nullable=True),
    Column('release_note', Text(), nullable=True),
    Column('external', Boolean(), nullable=False, server_default=text('false'))
)

github_jobs = table('github_jobs',
    Column('id', CHAR(36), primary_key=True),
    Column('course_id', CHAR(36), ForeignKey("shuku_github_repositories.course_id", ondelete="CASCADE", use_alter=True, name="fk_github_jobs_course_id"), nullable=False),
    Column('kind', String(80), nullable=False),
    Column('subject', String(255), nullable=False),
    Column('payload', JSON(), nullable=False),
    Column('task_id', CHAR(36), ForeignKey("shuku_tasks.id", ondelete="RESTRICT", use_alter=True, name="fk_github_jobs_task_id"), nullable=False, unique=True),
    Column('requested_by', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_github_jobs_requested_by"), nullable=False),
    Column('created_at', Double(), nullable=False),
    UniqueConstraint('course_id', 'kind', 'subject')
)

github_deliveries = table('github_deliveries',
    Column('delivery_id', CHAR(36), primary_key=True),
    Column('digest', String(64), nullable=False),
    Column('event', String(80), nullable=False),
    Column('course_id', CHAR(36), ForeignKey("shuku_github_repositories.course_id", ondelete="CASCADE", use_alter=True, name="fk_github_deliveries_course_id"), nullable=True),
    Column('received_at', Double(), nullable=False)
)

github_external_prs = table('github_external_prs',
    Column('course_id', CHAR(36), ForeignKey("shuku_github_repositories.course_id", ondelete="CASCADE", use_alter=True, name="fk_github_external_prs_course_id"), primary_key=True),
    Column('number', BigInteger(), primary_key=True),
    Column('head_sha', String(64), nullable=False),
    Column('base_sha', String(64), nullable=False),
    Column('title', Text(), nullable=False),
    Column('author', String(100), nullable=False),
    Column('state', String(30), nullable=False),
    Column('review_state', String(30), nullable=False, server_default=text("'pending'")),
    Column('reviewer_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="RESTRICT", use_alter=True, name="fk_github_external_prs_reviewer_id"), nullable=True),
    Column('approved_sha', String(64), nullable=True),
    Column('merge_sha', String(64), nullable=True),
    Column('updated_at', Double(), nullable=False),
    Column('local_revision_id', CHAR(36), ForeignKey("shuku_revisions.id", ondelete="SET NULL", use_alter=True, name="fk_github_external_prs_local_revision_id"), nullable=True)
)

favorites = table('favorites',
    Column('user_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="CASCADE", use_alter=True, name="fk_favorites_user_id"), primary_key=True),
    Column('resource', String(120), primary_key=True),
    Column('course_id', CHAR(36), ForeignKey("shuku_courses.id", ondelete="CASCADE", use_alter=True, name="fk_favorites_course_id"), nullable=True),
    Column('created_at', Double(), nullable=False)
)

learning_states = table('learning_states',
    Column('user_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="CASCADE", use_alter=True, name="fk_learning_states_user_id"), primary_key=True),
    Column('resource', String(120), primary_key=True),
    Column('version', String(100), primary_key=True),
    Column('course_id', CHAR(36), ForeignKey("shuku_courses.id", ondelete="CASCADE", use_alter=True, name="fk_learning_states_course_id"), nullable=True),
    Column('revision_id', CHAR(36), ForeignKey("shuku_revisions.id", ondelete="CASCADE", use_alter=True, name="fk_learning_states_revision_id"), nullable=True),
    Column('page_id', String(255), nullable=False),
    Column('mode', String(10), nullable=False),
    Column('completed', JSON(), nullable=False, server_default=text("('[]')")),
    Column('state_version', Integer(), nullable=False),
    Column('updated_at', Double(), nullable=False),
    CheckConstraint("mode IN ('guide','ppt')", name="rule_1"),
    CheckConstraint('state_version>0', name="rule_2")
)

profiles = table('profiles',
    Column('user_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="CASCADE", use_alter=True, name="fk_profiles_user_id"), primary_key=True),
    Column('bio', Text(), nullable=False, server_default=text("('')")),
    Column('email', Text(), nullable=False, server_default=text("('')")),
    Column('updated_at', Double(), nullable=False)
)

github_identities = table('github_identities',
    Column('user_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="CASCADE", use_alter=True, name="fk_github_identities_user_id"), primary_key=True),
    Column('client_id', String(100), nullable=False),
    Column('github_id', BigInteger(), nullable=False),
    Column('login', String(100), nullable=False),
    Column('credentials', Text(), nullable=False),
    Column('expires_at', Double(), nullable=True),
    Column('verified_at', Double(), nullable=False),
    Column('granted_creator', Boolean(), nullable=False, server_default=text('false')),
    CheckConstraint('github_id>0', name="rule_1"),
    UniqueConstraint('client_id', 'github_id')
)

github_identity_flows = table('github_identity_flows',
    Column('user_id', CHAR(36), ForeignKey("shuku_users.id", ondelete="CASCADE", use_alter=True, name="fk_github_identity_flows_user_id"), primary_key=True),
    Column('flow_id', CHAR(36), nullable=False),
    Column('client_id', String(100), nullable=False),
    Column('device', Text(), nullable=False),
    Column('user_code', String(32), nullable=False),
    Column('expires_at', Double(), nullable=False),
    Column('next_poll', Double(), nullable=False),
    Column('interval_seconds', Integer(), nullable=False),
    Column('created_at', Double(), nullable=False),
    Column('pending_credentials', Text(), nullable=True),
    Column('previous_id', BigInteger(), nullable=True),
    Column('completed', Boolean(), nullable=False, server_default=text('false')),
    CheckConstraint('interval_seconds>=5', name="rule_1")
)

Index("sessions_expiry", sessions.c.expires_at)
Index("courses_owner", courses.c.owner_id)
Index("task_claim", tasks.c.status, tasks.c.available_at)
Index("revision_course", revisions.c.course_id, revisions.c.created_at)
Index("contribution_target", contributions.c.target_course_id, contributions.c.status)
Index("workspace_owner", workspaces.c.owner_id, workspaces.c.created_at)
Index("feedback_release", feedback.c.release_id, feedback.c.created_at)
Index("feedback_reporter", feedback.c.reporter_id, feedback.c.created_at)
Index("messages_recipient_order", messages.c.recipient_id, messages.c.created_at, messages.c.id)
Index("messages_unread", messages.c.recipient_id, messages.c.read_at)
Index("github_jobs_course_time", github_jobs.c.course_id, github_jobs.c.created_at)
Index("learning_recent", learning_states.c.user_id, learning_states.c.updated_at, learning_states.c.resource, learning_states.c.version)

schema_migrations = table("schema_migrations", Column("version", String(100), primary_key=True), Column("checksum", CHAR(64), nullable=False))
locks = table("locks", Column("name", String(100), primary_key=True))

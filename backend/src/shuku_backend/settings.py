from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit
import os


@dataclass(frozen=True)
class Settings:
    database_url: str = field(repr=False)
    bucket_dir: Path
    origin: str
    demo_password: str = field(repr=False)
    auth_provider: str = "demo"
    host: str = "127.0.0.1"
    port: int = 8010
    source_root: Path | None = None

    def __post_init__(self):
        if not self.database_url.startswith(("postgres://", "postgresql://")):
            raise ValueError("SHUKU_DATABASE_URL must be a PostgreSQL connection URL")
        parsed = urlsplit(self.origin)
        if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password or parsed.path not in ("", "/") or parsed.query or parsed.fragment:
            raise ValueError("SHUKU_PUBLIC_ORIGIN must be an HTTP(S) origin")
        if self.origin.endswith("/"):
            raise ValueError("SHUKU_PUBLIC_ORIGIN must not end in a slash")
        if self.auth_provider != "demo":
            raise ValueError("Jianlun authentication is not implemented; no automatic Demo fallback")
        if not self.demo_password or len(self.demo_password) > 256:
            raise ValueError("SHUKU_DEMO_PASSWORD must contain 1..256 characters")
        if not self.bucket_dir.is_absolute() or not 0 <= self.port <= 65535:
            raise ValueError("Use an absolute SHUKU_BUCKET_DIR and valid SHUKU_PORT")

    @classmethod
    def from_env(cls):
        return cls(database_url=os.environ["SHUKU_DATABASE_URL"],
                   bucket_dir=Path(os.environ["SHUKU_BUCKET_DIR"]),
                   origin=os.environ["SHUKU_PUBLIC_ORIGIN"],
                   demo_password=os.environ.get("SHUKU_DEMO_PASSWORD", ""),
                   auth_provider=os.environ.get("SHUKU_AUTH_PROVIDER", "demo"),
                   host=os.environ.get("SHUKU_HOST", "127.0.0.1"),
                   port=int(os.environ.get("SHUKU_PORT", "8010")),
                   source_root=Path(os.environ["SHUKU_SOURCE_ROOT"]).resolve() if os.environ.get("SHUKU_SOURCE_ROOT") else None)

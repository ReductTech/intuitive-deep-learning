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
    github_config_path: Path | None = field(default=None,repr=False)

    github_identity_config_path: Path | None = field(default=None,repr=False)
    github_token_key_path: Path | None = field(default=None,repr=False)
    course_root: Path | None = None

    def github_identity_config(self):
        path=self.github_identity_config_path or self.github_config_path
        if path is None:return None
        import json
        config=json.loads(path.read_text())
        return config if config.get("clientId") else None

    def github_config(self):
        if self.github_config_path is None:return None
        import json
        value=json.loads(self.github_config_path.read_text())
        if not all(value.get(k) for k in ('appId','privateKeyPath','webhookSecret')):
            raise ValueError('Incomplete GitHub App configuration')
        if not str(value['appId']).isdigit() or not Path(value['privateKeyPath']).is_absolute():
            raise ValueError('Invalid GitHub App configuration')
        return value

    def __post_init__(self):
        from .database import mysql_url
        mysql_url(self.database_url)
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
        if self.course_root is not None:
            import json
            if not self.course_root.is_absolute():raise ValueError('SHUKU_COURSE_ROOT must be absolute')
            manifest=json.loads((self.course_root/'course-library.json').read_text())
            if manifest.get('schema')!=1 or manifest.get('repository')!='reduct-shuku/intuitive-deep-learning' or not manifest.get('modules'):raise ValueError('Invalid independent course library')

    @classmethod
    def from_env(cls):
        return cls(database_url=os.environ["SHUKU_DATABASE_URL"],
                   bucket_dir=Path(os.environ["SHUKU_BUCKET_DIR"]),
                   origin=os.environ["SHUKU_PUBLIC_ORIGIN"],
                   demo_password=os.environ.get("SHUKU_DEMO_PASSWORD", ""),
                   auth_provider=os.environ.get("SHUKU_AUTH_PROVIDER", "demo"),
                   host=os.environ.get("SHUKU_HOST", "127.0.0.1"),
                   port=int(os.environ.get("SHUKU_PORT", "8010")),
                   source_root=Path(os.environ["SHUKU_SOURCE_ROOT"]).resolve() if os.environ.get("SHUKU_SOURCE_ROOT") else None,
                   github_config_path=Path(os.environ['SHUKU_GITHUB_CONFIG']).resolve() if os.environ.get('SHUKU_GITHUB_CONFIG') else None,
                   github_identity_config_path=Path(os.environ['SHUKU_GITHUB_IDENTITY_CONFIG']).resolve() if os.environ.get('SHUKU_GITHUB_IDENTITY_CONFIG') else None,
                   github_token_key_path=Path(os.environ['SHUKU_GITHUB_TOKEN_KEY']).resolve() if os.environ.get('SHUKU_GITHUB_TOKEN_KEY') else None,
                   course_root=Path(os.environ['SHUKU_COURSE_ROOT']).resolve() if os.environ.get('SHUKU_COURSE_ROOT') else None)

#!/usr/bin/env python3
"""Upload visualization assets to the configured OSS destination.

Reads: Local assets and configured credential environment variables.
Writes: Remote objects; existing objects are skipped unless --overwrite. --dry-run never contacts OSS.
"""

from __future__ import annotations


import sys
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import mimetypes
import os
import uuid
from pathlib import Path
from threading import local

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "common"))
from _common import ROOT, emit_result, report_error

OSS_KEY_ID = os.environ.get(
    "OSS_ACCESS_KEY_ID",
    os.environ.get("ALIBABA_CLOUD_ACCESS_KEY_ID", os.environ.get("OSS_KEY_ID", "")),
)
OSS_KEY_SECRET = os.environ.get(
    "OSS_ACCESS_KEY_SECRET",
    os.environ.get(
        "ALIBABA_CLOUD_ACCESS_KEY_SECRET", os.environ.get("OSS_KEY_SECRET", "")
    ),
)
OSS_ENDPOINT = "https://oss-cn-hangzhou.aliyuncs.com"
OSS_REGION = "cn-hangzhou"
OSS_BUCKET_NAME = "jianlun"
OSS_PREFIX = "cloud-IDL/assets/"
PUBLIC_BASE_URL = "https://image.reduct.cn/cloud-IDL/assets"
DEFAULT_ASSETS_DIR = ROOT / "assets"

mimetypes.add_type("model/gltf-binary", ".glb")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--assets-dir",
        type=Path,
        default=DEFAULT_ASSETS_DIR,
        help="local asset root; relative to cwd, default repository assets/",
    )
    parser.add_argument(
        "--module",
        help="upload only this module UUID while retaining its object-key prefix",
    )
    parser.add_argument(
        "--workers", type=int, default=8, help="parallel uploads (default: 8)"
    )
    parser.add_argument(
        "--overwrite", action="store_true", help="replace objects that already exist"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="show object keys without contacting OSS"
    )
    parser.add_argument(
        "--private-records",
        action="store_true",
        help="upload JSON playback records to private cloud-IDL/records objects",
    )
    return parser


def object_key(assets_dir: Path, path: Path, private_records: bool = False) -> str:
    prefix = "cloud-IDL/records/" if private_records else OSS_PREFIX
    return prefix + path.relative_to(assets_dir).as_posix()


def visualization_files(assets_dir: Path) -> list[Path]:
    """Datasets, model weights and runtime artifacts never belong in OSS."""
    excluded_directories = {"dataset", "datasets", "models", "digit-training"}
    excluded_extensions = {".pt", ".pth", ".onnx", ".idx1-ubyte", ".idx3-ubyte"}
    return sorted(
        path
        for path in assets_dir.rglob("*")
        if path.is_file()
        and not path.is_symlink()
        and not excluded_directories.intersection(
            path.relative_to(assets_dir).parts[:-1]
        )
        and path.suffix.lower() not in excluded_extensions
        and path.resolve().is_relative_to(assets_dir.resolve())
    )


def upload_one(
    bucket: object,
    assets_dir: Path,
    path: Path,
    overwrite: bool,
    private_records: bool = False,
) -> tuple[str, str]:
    key = object_key(assets_dir, path, private_records)
    if not overwrite and bucket.object_exists(key):
        return "skipped", key

    content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    headers = {"Content-Type": content_type}
    if private_records:
        if path.suffix.lower() != ".json":
            raise ValueError(
                "Private playback records must be JSON; datasets and weights are not uploaded."
            )
        headers["x-oss-object-acl"] = "private"
        headers["Cache-Control"] = "private, no-store"
    if not overwrite:
        headers["x-oss-forbid-overwrite"] = "true"
    bucket.put_object_from_file(key, str(path), headers=headers)
    return "uploaded", key


def upload_assets(args: argparse.Namespace) -> dict:
    """Upload selected files or return dry-run object keys without accessing OSS."""
    assets_dir = args.assets_dir.resolve()
    if not assets_dir.is_dir():
        raise ValueError(f"assets directory does not exist: {assets_dir}")
    if not 1 <= args.workers <= 32:
        raise ValueError("--workers must be between 1 and 32")

    files = visualization_files(assets_dir)
    if args.module:
        try:
            parsed_id = uuid.UUID(args.module)
        except ValueError:
            raise ValueError("--module must be a canonical lowercase UUID v4")
        if str(parsed_id) != args.module or parsed_id.version != 4:
            raise ValueError("--module must be a canonical lowercase UUID v4")
        files = [
            path
            for path in files
            if path.relative_to(assets_dir).parts[0] == args.module
        ]
    if args.private_records and any(path.suffix.lower() != ".json" for path in files):
        raise ValueError("--private-records accepts only JSON playback records")
    if not files:
        raise ValueError(f"no files found under {assets_dir}")
    print(f"Found {len(files)} files in {assets_dir}", file=sys.stderr)
    destination = f"oss://{OSS_BUCKET_NAME}/{'cloud-IDL/records/' if args.private_records else OSS_PREFIX}"
    print(f"Destination: {destination}", file=sys.stderr)

    if args.dry_run:
        return {
            "status": "dry-run",
            "destination": destination,
            "objects": [
                object_key(assets_dir, path, args.private_records) for path in files
            ],
        }

    try:
        import oss2
    except ImportError:
        raise RuntimeError(
            "oss2 is required: python -m pip install -r creator-skill/scripts/requirements.txt"
        )

    if not OSS_KEY_ID or not OSS_KEY_SECRET:
        raise RuntimeError(
            "Set OSS_ACCESS_KEY_ID and OSS_ACCESS_KEY_SECRET before uploading; --dry-run needs no credentials."
        )

    worker_state = local()

    def get_bucket() -> object:
        if not hasattr(worker_state, "bucket"):
            auth = oss2.AuthV4(OSS_KEY_ID, OSS_KEY_SECRET)
            worker_state.bucket = oss2.Bucket(
                auth, OSS_ENDPOINT, OSS_BUCKET_NAME, region=OSS_REGION
            )
        return worker_state.bucket

    def sync_path(path: Path) -> tuple[str, str]:
        return upload_one(
            get_bucket(), assets_dir, path, args.overwrite, args.private_records
        )

    uploaded = skipped = 0
    errors = []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(sync_path, path): path for path in files}
        for future in as_completed(futures):
            try:
                status, key = future.result()
            except Exception as exc:
                key = object_key(assets_dir, futures[future], args.private_records)
                errors.append({"key": key, "error": str(exc)})
                print(f"[failed] {key}: {exc}", file=sys.stderr)
                continue
            if status == "uploaded":
                uploaded += 1
            else:
                skipped += 1
            print(f"[{status}] {key}", file=sys.stderr)

    return {
        "status": "error" if errors else "ok",
        "destination": destination,
        "uploaded": uploaded,
        "skipped": skipped,
        "errors": errors,
        "publicUrlPrefix": None if args.private_records else PUBLIC_BASE_URL + "/",
    }


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        result = upload_assets(args)
        emit_result(result)
        return 2 if result.get("errors") else 0
    except (OSError, ValueError, RuntimeError, ImportError) as exc:
        return report_error(exc)


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Capture real 1600x900 术库 screenshots.

Reads: The selected module and requested browser states.
Writes: Evaluation PNGs in the module's _scratchpad/screenshots; thumbnails in
modules/<module>/assets/scenedeck-thumbnails only when requested. Owns its browser/Vite.
"""

from __future__ import annotations


import argparse
import io
import json
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from contextlib import contextmanager, nullcontext
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "common"))
from module_assets import asset_directory
from _common import emit_result, report_error, scratchpad_path
from idl_backend.config import repository_root

ROOT = repository_root()
MODULES = ROOT / "modules"
SLIDE_SIZE = (1600, 900)


PlaywrightError = RuntimeError


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--module", required=True, help="module directory, deck ID or UUID"
    )
    parser.add_argument("--slide", help="one slide ID; default all slides")
    parser.add_argument("--page-directory", help="semantic directory under pages/ for single-slide intermediate outputs")
    parser.add_argument(
        "--max-chars",
        type=int,
        help="explicit per-state non-whitespace character limit; omitted means count only",
    )
    parser.add_argument(
        "--surface",
        default=".ppt-slide-surface",
        help="slide surface CSS selector for geometry and text checks; default .ppt-slide-surface",
    )
    parser.add_argument(
        "--format",
        choices=["screenshots", "thumbnails", "both"],
        default="screenshots",
        help="screenshots: module _scratchpad; thumbnails: official assets; both: write both (default screenshots)",
    )
    parser.add_argument(
        "--state",
        default="default",
        help="state name; use a non-default state with --actions",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="image directory relative to cwd, within module _scratchpad (screenshots/both) or official thumbnail directory (thumbnails)",
    )
    parser.add_argument(
        "--base-url", help="running Vite URL; omit to start and stop a temporary Vite"
    )
    parser.add_argument(
        "--inspect",
        action="store_true",
        help="return actual slide IDs without writing screenshots",
    )
    parser.add_argument(
        "--actions",
        type=Path,
        help="JSON file mapping slide IDs to action arrays; relative to cwd",
    )
    parser.add_argument(
        "--settle-ms",
        type=int,
        default=2000,
        help="non-negative wait after actions, in milliseconds; default 2000",
    )
    return parser


def load_dependencies():
    global Image, PlaywrightError, sync_playwright
    try:
        from PIL import Image
        from playwright.sync_api import Error as PlaywrightError, sync_playwright
    except ImportError as exc:
        raise RuntimeError(
            "Install capture dependencies: python -m pip install -r creator-skill/scripts/requirements-capture.txt"
        ) from exc


def available_modules() -> list[tuple[Path, str, str]]:
    modules: list[tuple[Path, str, str]] = []
    for directory in MODULES.iterdir():
        outline = directory / "outlines.json"
        if not directory.is_dir() or not outline.is_file():
            continue
        metadata = json.loads(outline.read_text(encoding="utf-8"))
        if metadata.get("ppt", {}).get("entry"):
            asset_id = metadata.get("moduleIdentity", {}).get("id")
            if not asset_id:
                raise ValueError(f"Missing module UUID in {outline.relative_to(ROOT)}")
            modules.append(
                (directory, metadata.get("id", directory.name.lower()), asset_id)
            )
    return sorted(modules, key=lambda entry: entry[1])


def resolve_module(requested: str) -> tuple[Path, str, str]:
    for directory, deck_id, asset_id in available_modules():
        if requested.lower() in {deck_id.lower(), directory.name.lower(), asset_id}:
            return directory, deck_id, asset_id
    known = ", ".join(deck_id for _, deck_id, _ in available_modules())
    raise ValueError(f"Unknown PPT module: {requested}. Available: {known}")


def free_port() -> int:
    with socket.socket() as address:
        address.bind(("127.0.0.1", 0))
        return address.getsockname()[1]


@contextmanager
def vite_server(log_directory: Path | None = None):
    node = shutil.which("node")
    vite = ROOT / "node_modules" / "vite" / "bin" / "vite.js"
    if not node or not vite.is_file():
        raise RuntimeError(
            "Node/Vite is unavailable. Run npm install in the repository first."
        )
    port = free_port()
    if log_directory:
        log_directory.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryFile(mode="w+t", encoding="utf-8", dir=log_directory) as log:
        process = subprocess.Popen(
            [
                node,
                str(vite),
                "--host",
                "127.0.0.1",
                "--port",
                str(port),
                "--strictPort",
            ],
            cwd=ROOT,
            stdout=log,
            stderr=subprocess.STDOUT,
        )
        base_url = f"http://127.0.0.1:{port}"
        try:
            for _ in range(150):
                if process.poll() is not None:
                    break
                try:
                    with urlopen(base_url + "/scenedeck/", timeout=1) as response:
                        if response.status == 200:
                            yield base_url
                            return
                except (URLError, TimeoutError):
                    time.sleep(0.2)
            log.seek(0)
            raise RuntimeError("Vite did not start:\n" + log.read()[-4000:])
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)


def launch_browser(playwright):
    errors: list[str] = []
    for options in ({}, {"channel": "chrome"}, {"channel": "msedge"}):
        try:
            return playwright.chromium.launch(headless=True, **options)
        except PlaywrightError as error:
            errors.append(str(error).splitlines()[0])
    raise RuntimeError(
        "No supported Chromium browser found. Run 'python -m playwright install chromium' first.\n"
        + "\n".join(errors)
    )


def capture_url(base_url: str, deck_id: str, slide_id: str | None = None) -> str:
    query = {"scenedeckCapture": "1", "deck": deck_id}
    if slide_id:
        query["slide"] = slide_id
    return base_url + "/scenedeck/?" + urlencode(query)


def open_capture(context, url: str):
    page = context.new_page()
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        capture = page.locator("[data-scene-deck-capture]")
        capture.wait_for(state="visible", timeout=60000)
        return page, capture
    except Exception:
        page.close()
        raise


def scene_ids(context, base_url: str, deck_id: str) -> list[str]:
    page, capture = open_capture(context, capture_url(base_url, deck_id))
    try:
        actual_deck_id = capture.get_attribute("data-deck-id")
        if actual_deck_id != deck_id:
            raise RuntimeError(
                f"Requested deck {deck_id}, but 术库 opened {actual_deck_id}."
            )
        ids = json.loads(capture.get_attribute("data-scene-ids") or "[]")
        if not ids or any(not isinstance(slide_id, str) for slide_id in ids):
            raise RuntimeError("术库 did not expose a valid slide list.")
        return ids
    finally:
        page.close()


def capture_slide(
    context,
    base_url: str,
    deck_id: str,
    slide_id: str,
    settle_ms: int,
    actions=None,
    inspection: dict | None = None,
    max_chars: int | None = None,
    surface: str = ".ppt-slide-surface",
) -> Image.Image:
    page, capture = open_capture(context, capture_url(base_url, deck_id, slide_id))
    try:
        if capture.get_attribute("data-scene-id") != slide_id:
            raise RuntimeError(f"术库 could not open slide {slide_id}.")
        page.evaluate("""async () => {
            await document.fonts.ready;
            await Promise.all(Array.from(document.images, image => image.decode().catch(() => undefined)));
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }""")
        apply_actions(page, actions or [])
        page.wait_for_timeout(settle_ms)
        if inspection is not None:
            inspection.update(inspect_page(page, slide_id, max_chars, surface))
        screenshot = capture.screenshot(
            type="png", animations="disabled", timeout=30000
        )
        with Image.open(io.BytesIO(screenshot)) as image:
            if image.size != SLIDE_SIZE:
                raise RuntimeError(
                    f"Slide {slide_id} captured at {image.size}, expected {SLIDE_SIZE}."
                )
            return image.convert("RGB").copy()
    finally:
        page.close()


def inspect_page(
    page,
    slide_id: str,
    max_chars: int | None = None,
    surface: str = ".ppt-slide-surface",
) -> dict:
    """Inspect the current state with the same browser expression as check.bounds."""
    checker = (
        Path(__file__).resolve().parents[1] / "common/_page_checks.js"
    ).read_text(encoding="utf-8")
    options = {
        "surfaceSelector": surface,
        "expectedId": slide_id,
        "maxChars": max_chars,
    }
    try:
        page.wait_for_function(
            f"options => {{ const result = ({checker})(options); return result.ready || result.status === 'failed'; }}",
            arg=options,
            timeout=15000,
        )
    except PlaywrightError:
        # Return the observed missing/hidden/loading state, never a zero-word success.
        result = page.evaluate(checker, options)
        result["readinessTimedOut"] = True
        return result
    return page.evaluate(checker, options)


def apply_actions(page, actions):
    for action in actions:
        kind = action.get("action")
        if kind == "wait":
            delay = action.get("ms", 0)
            if type(delay) is not int or not 0 <= delay <= 10000:
                raise ValueError("Action wait must be an integer from 0 to 10000 ms.")
            page.wait_for_timeout(delay)
        elif kind in {"click", "fill", "press"}:
            locator = page.locator(action["selector"])
            if kind == "click":
                locator.click(timeout=10000)
            elif kind == "fill":
                locator.fill(str(action["value"]), timeout=10000)
            else:
                locator.press(str(action["value"]), timeout=10000)
        else:
            raise ValueError(f"Unknown capture action: {kind}")


def safe_slide_id(value):
    if not isinstance(value, str) or not re.fullmatch(
        r"[A-Za-z0-9][A-Za-z0-9._-]*", value
    ):
        raise ValueError(f"Unsafe slide ID: {value!r}")
    return value


@contextmanager
def browser_session(base_url=None, reset_storage=True, scratchpad=None):
    """One isolated browser context; never touches the user's browser profile."""
    load_dependencies()
    with (
        (
            nullcontext(base_url.rstrip("/")) if base_url else vite_server(scratchpad)
        ) as address,
        sync_playwright() as playwright,
    ):
        browser = launch_browser(playwright)
        try:
            context = browser.new_context(
                viewport={"width": 1600, "height": 900},
                device_scale_factor=1,
                reduced_motion="reduce",
            )
            if reset_storage:
                context.add_init_script(
                    "try { localStorage.clear(); sessionStorage.clear(); } catch {}"
                )
            try:
                yield context, address
            finally:
                context.close()
        finally:
            browser.close()


def capture_module(args: argparse.Namespace, context_setup=None) -> dict:
    """Capture the requested states, returning saved paths and any per-slide errors."""
    if args.settle_ms < 0:
        raise ValueError("--settle-ms must be non-negative")
    if args.max_chars is not None and args.max_chars < 0:
        raise ValueError("--max-chars must be non-negative")
    safe_slide_id(args.state)
    if args.actions and args.state == "default":
        raise ValueError(
            "Use --state <name> with --actions to preserve the default screenshot."
        )
    directory, deck_id, asset_id = resolve_module(args.module)
    page_directory = getattr(args, "page_directory", None)
    if page_directory and not args.slide:
        raise ValueError("Use --slide with --page-directory to keep each page's outputs separate")
    if args.format in {"thumbnails", "both"} and args.state != "default":
        raise ValueError(
            "Interactive states are evaluation screenshots; use --format screenshots"
        )
    thumbnail_root = (directory / "assets" / "scenedeck-thumbnails").resolve()
    destinations = []
    if not args.inspect:
        if args.format in {"screenshots", "both"}:
            destinations.append(
                scratchpad_path(directory, args.output, default="screenshots", page_directory=page_directory)
            )
        if args.format in {"thumbnails", "both"}:
            thumbnail_output = (
                args.output
                if args.format == "thumbnails" and args.output
                else thumbnail_root
            ).resolve()
            if not thumbnail_output.is_relative_to(thumbnail_root):
                raise ValueError(f"Thumbnail output must be inside {thumbnail_root}")
            destinations.append(thumbnail_output)
    actions = (
        json.loads(args.actions.read_text(encoding="utf-8-sig")) if args.actions else {}
    )
    if not isinstance(actions, dict) or any(
        not isinstance(items, list) or any(not isinstance(item, dict) for item in items)
        for items in actions.values()
    ):
        raise ValueError("Actions must map slide IDs to arrays of action objects.")
    with browser_session(
        args.base_url, scratchpad=scratchpad_path(directory, default="", page_directory=page_directory)
    ) as (context, base_url):
        if context_setup is not None:
            context_setup(context, asset_id)
        ids = scene_ids(context, base_url, deck_id)
        for value in ids:
            safe_slide_id(value)
        if len(set(ids)) != len(ids):
            raise ValueError("Duplicate runtime slide IDs.")
        if args.inspect:
            return {"deck": deck_id, "uuid": asset_id, "slides": ids}
        if args.slide:
            if args.slide not in ids:
                raise ValueError(f"Unknown slide: {args.slide}")
            ids = [args.slide]
        if set(actions) - set(ids):
            raise ValueError(
                "Actions include slides outside the requested capture range."
            )
        files, errors, checks = [], [], []
        for slide_id in ids:
            inspection = {"page": slide_id, "state": args.state}
            checks.append(inspection)
            try:
                image = capture_slide(
                    context,
                    base_url,
                    deck_id,
                    slide_id,
                    args.settle_ms,
                    actions.get(slide_id),
                    inspection,
                    args.max_chars,
                    args.surface,
                )
                for screenshots in destinations:
                    target = (
                        screenshots / f"{slide_id}.png"
                        if args.state == "default"
                        else screenshots / slide_id / f"{args.state}.png"
                    )
                    if screenshots.is_relative_to(thumbnail_root):
                        if not target.resolve().is_relative_to(thumbnail_root):
                            raise ValueError(
                                f"Thumbnail path escapes output directory: {target}"
                            )
                    else:
                        target = scratchpad_path(directory, target, default="")
                    target.parent.mkdir(parents=True, exist_ok=True)
                    index_path = ROOT / 'modules/shared/asset-index.json'
                    formats = json.loads(index_path.read_text(encoding='utf-8')) if index_path.is_file() else None
                    key = asset_id+'/'+target.relative_to(directory/'assets').as_posix() if screenshots.is_relative_to(thumbnail_root) else None
                    mapped = formats['formats'].get(key) if formats and key else None
                    if mapped and image.convert('RGBA').getchannel('A').getextrema()==(255,255):
                        target = directory / 'assets' / mapped
                        image.convert('RGB').save(target, format='JPEG', quality=92, subsampling=0, optimize=True, progressive=True)
                    else:
                        image.save(target, format="PNG", optimize=True)
                        if mapped:
                            del formats['formats'][key]
                            index_path.write_text(json.dumps(formats,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
                            (ROOT/'modules/shared/react/asset-formats.json').write_text(json.dumps(formats['formats'],ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
                    files.append(str(target))
                    print(
                        f"Captured {deck_id}/{slide_id}: {target}",
                        file=sys.stderr,
                        flush=True,
                    )
            except Exception as exc:
                inspection.update(
                    status="unverified",
                    text={"status": "unverified", "characters": None},
                    error=str(exc),
                )
                errors.append({"slide": slide_id, "error": str(exc)})
                print(f"FAILED {slide_id}: {exc}", file=sys.stderr)
        return {
            "deck": deck_id,
            "uuid": asset_id,
            "state": args.state,
            "files": files,
            "errors": errors,
            "checks": checks,
        }


def main(argv: list[str] | None = None, context_setup=None) -> int:
    args = build_parser().parse_args(argv)
    try:
        result = capture_module(args, context_setup)
        failed = any(
            check.get("status") == "failed" for check in result.get("checks", [])
        )
        unverified = any(
            check.get("status") == "unverified"
            or check.get("text", {}).get("status") == "unverified"
            for check in result.get("checks", [])
        )
        status = (
            "error"
            if result.get("errors")
            else "unverified" if unverified else "failed" if failed else "ok"
        )
        emit_result(result, status=status)
        return 2 if status in {"error", "unverified"} else 1 if failed else 0
    except (
        RuntimeError,
        ValueError,
        OSError,
        KeyError,
        ImportError,
        PlaywrightError,
    ) as exc:
        return report_error(exc)


if __name__ == "__main__":
    raise SystemExit(main())

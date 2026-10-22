#!/usr/bin/env python3
"""Capture a module's SceneDeck slides into its UUID root asset directory.

Setup: python -m pip install -r creator-skill/scripts/capture/requirements.txt
Run: python creator-skill/scripts/tools.py capture.slides --module convolution-kernel-intro
If no Chrome, Edge, or Playwright Chromium is installed: python -m playwright install chromium
"""

from __future__ import annotations

import sys as _sys
from pathlib import Path as _Path
_TOOL_ROOT = _Path(__file__).resolve().parents[3]
_sys.path[:0] = [str(_TOOL_ROOT / "backend/src"), str(_TOOL_ROOT / "creator-skill/scripts"), str(_Path(__file__).resolve().parent)]

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

PlaywrightError = RuntimeError


def load_dependencies():
    global Image, PlaywrightError, sync_playwright
    try:
        from PIL import Image
        from playwright.sync_api import Error as PlaywrightError, sync_playwright
    except ImportError as exc:
        raise RuntimeError("Install capture dependencies: python -m pip install -r creator-skill/scripts/capture/requirements.txt") from exc


from idl_backend.config import repository_root
ROOT = repository_root()
MODULES = ROOT / "modules"
SLIDE_SIZE = (1600, 900)
THUMBNAIL_SIZE = (400, 225)


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
            modules.append((directory, metadata.get("id", directory.name.lower()), asset_id))
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
def vite_server():
    node = shutil.which("node")
    vite = ROOT / "node_modules" / "vite" / "bin" / "vite.js"
    if not node or not vite.is_file():
        raise RuntimeError("Node/Vite is unavailable. Run npm install in the repository first.")
    port = free_port()
    with tempfile.TemporaryFile(mode="w+t", encoding="utf-8") as log:
        process = subprocess.Popen(
            [node, str(vite), "--host", "127.0.0.1", "--port", str(port), "--strictPort"],
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
            raise RuntimeError(f"Requested deck {deck_id}, but SceneDeck opened {actual_deck_id}.")
        ids = json.loads(capture.get_attribute("data-scene-ids") or "[]")
        if not ids or any(not isinstance(slide_id, str) for slide_id in ids):
            raise RuntimeError("SceneDeck did not expose a valid slide list.")
        return ids
    finally:
        page.close()


def capture_slide(context, base_url: str, deck_id: str, slide_id: str, settle_ms: int, actions=None) -> Image.Image:
    page, capture = open_capture(context, capture_url(base_url, deck_id, slide_id))
    try:
        if capture.get_attribute("data-scene-id") != slide_id:
            raise RuntimeError(f"SceneDeck could not open slide {slide_id}.")
        page.evaluate("""async () => {
            await document.fonts.ready;
            await Promise.all(Array.from(document.images, image => image.decode().catch(() => undefined)));
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }""")
        apply_actions(page, actions or [])
        page.wait_for_timeout(settle_ms)
        screenshot = capture.screenshot(type="png", animations="disabled", timeout=30000)
        with Image.open(io.BytesIO(screenshot)) as image:
            if image.size != SLIDE_SIZE:
                raise RuntimeError(f"Slide {slide_id} captured at {image.size}, expected {SLIDE_SIZE}.")
            return image.convert("RGB").copy()
    finally:
        page.close()


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
            if kind == "click": locator.click(timeout=10000)
            elif kind == "fill": locator.fill(str(action["value"]), timeout=10000)
            else: locator.press(str(action["value"]), timeout=10000)
        else:
            raise ValueError(f"Unknown capture action: {kind}")


def safe_slide_id(value):
    if not isinstance(value, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", value):
        raise ValueError(f"Unsafe slide ID: {value!r}")
    return value


@contextmanager
def browser_session(base_url=None, reset_storage=True):
    """One isolated browser context; never touches the user's browser profile."""
    load_dependencies()
    with (nullcontext(base_url.rstrip("/")) if base_url else vite_server()) as address, sync_playwright() as playwright:
        browser = launch_browser(playwright)
        try:
            context = browser.new_context(viewport={"width":1600,"height":900}, device_scale_factor=1, reduced_motion="reduce")
            if reset_storage: context.add_init_script("try { localStorage.clear(); sessionStorage.clear(); } catch {}")
            try:
                yield context, address
            finally:
                context.close()
        finally:
            browser.close()


def main(argv=None, context_setup=None) -> int:
    parser = argparse.ArgumentParser(description="Capture real 1600x900 slides and/or 400x225 SceneDeck thumbnails using one shared engine.")
    parser.add_argument("--module", required=True, help="module directory, deck ID or UUID")
    parser.add_argument("--slide", help="one slide ID; omit for all")
    parser.add_argument("--format", choices=["screenshots","thumbnails","both"], default="thumbnails")
    parser.add_argument("--output", type=Path, help="screenshot directory; defaults to work/captures/<deck>")
    parser.add_argument("--base-url", help="reuse a running Vite server; otherwise a temporary Vite is started and stopped")
    parser.add_argument("--inspect", action="store_true", help="print runtime slide IDs without saving images")
    parser.add_argument("--actions", type=Path, help='JSON object {"slide-id":[{"action":"click","selector":"button"}]} for requested interaction states')
    parser.add_argument("--settle-ms", type=int, default=2000)
    args = parser.parse_args(argv)
    if args.settle_ms < 0: parser.error("--settle-ms must be non-negative")
    try:
        _, deck_id, asset_id = resolve_module(args.module)
        actions = json.loads(args.actions.read_text(encoding="utf-8")) if args.actions else {}
        if not isinstance(actions, dict) or any(not isinstance(items,list) or any(not isinstance(item,dict) for item in items) for items in actions.values()):
            raise ValueError("Actions must map slide IDs to arrays of action objects.")
        with browser_session(args.base_url) as (context, base_url):
            if context_setup is not None: context_setup(context, asset_id)
            ids = scene_ids(context,base_url,deck_id)
            for value in ids: safe_slide_id(value)
            if len(set(ids)) != len(ids): raise ValueError("Duplicate runtime slide IDs.")
            if args.inspect:
                print(json.dumps({"deck":deck_id,"uuid":asset_id,"slides":ids},ensure_ascii=False))
                return 0
            if args.slide:
                if args.slide not in ids: raise ValueError(f"Unknown slide: {args.slide}")
                ids=[args.slide]
            if set(actions)-set(ids): raise ValueError("Actions include slides outside the requested capture range.")
            screenshots=args.output or ROOT/"work/captures"/deck_id
            thumbnails=ROOT/"assets"/asset_id/"scenedeck-thumbnails"
            if args.format in {"screenshots","both"}: screenshots.mkdir(parents=True,exist_ok=True)
            if args.format in {"thumbnails","both"}: thumbnails.mkdir(parents=True,exist_ok=True)
            failed=[]
            for slide_id in ids:
                try:
                    image=capture_slide(context,base_url,deck_id,slide_id,args.settle_ms,actions.get(slide_id))
                    if args.format in {"screenshots","both"}: image.save(screenshots/f"{slide_id}.png",format="PNG",optimize=True)
                    if args.format in {"thumbnails","both"}: image.resize(THUMBNAIL_SIZE,Image.Resampling.LANCZOS).save(thumbnails/f"{slide_id}.png",format="PNG",optimize=True)
                    print(f"Captured {deck_id}/{slide_id} ({args.format})",flush=True)
                except Exception as exc:
                    failed.append(slide_id);print(f"FAILED {slide_id}: {exc}",file=sys.stderr)
            return 1 if failed else 0
    except (RuntimeError,ValueError,OSError,KeyError,PlaywrightError) as exc:
        print(f"Capture failed: {exc}",file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Capture a module's SceneDeck slides into its signed root asset directory.

Setup once: python -m pip install -e './backend[tools]'
Run: python -m idl_backend.tools.content.generate_scenedeck_thumbnails --module convolution-kernel-intro
If no Chrome, Edge, or Playwright Chromium is installed: python -m playwright install chromium
"""

from __future__ import annotations

import argparse
import io
import json
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from contextlib import contextmanager
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from PIL import Image
from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright


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
                raise ValueError(f"Missing signed module identity in {outline.relative_to(ROOT)}")
            modules.append((directory, metadata.get("id", directory.name.lower()), asset_id))
    return sorted(modules, key=lambda entry: entry[1])


def resolve_module(requested: str) -> tuple[Path, str, str]:
    for directory, deck_id, asset_id in available_modules():
        if requested.lower() in {deck_id.lower(), directory.name.lower()}:
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


def capture_slide(context, base_url: str, deck_id: str, slide_id: str, settle_ms: int) -> Image.Image:
    page, capture = open_capture(context, capture_url(base_url, deck_id, slide_id))
    try:
        if capture.get_attribute("data-scene-id") != slide_id:
            raise RuntimeError(f"SceneDeck could not open slide {slide_id}.")
        page.evaluate("""async () => {
            await document.fonts.ready;
            await Promise.all(Array.from(document.images, image => image.decode().catch(() => undefined)));
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }""")
        page.wait_for_timeout(settle_ms)
        screenshot = capture.screenshot(type="png", animations="disabled", timeout=30000)
        with Image.open(io.BytesIO(screenshot)) as image:
            if image.size != SLIDE_SIZE:
                raise RuntimeError(f"Slide {slide_id} captured at {image.size}, expected {SLIDE_SIZE}.")
            return image.convert("RGB").resize(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
    finally:
        page.close()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--module", required=True, help="PPT module ID or directory name")
    parser.add_argument("--slide", help="Regenerate only one slide ID")
    parser.add_argument("--settle-ms", type=int, default=2000, help="Wait after fonts and images load (default: 2000)")
    args = parser.parse_args()
    if args.settle_ms < 0:
        parser.error("--settle-ms must be non-negative")
    try:
        _, deck_id, asset_id = resolve_module(args.module)
        output_dir = ROOT / "assets" / asset_id / "scenedeck-thumbnails"
        with vite_server() as base_url, sync_playwright() as playwright:
            browser = launch_browser(playwright)
            try:
                context = browser.new_context(viewport={"width": SLIDE_SIZE[0], "height": SLIDE_SIZE[1]}, device_scale_factor=1, reduced_motion="reduce")
                context.add_init_script("try { localStorage.clear(); sessionStorage.clear(); } catch { /* opaque origin */ }")
                try:
                    ids = scene_ids(context, base_url, deck_id)
                    if args.slide:
                        if args.slide not in ids:
                            raise ValueError(f"Slide {args.slide} is not in deck {deck_id}.")
                        ids = [args.slide]
                    output_dir.mkdir(parents=True, exist_ok=True)
                    failed: list[str] = []
                    for index, slide_id in enumerate(ids, 1):
                        try:
                            image = capture_slide(context, base_url, deck_id, slide_id, args.settle_ms)
                            destination = output_dir / f"{slide_id}.png"
                            image.save(destination, format="PNG", optimize=True)
                            print(f"[{index}/{len(ids)}] {destination.relative_to(ROOT)}", flush=True)
                        except Exception as error:
                            failed.append(slide_id)
                            print(f"[{index}/{len(ids)}] FAILED {slide_id}: {error}", file=sys.stderr, flush=True)
                    if failed:
                        print("Failed slides: " + ", ".join(failed), file=sys.stderr)
                        return 1
                    print(f"Generated {len(ids)} thumbnails for {deck_id}.")
                    return 0
                finally:
                    context.close()
            finally:
                browser.close()
    except (RuntimeError, ValueError, OSError, PlaywrightError) as error:
        print(f"Thumbnail generation failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

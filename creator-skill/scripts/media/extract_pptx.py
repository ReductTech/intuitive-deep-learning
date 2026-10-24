#!/usr/bin/env python3
"""Extract ordered PPTX slide images, text and speaker notes.

Reads: One local .pptx; image rendering requires Windows and desktop PowerPoint.
Writes: A new directory inside the selected module's _scratchpad, containing
PNG, UTF-8 text/notes and manifest.json.
Existing output directories are never overwritten; the source is opened read-only.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path, PurePosixPath
import posixpath
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from zipfile import BadZipFile, ZipFile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "common"))
from _common import emit_result, report_error, resolve_module, scratchpad_path


def build_parser() -> argparse.ArgumentParser:
    """Define file paths, image resolution and rendering timeout."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="local .pptx path, relative to cwd")
    parser.add_argument(
        "--module",
        required=True,
        help="target module directory, ID or UUID; initialize its outline first",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="new directory inside the module's _scratchpad, relative to cwd; default _scratchpad/<input-stem>-extracted",
    )
    parser.add_argument(
        "--width",
        type=int,
        default=1600,
        help="PNG width in pixels, 1..16384; height follows source aspect ratio; default 1600",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=300,
        help="PowerPoint rendering timeout in seconds; positive integer, default 300",
    )
    return parser


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def relationships(archive: ZipFile, part: str) -> dict[str, tuple[str, str]]:
    """Resolve internal relationships without extracting ZIP members to disk."""
    path = PurePosixPath(part)
    rel_path = str(path.parent / "_rels" / (path.name + ".rels"))
    if rel_path not in archive.namelist():
        return {}
    result = {}
    for relation in ET.fromstring(archive.read(rel_path)):
        if relation.get("TargetMode") == "External":
            continue
        target = relation.get("Target", "")
        resolved = (
            posixpath.normpath(posixpath.join(str(path.parent), target))
            if not target.startswith("/")
            else target.lstrip("/")
        )
        if resolved.startswith("../") or resolved not in archive.namelist():
            raise ValueError(f"Invalid PPTX relationship target: {target}")
        result[relation.get("Id", "")] = (
            resolved,
            relation.get("Type", "").rsplit("/", 1)[-1],
        )
    return result


def paragraph_text(element: ET.Element) -> str:
    """Read DrawingML paragraphs, including text runs and explicit line breaks."""
    lines = []
    for paragraph in element.iter():
        if local_name(paragraph.tag) != "p":
            continue
        text = "".join(
            node.text or "" if local_name(node.tag) == "t" else "\n"
            for node in paragraph.iter()
            if local_name(node.tag) in {"t", "br"}
        )
        if text.strip():
            lines.append(text)
    return "\n".join(lines)


def read_pptx(source: Path) -> dict:
    """Read slide order from presentation relationships, not ZIP filenames.

    Notes use only the body placeholder, excluding slide numbers/header/footer.
    Text includes grouped shapes and table cells, but does not perform OCR.
    """
    with ZipFile(source) as archive:
        presentation = ET.fromstring(archive.read("ppt/presentation.xml"))
        links = relationships(archive, "ppt/presentation.xml")
        size = next(node for node in presentation if local_name(node.tag) == "sldSz")
        width, height = int(size.attrib["cx"]), int(size.attrib["cy"])
        if width <= 0 or height <= 0:
            raise ValueError("Invalid slide dimensions")
        pages = []
        for node in presentation.iter():
            if local_name(node.tag) != "sldId":
                continue
            relation_id = next(
                value for key, value in node.attrib.items() if key.endswith("}id")
            )
            part, kind = links[relation_id]
            if kind != "slide":
                raise ValueError("Slide relationship does not point to a slide")
            slide = ET.fromstring(archive.read(part))
            notes = []
            for target, relation_type in relationships(archive, part).values():
                if relation_type != "notesSlide":
                    continue
                root = ET.fromstring(archive.read(target))
                for shape in root.iter():
                    if local_name(shape.tag) == "sp" and any(
                        local_name(child.tag) == "ph" and child.get("type") == "body"
                        for child in shape.iter()
                    ):
                        text = paragraph_text(shape)
                        if text:
                            notes.append(text)
            pages.append(
                {
                    "page": len(pages) + 1,
                    "text": paragraph_text(slide),
                    "notes": "\n".join(notes),
                }
            )
    if not pages:
        raise ValueError("PPTX contains no slides")
    return {
        "source": str(source),
        "source_size": {"width": width, "height": height},
        "pages": pages,
    }


def render_slides(
    source: Path, directory: Path, width: int, height: int, count: int, timeout: int
) -> None:
    """Export static PNGs with PowerPoint; never save changes to the source."""
    powershell = shutil.which("powershell.exe")
    if sys.platform != "win32" or not powershell:
        raise RuntimeError(
            "PPTX rendering requires Windows, PowerShell and installed desktop Microsoft PowerPoint"
        )
    # Pass paths through environment variables rather than interpolating shell code.
    script = r"""
$ErrorActionPreference = 'Stop'
$app = $null
$deck = $null
$previousSecurity = $null
try {
    $app = New-Object -ComObject PowerPoint.Application
    $previousSecurity = $app.AutomationSecurity
    $app.AutomationSecurity = 3
    $deck = $app.Presentations.Open($env:IDL_PPTX_SOURCE, -1, 0, 0)
    if ($deck.Slides.Count -ne [int]$env:IDL_PPTX_COUNT) { throw 'Slide count differs from PPTX XML' }
    for ($i = 1; $i -le $deck.Slides.Count; $i++) {
        $slide = $deck.Slides.Item($i)
        try {
            $file = Join-Path $env:IDL_PPTX_OUTPUT ('{0:D4}.png' -f $i)
            $slide.Export($file, 'PNG', [int]$env:IDL_PPTX_WIDTH, [int]$env:IDL_PPTX_HEIGHT)
        } finally { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($slide) }
    }
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 2
} finally {
    if ($null -ne $deck) {
        $deck.Close()
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($deck)
    }
    if ($null -ne $app) {
        if ($null -ne $previousSecurity) { $app.AutomationSecurity = $previousSecurity }
        # Do not quit PowerPoint while the user has another presentation open.
        if ($app.Presentations.Count -eq 0) { $app.Quit() }
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
    }
}
"""
    environment = {
        **os.environ,
        "IDL_PPTX_SOURCE": str(source),
        "IDL_PPTX_OUTPUT": str(directory),
        "IDL_PPTX_WIDTH": str(width),
        "IDL_PPTX_HEIGHT": str(height),
        "IDL_PPTX_COUNT": str(count),
    }
    try:
        result = subprocess.run(
            [powershell, "-NoProfile", "-NonInteractive", "-Command", script],
            env=environment,
            capture_output=True,
            timeout=timeout,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(
            f"PowerPoint export timed out after {timeout}s; check PowerPoint for a pending dialog before retrying"
        ) from exc
    if result.returncode:
        detail = result.stderr.decode(errors="replace").strip()
        raise RuntimeError(f"PowerPoint export failed: {detail}")
    for page in range(1, count + 1):
        image = directory / f"{page:04d}.png"
        if not image.is_file() or image.stat().st_size == 0:
            raise RuntimeError(f"PowerPoint did not export page {page}")


def run_task(args: argparse.Namespace) -> dict:
    """Stage all outputs, publishing a new directory only after complete export."""
    source = args.input.resolve()
    if not source.is_file() or source.suffix.lower() != ".pptx":
        raise ValueError("Input must be an existing .pptx file")
    if not 1 <= args.width <= 16384 or args.timeout <= 0:
        raise ValueError("--width must be 1..16384 and --timeout must be positive")
    directory, _ = resolve_module(args.module)
    output = scratchpad_path(directory, args.output, default=source.stem + "-extracted")
    if output.exists():
        raise ValueError(
            f"Output already exists; choose a new --output directory: {output}"
        )
    document = read_pptx(source)
    height = max(
        1,
        round(
            args.width
            * document["source_size"]["height"]
            / document["source_size"]["width"]
        ),
    )
    document["image_size"] = {"width": args.width, "height": height}
    document["limitations"] = [
        "Static slide images; animations/video are not played.",
        "Text follows XML shape order, not inferred visual reading order. No OCR; images, charts, SmartArt and inherited layout/master content may require manual inspection.",
    ]
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(
        prefix=".pptx-extract-", dir=output.parent
    ) as temporary:
        staged = Path(temporary) / "result"
        staged.mkdir()
        print(
            f"Exporting {len(document['pages'])} PPTX slides with PowerPoint",
            file=sys.stderr,
        )
        render_slides(
            source, staged, args.width, height, len(document["pages"]), args.timeout
        )
        for page in document["pages"]:
            stem = f"{page['page']:04d}"
            page.update(
                image=f"{stem}.png",
                text_file=f"{stem}.txt",
                notes_file=f"{stem}.notes.txt",
            )
            (staged / page["text_file"]).write_text(page["text"], encoding="utf-8")
            (staged / page["notes_file"]).write_text(page["notes"], encoding="utf-8")
        (staged / "manifest.json").write_text(
            json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        staged.rename(output)
    return {
        "output": str(output),
        "manifest": str(output / "manifest.json"),
        "page_count": len(document["pages"]),
        "image_size": document["image_size"],
    }


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        emit_result(run_task(args))
        return 0
    except (
        OSError,
        ValueError,
        RuntimeError,
        BadZipFile,
        ET.ParseError,
        KeyError,
        StopIteration,
    ) as exc:
        return report_error(exc)


if __name__ == "__main__":
    raise SystemExit(main())

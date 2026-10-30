#!/usr/bin/env python3
"""Remove a green screen and export transparent WebM and MOV files.

Reads: The input video; FFmpeg must be available on PATH.
Writes: <stem>_alpha.webm and <stem>_alpha.mov in the module's _scratchpad/media,
overwriting these outputs. Promote accepted assets separately.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import shutil
import subprocess
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "common"))
from _common import emit_result, report_error, resolve_module, scratchpad_path

SIMILARITY = 0.36
BLEND = 0.12
WEBM_CRF = 22


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "input", type=Path, help="input video path, relative to the working directory"
    )
    parser.add_argument(
        "--module", required=True, help="target module directory, ID or UUID"
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="output directory inside the module's _scratchpad, relative to cwd; default _scratchpad/media",
    )
    return parser


def remove_green_screen(source: Path, output: Path) -> dict:
    """Encode both alpha outputs; propagate FFmpeg failures to the CLI boundary."""
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("FFmpeg was not found on PATH.")
    src = source.expanduser().resolve()
    if not src.is_file():
        raise ValueError(f"Input video does not exist: {src}")
    output.mkdir(parents=True, exist_ok=True)
    out_webm = output / f"{src.stem}_alpha.webm"
    out_mov = output / f"{src.stem}_alpha.mov"
    # Chroma distance and despill retain soft edges and remove green reflections.
    vf = f"chromakey=0x00FF00:{SIMILARITY}:{BLEND},despill=green,format=rgba"
    webm_cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(src),
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-vf",
        vf,
        "-c:v",
        "libvpx-vp9",
        "-pix_fmt",
        "yuva420p",
        "-b:v",
        "0",
        "-crf",
        str(WEBM_CRF),
        # Alpha VP9 必须关闭 alt-ref
        "-auto-alt-ref",
        "0",
        "-row-mt",
        "1",
        "-c:a",
        "libopus",
        "-b:a",
        "128k",
        str(out_webm),
    ]

    # ProRes 4444 retains alpha in the high-quality master.
    mov_cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(src),
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-vf",
        vf,
        "-c:v",
        "prores_ks",
        "-profile:v",
        "4",
        "-pix_fmt",
        "yuva444p10le",
        "-alpha_bits",
        "16",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        str(out_mov),
    ]

    for command in (webm_cmd, mov_cmd):
        print(f"Encoding {command[-1]}", file=sys.stderr, flush=True)
        subprocess.run(command, check=True, stdout=sys.stderr, stderr=sys.stderr)
    return {"input": str(src), "files": [str(out_webm), str(out_mov)]}


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        directory, _ = resolve_module(args.module)
        output = scratchpad_path(directory, args.output, default="media")
        # Validate each file too: an existing symlink must not redirect the write.
        for suffix in (".webm", ".mov"):
            scratchpad_path(
                directory, output / f"{args.input.stem}_alpha{suffix}", default=""
            )
        emit_result(remove_green_screen(args.input, output))
        return 0
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as exc:
        return report_error(exc)


if __name__ == "__main__":
    raise SystemExit(main())

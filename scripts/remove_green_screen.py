#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Robust green-screen removal.

Outputs in the SAME directory as the input:
    xxx_alpha.webm   # VP9 + alpha, for web / React
    xxx_alpha.mov    # ProRes 4444 + alpha, high-quality master

Requirements:
    ffmpeg must be installed and available on PATH.

Usage:
    1. Edit INPUT_VIDEO in main()
    2. Run:
       python remove_green_screen.py
"""

import shutil
import subprocess
import sys
from pathlib import Path


def run(cmd):
    print("\n>", " ".join(f'"{x}"' if " " in x else x for x in cmd))
    subprocess.run(cmd, check=True)


def main():
    # ============================================================
    # 只需要改这里
    # ============================================================
    INPUT_VIDEO = r"C:\Users\Ocean\Downloads\teacher_male_10s.mp4"

    # 抠像参数
    #
    # similarity:
    #   越大，识别“偏绿色”的范围越宽。
    #   0.30~0.40 通常适合不均匀、有阴影、有杂色的绿幕。
    #
    # blend:
    #   边缘羽化程度。越大边缘越柔和。
    #
    # 默认值偏向“鲁棒抠绿幕”，而不是只抠纯绿色。
    SIMILARITY = 0.36
    BLEND = 0.12

    # WebM质量，越小质量越高、文件越大
    WEBM_CRF = 22

    # ============================================================

    if shutil.which("ffmpeg") is None:
        print("ERROR: ffmpeg was not found on PATH.", file=sys.stderr)
        print("Please install ffmpeg first.", file=sys.stderr)
        sys.exit(1)

    src = Path(INPUT_VIDEO).expanduser().resolve()

    if not src.exists():
        print(f"ERROR: Input file does not exist:\n{src}", file=sys.stderr)
        sys.exit(1)

    out_webm = src.with_name(f"{src.stem}_alpha.webm")
    out_mov = src.with_name(f"{src.stem}_alpha.mov")

    # ----------------------------------------------------------------
    # chromakey 的 similarity 并不是简单 RGB 完全匹配。
    # 它主要根据色度距离判断，因此对于：
    #
    # - 深绿色
    # - 浅绿色
    # - 亮度不均
    # - 阴影
    # - 压缩噪点
    # - 不是标准 #00FF00 的绿幕
    #
    # 都比简单 RGB 阈值更稳。
    #
    # 再通过 despill 去掉人物边缘残留的绿色反光。
    # ----------------------------------------------------------------

    vf = (
        f"chromakey=0x00FF00:{SIMILARITY}:{BLEND},"
        f"despill=green,"
        f"format=rgba"
    )

    # ============================================================
    # WEBM：网页 / React 推荐
    # ============================================================
    webm_cmd = [
        "ffmpeg",
        "-y",
        "-i", str(src),

        "-map", "0:v:0",
        "-map", "0:a?",

        "-vf", vf,

        "-c:v", "libvpx-vp9",
        "-pix_fmt", "yuva420p",

        "-b:v", "0",
        "-crf", str(WEBM_CRF),

        # Alpha VP9 必须关闭 alt-ref
        "-auto-alt-ref", "0",

        "-row-mt", "1",

        "-c:a", "libopus",
        "-b:a", "128k",

        str(out_webm),
    ]

    # ============================================================
    # MOV：ProRes 4444，透明母版
    # ============================================================
    mov_cmd = [
        "ffmpeg",
        "-y",
        "-i", str(src),

        "-map", "0:v:0",
        "-map", "0:a?",

        "-vf", vf,

        "-c:v", "prores_ks",
        "-profile:v", "4",
        "-pix_fmt", "yuva444p10le",
        "-alpha_bits", "16",

        "-c:a", "aac",
        "-b:a", "192k",

        str(out_mov),
    ]

    print("=" * 60)
    print("Green Screen Removal")
    print("=" * 60)
    print(f"Input       : {src}")
    print(f"Similarity  : {SIMILARITY}")
    print(f"Blend       : {BLEND}")
    print("=" * 60)

    try:
        print("\n[1/2] Creating transparent WebM...")
        run(webm_cmd)

        print("\n[2/2] Creating transparent MOV...")
        run(mov_cmd)

    except subprocess.CalledProcessError as e:
        print(
            f"\nERROR: ffmpeg failed with exit code {e.returncode}.",
            file=sys.stderr
        )
        sys.exit(e.returncode)

    print("\n" + "=" * 60)
    print("DONE")
    print("=" * 60)
    print(f"WebM : {out_webm}")
    print(f"MOV  : {out_mov}")
    print("=" * 60)


if __name__ == "__main__":
    main()

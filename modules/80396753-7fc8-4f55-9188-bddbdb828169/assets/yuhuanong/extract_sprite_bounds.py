"""
Extract sprite frame bounds from PNG alpha connected components.

Run from this directory:
  python extract_sprite_bounds.py

Requires:
  pip install opencv-python

For every transparent PNG that contains 12 character sprites, this writes a
matching JSON file next to the image, for example:
  balujun_male.png -> balujun_male.bounds.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    import cv2
except ImportError as exc:
    raise SystemExit(
        "OpenCV is required. Install it with: pip install opencv-python"
    ) from exc


ASSET_DIR = Path(__file__).resolve().parent
DEFAULT_ALPHA_THRESHOLD = 8
DEFAULT_MIN_AREA = 64
EXPECTED_SPRITES = 12
SKIP_NAMES = {
    "map.png",
    "table.png",
}


def sort_reading_order(boxes: list[dict[str, int]]) -> list[dict[str, int]]:
    """Sort boxes as 4 rows x 3 columns even when row y values vary slightly."""
    if not boxes:
        return []

    boxes_by_y = sorted(boxes, key=lambda box: (box["y"], box["x"]))
    rows: list[list[dict[str, int]]] = []

    for box in boxes_by_y:
      center_y = box["y"] + box["h"] / 2
      placed = False
      for row in rows:
          row_center = sum(item["y"] + item["h"] / 2 for item in row) / len(row)
          row_height = sum(item["h"] for item in row) / len(row)
          if abs(center_y - row_center) <= max(24, row_height * 0.45):
              row.append(box)
              placed = True
              break
      if not placed:
          rows.append([box])

    rows.sort(key=lambda row: min(box["y"] for box in row))
    ordered: list[dict[str, int]] = []
    for row in rows:
        ordered.extend(sorted(row, key=lambda box: box["x"]))
    return ordered


def extract_bounds(path: Path, alpha_threshold: int, min_area: int) -> list[dict[str, int]]:
    image = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if image is None:
        raise ValueError(f"Cannot read image: {path}")
    if image.ndim != 3 or image.shape[2] < 4:
        return []

    alpha = image[:, :, 3]
    _, mask = cv2.threshold(alpha, alpha_threshold, 255, cv2.THRESH_BINARY)
    component_count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)

    boxes: list[dict[str, int]] = []
    for label in range(1, component_count):
        x = int(stats[label, cv2.CC_STAT_LEFT])
        y = int(stats[label, cv2.CC_STAT_TOP])
        w = int(stats[label, cv2.CC_STAT_WIDTH])
        h = int(stats[label, cv2.CC_STAT_HEIGHT])
        area = int(stats[label, cv2.CC_STAT_AREA])
        if area < min_area:
            continue
        boxes.append({"x": x, "y": y, "w": w, "h": h, "area": area})

    return sort_reading_order(boxes)


def write_bounds(path: Path, boxes: list[dict[str, int]]) -> Path:
    output = path.with_suffix(".bounds.json")
    data = {
        "image": path.name,
        "count": len(boxes),
        "frames": [
            {
                "index": index,
                "x": box["x"],
                "y": box["y"],
                "w": box["w"],
                "h": box["h"],
            }
            for index, box in enumerate(boxes)
        ],
    }
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return output


def iter_pngs(asset_dir: Path) -> list[Path]:
    return [
        path
        for path in sorted(asset_dir.glob("*.png"))
        if path.name not in SKIP_NAMES
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-dir", type=Path, default=ASSET_DIR)
    parser.add_argument("--alpha-threshold", type=int, default=DEFAULT_ALPHA_THRESHOLD)
    parser.add_argument("--min-area", type=int, default=DEFAULT_MIN_AREA)
    parser.add_argument("--allow-non-12", action="store_true")
    args = parser.parse_args()

    failures = 0
    for path in iter_pngs(args.asset_dir):
        boxes = extract_bounds(path, args.alpha_threshold, args.min_area)
        if len(boxes) != EXPECTED_SPRITES:
            message = f"{path.name}: found {len(boxes)} components, expected {EXPECTED_SPRITES}"
            if args.allow_non_12:
                print(f"warn: {message}")
            else:
                print(f"error: {message}")
                failures += 1
                continue
        output = write_bounds(path, boxes)
        print(f"wrote {output.name}: {len(boxes)} frames")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

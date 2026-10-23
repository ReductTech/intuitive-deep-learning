"""Compatibility entry; maintained implementation lives with creator-skill."""
from pathlib import Path
import runpy
import sys
_target = Path(__file__).resolve()
for _root in _target.parents:
    if (_root / "creator-skill/scripts").is_dir() and (_root / "modules").is_dir():
        break
else:
    raise SystemExit("Course checkout with creator-skill/scripts is required.")
_target = _root / "creator-skill/scripts/remove_green_screen.py"
sys.path.insert(0, str(_target.parent))
if __name__ == "__main__":
    runpy.run_path(str(_target), run_name="__main__")
else:
    _exports = runpy.run_path(str(_target))
    globals().update({name:value for name,value in _exports.items() if not name.startswith("__")})

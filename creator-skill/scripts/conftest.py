from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "creator-skill/scripts"), str(ROOT / "backend/src")]

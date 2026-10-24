#!/usr/bin/env python3
"""Legacy thumbnail entry; course-specific playback adaptation stays in the backend."""
from __future__ import annotations
import argparse
import importlib.util
import json
from pathlib import Path
import sys
from idl_backend.config import repository_root

_script=repository_root()/"creator-skill/scripts/media/capture_slides.py"
_spec=importlib.util.spec_from_file_location("idl_authoring_capture",_script)
_capture=importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_capture)


def configure_digit_playback(context,asset_id,path):
    from idl_backend.contracts.digit_tsne import COURSE_ID,EPOCHS,SEED,VERSION
    if asset_id!=COURSE_ID:raise ValueError("--digit-tsne-record only applies to visual-feature-learning.")
    record=json.loads(path.read_text(encoding="utf-8-sig"))
    expected={"epochs":EPOCHS,"seed":SEED,"version":VERSION,"train_count":60000,"val_count":10000}
    if any(record.get("recording",{}).get(key)!=value for key,value in expected.items()) or len(record.get("frames",[]))!=EPOCHS+1:
        raise ValueError("Expected a complete current full-MNIST playback record.")
    def serve_playback(route):
        request=route.request.post_data_json
        if any(request.get(key)!=record["recording"].get(key) for key in ("learning_rate","batch_size")):
            route.fulfill(status=400,json={"ok":False,"detail":"Local playback parameters do not match."})
        else:route.fulfill(json={"ok":True,"result":record})
    context.route(f"**/api/courses/{asset_id}/records/digit-tsne",serve_playback)


def main():
    parser=argparse.ArgumentParser(add_help=False)
    parser.add_argument("--digit-tsne-record",type=Path)
    legacy,remaining=parser.parse_known_args()
    if not any(arg == '--format' or arg.startswith('--format=') for arg in remaining):
        remaining += ['--format','thumbnails']
    if '--help' in remaining:print('Backend-specific option: --digit-tsne-record <full-MNIST record.json>')
    setup=(lambda context,asset_id:configure_digit_playback(context,asset_id,legacy.digit_tsne_record)) if legacy.digit_tsne_record else None
    return _capture.main(remaining,context_setup=setup)


if __name__=="__main__":raise SystemExit(main())

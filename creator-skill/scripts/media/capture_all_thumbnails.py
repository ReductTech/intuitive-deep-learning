#!/usr/bin/env python3
"""Regenerate JPG thumbnails for every registered PPT, using the normal capture pipeline."""
import argparse
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from media import capture_slides


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', help='reuse the matching local Vite server')
    parser.add_argument('--timeout-ms', type=int, default=30000)
    args = parser.parse_args()
    reports = []
    modules = capture_slides.available_modules()
    for index, (_, module, _) in enumerate(modules, 1):
        print(f'[{index}/{len(modules)}] {module}', file=sys.stderr, flush=True)
        command = ['--module', module, '--format', 'thumbnails', '--timeout-ms', str(args.timeout_ms)]
        if args.base_url:
            command += ['--base-url', args.base_url]
        try:
            report = capture_slides.capture_module(capture_slides.build_parser().parse_args(command))
            reports.append({'module': module, 'requested': report['requestedCount'], 'generated': report['generatedCount'],
                            'errors': report['errors'], 'checksStatus': report['checksStatus'],
                            'coverFiles': report.get('coverFiles', []), 'report': report['report']})
        except Exception as error:
            reports.append({'module': module, 'errors': [str(error)]})
    result = {'courses': reports, 'requested': sum(r.get('requested', 0) for r in reports),
              'generated': sum(r.get('generated', 0) for r in reports)}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return int(any(r['errors'] for r in reports))


if __name__ == '__main__':
    raise SystemExit(main())

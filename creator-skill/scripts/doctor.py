#!/usr/bin/env python3
"""Diagnose dependencies without importing models, installing packages or starting services."""
from pathlib import Path
import argparse
import importlib.util
import json
import os
import shutil
import subprocess
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from _common import ROOT

GROUPS={'core':[], 'capture':['playwright','PIL'], 'upload':['oss2'], 'skill':['yaml'], 'media':[]}


def diagnose(group, tool=None):
    groups=list(GROUPS) if group=='all' else ['core',group] if group!='core' else ['core']
    checks=[{'name':'Python >= 3.10','available':sys.version_info>=(3,10),'detail':sys.version.split()[0]}, {'name':'repository modules','available':(ROOT/'modules').is_dir()}, {'name':'Node','available':bool(shutil.which('node'))}]
    packages={name for key in groups for name in GROUPS[key]}
    if tool:
        from tools import catalog
        selected=next((item for item in catalog() if item['id']==tool),None)
        if selected is None:raise ValueError(f"Unknown tool: {tool}")
        packages.update(name for name in selected['dependencies'] if name!='ffmpeg')
        if 'playwright' in packages and 'capture' not in groups:groups.append('capture')
        if 'ffmpeg' in selected['dependencies'] and 'media' not in groups:groups.append('media')
    for name in sorted(packages):
        try:present=importlib.util.find_spec(name) is not None
        except (ImportError,ValueError):present=False
        checks.append({'name':name,'available':present})
    if 'capture' in groups:
        checks.append({'name':'Vite','available':(ROOT/'node_modules/vite/bin/vite.js').is_file()})
        locations=[Path(os.environ.get('LOCALAPPDATA',''))/'ms-playwright',Path.home()/'.cache/ms-playwright']
        installed=any(any(path.glob('chromium*')) for path in locations if path.is_dir())
        browser=any((Path(os.environ.get(variable,''))/suffix).is_file() for variable,suffix in [('PROGRAMFILES','Google/Chrome/Application/chrome.exe'),('PROGRAMFILES(X86)','Microsoft/Edge/Application/msedge.exe')])
        checks.append({'name':'Chromium/Chrome/Edge candidate','available':installed or browser,'detail':'filesystem presence only; actual launch is checked by capture'})
    if 'media' in groups:checks.append({'name':'FFmpeg','available':bool(shutil.which('ffmpeg'))})
    return checks


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--group',choices=[*GROUPS,'all'],default='core')
    parser.add_argument('--tool',help='check dependencies declared by one catalog tool')
    parser.add_argument('--json',action='store_true')
    args=parser.parse_args()
    try:checks=diagnose(args.group,args.tool)
    except ValueError as exc:parser.error(str(exc))
    if args.json:print(json.dumps(checks,ensure_ascii=False,indent=2))
    else:
        for check in checks:print(f"{'OK' if check['available'] else 'MISSING'} {check['name']} {check.get('detail','')}")
    return 0 if all(check['available'] for check in checks) else 1


if __name__=='__main__':raise SystemExit(main())

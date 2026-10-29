"""Bounded standard course packages. Never execute uploaded code."""
import hashlib
import json
import re
import stat
import struct
import zlib
import unicodedata
import zipfile
from pathlib import PurePosixPath
from urllib.parse import urlsplit, unquote
from .errors import require
from .source import EXTENSIONS, MEDIA

MAX_UPLOAD = 100 * 1024 * 1024
MAX_EXPANDED = 64 * 1024 * 1024
MAX_FILE = 32 * 1024 * 1024
MAX_FILES = 2000


def safe_path(name):
    require(isinstance(name, str) and 0 < len(name) <= 180 and name == unicodedata.normalize('NFC', name)
            and name.isprintable() and not any(ord(c) in (0,34,35,37,42,58,60,62,63,92,124) for c in name)
            and not name.startswith('/') and all(p not in ('', '.', '..') and not p.startswith('.')
            and p.rstrip(' .') == p and p.split('.')[0].upper() not in {'CON','PRN','AUX','NUL',*[f'COM{i}' for i in range(1,10)],*[f'LPT{i}' for i in range(1,10)]} and p.lower() not in ('node_modules', 'api_token')
            and not p.lower().endswith(('.pem', '.key')) for p in name.split('/')),
            400, 'UNSAFE_PACKAGE_PATH', '课程包包含不安全路径、凭证或依赖目录。')
    return name


def read_zip(content):
    try:
        # Bound the central directory before ZipFile allocates one object per entry.
        content.seek(0,2);size=content.tell()
        require(0<size<=MAX_UPLOAD,413,'PACKAGE_LIMIT','ZIP 最大 100 MiB。')
        content.seek(max(0,size-65557));tail=content.read();offset=tail.rfind(b'PK'+bytes([5,6]))
        require(offset>=0 and len(tail)-offset>=22,400,'INVALID_PACKAGE','ZIP 目录无效。')
        _,disk,start_disk,local_count,count,directory_size,directory_offset,comment=struct.unpack('<4s4H2LH',tail[offset:offset+22])
        require(disk==start_disk==0 and local_count==count and 0<count<=MAX_FILES*2
                and directory_size<=2*1024*1024 and directory_offset+directory_size<=size-22
                and len(tail)-offset==22+comment,413,'PACKAGE_LIMIT','不支持跨卷、ZIP64 或超大文件目录。')
        content.seek(0)
        with zipfile.ZipFile(content) as archive:
            entries = archive.infolist()
            require(len(entries) <= MAX_FILES * 2, 413, 'PACKAGE_LIMIT', '压缩包条目过多。')
            files = [i for i in entries if not i.is_dir()]
            require(0 < len(files) <= MAX_FILES and sum(i.file_size for i in files) <= MAX_EXPANDED,
                    413, 'PACKAGE_LIMIT', '课程最多 2000 文件、展开 64 MiB。')
            seen = set(); result = {}
            for item in entries:
                name = item.orig_filename.rstrip('/')
                safe_path(name)
                require(not stat.S_ISLNK(item.external_attr >> 16) and not item.flag_bits & 1 and item.compress_type in (zipfile.ZIP_STORED,zipfile.ZIP_DEFLATED),
                        400, 'INVALID_PACKAGE', '课程包不能包含符号链接、加密文件或非标准压缩方式。')
                if item.is_dir(): continue
                require(name.casefold() not in seen, 400, 'DUPLICATE_PACKAGE_PATH', '课程包路径重复或大小写冲突。')
                seen.add(name.casefold())
                require(item.file_size <= MAX_FILE and (item.file_size < 1024*1024 or item.file_size <= max(1,item.compress_size)*250),
                        413, 'PACKAGE_LIMIT', '课程文件过大或压缩比异常。')
                result[name] = archive.read(item)
            return result
    except (zipfile.BadZipFile, RuntimeError, UnicodeError, zlib.error, EOFError, struct.error):
        require(False, 400, 'INVALID_PACKAGE', '无法读取课程 ZIP，请重新导出。')


def candidates(files):
    return sorted(name for name in files if PurePosixPath(name).name == 'outlines.json'
                  and '/shared/' not in '/'+name and '/node_modules/' not in '/'+name)


def normalize(files, selection=None, implemented_ids=None):
    choices = candidates(files)
    require(choices, 422, 'COURSE_MANIFEST_MISSING', '未找到 outlines.json 标准课程。')
    require(selection in choices if selection else len(choices) == 1, 422, 'COURSE_SELECTION_REQUIRED', '请选择一个明确的课程目录。')
    manifest = selection or choices[0]
    directory = PurePosixPath(manifest).parent
    folder = directory.name or 'Imported-Course'
    require(re.fullmatch(r'[A-Za-z0-9_-]{1,80}', folder), 422, 'INVALID_COURSE_DIRECTORY', '课程目录需使用字母、数字、短横线或下划线。')
    try: outline = json.loads(files[manifest].decode('utf-8-sig'))
    except (ValueError, UnicodeError): require(False,422,'INVALID_COURSE_MANIFEST','课程大纲不是有效 UTF-8 JSON。')
    require(isinstance(outline,dict) and isinstance(outline.get('title'),str) and 0 < len(outline['title']) <= 120,
            422,'INVALID_COURSE_MANIFEST','请填写有效课程名称。')
    module = 'modules/'+folder
    source = {}; assets = {}; total_text = 0; excluded=[]
    identity=outline.get('moduleIdentity') or {}
    require(isinstance(identity,dict),422,'INVALID_COURSE_MANIFEST','模块标识无效。')
    asset_id = identity.get('id')
    require(asset_id is None or isinstance(asset_id,str) and re.fullmatch(r'[A-Za-z0-9_-]{1,100}',asset_id),422,'INVALID_COURSE_MANIFEST','模块素材标识无效。')
    for name, data in files.items():
        safe_path(name)
        path = PurePosixPath(name)
        if path.is_relative_to(directory) and str(directory) != '.':
            mapped = module+'/'+path.relative_to(directory).as_posix()
        elif str(directory) == '.' and not name.startswith(('modules/', 'assets/')):
            mapped = module+'/'+name
        elif asset_id and ('/assets/'+str(asset_id)+'/') in '/'+name:
            mapped = 'assets/'+str(asset_id)+'/'+('/'+name).split('/assets/'+str(asset_id)+'/',1)[1]
        elif path.name.upper() in ('LICENSE','NOTICE','LICENSE.MD','LICENSE.TXT') and ('/' not in name or '/licenses/' in '/'+name):
            mapped='licenses/'+path.name
        else: continue
        safe_path(mapped)
        ext = path.suffix.lower()
        if ext in MEDIA:
            require(len(data) <= MAX_FILE,413,'PACKAGE_LIMIT','课程素材过大。'); assets[mapped] = data
        elif ext in EXTENSIONS or path.name.upper() in ('LICENSE','NOTICE'):
            if not ext: mapped += '.txt'
            try: text = data.decode('utf-8-sig')
            except UnicodeError: require(False,422,'INVALID_SOURCE','课程文本必须使用 UTF-8。')
            require(chr(0) not in text and len(data) <= 1024*1024,413,'SOURCE_LIMIT','文本文件过大或不是有效文本。')
            source[mapped] = text; total_text += len(data)
        elif 'scripts' in path.parts and ext in ('.ps1','.sh','.py','.bat'):
            excluded.append(name)  # Author tools are neither published nor executed.
        else: require(False,422,'UNSUPPORTED_PACKAGE_FILE','课程包含不支持的文件类型：'+name)
    require(total_text <= 12*1024*1024 and len(source)+len(assets) <= MAX_FILES,413,'PACKAGE_LIMIT','课程源码或文件数量超限。')
    entry = outline.get('entry'); deck = (outline.get('ppt') or {}).get('entry')
    require(isinstance(entry,str) and isinstance(deck,str),422,'COURSE_ENTRY_MISSING','标准课程需要自学入口和 ppt.entry 教学入口。')
    for name in [entry,deck]:
        safe_path(name); require(module+'/'+name in source and PurePosixPath(name).suffix in ('.tsx','.jsx','.ts','.js'),422,'COURSE_ENTRY_MISSING','课程入口文件不存在：'+name)
    original_pages = outline.get('pages')
    require(isinstance(original_pages,list) and 1 <= len(original_pages) <= 100,422,'INVALID_COURSE_PAGES','课程大纲需要 1～100 页。')
    pages = []; seen = set()
    for item in original_pages:
        require(isinstance(item,dict) and isinstance(item.get('id'),str) and 0 < len(item['id']) <= 200 and item['id'] not in seen
                and isinstance(item.get('title'),str) and 0 < len(item['title']) <= 200,422,'INVALID_COURSE_PAGES','课程页面无效或重复。')
        seen.add(item['id'])
        if implemented_ids is not None and item.get('sourceScene',item['id']) not in implemented_ids: continue
        page = {'id':item['id'],'format':'react','title':item['title'],'goal':item.get('goal',''),
                'summary':item.get('summary',item['title']),'note':'','ready':True,'designed':True,'revisions':[],'messages':[]}
        wrapper = 'entries/'+hashlib.sha256(item['id'].encode()).hexdigest()[:20]+'.tsx'
        source[wrapper] = 'import {deck} from '+json.dumps('../'+module+'/'+deck)+';export default function Page(){const scene=deck.scenes.find(s=>s.id==='+json.dumps(item.get('sourceScene',item['id']))+');if(!scene)throw new Error("页面不在 deck 中");return scene.render({complete:()=>{},reset:()=>{},isComplete:false});}'
        page['sourceEntry'] = wrapper; pages.append(page)
    require(pages,422,'NO_IMPLEMENTED_PAGES','未找到实际实现的教学页面，不能只导入占位大纲。')
    outline['pages']=[p for p in original_pages if p['id'] in {item['id'] for item in pages}]
    source[module+'/outlines.json']=json.dumps(outline,ensure_ascii=False,indent=2)
    guide = 'entries/shuku-guide.tsx'; component = PurePosixPath(entry).stem
    source[guide] = 'import React from "react";import * as guide from '+json.dumps('../'+module+'/'+entry)+';export default function Guide(){const C=guide['+json.dumps(component)+']||guide['+json.dumps(component[:1].upper()+component[1:])+']||guide.default;if(!C)throw new Error("自学入口没有组件");return React.createElement(C);}'
    return {'files':source,'assets':assets,'pages':pages,'module':module,'guide':guide,
            'summary':{'title':outline['title'],'description':str(outline.get('description') or '')[:3000],
                       'category':outline.get('category') or outline.get('badge') or '人工智能',
                       'page_count':len(pages),'planned_pages':len(original_pages)-len(pages),
                       'file_count':len(source)+len(assets),'asset_bytes':sum(map(len,assets.values())),
                       'source_module_id':asset_id,'selection':manifest,'excluded_tools':excluded}}


def github_location(url):
    require(isinstance(url,str) and len(url) <= 1200,400,'INVALID_GITHUB_URL','请输入 GitHub 课程链接。')
    value = urlsplit(url)
    require(value.scheme == 'https' and value.netloc.lower() == 'github.com' and not value.query and not value.fragment,
            400,'INVALID_GITHUB_URL','只接受 github.com 的 HTTPS 仓库或目录链接。')
    parts = unquote(value.path).strip('/').split('/')
    require(2<=len(parts)<=24 and all(re.fullmatch(r'[A-Za-z0-9_.-]+',p) and p not in ('.','..') for p in parts),400,'INVALID_GITHUB_URL','GitHub 路径无效。')
    require(len(parts)==2 or len(parts)>=4 and parts[2]=='tree',400,'INVALID_GITHUB_URL','请使用仓库或 /tree/ 课程目录链接。')
    return {'owner':parts[0],'repository':parts[1].removesuffix('.git'),'tail':'/'.join(parts[3:]) if len(parts)>2 else ''}


def choose_ref(location, refs):
    tail = location['tail']
    if not tail:
        require('HEAD' in refs,422,'GITHUB_REF_MISSING','源仓库没有默认提交。');return refs['HEAD'],''
    if re.fullmatch(r'[a-fA-F0-9]{40}',tail.split('/')[0]):return tail.split('/')[0].lower(),'/'.join(tail.split('/')[1:])
    matches = [ref for ref in refs if ref != 'HEAD' and (tail==ref or tail.startswith(ref+'/'))]
    require(matches,422,'GITHUB_REF_MISSING','未找到源分支或标签。')
    ref = max(matches,key=len); return refs[ref],tail[len(ref):].lstrip('/')

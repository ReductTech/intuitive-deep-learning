"""Managed, immutable browser source: text files only, never executable build scripts."""
from pathlib import PurePosixPath
from .errors import require

EXTENSIONS={'.tsx','.ts','.jsx','.js','.css','.json','.svg'}
SANDBOX_CSP="sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'"


def validate_source(project):
    source=project.get('source')
    react=[p for p in project['pages'] if p.get('format')=='react']
    if source is None:
        require(not react,400,'SOURCE_REQUIRED','React 页面缺少源码。')
        return {}
    require(isinstance(source,dict) and set(source)=={'files'} and isinstance(source['files'],dict),400,'INVALID_SOURCE','源码应为文件路径与文本的映射。')
    files=source['files'];require(1<=len(files)<=200,400,'SOURCE_LIMIT','源码需要 1～200 个文件。')
    total=0;normalized=set()
    for name,text in files.items():
        require(isinstance(name,str) and 0<len(name)<=180 and name.isascii() and not any(c in name for c in '\\:\x00?#%') and not name.startswith('/') and all(part not in ('','.','..') and not part.startswith('.') for part in name.split('/')),400,'UNSAFE_SOURCE_PATH','请使用安全的相对源码路径。')
        path=PurePosixPath(name)
        require(path.suffix.lower() in EXTENSIONS and not {'node_modules','.git'}&set(path.parts) and name.lower() not in normalized,400,'INVALID_SOURCE_FILE','源码文件类型不支持或路径重复。')
        normalized.add(name.lower())
        require(isinstance(text,str) and '\x00' not in text,400,'INVALID_SOURCE','源码文件必须为文本。')
        size=len(text.encode());total+=size
        require(size<=1024*1024 and total<=4*1024*1024,413,'SOURCE_LIMIT','源码大小超出限制。')
    for page in react:
        require(not page.get('nativeId') and isinstance(page.get('sourceEntry'),str) and page['sourceEntry'] in files and PurePosixPath(page['sourceEntry']).suffix in ('.tsx','.jsx','.ts','.js'),400,'INVALID_SOURCE_ENTRY','React 页面的入口文件不存在。')
    require(react,400,'SOURCE_UNUSED','请为源码指定至少一个 React 页面入口。')
    return files

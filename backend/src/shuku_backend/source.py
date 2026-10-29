"""Managed, immutable browser source: text files only, never executable build scripts."""
from pathlib import PurePosixPath
import base64
import re
from .errors import require

EXTENSIONS={'.tsx','.ts','.jsx','.js','.css','.json','.svg','.md','.txt'}
MEDIA={'.png','.jpg','.jpeg','.webp','.gif','.avif','.woff','.woff2','.ttf','.otf','.mp3','.wav','.mp4','.webm','.glb','.gltf','.bin'}
SANDBOX_CSP="sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline' data:; style-src 'unsafe-inline'; img-src 'self' data: blob: https://image.reduct.cn https://jianlun.oss-cn-hangzhou.aliyuncs.com; font-src 'self' data: https://image.reduct.cn https://jianlun.oss-cn-hangzhou.aliyuncs.com; media-src 'self' data: blob: https://image.reduct.cn https://jianlun.oss-cn-hangzhou.aliyuncs.com; connect-src 'self' data: https://image.reduct.cn https://jianlun.oss-cn-hangzhou.aliyuncs.com; frame-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'"


def validate_source(project):
    if project.get('authoringVersion') is not None:
        from .local_agent import AUTHORING
        require(project['authoringVersion']==AUTHORING['commit'],400,'UNSUPPORTED_AUTHORING_VERSION','创作工程版本不受支持，请使用专属指令准备的固定版本。')
    source=project.get('source')
    react=[p for p in project['pages'] if p.get('format')=='react']
    if source is None:
        require(not react and not project.get('sourceGuideEntry') and not project.get('authoringModule'),400,'SOURCE_REQUIRED','React 页面缺少源码。')
        return {}
    require(isinstance(source,dict) and set(source)=={'files'} and isinstance(source['files'],dict),400,'INVALID_SOURCE','源码应为文件路径与文本的映射。')
    files=source['files'];require(1<=len(files)<=500,400,'SOURCE_LIMIT','课程需要 1～500 个源码与素材文件。')
    total=0;normalized=set()
    for name,text in files.items():
        require(isinstance(name,str) and 0<len(name)<=180 and name.isprintable() and not any(c in name for c in '\\:\x00?#%<>"|*') and not name.startswith('/') and all(part not in ('','.','..') and not part.startswith('.') and part.rstrip(' .')==part for part in name.split('/')),400,'UNSAFE_SOURCE_PATH','请使用安全的相对源码路径。')
        path=PurePosixPath(name)
        require(path.suffix.lower() in EXTENSIONS|MEDIA and not {'node_modules','.git'}&set(path.parts) and name.lower() not in normalized,400,'INVALID_SOURCE_FILE','源码文件类型不支持或路径重复。')
        normalized.add(name.lower())
        require(isinstance(text,str) and '\x00' not in text,400,'INVALID_SOURCE','源码文件必须为文本。')
        size=len(text.encode());total+=size
        limit=8*1024*1024 if path.suffix.lower() in MEDIA else 1024*1024
        require(size<=limit and total<=12*1024*1024,413,'SOURCE_LIMIT','源码或素材大小超出限制：文本 1 MiB、素材编码 8 MiB、总计 12 MiB。')
        if path.suffix.lower() in MEDIA:
            match=re.fullmatch(r'data:((?:image|font|audio|video|model)/[A-Za-z0-9.+-]+|application/(?:octet-stream|font-woff|vnd.ms-fontobject));base64,([A-Za-z0-9+/=]+)',text)
            require(match,400,'INVALID_SOURCE_ASSET','普通素材必须使用 base64 data URL，不能引用服务器文件。')
            try:base64.b64decode(match[2],validate=True)
            except ValueError:require(False,400,'INVALID_SOURCE_ASSET','素材编码不正确。')
    module=project.get('authoringModule')
    require(module is None or isinstance(module,str) and re.fullmatch(r'modules/[A-Za-z0-9_-]+',module) and module+'/outlines.json' in files,400,'INVALID_SOURCE','标准课程工程目录无效。')
    guide=project.get('sourceGuideEntry')
    require(guide is None or isinstance(guide,str) and guide in files and PurePosixPath(guide).suffix in ('.tsx','.jsx','.ts','.js'),400,'INVALID_SOURCE_ENTRY','自学页面的入口文件不存在。')
    for page in react:
        require(not page.get('nativeId') and isinstance(page.get('sourceEntry'),str) and page['sourceEntry'] in files and PurePosixPath(page['sourceEntry']).suffix in ('.tsx','.jsx','.ts','.js'),400,'INVALID_SOURCE_ENTRY','React 页面的入口文件不存在。')
    require(react,400,'SOURCE_UNUSED','请为源码指定至少一个 React 页面入口。')
    return files


def validate_assets(project):
    require(project.get('sourceFormatVersion') in (None,2),400,'INVALID_SOURCE_VERSION','源码包版本不受支持。')
    assets=project.get('sourceAssets',{})
    require(isinstance(assets,dict) and len(assets)<=2000,400,'INVALID_SOURCE_ASSETS','素材清单无效。')
    total=0;names=set()
    for name,obj in assets.items():
        require(isinstance(name,str) and 0<len(name)<=180 and name.isprintable() and not any(ord(c) in (0,34,35,37,42,58,60,62,63,92,124) for c in name)
                and all(p not in ('','.','..') and not p.startswith('.') and p.rstrip(' .')==p for p in name.split('/'))
                and PurePosixPath(name).suffix.lower() in MEDIA and name.casefold() not in names,
                400,'UNSAFE_SOURCE_PATH','素材路径不安全或重复。')
        require(isinstance(obj,dict) and set(obj)=={'sha256','size','mime'} and isinstance(obj['sha256'],str) and re.fullmatch('[a-f0-9]{64}',obj['sha256'])
                and type(obj['size']) is int and 0<obj['size']<=32*1024*1024 and isinstance(obj['mime'],str)
                and re.fullmatch(r'(?:image|font|audio|video|model|application)/[A-Za-z0-9.+-]+',obj['mime']),
                400,'INVALID_SOURCE_ASSETS','素材对象无效。')
        names.add(name.casefold());total+=obj['size']
    require(total<=64*1024*1024,413,'SOURCE_ASSET_LIMIT','课程二进制素材最多 64 MiB。')
    require(not {name.casefold() for name in assets}&{name.casefold() for name in (project.get('source') or {}).get('files',{})},400,'DUPLICATE_SOURCE_PATH','源码与素材路径重复。')
    return assets

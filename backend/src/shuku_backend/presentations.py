"""Bounded PPTX import. Read OOXML text only; never execute or extract files."""
from io import BytesIO
import json
import posixpath
import re
from uuid import uuid4
from zipfile import ZipFile, BadZipFile
from xml.etree import ElementTree as ET
from .errors import BusinessError, require

MAX_UPLOAD = 20 * 1024 * 1024
NS = {'a':'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p':'http://schemas.openxmlformats.org/presentationml/2006/main',
      'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}


def read_upload(content_type,body):
    from email.parser import BytesParser
    from email.policy import default
    require(isinstance(content_type,str) and content_type.lower().startswith('multipart/form-data;') and '\r' not in content_type and '\n' not in content_type,415,'MULTIPART_REQUIRED','请使用文件上传。')
    message=BytesParser(policy=default).parsebytes(('Content-Type: '+content_type+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+body)
    require(message.is_multipart() and not message.defects,400,'INVALID_UPLOAD','文件上传格式不正确。')
    parts=list(message.iter_parts());fields={}
    require(len(parts)==2,400,'INVALID_UPLOAD','请上传课程信息和一个 PPTX 文件。')
    for part in parts:
        key=part.get_param('name',header='content-disposition')
        require(part.get_content_disposition()=='form-data' and key in ('metadata','file') and key not in fields and not part.is_multipart() and not part.defects,400,'INVALID_UPLOAD','文件上传字段不正确。')
        fields[key]=part
    require(set(fields)=={'metadata','file'},400,'INVALID_UPLOAD','缺少课程信息或 PPTX。')
    raw=fields['metadata'].get_payload(decode=True)
    require(raw is not None and len(raw)<=16384,400,'INVALID_INPUT','课程信息过大。')
    try:data=json.loads(raw)
    except (ValueError,UnicodeDecodeError):raise BusinessError(400,'INVALID_INPUT','课程信息格式不正确。')
    require(isinstance(data,dict),400,'INVALID_INPUT','课程信息格式不正确。')
    return data,fields['file'].get_payload(decode=True) or b'',fields['file'].get_filename() or ''


def parse_pptx(content, filename):
    require(isinstance(filename,str) and filename.lower().endswith('.pptx'),415,'PPTX_REQUIRED','请将 PPT 另存为 .pptx 后上传。')
    require(0<len(content)<=MAX_UPLOAD,413,'PRESENTATION_LIMIT','请选择 20 MB 以内的 PPTX 文件。')
    try:
        with ZipFile(BytesIO(content)) as archive:
            entries=archive.infolist();names=[entry.filename for entry in entries]
            require(len(entries)<=4000 and len(names)==len(set(names)),422,'INVALID_PRESENTATION','PPTX 文件结构不正确。')
            require(sum(e.file_size for e in entries)<=80*1024*1024 and all(not e.flag_bits&1 for e in entries),413,'PRESENTATION_LIMIT','PPTX 解压内容过大或已加密。')
            require(all(not n.startswith(('/','\\')) and '..' not in n.split('/') and '\\' not in n for n in names),422,'INVALID_PRESENTATION','PPTX 包含不安全路径。')
            require(not any('vbaproject' in n.lower() for n in names),422,'INVALID_PRESENTATION','请上传不含宏的 PPTX 文件。')

            def xml(name):
                require(name in names and archive.getinfo(name).file_size<=2*1024*1024,422,'INVALID_PRESENTATION','PPTX 页面缺失或内容过大。')
                raw=archive.read(name)
                normalized=raw.upper().replace(b'\x00',b'')
                require(b'<!DOCTYPE' not in normalized and b'<!ENTITY' not in normalized,422,'INVALID_PRESENTATION','PPTX XML 内容不受支持。')
                return ET.fromstring(raw)

            def relations(name):
                return {item.get('Id'):item for item in xml(name)}

            def target(base,rel,prefix):
                require(rel is not None and rel.get('TargetMode')!='External',422,'INVALID_PRESENTATION','课程页面不能引用外部地址。')
                value=posixpath.normpath(posixpath.join(base,rel.get('Target','')))
                require(value.startswith(prefix) and value.endswith('.xml') and '\\' not in value,422,'INVALID_PRESENTATION','PPTX 页面引用不正确。')
                return value

            def paragraphs(node):
                return [] if node is None else [
                    ''.join(t.text or '' for t in p.findall('.//a:t',NS)).strip()
                    for p in node.findall('.//a:p',NS)]

            presentation=xml('ppt/presentation.xml')
            rels=relations('ppt/_rels/presentation.xml.rels')
            slides=presentation.findall('p:sldIdLst/p:sldId',NS)
            require(1<=len(slides)<=100,422,'SLIDE_LIMIT','请上传包含 1～100 页的 PPTX。')
            result=[];warnings=[]
            for index,item in enumerate(slides,1):
                path=target('ppt',rels.get(item.get('{'+NS['r']+'}id')),'ppt/slides/')
                slide=xml(path);all_text=[];title=''
                for shape in slide.findall('.//p:sp',NS):
                    text='\n'.join(filter(None,paragraphs(shape)))
                    if not text:continue
                    placeholder=shape.find('p:nvSpPr/p:nvPr/p:ph',NS)
                    if not title and placeholder is not None and placeholder.get('type') in ('title','ctrTitle'):title=text
                # Includes tables and grouped shapes, in document order.
                all_text=list(filter(None,paragraphs(slide)))
                title=(title or (all_text[0] if all_text else f'第 {index} 页'))[:120]
                body='\n'.join(all_text)
                if body.startswith(title):body=body[len(title):].strip()
                notes=[];notes_path=posixpath.dirname(path)+'/_rels/'+posixpath.basename(path)+'.rels'
                if notes_path in names:
                    note_rels=relations(notes_path)
                    for relation in note_rels.values():
                        if (relation.get('Type') or '').endswith('/notesSlide'):
                            node=xml(target(posixpath.dirname(path),relation,'ppt/notesSlides/'))
                            for shape in node.findall('.//p:sp',NS):
                                ph=shape.find('p:nvSpPr/p:nvPr/p:ph',NS)
                                if ph is not None and ph.get('type') in ('sldNum','hdr','ftr','dt'):continue
                                notes.extend(filter(None,paragraphs(shape)))
                note='\n'.join(notes)
                require(len(body)<=10000 and len(note)<=10000,422,'SLIDE_TEXT_LIMIT',f'第 {index} 页文字过多，请精简后上传。')
                if not all_text:warnings.append(f'第 {index} 页未读取到文字，请补充图片中的内容。')
                result.append({'title':title,'body':body,'notes':note})
            return {'filename':re.split(r'[/\\]',filename)[-1][:180],'slides':result,'warnings':warnings}
    except BusinessError:raise
    except (BadZipFile,ET.ParseError,KeyError,ValueError,RuntimeError,NotImplementedError,EOFError,OSError):
        raise BusinessError(422,'INVALID_PRESENTATION','PPTX 文件损坏或无法读取，请重新另存后上传。')


def project_from_presentation(parsed, title, description, alias):
    pages=[]
    for index,slide in enumerate(parsed['slides']):
        suggestions=['将本页重点改成一个可探索的问题。']
        if not slide['body']:suggestions=['补充本页要讲清楚的内容，再选择视觉方案。']
        elif len(slide['body'])>500:suggestions=['本页文字较多，可以拆成几个步骤或加入图解。']
        else:suggestions.append('加入一个贴近日常的案例或动手任务。')
        state={'phase':'choices','audience':'初学者','description':description,'imported':True,
               'reference':slide,'suggestions':suggestions,'confirmed':False}
        pages.append({'id':str(uuid4()),'format':'text','title':slide['title'],'summary':slide['body'],
                      'goal':'理解本页的核心内容','note':'','ready':False,'designed':False,
                      'revisions':[],'messages':[],'outline':{'guided':state}})
    return {'version':1,'id':str(uuid4()),'courseId':alias,'title':title,'duration':20,'style':'简洁图解',
            'outlineConfirmed':False,'pages':pages,
            'presentation':{'filename':parsed['filename'],'slideCount':len(pages),'warnings':parsed['warnings']}}


def import_course(flow,uid,data,content,filename):
    # Permission is checked before expensive parsing; creation and first revision commit together.
    with flow.store.transaction() as db:
        require(flow.store.user_in(db,uid)['role'] in ('creator','admin'),403,'FORBIDDEN','当前账号没有创建权限。')
    parsed=parse_pptx(content,filename)
    with flow.store.transaction() as db:
        db.file_reference_lock(shared=True)
        course=flow.store.create_course(uid,data,flow.clock(),flow.github,db=db)
        module=flow.module_context(course['module_id'])
        project=project_from_presentation(parsed,course['title'],course['description'],module['alias'])
        original={**flow.bucket.put(content),'mime':'application/vnd.openxmlformats-officedocument.presentationml.presentation'}
        revision=flow.save_in(db,uid,course['id'],{'project':project,'expected_revision':None},materials={'materials/original.pptx':original})
        return {'course':course,'revision':revision}

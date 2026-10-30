import io
import json
import stat
import zipfile
import pytest
from shuku_backend.course_package import read_zip,normalize,github_location,choose_ref,MAX_EXPANDED
from shuku_backend.errors import BusinessError
from shuku_backend.source import validate_assets


def package(prefix='modules/Demo/'):
    outline={'title':'导入测试','entry':'Guide.tsx','ppt':{'entry':'Deck.tsx'},'moduleIdentity':{'id':'original-uuid'},
             'pages':[{'id':'one','title':'第一课'},{'id':'planned','title':'尚未实现'}]}
    return {prefix+'outlines.json':json.dumps(outline).encode(),prefix+'Guide.tsx':b'export function Guide(){return <p>Guide</p>}',
            prefix+'Deck.tsx':b'export const deck={scenes:[{id:"one",render:()=>null}]}',
            prefix+'assets/image.png':b'\x89PNG\r\n\x1a\n','assets/original-uuid/font.woff2':b'font','LICENSE':b'MIT'}


def test_zip_and_github_file_maps_share_conversion_and_preserve_original_assets():
    files=package();archive=io.BytesIO()
    with zipfile.ZipFile(archive,'w') as z:
        for name,data in files.items():z.writestr(name,data)
    archive.seek(0)
    assert read_zip(archive)==files
    result=normalize(files,implemented_ids=['one'])
    assert [p['id'] for p in result['pages']]==['one']
    assert result['summary']['planned_pages']==1
    assert 'assets/original-uuid/font.woff2' in result['assets']
    assert result['files']['licenses/LICENSE.txt']=='MIT'
    assert len(json.loads(result['files']['modules/Demo/outlines.json'])['pages'])==1
    assert 'font' not in result['files']
    with pytest.raises(BusinessError,match='请选择'):normalize({**files,**package('modules/Other/')})
    assert normalize({**files,**package('modules/Other/')},'modules/Demo/outlines.json',['one'])['module']=='modules/Demo'


@pytest.mark.parametrize('name',['../outside.ts','/root.ts','a/../../root.ts','a\\b.ts','a/.env','a/node_modules/x.js','a/key.pem'])
def test_zip_rejects_unsafe_paths(name):
    archive=io.BytesIO()
    with zipfile.ZipFile(archive,'w') as z:
        item=zipfile.ZipInfo('safe.ts');item.filename=name;z.writestr(item,b'x')
    archive.seek(0)
    with pytest.raises(BusinessError):read_zip(archive)


def test_zip_rejects_links_case_collisions_and_bombs():
    for entries in [('Course/a.ts','Course/A.ts'),('link',),('bomb.txt',)]:
        archive=io.BytesIO()
        with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
            for name in entries:
                item=zipfile.ZipInfo(name);item.compress_type=zipfile.ZIP_DEFLATED
                if name=='link':item.external_attr=(stat.S_IFLNK|0o777)<<16
                z.writestr(item,b'x'*(1024*1024+1) if name=='bomb.txt' else b'x')
        archive.seek(0)
        with pytest.raises(BusinessError):read_zip(archive)


def test_github_source_url_and_long_branch_resolution():
    location=github_location('https://github.com/org/repo/tree/feature/course/modules/Demo')
    assert choose_ref(location,{'feature':'a','feature/course':'b'})==('b','modules/Demo')
    for url in ['http://github.com/org/repo','https://github.com.evil/org/repo','https://root@github.com/org/repo','https://github.com/org/repo?token=secret','https://github.com/org/repo/tree/main/%2e%2e/private']:
        with pytest.raises(BusinessError):github_location(url)


def test_binary_manifest_rejects_arbitrary_bucket_references_and_collisions():
    obj={'sha256':'a'*64,'size':4,'mime':'image/png'}
    assert validate_assets({'sourceAssets':{'modules/Demo/photo.png':obj}})
    for project in [{'sourceAssets':{'../photo.png':obj}}, {'sourceAssets':{'photo.ts':obj}}, {'sourceAssets':{'photo.png':{**obj,'size':True}}}, {'sourceAssets':{'photo.png':obj},'source':{'files':{'photo.png':'text'}}}]:
        with pytest.raises(BusinessError):validate_assets(project)

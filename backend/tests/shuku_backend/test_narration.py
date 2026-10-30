import io
import json
from concurrent.futures import ThreadPoolExecutor
import pytest
from shuku_backend.narration import Narration
from shuku_backend.errors import BusinessError

def test_cache_concurrency_and_voice_invalidation(tmp_path):
    requests=[]
    def upstream(request,timeout):
        requests.append(json.loads(request.data))
        assert request.get_header('Authorization')=='Bearer test-key'
        assert request.full_url=='https://api.minimax.io/v1/t2a_v2'
        return io.BytesIO(json.dumps({'base_resp':{'status_code':0},'data':{'audio':'494433'}}).encode())
    env={'MINIMAX_API_KEY':'test-key'}
    service=Narration(tmp_path,env,upstream)
    with ThreadPoolExecutor(4) as pool:
        assert list(pool.map(lambda _:service.synthesize({'text':'测试讲稿'}),range(4)))==[b'ID3']*4
    assert len(requests)==1
    assert requests[0]['voice_setting']['speed']==1
    assert Narration(tmp_path,{},upstream).synthesize({'text':'测试讲稿'})==b'ID3'
    env['MINIMAX_VOICE_ID']='other'
    service.synthesize({'text':'测试讲稿'})
    assert len(requests)==2

@pytest.mark.parametrize('body',[{}, {'text':''}, {'text':' '*10}, {'text':123}, {'text':'x'*10001}, {'text':'hi','voice':'extra'}])
def test_invalid_input(tmp_path,body):
    with pytest.raises(BusinessError) as e:Narration(tmp_path,{}).synthesize(body)
    assert e.value.status==400

def test_missing_key_and_safe_error_no_cache(tmp_path):
    with pytest.raises(BusinessError) as e:Narration(tmp_path,{}).synthesize({'text':'hi'})
    assert e.value.code=='NARRATION_CONFIG'
    def upstream(*args,**kwargs):raise RuntimeError('secret-key')
    with pytest.raises(BusinessError) as e:Narration(tmp_path,{'MINIMAX_API_KEY':'secret-key'},upstream).synthesize({'text':'hi'})
    assert 'secret-key' not in str(e.value)
    assert not list(tmp_path.glob('*.mp3'))

def test_malformed_audio_is_not_cached(tmp_path):
    service=Narration(tmp_path,{'MINIMAX_API_KEY':'key'},lambda *a,**k:io.BytesIO(b'{"base_resp":{"status_code":0},"data":{"audio":"xyz"}}'))
    with pytest.raises(BusinessError):service.synthesize({'text':'hi'})
    assert not list(tmp_path.glob('*.mp3'))


def test_settings_file_and_environment_priority(tmp_path):
    from shuku_backend.narration import load_narration_env
    path=tmp_path/'settings.json'
    path.write_text(json.dumps({'env':{'MINIMAX_API_KEY':'file-key','MINIMAX_MODEL':'file-model','ANTHROPIC_AUTH_TOKEN':'other-secret'}}),encoding='utf-8')
    assert load_narration_env(path,{})=={'MINIMAX_API_KEY':'file-key','MINIMAX_MODEL':'file-model'}
    assert load_narration_env(path,{'MINIMAX_API_KEY':'env-key','MINIMAX_MODEL':''})=={'MINIMAX_API_KEY':'env-key','MINIMAX_MODEL':'file-model'}

def test_narration_loads_settings_without_explicit_env(tmp_path,monkeypatch):
    from shuku_backend.narration import NARRATION_KEYS
    for key in NARRATION_KEYS:monkeypatch.delenv(key,raising=False)
    path=tmp_path/'settings.json'
    path.write_text(json.dumps({'env':{'MINIMAX_API_KEY':'file-key','MINIMAX_MODEL':'configured-model'}}),encoding='utf-8')
    def upstream(request,timeout):
        assert request.get_header('Authorization')=='Bearer file-key'
        assert json.loads(request.data)['model']=='configured-model'
        return io.BytesIO(b'{"base_resp":{"status_code":0},"data":{"audio":"494433"}}')
    assert Narration(tmp_path/'cache',opener=upstream,settings_path=path).synthesize({'text':'配置测试'})==b'ID3'

def test_invalid_settings_have_safe_errors(tmp_path):
    from shuku_backend.narration import load_narration_env
    path=tmp_path/'settings.json'
    path.write_text('{broken-secret',encoding='utf-8')
    with pytest.raises(BusinessError) as error:load_narration_env(path,{})
    assert 'broken-secret' not in str(error.value)
    assert load_narration_env(tmp_path/'missing.json',{'MINIMAX_API_KEY':'env-key'})=={'MINIMAX_API_KEY':'env-key'}


def test_voice_and_speed_reach_provider_and_cache_separately(tmp_path):
    requests=[]
    def upstream(request,timeout):
        requests.append(json.loads(request.data)['voice_setting'])
        return io.BytesIO(b'{"base_resp":{"status_code":0},"data":{"audio":"494433"}}')
    service=Narration(tmp_path,{'MINIMAX_API_KEY':'key'},upstream)
    body={'text':'音色语速测试','voiceId':'Chinese (Mandarin)_Reliable_Executive','rate':.9}
    service.synthesize(body);service.synthesize(body)
    service.synthesize({**body,'rate':1.1})
    service.synthesize({**body,'voiceId':'Chinese (Mandarin)_IntellectualGirl'})
    assert len(requests)==3
    assert requests[0]['voice_id']==body['voiceId'] and requests[0]['speed']==.9
    assert requests[1]['speed']==1.1

@pytest.mark.parametrize('options',[{'rate':0},{'rate':2},{'rate':True},{'rate':'1'},{'voiceId':'bad/voice'},{'voiceId':123}])
def test_invalid_playback_options(tmp_path,options):
    with pytest.raises(BusinessError) as error:Narration(tmp_path,{}).synthesize({'text':'测试',**options})
    assert error.value.status==400

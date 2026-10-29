"""MiniMax narration, matching Creator-Showcase's t2a_v2 voice settings."""
from hashlib import sha256
import json
import os
from pathlib import Path
import threading
from urllib.request import Request, urlopen
from .errors import BusinessError, require

NARRATION_KEYS=('MINIMAX_API_KEY','MINIMAX_API_BASE','MINIMAX_MODEL','MINIMAX_VOICE_ID','MINIMAX_VOICE_LABEL')

def load_narration_env(settings_path=None, environ=None):
    """Use the repository's private settings.json; environment overrides nonempty values."""
    if settings_path is None:
        from idl_backend.config import repository_root
        settings_path=repository_root()/'settings.json'
    path=Path(settings_path)
    values={}
    if path.is_file():
        try:document=json.loads(path.read_text(encoding='utf-8-sig'))
        except (ValueError,UnicodeDecodeError,OSError):
            raise BusinessError(503,'NARRATION_CONFIG','settings.json 无法读取或 JSON 格式不正确。') from None
        require(isinstance(document,dict) and isinstance(document.get('env',{}),dict),503,'NARRATION_CONFIG','settings.json 应包含 env 配置对象。')
        values={key:value.strip() for key,value in document.get('env',{}).items() if key in NARRATION_KEYS and isinstance(value,str) and value.strip()}
    source=os.environ if environ is None else environ
    values.update({key:source[key].strip() for key in NARRATION_KEYS if isinstance(source.get(key),str) and source[key].strip()})
    return values

class Narration:
    def __init__(self, directory, env=None, opener=urlopen, settings_path=None):
        self.directory=Path(directory)
        self.env=load_narration_env(settings_path) if env is None else env
        self.opener=opener
        self.slots=threading.BoundedSemaphore(2)
        self.locks=[threading.Lock() for _ in range(32)]
        self.bucket=None

    def synthesize(self, body):
        text=body.get('text')
        require(not set(body)-{'text','rate','voiceId'} and isinstance(text,str) and 0<len(text.strip())<=10000,400,'INVALID_INPUT','讲稿应为 1–10000 字。')
        model=self.env.get('MINIMAX_MODEL') or 'speech-2.8-hd'
        voice=body.get('voiceId') or self.env.get('MINIMAX_VOICE_ID') or 'Chinese (Mandarin)_IntellectualGirl'
        rate=body.get('rate',1)
        require(isinstance(voice,str) and 0<len(voice)<=160 and all(c.isalnum() or c in ' _().-' for c in voice),400,'INVALID_INPUT','音色参数不正确。')
        require(isinstance(rate,(int,float)) and not isinstance(rate,bool) and .8<=rate<=1.2,400,'INVALID_INPUT','语速应为 0.8–1.2 倍。')
        payload={'model':model,'text':text.strip(),'stream':False,'language_boost':'Chinese','output_format':'hex',
                 'voice_setting':{'voice_id':voice,'speed':rate,'vol':1,'pitch':0},
                 'audio_setting':{'sample_rate':32000,'bitrate':128000,'format':'mp3','channel':1}}
        data=json.dumps(payload,ensure_ascii=False).encode()
        key=sha256(data).hexdigest()
        file=self.directory/(key+'.mp3')
        with self.locks[int(key[:4],16)%len(self.locks)]:
            if self.bucket:
                cached=self.bucket.read_named('narration/'+key+'.mp3')
                if cached is not None:return cached
            elif file.is_file():return file.read_bytes()
            api_key=self.env.get('MINIMAX_API_KEY','')
            require(api_key,503,'NARRATION_CONFIG','请在 settings.json 的 env 中配置 MINIMAX_API_KEY 并重启服务，或选择浏览器朗读。')
            require(self.env.get('MINIMAX_API_BASE','https://api.minimax.io/v1').rstrip('/')=='https://api.minimax.io/v1',503,'NARRATION_CONFIG','请使用 MiniMax 官方国际站接口。')
            require(self.slots.acquire(blocking=False),429,'NARRATION_BUSY','正在准备其他配音，请稍后重试。')
            try:
                request=Request('https://api.minimax.io/v1/t2a_v2',data=data,headers={'Authorization':'Bearer '+api_key,'Content-Type':'application/json'})
                try:
                    with self.opener(request,timeout=90) as response:result=json.load(response)
                except Exception:
                    raise BusinessError(502,'NARRATION_FAILED','MiniMax 请求失败，请检查网络、密钥与账户余额后重试。') from None
                require(result.get('base_resp',{}).get('status_code')==0,502,'NARRATION_FAILED','MiniMax 配音失败，请检查密钥、账户余额与权限。')
                audio=result.get('data',{}).get('audio')
                import re
                require(isinstance(audio,str) and len(audio)>0 and len(audio)%2==0 and re.fullmatch('[a-fA-F0-9]+',audio),502,'NARRATION_FAILED','MiniMax 未返回有效音频，请重试。')
                content=bytes.fromhex(audio)
                if self.bucket:
                    self.bucket.put_named('narration/'+key+'.mp3',content)
                    return content
                self.directory.mkdir(parents=True,exist_ok=True)
                temporary=file.with_suffix('.tmp')
                temporary.write_bytes(content);temporary.replace(file)
                return content
            finally:self.slots.release()


def main():
    """Local preview adapter: private settings in, raw MP3 out; no database required."""
    import sys
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument('--cache-dir',required=True)
    args=parser.parse_args()
    try:
        raw=sys.stdin.buffer.read(65537)
        require(0<len(raw)<=65536,413,'BODY_LIMIT','配音请求过大或为空。')
        try:body=json.loads(raw)
        except (ValueError,UnicodeDecodeError):raise BusinessError(400,'INVALID_JSON','JSON 格式不正确。') from None
        require(isinstance(body,dict),400,'INVALID_INPUT','请使用 JSON 对象。')
        content=Narration(args.cache_dir).synthesize(body)
        sys.stdout.buffer.write(content)
    except BusinessError as error:
        sys.stderr.write(json.dumps({'status':error.status,'error':str(error),'code':error.code},ensure_ascii=False))
        sys.exit(1)
    except Exception:
        sys.stderr.write(json.dumps({'status':503,'error':'本地配音服务暂时不可用，请重试。'},ensure_ascii=False))
        sys.exit(1)

if __name__=='__main__':main()

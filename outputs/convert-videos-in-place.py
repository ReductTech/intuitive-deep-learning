from pathlib import Path
from hashlib import sha256
import json
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root.parent / 'creator-skill/scripts'))
from media.prepare_videos import dimensions, video_stream, verify, duration

ffprobe = next((Path.home() / 'AppData/Local/Microsoft/WinGet/Packages').rglob('ffprobe.exe'))
ffmpeg = ffprobe.with_name('ffmpeg.exe')
checks = json.loads((root / 'outputs/original-course-checks.json').read_text(encoding='utf-8'))
cache, rows = {}, []

def run(args, data=None):
    result = subprocess.run([str(args[0]), *map(str,args[1:])], input=data, capture_output=True)
    if result.returncode:
        raise ValueError(result.stderr.decode('utf-8',errors='replace')[-6000:])
    return result.stdout

for issue in checks['media']:
    if issue['status'] != 'failed':
        continue
    file = root / issue['path']
    assert file.resolve().is_relative_to((root/'modules').resolve()) and file.suffix == '.mp4'
    raw = file.read_bytes()
    key = sha256(raw).hexdigest()
    original = json.loads(run([ffprobe,'-v','error','-show_streams','-show_format','-of','json',file]))
    size = dimensions(video_stream(original))
    try:
        verify(original,original,size)
        continue
    except ValueError:
        pass
    if key not in cache:
        encoded = run([ffmpeg,'-hide_banner','-loglevel','error','-nostdin','-xerror','-err_detect','explode',
            '-i',file,'-map','0:V:0','-map','0:a:0?','-sn','-dn','-vf',f'scale={size[0]}:{size[1]},setsar=1',
            '-fpsmax:v','30','-c:v','libx264','-preset','slow','-crf','24','-threads','2','-pix_fmt','yuv420p',
            '-tag:v','avc1','-c:a','aac','-b:a','96k','-ac','2','-map_metadata','-1','-map_chapters','-1',
            '-movflags','+frag_keyframe+empty_moov','-f','mp4','pipe:1'])
        doc = json.loads(run([ffprobe,'-v','error','-show_streams','-show_format','-show_packets','-of','json','-i','pipe:0'],encoded))
        # Non-seekable fragmented MP4 probing reports the first fragment's duration.
        # Read every packet and validate the full presentation timeline in memory.
        for stream in doc['streams']:
            packets = [packet for packet in doc['packets'] if packet['stream_index'] == stream['index'] and 'pts_time' in packet]
            start = min(float(packet['pts_time']) for packet in packets)
            end = max(float(packet['pts_time']) + float(packet.get('duration_time',0)) for packet in packets)
            stream['duration'] = str(end-start)
        doc.pop('packets')
        try:
            verify(doc,original,size)
        except ValueError:
            print(json.dumps({'path':issue['path'],'beforeDuration':duration(original),'afterDuration':duration(doc),'streams':doc['streams']},ensure_ascii=False),flush=True)
            raise
        run([ffmpeg,'-v','error','-nostdin','-xerror','-err_detect','explode','-i','pipe:0','-map','0:v:0','-map','0:a:0?','-f','null','-'],encoded)
        cache[key] = encoded
    encoded = cache[key]
    assert sha256(file.read_bytes()).hexdigest() == key
    file.write_bytes(encoded)
    rows.append({'path':issue['path'],'beforeBytes':len(raw),'afterBytes':len(encoded),'status':'passed'})
    (root/'outputs/videos-in-place.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
    print('Converted original video: '+issue['path'],flush=True)
print(json.dumps({'converted':len(rows),'uniqueEncodes':len(cache)}),flush=True)

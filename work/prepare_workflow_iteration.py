from pathlib import Path
import json, shutil
root=Path('modules/Creator-Guide/components/workflow')
source=json.loads(Path('modules/Convolution-Kernel-Intro/outlines.json').read_text(encoding='utf-8'))
pages=[{k:p[k] for k in ['id','title','goal','summary','interaction','next','snippet']} for p in source['pages']]
(root/'convolutionOutline.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assets=Path('assets/444f8951-dd2e-42dc-94e5-c5a878618631/workflow');assets.mkdir(exist_ok=True)
shutil.copyfile('C:/Users/Ocean/.codex/generated_images/01a1666f-1dfd-7242-9363-eef1cd5f8fbd/exec-e3978331-29c7-4dff-8fe5-8e9027096e21.png',assets/'gomoku-design-draft.png')
shutil.copyfile('C:/Users/Ocean/AppData/Local/Temp/codex-clipboard-6958ba9a-1c35-474c-94ee-cf5618a461a0.png',assets/'gomoku-design-refined.png')

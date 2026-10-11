import os
os.environ['KMP_DUPLICATE_LIB_OK']='TRUE'
import sys
sys.path.insert(0,r'C:\Users\Ocean\Documents\GitHub\intuitive-deep-learning\backend\src')
from idl_backend.tools.content import export_pretrained_gradcam_lesson as e
from onnx2torch import convert
import onnx,torch,numpy as np,json
from PIL import Image,ImageDraw
from torch.nn import functional as F

torch.set_num_threads(2)
model=convert(onnx.load(e.MODELS/'sface.onnx')).eval()
refs={p:F.normalize(model(e.pixels(Image.open(e.OUT/f'pretrained-{p}'/'reference.png'),112)),dim=1).detach() for p in ['jackie','avril']}
regions={'forehead':(32,10,80,40),'eyes':(24,40,90,62),'nose_cheeks':(24,62,90,85),'mouth':(30,85,85,106),'left_hair':(0,10,22,100),'right_hair':(90,10,112,100)}
results={}
for person in ['jackie','avril']:
 x=e.pixels(Image.open(e.OUT/f'pretrained-{person}'/'recognition-input.png'),112)
 other='avril' if person=='jackie' else 'jackie'
 def score(v):
  z=F.normalize(model(v),dim=1)
  return torch.cat([(z*refs[person]).sum().reshape(1),(z*refs[other]).sum().reshape(1)])
 baseline=score(x).detach()
 drops={}
 for name,(x0,y0,x1,y1) in regions.items():
  occluded=x.clone()
  occluded[:,:,y0:y1,x0:x1]=x[:,:,y0:y1,x0:x1].mean((2,3),keepdim=True)
  drops[name]=(baseline-score(occluded).detach()).tolist()
 results[person]={'same_and_other_scores':baseline.tolist(),'occlusion_score_drops':drops}
 # Standard Grad-CAM for both targets and layers, retained for diagnosis only.
 sheet=Image.new('RGB',(3*260,2*290),'white');draw=ImageDraw.Draw(sheet)
 for row,target in enumerate(['same','same_minus_other']):
  for col,layer in enumerate(['conv_12_relu','conv_13_relu','conv_14_relu']):
   features=[]
   hook=model.get_submodule(layer).register_forward_hook(lambda m,a,o:features.append(o))
   z=F.normalize(model(x.requires_grad_(True)),dim=1);hook.remove()
   s=(z*refs[person]).sum()
   if row:s=s-(z*refs[other]).sum()
   grad=torch.autograd.grad(s,features[0])[0]
   alpha=grad[0].mean((1,2))
   cam=F.relu((alpha[:,None,None]*features[0][0]).sum(0)).detach()
   cam/=cam.max().clamp_min(1e-12)
   cam=F.interpolate(cam[None,None],(240,240),mode='bilinear',align_corners=False)[0,0].numpy()
   base=np.asarray(Image.open(e.OUT/f'pretrained-{person}'/'input.png').resize((240,240)))/255
   color=np.stack([np.ones_like(cam),np.clip(1.8-1.8*cam,0,1),np.zeros_like(cam)],-1)
   opacity=cam[:,:,None]*.68
   out=np.uint8((base*(1-opacity)+color*opacity)*255)
   sheet.paste(Image.fromarray(out),(col*260,row*290+35))
   draw.text((col*260,row*290+10),target+' '+layer,fill='black')
 sheet.save(e.ROOT/'work'/f'gradcam-diagnostic-{person}.png')
print(json.dumps(results,indent=2))
(e.ROOT/'work'/'gradcam-diagnostic.json').write_text(json.dumps(results,indent=2))
"""Bounded, reproducible CPU training and genuine Grad-CAM assets for the lesson.

Offline asset exporter; does not launch a training or HTTP service.
"""
import os
os.environ.setdefault('KMP_DUPLICATE_LIB_OK', 'TRUE')
os.environ.setdefault('OMP_NUM_THREADS', '2')
os.environ.setdefault('MKL_NUM_THREADS', '2')
from pathlib import Path
import copy
import hashlib
import json
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F
from PIL import Image

from idl_backend.config import repository_root, data_directory, model_directory
ROOT = repository_root()
DATA = data_directory() / 'lfw-50-balanced'
OUT = ROOT / 'assets/80396753-7fc8-4f55-9188-bddbdb828169/gradcam'
MODELS = model_directory() / '80396753-7fc8-4f55-9188-bddbdb828169/gradcam'
SEED = 205023
torch.manual_seed(SEED)
torch.set_num_threads(2)
np.random.seed(SEED)

class FaceCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.front = nn.Sequential(nn.Conv2d(3,16,3,padding=1),nn.ReLU(),nn.MaxPool2d(2),nn.Conv2d(16,32,3,padding=1),nn.ReLU(),nn.MaxPool2d(2))
        self.last = nn.Sequential(nn.Conv2d(32,48,3,padding=1),nn.ReLU())
        self.embedding = nn.Sequential(nn.AdaptiveAvgPool2d((4,3)),nn.Flatten(),nn.Linear(48*4*3,64),nn.ReLU(),nn.Linear(64,32))
        self.classifier = nn.Linear(32,12)
    def forward(self,x):
        a=self.last(self.front(x))
        z=self.embedding(a)
        return self.classifier(z), F.normalize(z,dim=1), a

def heat(values):
    v=np.clip(values,0,1)
    return np.stack([np.clip(1.5-np.abs(4*v-3),0,1),np.clip(1.5-np.abs(4*v-2),0,1),np.clip(1.5-np.abs(4*v-1),0,1)],-1)

def normalize(values):
    values=np.maximum(values,0)
    return values/(values.max()+1e-12)

def save_cam(model, x, reference, identity, folder, mode):
    model.eval()
    logits,embedding,a=model(x)
    if mode=='classification': score=logits[0,identity]
    else:
        with torch.no_grad(): ref=model(reference)[1]
        score=(embedding*ref).sum()
    gradient=torch.autograd.grad(score,a)[0]
    alpha=gradient[0].mean((1,2))
    raw=F.relu((alpha[:,None,None]*a[0]).sum(0))
    if raw.max()<=1e-10: raise ValueError(f'No positive Grad-CAM contribution for {mode}')
    cam=normalize(raw.detach().numpy())
    color=heat(cam)
    Image.fromarray(np.uint8(color*255)).resize((282,372),Image.Resampling.BILINEAR).save(folder/f'{mode}-heat.png')
    full=F.interpolate(torch.from_numpy(cam)[None,None],size=(62,47),mode='bilinear',align_corners=False)[0,0].numpy()
    base=np.asarray(Image.open(folder/'input.png')).astype(float)/255
    overlay=np.clip(.55*base+.45*heat(full),0,1)
    Image.fromarray(np.uint8(overlay*255)).resize((282,372),Image.Resampling.BILINEAR).save(folder/f'{mode}-overlay.png')
    indices=torch.topk(alpha,3).indices.tolist()
    channels=[]
    for k in indices:
        activation=a[0,k].detach().numpy()
        Image.fromarray(np.uint8(heat(normalize(activation))*255)).resize((144,176),Image.Resampling.NEAREST).save(folder/f'{mode}-channel-{k}.png')
        channels.append({'index':k,'alpha':float(alpha[k]),'image':f'{mode}-channel-{k}.png'})
    np.savez_compressed(folder/f'{mode}-raw.npz',activations=a[0].detach().numpy(),gradients=gradient[0].detach().numpy(),alpha=alpha.detach().numpy(),cam=cam)
    return {'score':float(score.detach()),'channels':channels,'heat':f'{mode}-heat.png','overlay':f'{mode}-overlay.png'}

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    images=np.load(DATA/'lfw_50_balanced_images.npy')
    labels=torch.from_numpy(np.load(DATA/'lfw_50_balanced_target.npy')).long()
    names=np.load(DATA/'lfw_50_balanced_target_names.npy').tolist()
    train=np.load(DATA/'lfw_50_balanced_train_indices.npy')
    val=np.load(DATA/'lfw_50_balanced_val_indices.npy')
    tensor=torch.from_numpy(images.copy()).permute(0,3,1,2).float()/255
    mean=tensor[train].mean((0,2,3),keepdim=True)
    std=tensor[train].std((0,2,3),keepdim=True).clamp_min(1e-5)
    x=(tensor-mean)/std
    classification=FaceCNN()
    optimizer=torch.optim.Adam(classification.parameters(),lr=.003)
    history=[]
    for epoch in range(60):
        classification.train()
        total=0
        order=torch.randperm(len(train))
        for start in range(0,len(train),64):
            idx=train[order[start:start+64].numpy()]
            optimizer.zero_grad()
            loss=F.cross_entropy(classification(x[idx])[0],labels[idx])
            loss.backward();optimizer.step();total+=float(loss.detach())
        if epoch%10==9: print('classification',epoch+1,round(total,3),flush=True)
    triplet=copy.deepcopy(classification)
    optimizer=torch.optim.Adam(triplet.parameters(),lr=.0007)
    # Balanced identity batches ensure valid positives and negatives for each anchor.
    groups=[train[labels[train].numpy()==i] for i in range(12)]
    for epoch in range(20):
        triplet.train();total=0
        for _ in range(10):
            idx=np.concatenate([np.random.choice(g,4,replace=False) for g in groups])
            optimizer.zero_grad()
            z=triplet(x[idx])[1]
            distance=torch.cdist(z,z)
            same=labels[idx,None]==labels[idx][None,:]
            same.fill_diagonal_(False)
            positive=distance.masked_fill(~same,-1).max(1).values
            negative=distance.masked_fill(labels[idx,None]==labels[idx][None,:],10).min(1).values
            loss=F.relu(positive-negative+.3).mean()
            loss.backward();optimizer.step();total+=float(loss.detach())
        if epoch%5==4: print('triplet',epoch+1,round(total,3),flush=True)
    results=[]
    for model in [classification,triplet]:
        model.eval()
        with torch.no_grad(): results.append(float((model(x[val])[0].argmax(1)==labels[val]).float().mean()))
    samples=[]
    for identity in [1,3]:
        choices=val[labels[val].numpy()==identity]
        first,second=int(choices[0]),int(choices[1])
        folder=OUT/f'sample-{identity}';folder.mkdir(exist_ok=True)
        Image.fromarray(images[first]).save(folder/'input.png')
        Image.fromarray(images[second]).save(folder/'reference.png')
        item={'id':f'sample-{identity}','name':names[identity],'inputIndex':first,'referenceIndex':second,'input':'input.png','reference':'reference.png'}
        for mode,model in [('classification',classification),('triplet',triplet)]: item[mode]=save_cam(model,x[first:first+1],x[second:second+1],identity,folder,mode)
        samples.append(item)
    for name,model in [('classification',classification),('triplet',triplet)]:
        MODELS.mkdir(parents=True, exist_ok=True)
        torch.save({'state_dict':model.state_dict(),'mean':mean,'std':std,'seed':SEED},MODELS/f'{name}.pt')
    record={'seed':SEED,'dataset':'lfw-50-balanced','trainingSamples':len(train),'validationSamples':len(val),'classificationEpochs':60,'tripletEpochs':20,'tripletMargin':.3,'architecture':'Conv16-ReLU-Pool-Conv32-ReLU-Pool-Conv48-ReLU-AdaptivePool4x3-Flatten-Linear64-ReLU-Linear32','targetLayer':'last (48 channels, 15 x 11)','classificationValidationAccuracy':results[0],'tripletInitialization':'classification checkpoint; then triplet-only fine-tuning','classificationTarget':'specified identity pre-softmax logit','tripletTarget':'cosine similarity to a fixed other photograph of the same identity; reference branch detached','samples':samples,'sourceManifestSha256':hashlib.sha256((DATA/'lfw_50_balanced_manifest.json').read_bytes()).hexdigest(),'references':['https://arxiv.org/abs/1610.02391','https://arxiv.org/abs/1709.01507'],'limitations':'Small teaching models; outputs do not establish which training objective yields better identity verification. Grad-CAM maps are normalized independently.'}
    (OUT/'record.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'accuracy':results[0],'samples':len(samples)}),flush=True)

if __name__=='__main__': main()

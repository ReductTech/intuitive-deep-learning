"""All stationary points of coercive quartics, in rotated coordinates.
L=a(u²-1)²+b(v²-1)²+c*u+d*v. Solve both cubic derivatives.
Rotation preserves Hessian inertia. Coercivity guarantees a global minimum;
comparing ALL minima identifies it, without guessing from sampled heights.
"""
import json
from pathlib import Path
import numpy as np

catalog=[]
for i in range(12):
    a=.7+.09*(i%4); b=.7+.07*(i%3)
    c=(-1 if i%2 else 1)*(.16+.025*(i%4))
    d=(-1 if i%3 else 1)*(.11+.018*(i%5))
    angle=(i-5.5)*.035
    co,si=np.cos(angle),np.sin(angle)
    roots=lambda weight,tilt: sorted(float(r.real) for r in np.roots([4*weight,0,-4*weight,tilt]) if abs(r.imag)<1e-10)
    points=[]
    for u in roots(a,c):
        for v in roots(b,d):
            assert np.linalg.norm([4*a*u*(u*u-1)+c,4*b*v*(v*v-1)+d])<1e-9
            eigen=[4*a*(3*u*u-1),4*b*(3*v*v-1)]
            kind='local' if min(eigen)>0 else 'maximum' if max(eigen)<0 else 'saddle'
            x,y=co*u+si*v,-si*u+co*v
            assert abs(x)<1.55 and abs(y)<1.55
            points.append(dict(x=x,y=y,value=a*(u*u-1)**2+b*(v*v-1)**2+c*u+d*v,kind=kind))
    minima=[p for p in points if p['kind']=='local']
    min(minima,key=lambda p:p['value'])['kind']='global'
    assert len(points)==9 and len(minima)==4 and sum(p['kind']=='saddle' for p in points)==4
    points.sort(key=lambda p:({'global':0,'local':1,'saddle':2,'maximum':3}[p['kind']],p['value']))
    catalog.append(dict(a=a,b=b,c=c,d=d,angle=angle,points=points))
Path(__file__).with_name('landscapes.json').write_text(json.dumps(catalog,indent=2)+'\n',encoding='utf-8')
print('Validated 12 landscapes, 108 stationary points; gradients, Hessians and all global minima.')

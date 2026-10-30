from playwright.sync_api import sync_playwright
import math,json
from pathlib import Path
out=Path('work/evacuation-check')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,channel='chrome',args=['--enable-webgl','--ignore-gpu-blocklist'])
 page=browser.new_page(viewport={'width':1640,'height':940},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:5173/modules/gradient-descent');page.wait_for_selector('.gd-game[data-ready="true"]',timeout=60000)
 stage=page.locator('.gd-game');slide=page.locator('.gd-slide-surface');canvas=page.locator('.gd-render canvas')
 slide.screenshot(path=str(out/'extraction-opening.png'))
 page.get_by_role('button',name='开始行动',exact=True).click()
 def state():return {k:stage.get_attribute('data-'+k) for k in ['phase','x','z','health','energy','value','cores','kills','broken','elapsed','moves','search']}
 def jump(x,z,snap=None):
  before=state();dx=x-float(before['x']);dz=z-float(before['z']);length=math.hypot(dx,dz)
  power=((length-1.3)/10.8)**(1/.78);assert power<.82,(x,z,length)
  ratio=13*power/length;dx*=ratio;dz*=ratio;R=math.hypot(17,27);D=math.hypot(R,40)
  sx=(dx*27/R+dz*17/R)*1600/54;sy=-(dx*17*40/(R*D)-dz*27*40/(R*D))*1600/54
  rect=canvas.bounding_box();cx=rect['x']+800;cy=rect['y']+450
  page.mouse.move(cx,cy);page.mouse.down();page.mouse.move(cx-sx,cy-sy,steps=8);page.wait_for_timeout(70)
  assert '落点距离' not in page.locator('.gd-command-message').inner_text()
  if snap:slide.screenshot(path=str(out/snap))
  page.mouse.up();page.wait_for_timeout(540)
  after=state();
  if snap:slide.screenshot(path=str(out/'extraction-impact.png'))
  print('jump',x,z,after,flush=True)
  assert int(after['moves'])==int(before['moves'])+1
  assert math.dist([float(after['x']),float(after['z'])],[x,z])<.15
 jump(-11,10.5,'extraction-charge.png')
 stage.focus();page.keyboard.press('f');page.wait_for_timeout(1550)
 assert page.get_by_role('button',name='扫描 4 秒',exact=True).is_enabled(),state()
 page.keyboard.press('e');page.wait_for_timeout(120);slide.screenshot(path=str(out/'extraction-scan.png'))
 jump(-4,3)
 jump(1,-5)
 jump(-5,3)
 stage.focus();page.keyboard.press('f');page.wait_for_timeout(1550)
 assert int(state()['cores'])==1,state()
 slide.screenshot(path=str(out/'extraction-loot.png'))
 for x,z in [(-1,-4),(7,-6.8),(15,-6.8),(22,-10),(28,-17),(30,-20.4)]:jump(x,z)
 assert page.get_by_role('button',name='撤离 R',exact=True).is_enabled(),state()
 assert int(state()['broken'])>0 and int(state()['kills'])>0,state()
 page.get_by_role('button',name='撤离 R',exact=True).click()
 page.wait_for_timeout(2000);page.mouse.click(820,450,button='right');page.wait_for_timeout(700)
 slide.screenshot(path=str(out/'extraction-defense.png'))
 page.wait_for_timeout(2700);stage.focus();page.keyboard.press('q')
 page.wait_for_selector('.gd-game[data-phase="won"]',timeout=10000)
 slide.screenshot(path=str(out/'extraction-won.png'))
 print('won',state(),'errors',errors,flush=True)
 assert not errors
 print('bounds',page.evaluate("""()=>{const s=document.querySelector('.gd-slide-surface'),b=s.getBoundingClientRect();return [...s.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.left<b.left-.5||r.top<b.top-.5||r.right>b.right+.5||r.bottom>b.bottom+.5)}).map(e=>String(e.className));}"""))
 browser.close()



from playwright.sync_api import sync_playwright
import json
from pathlib import Path
out=Path('work/evacuation-check')
def bounds(page,selector):
 return page.evaluate("""s=>{const e=document.querySelector(s),b=e.getBoundingClientRect();return {width:b.width,height:b.height,outside:[...e.querySelectorAll('*')].filter(o=>{const r=o.getBoundingClientRect();return r.width&&r.height&&(r.left<b.left-.5||r.top<b.top-.5||r.right>b.right+.5||r.bottom>b.bottom+.5)}).map(o=>String(o.className))};}""",selector)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,channel='chrome',args=['--enable-webgl','--ignore-gpu-blocklist'])
 page=browser.new_page(viewport={'width':1640,'height':940},device_scale_factor=1)
 errors=[];http=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:http.append([r.url,r.status]) if r.status>=400 else None)
 page.goto('http://localhost:5173/modules/gradient-descent');page.wait_for_selector('.gd-game[data-ready="true"]',timeout=60000)
 page.locator('.gd-slide-surface').screenshot(path=str(out/'extraction-opening.png'));assert not bounds(page,'.gd-slide-surface')['outside']
 page.get_by_role('button',name='开始行动',exact=True).click();stage=page.locator('.gd-game');stage.focus()
 for i in range(5):page.keyboard.press('ArrowUp')
 page.wait_for_timeout(150);assert '落点距离' not in page.locator('.gd-command-message').inner_text();page.keyboard.press('Space');page.wait_for_timeout(650)
 assert stage.get_attribute('data-moves')=='1'
 before=[stage.get_attribute('data-x'),stage.get_attribute('data-z')];page.mouse.move(820,450);page.mouse.wheel(0,-150);page.wait_for_timeout(300);assert before==[stage.get_attribute('data-x'),stage.get_attribute('data-z')]
 page.mouse.wheel(0,150);page.wait_for_timeout(200);page.mouse.click(820,450,button='right');page.wait_for_timeout(120)
 page.locator('.gd-slide-surface').screenshot(path=str(out/'extraction-magic.png'))
 fps=page.evaluate("""()=>new Promise(resolve=>{let times=[],last=performance.now();function f(t){times.push(t-last);last=t;if(times.length<100)requestAnimationFrame(f);else{times=times.slice(10).sort((a,b)=>a-b);resolve({medianMs:times[45],p95Ms:times[85],meanFps:1000/(times.reduce((a,b)=>a+b,0)/times.length)});}}requestAnimationFrame(f);})""")
 page.get_by_role('button',name='重新开始行动',exact=True).click();page.get_by_role('button',name='重新开始',exact=True).click();page.wait_for_timeout(300)
 assert stage.get_attribute('data-moves')=='0' and stage.get_attribute('data-broken')=='0' and stage.get_attribute('data-value')=='0'
 print('guide',bounds(page,'.gd-slide-surface'),'performance',fps)
 page.set_viewport_size({'width':2300,'height':1350});page.goto('http://localhost:5173/scenedeck/?deck=gradient-descent&slide=evacuation');page.wait_for_selector('.gd-game[data-ready="true"]',timeout=60000)
 page.locator('.ppt-slide-surface').screenshot(path=str(out/'extraction-ppt.png'));assert not bounds(page,'.ppt-slide-surface')['outside']
 print('ppt',bounds(page,'.ppt-slide-surface'),'errors',errors,'http_errors',http)
 assert not errors and not http
 browser.close()

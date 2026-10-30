from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, channel='chrome', args=['--enable-webgl','--ignore-gpu-blocklist'])
    page=browser.new_page(viewport={'width':1640,'height':940},device_scale_factor=1)
    errors=[]
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://localhost:5173/modules/gradient-descent')
    page.wait_for_selector('.gd-game[data-ready="true"]',timeout=60000)
    page.wait_for_timeout(1500)
    page.locator('.gd-slide-surface').screenshot(path='work/evacuation-check/default.png')
    print('errors',errors)
    print('bounds', page.evaluate('''() => {const s=document.querySelector('.gd-slide-surface'),b=s.getBoundingClientRect(); return {surface:{width:b.width,height:b.height},outside:[...s.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.left<b.left-.5||r.top<b.top-.5||r.right>b.right+.5||r.bottom>b.bottom+.5)}).map(e=>({class:String(e.className),rect:e.getBoundingClientRect().toJSON()}))}}'''))
    page.get_by_role('button',name='开始行动',exact=True).click()
    page.wait_for_timeout(300)
    page.locator('.gd-slide-surface').screenshot(path='work/evacuation-check/playing.png')
    print('canvas',page.locator('.gd-render canvas').bounding_box())
    browser.close()

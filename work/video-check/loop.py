from playwright.sync_api import sync_playwright
import json,time
from PIL import Image
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,channel='chrome')
 page=b.new_page(viewport={'width':2200,'height':1400},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:5173/scenedeck/?deck=digital-image-intro&slide=video-frames')
 page.wait_for_selector('.di-video__body[data-playing="true"]',timeout=15000)
 page.evaluate("""() => {let e=document.querySelector('.di-video');while(e){if(getComputedStyle(e).transform!=='none')e.style.transform='none';e=e.parentElement}}""")
 hero=page.locator('.di-video__hero').bounding_box()
 page.get_by_role('button',name='暂停',exact=True).click()
 page.get_by_role('slider',name='帧序号',exact=True).fill('60')
 page.wait_for_function("document.querySelector('.di-video__body').dataset.frame==='60'")
 page.locator('.di-video').screenshot(path='work/video-check/loop-default.png')
 x1=page.locator('[data-preview-frame="94"]').bounding_box()['x']
 page.get_by_role('button',name='播放',exact=True).click()
 page.wait_for_function("Number(document.querySelector('.di-video__body').dataset.frame)>=80")
 page.get_by_role('button',name='暂停',exact=True).click()
 x2=page.locator('[data-preview-frame="94"]').bounding_box()['x']
 assert page.locator('.di-video__hero').bounding_box()==hero
 assert x1-x2>100
 print('fixed hero / leftward flow:',round(x1-x2,1))
 page.get_by_role('slider',name='帧序号',exact=True).fill('119')
 page.wait_for_function("document.querySelector('.di-video__body').dataset.frame==='119'")
 positions=page.locator('.di-video__frame').evaluate_all('(els)=>els.map(e=>parseFloat(e.style.left))')
 assert any(x<25 for x in positions) and any(x>75 for x in positions),positions
 page.locator('.di-video').screenshot(path='work/video-check/loop-end.png')
 page.get_by_role('button',name='播放',exact=True).click()
 page.wait_for_function("Number(document.querySelector('.di-video__body').dataset.frame)<30 && document.querySelector('.di-video__body').dataset.playing==='true'")
 print('automatic loop: passed / both sides present near end')
 page.get_by_role('button',name='暂停',exact=True).click()
 print('bounds:',page.evaluate("""() => {const s=document.querySelector('.di-video'),b=s.getBoundingClientRect();return {size:[b.width,b.height],outside:[...s.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.left<b.left-1||r.top<b.top-1||r.right>b.right+1||r.bottom>b.bottom+1)}).map(e=>e.className)}}"""))
 print('errors:',errors)
 # Record the actual running page, including perspective, video, and frame transport.
 page.get_by_role('button',name='回到开头',exact=True).click()
 page.get_by_role('button',name='播放',exact=True).click()
 frames=[]
 for i in range(18):
  shot=page.locator('.di-video').screenshot()
  import io
  frames.append(Image.open(io.BytesIO(shot)).resize((960,540),Image.Resampling.LANCZOS))
  time.sleep(.06)
 frames[0].save('C:/Users/Ocean/Documents/Codex/2026-10-09/1/outputs/video-frames-preview.gif',save_all=True,append_images=frames[1:],duration=125,loop=0)
 Image.open('work/video-check/loop-default.png').resize((640,360),Image.Resampling.LANCZOS).save('assets/10da7e16-ff24-449a-9978-b74b99524e47/scenedeck-thumbnails/video-frames.png')
 b.close()

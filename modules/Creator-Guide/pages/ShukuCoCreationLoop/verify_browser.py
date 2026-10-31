"""Verify a local 1600x900 preview; never mutate production course data."""
import argparse
import json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect


def verify(url, artifacts, chromium=None):
    if urlparse(url).hostname not in ('localhost','127.0.0.1','::1'):
        raise ValueError('Use a local preview')
    artifacts.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        options={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
        if chromium:options['executable_path']=chromium
        browser=p.chromium.launch(**options)
        page=browser.new_page(viewport={'width':1600,'height':900})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(url,wait_until='networkidle')
        expect(page.locator('.scl-art-heading h1')).to_contain_text('形成知识循环')
        expect(page.locator('.scl-artwork')).to_contain_text('为什么学习率')
        expect(page.locator('.scl-art-review-copy').first).to_contain_text('内容准确')
        # Course text must be actual selectable DOM text, never a slide screenshot.
        assert page.locator('.scl-reference,.scl-reference-crop').count()==0
        assert page.locator('.scl-art-heading h1').evaluate("(el)=>{const range=document.createRange();range.selectNodeContents(el);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);const text=selection.toString();selection.removeAllRanges();return text.includes('形成知识循环');}")
        assert page.locator('.scl-artwork img').evaluate_all("els=>els.every(e=>e.complete && e.naturalWidth>0 && /(?:cat|noise|gradient-surface)-/.test(e.src))")
        page.screenshot(path=str(artifacts/'overview.png'))
        page.get_by_role('button',name='放大课堂使用',exact=True).click()
        dialog=page.get_by_role('dialog')
        dialog.get_by_role('slider',name='调整学习率').fill('1')
        expect(dialog.locator('.scl-observation')).to_contain_text('损失没有下降')
        dialog.get_by_role('button',name='提出反馈：希望补充学习率演示',exact=True).click()
        dialog.get_by_role('button',name='带着这个问题参与共创 →',exact=True).click()
        dialog.get_by_role('button',name='提交两项改进，进入审核 →',exact=True).click()
        expect(dialog.get_by_role('button',name='查看待发布内容 →',exact=True)).to_be_disabled()
        dialog.get_by_role('button',name='采纳学生 A',exact=True).click()
        dialog.get_by_role('button',name='退回学生 B',exact=True).click()
        dialog.get_by_role('button',name='查看待发布内容 →',exact=True).click()
        dialog.get_by_role('button',name='发布课程 v1.1',exact=True).click()
        expect(dialog.get_by_role('heading',name='新版本已发布',exact=True)).to_be_visible()
        expect(dialog.locator('.scl-release')).to_contain_text('学生 A')
        expect(dialog.locator('.scl-release')).not_to_contain_text('学生 B')
        page.screenshot(path=str(artifacts/'published.png'))
        dialog.get_by_role('button',name='重置演示，开始下一轮 →',exact=True).click()
        expect(dialog.get_by_role('slider')).to_have_value('0.1')
        dialog.get_by_role('button',name='收起放大预览',exact=True).focus()
        page.keyboard.press('Shift+Tab')
        assert dialog.evaluate('(e)=>e.contains(document.activeElement)')
        page.keyboard.press('Escape')
        expect(page.get_by_role('dialog')).to_have_count(0)
        expect(page.get_by_role('button',name='放大课堂使用',exact=True)).to_be_focused()
        for name in ['学生共创','教师审核','纳入新版','共同维护的课程']:
            button=page.get_by_role('button',name='放大'+name,exact=True)
            button.focus();page.keyboard.press('Enter')
            expect(page.get_by_role('dialog')).to_be_visible()
            box=page.get_by_role('dialog').bounding_box()
            assert box['x']>=0 and box['y']>=0 and box['x']+box['width']<=1600 and box['y']+box['height']<=900
            page.keyboard.press('Escape')
        assert not errors, errors
        report={'selectable_vector_text':True,'accepted_only_publication':True,'reset_and_keyboard':True,'javascript_errors':errors}
        (artifacts/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps(report,ensure_ascii=False))
        browser.close()


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--url',default='http://127.0.0.1:18736')
    parser.add_argument('--artifacts',type=Path,required=True)
    parser.add_argument('--chromium')
    args=parser.parse_args()
    verify(args.url,args.artifacts,args.chromium)

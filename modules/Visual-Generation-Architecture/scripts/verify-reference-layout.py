"""Check Shared header defaults, content-only diagrams, bounds and interactions."""
from pathlib import Path
from urllib.parse import urlencode
import hashlib
import json
from PIL import Image, ImageDraw, ImageChops
from playwright.sync_api import sync_playwright, expect

module = Path(__file__).resolve().parents[1]
root = module.parents[1]
outline = json.loads((module / 'outlines.json').read_text(encoding='utf-8'))
assets = module / 'assets'
output = assets / 'scenedeck-thumbnails'
expected_sources = [None,'01','03','05','08','10','12','13','17','18','22',None,'24',None,None]
base = 'http://127.0.0.1:5180/visual-architecture.html'
errors = []
results = []

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width':1600,'height':900}, reduced_motion='reduce')
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)

    def visit(slide):
        page.goto(base + '?' + urlencode({'scenedeckCapture':'1','slide':slide}))
        page.locator('.vgr-page').wait_for()
        if page.locator('math-field').count():
            page.wait_for_function("customElements.get('math-field') !== undefined")
        page.wait_for_timeout(350)
        page.evaluate('document.fonts.ready')

    def bounds():
        problems = page.evaluate('''() => {
          const surface=document.querySelector('.ppt-slide-surface').getBoundingClientRect();
          const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
          const outside=(r,b)=>r.left<b.left-2||r.right>b.right+2||r.top<b.top-2||r.bottom>b.bottom+2;
          const offCanvas=[...document.querySelectorAll('.vgr-box, .vgr-controls *, .vgr-cover-scene *, .vgr-cover-invitation *, .vgr-page > .edu-content-head')].filter(e=>visible(e)&&outside(e.getBoundingClientRect(),surface)).map(e=>({cls:e.className,text:e.textContent.slice(0,50)}));
          const body=document.querySelector('.vgr-viewport,.vgr-cover-body').getBoundingClientRect();
          const header=document.querySelector('.vgr-page > .edu-content-head').getBoundingClientRect();
          const contentOverflow=[...document.querySelectorAll('.vgr-contents,.vgr-box,.vgr-native-summary,.vgr-cover-scene,.vgr-cover-invitation')].filter(e=>visible(e)&&outside(e.getBoundingClientRect(),body)).map(e=>({cls:e.className,text:e.textContent.slice(0,50)}));
          const local=[...document.querySelectorAll('.vgr-box')].flatMap(box=>[...box.children].filter(e=>e instanceof HTMLElement&&visible(e)&&getComputedStyle(e).position!=='absolute'&&outside(e.getBoundingClientRect(),box.getBoundingClientRect())).map(e=>({box:box.className,child:e.className,text:e.textContent.slice(0,50)})));
          return {offCanvas,local,contentOverflow,headerOverlap:header.bottom>body.top};
        }''')
        assert not problems['offCanvas'], problems
        assert not problems['local'], problems
        assert not problems['contentOverflow'], problems
        assert not problems['headerOverlap'], problems
        return problems

    def shot(slide, state=None):
        bounds()
        target = output / slide / (state+'.png') if state else output / (slide+'.png')
        target.parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(target))

    for row, source in zip(outline['pages'],expected_sources):
        visit(row['id'])
        assert json.loads(page.locator('[data-scene-ids]').get_attribute('data-scene-ids')) == [r['id'] for r in outline['pages']]
        assert page.locator('.vga-teaching-panel,.vga-story-buttons,.vga-story-controls').count()==0
        assert not page.locator('img').evaluate_all('els=>els.filter(e=>!e.complete||!e.naturalWidth).map(e=>e.src)')
        assert page.locator('.vgr-page > .edu-content-head').is_visible()
        assert page.locator('.vgr-page > .edu-content-head > h1').inner_text().strip()
        assert page.locator('.vgr-page > .edu-content-head > p').inner_text().strip()
        # Compare against unmodified Shared classes within the same SceneDeck theme.
        differences=page.evaluate('''() => {
          const fixture=document.createElement('section');fixture.className='edu-content-block';
          fixture.style.cssText='position:absolute;visibility:hidden;pointer-events:none';
          fixture.innerHTML='<header class="edu-content-head"><h1 class="ui-typography ui-typography--h1 ui-typography--tone-accent edu-content-title">Shared</h1><p class="ui-typography ui-typography--subtitle ui-typography--tone-muted edu-content-subtitle">Shared</p></header>';
          document.querySelector('.ppt-slide-surface').append(fixture);
          const differences=[];
          for(const selector of ['.edu-content-head','.edu-content-title','.edu-content-subtitle']){
            const actual=getComputedStyle(document.querySelector('.vgr-page > .edu-content-head'+(selector==='.edu-content-head'?'':' '+selector)));
            const expected=getComputedStyle(fixture.querySelector(selector));
            for(const key of ['fontSize','fontWeight','lineHeight','letterSpacing','color','marginTop','marginBottom'])if(actual[key]!==expected[key])differences.push({selector,key,actual:actual[key],expected:expected[key]});
          }
          fixture.remove();return differences;
        }''')
        assert not differences, differences
        if source:
            expect(page.locator('[data-reference-plate]')).to_have_attribute('data-reference-plate',source)
            # The supplied bitmap is preserved byte-for-byte, not reconstructed.
            original = root.parent / '视觉生成网络结构参考页面图' / (source+'.png')
            assert hashlib.sha256(original.read_bytes()).digest() == hashlib.sha256((assets/'references'/(source+'.png')).read_bytes()).digest()
            top=json.loads((assets/'visuals/reference-body-manifest.json').read_text(encoding='utf-8'))[source]
            assert Image.open(assets/f'visuals/reference-body-{source}.png').size==(1672,941-top)
            if source=='13':
                strip=Image.open(assets/'visuals/reference-body-13.png').convert('RGB').crop((40,0,1300,30))
                residue=ImageChops.difference(strip,Image.new('RGB',strip.size,'white')).convert('L').point(lambda value:255 if value>80 else 0)
                assert residue.getbbox() is None, 'Original subtitle glyphs remain above the VAE route controls'
            assert page.locator('.vgr-contents').get_attribute('data-reference-body-top')==str(top)
            assert f'reference-body-{source}.png' in page.locator('.vgr-plate').get_attribute('src')
            assert page.locator('.vgr-plate').evaluate('e=>{const p=e.parentElement.getBoundingClientRect(),r=e.getBoundingClientRect();return Math.abs(r.width-p.width)<1&&Math.abs(r.height-p.height)<1;}')
        for story in page.locator('.vgr-story-anchor').all():
            expect(story).to_have_attribute('data-story-complete','true')
        shot(row['id'])
        results.append({'slide':row['id'],'source':source,'bounds':'PASS','sharedHeader':'PASS','contentBoundary':'PASS'})

    visit('architecture-opening')
    assert not any(word in page.locator('.vgr-page').inner_text() for word in ['U-Net','latent','DiT','Transformer'])
    photo=page.get_by_test_id('cover-photo')
    photo.click()
    expect(photo).to_have_attribute('aria-pressed','true')
    shot('architecture-opening','photo-back')
    photo.click()
    expect(photo).to_have_attribute('aria-pressed','false')
    shot('architecture-opening','photo-front')
    # Capture mode intentionally mounts an isolated scene without player keys.
    page.goto(base+'?slide=architecture-opening')
    page.get_by_test_id('cover-photo').wait_for()
    page.locator('.vgr-page h1').click()
    page.keyboard.press('ArrowRight')
    expect(page.locator('[data-lesson]')).to_have_attribute('data-lesson','prediction-call')
    visit('prediction-call')
    page.get_by_test_id('prediction-answer').click()
    expect(page.locator('.vgr-plate')).to_have_attribute('data-reference-plate','02')
    shot('prediction-call','one-network-call')

    visit('unet-backbone')
    page.get_by_test_id('skip-toggle').click()
    assert page.locator('[data-skip="false"]').count()==1
    shot('unet-backbone','skip-disconnected')
    page.get_by_test_id('skip-toggle').click()
    assert page.locator('[data-skip="true"]').count()==1

    visit('unet-time')
    page.locator('input[type=range]').fill('100')
    assert '0.74' in page.locator('.vgr-controls').inner_text()
    shot('unet-time','low-time')

    visit('conditioned-unet')
    page.get_by_role('button',name='切断时间',exact=True).click()
    assert page.locator('[data-time-connected="false"]').count()==1
    shot('conditioned-unet','time-disconnected')
    page.get_by_role('button',name='重新接通',exact=True).click()
    assert page.locator('[data-time-connected="true"]').count()==1

    visit('text-cross-attention')
    page.get_by_test_id('region-book').click()
    expect(page.get_by_test_id('query-weight-2')).to_have_text('62%')
    shot('text-cross-attention','book-query')

    visit('pixel-to-latent')
    total=page.get_by_test_id('sampling-total');current=page.get_by_test_id('sampling-current');latent=page.get_by_test_id('sampling-latent')
    clean=latent.screenshot()
    total.fill('50');expect(current).to_have_value('10');expect(latent).to_have_attribute('data-progress','0.2')
    assert clean!=latent.screenshot(), 'N must affect the displayed intermediate progress'
    current.fill('0');expect(latent).to_have_attribute('data-progress','0')
    shot('pixel-to-latent','initial-noise')
    current.fill('50');expect(latent).to_have_attribute('data-progress','1')
    total.fill('10');expect(current).to_have_value('10')
    page.get_by_test_id('resolution-1024').click()
    expect(page.get_by_test_id('pixel-work')).to_have_text('10,485,760')
    expect(page.get_by_test_id('latent-work')).to_have_text('163,840')
    shot('pixel-to-latent','1024-complete')

    visit('vae-bridge')
    page.get_by_test_id('vae-generate').click()
    expect(page.get_by_test_id('vae-routes')).to_have_attribute('data-route','generate')
    assert '随机 latent 噪声' in page.locator('.vgr-generation-origin').inner_text()
    assert '扩散采样' in page.locator('.vgr-encoder-replacement').inner_text()
    shot('vae-bridge','generation-from-noise')
    page.get_by_test_id('vae-reconstruct').click()
    assert page.locator('.vgr-generation-origin').count()==0

    visit('latent-training')
    before=float(page.get_by_test_id('training-loss').inner_text())
    page.get_by_test_id('train-update').click()
    after=float(page.get_by_test_id('training-loss').inner_text())
    assert abs(after-before*.65**2)<.0001
    shot('latent-training','parameter-updated')

    visit('latent-tokenization')
    expect(page.get_by_test_id('token-count')).to_have_text('256')
    page.get_by_test_id('patch-4').click()
    expect(page.get_by_test_id('token-count')).to_have_text('64')
    page.locator('.vgr-patch-choice button').nth(3).click()
    page.get_by_test_id('patch-send').click()
    assert page.locator('.vgr-token-drop.is-filled').count()==1
    shot('latent-tokenization','patch-projected')
    page.locator('.vgr-patch-choice button').nth(5).drag_to(page.locator('.vgr-token-drop'))
    expect(page.locator('.vgr-patch-choice button').nth(5)).to_have_attribute('aria-pressed','true')

    visit('dit-backbone')
    page.get_by_test_id('backbone-unet').click()
    assert page.locator('[data-backbone="unet"]').count()==1
    shot('dit-backbone','unet-comparison')
    page.get_by_test_id('backbone-dit').click()
    assert page.locator('[data-backbone="dit"]').count()==1

    visit('dit-time')
    before=page.locator('.vga-vector-numbers').last.inner_text()
    page.locator('input[type=range]').fill('1000')
    assert page.locator('.vga-vector-numbers').last.inner_text()!=before
    shot('dit-time','high-time')
    page.get_by_role('button',name='只做归一化',exact=True).click()
    assert page.locator('.vga-vector-numbers').first.inner_text()==page.locator('.vga-vector-numbers').last.inner_text()

    visit('dit-text')
    page.get_by_test_id('joint-mode').click()
    expect(page.get_by_test_id('attention-matrix')).to_have_attribute('data-cols','7')
    page.get_by_role('button',name='查询第 5 行与第 4 列的关系',exact=True).click()
    assert 'Query 5' in page.locator('.vgr-page').inner_text()
    shot('dit-text','joint-attention')

    visit('architecture-map')
    assert page.locator('.dl-question').count()==0
    for system in ['pixel-unet','pixel-transformer','latent-unet','latent-transformer']:
        page.get_by_test_id('system-'+system).click()
        expect(page.get_by_test_id('system-'+system)).to_have_attribute('aria-pressed','true')
        assert page.get_by_test_id('architecture-details').inner_text().strip()
        shot('architecture-map',system)

    # Normal motion: each finite story reaches the complete diagram and holds it.
    page.emulate_media(reduced_motion='no-preference')
    for slide in ['architecture-opening','prediction-call','unet-backbone','conditioned-unet','vae-bridge','latent-sampling','dit-backbone']:
        visit(slide)
        story=page.locator('.vgr-story-anchor')
        expect(story).to_have_attribute('data-story-complete','true',timeout=10000)
        final=story.get_attribute('data-story-step')
        page.wait_for_timeout(200)
        assert story.get_attribute('data-story-step')==final
    # New route remounts its animation; no extra transport controls are introduced.
    visit('vae-bridge')
    page.get_by_test_id('vae-generate').click()
    expect(page.locator('.vgr-story-anchor')).to_have_attribute('data-story-step','0')
    expect(page.locator('.vgr-story-anchor')).to_have_attribute('data-story-complete','true',timeout=7000)
    assert not errors, errors
    browser.close()

sheet=Image.new('RGB',(1920,1900),'#e3e3e3')
draw=ImageDraw.Draw(sheet)
for i,row in enumerate(outline['pages']):
    im=Image.open(output/(row['id']+'.png'));im.thumbnail((630,355))
    x,y=i%3*640,i//3*380
    sheet.paste(im,(x,y+23));draw.text((x+5,y+5),f'{i+1} {row["id"]}',fill='black')
sheet.save(assets/'reference-layout-overview.jpg')
(module/'scripts/reference-layout-results.json').write_text(json.dumps({'pages':results,'interactions':'PASS','finiteAnimations':'PASS','browserErrors':errors},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'pages':len(outline['pages']),'contentOnlyReferencePages':11,'sharedHeaders':'PASS','contentBoundaries':'PASS','interactions':'PASS','finiteAnimations':'PASS','browserErrors':errors}),flush=True)

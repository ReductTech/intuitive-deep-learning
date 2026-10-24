#!/usr/bin/env python3
"""Build an offline page statistics report.

Reads: Module sources, existing thumbnails and optional text counts.
Writes: HTML, CSV and JSON reports in each module's _scratchpad/reports.
Does not run course code or access the network.
"""

from __future__ import annotations

import sys
import argparse
import base64
import csv
import io
import json
import math
from pathlib import Path
import shutil
import subprocess
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "common"))
from _common import ROOT, emit_result, report_error, resolve_module, scratchpad_path

HTML_TEMPLATE = r"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>课件页面统计报告</title>
<style>
:root{color-scheme:light;--ink:#17324b;--muted:#5c6e7d;--line:#dce4ea;--blue:#326fa7;--paper:#fff;--wash:#f3f6f8}*{box-sizing:border-box}body{margin:0;background:var(--wash);color:var(--ink);font:15px/1.65 "Microsoft YaHei","PingFang SC",system-ui,sans-serif}main{max-width:1400px;margin:auto;padding:44px 36px 70px}h1{font-size:34px;line-height:1.3;font-weight:650;margin:8px 0 14px}h2{font-size:23px;margin:0 0 16px}h3{font-size:17px;margin:0 0 8px}p{margin:8px 0}.eyebrow{letter-spacing:.14em;font-size:12px;color:var(--blue)}.lede{max-width:880px;color:var(--muted)}.meta{font-size:12px;color:var(--muted);overflow-wrap:anywhere}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;padding:26px 0;border-block:1px solid var(--line);margin:26px 0}.stat strong{display:block;font-size:30px;font-weight:600}.stat span{color:var(--muted);font-size:13px}section{margin-top:34px}.plots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.plot{background:var(--paper);padding:22px 20px 10px;min-width:0}.plot p{font-size:12px;color:var(--muted);min-height:20px}.plot svg{display:block;width:100%;height:auto}.findings{padding:18px 24px;background:#e9f0f6;border-left:4px solid var(--blue)}.findings ul{margin:0;padding-left:20px}.note{color:var(--muted);font-size:13px}.toolbar{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px}input,select,button{font:inherit;color:inherit}input,select{background:#fff;border:1px solid #bdcbd5;border-radius:5px;padding:8px 10px}input{flex:1;min-width:220px}button{cursor:pointer}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #6a9bc7;outline-offset:2px}.table-wrap{overflow-x:auto;background:white}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}th{background:#eaf0f5;white-space:nowrap}th button{border:0;background:transparent;padding:0;font-weight:600}.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}td.title{min-width:240px;max-width:460px}.page-button{color:var(--blue);border:0;background:transparent;text-align:left;padding:0;font:inherit;text-decoration:underline;text-underline-offset:3px}.preview{background:var(--paper);padding:24px}.preview-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.preview figure{margin:0;min-width:0}.preview img{width:100%;display:block;background:#eef2f5;border:1px solid var(--line)}figcaption{font-size:12px;color:var(--muted);margin-bottom:8px}.preview .details{margin-top:14px}.swatch{display:inline-block;width:20px;height:20px;vertical-align:middle;margin-right:4px;border:1px solid #b8c3cc}.modules td:first-child{max-width:300px}.method{background:var(--paper);padding:24px}.method dt{font-weight:600;margin-top:14px}.method dd{margin:4px 0;color:var(--muted)}.status{font-size:12px;color:var(--muted)}code{font-family:Consolas,monospace;overflow-wrap:anywhere}.source{overflow-wrap:anywhere}details>summary{cursor:pointer;color:var(--blue)}.download{color:var(--blue);font:inherit;border:1px solid #bdcbd5;background:white;padding:7px 12px;border-radius:5px}.foot{margin-top:28px;border-top:1px solid var(--line);padding-top:18px;color:var(--muted);font-size:12px}
@media(max-width:800px){main{padding:26px 16px 40px}h1{font-size:27px}.stats{grid-template-columns:repeat(2,1fr)}.plots,.preview-grid{grid-template-columns:1fr}.plot{padding:18px 12px 8px}.stat strong{font-size:26px}}@media print{body{background:white}main{padding:10px}.toolbar,.download{display:none}.plots{grid-template-columns:1fr 1fr}.plot,.preview,.method{break-inside:avoid}.table-wrap{overflow:visible}th{position:static}}
</style></head><body><main>
<header><div class="eyebrow">INTUITIVE DEEP LEARNING · PAGE STATISTICS</div><h1>每页有多少内容，又留了多少空间？</h1><p class="lede">汇总当前课件的文字、交互元素与缩略图特征。用于观察分布和寻找值得复看的页面，采用统一的近似口径。</p><p class="meta" id="meta"></p></header>
<div class="stats" id="stats"></div>
<div class="findings" id="findings"></div>
<section><h2>页面分布直方图</h2><div class="plots" id="plots"></div><p class="note">文字与控件来自静态源码近似扫描；视觉指标只统计已找到的当前页面缩略图。缺图页不会按 0 计入直方图。</p></section>
<section><h2>各模块概览</h2><div class="table-wrap"><table class="modules"><thead><tr><th>模块</th><th class="num">页数</th><th class="num">有图页数</th><th class="num">字数中位数</th><th class="num">留白率中位数</th><th class="num">平均按钮数</th><th class="num">有链接页数</th><th class="num">主要颜色中位数</th></tr></thead><tbody id="modules"></tbody></table></div></section>
<section><h2>缩略图与 Otsu 二值化对照</h2><p class="note">在逐页明细中点击标题，可查看该页原图和二值化结果。黑色代表低于或等于阈值的像素，白色代表亮像素。</p><div class="preview" id="preview" aria-live="polite"></div></section>
<section><h2>逐页明细</h2><div class="toolbar"><label>模块 <select id="module-filter"><option value="">全部模块</option></select></label><input id="search" type="search" aria-label="搜索页面标题或ID" placeholder="搜索页面标题或 ID"><button id="download" class="download" type="button">导出逐页 CSV</button><span class="status" id="row-count" aria-live="polite"></span></div><div class="table-wrap"><table><thead><tr><th>模块 / 页码</th><th><button data-sort="title">标题 ↕</button></th><th class="num"><button data-sort="words">字数 ↕</button></th><th class="num"><button data-sort="whitespace">留白率 ↕</button></th><th class="num"><button data-sort="buttons">按钮 ↕</button></th><th class="num"><button data-sort="links">链接 ↕</button></th><th class="num"><button data-sort="inputs">输入 ↕</button></th><th class="num"><button data-sort="images">图片 ↕</button></th><th class="num"><button data-sort="videos">视频 ↕</button></th><th class="num"><button data-sort="charts">图形 ↕</button></th><th class="num"><button data-sort="colors">主要颜色 ↕</button></th><th class="num"><button data-sort="edgeDensity">边缘密度 ↕</button></th></tr></thead><tbody id="rows"></tbody></table></div></section>
<section class="method"><h2>统计口径与适用范围</h2><dl>
<dt>范围</dt><dd>从各模块的 PPT / course 源码提取页面 ID 与入口，不把 outlines 中尚未实现的规划页、讲稿、旧版本、测试页面和共享组件库当作课件页。只匹配 assets/&lt;模块 UUID&gt;/scenedeck-thumbnails/&lt;页面 ID&gt; 图片。缩略图可能早于最新源码，报告不以截图存在证明它是最新版本。</dd>
<dt>近似可见字数</dt><dd id="word-method"></dd>
<dt>Otsu 留白率</dt><dd>缩略图合成白底后，等比例缩小至最多 480×270，转灰度，再用大津算法自动选择阈值 T。留白率 = 灰度 &gt; T 的亮像素数 / 全部像素数。它是亮部面积的代理，不是严格的“没有内容的面积”：浅色卡片可能被算成留白，深色空背景可能不被算入，照片和游戏页尤其要结合原图看。单一灰度图没有可分离的前景，会单独标记，仍保留亮像素比例。</dd>
<dt>边框推断背景占比（明细导出）</dt><dd>根据二值化后四条边多数像素的极性，取同极性像素的比例，作为深底页面的辅助参考。它仍可能包含前景，不能代替真实留白。</dd>
<dt>按钮、链接和输入控件</dt><dd>数 JSX 中显式的 button / Button、a / AppLink / Link、input / textarea / select / RangeControl / Switch / Question 等声明，并向下读取模块内引用的组件。共享 UI 的内部实现不展开。循环里的一个声明按 1 个计，条件分支可能同时计入；这是结构数量，不是精确的首屏可点击数量。只统计实际链接元素声明，讲稿里的 URL 不计。</dd>
<dt>图片、视频、图形 / 图表</dt><dd>统计显式 JSX 标签：img / Image、video / Video、Chart / Plot / Diagram / canvas / svg。循环和条件分支同样近似；CSS 背景图和自定义组件中的隐式媒体可能漏计，图形包含装饰 SVG，不能直接解释成独立知识图的数量。</dd>
<dt>主要颜色数量</dt><dd>将缩略图 RGB 每通道量化为 16 档（最多 4096 色），只保留面积占比至少 0.1% 的色块数。该值减少抗锯齿噪声，但照片、纹理和渐变仍会增加色数，不等同于设计系统的主题色数量。</dd>
<dt>视觉复杂度辅助指标</dt><dd>边缘密度 = 横纵相邻像素灰度差 &gt; 20 的像素对占比；灰度熵用于描述明暗变化，单位 bits；彩色区域指 HSV 饱和度至少 0.2 的像素面积。平均灰度、灰度标准差也写入 CSV。它们描述视觉特征，不是质量评分。</dd>
<dt>复用命令</dt><dd><code>python creator-skill/scripts/tools.py analyze.pages</code><br><code>python creator-skill/scripts/tools.py analyze.pages --module Neuron-Guide</code></dd>
</dl><details><summary id="coverage-summary"></summary><div id="coverage" class="source"></div></details></section>
<p class="foot">本报告为离线批处理结果，可直接保存、移动和打开。没有外部脚本、网络请求或在线字体依赖。所有数值为内容分布参考，不据此自动判断页面好坏。</p>
</main><script id="report-data" type="application/json">__REPORT_DATA__</script><script>
'use strict';
const D=JSON.parse(document.getElementById('report-data').textContent),P=D.pages;
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const values=k=>P.map(p=>p[k]).filter(Number.isFinite),med=a=>{a=[...a].sort((x,y)=>x-y);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2:null},avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null,fmt=(x,d=0)=>Number.isFinite(x)?x.toLocaleString('zh-CN',{maximumFractionDigits:d,minimumFractionDigits:d}):'—';
$('meta').textContent=`生成于 ${new Date(D.generatedAt).toLocaleString('zh-CN',{timeZone:'Asia/Hong_Kong',hour12:false})}（香港时间） · ${D.modules.length} 个课件模块 · 仅本地源码与现有缩略图`;
const imageCount=values('whitespace').length;
$('stats').innerHTML=[[P.length,'当前课件页'],[`${imageCount} / ${P.length}`,'缩略图覆盖'],[fmt(med(values('whitespace')),1)+'%','Otsu 留白率中位数'],[fmt(med(values('words'))),'每页字数中位数']].map(([v,l])=>`<div class="stat"><strong>${v}</strong><span>${l}</span></div>`).join('');
function modeBin(a,step){const c=new Map();a.forEach(v=>{const lo=Math.floor(v/step)*step;c.set(lo,(c.get(lo)||0)+1)});return [...c].sort((a,b)=>b[1]-a[1])[0]||[0,0]}
const wb=modeBin(values('words'),50),sb=modeBin(values('whitespace').map(x=>Math.min(99.999,x)),10);
$('findings').innerHTML=`<ul><li>文字最多集中在 <strong>${wb[0]}–${wb[0]+49} 字</strong>，共 ${wb[1]} 页；每页按钮声明平均 ${fmt(avg(values('buttons')),1)} 个，有链接声明的页面 ${P.filter(p=>p.links>0).length} 页。</li><li>有图页面的 Otsu 留白率最多集中在 <strong>${sb[0]}%–${sb[0]+10}%</strong>，共 ${sb[1]} 页；主要颜色数量中位数 ${fmt(med(values('colors')))} 种。</li><li>当前页缺图 ${D.missingThumbnails.length} 页，图像读取异常 ${D.imageErrors.length} 页；另有 ${D.unmatchedThumbnails.length} 张缩略图未匹配当前页，均未混入视觉直方图。</li></ul>`;
let chartWidth=620;function histogram(key,title,step,unit,description,cap){const vals=values(key),mx=cap??Math.max(...vals,0),end=cap??(Math.floor(mx/step)+1)*step,n=Math.max(1,Math.ceil(end/step)),bins=Array.from({length:n},(_,i)=>({lo:i*step,hi:(i+1)*step,count:0}));vals.forEach(v=>bins[Math.min(n-1,Math.floor(v/step))].count++);const width=chartWidth,height=270,L=52,R=14,T=20,B=56,w=width-L-R,h=height-T-B,ymax=Math.max(...bins.map(b=>b.count),1);let g='';for(let i=0;i<=4;i++){const yy=T+h-h*i/4;g+=`<line x1="${L}" x2="${width-R}" y1="${yy}" y2="${yy}" stroke="#e0e7ed"/><text x="${L-8}" y="${yy+4}" text-anchor="end">${Math.round(ymax*i/4)}</text>`}const every=Math.max(1,Math.ceil(n/(width<400?5:10)));bins.forEach((b,i)=>{const x=L+i*w/n,bh=b.count/ymax*h;g+=`<rect x="${x+.5}" y="${T+h-bh}" width="${Math.max(1,w/n-1)}" height="${bh}" fill="#3979af"><title>${b.lo}–${b.hi}${unit}：${b.count} 页</title></rect>`;if(b.count&&(w/n>=23||i%2===0||b.count===ymax))g+=`<text x="${x+w/n/2}" y="${T+h-bh-5}" text-anchor="middle">${b.count}</text>`;if(i%every===0)g+=`<text x="${x+w/n/2}" y="${height-B+20}" text-anchor="middle">${b.lo}${unit}</text>`});return `<article class="plot"><h3>${esc(title)}</h3><p>${esc(description)} · 有效样本 ${vals.length} 页</p><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}，纵轴页数，横轴${esc(unit||'个')}" style="font-family:inherit;font-size:12px;fill:#425b70"><text x="8" y="13">页数</text>${g}<text x="${L+w/2}" y="${height-7}" text-anchor="middle">${esc(title)}${unit?'（'+unit+'）':''}</text></svg></article>`}
function drawPlots(){const container=$('plots').clientWidth;chartWidth=Math.max(260,Math.floor(window.innerWidth<=800?container-24:(container-24)/2-40));$('plots').innerHTML=[histogram('whitespace','Otsu 留白率',10,'%','亮像素比例；每 10 个百分点一档',100),histogram('words','每页近似可见字数',50,'字','每 50 字一档'),histogram('buttons','按钮声明数',1,'个','一个 JSX 声明计 1 个'),histogram('links','超链接声明数',1,'个','页面链接元素；不数讲稿 URL'),histogram('colors','主要颜色数量',10,'种','RGB 每通道 16 档；面积 ≥ 0.1%'),histogram('edgeDensity','缩略图边缘密度',2,'%','灰度差 > 20；每 2 个百分点一档')].join('');}drawPlots();let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(drawPlots,100)});
$('modules').innerHTML=D.modules.map(m=>{const a=P.filter(p=>p.directory===m.directory),v=k=>a.map(p=>p[k]).filter(Number.isFinite);return `<tr><td>${esc(m.title)}</td><td class="num">${a.length}</td><td class="num">${v('whitespace').length}</td><td class="num">${fmt(med(v('words')))}</td><td class="num">${fmt(med(v('whitespace')),1)}%</td><td class="num">${fmt(avg(v('buttons')),1)}</td><td class="num">${a.filter(p=>p.links>0).length}</td><td class="num">${fmt(med(v('colors')))}</td></tr>`}).join('');
$('module-filter').innerHTML+=D.modules.map(m=>`<option value="${esc(m.directory)}">${esc(m.title)}</option>`).join('');
let sortKey=null,descending=true;
function filtered(){const q=$('search').value.trim().toLowerCase(),mod=$('module-filter').value;let a=P.filter(p=>(!mod||p.directory===mod)&&(!q||(p.title+' '+p.sceneId+' '+p.moduleTitle).toLowerCase().includes(q)));if(sortKey)a=[...a].sort((x,y)=>{const a=x[sortKey],b=y[sortKey];if(a==null)return b==null?0:1;if(b==null)return -1;const c=typeof a==='string'?a.localeCompare(b,'zh-CN'):a-b;return descending?-c:c});return a}
function renderRows(){const a=filtered();$('row-count').textContent=`显示 ${a.length} / ${P.length} 页`;$('rows').innerHTML=a.map(p=>`<tr><td>${esc(p.directory)}<br><span class="status">第 ${p.page} 页</span></td><td class="title"><button class="page-button" data-page="${P.indexOf(p)}">${esc(p.title)}</button><br><span class="status">${esc(p.sceneId)}${p.thumbnail?'':' · 缺图'}</span></td>${['words','whitespace','buttons','links','inputs','images','videos','charts','colors','edgeDensity'].map(k=>`<td class="num">${fmt(p[k],['whitespace','edgeDensity'].includes(k)?1:0)}${Number.isFinite(p[k])&&['whitespace','edgeDensity'].includes(k)?'%':''}</td>`).join('')}</tr>`).join('')}
function preview(index){const p=P[index];$('preview').innerHTML=`<h3>${esc(p.moduleTitle)} · 第 ${p.page} 页 · ${esc(p.title)}</h3>${p.preview?`<div class="preview-grid"><figure><figcaption>现有缩略图 · 原尺寸 ${p.thumbnailSize.join(' × ')}</figcaption><img src="${p.preview}" alt="${esc(p.title)}缩略图"></figure><figure><figcaption>Otsu 二值化 · T=${p.otsuThreshold} · 亮像素 ${fmt(p.whitespace,1)}%</figcaption><img src="${p.binaryPreview}" alt="Otsu黑白二值化结果"></figure></div>`:`<p>${p.thumbnail?'已找到缩略图；本报告未嵌入预览。':'这页没有可读取的匹配缩略图；视觉指标留空。'}</p>`}<div class="details"><p>近似字数 <strong>${p.words}</strong> · 按钮 <strong>${p.buttons}</strong> · 链接 <strong>${p.links}</strong> · 输入控件 <strong>${p.inputs}</strong> · 主要颜色 <strong>${fmt(p.colors)}</strong></p><p class="note">边框推断背景占比 ${fmt(p.backgroundRatio,1)}% · 边缘密度 ${fmt(p.edgeDensity,1)}% · 灰度熵 ${fmt(p.entropy,2)} bits · 彩色区域 ${fmt(p.saturatedArea,1)}%</p><p>${(p.palette||[]).map(c=>`<span class="swatch" style="background:${c}" title="${c}"></span>`).join('')}</p><p class="meta source">${esc(p.thumbnail||'缺少缩略图')}<br>${p.sources.map(esc).join('<br>')}</p></div>`}
$('rows').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b){preview(Number(b.dataset.page));$('preview').scrollIntoView({behavior:'smooth',block:'start'})}});
document.querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',()=>{descending=sortKey===b.dataset.sort?!descending:true;sortKey=b.dataset.sort;renderRows()}));
$('module-filter').addEventListener('change',renderRows);$('search').addEventListener('input',renderRows);
$('download').addEventListener('click',()=>{const keys=['moduleTitle','module','page','title','sceneId','words','whitespace','backgroundRatio','buttons','links','inputs','images','videos','charts','colors','edgeDensity','entropy','brightness','contrast','saturatedArea','thumbnail'];const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';const csv='\ufeff'+[keys,...filtered().map(p=>keys.map(k=>p[k]))].map(r=>r.map(quote).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='page-statistics.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('word-method').textContent=D.wordMethod==='imported'?'沿用导入的前次逐页近似字数，缺少匹配项时使用源码提取；文字来源标记见 CSV。':'扫描页面标题、副标题、JSX 文本、常见文字属性及引用组件中的字面量。汉字、字母、数字、标点各计 1 字符，空白不计；不统计源码总字符数、讲稿和程序标识符。图片内文字、Canvas 动态绘字不做 OCR，动态模板可能漏算；条件分支可能多算少量文字。此报告统一采用离线静态口径，与先前浏览器提取口径会有差异。';
$('coverage-summary').textContent=`覆盖清单：缺图 ${D.missingThumbnails.length} 页；未匹配当前页的旧图 ${D.unmatchedThumbnails.length} 张；图像异常 ${D.imageErrors.length} 页`;
$('coverage').innerHTML='<h3>缺少当前缩略图</h3><p>'+esc(D.missingThumbnails.join('；')||'无')+'</p><h3>未匹配当前页的缩略图</h3><p>'+D.unmatchedThumbnails.map(esc).join('<br>')+'</p><h3>图像读取异常</h3><p>'+esc(JSON.stringify(D.imageErrors))+'</p>';
renderRows();preview(Math.max(0,P.findIndex(p=>p.preview)));
</script></body></html>"""


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path, default=ROOT, help="repository root; default this checkout"
    )
    parser.add_argument(
        "--module", help="Module directory, ID or UUID; default all PPT modules"
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="HTML path inside selected module's _scratchpad, relative to cwd; requires --module; default _scratchpad/reports/page-statistics.html",
    )
    parser.add_argument(
        "--text-counts", type=Path, help="Optional previous Chinese-header per-page CSV"
    )
    parser.add_argument(
        "--no-previews", action="store_true", help="Do not embed thumbnail previews"
    )
    return parser


def otsu_threshold(gray):
    """First threshold maximizing between-class variance, as in standard Otsu."""
    import numpy as np

    histogram = np.bincount(gray.ravel(), minlength=256).astype(float)
    if not histogram.sum():
        raise ValueError("Empty image")
    probabilities = histogram / histogram.sum()
    cumulative = np.cumsum(probabilities)
    cumulative_mean = np.cumsum(probabilities * np.arange(256))
    denominator = cumulative * (1 - cumulative)
    variance = np.full(256, -1.0)
    np.divide(
        (cumulative_mean[-1] * cumulative - cumulative_mean) ** 2,
        denominator,
        out=variance,
        where=denominator > 1e-12,
    )
    if variance.max() < 0:
        return 0
    return int(variance.argmax())


def image_data(image, fmt="WEBP"):
    buffer = io.BytesIO()
    image.save(buffer, format=fmt, **({"quality": 72} if fmt == "WEBP" else {}))
    mime = "image/webp" if fmt == "WEBP" else "image/png"
    return f"data:{mime};base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


def thumbnail_metrics(file: Path, previews: bool = True) -> dict:
    """Read one thumbnail and return metrics plus optional embedded previews."""
    import numpy as np
    from PIL import Image

    with Image.open(file) as original:
        size = list(original.size)
        rgba = original.convert("RGBA")
        background = Image.new("RGBA", rgba.size, "white")
        background.alpha_composite(rgba)
        image = background.convert("RGB")
        image.thumbnail((480, 270), Image.Resampling.LANCZOS)
    gray = np.asarray(image.convert("L"))
    threshold = otsu_threshold(gray)
    bright = gray > threshold
    # A constant image has no separable foreground; retain its bright fraction.
    uniform = bool(gray.min() == gray.max())
    bright_ratio = float(bright.mean() * 100)
    border = np.concatenate((bright[0], bright[-1], bright[:, 0], bright[:, -1]))
    background_is_bright = bool(border.mean() >= 0.5)
    background_ratio = (
        100.0
        if uniform
        else (bright_ratio if background_is_bright else 100 - bright_ratio)
    )
    rgb = np.asarray(image)
    quantized = rgb.astype(np.uint16) >> 4
    codes = quantized[:, :, 0] * 256 + quantized[:, :, 1] * 16 + quantized[:, :, 2]
    color_counts = np.bincount(codes.ravel(), minlength=4096)
    major_colors = int(
        (color_counts >= math.ceil(rgb.shape[0] * rgb.shape[1] * 0.001)).sum()
    )
    palette = []
    for code in np.argsort(color_counts)[-6:][::-1]:
        if not color_counts[code]:
            continue
        palette.append(
            "#%02x%02x%02x"
            % (
                ((int(code) >> 8) * 16 + 8),
                ((int(code) >> 4 & 15) * 16 + 8),
                ((int(code) & 15) * 16 + 8),
            )
        )
    signed = gray.astype(np.int16)
    dx, dy = np.abs(np.diff(signed, axis=1)), np.abs(np.diff(signed, axis=0))
    edge_density = float(
        ((dx > 20).sum() + (dy > 20).sum()) / max(1, dx.size + dy.size) * 100
    )
    histogram = np.bincount(gray.ravel(), minlength=256).astype(float)
    probs = histogram[histogram > 0] / gray.size
    entropy = float(-(probs * np.log2(probs)).sum())
    maximum, minimum = rgb.max(axis=2).astype(float), rgb.min(axis=2).astype(float)
    saturation = np.divide(
        maximum - minimum, maximum, out=np.zeros_like(maximum), where=maximum > 0
    )
    result = dict(
        thumbnailSize=size,
        sampledSize=list(image.size),
        otsuThreshold=threshold,
        whitespace=round(bright_ratio, 2),
        backgroundRatio=round(background_ratio, 2),
        backgroundIsBright=background_is_bright,
        uniformImage=uniform,
        colors=major_colors,
        edgeDensity=round(edge_density, 2),
        entropy=round(entropy, 3),
        brightness=round(float(gray.mean()), 2),
        contrast=round(float(gray.std()), 2),
        saturatedArea=round(float((saturation >= 0.2).mean() * 100), 2),
        palette=palette,
    )
    if previews:
        preview = image.copy()
        preview.thumbnail((400, 225), Image.Resampling.LANCZOS)
        binary = Image.fromarray((bright.astype(np.uint8) * 255)).convert("RGB")
        binary.thumbnail((400, 225), Image.Resampling.NEAREST)
        result.update(
            preview=image_data(preview), binaryPreview=image_data(binary, "PNG")
        )
    return result


def build_dataset(
    root: Path,
    module: str | None = None,
    previews: bool = True,
    text_counts: Path | None = None,
) -> dict:
    """Collect source and thumbnail metrics without starting a browser or course code."""
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Node.js not found")
    collector = Path(__file__).with_name("collect_page_metrics.cjs")
    result = subprocess.run(
        [node, str(collector), "--root", str(root)],
        cwd=root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
    )
    document = json.loads(result.stdout)
    pages = document["pages"]
    if module:
        pages = [
            p
            for p in pages
            if module.lower()
            in {p["module"].lower(), p["directory"].lower(), str(p["assetId"]).lower()}
        ]
    if not pages:
        raise ValueError("No matching pages")
    overrides = {}
    if text_counts:
        with Path(text_counts).open(encoding="utf-8-sig", newline="") as f:
            for r in csv.DictReader(f):
                overrides[(r["模块ID"], r["页面ID"])] = int(r["近似可见字数"])
    current_paths = set()
    missing, errors = [], []
    for p in pages:
        p["wordMethod"] = "TSX静态近似"
        if (p["module"], p["sceneId"]) in overrides:
            p["words"] = overrides[p["module"], p["sceneId"]]
            p["wordMethod"] = "导入前次统计"
        p.pop("text", None)
        p["thumbnail"] = None
        asset_dir = root / "assets" / str(p["assetId"]) / "scenedeck-thumbnails"
        file = next(
            (
                asset_dir / (p["sceneId"] + ext)
                for ext in (".png", ".webp", ".jpg", ".jpeg")
                if (asset_dir / (p["sceneId"] + ext)).is_file()
            ),
            None,
        )
        if not file:
            missing.append(f"{p['directory']}/{p['sceneId']}")
            continue
        current_paths.add(file.resolve())
        p["thumbnail"] = file.relative_to(root).as_posix()
        try:
            p.update(thumbnail_metrics(file, previews))
        except Exception as exc:
            errors.append({"page": p["module"] + "/" + p["sceneId"], "error": str(exc)})
    relevant_asset_dirs = {
        root / "assets" / str(p["assetId"]) / "scenedeck-thumbnails" for p in pages
    }
    unused = sorted(
        str(f.relative_to(root)).replace("\\", "/")
        for d in relevant_asset_dirs
        if d.exists()
        for f in d.iterdir()
        if f.is_file()
        and f.suffix.lower() in {".png", ".webp", ".jpg", ".jpeg"}
        and f.resolve() not in current_paths
    )
    document.update(
        pages=pages,
        generatedAt=datetime.now(timezone.utc).isoformat(),
        missingThumbnails=missing,
        imageErrors=errors,
        unmatchedThumbnails=unused,
        wordMethod="imported" if text_counts else "static",
        colorQuantization=16,
        majorColorMinArea=0.001,
        thumbnailMaxSample=[480, 270],
    )
    document["modules"] = [
        m
        for m in document["modules"]
        if any(p["directory"] == m["directory"] for p in pages)
    ]
    return document


def save_csv(data: dict, file: Path) -> None:
    columns = {
        "moduleTitle": "模块",
        "module": "模块ID",
        "page": "页码",
        "title": "标题",
        "sceneId": "页面ID",
        "words": "近似可见字数",
        "wordMethod": "文字统计方式",
        "whitespace": "Otsu留白率_亮像素百分比",
        "backgroundRatio": "边框推断背景占比_百分比",
        "otsuThreshold": "Otsu灰度阈值",
        "buttons": "按钮声明数",
        "links": "链接声明数",
        "inputs": "输入控件声明数",
        "images": "图片声明数",
        "videos": "视频声明数",
        "charts": "图形图表声明数",
        "colors": "主要颜色数",
        "edgeDensity": "边缘密度_百分比",
        "entropy": "灰度熵_bits",
        "brightness": "平均灰度",
        "contrast": "灰度标准差",
        "saturatedArea": "彩色区域_百分比",
        "thumbnail": "缩略图路径",
        "sources": "源码文件",
    }
    with file.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(columns.values())
        for p in data["pages"]:
            writer.writerow(
                [
                    "; ".join(p.get(k, [])) if k == "sources" else p.get(k, "")
                    for k in columns
                ]
            )


def report_html(data: dict) -> str:
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace(
        "<", "\\u003c"
    )
    return HTML_TEMPLATE.replace("__REPORT_DATA__", payload)


def save_report(data: dict, directory: Path, output: Path) -> dict:
    """Save a module report, validating all sibling files before any writes."""
    for target in (output, output.with_suffix(".csv"), output.with_suffix(".json")):
        scratchpad_path(directory, target, default="")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(report_html(data), encoding="utf-8")
    csv_file = output.with_suffix(".csv")
    save_csv(data, csv_file)
    # JSON carries metrics and paths without the larger embedded image previews.
    compact = dict(data)
    compact["pages"] = [
        {k: v for k, v in p.items() if k not in ("preview", "binaryPreview")}
        for p in data["pages"]
    ]
    output.with_suffix(".json").write_text(
        json.dumps(compact, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return dict(
        report=str(output),
        csv=str(csv_file),
        json=str(output.with_suffix(".json")),
        pages=len(data["pages"]),
        modules=len(data["modules"]),
        thumbnails=sum("whitespace" in p for p in data["pages"]),
        missing=len(data["missingThumbnails"]),
        imageErrors=len(data["imageErrors"]),
        unmatched=len(data["unmatchedThumbnails"]),
    )


def write_report(args: argparse.Namespace) -> dict:
    """Write one report per selected module, keeping bulk analysis module-local."""
    root = args.root.resolve()
    if args.output and not args.module:
        raise ValueError("--output requires --module so the report has a module owner")
    if args.module:
        directory, _ = resolve_module(args.module, root)
        output = scratchpad_path(
            directory, args.output, default="reports/page-statistics.html"
        )
        if output.suffix.lower() != ".html":
            raise ValueError("Report --output must end in .html")
        data = build_dataset(root, args.module, not args.no_previews, args.text_counts)
        return save_report(data, directory, output)
    # Scan once, then partition the results instead of placing a shared file in the Skill.
    data = build_dataset(root, None, not args.no_previews, args.text_counts)
    reports = []
    for module in data["modules"]:
        directory, _ = resolve_module(module["directory"], root)
        subset = {**data, "modules": [module]}
        subset["pages"] = [
            p for p in data["pages"] if p["directory"] == module["directory"]
        ]
        ids = {p["module"] for p in subset["pages"]}
        assets = {f"assets/{p['assetId']}/" for p in subset["pages"]}
        subset["missingThumbnails"] = [
            p
            for p in data["missingThumbnails"]
            if p.startswith(module["directory"] + "/")
        ]
        subset["imageErrors"] = [
            e for e in data["imageErrors"] if e["page"].split("/", 1)[0] in ids
        ]
        subset["unmatchedThumbnails"] = [
            p
            for p in data["unmatchedThumbnails"]
            if any(p.startswith(prefix) for prefix in assets)
        ]
        output = scratchpad_path(directory, default="reports/page-statistics.html")
        reports.append(save_report(subset, directory, output))
    return {"reports": reports, "modules": len(reports), "pages": len(data["pages"])}


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        emit_result(write_report(args))
        return 0
    except (
        OSError,
        ValueError,
        RuntimeError,
        ImportError,
        subprocess.SubprocessError,
    ) as exc:
        return report_error(exc)


if __name__ == "__main__":
    raise SystemExit(main())

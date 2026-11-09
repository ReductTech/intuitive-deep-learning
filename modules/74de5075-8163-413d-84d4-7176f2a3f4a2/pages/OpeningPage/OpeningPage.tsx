import { moduleAssetUrl, Typography } from "@shuku/course-style/react";
import { moduleIdentity } from '../../outlines.json';
import './OpeningPage.css';

const speaker = { name: '赵鹏海', affiliation: '南开国际先进研究院（深圳福田）' };

export function OpeningPage() {
  return (
    <section className="llmpe-opening llmpe-spp-opening" aria-label="大模型驱动的实践能力培养体系与平台，CCF SPP第193期">
      <img className="llmpe-spp-network" src={moduleAssetUrl('images/spp/cover-network-background.svg')} alt="" aria-hidden="true" draggable={false}/>
      <div className="llmpe-spp-brand" aria-label="CCF SPP，第193期">
        <img className="llmpe-spp-logo" src={moduleAssetUrl('images/spp/ccf-official-logo.png')} alt="中国计算机学会 CCF" draggable={false}/>
        <span className="llmpe-spp-pilot-logo" role="img" aria-label="CCF 学生领航计划 SPP" style={{ backgroundImage: `url("${moduleAssetUrl('images/spp/spp-official-banner.jpg')}")` }}/>
        <span className="llmpe-spp-brand-divider" aria-hidden="true"/>
        <div className="llmpe-spp-wordmark">
          <Typography as="span" variant="h2" tone="accent">CCF SPP</Typography>
          <Typography as="span" variant="bodySmall" tone="accent">第 193 期</Typography>
        </div>
      </div>
      <header className="llmpe-opening-copy">
        <Typography as="h1" variant="display" tone="accent" className="llmpe-opening-title">
          <span className="llmpe-opening-title-line">大模型驱动的</span>
          <span className="llmpe-opening-title-line">实践能力培养体系与平台</span>
        </Typography>
      </header>
      <span className="llmpe-spp-speaker-rule" aria-hidden="true"/>
      <div className="llmpe-spp-speaker">
        <Typography as="p" variant="h2" tone="accent">{speaker.name}</Typography>
        <Typography as="p" variant="body" tone="muted">{speaker.affiliation}</Typography>
      </div>
      <div className="llmpe-spp-event-time">
        <Typography as="p" variant="body" tone="accent"><time dateTime="2026-11-04T19:30:00+08:00">2026年11月4日（周三）</time></Typography>
        <span className="llmpe-spp-time-divider" aria-hidden="true"/>
        <Typography as="p" variant="body" tone="muted">19:30—21:00（北京时间）</Typography>
      </div>
      <span className="llmpe-spp-footer-rule" aria-hidden="true"/>
    </section>
  );
}

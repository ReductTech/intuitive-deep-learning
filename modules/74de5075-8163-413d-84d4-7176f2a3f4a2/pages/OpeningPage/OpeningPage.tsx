import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { Typography } from "@shuku/course-style/react";
import { moduleIdentity } from '../../outlines.json';
import './OpeningPage.css';

const speaker = { name: '赵鹏海', affiliation: '南开国际先进研究院（深圳福田）' };

export function OpeningPage() {
  return (
    <section shuku-edit-id="e-25c97c80-e284-4639-a6da-77d25a48ea35" className="llmpe-opening llmpe-spp-opening" aria-label="大模型驱动的实践能力培养体系与平台，CCF SPP第193期">
      <img shuku-edit-id="e-889e90a7-a216-4bab-aa67-d0bc9ce0eb4a" className="llmpe-spp-network" src={moduleAssetUrl('images/spp/cover-network-background.svg')} alt="" aria-hidden="true" draggable={false}/>
      <div shuku-edit-id="e-af586da7-bb90-4d2a-8e09-38a778657e06" className="llmpe-spp-brand" aria-label="CCF SPP，第193期">
        <img shuku-edit-id="e-4432753f-31b7-46db-ba23-3e32c004500e" className="llmpe-spp-logo" src={moduleAssetUrl('images/spp/ccf-official-logo.png')} alt="中国计算机学会 CCF" draggable={false}/>
        <span shuku-edit-id="e-e9483654-5cf2-4140-b80f-f017ded535f1" className="llmpe-spp-pilot-logo" role="img" aria-label="CCF 学生领航计划 SPP" style={{ backgroundImage: `url("${moduleAssetUrl('images/spp/spp-official-banner.jpg')}")` }}/>
        <span shuku-edit-id="e-f864ed9e-4701-4e8b-95b4-07ce93e5ec99" className="llmpe-spp-brand-divider" aria-hidden="true"/>
        <div shuku-edit-id="e-46304306-a19a-4fa1-85cf-945afa150ff6" className="llmpe-spp-wordmark">
          <Typography shuku-edit-id="e-ae3d5b8b-8a2c-416b-964a-673b6d1e1810" as="span" variant="h2" tone="accent">CCF SPP</Typography>
          <Typography shuku-edit-id="e-0e2e990d-67d3-43d8-aa27-0f996c620db7" as="span" variant="bodySmall" tone="accent">第 193 期</Typography>
        </div>
      </div>
      <header shuku-edit-id="e-1b9f8989-e049-4694-aead-02ba6912d718" className="llmpe-opening-copy">
        <Typography shuku-edit-id="e-f640302e-9288-4384-8794-1d14a69de25b" as="h1" variant="display" tone="accent" className="llmpe-opening-title">
          <span shuku-edit-id="e-d4d5ee3b-12b4-4a25-9603-8db01f8bd2eb" className="llmpe-opening-title-line">大模型驱动的</span>
          <span shuku-edit-id="e-692a2517-8777-4888-9a07-f5c8eb251227" className="llmpe-opening-title-line">实践能力培养体系与平台</span>
        </Typography>
      </header>
      <span shuku-edit-id="e-c5d15408-2869-4a2b-a1d6-61ece421b136" className="llmpe-spp-speaker-rule" aria-hidden="true"/>
      <div shuku-edit-id="e-bc03bce7-76b2-4db1-a0e0-7ad0d4d5bd88" className="llmpe-spp-speaker">
        <Typography shuku-edit-id="e-7922a7cf-9d2c-4a6b-b936-52b6ce7dfb97" as="p" variant="h2" tone="accent">{speaker.name}</Typography>
        <Typography shuku-edit-id="e-74e1e369-f7a7-4768-99ec-07f15d8b94ba" as="p" variant="body" tone="muted">{speaker.affiliation}</Typography>
      </div>
      <div shuku-edit-id="e-601f1787-4a16-48ea-804f-bef9e089b4a8" className="llmpe-spp-event-time">
        <Typography shuku-edit-id="e-594009c9-695c-45de-9561-a6bd8863878e" as="p" variant="body" tone="accent"><time shuku-edit-id="e-303eba4e-36e6-4570-a64d-87ddbe8ee619" dateTime="2026-11-04T19:30:00+08:00">2026年11月4日（周三）</time></Typography>
        <span shuku-edit-id="e-8159a725-761e-44c5-ba7b-40025137f070" className="llmpe-spp-time-divider" aria-hidden="true"/>
        <Typography shuku-edit-id="e-e45289b3-376c-4660-907d-18f286218127" as="p" variant="body" tone="muted">19:30—21:00（北京时间）</Typography>
      </div>
      <span shuku-edit-id="e-a97840ba-7466-4265-a936-f2f6b76b757d" className="llmpe-spp-footer-rule" aria-hidden="true"/>
    </section>
  );
}

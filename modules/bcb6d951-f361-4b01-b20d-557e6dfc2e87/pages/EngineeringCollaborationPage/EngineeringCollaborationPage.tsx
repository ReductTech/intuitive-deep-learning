import { useId } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './EngineeringCollaborationPage.css';

function WorkScene({ stage }: { stage: 'problem' | 'collaborate' | 'experience' }) {
  const id = useId().replace(/:/g, '');
  const blue = `url(#${id}-blue)`;
  const paper = `url(#${id}-paper)`;
  const orange = `url(#${id}-orange)`;
  const together = stage === 'collaborate';
  const problem = stage === 'problem';
  const screenX = together ? 108 : 48;
  const screenY = together ? 65 : 80;
  return <div shuku-edit-id="e-20744e3f-b4cf-4b53-83ac-2968e63824b5" className="acw-engineering-illustration">
    <svg shuku-edit-id="e-09409c12-231a-4bc1-8bba-787461c75d20" viewBox="0 0 400 310" role="img" aria-label={{ problem: '课件制作中出现问题', collaborate: '人与AI一起动手修复同一份课件', experience: '课件完成验证，积累工程经验' }[stage]}>
      <defs shuku-edit-id="e-26362282-4e05-496f-98e9-dbc2384e7996">
        <linearGradient shuku-edit-id="e-58060f50-170f-453e-abcb-7beef3dda7d1" id={`${id}-blue`} x1="0" y1="0" x2="0.5" y2="1"><stop shuku-edit-id="e-f4896441-f2d4-4e94-8199-31a636317ba2" stopColor="#8cc4ff" /><stop shuku-edit-id="e-994f6e2c-ba60-4373-be65-f65ae93f3427" offset="1" stopColor="#1673f6" /></linearGradient>
        <linearGradient shuku-edit-id="e-c6bf873b-e645-4173-bcb8-1e46ceff7f96" id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-ae5d2aa9-2886-4729-8c7a-78f8a333ba0b" stopColor="#fff" /><stop shuku-edit-id="e-118575f8-c3f5-423b-b4f3-e92769a30e00" offset="1" stopColor="#e4eeff" /></linearGradient>
        <linearGradient shuku-edit-id="e-1c579f48-7805-4173-b3bc-d1b2b697e27e" id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-d26a6c9a-57a8-47d1-bc34-58a25fc685e9" stopColor="#ffd182" /><stop shuku-edit-id="e-09b464a6-b321-4f54-8c3e-6a8533df1154" offset="1" stopColor="#f07e47" /></linearGradient>
        <filter shuku-edit-id="e-da04d1d2-8e65-4352-a6d2-72abee3121ec" id={`${id}-shadow`} x="-25%" y="-25%" width="160%" height="170%"><feDropShadow shuku-edit-id="e-3812e12d-4821-4420-a5fd-036a920e5f6f" dx="0" dy="7" stdDeviation="4" floodColor="#27446e" floodOpacity=".14" /></filter>
      </defs>
      <g shuku-edit-id="e-9914108c-2249-4a37-a56e-cb1825fd1ce5" filter={`url(#${id}-shadow)`}>
        <g shuku-edit-id="e-061fdfc6-cad4-4b7d-8b92-885e5d5286d0" transform={`translate(${screenX} ${screenY})`}>
          <path shuku-edit-id="e-1472bce6-ded3-43c2-84b2-3cae1415ec4b" d="M106 171L77 206M130 171L159 206" stroke="#5e83b3" strokeWidth="10" strokeLinecap="round" />
          <rect shuku-edit-id="e-ac8fc1b8-09f2-48ca-87fc-f8c9b724107f" x="5" y="4" width="230" height="170" rx="9" fill={paper} stroke="#78acf3" strokeWidth="7" />
          <rect shuku-edit-id="e-35107a32-4e82-49f6-bc45-14d96db05ce7" x="-3" y="-3" width="247" height="15" rx="7" fill={blue} />
          <rect shuku-edit-id="e-0d9bb0ed-2fff-492f-b11d-3441fe232a03" x="-3" y="163" width="247" height="15" rx="7" fill={blue} />
          <path shuku-edit-id="e-978d9898-ce2e-481d-bb06-ba6a631c0598" d="M160 43H209M160 64H209M160 85H197" stroke="#a2bfeb" strokeWidth="7" strokeLinecap="round" />
          <path shuku-edit-id="e-d09e6b1e-fece-4026-89da-649f0a1a9bce" d="M39 117L88 76L137 117" fill="none" stroke="#458be9" strokeWidth="5" strokeDasharray={problem ? '6 6' : undefined} />
          {[[39,117],[88,76],[137,117]].map(([cx,cy])=><circle shuku-edit-id="e-945ea998-4f79-4bf9-89ef-86af828fa2ac" key={cx} cx={cx} cy={cy} r="12" fill={blue} stroke="#e8f2ff" strokeWidth="2" />)}
        </g>
        {problem && <g shuku-edit-id="e-db5ccfac-b9bf-4893-aea6-5a05c3c4edee" transform="translate(270 217)"><circle shuku-edit-id="e-48366ea6-4c5b-4d4d-98d4-9b3707b0c8fe" r="35" fill={orange} stroke="#fff4df" strokeWidth="5" /><path shuku-edit-id="e-1052f06b-05fc-4369-b264-43369270ba1c" d="M0 -18V5" stroke="white" strokeWidth="7" strokeLinecap="round" /><circle shuku-edit-id="e-93fafde7-98aa-496c-a5ac-ba9bd211a6e2" cy="18" r="4" fill="white" /></g>}
        {together && <>
          <path shuku-edit-id="e-9ea88647-3a10-44cc-a31a-2be9aeadfafb" d="M37 16H114Q137 16 137 39V73Q137 95 114 95H91L72 110V95H37Q15 95 15 73V39Q15 16 37 16Z" fill={paper} stroke="#c5dcff" strokeWidth="2" />
          <circle shuku-edit-id="e-7e96f7fd-a893-47f1-94ce-18d0f47e512b" cx="92" cy="173" r="29" fill={blue} />
          <path shuku-edit-id="e-72cdad04-5fb6-4747-a5cd-2fec211aaa66" d="M40 285V261Q43 213 92 213Q141 213 145 261V285Z" fill={blue} />
          <path shuku-edit-id="e-049b52ee-0ea0-4d2e-af85-f53a686f9582" d="M120 258L171 207" stroke="#eef5ff" strokeWidth="31" strokeLinecap="round" /><path shuku-edit-id="e-b26ea168-c87f-4151-a64f-c524ac5598ec" d="M120 258L171 207" stroke="#4997fa" strokeWidth="22" strokeLinecap="round" />
          <path shuku-edit-id="e-7f07a1de-0557-4da1-b5a0-fd2c91728aec" d="M160 211C144 189 158 163 180 165L169 180L179 193L193 192L205 177C215 205 188 225 169 214" fill={blue} stroke="#f5f9ff" strokeWidth="4" strokeLinejoin="round" />
        </>}
        {stage === 'experience' && <>
          <circle shuku-edit-id="e-feabd36b-b62d-422a-b5dd-b6bff10c6fcc" cx="270" cy="225" r="34" fill={blue} stroke="#f4f8ff" strokeWidth="5" /><path shuku-edit-id="e-ed4855cc-2d83-44b4-a4c6-52d3ba70cca4" d="M253 224L265 237L289 211" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path shuku-edit-id="e-adf67d0a-1aab-49f2-a4f3-c5e823b25065" d="M320 275L353 207" stroke="#ebf4ff" strokeWidth="25" strokeLinecap="round" /><path shuku-edit-id="e-726142de-fe89-4f1a-9d1b-c184c9324ed4" d="M320 275L353 207" stroke="#438ff1" strokeWidth="17" strokeLinecap="round" />
          <path shuku-edit-id="e-8258a188-a4f2-4e3f-863d-7aecbdd2df0a" d="M343 212C326 193 334 169 355 165L349 183L360 193L373 187L377 168C395 190 377 218 355 217" fill={blue} stroke="#e2eeff" strokeWidth="3" strokeLinejoin="round" />
        </>}
      </g>
    </svg>
    {together && <Typography shuku-edit-id="e-a3d3dce5-569d-4bb1-a936-3beafb00f49e" variant="h3" tone="accent" className="acw-engineering-ai">AI</Typography>}
  </div>;
}

function ProgressArrow() {
  return <svg shuku-edit-id="e-7b2cab9f-ce1d-4dcf-bf8b-47508bb84524" className="acw-engineering-arrow" viewBox="0 0 100 50" aria-hidden="true"><path shuku-edit-id="e-db0e1809-6b20-4aad-9483-68334f99a9b8" d="M7 34Q44 8 77 24" fill="none" stroke="#a9ceff" strokeWidth="10" strokeLinecap="round" /><path shuku-edit-id="e-98b09db0-203f-4a54-86ea-d3ead6b6b6e7" d="M65 7L94 29L63 41Z" fill="#4896fb" /></svg>;
}

export function EngineeringCollaborationPage() {
  return <ContentBlock shuku-edit-id="e-1bd2b8a2-cf15-4848-96f7-9d4804c44a63" className="acw-engineering-page" data-scene-id="e547db3b-9b4b-41a1-bcd7-69b6a3328edf" title={outline.pages.find(page => page.id === 'e547db3b-9b4b-41a1-bcd7-69b6a3328edf')!.title} subtitle="在真实挑战中，积累动手解决问题的经验" bodyClassName="acw-engineering-body">
    <div shuku-edit-id="e-01cc3d6b-9fd1-446d-bac5-8e71576edf59" className="acw-engineering-sequence">
      <div shuku-edit-id="e-bf6ab85f-cf02-4929-aeaa-b3621ff4e43c" className="acw-engineering-stage"><WorkScene stage="problem" /><Typography shuku-edit-id="e-749e8d96-2128-470b-8849-7d6bc745991b" variant="h3" align="center">遇到问题</Typography></div>
      <ProgressArrow />
      <div shuku-edit-id="e-e5e87503-e69f-4dd7-acce-94675ff2b5b0" className="acw-engineering-stage"><WorkScene stage="collaborate" /><Typography shuku-edit-id="e-ac2a26de-c7fa-4911-8862-c56becd12c73" variant="h3" align="center">和 AI 一起动手解决</Typography></div>
      <ProgressArrow />
      <div shuku-edit-id="e-e5ac1b42-f1cc-48d5-86a3-b260bd8ea675" className="acw-engineering-stage"><WorkScene stage="experience" /><Typography shuku-edit-id="e-2702e4f3-746b-499e-ac2a-e9099cc668df" variant="h3" align="center">积累工程经验</Typography></div>
    </div>
    <Typography shuku-edit-id="e-5b69c2dc-63a7-4a64-a723-608b244f9c8f" variant="subtitle" align="center" className="acw-engineering-takeaway">把一个个问题解决掉，就是在练自己的工程能力。</Typography>
  </ContentBlock>;
}

import { useId } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './LearnByExplainingPage.css';

function CourseIllustration({ kind }: { kind: 'concept' | 'teach' | 'gap' | 'revise' }) {
  const id = useId().replace(/:/g, '');
  const blue = `url(#${id}-blue)`;
  const paper = `url(#${id}-paper)`;
  const orange = `url(#${id}-orange)`;
  const isBook = kind === 'concept';
  const isGap = kind === 'gap';
  const isRevision = kind === 'revise';
  return <svg shuku-edit-id="e-44c30306-128b-4eea-910d-9ad31092d61b" className="acw-learning-art" viewBox="0 0 300 220" role="img" aria-label={{ concept: '从书本中选出一个知识点', teach: '把知识做成课件，讲给学习者听', gap: '放大检查课件中讲不清的知识联系', revise: '查阅资料，补全理解后修改课件' }[kind]}>
    <defs shuku-edit-id="e-7fbe65fd-9e37-428b-b2aa-ce5721b59239">
      <linearGradient shuku-edit-id="e-7119d0a6-40c9-4261-add1-236b1901d525" id={`${id}-blue`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-b3b49f20-23e7-4852-8e19-62e248ddb202" stopColor="#88beff" /><stop shuku-edit-id="e-5b19c3c5-a8a8-4787-85e4-f8f5fc95bf16" offset="1" stopColor="#1673f6" /></linearGradient>
      <linearGradient shuku-edit-id="e-b4780f51-d973-4a37-9e68-4306ad1376b2" id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-c1c18f36-ac66-4ebe-9a29-79cde7fe2001" stopColor="#fff" /><stop shuku-edit-id="e-46046383-6319-475e-b64e-4354ecc1a130" offset="1" stopColor="#e2ecff" /></linearGradient>
      <linearGradient shuku-edit-id="e-05bba063-ba1a-4743-9281-f9588857130e" id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-9578c785-be49-4901-9ab2-b31a0885c023" stopColor="#ffce75" /><stop shuku-edit-id="e-56b76c9c-1caf-4f43-994a-9f5a79248124" offset="1" stopColor="#f07e47" /></linearGradient>
      <filter shuku-edit-id="e-dbf5bd3f-71f3-480d-b4f4-76a504398f20" id={`${id}-shadow`} x="-30%" y="-30%" width="170%" height="180%"><feDropShadow shuku-edit-id="e-5819e8fc-3e03-48b4-9fa3-082c32b9c06e" dx="0" dy="8" stdDeviation="5" floodColor="#27446e" floodOpacity=".16" /></filter>
    </defs>
    <g shuku-edit-id="e-270c2156-6e31-4c36-99d2-2c2d94e9aa00" filter={`url(#${id}-shadow)`}>
      {isBook ? <>
        <path shuku-edit-id="e-4c6d90bc-fa34-40d1-ab4e-317ec1add364" d="M27 56Q87 29 149 52Q209 29 272 54L277 184Q213 165 150 189Q87 167 22 187Z" fill={blue} stroke="#3a85ee" strokeWidth="3" />
        <path shuku-edit-id="e-3340ad5f-cde0-4c03-8905-0a66c6731b8d" d="M32 43Q92 21 149 46Q212 22 267 41L269 172Q208 153 150 177Q91 154 30 174Z" fill={paper} stroke="#d0dff4" strokeWidth="2" />
        <path shuku-edit-id="e-9d8098b0-6d34-49fb-bd56-75d7d9e57b0e" d="M149 47V176" stroke="#c4d6ef" strokeWidth="3" />
        {[68,95,122,149].map(y => <path shuku-edit-id="e-779a2a15-014c-4f4f-888f-453c82f59975" key={y} d={`M50 ${y}Q91 ${y-10} 128 ${y+1}`} fill="none" stroke="#bfcee3" strokeWidth="6" strokeLinecap="round" />)}
        <rect shuku-edit-id="e-6d285b44-e659-4e15-88df-32f4b0948031" x="166" y="56" width="86" height="84" rx="12" fill="#fff1cd" stroke="#ffcc76" strokeWidth="3" />
        <path shuku-edit-id="e-78734bdf-307a-4067-8a2a-e251a67e4335" d="M209 79L188 116M209 79L232 116" stroke="#2d7ee9" strokeWidth="5" />
        {[[209,79],[188,116],[232,116]].map(([cx,cy])=><circle shuku-edit-id="e-10c73b71-e646-4265-baeb-e1870d8abaec" key={cx} cx={cx} cy={cy} r="10" fill={blue} stroke="white" strokeWidth="2" />)}
      </> : <>
        <path shuku-edit-id="e-de2ddb72-0887-435b-af3c-fa875ebcf719" d="M139 171L111 207M159 171L187 207" stroke="#557cae" strokeWidth="10" strokeLinecap="round" />
        <rect shuku-edit-id="e-d66298ac-6c39-4bfe-a7ac-1109ce763741" x="35" y="30" width="228" height="148" rx="12" fill={blue} stroke="#5d9eee" strokeWidth="3" />
        <rect shuku-edit-id="e-7ccde79c-379f-4649-b017-afcdd8bdc900" x="45" y="41" width="208" height="124" rx="5" fill={paper} />
        <rect shuku-edit-id="e-c4a6f61a-1e14-4095-b495-4698aff85d8f" x="27" y="25" width="244" height="15" rx="7" fill={blue} />
        <rect shuku-edit-id="e-2aa4e1ec-d4eb-4a2e-ad58-6359bd428d48" x="27" y="165" width="244" height="15" rx="7" fill={blue} />
        <path shuku-edit-id="e-f48d691f-871e-48d3-ab09-f608966f399f" d="M63 59H124M175 77H228M175 99H228M175 121H218" stroke="#a0bfee" strokeWidth="7" strokeLinecap="round" />
        <path shuku-edit-id="e-934d37b5-36f4-4d6b-a2bc-25514cf0cf60" d="M113 84L83 135" stroke="#4089ea" strokeWidth="5" />
        <path shuku-edit-id="e-73047a95-c5a9-4df1-ac89-96d2d296a406" d="M113 84L144 135" stroke={isGap ? '#f07e47' : '#4089ea'} strokeWidth="5" strokeDasharray={isGap ? '5 7' : undefined} />
        {[[113,84],[83,135]].map(([cx,cy]) => <circle shuku-edit-id="e-573022be-590a-4449-87b6-a4e961bd9781" key={cx} cx={cx} cy={cy} r="12" fill={blue} stroke="#599cec" strokeWidth="2" />)}
        <circle shuku-edit-id="e-64fe52b2-8521-49e5-b214-03f0f7c74850" cx="144" cy="135" r="12" fill={isGap ? '#fff7e9' : blue} stroke={isGap ? '#f07e47' : '#599cec'} strokeWidth="3" strokeDasharray={isGap ? '5 4' : undefined} />
        {kind === 'teach' && <>
          <path shuku-edit-id="e-6832cd7d-36e4-4096-96ac-11f0b0003945" d="M207 9H268Q285 9 285 27V45Q285 62 267 62H244L228 76V62H207Q191 62 191 45V27Q191 9 207 9Z" fill={paper} stroke="#d0dff4" strokeWidth="2" />
          {[215,239,263].map(cx => <circle shuku-edit-id="e-f07a1e88-7db6-4ec9-9d47-f2fc5702abfb" key={cx} cx={cx} cy="36" r="5" fill="#4389ed" />)}
          {[210,264].map(cx => <g shuku-edit-id="e-9a7995a4-5b46-4f4f-9842-b59ddea672e9" key={cx}><circle shuku-edit-id="e-7112fb97-81ee-46fb-84fe-40e07470ff5f" cx={cx} cy="161" r="17" fill={blue} /><path shuku-edit-id="e-516699ac-9950-4372-aacf-3fccf72f9d5a" d={`M${cx-25} 213V200Q${cx-24} 179 ${cx} 179Q${cx+24} 179 ${cx+25} 200V213Z`} fill={blue} /></g>)}
        </>}
        {isGap && <>
          <path shuku-edit-id="e-45531595-7f29-4af1-87bd-1f86d1cca1d4" d="M219 151L266 199" stroke="#f29b43" strokeWidth="22" strokeLinecap="round" />
          <circle shuku-edit-id="e-a5f331b8-4e0f-48bb-ba52-b5402e61b34f" cx="188" cy="113" r="61" fill="#ffffff65" stroke={orange} strokeWidth="15" />
          <path shuku-edit-id="e-3e785dc4-1d33-47b5-bb64-758113652deb" d="M195 86C195 67 224 69 224 85C224 98 209 98 209 110" fill="none" stroke="#ee8c35" strokeWidth="7" strokeLinecap="round" /><circle shuku-edit-id="e-cdb89b2c-fc52-4368-a404-5f872d953d64" cx="209" cy="124" r="4" fill="#ee8c35" />
        </>}
        {isRevision && <>
          <path shuku-edit-id="e-b07e34a1-53a8-4839-8e1f-75dd88a0f3df" d="M8 157Q46 140 79 155Q113 142 149 153L147 210Q112 200 79 214Q44 200 7 211Z" fill={paper} stroke="#8db6ed" strokeWidth="3" />
          <path shuku-edit-id="e-9da5e579-3750-4e79-9afe-0f3fe451e547" d="M79 157V211M22 170L62 176M22 184L62 190M95 170L132 165M95 184L132 179" stroke="#bfcee3" strokeWidth="4" />
          <path shuku-edit-id="e-a2173e0e-4afc-4bd2-a26a-b717b2b7dbfe" d="M60 194L99 132L114 142L75 204Z" fill={blue} stroke="#4a8de5" strokeWidth="2" /><path shuku-edit-id="e-2b9b725e-d3a1-4d2a-8792-fe92d165bf00" d="M60 194L57 211L75 204Z" fill="#f3c688" />
        </>}
      </>}
    </g>
  </svg>;
}

export function LearnByExplainingPage() {
  return <ContentBlock shuku-edit-id="e-d045f95a-0d80-4296-b0c3-547fc04e6ebc" className="acw-learning-page" data-scene-id="e828c4ec-c28f-4aa8-a4ee-4404531e2519" title={outline.pages.find(page => page.id === 'e828c4ec-c28f-4aa8-a4ee-4404531e2519')!.title} subtitle="费曼学习法 · Feynman Technique" bodyClassName="acw-learning-body">
    <svg shuku-edit-id="e-19f6cf03-8dba-481c-96df-cc08e4e6a438" className="acw-learning-arrows" viewBox="0 0 1538 680" aria-hidden="true">
      <defs shuku-edit-id="e-c2775eb5-df08-47f5-a8ee-3f556678a8dc"><linearGradient shuku-edit-id="e-6d883c78-1d25-4f72-aaf6-3f4c0e4e9860" id="acw-learning-arrow-blue"><stop shuku-edit-id="e-a8d63407-3567-4cc7-a347-9f4d0975c3fe" stopColor="#d7e8ff" /><stop shuku-edit-id="e-254416bb-5aa7-46e5-87bf-e75d1ccde2fa" offset="1" stopColor="#4094ff" /></linearGradient><marker shuku-edit-id="e-b50acd19-3e94-436c-bc6d-0b06dfd114a3" id="acw-learning-arrowhead" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path shuku-edit-id="e-f33341e0-c5f7-4e47-a57a-88b01023e88a" d="M0 0L5 2.5L0 5Z" fill="#4094ff" /></marker></defs>
      <g shuku-edit-id="e-fc76fc36-fd80-4959-8d92-f8e6deabf84e" fill="none" stroke="url(#acw-learning-arrow-blue)" strokeWidth="12" strokeLinecap="round" markerEnd="url(#acw-learning-arrowhead)">
        <path shuku-edit-id="e-895c5420-4666-414c-b5e2-c65d1cd49b0f" d="M640 105Q755 52 865 105" /><path shuku-edit-id="e-c1fb3324-c669-4521-af1e-9796f0b9db6e" d="M1100 245Q1142 323 1100 397" /><path shuku-edit-id="e-ec0f8e56-85d2-47e8-b051-b88ca1c74552" d="M857 565Q750 610 648 565" /><path shuku-edit-id="e-0aa033f3-6272-4dd6-b4b5-911c6cd65c4f" d="M445 403Q403 323 445 245" />
      </g>
    </svg>
    <div shuku-edit-id="e-3ca533aa-b330-4943-bf98-d948b2a1c6b9" className="acw-learning-stage acw-learning-one"><Typography shuku-edit-id="e-56e2e5c8-38d3-4f5c-9c7c-047962cd8afb" variant="h2" className="acw-learning-label"><span shuku-edit-id="e-2aa17aec-c359-4a73-aa73-b7d82e7f5625">1</span> 选一个知识点</Typography><CourseIllustration kind="concept" /></div>
    <div shuku-edit-id="e-96a07878-ce37-4f29-87ef-de4ba48905d8" className="acw-learning-stage acw-learning-two"><CourseIllustration kind="teach" /><Typography shuku-edit-id="e-d2469e63-aee8-47bc-88eb-2a901c40f65a" variant="h2" className="acw-learning-label"><span shuku-edit-id="e-d9b2c3ce-1ee1-4e6e-a677-24adbb181404">2</span><span shuku-edit-id="e-d3fdcfcb-0009-48c3-96cc-8bb496b047ea">做成课件<br shuku-edit-id="e-20750cbc-693d-4929-a97c-d254ba6ecde9" />讲给别人听</span></Typography></div>
    <div shuku-edit-id="e-71008306-2964-4218-8278-7180c9a3c7b1" className="acw-learning-center"><Typography shuku-edit-id="e-a450cf3f-e02a-4323-ac64-bfbaaacc8678" variant="display" align="center">给别人讲一遍<br shuku-edit-id="e-46eb141f-2c6b-44ce-b9f8-ceea0253f53d" />让自己理解更深</Typography></div>
    <div shuku-edit-id="e-94a8b327-e0ca-4ce8-9c68-eb9e8863542c" className="acw-learning-stage acw-learning-three"><CourseIllustration kind="gap" /><Typography shuku-edit-id="e-05e66ac9-20d4-4fd4-82b5-ced44e60ce86" variant="h2" className="acw-learning-label"><span shuku-edit-id="e-67382f61-f3e9-4ace-8879-54c026d7249d">3</span><span shuku-edit-id="e-c8faa6b0-1776-4f79-ae1a-42bd8f8952c3">发现讲不清<br shuku-edit-id="e-ec860275-16e9-48b3-8e38-e31e393fe4f4" />的地方</span></Typography></div>
    <div shuku-edit-id="e-19174113-d7b2-4321-94cd-e30fe44539b0" className="acw-learning-stage acw-learning-four"><Typography shuku-edit-id="e-08ac9004-da08-426a-9401-05cbdc56a9fe" variant="h2" className="acw-learning-label"><span shuku-edit-id="e-eb4d312e-d4e5-4f8e-aeaa-3bda88a920cf">4</span><span shuku-edit-id="e-c40c898d-8efb-4b6f-9f4f-c60c4b1eb7de">补全理解<br shuku-edit-id="e-873160f4-5995-4c71-9db6-85c278f6dc7d" />修改课件</span></Typography><CourseIllustration kind="revise" /></div>
    <Typography shuku-edit-id="e-4de2b72e-772e-49c4-ab17-a2e829523d56" variant="subtitle" tone="muted" align="center" className="acw-learning-takeaway">你在帮助别人学习，也在重新学懂自己的知识。</Typography>
  </ContentBlock>;
}

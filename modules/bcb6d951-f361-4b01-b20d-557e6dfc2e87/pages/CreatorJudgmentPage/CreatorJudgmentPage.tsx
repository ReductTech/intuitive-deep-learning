import { useId } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './CreatorJudgmentPage.css';

function JudgmentArtwork({ kind }: { kind: 'target' | 'palette' | 'course' }) {
  const id = useId().replace(/:/g, '');
  const blue = `url(#${id}-blue)`;
  const paper = `url(#${id}-paper)`;
  const orange = `url(#${id}-orange)`;
  return <svg shuku-edit-id="e-fc226567-ec55-49ef-95af-e84969796392" viewBox="0 0 400 300" className="acw-judgment-art" role="img" aria-label={{ target: '产品思维：让学习者看懂什么', palette: '审美判断：让知识怎样呈现更清楚', course: '两种判断共同塑造课件作品' }[kind]}>
    <defs shuku-edit-id="e-b1b25e3b-975b-4ddb-92f2-4d56d4ac7abd">
      <linearGradient shuku-edit-id="e-16df1e33-b417-4bcb-b01c-af663207ec53" id={`${id}-blue`} x1="0" y1="0" x2=".6" y2="1"><stop shuku-edit-id="e-d645074e-0ae1-4ee5-926c-55eb3aa59f4d" stopColor="#91c4ff" /><stop shuku-edit-id="e-b7b51277-a952-4bc4-a180-8990e8394915" offset="1" stopColor="#1673f6" /></linearGradient>
      <linearGradient shuku-edit-id="e-09a30501-223e-4fb1-a1bb-c3d9422cdc41" id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-e1336f1c-1fce-4b4a-a304-e3c809856833" stopColor="#fff" /><stop shuku-edit-id="e-72a525ee-004c-4660-9066-7299768ee943" offset="1" stopColor="#dfebff" /></linearGradient>
      <linearGradient shuku-edit-id="e-42b336ef-5142-4db1-aac7-9d86c74b8bdd" id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-90a55798-b0f0-4e43-afe7-63989c651bc8" stopColor="#ffdb88" /><stop shuku-edit-id="e-bfd2802e-96fa-40ea-a59c-f53f10850a53" offset="1" stopColor="#f28b47" /></linearGradient>
      <filter shuku-edit-id="e-a2cec865-fa91-4742-9a4c-65437c974fb1" id={`${id}-shadow`} x="-25%" y="-25%" width="160%" height="175%"><feDropShadow shuku-edit-id="e-6487ff1d-32b4-406a-884e-441e35a3cae7" dx="0" dy="6" stdDeviation="4" floodColor="#27446e" floodOpacity=".15" /></filter>
    </defs>
    <g shuku-edit-id="e-b2a0ed94-f7e6-40ad-a3c0-d133e535858d" filter={`url(#${id}-shadow)`}>
      {kind === 'target' && <>
        <circle shuku-edit-id="e-0e9e74a2-76e0-402c-857a-930feed59475" cx="180" cy="163" r="105" fill={blue} /><circle shuku-edit-id="e-be3f8eaa-91d9-4e25-87b2-5cf202926137" cx="180" cy="163" r="82" fill={paper} /><circle shuku-edit-id="e-7c9cb65d-950d-4df5-a649-e36f4806bf88" cx="180" cy="163" r="60" fill={blue} /><circle shuku-edit-id="e-18116131-6602-4e68-81c1-986338a6d13b" cx="180" cy="163" r="38" fill={paper} /><circle shuku-edit-id="e-47b84132-8cd9-4ad1-9bb2-465be036a8a2" cx="180" cy="163" r="15" fill={blue} />
        <path shuku-edit-id="e-d7df86e8-043c-482f-bc77-56a121ce23f4" d="M181 162L290 53" stroke="#fff" strokeWidth="25" strokeLinecap="round" /><path shuku-edit-id="e-afd1fdd2-e65a-4cad-8fa9-3e5b22088b57" d="M181 162L290 53" stroke="#448ff4" strokeWidth="14" strokeLinecap="round" />
        <path shuku-edit-id="e-51fdf9ad-4e2a-4f1c-af63-8ee6bee6914f" d="M265 74L261 40L290 12L294 47L329 51L300 80Z" fill={blue} stroke="#eff7ff" strokeWidth="4" strokeLinejoin="round" />
      </>}
      {kind === 'palette' && <>
        <path shuku-edit-id="e-b5c7560e-4e2b-450e-a885-3d922d784a1c" d="M222 40C151 14 71 43 41 104C5 176 59 253 139 258C164 260 184 250 178 227C169 197 187 182 217 188C242 194 273 187 286 166C320 113 277 60 222 40Z" fill="#fff9eb" stroke="#ffdfa8" strokeWidth="4" />
        {[[94,107],[150,75],[210,89],[70,166]].map(([cx,cy])=><circle shuku-edit-id="e-d9ae52ac-ac66-41c2-9ed2-57589ef85782" key={cx} cx={cx} cy={cy} r="19" fill={orange} />)}
        <circle shuku-edit-id="e-d6c1ce3e-1f1e-4f7c-81ff-ae7c1b95ef66" cx="131" cy="213" r="17" fill="#fff" stroke="#ffe5bc" strokeWidth="3" />
        <path shuku-edit-id="e-a4ad5c15-50ad-4b0c-945d-76121aadbba9" d="M202 248L278 116" stroke="#fff" strokeWidth="24" strokeLinecap="round" /><path shuku-edit-id="e-8ff2a1e9-8370-4510-bdfc-f2fa6363dc50" d="M202 248L278 116" stroke="#448df0" strokeWidth="15" strokeLinecap="round" />
        <path shuku-edit-id="e-ac805406-0682-4fa1-bce2-964318e91e66" d="M260 129C254 93 290 86 309 63C314 97 311 121 284 138Z" fill={orange} stroke="#fff7e8" strokeWidth="4" />
      </>}
      {kind === 'course' && <>
        <path shuku-edit-id="e-6cec7ec1-55f4-4888-b38a-d16b070ec85f" d="M180 236L150 277M208 236L239 277" stroke="#5d82b0" strokeWidth="11" strokeLinecap="round" />
        <rect shuku-edit-id="e-6d1745ce-4f49-4064-9440-bbd9338538ea" x="28" y="28" width="344" height="216" rx="12" fill={paper} stroke="#80b1f5" strokeWidth="7" />
        <rect shuku-edit-id="e-15465032-e04b-407c-be11-5e31f4594326" x="17" y="20" width="366" height="19" rx="9" fill={blue} />
        <rect shuku-edit-id="e-05530b57-0d49-4142-8a8d-1de64734b2d4" x="17" y="233" width="366" height="19" rx="9" fill={blue} />
        <path shuku-edit-id="e-47d5bbe2-f2ef-4ff8-bfa4-803b62e888ac" d="M272 87H333M272 109H333M272 131H322" stroke="#a1bfee" strokeWidth="8" strokeLinecap="round" />
        <path shuku-edit-id="e-e8fdc1a3-cae0-4ccb-bfdb-058fbd6c94bb" d="M155 119V145M86 145H226M86 145V171M155 145V171M226 145V171" stroke="#6a9be6" strokeWidth="4" fill="none" />
        <rect shuku-edit-id="e-5279d9c6-bf43-438e-957e-9947beeb9302" x="125" y="83" width="60" height="38" rx="11" fill={blue} />
        {[57,126,197].map(x=><rect shuku-edit-id="e-bb01933a-12d3-47a7-87aa-aec2cd48e5b1" key={x} x={x} y="171" width="58" height="27" rx="9" fill={blue} />)}
      </>}
    </g>
  </svg>;
}

export function CreatorJudgmentPage() {
  return <ContentBlock shuku-edit-id="e-1ea2f6b7-1f41-4b45-ad14-5668af1ca37e" className="acw-judgment-page" data-scene-id="a0e58f48-21d3-402c-993e-991a661ca3c6" title={outline.pages.find(page => page.id === 'a0e58f48-21d3-402c-993e-991a661ca3c6')!.title} subtitle="当实现越来越容易，判断与取舍更值得练习" bodyClassName="acw-judgment-body">
    <div shuku-edit-id="e-701633e8-53c4-4c27-9452-76826f7172ab" className="acw-judgment-lens acw-judgment-lens-product" aria-hidden="true" />
    <div shuku-edit-id="e-40826970-d985-4923-9609-a11a1d95b82c" className="acw-judgment-lens acw-judgment-lens-taste" aria-hidden="true" />
    <div shuku-edit-id="e-05ffd392-9404-40db-86d4-d66ab9b86307" className="acw-judgment-product">
      <JudgmentArtwork kind="target" />
      <Typography shuku-edit-id="e-39076c19-4356-412e-a633-b0956a17cc84" variant="h3" align="center">产品思维</Typography>
      <Typography shuku-edit-id="e-e0958f44-a777-491d-bf2f-2b4e0ae598b3" variant="subtitle" tone="muted" align="center">让学习者看懂什么</Typography>
    </div>
    <div shuku-edit-id="e-874e8bac-94a5-402e-ad48-f72970a4e454" className="acw-judgment-work">
      <Typography shuku-edit-id="e-7a78ded8-d41a-4ef1-81fe-7f9d8a857bce" variant="h3" className="acw-judgment-work-label">好的作品</Typography>
      <JudgmentArtwork kind="course" />
      <Typography shuku-edit-id="e-1d5d4fa1-2d64-4c90-9b40-687e5109e18e" variant="h3" align="center">在制作课件中练习</Typography>
    </div>
    <div shuku-edit-id="e-cd627135-e2fd-4ec2-9aa6-4cbcf6c1ed62" className="acw-judgment-taste">
      <JudgmentArtwork kind="palette" />
      <Typography shuku-edit-id="e-156f3817-33fe-42c2-946f-332b4a97b2fe" variant="h3" align="center">审美判断</Typography>
      <Typography shuku-edit-id="e-84cf8678-b96e-4414-aaa7-b69ba2c19826" variant="subtitle" tone="muted" align="center">让知识怎样呈现更清楚</Typography>
    </div>
    <Typography shuku-edit-id="e-9625437e-615c-467f-9c7f-176badd27a9e" variant="subtitle" tone="muted" align="center" className="acw-judgment-takeaway">在真实创作中，练习常规课程较少涉及的产品思维与审美判断。</Typography>
  </ContentBlock>;
}

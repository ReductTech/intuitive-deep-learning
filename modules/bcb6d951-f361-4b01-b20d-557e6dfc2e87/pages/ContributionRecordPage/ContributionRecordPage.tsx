import { useId } from 'react';
import { GitBranch, Lightbulb, SlidersHorizontal, UserRound } from 'lucide-react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './ContributionRecordPage.css';

function CoursePreview() {
  const id = useId().replace(/:/g, '');
  return <div shuku-edit-id="e-e8937ba4-a64b-40d4-80da-9e51f42c8e34" className="acw-credit-preview">
    <svg shuku-edit-id="e-708c5c6f-ee21-476f-85f0-7d82dd3b37f4" viewBox="0 0 500 320" role="img" aria-label="作为个人作品展示的课件示意">
      <defs shuku-edit-id="e-523cf7cc-9460-42fa-88e2-b0cf655f32b2">
        <linearGradient shuku-edit-id="e-1b538153-7ecf-4e48-8517-18b88c3e05c6" id={`${id}-blue`} x1="0" y1="0" x2=".5" y2="1"><stop shuku-edit-id="e-98babbac-f1d7-4a77-99d1-35c25b6d95ec" stopColor="#8ac0ff" /><stop shuku-edit-id="e-4e6ea530-8b61-4560-a50d-5f52f71e85e6" offset="1" stopColor="#1673f6" /></linearGradient>
        <linearGradient shuku-edit-id="e-88acb4a6-526d-4168-8673-805a0968031f" id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-20e810ec-fab2-44d1-9378-61afea549b19" stopColor="#fff" /><stop shuku-edit-id="e-82686067-5942-4252-af4e-c7e705ca307f" offset="1" stopColor="#e4eeff" /></linearGradient>
        <filter shuku-edit-id="e-0c991a6c-ef5d-4b4a-b9f1-42a82dc7ef85" id={`${id}-shadow`} x="-20%" y="-20%" width="150%" height="160%"><feDropShadow shuku-edit-id="e-16f173ee-dde8-415e-87ae-08ab2937023b" dx="0" dy="6" stdDeviation="4" floodColor="#27446e" floodOpacity=".12" /></filter>
      </defs>
      <g shuku-edit-id="e-243ef69f-4f04-4255-a81f-3c404cd9b94f" filter={`url(#${id}-shadow)`}>
        <rect shuku-edit-id="e-96dad0f1-8962-473f-83f3-1edc636943e2" x="15" y="15" width="470" height="286" rx="18" fill={`url(#${id}-paper)`} stroke="#b5d2ff" strokeWidth="3" />
        <rect shuku-edit-id="e-4ca0acc8-c393-479c-819b-c5f9a78d7a7b" x="13" y="8" width="474" height="21" rx="10" fill={`url(#${id}-blue)`} />
        <path shuku-edit-id="e-4f616c2a-ec9b-4e08-bce0-8888ead62432" d="M24 243H477V283Q477 296 461 296H39Q24 296 24 281Z" fill="#e5efff" />
        <path shuku-edit-id="e-4b0def85-49cb-4afd-9043-171fa391b6cd" d="M195 114V148M105 148H285M105 148V184M195 148V184M285 148V184" fill="none" stroke="#76a6ef" strokeWidth="4" />
        <rect shuku-edit-id="e-6824666d-bb38-4f26-b33b-628a1543d4d2" x="158" y="70" width="74" height="46" rx="13" fill={`url(#${id}-blue)`} />
        {[68,158,248].map(x=><rect shuku-edit-id="e-018ca228-cf33-4427-949f-4309323d7c08" key={x} x={x} y="184" width="74" height="34" rx="12" fill={`url(#${id}-blue)`} />)}
        <path shuku-edit-id="e-d6702709-827e-4cb3-8f28-a1c509e937ee" d="M337 74H424M337 98H424M337 122H410" stroke="#a0bfee" strokeWidth="8" strokeLinecap="round" />
        <path shuku-edit-id="e-3194664b-5ffc-480d-931a-a08a62a23d57" d="M433 254L462 304L441 296L431 313L421 306L431 288L410 286Z" fill="#1673f6" stroke="white" strokeWidth="4" strokeLinejoin="round" />
        <path shuku-edit-id="e-8cda1f6b-ecfa-4169-9e72-db8a35414ba0" d="M418 244L412 235M437 239L439 227M452 247L461 240" stroke="#6eacff" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
    <Typography shuku-edit-id="e-8fc38822-3942-403f-8ef7-03cc9c235e42" variant="h3" align="center" className="acw-credit-preview-label">课件作品</Typography>
  </div>;
}

const contributionTopics = [
  { icon: UserRound, label: '我负责什么' },
  { icon: Lightbulb, label: '我解决了什么' },
  { icon: SlidersHorizontal, label: '我怎样把它改好' },
];

export function ContributionRecordPage() {
  const page = outline.pages.find(item => item.id === 'ce4ed8dd-ce1b-4b0c-a36a-cc9745f46b90')!;
  return <ContentBlock shuku-edit-id="e-a6101fa7-23da-400a-b5f5-93b8455f82d5" className="acw-credit-page" data-scene-id={page.id} title={page.title} subtitle="把真实做过的事，变成可以展示的项目经历" bodyClassName="acw-credit-body">
    <section shuku-edit-id="e-9791ba20-655e-4feb-af42-56413e42924b" className="acw-credit-profile" aria-label="个人课件作品档案示意">
      <header shuku-edit-id="e-d52d13ea-b36c-4f96-a78a-127530a3f04c" className="acw-credit-profile-header">
        <div shuku-edit-id="e-ca707032-1829-4b3e-bc5d-3ade48826201" className="acw-credit-identity"><div shuku-edit-id="e-d7a13e7c-ca52-440a-a49e-1c6dc2801808" className="acw-credit-avatar"><UserRound size={42} strokeWidth={2} /></div><Typography shuku-edit-id="e-05069413-bf68-475b-907f-14feb267eb8e" variant="h3">你的作品档案</Typography></div>
        <div shuku-edit-id="e-32455eb3-32d9-4587-8062-4a60d370807e" className="acw-credit-history"><GitBranch size={28} /><Typography shuku-edit-id="e-4044d6d5-dced-43f1-b17e-110f4302c180" variant="bodySmall" tone="inherit">Git 版本管理</Typography><Typography shuku-edit-id="e-b22e3e6b-7b3a-4531-b61c-d0cdb847ef19" variant="body" className="acw-credit-trace">贡献可追溯</Typography></div>
      </header>
      <div shuku-edit-id="e-bf7c21b1-be17-498c-a8fb-a89f8c2932bf" className="acw-credit-profile-content">
        <CoursePreview />
        <div shuku-edit-id="e-af19bc90-ebf7-49ab-984d-da818f0d2087" className="acw-credit-topics">{contributionTopics.map(({icon: Icon, label})=><div shuku-edit-id="e-489e5787-ec85-4123-bb4b-92eede9387bf" className="acw-credit-topic" key={label}><div shuku-edit-id="e-61c46c54-f591-4f19-8f98-e602c32c60c1" className="acw-credit-topic-icon"><Icon size={43} strokeWidth={2} /></div><Typography shuku-edit-id="e-8373cc94-77e7-43c8-a7a4-f57abc4fb502" variant="h3">{label}</Typography></div>)}</div>
      </div>
    </section>
    <Typography shuku-edit-id="e-638c9bf0-9d34-4019-a949-3d7b9a758909" variant="subtitle" align="center" className="acw-credit-contexts">保研交流 · 求职面试 · …</Typography>
  </ContentBlock>;
}

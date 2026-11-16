import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import type { ReactNode } from 'react';
import { ChevronRight, Download, Grid2X2, Home, Info, Minus, MousePointer2, Search, ShoppingBag, Square, UserRound, X } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import { moduleIdentity } from '../../outlines.json';
import './ToolOverviewPage.css';

const iconUrl = (name: string) => moduleAssetUrl(`icons/${name}.svg`);
const Text = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <Typography shuku-edit-id="e-b0f7fed5-00e3-46aa-9da4-88e2597e44ae" variant="bodySmall" tone="inherit" className={className}>{children}</Typography>;

function WindowBar({ children }: { children: ReactNode }) {
  return <div shuku-edit-id="e-bcc55273-add9-45fd-a91b-db62fd4f02c1" className="acw-window-bar"><div shuku-edit-id="e-2af4db1f-eb1c-42b1-856a-8d8ae8cdeb7c" className="acw-window-name">{children}</div><div shuku-edit-id="e-9b8b8b6c-8280-410a-8127-f328e987e242" className="acw-window-actions" aria-hidden="true"><Minus size={17} /><Square size={14} /><X size={18} /></div></div>;
}

function StoreMockup() {
  return <div shuku-edit-id="e-f216a262-89f6-4d0b-89e1-30e6be5c888e" className="acw-window" role="img" aria-label="Microsoft Store 界面示意：搜索 ChatGPT，确认 OpenAI 发布者，点击安装">
    <WindowBar><ShoppingBag size={25} color="#1673f6" /><Text>Microsoft Store</Text></WindowBar>
    <div shuku-edit-id="e-6372ff38-3d2f-4d4a-980b-c97cb9dc06ff" className="acw-store-body">
      <aside shuku-edit-id="e-a3753022-ed40-463c-8590-2f45435ea8b2" className="acw-store-nav" aria-hidden="true"><Home /><Grid2X2 /><Download /><UserRound /></aside>
      <div shuku-edit-id="e-b2c9f56d-4c7d-41f4-815e-71cf7736e9ca" className="acw-store-content">
        <div shuku-edit-id="e-20c950d5-48c9-4257-944f-7caf1cf78203" className="acw-search"><Text>ChatGPT</Text><Search size={25} /></div>
        <div shuku-edit-id="e-8614aa5c-6654-4855-8c1c-221a5ab83e51" className="acw-app-result">
          <img shuku-edit-id="e-5601652a-ddbb-437f-9e5a-a01055ea87d9" src={iconUrl('openai')} className="acw-chatgpt-icon" alt="" />
          <div shuku-edit-id="e-81a69947-56f1-4577-b276-816d9a891390"><Typography shuku-edit-id="e-78d75506-7298-4be5-9409-1d3591cc6de3" variant="h3">ChatGPT</Typography><Text>OpenAI</Text></div>
          <div shuku-edit-id="e-d92f3dfe-f81e-42e4-b1f2-d7c417c9af6b" className="acw-install"><Text>安装</Text><MousePointer2 className="acw-cursor" size={35} fill="white" color="#21324a" /></div>
        </div>
      </div>
    </div>
    <Typography shuku-edit-id="e-1c55f4ec-a62e-4feb-91e4-390eb38565d9" variant="bodySmall" tone="muted" className="acw-mock-caption">界面示意</Typography>
  </div>;
}

function ConnectionMockup() {
  return <div shuku-edit-id="e-5d6bbc41-c07c-4b26-9fd2-6bad7948b144" className="acw-window" role="img" aria-label="CC Switch 界面示意：选择 Codex，添加供应商，填写 Base URL 和 API Key，保存并启用">
    <WindowBar><span shuku-edit-id="e-3a35ba2c-400a-4879-b9df-5a9f16aa8480" className="acw-switch-icon" /><Text>CC Switch</Text></WindowBar>
    <div shuku-edit-id="e-05d17aa6-84bb-4a07-9d60-fbeb89ff512e" className="acw-connection-body">
      <div shuku-edit-id="e-a26a20ff-b90b-44de-8501-b5db94ebb3ec" className="acw-tabs"><Text>Claude Code</Text><Text className="acw-tab-selected">Codex</Text></div>
      <Typography shuku-edit-id="e-4e31d969-5635-446c-b16b-1f9d88765f31" variant="h3" className="acw-form-title">添加供应商</Typography>
      <div shuku-edit-id="e-bfb1cccb-0b2b-49b9-912a-2c0c5a445f65" className="acw-fields">
        <div shuku-edit-id="e-b6ab17fb-3745-4bb3-834d-cd1d9ca426b4" className="acw-field"><Text>Base URL</Text><div shuku-edit-id="e-09eb33f8-91af-4e71-bac3-e5b2c977c692" className="acw-field-value"><Text>https://api.example.com/v1</Text></div><Text className="acw-field-hint">接口地址</Text></div>
        <div shuku-edit-id="e-16255aa8-9e99-4daa-a429-e8d25c4b8167" className="acw-field"><Text>API Key</Text><div shuku-edit-id="e-f351acc6-51ce-4c4b-827b-152991be2808" className="acw-field-value"><Text>••••••••••••••</Text></div><Text className="acw-field-hint">密钥</Text></div>
      </div>
      <div shuku-edit-id="e-f546c1a3-43f8-438d-b191-d61c91cbd83d" className="acw-save"><Text>保存并启用</Text></div>
    </div>
    <Typography shuku-edit-id="e-c83cf3b6-f50e-4703-b2e8-a3ee4dfb9072" variant="bodySmall" tone="muted" className="acw-mock-caption">界面示意</Typography>
  </div>;
}

function ModelRecommendation({ brand, model, icon }: { brand: string; model: string; icon: string }) {
  return <div shuku-edit-id="e-1138960a-280f-4d68-bbac-4e1b9be7e90e" className="acw-model">
    <img shuku-edit-id="e-5f90d466-85de-4864-b2c6-5f67c8c0ec49" src={iconUrl(icon)} alt={`${brand} 图标`} className="acw-model-icon" />
    <div shuku-edit-id="e-f7a72bdf-a8d9-4f47-bfe8-a5cf562799d2" className="acw-model-info"><Typography shuku-edit-id="e-87954a6e-18ad-49fe-8924-e35987542032" variant="subtitle">{brand}</Typography><Typography shuku-edit-id="e-4ce36146-3cc5-47fb-9743-352a8f424ed7" variant="h2" wrap="nowrap">{model}</Typography><div shuku-edit-id="e-5668ed65-ff43-4fe6-8c47-0b9b6346cf9f" className="acw-effort"><Text>推理程度：中</Text></div></div>
  </div>;
}

export function ToolOverviewPage() {
  return <article shuku-edit-id="e-54137c54-cd61-41be-8ddb-b49a1288a01a" className="acw-environment" data-scene-id="18ad36ae-81cb-40b1-a240-301a3de410ac">
    <header shuku-edit-id="e-03740273-a2f0-4c39-8e03-be058d7480a0" className="acw-header">
      <Typography shuku-edit-id="e-760c5ab0-3a97-48db-9e47-dbcf6f10c1d5" variant="display" tone="accent">环境准备</Typography>
      <Typography shuku-edit-id="e-b2d3b141-15b4-4ead-b7b9-952e6d7c03bb" variant="subtitle" tone="muted">以 Windows 电脑为例：安装客户端 → 配置连接 → 选择模型</Typography>
    </header>
    <div shuku-edit-id="e-f9d1feb8-0774-48e4-9e5e-77c43feb7a39" className="acw-steps">
      <section shuku-edit-id="e-93abf0d9-17b6-414f-9e47-0eae19e3ebed" className="acw-step">
        <div shuku-edit-id="e-c0438785-bccd-4b7a-97e1-19372f8ef157" className="acw-step-heading"><Typography shuku-edit-id="e-98e865ad-8b9f-460a-b704-d3b0455de2ea" variant="h3" className="acw-number">1</Typography><Typography shuku-edit-id="e-f8d9d762-048b-4856-82cf-f590b386929e" variant="h3">安装客户端</Typography></div>
        <Text className="acw-step-description">打开 Microsoft Store，搜索 ChatGPT 并安装</Text>
        <StoreMockup />
        <Text className="acw-step-foot">安装后打开客户端，进入 Codex 工作区</Text>
      </section>
      <section shuku-edit-id="e-a86af6a8-baf8-4fc8-9c02-6995c278cb83" className="acw-step">
        <div shuku-edit-id="e-9d0c7301-091a-43d8-ac39-290d56ced893" className="acw-step-heading"><Typography shuku-edit-id="e-e7c529be-0856-438e-b2dd-bd910f12db9f" variant="h3" className="acw-number">2</Typography><Typography shuku-edit-id="e-0a41f352-1ca3-4ad1-af2c-63af8308a682" variant="h3">配置 CC Switch</Typography></div>
        <Text className="acw-step-description">安装并打开 CC Switch，选择 Codex → 添加供应商</Text>
        <ConnectionMockup />
        <Text className="acw-step-foot">Base URL 和密钥向所选 API 服务商获取</Text>
      </section>
      <section shuku-edit-id="e-4d818a8d-f47d-4b84-bf56-ae93efbdcdf1" className="acw-step">
        <div shuku-edit-id="e-4dc11796-59ab-4233-add0-1a068893a1c6" className="acw-step-heading"><Typography shuku-edit-id="e-e8cf3766-b3d7-4771-995b-22c033acf3b4" variant="h3" className="acw-number">3</Typography><Typography shuku-edit-id="e-25d4dae0-f2bd-491d-a788-41a9e2c9c8a2" variant="h3">推荐模型</Typography></div>
        <div shuku-edit-id="e-bde565a0-9738-4b13-927b-da099e850322" className="acw-step-description" aria-hidden="true" />
        <div shuku-edit-id="e-3590fbff-9940-4c3b-93eb-8ec129ff7643" className="acw-models"><ModelRecommendation brand="DeepSeek" model="V4.1 Flash" icon="deepseek" /><ModelRecommendation brand="OpenAI" model="GPT 6.1 So" icon="openai" /></div>
      </section>
      <ChevronRight className="acw-flow-arrow acw-flow-arrow-one" size={35} aria-hidden="true" /><ChevronRight className="acw-flow-arrow acw-flow-arrow-two" size={35} aria-hidden="true" />
    </div>
    <footer shuku-edit-id="e-e2cc3c69-e606-48f3-9d86-a2ea1579d425" className="acw-note"><Info size={33} /><Typography shuku-edit-id="e-3a87e48e-d8d7-4ad8-9316-533a9d2d6bab" variant="body">客户端提供 Harness（运行框架）；接入模型后，才能开始协作开发。</Typography></footer>
  </article>;
}

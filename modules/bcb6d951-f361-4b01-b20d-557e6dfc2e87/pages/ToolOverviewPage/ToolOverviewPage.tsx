import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import type { ReactNode } from 'react';
import { ChevronRight, Download, Grid2X2, Home, Info, Minus, MousePointer2, Search, ShoppingBag, Square, UserRound, X } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import { moduleIdentity } from '../../outlines.json';
import './ToolOverviewPage.css';

const iconUrl = (name: string) => moduleAssetUrl(`icons/${name}.svg`);
const Text = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <Typography variant="bodySmall" tone="inherit" className={className}>{children}</Typography>;

function WindowBar({ children }: { children: ReactNode }) {
  return <div className="acw-window-bar"><div className="acw-window-name">{children}</div><div className="acw-window-actions" aria-hidden="true"><Minus size={17} /><Square size={14} /><X size={18} /></div></div>;
}

function StoreMockup() {
  return <div className="acw-window" role="img" aria-label="Microsoft Store 界面示意：搜索 ChatGPT，确认 OpenAI 发布者，点击安装">
    <WindowBar><ShoppingBag size={25} color="#1673f6" /><Text>Microsoft Store</Text></WindowBar>
    <div className="acw-store-body">
      <aside className="acw-store-nav" aria-hidden="true"><Home /><Grid2X2 /><Download /><UserRound /></aside>
      <div className="acw-store-content">
        <div className="acw-search"><Text>ChatGPT</Text><Search size={25} /></div>
        <div className="acw-app-result">
          <img src={iconUrl('openai')} className="acw-chatgpt-icon" alt="" />
          <div><Typography variant="h3">ChatGPT</Typography><Text>OpenAI</Text></div>
          <div className="acw-install"><Text>安装</Text><MousePointer2 className="acw-cursor" size={35} fill="white" color="#21324a" /></div>
        </div>
      </div>
    </div>
    <Typography variant="bodySmall" tone="muted" className="acw-mock-caption">界面示意</Typography>
  </div>;
}

function ConnectionMockup() {
  return <div className="acw-window" role="img" aria-label="CC Switch 界面示意：选择 Codex，添加供应商，填写 Base URL 和 API Key，保存并启用">
    <WindowBar><span className="acw-switch-icon" /><Text>CC Switch</Text></WindowBar>
    <div className="acw-connection-body">
      <div className="acw-tabs"><Text>Claude Code</Text><Text className="acw-tab-selected">Codex</Text></div>
      <Typography variant="h3" className="acw-form-title">添加供应商</Typography>
      <div className="acw-fields">
        <div className="acw-field"><Text>Base URL</Text><div className="acw-field-value"><Text>https://api.example.com/v1</Text></div><Text className="acw-field-hint">接口地址</Text></div>
        <div className="acw-field"><Text>API Key</Text><div className="acw-field-value"><Text>••••••••••••••</Text></div><Text className="acw-field-hint">密钥</Text></div>
      </div>
      <div className="acw-save"><Text>保存并启用</Text></div>
    </div>
    <Typography variant="bodySmall" tone="muted" className="acw-mock-caption">界面示意</Typography>
  </div>;
}

function ModelRecommendation({ brand, model, icon }: { brand: string; model: string; icon: string }) {
  return <div className="acw-model">
    <img src={iconUrl(icon)} alt={`${brand} 图标`} className="acw-model-icon" />
    <div className="acw-model-info"><Typography variant="subtitle">{brand}</Typography><Typography variant="h2" wrap="nowrap">{model}</Typography><div className="acw-effort"><Text>推理程度：中</Text></div></div>
  </div>;
}

export function ToolOverviewPage() {
  return <article className="acw-environment" data-scene-id="18ad36ae-81cb-40b1-a240-301a3de410ac">
    <header className="acw-header">
      <Typography variant="display" tone="accent">环境准备</Typography>
      <Typography variant="subtitle" tone="muted">以 Windows 电脑为例：安装客户端 → 配置连接 → 选择模型</Typography>
    </header>
    <div className="acw-steps">
      <section className="acw-step">
        <div className="acw-step-heading"><Typography variant="h3" className="acw-number">1</Typography><Typography variant="h3">安装客户端</Typography></div>
        <Text className="acw-step-description">打开 Microsoft Store，搜索 ChatGPT 并安装</Text>
        <StoreMockup />
        <Text className="acw-step-foot">安装后打开客户端，进入 Codex 工作区</Text>
      </section>
      <section className="acw-step">
        <div className="acw-step-heading"><Typography variant="h3" className="acw-number">2</Typography><Typography variant="h3">配置 CC Switch</Typography></div>
        <Text className="acw-step-description">安装并打开 CC Switch，选择 Codex → 添加供应商</Text>
        <ConnectionMockup />
        <Text className="acw-step-foot">Base URL 和密钥向所选 API 服务商获取</Text>
      </section>
      <section className="acw-step">
        <div className="acw-step-heading"><Typography variant="h3" className="acw-number">3</Typography><Typography variant="h3">推荐模型</Typography></div>
        <div className="acw-step-description" aria-hidden="true" />
        <div className="acw-models"><ModelRecommendation brand="DeepSeek" model="V4.1 Flash" icon="deepseek" /><ModelRecommendation brand="OpenAI" model="GPT 6.1 So" icon="openai" /></div>
      </section>
      <ChevronRight className="acw-flow-arrow acw-flow-arrow-one" size={35} aria-hidden="true" /><ChevronRight className="acw-flow-arrow acw-flow-arrow-two" size={35} aria-hidden="true" />
    </div>
    <footer className="acw-note"><Info size={33} /><Typography variant="body">客户端提供 Harness（运行框架）；接入模型后，才能开始协作开发。</Typography></footer>
  </article>;
}

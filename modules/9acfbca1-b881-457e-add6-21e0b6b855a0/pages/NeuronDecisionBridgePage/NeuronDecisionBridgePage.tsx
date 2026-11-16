import { useState } from 'react';
import "./NeuronDecisionBridgePage.css";
import { ContentBlock, Typography } from "@shuku/course-style/react";

const neurons = [
  { label: '发现食物', short: '食物', x: 14, y: 18 },
  { label: '感到危险', short: '危险', x: 10, y: 50 },
  { label: '正在饥饿', short: '饥饿', x: 14, y: 82 },
] as const;

const outcomes = [
  { title: '休息等待', rule: '三个单元都为 0：没有信号被激活。' },
  { title: '寻找食物', rule: '只有饥饿为 1：开始寻找食物。' },
  { title: '立即回避', rule: '只有危险为 1：优先避开风险。' },
  { title: '忍饥避险', rule: '危险与饥饿同为 1：先回避。' },
  { title: '靠近食物', rule: '只有食物为 1：向食物靠近。' },
  { title: '立即觅食', rule: '食物与饥饿同为 1：快速靠近。' },
  { title: '放弃食物', rule: '食物与危险同为 1：回避优先。' },
  { title: '绕行觅食', rule: '三个单元都为 1：避险后再觅食。' },
] as const;

const combinations = Array.from({ length: 8 }, (_, index) => index.toString(2).padStart(3, '0'));

export function NeuronDecisionBridgePage() {
  const [states, setStates] = useState([true, false, true]);
  const stateIndex = states.reduce((value, active, index) => value + (active ? 2 ** (2 - index) : 0), 0);
  const outcome = outcomes[stateIndex];
  const stateCode = combinations[stateIndex];

  const chooseCombination = (index: number) => {
    setStates(combinations[index].split('').map((bit) => bit === '1'));
  };

  return (
    <ContentBlock shuku-edit-id="e-844782f0-167c-4fe1-b846-14b24c0e16a1"
      headingLevel={1}
      className="ngtw-lecture-stage ngtw-neuron-decision-bridge"
      title="一个神经元很简单，组合起来却极其复杂"
    >
      <section shuku-edit-id="e-84cdd2be-c8ac-4120-ac10-616c42845a67" className="ngtw-neuron-decision-bridge__stage grid min-w-0 max-w-full grid-cols-[minmax(0,1.55fr)_minmax(0,.75fr)] gap-[18px]" aria-label="神经元组合状态实验">
        <div shuku-edit-id="e-7f6ab545-9fb6-47bf-ad7e-f080f23e1424" className="ngtw-neuron-decision-bridge__network relative min-w-0 max-w-full min-h-[390px] overflow-hidden rounded-[28px]">
          <svg shuku-edit-id="e-83ca6472-43a6-44b7-a47d-9ed21de6c53f" className="ngtw-neuron-decision-bridge__wires absolute inset-0 w-full h-full max-w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs shuku-edit-id="e-084eb89a-e65b-4d6e-9b16-bde4e5684a9f">
              <linearGradient shuku-edit-id="e-6f4f4bd6-7d35-4fe6-b26f-54db193e1a17" id="ngtw-signal-gradient" x1="0" x2="1">
                <stop shuku-edit-id="e-a7e9d028-db5f-4492-a633-64e31f442fbc" offset="0" stopColor="#2d7d68" />
                <stop shuku-edit-id="e-7700f5b3-561b-4a31-839d-0ed8f96b170b" offset="1" stopColor="#f07e47" />
              </linearGradient>
            </defs>
            {neurons.map((neuron, index) => (
              <path shuku-edit-id="e-cb515703-41c8-4319-b41a-b76204aaf7ee" key={neuron.short} className={states[index] ? 'is-active' : ''} d={`M ${neuron.x + 7} ${neuron.y} C 39 ${neuron.y}, 43 50, 61 50`} />
            ))}
          </svg>

          {neurons.map((neuron, index) => (
            <button shuku-edit-id="e-dc46149d-ee11-4be4-84ed-daac1c957de8"
              className={`ngtw-neuron-decision-bridge__neuron absolute grid w-[112px] max-w-[22%] gap-[2px] rounded-[50%] bg-[rgba(255,255,255,.92)] text-center ${states[index] ? 'is-active' : ''}`}
              style={{ left: `${neuron.x}%`, top: `${neuron.y}%` }}
              type="button"
              aria-pressed={states[index]}
              key={neuron.label}
              onClick={() => setStates((current) => current.map((state, itemIndex) => itemIndex === index ? !state : state))}
            >
              <span shuku-edit-id="e-db5e85e1-5ac7-4c32-95fe-46f3abc0f487" className="ngtw-neuron-decision-bridge__neuron-pulse absolute inset-[-1px] rounded-[inherit]" aria-hidden="true" />
              <Typography shuku-edit-id="e-2f6b5d35-c766-47b4-aa48-d10db67bb950" as="strong" variant="h3" tone="inherit">{neuron.short}</Typography>
              <Typography shuku-edit-id="e-1f5658d8-4311-427a-abbe-b97b64600799" as="span" variant="bodySmall" tone="inherit">{states[index] ? '1 · 响应' : '0 · 静默'}</Typography>
            </button>
          ))}

          <div shuku-edit-id="e-618e9354-f508-47da-bb0e-f126d0f32d19" className="ngtw-neuron-decision-bridge__core absolute left-[61%] top-[50%] grid w-[190px] h-[190px] justify-items-center gap-[1px] overflow-visible rounded-[50%] bg-[rgba(255,255,255,.94)] text-center" aria-live="polite">
            <span shuku-edit-id="e-8bb57779-eabc-439e-bbfb-d2a97106aaea" className="ngtw-neuron-decision-bridge__core-orbit absolute inset-[-23px] rounded-[50%]" aria-hidden="true" />
            <Typography shuku-edit-id="e-bed94f91-3916-49c5-8870-031d5fb09fcf" variant="body" tone="muted">三个输出组合</Typography>
            <Typography shuku-edit-id="e-0063c239-8940-4a80-8680-a11414e2f1be" as="span" variant="body" tone="accent">{stateCode}</Typography>
            <Typography shuku-edit-id="e-3cd69c20-77a4-4c34-b641-2cacfa4512bf" as="strong" variant="body" tone="success">{outcome.title}</Typography>
          </div>

          <div shuku-edit-id="e-7d05aaf6-fd26-4175-80b6-e1eb4f734750" className="ngtw-neuron-decision-bridge__decision absolute right-[4%] top-[50%] grid w-[22%] min-w-0 gap-[5px] p-[9px_0_9px_12px]">
            <Typography shuku-edit-id="e-a468a3b9-d474-4630-915f-1e5896773d46" variant="body" tone="warning">组合后的状态</Typography>
            <Typography shuku-edit-id="e-c8b5b7e6-04e9-446a-ab9d-ed8e5b0c74d7" as="strong" variant="h3" tone="accent">{outcome.title}</Typography>
            <Typography shuku-edit-id="e-919baf1a-10be-47bf-b9a6-09f7aaa7c410" variant="body" tone="muted">{outcome.rule}</Typography>
          </div>
        </div>

        <div shuku-edit-id="e-7ca947b5-3dbb-4e35-8ec2-390f54f7b781" className="ngtw-neuron-decision-bridge__states grid min-w-0 max-w-full grid-rows-[minmax(0,1fr)_auto] gap-[12px] rounded-[28px] p-[20px]" aria-label="八种组合状态">
          <div shuku-edit-id="e-c9802819-6f9d-4bfc-9364-799337695f1d" className="ngtw-neuron-decision-bridge__state-grid grid min-w-0 grid-cols-[repeat(2,minmax(0,1fr))] content-center gap-[8px]">
            {combinations.map((combination, index) => (
              <button shuku-edit-id="e-9e742945-3775-4e95-8e4d-0a08402c24f0"
                type="button"
                className={index === stateIndex ? 'is-current' : ''}
                aria-pressed={index === stateIndex}
                key={combination}
                onClick={() => chooseCombination(index)}
              >
                <span shuku-edit-id="e-d86f117b-f254-40d6-9e51-7b2e22e7c132" className="ngtw-neuron-decision-bridge__bits flex gap-[2px]" aria-hidden="true">
                  {combination.split('').map((bit, bitIndex) => <i shuku-edit-id="e-653ff1fe-cde9-4933-8a1a-f786aca2acd5" className={bit === '1' ? 'is-on' : ''} key={bitIndex} />)}
                </span>
                <Typography shuku-edit-id="e-ca15b0af-91a3-4315-a901-4d4109bbd108" as="code" variant="body" tone="inherit">{combination}</Typography>
                <Typography shuku-edit-id="e-b69de415-062c-4d14-af83-c7065bcce68a" as="span" variant="body" tone="inherit">{outcomes[index].title}</Typography>
              </button>
            ))}
          </div>
          <div shuku-edit-id="e-f16a4fc5-c6cb-4ce2-be6b-6fb96874f351" className="ngtw-neuron-decision-bridge__scale grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-[10px] pt-[14px] text-center">
            <div shuku-edit-id="e-5ebbff9f-6c50-4eaa-8678-9d54665ce4d1"><Typography shuku-edit-id="e-5be0f585-fcbb-46be-9254-b9873fc319fd" variant="body" tone="muted" wrap="nowrap">3 个二值输出</Typography><Typography shuku-edit-id="e-ca3a02da-0e35-4f36-8829-710a72abffdb" as="strong" variant="h1" tone="accent" wrap="nowrap">2³ = 8</Typography></div>
            <Typography shuku-edit-id="e-191d6ebd-4b96-4127-94cb-fb861b6212e1" as="span" variant="h3" tone="warning" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-27906283-14f8-47f2-8fc6-f3445797d399"><Typography shuku-edit-id="e-28eb0893-a01c-4f5a-9e83-754568121bfd" variant="body" tone="muted" wrap="nowrap">秀丽隐杆线虫的302 个神经元</Typography><Typography shuku-edit-id="e-702a6a0d-110a-4023-aab5-8d3a9657f18b" as="strong" variant="h1" tone="accent" wrap="nowrap">2³⁰² ≈ 8.1 × 10⁹⁰</Typography></div>
          </div>
        </div>
      </section>

      <div shuku-edit-id="e-8497f3ff-2547-4965-8854-242a1a3cd953" className="ngtw-neuron-decision-bridge__conclusion grid min-w-0 max-w-full items-center p-[14px_20px]">
        <Typography shuku-edit-id="e-dd0709c0-3a0e-4862-915f-806155933288" as="strong" variant="h3" tone="accent">在极度简化的二值模型中，每增加一个神经元，可能的状态组合数就翻一倍。</Typography>
      </div>
    </ContentBlock>
  );
}



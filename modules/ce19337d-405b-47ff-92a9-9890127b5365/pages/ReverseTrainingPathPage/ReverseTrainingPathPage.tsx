import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useLecturePlayback } from '../../components/LecturePlayback';
import { useEffect, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './ReverseTrainingPathPage.css';

const x0 = moduleAssetUrl('images/forward-derivation/x0.jpg');
const x1 = moduleAssetUrl('images/forward-derivation/x1.jpg');
const x2 = moduleAssetUrl('images/forward-derivation/x2.jpg');

const stages = [
  '先用前向加噪，得到一对相邻的带噪图像。',
  '训练时还知道原图 x₀，因此能算出往回走的正确方向。',
  '这个可计算的真实后验，成为去噪器的教师信号。',
  '去噪器只看 xₜ，学习预测上一时刻的分布。',
  '训练目标：让模型分布尽量贴近真实后验。',
  '移动蓝色模型分布，直观看见两者的差距。',
  '前向过程提供样本和教师，反向模型由此学会去噪。',
] as const;

const TEACHER_MEAN = .8;
const SIGMA = .68;

function gaussianPath(mean: number) {
  return Array.from({ length: 101 }, (_, index) => {
    const x = -3 + 6 * index / 100;
    const density = Math.exp(-.5 * ((x - mean) / SIGMA) ** 2);
    const px = 22 + 358 * index / 100;
    const py = 224 - density * 149;
    return `${index === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`;
  }).join(' ');
}

function meanX(mean: number) { return 22 + (mean + 3) / 6 * 358; }

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock ariaLabel={label} className="vg-reverse-training__formula"><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}

export interface ReverseTrainingPathPageProps { onComplete?: () => void; }

export function ReverseTrainingPathPage({ onComplete }: ReverseTrainingPathPageProps) {
  const { stage, controls, resumeAfterAction } = useLecturePlayback(stages.length, 1000, 5);
  const [modelMean, setModelMean] = useState(-1.1);
  const completedRef = useRef(false);
  const gap = Math.abs(modelMean - TEACHER_MEAN);

  useEffect(() => {
    if (stage < stages.length - 1 || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [stage, onComplete]);

  return <ContentBlock shuku-edit-id="e-fb4335a8-1193-4b1d-9b49-bad61453db89" headingLevel={1} className="vg-shared-page vg-reverse-training" bodyClassName="vg-reverse-training__body"
    title="前向加噪，如何为反向去噪提供训练路径？" subtitle={stages[stage]}>
    <div shuku-edit-id="e-453801f9-4044-43e7-ab12-da3f4cb58bc2" className="vg-reverse-training__main">
      <section shuku-edit-id="e-4ad31d45-3756-4f75-97b4-221433ab7f25" className="vg-reverse-training__path" aria-label="前向加噪和反向训练路径">
        <div shuku-edit-id="e-747637d3-360a-4f7c-afca-3fc5cffc55b7" className="vg-reverse-training__diagram">
          <svg shuku-edit-id="e-53b47000-b408-4714-bce0-456ed1d07a30" className="vg-reverse-training__arrows" viewBox="0 0 600 510" preserveAspectRatio="none" aria-hidden="true">
            <defs shuku-edit-id="e-65e446a9-cc52-40f6-9aa1-74addcd2d8e4">
              <marker shuku-edit-id="e-bbbbae4d-3d37-4ddc-ac5a-95d1bad8f246" id="vg-reverse-arrow-dark" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path shuku-edit-id="e-d4ecbeda-5fec-475f-af7e-9746a05bda5d" d="M1 1 L9 5 L1 9 Z" fill="#263650" /></marker>
              <marker shuku-edit-id="e-8191465f-cb27-47b3-bb67-38a1042adcde" id="vg-reverse-arrow-orange" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path shuku-edit-id="e-f45ce2cd-4ccd-4208-8db7-459222cea858" d="M1 1 L9 5 L1 9 Z" fill="#e66b28" /></marker>
              <marker shuku-edit-id="e-c058ec62-c08b-49a5-90f1-2ad329359a0e" id="vg-reverse-arrow-blue" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path shuku-edit-id="e-ff5e5b93-8cbf-4c5a-8fe3-cade88978cf9" d="M1 1 L9 5 L1 9 Z" fill="#2472cd" /></marker>
            </defs>
            <path shuku-edit-id="e-bd066ba6-099c-4e2b-ada8-08ff27ba65e1" d="M122 226 C215 155 350 155 447 226" fill="none" stroke="#263650" strokeWidth="3" markerEnd="url(#vg-reverse-arrow-dark)" />
            {stage >= 1 && <path shuku-edit-id="e-058c1c78-550e-4ff0-9b26-c679d33df537" d="M446 291 C350 359 220 359 122 291" fill="none" stroke="#e66b28" strokeWidth="3" markerEnd="url(#vg-reverse-arrow-orange)" className="vg-reverse-training__draw" />}
            {stage >= 3 && <path shuku-edit-id="e-ef77b9df-d362-409b-917f-1005721c9b0b" d="M446 308 C350 415 220 415 122 308" fill="none" stroke="#2472cd" strokeWidth="3" strokeDasharray="10 7" markerEnd="url(#vg-reverse-arrow-blue)" className="vg-reverse-training__draw" />}
            <path shuku-edit-id="e-84a18f34-3ea4-4dd0-8b12-24d12317cde6" d="M468 294 V386" fill="none" stroke="#8895a8" strokeWidth="2" strokeDasharray="4 6" />
          </svg>
          <figure shuku-edit-id="e-a7b38b64-9761-477b-86c9-3d6ac330d863" className="vg-reverse-training__image vg-reverse-training__image--left">
            <Typography shuku-edit-id="e-611c26a9-5b8a-4b1b-90da-9851261179c1" as="figcaption" variant="bodySmall" tone="main">较少噪声 · 更清晰</Typography><img shuku-edit-id="e-0b19f5e4-01f5-4e1e-9e76-25b6857ae661" src={x1} alt="较清晰的同一张人脸" />
          </figure>
          <figure shuku-edit-id="e-0b4c50e1-b3af-45ec-92ec-c896fd440e02" className="vg-reverse-training__image vg-reverse-training__image--right">
            <Typography shuku-edit-id="e-29f1fc94-88d4-491a-b19f-c3da4bdf4e65" as="figcaption" variant="bodySmall" tone="main">更多噪声 · 更模糊</Typography><img shuku-edit-id="e-ba596dd6-54db-4645-8409-5208f910381b" src={x2} alt="继续加噪后的同一张人脸" />
          </figure>
          <div shuku-edit-id="e-69c38c39-05e9-4bd6-a530-f0147a539fea" className="vg-reverse-training__node vg-reverse-training__node--previous">xₜ₋₁</div>
          <div shuku-edit-id="e-a054bf87-9698-498a-a259-ed2897be66cc" className="vg-reverse-training__node vg-reverse-training__node--current">xₜ</div>
          <div shuku-edit-id="e-b22197f6-3505-4842-97c0-be6997f78d77" className="vg-reverse-training__forward-label"><Typography shuku-edit-id="e-c66771bf-7bf5-4377-a557-f958ad7d2f81" as="strong" variant="bodySmall" tone="main">前向加噪 q(xₜ | xₜ₋₁)</Typography></div>
          {stage >= 1 && <div shuku-edit-id="e-5112afe4-4e54-4a80-b174-49365e4125ab" className="vg-reverse-training__teacher-label"><Typography shuku-edit-id="e-1b853f2f-3eb2-4834-a536-aaff6770e634" as="strong" variant="bodySmall" tone="warning" title="真实后验 q(xₜ₋₁ | xₜ, x₀)">真实后验 q</Typography></div>}
          {stage >= 3 && <div shuku-edit-id="e-7c99ae92-a4c8-4ac7-a7e4-f4f21b02a62e" className="vg-reverse-training__student-label"><Typography shuku-edit-id="e-63d8cb4d-45e9-468f-969c-fa585cde925f" as="strong" variant="bodySmall" tone="accent" title="模型去噪 pθ(xₜ₋₁ | xₜ)">模型去噪 pθ</Typography></div>}
          <figure shuku-edit-id="e-d1be6ff6-3d92-4e9e-b6ea-f5feb8c81954" className="vg-reverse-training__image vg-reverse-training__image--original">
            <img shuku-edit-id="e-3bf4da8d-8cdd-4a99-8a11-37bb89583a58" src={x0} alt="训练时已知的原始人脸" />
            <Typography shuku-edit-id="e-fbed7eda-80be-4a7a-ad46-bfd94676ef8e" as="figcaption" variant="bodySmall" tone="main">训练时已知原图 x₀</Typography>
          </figure>
        </div>
        {stage >= 4 && <div shuku-edit-id="e-446df74f-bb6c-4673-a5ff-c19e87cda9f3" className="vg-reverse-training__loss">
          <Typography shuku-edit-id="e-e35abc39-ca69-4624-a5b3-2305da417750" as="strong" variant="bodySmall" tone="main">训练目标</Typography>
          <Formula latex="D_{\mathrm{KL}}\!\left(q(x_{t-1}\mid x_t,x_0)\,\|\,p_\theta(x_{t-1}\mid x_t)\right)" label="真实后验与模型去噪分布之间的 KL 散度" />
          <Typography shuku-edit-id="e-6d89f803-abd7-4e91-92cc-0785b6aa2e10" as="span" variant="bodySmall" tone="muted">让蓝色模型分布靠近橙色教师分布。</Typography>
        </div>}
      </section>

      <section shuku-edit-id="e-94d02948-fd4e-4edc-8344-ec6cd0655c8b" className="vg-reverse-training__teacher-panel" aria-label="可解析的真实后验">
        {stage >= 2 && <div shuku-edit-id="e-a168e175-7de2-4fdd-9bf5-f69e5f2db1dc" className="vg-reverse-training__teacher-card">
          <Typography shuku-edit-id="e-a558fc2d-c413-45e4-9d77-64b59f522085" as="h2" variant="h3" tone="warning">可计算的真实后验</Typography>
          <Typography shuku-edit-id="e-919a4b21-2652-4398-a138-c56ed1c27406" variant="bodySmall" tone="main">训练时已知 x₀ 和前向加噪规则，因此可以算出正确的反向分布。</Typography>
          <Formula latex="q(x_{t-1}\mid x_t,x_0)=\mathcal N(\tilde\mu_t,\tilde\beta_t I)" label="真实后验是可计算的高斯分布" />
          <div shuku-edit-id="e-a7ff77fa-2ef4-454c-81a6-977fd0deec36" className="vg-reverse-training__teacher-inputs">
            <Typography shuku-edit-id="e-f31c83cf-ab26-4561-9266-bd2feba89374" as="span" variant="bodySmall" tone="muted">已知：原图 x₀、当前图 xₜ、噪声日程</Typography>
            <Typography shuku-edit-id="e-f71dc672-b7ca-4e99-b3c2-4823b0eaa665" as="span" variant="bodySmall" tone="warning">得到：上一时刻 xₜ₋₁ 的教师分布</Typography>
          </div>
        </div>}
      </section>

      <section shuku-edit-id="e-146f98aa-4939-4610-8aa2-281630ec123e" className="vg-reverse-training__match-panel" aria-label="模型分布与真实后验的匹配">
        {stage >= 5 && <div shuku-edit-id="e-7863b5b7-584b-4687-ac14-ca2fe623e388" className="vg-reverse-training__match-card">
          <Typography shuku-edit-id="e-a55e8288-4df0-4a78-b753-bd6d7d85a282" as="h2" variant="h3" tone="main">让模型分布靠近真实后验</Typography>
          <Typography shuku-edit-id="e-eb8e586f-b422-45e0-a908-be05e6bad2ff" variant="bodySmall" tone="muted">固定方差时，重点是让预测均值接近教师均值。</Typography>
          <div shuku-edit-id="e-cc783069-8f55-427c-8c23-5b605549bbd1" className="vg-reverse-training__match-legend">
            <Typography shuku-edit-id="e-41609eef-0ab7-42d8-8d4d-c1a2c0a7a647" as="span" variant="bodySmall" tone="accent">蓝色 · 模型 pθ</Typography>
            <Typography shuku-edit-id="e-ea0748a3-e9e5-4986-a72c-287e49e7434a" as="span" variant="bodySmall" tone="warning">橙色 · 教师 q</Typography>
          </div>
          <svg shuku-edit-id="e-0ad1abe4-0669-4fd9-a0da-b6de10d5f563" className="vg-reverse-training__match-plot" viewBox="0 0 402 252" role="img" aria-label="蓝色模型高斯曲线与橙色教师高斯曲线的距离">
            <path shuku-edit-id="e-4d5fb4f7-a3b3-4b9e-9e06-1d5a2b5b5c32" d="M20 224 H386 M382 220 L387 224 L382 228" fill="none" stroke="#52657d" strokeWidth="1.5" />
            <path shuku-edit-id="e-35d0cb27-dccc-40b3-b20f-092e8c2f2276" d={gaussianPath(modelMean)} fill="none" stroke="#2472cd" strokeWidth="3" />
            <path shuku-edit-id="e-ac9f2784-268f-42fe-92e7-16d2cf8893cb" d={gaussianPath(TEACHER_MEAN)} fill="none" stroke="#e66b28" strokeWidth="3" />
            <path shuku-edit-id="e-28a89e7d-b3db-4704-8924-8471c74209c7" d={`M${meanX(modelMean).toFixed(1)} 224 V77`} fill="none" stroke="#2472cd" strokeWidth="1.5" strokeDasharray="5 5" />
            <path shuku-edit-id="e-f7533be8-18ea-401d-b1b5-0cb5cd052ad8" d={`M${meanX(TEACHER_MEAN).toFixed(1)} 224 V77`} fill="none" stroke="#e66b28" strokeWidth="1.5" strokeDasharray="5 5" />
            <text shuku-edit-id="e-b3cb9847-321f-48e6-be0e-678e2ff9aa4a" x={meanX(modelMean)} y="246" fill="#2472cd" textAnchor="middle">μθ</text>
            <text shuku-edit-id="e-5b0e40e6-bd86-43ee-bc16-3c00ccaf437d" x={meanX(TEACHER_MEAN)} y="246" fill="#e66b28" textAnchor="middle">μ̃ₜ</text>
          </svg>
          <div shuku-edit-id="e-c079185d-cf92-48af-9daf-7a499d75f6af" className="vg-reverse-training__mean-control">
            <Typography shuku-edit-id="e-515bac5f-c569-47a5-beee-e152c106f5e0" as="label" variant="bodySmall" tone="muted" htmlFor="vg-model-mean">移动蓝色模型均值</Typography>
            <input shuku-edit-id="e-cb9040b5-ac87-4cba-89e8-8c7ad553d7b5" id="vg-model-mean" type="range" min="-2" max="2" step="0.05" value={modelMean}
              aria-label="调整模型预测均值" onChange={(event) => { setModelMean(Number(event.target.value)); resumeAfterAction(); }} />
          </div>
          <Typography shuku-edit-id="e-16d554ec-5f78-4993-a750-ce9b6022298d" variant="bodySmall" tone={gap < .2 ? 'success' : 'muted'}>{gap < .2 ? '两条分布已经靠近：模型正在学会教师给出的去噪方向。' : '蓝色曲线越靠近橙色曲线，训练误差越小。'}</Typography>
        </div>}
      </section>
    </div>

    <div shuku-edit-id="e-1a7f6a25-15aa-4723-82f5-e01b3f7dcd8c" className={`vg-reverse-training__summary${stage === stages.length - 1 ? '' : ' is-hidden'}`} aria-label="前向过程提供反向训练路径的三个环节" aria-hidden={stage !== stages.length - 1}>
      <Typography shuku-edit-id="e-9a800495-b86d-4dbc-911f-41cd91912768" as="span" variant="bodySmall" tone="main">① 从真实 x₀ 加噪，制造训练样本 xₜ</Typography>
      <Typography shuku-edit-id="e-a72f7c28-f10f-4a65-8fb2-8c12bf3aec5f" as="span" variant="bodySmall" tone="main">② 利用已知 x₀，算出真实后验 q</Typography>
      <Typography shuku-edit-id="e-5b85786a-4141-44ab-b2f4-9addda554693" as="span" variant="bodySmall" tone="main">③ 训练 pθ 接近 q，学会反向去噪</Typography>
    </div>

    <footer shuku-edit-id="e-b8316b65-668e-4b6a-8cbb-c6edbeb0fff8" className="vg-reverse-training__footer">
      
      <div shuku-edit-id="e-3810f20c-6dc6-4db0-b551-0f9c24dda507" className="vg-reverse-training__actions">
        {controls}
      </div>
    </footer>
  </ContentBlock>;
}

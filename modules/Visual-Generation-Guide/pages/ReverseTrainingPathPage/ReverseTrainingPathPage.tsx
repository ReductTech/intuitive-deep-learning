import { useLecturePlayback } from '../../components/LecturePlayback';
import { useEffect, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import x0 from '../../assets/forward-derivation/x0.png';
import x1 from '../../assets/forward-derivation/x1.png';
import x2 from '../../assets/forward-derivation/x2.png';
import './ReverseTrainingPathPage.css';

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

  return <ContentBlock headingLevel={1} className="vg-reverse-training" bodyClassName="vg-reverse-training__body"
    title="前向加噪，如何为反向去噪提供训练路径？" subtitle={stages[stage]}>
    <div className="vg-reverse-training__main">
      <section className="vg-reverse-training__path" aria-label="前向加噪和反向训练路径">
        <div className="vg-reverse-training__diagram">
          <svg className="vg-reverse-training__arrows" viewBox="0 0 600 510" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id="vg-reverse-arrow-dark" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1 1 L9 5 L1 9 Z" fill="#263650" /></marker>
              <marker id="vg-reverse-arrow-orange" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1 1 L9 5 L1 9 Z" fill="#e66b28" /></marker>
              <marker id="vg-reverse-arrow-blue" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M1 1 L9 5 L1 9 Z" fill="#2472cd" /></marker>
            </defs>
            <path d="M122 226 C215 155 350 155 447 226" fill="none" stroke="#263650" strokeWidth="3" markerEnd="url(#vg-reverse-arrow-dark)" />
            {stage >= 1 && <path d="M446 291 C350 359 220 359 122 291" fill="none" stroke="#e66b28" strokeWidth="3" markerEnd="url(#vg-reverse-arrow-orange)" className="vg-reverse-training__draw" />}
            {stage >= 3 && <path d="M446 308 C350 415 220 415 122 308" fill="none" stroke="#2472cd" strokeWidth="3" strokeDasharray="10 7" markerEnd="url(#vg-reverse-arrow-blue)" className="vg-reverse-training__draw" />}
            <path d="M468 294 V386" fill="none" stroke="#8895a8" strokeWidth="2" strokeDasharray="4 6" />
          </svg>
          <figure className="vg-reverse-training__image vg-reverse-training__image--left">
            <Typography as="figcaption" variant="bodySmall" tone="main">较少噪声 · 更清晰</Typography><img src={x1} alt="较清晰的同一张人脸" />
          </figure>
          <figure className="vg-reverse-training__image vg-reverse-training__image--right">
            <Typography as="figcaption" variant="bodySmall" tone="main">更多噪声 · 更模糊</Typography><img src={x2} alt="继续加噪后的同一张人脸" />
          </figure>
          <div className="vg-reverse-training__node vg-reverse-training__node--previous">xₜ₋₁</div>
          <div className="vg-reverse-training__node vg-reverse-training__node--current">xₜ</div>
          <div className="vg-reverse-training__forward-label"><Typography as="strong" variant="bodySmall" tone="main">前向加噪 q(xₜ | xₜ₋₁)</Typography></div>
          {stage >= 1 && <div className="vg-reverse-training__teacher-label"><Typography as="strong" variant="bodySmall" tone="warning" title="真实后验 q(xₜ₋₁ | xₜ, x₀)">真实后验 q</Typography></div>}
          {stage >= 3 && <div className="vg-reverse-training__student-label"><Typography as="strong" variant="bodySmall" tone="accent" title="模型去噪 pθ(xₜ₋₁ | xₜ)">模型去噪 pθ</Typography></div>}
          <figure className="vg-reverse-training__image vg-reverse-training__image--original">
            <img src={x0} alt="训练时已知的原始人脸" />
            <Typography as="figcaption" variant="bodySmall" tone="main">训练时已知原图 x₀</Typography>
          </figure>
        </div>
        {stage >= 4 && <div className="vg-reverse-training__loss">
          <Typography as="strong" variant="bodySmall" tone="main">训练目标</Typography>
          <Formula latex="D_{\mathrm{KL}}\!\left(q(x_{t-1}\mid x_t,x_0)\,\|\,p_\theta(x_{t-1}\mid x_t)\right)" label="真实后验与模型去噪分布之间的 KL 散度" />
          <Typography as="span" variant="bodySmall" tone="muted">让蓝色模型分布靠近橙色教师分布。</Typography>
        </div>}
      </section>

      <section className="vg-reverse-training__teacher-panel" aria-label="可解析的真实后验">
        {stage >= 2 && <div className="vg-reverse-training__teacher-card">
          <Typography as="h2" variant="h3" tone="warning">可计算的真实后验</Typography>
          <Typography variant="bodySmall" tone="main">训练时已知 x₀ 和前向加噪规则，因此可以算出正确的反向分布。</Typography>
          <Formula latex="q(x_{t-1}\mid x_t,x_0)=\mathcal N(\tilde\mu_t,\tilde\beta_t I)" label="真实后验是可计算的高斯分布" />
          <div className="vg-reverse-training__teacher-inputs">
            <Typography as="span" variant="bodySmall" tone="muted">已知：原图 x₀、当前图 xₜ、噪声日程</Typography>
            <Typography as="span" variant="bodySmall" tone="warning">得到：上一时刻 xₜ₋₁ 的教师分布</Typography>
          </div>
        </div>}
      </section>

      <section className="vg-reverse-training__match-panel" aria-label="模型分布与真实后验的匹配">
        {stage >= 5 && <div className="vg-reverse-training__match-card">
          <Typography as="h2" variant="h3" tone="main">让模型分布靠近真实后验</Typography>
          <Typography variant="bodySmall" tone="muted">固定方差时，重点是让预测均值接近教师均值。</Typography>
          <div className="vg-reverse-training__match-legend">
            <Typography as="span" variant="bodySmall" tone="accent">蓝色 · 模型 pθ</Typography>
            <Typography as="span" variant="bodySmall" tone="warning">橙色 · 教师 q</Typography>
          </div>
          <svg className="vg-reverse-training__match-plot" viewBox="0 0 402 252" role="img" aria-label="蓝色模型高斯曲线与橙色教师高斯曲线的距离">
            <path d="M20 224 H386 M382 220 L387 224 L382 228" fill="none" stroke="#52657d" strokeWidth="1.5" />
            <path d={gaussianPath(modelMean)} fill="none" stroke="#2472cd" strokeWidth="3" />
            <path d={gaussianPath(TEACHER_MEAN)} fill="none" stroke="#e66b28" strokeWidth="3" />
            <path d={`M${meanX(modelMean).toFixed(1)} 224 V77`} fill="none" stroke="#2472cd" strokeWidth="1.5" strokeDasharray="5 5" />
            <path d={`M${meanX(TEACHER_MEAN).toFixed(1)} 224 V77`} fill="none" stroke="#e66b28" strokeWidth="1.5" strokeDasharray="5 5" />
            <text x={meanX(modelMean)} y="246" fill="#2472cd" textAnchor="middle">μθ</text>
            <text x={meanX(TEACHER_MEAN)} y="246" fill="#e66b28" textAnchor="middle">μ̃ₜ</text>
          </svg>
          <div className="vg-reverse-training__mean-control">
            <Typography as="label" variant="bodySmall" tone="muted" htmlFor="vg-model-mean">移动蓝色模型均值</Typography>
            <input id="vg-model-mean" type="range" min="-2" max="2" step="0.05" value={modelMean}
              aria-label="调整模型预测均值" onChange={(event) => { setModelMean(Number(event.target.value)); resumeAfterAction(); }} />
          </div>
          <Typography variant="bodySmall" tone={gap < .2 ? 'success' : 'muted'}>{gap < .2 ? '两条分布已经靠近：模型正在学会教师给出的去噪方向。' : '蓝色曲线越靠近橙色曲线，训练误差越小。'}</Typography>
        </div>}
      </section>
    </div>

    <div className={`vg-reverse-training__summary${stage === stages.length - 1 ? '' : ' is-hidden'}`} aria-label="前向过程提供反向训练路径的三个环节" aria-hidden={stage !== stages.length - 1}>
      <Typography as="span" variant="bodySmall" tone="main">① 从真实 x₀ 加噪，制造训练样本 xₜ</Typography>
      <Typography as="span" variant="bodySmall" tone="main">② 利用已知 x₀，算出真实后验 q</Typography>
      <Typography as="span" variant="bodySmall" tone="main">③ 训练 pθ 接近 q，学会反向去噪</Typography>
    </div>

    <footer className="vg-reverse-training__footer">
      
      <div className="vg-reverse-training__actions">
        {controls}
      </div>
    </footer>
  </ContentBlock>;
}

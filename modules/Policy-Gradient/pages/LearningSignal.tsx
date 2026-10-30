import { Page, T, H, F } from '../components/LessonVisuals';
import { MazeBoard } from '../components/ReinforceMaze';
import { GOAL } from '../mazeModel';
import { DEMO_PATH } from '../neuralPolicy';
import './learningSignal.css';

export function LearningSignal(){return <Page title="这次选择，怎样影响权重？" subtitle="没有正确动作标签，就用实际回报评价这次选择。" takeaway="只评价本步之后的回报；整局贡献合成一次更新，单局并不保证表现提高。"><div className="pg-ls-page"><div className="pg-ls-scene"><div className="pg-tr-board"><MazeBoard position={GOAL} steps={DEMO_PATH} focus={1} fox showPath/></div><T small>教学示例 · 橙框：第 2 步向右</T></div><div className="pg-ls-explanation"><H>本步贡献 = 回报 × 调整方向</H><div className="pg-ls-pieces"><div><T small>经历给评价</T><F latex={String.raw`G_1=10-4=6`}/><T small>四次移动，再到终点</T></div><T tone="accent">×</T><div><T small>网络给方向</T><F latex={String.raw`\nabla_\theta\log\pi_\theta(a_1\mid s_1)`}/><T small>提高所选动作概率的权重方向</T></div></div><T small tone="accent">路线概率来自逐步概率连乘；log 把连乘变求和，反向传播算出方向。</T><div className="pg-ls-meaning"><T small>本步正回报：鼓励该选择</T><T small>本步负回报：抑制该选择</T></div></div><div className="pg-ls-rule"><T small tone="accent">合并各步，得到目标梯度 ∇θJ 的单局估计 ĝ</T><F latex={String.raw`\widehat g=\sum_t\underbrace{G_t}_{\text{评价}}\underbrace{\nabla_\theta\log\pi_\theta(a_t\mid s_t)}_{\text{方向}}`}/><div className="pg-ls-symbols"><T small>sₜ：位置 · aₜ：动作 · t 从 0 计</T><T small>Σ：各步相加 · log：自然对数</T></div></div></div></Page>}

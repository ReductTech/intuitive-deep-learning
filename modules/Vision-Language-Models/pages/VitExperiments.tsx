import { Typography } from '../../shared/react';
import { StepSequenceControl, useStepSequence, Equation, Heading, rainImage } from '../components/LessonVisuals';
import { ImageFocus } from '../components/TeachingVisuals';
import { projectPatch, attentionDemo } from '../model/teachingMath';
import './Experiments.css';
import './ViTFeedback.css';

export function EmbeddingExperiment() {
  const sequence = useStepSequence(3);
  const dimension = Math.min(sequence.step, 2);
  const pixels = [1, 2, 3, 4];
  // Rows belong to flattened pixels; each column produces one output dimension.
  const matrix = [[.5, 0, .25], [.5, 0, .25], [0, .5, .25], [0, .5, .25]];
  const token = projectPatch(pixels, matrix);
  const terms = pixels.map((value, row) => `${value}\\cdot ${matrix[row][dimension]}`).join('+');
  return <div className="exp-embedding" ref={sequence.hostRef} data-dimension={dimension + 1}>
    <div className="exp-embedding-intro">
      <Heading>先算一块 2×2 单通道图 · 教学示意</Heading>
      <StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="逐列计算演示"/>
    </div>
    <div className="exp-embedding-flow">
      <section className="exp-embedding-stage" aria-label="第一步：展平小图块">
        <Typography variant="body" tone="accent">① 按行展平</Typography>
        <div className="exp-embedding-patch" role="img" aria-label={`2×2 图块，按行数值为 ${pixels.join('、')}`}>
          {pixels.map((value, index) => <Typography key={index} as="span" variant="h3" className="exp-embedding-pixel">{value}</Typography>)}
        </div>
        <Equation latex={`x=[${pixels.join(',')}]`} label="将二乘二单通道图块按行展平成四维向量" />
      </section>
      <section className="exp-embedding-stage" aria-label="第二步：乘投影矩阵">
        <Typography variant="body" tone="accent">② 乘同一个矩阵 E</Typography>
        <div className="exp-embedding-matrix" role="img" aria-label={`四行三列的示意投影矩阵，当前高亮第 ${dimension + 1} 列`}>
          {matrix.flatMap((row, i) => row.map((value, j) =>
            <Typography key={`${i}-${j}`} as="span" variant="body" className={`exp-embedding-weight ${j === dimension ? 'is-selected' : ''}`}>{value}</Typography>))}
        </div>
        <Equation latex={'E\\in\\mathbb{R}^{4\\times3}'} label="投影矩阵有四行三列" />
      </section>
      <section className="exp-embedding-stage" aria-label="第三步：得到三维 Token">
        <Typography variant="body" tone="accent">③ 得到 3 维内容向量 c</Typography>
        <div className="exp-embedding-output" aria-label="三个输出维度与当前计算维度">
          {token.map((value, index) => <div key={index} className={dimension === index ? 'is-selected' : ''}><Equation latex={`c_${index+1}=${value.toFixed(1)}`} label={`内容向量第${index+1}维为${value.toFixed(1)}`}/></div>)}
        </div>
      </section>
    </div>
    <div className="exp-embedding-calculation" aria-live="polite">
      <Typography variant="body" tone="accent">第 {dimension + 1} 维 = x · E 的第 {dimension + 1} 列</Typography>
      <Equation latex={`c_{${dimension + 1}}=${terms}=${token[dimension].toFixed(1)}`} label={`第 ${dimension + 1} 维的逐项乘法与求和`} />
    </div>
    <div className="exp-embedding-real">
      <Typography variant="body" tone="accent">真实 ViT</Typography>
      <div><Equation latex={'16\\times16\\times3\\;\\to\\;768\\;\\xrightarrow{E}\\;D\\quad(E:\\,768\\times D)'} label="十六乘十六乘三图块展平为768维，乘共享的768乘D矩阵E得到D维内容向量"/><Typography variant="bodySmall" tone="accent">D 由配置选定；E 通过训练学习，各维不预先指定语义。</Typography></div>
    </div>
  </div>;
}

// One query reads two source tokens; numbers come from the shown projections.
export function AttentionExperiment() {
  const sequence=useStepSequence(5), step=sequence.step;
  const demo=attentionDemo();
  const exponentials=demo.scores.map(Math.exp);
  const total=exponentials.reduce((sum,value)=>sum+value,0);
  const phases=['Q / K / V 投影','缩放点积分数','softmax 归一化','加权读取 V','转置与矩阵维度'];
  const highlight=(latex:string, active:boolean)=>active?`\\textcolor{#c0392b}{${latex}}`:latex;
  const score=highlight('\\frac{QK^{T}}{\\sqrt{d_k}}',step===1);
  const softmax=highlight('\\operatorname{softmax}',step===2);
  const value=highlight('V',step===3);
  const formula=step===4
    ? '(\\underbrace{Q}_{N\\times d_k})(\\underbrace{K^T}_{d_k\\times N})=\\underbrace{QK^T}_{N\\times N}'
    : `\\operatorname{Attention}(${highlight('Q,K,V',step===0)})=${softmax}\\left(${score}\\right)${value}`;
  const sources=[
    {name:'红伞区域',rect:[30,53,20,25]},
    {name:'背景区域',rect:[5,15,20,25]},
  ];
  return <div className="vit-feedback-attention" ref={sequence.hostRef} data-attention-step={step}>
    <Typography variant="body" tone="accent" aria-live="polite">{step+1} / 5 · {phases[step]}</Typography>
    <div className="vit-feedback-attention-body">
      <section className={`vit-feedback-inputs ${step===0?'is-current':''}`}>
        <Heading>女孩查询两个来源</Heading>
        <div className="vit-feedback-query"><div className="exp-attention-photo"><ImageFocus region={{x:32,y:52,w:15,h:30}}/></div><Equation latex={`q=zW_Q=[${demo.q.join(',')}]`} label="女孩的查询向量为一、零"/></div>
        <div className="vit-feedback-sources">{sources.map((source,i)=>{
          const [x,y,w,h]=source.rect;
          return <div className="vit-feedback-source" key={source.name}>
            <div className="exp-attention-crop" role="img" aria-label={source.name} style={{backgroundImage:`url(${rainImage})`,backgroundSize:`${10000/w}% ${10000/h}%`,backgroundPosition:`${x/(100-w)*100}% ${y/(100-h)*100}%`}}/>
            <Typography variant="bodySmall">{source.name}</Typography>
            <Equation latex={`k_${i+1}=[${demo.keys[i].join(',')}],\\;v_${i+1}=[${demo.values[i].join(',')}]`} label={`${source.name}的键和值`}/>
          </div>;
        })}</div>
        <Typography variant="bodySmall">Q 查询，K 匹配，V 提供内容；每个 Token 分别乘 WQ、WK、WV。</Typography>
      </section>
      <section className="vit-feedback-working is-current" aria-live="polite">
        <Heading>{phases[step]}</Heading>
        {step===0&&<>
          <Equation latex={'W_Q=W_K=\\begin{bmatrix}1&0\\\\0&1\\end{bmatrix},\\quad W_V=\\begin{bmatrix}0.5&0\\\\0&0.5\\end{bmatrix}'} label="查询与键使用单位矩阵，值投影将每一维乘0.5"/>
          <Equation latex={'z_{女孩}=[1,0],\\quad z_1=[2,0],\\quad z_2=[0,2]'} label="三个输入向量"/>
          <Typography variant="body">左图追踪同一组输入，经三组投影分别用于查询、匹配和读取。</Typography>
        </>}
        {step===1&&<>
          <Equation latex={`s_1=\\frac{1\\times2+0\\times0}{\\sqrt2}\\approx${demo.scores[0].toFixed(3)}`} label="第一个点积为2，除以根号2约为1.414"/>
          <Equation latex={'s_2=\\frac{1\\times0+0\\times2}{\\sqrt2}=0'} label="第二个点积为0"/>
          <Typography variant="body">q 与每个 k 做点积，再除以 √dₖ；此处 dₖ = 2。</Typography>
        </>}
        {step===2&&<>
          <Equation latex={`e^{${demo.scores[0].toFixed(3)}}\\approx${exponentials[0].toFixed(3)},\\quad e^0=1`} label="分数取指数，约为4.113和1"/>
          <Typography variant="bodySmall">指数总和：4.113 + 1 = 5.113</Typography>
          <Equation latex={`\\alpha_1=\\frac{${exponentials[0].toFixed(3)}}{${total.toFixed(3)}}=${(demo.weights[0]*100).toFixed(1)}\\%,\\quad \\alpha_2=\\frac{1}{${total.toFixed(3)}}=${(demo.weights[1]*100).toFixed(1)}\\%`} label="各指数除以指数总和，得到80.4%和19.6%"/>
          <div className="vit-feedback-weight-bar" role="img" aria-label="红伞读取份额80.4%，背景19.6%">{demo.weights.map((weight,i)=><div key={i} style={{flex:weight}}><Typography variant="bodySmall">{(weight*100).toFixed(1)}%</Typography></div>)}</div>
          <Typography variant="body">α₁ + α₂ = 80.4% + 19.6% = 100%</Typography>
        </>}
        {step===3&&<>
          <Equation latex={`o=${demo.weights[0].toFixed(3)}[1,0]+${demo.weights[1].toFixed(3)}[0,1]`} label="把两个读取权重分别乘来源Value"/>
          <Equation latex={`o=[${demo.output.map(v=>v.toFixed(3)).join(',')}]`} label="加权和输出为0.804和0.196"/>
          <Typography variant="body">80.4% 读取红伞的 V，19.6% 读取背景的 V，汇入女孩位置。</Typography>
        </>}
        {step===4&&<>
          <Equation latex={'K=\\begin{bmatrix}k_1\\\\k_2\\\\\\vdots\\\\k_N\\end{bmatrix}\\quad\\longrightarrow\\quad K^T=\\begin{bmatrix}k_1^T&k_2^T&\\cdots&k_N^T\\end{bmatrix}'} label="K的每一行是一个键，转置后每一列是一个键"/>
          <Typography variant="body">Q 的第 i 行 × Kᵀ 的第 j 列，得到分数格 (i, j)。</Typography>
          <Typography variant="bodySmall">左图只读取两个来源；扩展到全体 N 个 Token，就得到 N×N 个分数。</Typography>
        </>}
      </section>
    </div>
    <div className="vit-feedback-main-formula" data-formula-phase={step}>
      <Equation latex={formula} label={step===4?'Q乘K转置的维度：N乘dk，与dk乘N，得到N乘N':`注意力主公式，当前突出${phases[step]}`}/>
    </div>
    <div className="exp-attention-toolbar"><Typography variant="bodySmall" tone="muted">教学示例 · 权重是读取份额，不是分类概率。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="一次注意力读取"/></div>
  </div>;
}

import { Typography } from "@shuku/course-style/react";
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
  return <div shuku-edit-id="e-cd41555b-0dae-4947-9489-680ca472282e" className="exp-embedding" ref={sequence.hostRef} data-dimension={dimension + 1}>
    <div shuku-edit-id="e-dc6b54a5-f305-471a-af5a-a27ef30d68d2" className="exp-embedding-intro">
      <Heading>先算一块 2×2 单通道图 · 教学示意</Heading>
      <StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="逐列计算演示"/>
    </div>
    <div shuku-edit-id="e-f917f9e9-0ef1-44da-9461-e9281883af5a" className="exp-embedding-flow">
      <section shuku-edit-id="e-4dcf73fa-b295-459f-a0dc-91d4f4e4c000" className="exp-embedding-stage" aria-label="第一步：展平小图块">
        <Typography shuku-edit-id="e-01f1c4ae-f203-4b84-bfd5-2d3e9cdba84a" variant="body" tone="accent">① 按行展平</Typography>
        <div shuku-edit-id="e-4cb33ec3-2711-4267-9d6a-4939d2f73ba0" className="exp-embedding-patch" role="img" aria-label={`2×2 图块，按行数值为 ${pixels.join('、')}`}>
          {pixels.map((value, index) => <Typography shuku-edit-id="e-bdd1e3c4-62ba-4030-a455-db4b5e77d708" key={index} as="span" variant="h3" className="exp-embedding-pixel">{value}</Typography>)}
        </div>
        <Equation latex={`x=[${pixels.join(',')}]`} label="将二乘二单通道图块按行展平成四维向量" />
      </section>
      <section shuku-edit-id="e-baa776f3-4839-40a2-93fe-d14d995f85ff" className="exp-embedding-stage" aria-label="第二步：乘投影矩阵">
        <Typography shuku-edit-id="e-1485c2fe-49b4-4a13-9587-71062d08df8d" variant="body" tone="accent">② 乘同一个矩阵 E</Typography>
        <div shuku-edit-id="e-41c13922-941b-4da2-96fc-19aedff6b9b9" className="exp-embedding-matrix" role="img" aria-label={`四行三列的示意投影矩阵，当前高亮第 ${dimension + 1} 列`}>
          {matrix.flatMap((row, i) => row.map((value, j) =>
            <Typography shuku-edit-id="e-3e04aae7-4a41-48aa-b31b-380238ec9b39" key={`${i}-${j}`} as="span" variant="body" className={`exp-embedding-weight ${j === dimension ? 'is-selected' : ''}`}>{value}</Typography>))}
        </div>
        <Equation latex={'E\\in\\mathbb{R}^{4\\times3}'} label="投影矩阵有四行三列" />
      </section>
      <section shuku-edit-id="e-df7f4987-3e52-40d9-85e1-99349d19debf" className="exp-embedding-stage" aria-label="第三步：得到三维 Token">
        <Typography shuku-edit-id="e-3885ba78-83b3-4e83-ac15-3c8a5be2ff1c" variant="body" tone="accent">③ 得到 3 维内容向量 c</Typography>
        <div shuku-edit-id="e-68e81f62-a9ce-47d1-bffd-3c61b874d0ee" className="exp-embedding-output" aria-label="三个输出维度与当前计算维度">
          {token.map((value, index) => <div shuku-edit-id="e-0a7cc25a-f411-4e5b-8141-242d6df7ec40" key={index} className={dimension === index ? 'is-selected' : ''}><Equation latex={`c_${index+1}=${value.toFixed(1)}`} label={`内容向量第${index+1}维为${value.toFixed(1)}`}/></div>)}
        </div>
      </section>
    </div>
    <div shuku-edit-id="e-d43632cc-273b-4dfa-aa8f-228d52a4d3a5" className="exp-embedding-calculation" aria-live="polite">
      <Typography shuku-edit-id="e-8ca74902-05fd-45ff-9829-3ee41217a176" variant="body" tone="accent">第 {dimension + 1} 维 = x · E 的第 {dimension + 1} 列</Typography>
      <Equation latex={`c_{${dimension + 1}}=${terms}=${token[dimension].toFixed(1)}`} label={`第 ${dimension + 1} 维的逐项乘法与求和`} />
    </div>
    <div shuku-edit-id="e-e0b38892-102a-4cfa-a0c4-bbabc4070590" className="exp-embedding-real">
      <Typography shuku-edit-id="e-c2af9bdb-7293-4ff1-9b85-49a0d9b1c4d9" variant="body" tone="accent">真实 ViT</Typography>
      <div shuku-edit-id="e-be989e0f-0677-44e7-9b84-0941a6a40646"><Equation latex={'16\\times16\\times3\\;\\to\\;768\\;\\xrightarrow{E}\\;D\\quad(E:\\,768\\times D)'} label="十六乘十六乘三图块展平为768维，乘共享的768乘D矩阵E得到D维内容向量"/><Typography shuku-edit-id="e-41984a5e-2e44-40b1-9b72-8f74b40b2ff3" variant="bodySmall" tone="accent">D 由配置选定；E 通过训练学习，各维不预先指定语义。</Typography></div>
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
  return <div shuku-edit-id="e-27d69f69-d119-49b5-bc35-4ccc1e480608" className="vit-feedback-attention" ref={sequence.hostRef} data-attention-step={step}>
    <Typography shuku-edit-id="e-2662bfcd-632e-4c69-ab7f-3e470f5946c6" variant="body" tone="accent" aria-live="polite">{step+1} / 5 · {phases[step]}</Typography>
    <div shuku-edit-id="e-56cb7cf6-2881-43c5-bef4-f9533dc85bd4" className="vit-feedback-attention-body">
      <section shuku-edit-id="e-1f3fee37-1231-4992-898f-3078388a2a15" className={`vit-feedback-inputs ${step===0?'is-current':''}`}>
        <Heading>女孩查询两个来源</Heading>
        <div shuku-edit-id="e-257ee9b6-3459-41c4-b9b6-8489fdcafbc5" className="vit-feedback-query"><div shuku-edit-id="e-57e06d23-8f98-40f4-b276-d2130a26aada" className="exp-attention-photo"><ImageFocus region={{x:32,y:52,w:15,h:30}}/></div><Equation latex={`q=zW_Q=[${demo.q.join(',')}]`} label="女孩的查询向量为一、零"/></div>
        <div shuku-edit-id="e-658486ba-60e6-48f6-a5f5-cd23ea6ee5ad" className="vit-feedback-sources">{sources.map((source,i)=>{
          const [x,y,w,h]=source.rect;
          return <div shuku-edit-id="e-17f8a371-6704-432b-b94b-aeba4b58f0d8" className="vit-feedback-source" key={source.name}>
            <div shuku-edit-id="e-043da7da-9cb0-4f6d-9eb1-dfdf7150eab2" className="exp-attention-crop" role="img" aria-label={source.name} style={{backgroundImage:`url(${rainImage})`,backgroundSize:`${10000/w}% ${10000/h}%`,backgroundPosition:`${x/(100-w)*100}% ${y/(100-h)*100}%`}}/>
            <Typography shuku-edit-id="e-d7268b2c-afb2-4a4b-89d9-9395d8cdc1a7" variant="bodySmall">{source.name}</Typography>
            <Equation latex={`k_${i+1}=[${demo.keys[i].join(',')}],\\;v_${i+1}=[${demo.values[i].join(',')}]`} label={`${source.name}的键和值`}/>
          </div>;
        })}</div>
        <Typography shuku-edit-id="e-02bbef9c-f998-4335-8dbc-900d0ce41ed3" variant="bodySmall">Q 查询，K 匹配，V 提供内容；每个 Token 分别乘 WQ、WK、WV。</Typography>
      </section>
      <section shuku-edit-id="e-03ca725b-bcde-4bdd-ba1f-fd8fa7a53a43" className="vit-feedback-working is-current" aria-live="polite">
        <Heading>{phases[step]}</Heading>
        {step===0&&<>
          <Equation latex={'W_Q=W_K=\\begin{bmatrix}1&0\\\\0&1\\end{bmatrix},\\quad W_V=\\begin{bmatrix}0.5&0\\\\0&0.5\\end{bmatrix}'} label="查询与键使用单位矩阵，值投影将每一维乘0.5"/>
          <Equation latex={'z_{女孩}=[1,0],\\quad z_1=[2,0],\\quad z_2=[0,2]'} label="三个输入向量"/>
          <Typography shuku-edit-id="e-9078cde4-2cf0-4e4c-87b6-d5f70d0bdd42" variant="body">左图追踪同一组输入，经三组投影分别用于查询、匹配和读取。</Typography>
        </>}
        {step===1&&<>
          <Equation latex={`s_1=\\frac{1\\times2+0\\times0}{\\sqrt2}\\approx${demo.scores[0].toFixed(3)}`} label="第一个点积为2，除以根号2约为1.414"/>
          <Equation latex={'s_2=\\frac{1\\times0+0\\times2}{\\sqrt2}=0'} label="第二个点积为0"/>
          <Typography shuku-edit-id="e-a000e30f-2f0d-4769-bd16-4af6068136be" variant="body">q 与每个 k 做点积，再除以 √dₖ；此处 dₖ = 2。</Typography>
        </>}
        {step===2&&<>
          <Equation latex={`e^{${demo.scores[0].toFixed(3)}}\\approx${exponentials[0].toFixed(3)},\\quad e^0=1`} label="分数取指数，约为4.113和1"/>
          <Typography shuku-edit-id="e-555d22ec-7078-4054-b189-ed3c17f67bdb" variant="bodySmall">指数总和：4.113 + 1 = 5.113</Typography>
          <Equation latex={`\\alpha_1=\\frac{${exponentials[0].toFixed(3)}}{${total.toFixed(3)}}=${(demo.weights[0]*100).toFixed(1)}\\%,\\quad \\alpha_2=\\frac{1}{${total.toFixed(3)}}=${(demo.weights[1]*100).toFixed(1)}\\%`} label="各指数除以指数总和，得到80.4%和19.6%"/>
          <div shuku-edit-id="e-ba594fec-68cb-4195-81dc-e5324b0e635e" className="vit-feedback-weight-bar" role="img" aria-label="红伞读取份额80.4%，背景19.6%">{demo.weights.map((weight,i)=><div shuku-edit-id="e-9e0527d1-9f8e-4d60-a537-88dd4a0738df" key={i} style={{flex:weight}}><Typography shuku-edit-id="e-ad856edc-c331-4eb2-a73e-af1222281e92" variant="bodySmall">{(weight*100).toFixed(1)}%</Typography></div>)}</div>
          <Typography shuku-edit-id="e-3bfebc92-5fe9-4392-997a-5a257b0ff3e5" variant="body">α₁ + α₂ = 80.4% + 19.6% = 100%</Typography>
        </>}
        {step===3&&<>
          <Equation latex={`o=${demo.weights[0].toFixed(3)}[1,0]+${demo.weights[1].toFixed(3)}[0,1]`} label="把两个读取权重分别乘来源Value"/>
          <Equation latex={`o=[${demo.output.map(v=>v.toFixed(3)).join(',')}]`} label="加权和输出为0.804和0.196"/>
          <Typography shuku-edit-id="e-2494dd5f-aace-4c80-bf1c-464f4da1512e" variant="body">80.4% 读取红伞的 V，19.6% 读取背景的 V，汇入女孩位置。</Typography>
        </>}
        {step===4&&<>
          <Equation latex={'K=\\begin{bmatrix}k_1\\\\k_2\\\\\\vdots\\\\k_N\\end{bmatrix}\\quad\\longrightarrow\\quad K^T=\\begin{bmatrix}k_1^T&k_2^T&\\cdots&k_N^T\\end{bmatrix}'} label="K的每一行是一个键，转置后每一列是一个键"/>
          <Typography shuku-edit-id="e-93492709-9b75-4e89-aed4-3ede81fb50cc" variant="body">Q 的第 i 行 × Kᵀ 的第 j 列，得到分数格 (i, j)。</Typography>
          <Typography shuku-edit-id="e-bc56f1a9-5016-437c-97b2-57f6ec680813" variant="bodySmall">左图只读取两个来源；扩展到全体 N 个 Token，就得到 N×N 个分数。</Typography>
        </>}
      </section>
    </div>
    <div shuku-edit-id="e-e53d9fa1-09c6-4658-8a5a-8b0d62377158" className="vit-feedback-main-formula" data-formula-phase={step}>
      <Equation latex={formula} label={step===4?'Q乘K转置的维度：N乘dk，与dk乘N，得到N乘N':`注意力主公式，当前突出${phases[step]}`}/>
    </div>
    <div shuku-edit-id="e-438b4548-1ceb-46b3-9250-0a94d333c6d0" className="exp-attention-toolbar"><Typography shuku-edit-id="e-31020f15-723c-4df2-a2ce-a22777020e96" variant="bodySmall" tone="muted">教学示例 · 权重是读取份额，不是分类概率。</Typography><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="一次注意力读取"/></div>
  </div>;
}

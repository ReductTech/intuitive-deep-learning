import { Button } from '../controls/Button';
import { ExplainPanelButton } from '../controls/ExplainPanelButton';
import { RangeControl } from '../controls/RangeControl';
import { Select } from '../controls/Select';
import { Switch } from '../controls/Switch';
import { TextInput } from '../controls/TextInput';
import { Callout } from '../feedback/Callout';
import { Feedback } from '../feedback/Feedback';
import { NoticeStrip } from '../feedback/NoticeStrip';
import { ReplayableCallouts } from '../feedback/ReplayableCallouts';
import { CatalogItem } from '../layout/CatalogItem';
import { ContentBlock } from '../layout/ContentBlock';
import { ModuleShell } from '../layout/ModuleShell';
import { FormulaBlock, FormulaTerm } from '../learning/FormulaBlock';
import { Question } from '../learning/Question';
import { RelatedVideos } from '../learning/RelatedVideos';
import { ProgressiveReveal } from '../learning/ProgressiveReveal';
import { PanelChoiceQuestion } from '../learning/PanelChoiceQuestion';
import { CodeCompletionBlock } from '../learning/CodeCompletionBlock';
import { ValueTile } from '../learning/ValueTile';
import { FunctionPlot } from '../visuals/FunctionPlot';
import { PlotlyChart, type PlotlyLayout, type PlotlyTrace } from '../visuals/PlotlyChart';
import '../ui-kit.css';

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const surfaceAxis = Array.from({ length: 25 }, (_, index) => -2 + index * (4 / 24));
const surfaceData: PlotlyTrace[] = [{ type: 'surface', x: surfaceAxis, y: surfaceAxis, z: surfaceAxis.map((y) => surfaceAxis.map((x) => Math.exp(-(x * x + y * y) / 2))), colorscale: [[0, '#eef3fb'], [0.5, '#f7b28d'], [1, '#f07e47']], showscale: false, hovertemplate: 'x = %{x:.2f}<br>y = %{y:.2f}<br>z = %{z:.2f}<extra></extra>' }];
const surfaceLayout: PlotlyLayout = { paper_bgcolor: '#fbfdff', margin: { l: 0, r: 0, t: 12, b: 0 }, showlegend: false, scene: { bgcolor: '#fbfdff', dragmode: 'orbit', aspectmode: 'cube', xaxis: { title: { text: 'x' } }, yaxis: { title: { text: 'y' } }, zaxis: { title: { text: 'z' } } } };
const panelChoiceOptions = [
  {
    key: 'A',
    value: 'curve',
    title: 'y = σ(x)',
    caption: '坐标轴与曲线',
    media: <FunctionPlot fn={sigmoid} minHeight={132} ariaLabel="带坐标轴的 Sigmoid 函数曲线面板" initialScale={{ x: 0.025, y: 0.01 }} />,
  },
  { key: 'B', value: 'image', title: '道路样本', caption: '图片内容', media: <span>图片媒体槽</span> },
  { key: 'C', value: 'video', title: '动态场景', caption: '视频内容', media: <span>视频媒体槽</span> },
];

export function UiKitPage() {
  return <ModuleShell title="UI Kit" subtitle="教学模块的统一界面组件与交互规范。" shellClassName="kit-shell" headerClassName="kit-header">
    <section className="kit-section" aria-labelledby="foundation-title"><header className="kit-section-head"><h2 id="foundation-title">基础展示</h2><p>定义每个教学小块的固定结构，以及正文中允许复用的提示、指标、公式和代码运行组件。</p></header><div className="foundation-catalog">
      <CatalogItem title="标准内容块" description="每个小块只保留一个主标题、一个副标题和一个正文区域。"><ContentBlock className="foundation-preview" title="损失就是距离" subtitle="Loss 衡量真实值和预测值之间差多少。这里先用一条数轴，把这种差距直接画出来。"><p className="edu-body">训练的目标不是记住一个答案，而是持续缩小预测与真实结果之间的距离。</p><p className="edu-body">先改变预测值，再观察 <strong className="edu-emphasis">L1 Loss</strong> 如何变化。</p></ContentBlock></CatalogItem>
      <CatalogItem title="提示框" description="颜色和播放方式是两个独立维度。每种颜色都可以直接显示，也可以逐字显示。"><div className="foundation-stack foundation-preview--compact"><Callout tone="orange" label="你的任务" text="拖动绿色预测值，让它与红色真实值重合，把 Loss 缩小到 0。" /><ReplayableCallouts className="foundation-stack" replayLabel="重播四种逐字提示" items={[{ tone: 'orange', label: '思考提示', text: '先比较预测值和真实值，再判断应该向左还是向右移动。', streaming: true, streamInterval: 24 }, { tone: 'blue', label: '逐步解释', text: '预测值每靠近真实值一步，损失就会随距离一起减小。', streaming: true, streamInterval: 24 }, { tone: 'green', label: '正确反馈', text: '方向判断正确，继续缩小距离就能进一步降低损失。', streaming: true, streamInterval: 24 }, { tone: 'red', label: '风险提醒', text: '学习率过大可能越过最低点，导致训练过程来回震荡。', streaming: true, streamInterval: 24 }]} /><Feedback status="correct" label="正确反馈" message="方向判断正确，可以继续。" /><Feedback status="wrong" label="错误提示" message="当前操作让预测值远离真实值。" /></div></CatalogItem>
      <CatalogItem title="紧凑提示条" description="用于紧跟图表、模型或控制区显示一句当前状态。"><div className="foundation-stack foundation-preview--compact"><NoticeStrip tone="blue" lead="观察状态：">已经有 3 个线性神经元了。它们叠加后仍然只是一条直线。</NoticeStrip><NoticeStrip tone="orange" lead="操作提醒：">继续调整参数，比较曲线改变前后的形状。</NoticeStrip><NoticeStrip tone="green" lead="阶段完成：">当前结果已经满足目标，可以进入下一步。</NoticeStrip><NoticeStrip tone="red" lead="需要调整：">当前参数使输出偏离目标，请检查输入范围。</NoticeStrip></div></CatalogItem>
      <CatalogItem title="小型指标块" description="用于一个短标签和一个关键结果。"><div className="foundation-value-row foundation-preview"><ValueTile tone="orange" label="L1 Loss = |真实值 - 预测值|" value="5.4" /><ValueTile tone="blue" label="验证准确率" value="92.4%" /><ValueTile tone="success" label="已完成样本" value="128" /><ValueTile tone="danger" label="误分类样本" value="7" /></div></CatalogItem>
      <CatalogItem title="公式块" description="用于必须独立阅读的公式，变量可通过悬浮或焦点获得说明。"><div className="foundation-stack foundation-preview--compact"><FormulaBlock ariaLabel="L2 损失公式"><FormulaTerm tooltip="L₂：当前样本的平方损失">L₂</FormulaTerm> = (<FormulaTerm tooltip="y：样本的真实目标值">y</FormulaTerm> - <FormulaTerm tooltip="ŷ：模型给出的预测值">ŷ</FormulaTerm>)<sup><FormulaTerm tooltip="平方：放大较大的预测误差">²</FormulaTerm></sup></FormulaBlock><FormulaBlock ariaLabel="Sigmoid 函数" fraction={{ prefix: <><FormulaTerm tooltip="σ：Sigmoid 函数，把任意实数映射到 0～1">σ</FormulaTerm>(<FormulaTerm tooltip="z：模型输出的原始分数">z</FormulaTerm>) =</>, numerator: '1', denominator: <>1 + e<sup>−z</sup></> }} /></div></CatalogItem>
    </div></section>

    <section className="kit-section" aria-labelledby="visual-title"><header className="kit-section-head"><h2 id="visual-title">坐标与曲线</h2><p>用于展示函数关系、曲面和训练误差的共享可视化。</p></header><div className="visual-catalog">
      <CatalogItem variant="visual" title="二维坐标轴与函数曲线" description="拖动平移坐标，使用滚轮缩放。函数会按当前视口重新采样，不设固定坐标范围。"><FunctionPlot className="visual-plot" fn={sigmoid} ariaLabel="Sigmoid 函数曲线" /></CatalogItem>
      <CatalogItem variant="visual" title="三维坐标轴与曲面" description="拖动旋转坐标，使用滚轮缩放。"><PlotlyChart className="visual-plot" data={surfaceData} layout={surfaceLayout} aria-label="三维函数曲面" /><output className="visual-readout">camera = 1.35, 1.35, 0.95</output></CatalogItem>
    </div></section>

    <section className="kit-section" aria-labelledby="buttons-title"><header className="kit-section-head"><h2 id="buttons-title">按钮</h2><p>按钮样式由操作语义决定，同一区域通常只保留一个主操作。</p></header><div className="button-catalog">
      <CatalogItem variant="button" title="默认按钮" description="用于切换样本、重置局部设置或返回上一步。"><Button>换个样本</Button></CatalogItem>
      <CatalogItem variant="button" title="主操作按钮" description="用于开始训练、提交答案或进入下一步。"><Button variant="primary">开始训练</Button></CatalogItem>
      <CatalogItem variant="button" title="警告按钮" description="用于会改变实验结果但仍可恢复的操作。"><Button variant="warn">随机初始化</Button></CatalogItem>
      <CatalogItem variant="button" title="危险按钮" description="仅用于删除、清空或不可直接撤销的操作。"><Button variant="danger">清空记录</Button></CatalogItem>
      <CatalogItem variant="button" title="提示点击按钮" description="初始发光，首次鼠标移入、聚焦或点击后停止提示。"><Button variant="primary" hint>点击继续</Button></CatalogItem>
      <CatalogItem variant="button" title="询问按钮" description="鼠标悬浮、键盘聚焦或触摸时显示可容纳任意内容的面板。"><ExplainPanelButton><strong>学习率</strong><p>学习率决定每次参数更新的步幅。</p><FormulaBlock ariaLabel="学习率公式">w<sub>new</sub> = w − η · ∇L</FormulaBlock></ExplainPanelButton></CatalogItem>
      <CatalogItem variant="button" title="等待按钮" description="请求已提交，正在等待结果，不可重复点击。"><Button loading>等待数据</Button></CatalogItem>
      <CatalogItem variant="button" title="禁用按钮" description="前置条件尚未满足时使用，禁用期间不显示等待动画。"><Button variant="primary" disabled>继续训练</Button></CatalogItem>
    </div></section>

    <section className="kit-section" aria-labelledby="controls-title"><header className="kit-section-head"><h2 id="controls-title">参数与选项控件</h2><p>根据数据类型选择控件：单项选择用下拉或单选，多项选择用复选框，二元设置用开关，数值范围用滑杆。</p></header><div className="control-catalog">
      <CatalogItem variant="control" title="提示输入框" description="首次显示提示，首次移入、聚焦或输入后停止。"><TextInput label="输入答案" placeholder="请填写" hint /></CatalogItem>
      <CatalogItem variant="control" title="下拉列表" description="从多个互斥选项中选择一个。"><Select label="数据集" defaultValue="mnist" options={[{ value: 'mnist', label: '手写数字 MNIST' }, { value: 'cifar10', label: '彩色图像 CIFAR-10' }, { value: 'lfw', label: '人脸数据 LFW' }]} /></CatalogItem>
      <CatalogItem variant="control" title="复选框" description="普通样式用于设置列表，候选项可作为独立特征或标签。"><div className="edu-check-group"><label className="edu-check"><input type="checkbox" defaultChecked /> <span>显示网格</span></label><label className="edu-check edu-check--option"><input type="checkbox" /> <span>中心墨迹</span></label></div></CatalogItem>
      <CatalogItem variant="control" title="单选组" description="用于少量互斥选项，并让学习者直接看到所有选项。"><fieldset className="edu-control edu-fieldset"><legend className="edu-label">激活函数</legend><div className="edu-radio-group"><label className="edu-radio"><input type="radio" name="activation" value="relu" defaultChecked /><span>ReLU</span></label><label className="edu-radio"><input type="radio" name="activation" value="sigmoid" /><span>Sigmoid</span></label><label className="edu-radio"><input type="radio" name="activation" value="linear" /><span>Linear</span></label></div></fieldset></CatalogItem>
      <CatalogItem variant="control" title="滑块开关" description="用于立即生效并持续保持的二元设置。"><Switch label="显示决策边界" defaultChecked /></CatalogItem>
      <CatalogItem variant="control" title="提示连续滑杆" description="初始使用通用高亮提示，首次移入、聚焦或拖动后停止。"><RangeControl label="学习率" min={0} max={1} step={0.01} defaultValue={0.5} digits={2} hint /></CatalogItem>
      <CatalogItem variant="control" title="离散刻度滑杆" description="只能在预定档位中选择，滑杆下方同时展示刻度。"><RangeControl label="隐藏层数" min={1} max={5} step={1} defaultValue={3} discrete scale={['1', '2', '3', '4', '5']} digits={0} /></CatalogItem>
    </div></section>

    <section className="kit-section" aria-labelledby="flow-title"><header className="kit-section-head"><h2 id="flow-title">流程控制</h2><p>直接弹出用于连续结果；下拉提示用于学习者确认后进入下一阶段。</p></header><div className="flow-patterns">
      <article className="flow-pattern"><header className="flow-pattern-head"><span className="edu-kicker">模式 1</span><h3>直接弹出</h3><p>操作完成后，下一段内容立即出现。</p></header><ProgressiveReveal revealLabel="完成并显示结果" stage={{ className: 'flow-result', kicker: '结果已出现', title: '模型已完成这一轮计算', description: '这里可以直接展示结果、解释或下一项操作。' }}><NoticeStrip tone="green">当前阶段已完成。</NoticeStrip></ProgressiveReveal></article>
      <article className="flow-pattern"><header className="flow-pattern-head"><span className="edu-kicker">模式 2</span><h3>下拉提示</h3><p>当前步骤完成后，轻量指示标记出下一段内容，不新增空白占位。</p></header><ProgressiveReveal mode="cue" revealLabel="完成当前步骤" resetLabel="重置演示" stage={{ className: 'flow-result', kicker: '下一阶段', title: '开始解释刚才观察到的现象', description: '滚动提示适合阶段边界明显、下一段内容较长的教学流程。' }}><NoticeStrip tone="blue">学习者已确认进入下一阶段。</NoticeStrip></ProgressiveReveal></article></div></section>

    <section className="kit-section" aria-labelledby="questions-title"><header className="kit-section-head"><h2 id="questions-title">考试题型</h2><p>所有题型采用单栏。单选和判断点击即判；多选、填空和简答完成作答后提交。</p></header><div className="question-catalog"><PanelChoiceQuestion title="下面哪个面板展示的是可计算的函数坐标图？" options={panelChoiceOptions} answer="curve" feedback={{ initial: '面板中的媒体槽可以替换为坐标轴、图片、视频或其他可视化。', correct: '判断正确：A 面板提供了可计算的坐标数据。', wrong: '再观察一次：图片或视频本身不是函数坐标图。' }} /><Question title="下面哪个函数可以把输入映射到 0～1？" options={[{ value: 'relu', label: 'ReLU' }, { value: 'sigmoid', label: 'Sigmoid' }, { value: 'linear', label: 'Linear' }]} answer="sigmoid" feedback={{ correct: '回答正确。', wrong: '再想想输出范围。' }} /><Question type="judgement" title="没有激活函数时，多层线性层叠加后仍然等价于线性变换。" options={[{ key: 'T', value: 'true', label: '正确' }, { key: 'F', value: 'false', label: '错误' }]} answer="true" /><Question type="multiple" multiple title="哪些属于训练指标？" options={[{ value: 'loss', label: 'Loss' }, { value: 'accuracy', label: 'Accuracy' }, { value: 'color', label: '颜色' }]} answer={['loss', 'accuracy']} /><Question type="fill" title="二分类输出常用 ____ 函数。" blanks={[{ label: '函数名', placeholder: '填写答案' }]} answer="sigmoid" /><Question type="short" title="请解释为什么较小的 Loss 有用。" feedback={{ sample: '已记录你的回答，可以对照后续解释继续完善。' }} /></div></section>

    <section className="kit-section" aria-labelledby="code-title"><header className="kit-section-head"><h2 id="code-title">代码运行块</h2><p>代码主体只读，学习者只填写指定的单行空位，并看到运行状态、帮助和运行时间。</p></header><CodeCompletionBlock className="foundation-preview" language="Python" expectedAnswer="square" inputLabel="填入缺失的函数名" help="这里需要填写 PyTorch 中执行平方运算的函数名。" prefixLines={<><span className="edu-code-line"><span className="edu-code-token--keyword">import</span> <span className="edu-code-token--module">torch</span></span>{'\n'}<span className="edu-code-line">prediction = torch.tensor([1.6])</span>{'\n'}<span className="edu-code-line">target = torch.tensor([7.0])</span>{'\n'}</>} beforeInput="loss = torch." afterInput=" (target - prediction)" /></section>

    <section className="kit-section" aria-labelledby="related-title"><header className="kit-section-head"><h2 id="related-title">推荐视频</h2><p>放在教学模块底部，使用完整单栏宽度展示与当前主题直接相关的视频资源。</p></header><ContentBlock className="foundation-preview" title="推荐资源" subtitle="继续观看与当前主题直接相关的视频，巩固刚才完成的学习内容。"><RelatedVideos title="推荐视频" videos={[{ title: '什么是神经元？' }, { title: '损失如何指导学习？' }, { title: '激活函数' }]} /><nav className="edu-resource-actions" aria-label="课程资源操作"><a className="edu-btn" href="../CourseMap/">返回课程目录</a><a className="edu-btn edu-btn--primary" href="../MLP_playground/">学习下一个</a></nav></ContentBlock></section>
  </ModuleShell>;
}

import { LossChoicePage } from './pages/LossChoicePage/LossChoicePage';
import { OptimizationIntroPage } from './pages/OptimizationIntroPage/OptimizationIntroPage';
import { ConvexMsePage } from './pages/ConvexMsePage/ConvexMsePage';
import { MatrixModelPage } from './pages/MatrixModelPage/MatrixModelPage';
import { OptimalLinePage } from './pages/OptimalLinePage/OptimalLinePage';
import { OptimalSlopePage } from './pages/OptimalSlopePage/OptimalSlopePage';
import { OptimalInterceptPage } from './pages/OptimalInterceptPage/OptimalInterceptPage';
import { LeastSquaresPage } from './pages/LeastSquaresPage/LeastSquaresPage';
import { AutomaticSearchPage, SearchLimitsPage } from './pages/AutomaticSearchPage/AutomaticSearchPage';
import { MsePage } from './pages/MsePage/MsePage';
import { MaePage } from './pages/MaePage/MaePage';
import { PredictionErrorPage } from './pages/PredictionErrorPage/PredictionErrorPage';
import { ResidualCancellationPage } from './pages/ResidualCancellationPage/ResidualCancellationPage';
import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import { notesForScene } from './speakerNotes';
import { CaoChongPage } from './pages/CaoChongPage/CaoChongPage';
import { LinearRegressionPage } from './pages/LinearRegressionPage/LinearRegressionPage';
import { EstimateWeightPage } from './pages/EstimateWeightPage/EstimateWeightPage';
export const deck: DeckDefinition = {
  id: 'regression-loss', title: '回归与损失：模型怎样变准', subtitle: '从称象到回归 · 当前展示 18 页',
  scenes: [
    { id: '77c0d524-f4a1-4bd8-9773-9577bdd1a3f9', title: '曹冲称象', section: '从称象到回归', render: () => <CaoChongPage /> },
    { id: '52910535-203a-42a9-8ac6-8c30d8677886', title: '估计象重', section: '从称象到回归', render: () => <EstimateWeightPage /> },
    { id: '995941bc-2d85-4186-8f8f-ca7f0348eb5b', title: '预测误差', section: '如何评价模型', render: () => <PredictionErrorPage /> },
    { id: '09437179-8db9-4b9f-95ce-585e61cceab7', title: '误差不能直接相加', section: '如何评价模型', render: () => <ResidualCancellationPage /> },
    { id: '0724ef4f-cebe-4522-98a1-abcc733227ef', title: '平均绝对误差（MAE）', section: '如何评价模型', render: () => <MaePage /> },
    { id: '80d46956-fa0a-4633-84a0-a0e10bcf362d', title: '均方误差（MSE）', section: '如何评价模型', render: () => <MsePage /> },
    { id: 'b11cf499-6cb4-411b-a448-c5fcc91fd2e6', title: '损失函数，体现任务的取舍', section: '如何评价模型', render: () => <LossChoicePage /> },
    { id: 'f94b76e8-73b8-4c26-bd6c-cbfa2ee5d74d', title: '用损失指导估重', section: '如何评价模型', render: () => <EstimateWeightPage showLoss /> },
    { id: '1fa7e17a-ace0-49c9-85c4-f11669368b1e', title: '能否让计算机自动找线？', section: '从手动到自动', render: () => <AutomaticSearchPage /> },
    { id: 'edf0a77e-0d19-43ef-9297-e19770ccf18e', title: '遍历搜索的局限', section: '从手动到自动', render: () => <SearchLimitsPage /> },
    { id: 'fbf3f3fe-cb23-4e2b-9a80-24c12a0fa152', title: '线性回归模型', section: '建立线性模型', render: () => <LinearRegressionPage /> },
    { id: '8590273e-08e6-4a41-99c6-fae958184397', title: '最小二乘：从搜索到求解', section: '最小二乘', render: () => <LeastSquaresPage /> },
    { id: 'daa84a80-6b79-4f55-a3f5-970060b3f1c1', title: '先求最优截距', section: '最小二乘', render: () => <OptimalInterceptPage /> },
    { id: '607dfec1-4dfb-4380-88f3-0286281fa6fb', title: '再求最优斜率', section: '最小二乘', render: () => <OptimalSlopePage /> },
    { id: 'e6c34248-ab1e-4357-90df-5bc1152d39e9', title: '得到最优直线', section: '最小二乘', render: () => <OptimalLinePage /> },
    { id: '2574eb2f-e9b5-48c2-95ba-50f288573d54', title: '用矩阵写出最小二乘', section: '最小二乘', render: () => <MatrixModelPage /> },
    { id: '21e129ca-5540-4663-bdd6-52931efc992a', title: '为什么正规方程能找到全局最优？', section: '最小二乘', render: () => <ConvexMsePage /> },
    { id: 'bf92bc7e-ba85-4332-9f39-0d496cd38a19', title: '为什么不能总靠解析求解？', section: '优化基础', render: () => <OptimizationIntroPage /> },
  ],
};
const catalog: [DeckDefinition, ...DeckDefinition[]] = [deck];
export const getPptNotes = notesForScene;
export function RegressionLossPpt() {
  return <SceneDeck catalog={catalog} moduleId="regression-loss" assetId="adde4a27-235d-4c03-a3cf-734ccf08b38d" progressKey="lesson-flow:regression-loss" getNotes={notesForScene} />;
}







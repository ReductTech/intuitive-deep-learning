import { LossGrowthPage } from './pages/LossGrowthPage/LossGrowthPage';
import { LeastSquaresGeometryPage } from './pages/LeastSquaresGeometryPage/LeastSquaresGeometryPage';
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
import { CaoChongPage } from './pages/CaoChongPage/CaoChongPage';
import { LinearRegressionPage } from './pages/LinearRegressionPage/LinearRegressionPage';
import { EstimateWeightPage } from './pages/EstimateWeightPage/EstimateWeightPage';
export const deck: DeckDefinition = {
  id: 'regression-loss', title: '回归与损失：模型怎样变准', subtitle: '从称象到回归 · 当前展示 17 页',
  scenes: [
    { id: '01', title: '曹冲称象', section: '从称象到回归', render: () => <CaoChongPage /> },
    { id: '02', title: '估计象重', section: '从称象到回归', render: () => <EstimateWeightPage /> },
    { id: '03', title: '预测误差', section: '如何评价模型', render: () => <PredictionErrorPage /> },
    { id: '04', title: '误差不能直接相加', section: '如何评价模型', render: () => <ResidualCancellationPage /> },
    { id: '05', title: '平均绝对误差（MAE）', section: '如何评价模型', render: () => <MaePage /> },
    { id: '06', title: '均方误差（MSE）', section: '如何评价模型', render: () => <MsePage /> },
    { id: '07', title: '用损失指导估重', section: '如何评价模型', render: () => <EstimateWeightPage showLoss /> },
    { id: '08', title: '能否让计算机自动找线？', section: '从手动到自动', render: () => <AutomaticSearchPage /> },
    { id: '09', title: '遍历搜索的局限', section: '从手动到自动', render: () => <SearchLimitsPage /> },
    { id: '10', title: '线性回归模型', section: '建立线性模型', render: () => <LinearRegressionPage /> },
    { id: '11', title: '最小二乘：从搜索到求解', section: '最小二乘', render: () => <LeastSquaresPage /> },
    { id: '12', title: '先求最优截距', section: '最小二乘', render: () => <OptimalInterceptPage /> },
    { id: '13', title: '再求最优斜率', section: '最小二乘', render: () => <OptimalSlopePage /> },
    { id: '14', title: '得到最优直线', section: '最小二乘', render: () => <OptimalLinePage /> },
    { id: '15', title: '从两个参数到矩阵形式', section: '最小二乘', render: () => <MatrixModelPage /> },
    { id: '16', title: '最小二乘的几何意义', section: '最小二乘', render: () => <LeastSquaresGeometryPage /> },
    { id: '17', title: '离开最优解，损失怎样变化？', section: '最小二乘', render: () => <LossGrowthPage /> },
  ],
};
const catalog: [DeckDefinition, ...DeckDefinition[]] = [deck];
export function RegressionLossPpt() {
  return <SceneDeck catalog={catalog} moduleId="regression-loss" assetId="adde4a27-235d-4c03-a3cf-734ccf08b38d" progressKey="lesson-flow:regression-loss" />;
}







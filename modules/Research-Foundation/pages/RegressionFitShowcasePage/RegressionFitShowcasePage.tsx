import { EstimateWeightPage } from '../../../Regression-Loss/pages/EstimateWeightPage/EstimateWeightPage';
import '../../components/InteractionShowcase.css';

export function RegressionFitShowcasePage() {
  return <section className="rf-page rf-interaction-showcase rf-regression-showcase" aria-label="交互教学：线性拟合与损失"><EstimateWeightPage showLoss /></section>;
}

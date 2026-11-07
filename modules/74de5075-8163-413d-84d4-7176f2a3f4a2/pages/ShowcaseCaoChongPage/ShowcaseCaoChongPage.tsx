import { ShowcaseExampleFrame } from '../../components/ShowcaseExampleFrame';
import { CaoChongPage } from '../../components/regression-loss-copy/pages/CaoChongPage/CaoChongPage';
import { EstimateWeightPage } from '../../components/regression-loss-copy/pages/EstimateWeightPage/EstimateWeightPage';

export function ShowcaseCaoChongPage({ stage }: { stage: 'experiment' | 'estimate' }) {
  const experiment = stage === 'experiment';
  return <ShowcaseExampleFrame
    title="从曹冲称象，走进线性回归"
  >
    {experiment ? <CaoChongPage /> : <EstimateWeightPage showLoss />}
  </ShowcaseExampleFrame>;
}

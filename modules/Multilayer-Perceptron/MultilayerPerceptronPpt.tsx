import { RegressionClassificationPage } from './pages/RegressionClassificationPage/RegressionClassificationPage';
import { ProbabilityMappingPage } from './pages/ProbabilityMappingPage/ProbabilityMappingPage';
import { ProbabilityLogOddsPage } from './pages/ProbabilityLogOddsPage/ProbabilityLogOddsPage';
import { SigmoidPage } from './pages/SigmoidPage/SigmoidPage';
import { TitanicTrainingPage } from './pages/TitanicTrainingPage/TitanicTrainingPage';
import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import outline from './outlines.json';
export const deck: DeckDefinition = {
  id:'multilayer-perceptron', title:'多层感知机', subtitle:'分类概率与参数学习 · 当前展示5页',
  scenes:[
    {id:'01',title:'从数值预测到类别预测',section:'分类与概率模型',render:()=> <RegressionClassificationPage />},
    {id:'02',title:'从线性分数到类别概率',section:'分类与概率模型',render:()=> <ProbabilityMappingPage />},
    {id:'03',title:'从概率到线性分数',section:'分类与概率模型',render:()=> <ProbabilityLogOddsPage />},
    {id:'04',title:'逻辑回归的概率预测与类别判定',section:'分类与概率模型',render:()=> <SigmoidPage />},
    {id:'05',title:'逻辑回归的参数估计',section:'分类与概率模型',render:()=> <TitanicTrainingPage />},
  ],
};
const catalog:[DeckDefinition,...DeckDefinition[]]=[deck];
export function MultilayerPerceptronPpt() {
  return <SceneDeck catalog={catalog} moduleId="multilayer-perceptron" assetId={outline.moduleIdentity.id} progressKey="lesson-flow:multilayer-perceptron"/>;
}

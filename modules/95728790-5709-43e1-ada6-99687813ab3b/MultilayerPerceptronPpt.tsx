import { RegressionClassificationPage } from './pages/RegressionClassificationPage/RegressionClassificationPage';
import { ProbabilityMappingPage } from './pages/ProbabilityMappingPage/ProbabilityMappingPage';
import { ProbabilityLogOddsPage } from './pages/ProbabilityLogOddsPage/ProbabilityLogOddsPage';
import { SigmoidPage } from './pages/SigmoidPage/SigmoidPage';
import { TitanicTrainingPage } from './pages/TitanicTrainingPage/TitanicTrainingPage';
import { SceneDeck, type DeckDefinition } from "@shuku/course-style/react/presentation";
import outline from './outlines.json';
export const deck: DeckDefinition = {
  id:'multilayer-perceptron', title:'多层感知机', subtitle:'分类概率与参数学习 · 当前展示5页',
  scenes:[
    {id:'1153ff8a-4924-46a8-b2e5-39df2d4a461c',title:'从数值预测到类别预测',section:'分类与概率模型',render:()=> <RegressionClassificationPage />},
    {id:'ab165c60-5782-4e1e-9d0c-d470f9afe5be',title:'从线性分数到类别概率',section:'分类与概率模型',render:()=> <ProbabilityMappingPage />},
    {id:'d084586e-68f0-4c55-9219-a262b70d423d',title:'从概率到线性分数',section:'分类与概率模型',render:()=> <ProbabilityLogOddsPage />},
    {id:'18aec031-4d66-4205-8027-d0fa0c841d2a',title:'逻辑回归的概率预测与类别判定',section:'分类与概率模型',render:()=> <SigmoidPage />},
    {id:'4ece04bb-c817-406f-8ce0-05c1c03cfc70',title:'逻辑回归的参数估计',section:'分类与概率模型',render:()=> <TitanicTrainingPage />},
  ],
};
const catalog:[DeckDefinition,...DeckDefinition[]]=[deck];
export function MultilayerPerceptronPpt() {
  return <SceneDeck catalog={catalog} moduleId="multilayer-perceptron" assetId={outline.moduleIdentity.id} progressKey="lesson-flow:multilayer-perceptron"/>;
}

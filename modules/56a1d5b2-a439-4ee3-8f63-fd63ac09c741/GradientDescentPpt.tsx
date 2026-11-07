import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import { EvacuationPage } from './pages/EvacuationPage/EvacuationPage';
import outline from './outlines.json';
export const deck: DeckDefinition = { id: 'gradient-descent', title: '梯度下降、优化器与反向传播', subtitle: '第 1 页 · 禁区撤离', scenes: [{ id: 'f4e46459-c7b3-4644-99fb-f884dedabfd9', title: '禁区撤离', section: '先来一场冒险', render: () => <EvacuationPage/> }] };
export function GradientDescentPpt() { return <SceneDeck catalog={[deck]} moduleId="gradient-descent" assetId={outline.moduleIdentity.id} progressKey="lesson-flow:gradient-descent-v1"/>; }

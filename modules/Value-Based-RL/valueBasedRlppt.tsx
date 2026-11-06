import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import { scenes, getPptNotes } from './course';
import './valueBasedRl.css';
export { getPptNotes };
export const deck: DeckDefinition = { id: 'value-based-rl', title: 'Value-based 强化学习：机器人送货', subtitle: '基于价值的强化学习估计状态与动作的长期价值，并据此选择动作。', scenes };
export function ValueBasedRlppt() {
  return <SceneDeck catalog={[deck]} moduleId="value-based-rl" assetId="aa380af5-efee-42a1-8896-16032f9331ea" progressKey="lesson-flow:value-based-rl-v1" getNotes={getPptNotes} />;
}

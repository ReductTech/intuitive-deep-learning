import { moduleIdentity } from './outlines.json';
import { SceneDeck, type DeckDefinition, type SceneDefinition } from '../shared/react/presentation';
import { resNetTransferCourse } from './course';

const scenes: SceneDefinition[] = resNetTransferCourse.map(({ id, title, section, component }) => ({
  id,
  title,
  section,
  render: (context) => component(context),
}));

export const deck: DeckDefinition = {
  id: 'resnet-transfer-guide',
  title: '深层网络与表示学习',
  subtitle: 'ResNet、预训练与迁移学习 · ' + scenes.length + ' 页',
  scenes,
};

const catalog: [DeckDefinition, ...DeckDefinition[]] = [deck];

export function ResNetTransferPpt() {
  return (
    <SceneDeck
      catalog={catalog}
      moduleId="resnet-transfer-guide"
      assetId={moduleIdentity.id}
      progressKey="lesson-flow:resnet-transfer-guide-v1"
    />
  );
}

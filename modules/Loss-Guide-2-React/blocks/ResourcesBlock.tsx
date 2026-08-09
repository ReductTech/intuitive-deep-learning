import { useEffect, useState } from 'react';
import { LessonFooter } from '../../shared/react';
import { usePersistedActivity } from '../components/usePersistedActivity';
import {
  OUTPUT_PAIRING_STATE_KEY,
  OUTPUT_PAIRING_VISIBILITY_EVENT,
} from './OutputHeadPairingBlock';

const videos = [
  {
    title: '什么是信息量、信息熵、交叉熵与KL散度，及其相互之间的关系',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=114867675665413&bvid=BV1mkgwzZEN9&cid=31104109705&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="信息量、信息熵、交叉熵与 KL 散度"></iframe>',
  },
  {
    title: '概率背后的关键方程',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=113059343368578&bvid=BV1sRHwe8ERa&cid=25682248852&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="概率背后的关键方程"></iframe>',
  },
  {
    title: '【深度学习】15分钟搞定交叉熵损失 熵和香农熵 | 信息论｜最大似然 | 梯度特性',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=114675626875309&bvid=BV12VMzzxExF&cid=30475028383&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="15 分钟理解交叉熵损失"></iframe>',
  },
  {
    title: '“交叉熵”如何做损失函数？打包理解“信息量”、“比特”、“熵”、“KL散度”、“交叉熵”',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=418995116&bvid=BV15V411W7VB&cid=363160429&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="交叉熵如何作为损失函数"></iframe>',
  },
];

export function ResourcesBlock() {
  const [visibilityOverride, setVisibilityOverride] = useState<
    boolean | null
  >(null);
  const {
    state,
    hydrated,
    persistenceAvailable,
  } = usePersistedActivity<{ resourcesVisible: boolean }>({
    stateKey: OUTPUT_PAIRING_STATE_KEY,
    createInitial: () => ({ resourcesVisible: true }),
    normalizeState: (stored) => {
      if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
        return null;
      }
      const candidate = stored as { resourcesVisible?: unknown };
      if (typeof candidate.resourcesVisible !== 'boolean') return null;
      return { resourcesVisible: candidate.resourcesVisible };
    },
  });

  useEffect(() => {
    const handleVisibility = (event: Event) => {
      const detail = (event as CustomEvent<{ visible?: unknown }>).detail;
      if (typeof detail?.visible === 'boolean') {
        setVisibilityOverride(detail.visible);
      }
    };
    window.addEventListener(
      OUTPUT_PAIRING_VISIBILITY_EVENT,
      handleVisibility,
    );
    return () => {
      window.removeEventListener(
        OUTPUT_PAIRING_VISIBILITY_EVENT,
        handleVisibility,
      );
    };
  }, []);

  if (!hydrated) return null;
  const visible = visibilityOverride
    ?? (
      persistenceAvailable === false
        ? true
        : state?.resourcesVisible === true
    );
  if (!visible) return null;

  return (
    <LessonFooter
      className="lg2-block"
      title="继续你的学习旅程"
      description="你可以返回课程目录，或在准备好后继续前往下一步。"
      back={{
        href: 'http://127.0.0.1:59411/CourseMap/',
        label: '返回课程目录',
      }}
      next={{
        href: '/modules/digital-image-module-react',
        label: '学习下一课',
      }}
      videos={videos}
      videosLabel="延伸观看"
    />
  );
}

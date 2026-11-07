import type { CourseEndingResource } from '../../../shared/react';

// Titles, authors, durations and player IDs checked against Bilibili on 2026-10-17.
export const endingResources = [
  {
    title: '什么是 Q Learning？',
    description: '莫烦Python · 用简单例子回顾 Q 表与动作选择。',
    duration: '06:10',
    href: 'https://www.bilibili.com/video/BV1kx411E7Yq/',
    embedUrl: 'https://player.bilibili.com/player.html?isOutside=true&aid=15987795&bvid=BV1kx411E7Yq&cid=26087278&p=1&autoplay=0',
  },
  {
    title: 'Q-learning 与 Bellman 方程',
    description: 'SKki_ovo · 回顾长期价值与一步更新的关系。',
    duration: '09:58',
    href: 'https://www.bilibili.com/video/BV1buxDzzE9P/',
    embedUrl: 'https://player.bilibili.com/player.html?isOutside=true&aid=115331582400711&bvid=BV1buxDzzE9P&cid=32894026989&p=1&autoplay=0',
  },
  {
    title: '什么是 DQN？',
    description: '莫烦Python · 理解从 Q 表到神经网络的变化。',
    duration: '03:51',
    href: 'https://www.bilibili.com/video/BV1kx411E72M/',
    embedUrl: 'https://player.bilibili.com/player.html?isOutside=true&aid=15988613&bvid=BV1kx411E72M&cid=26088494&p=1&autoplay=0',
  },
  {
    title: 'DQN：论文解读与代码实战',
    description: '东川路第一可爱猫猫虫 · 结合论文与代码理解 DQN。',
    duration: '15:12',
    href: 'https://www.bilibili.com/video/BV1YexvzTE6V/',
    embedUrl: 'https://player.bilibili.com/player.html?isOutside=true&aid=115338679164112&bvid=BV1YexvzTE6V&cid=32923323583&p=1&autoplay=0',
  },
] as const satisfies readonly CourseEndingResource[];

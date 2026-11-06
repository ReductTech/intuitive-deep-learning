import { moduleAssetUrl } from '../shared/react/assets';
import { moduleIdentity } from './outlines.json';
const clipUrl = moduleAssetUrl(moduleIdentity.id, 'speech-i-like-learning.m4a');

export interface VoiceSyllable {
  character: string;
  /** 该音节在音频里的起点（秒）。 */
  start: number;
  /** 该音节在音频里的终点（秒）。 */
  end: number;
}

/**
 * 「我喜欢学习」的语音素材，以及从这段音频实测出来的波形与音节边界。
 *
 * 音频由 macOS 中文语音 Tingting 合成（语速 165），再用 ffmpeg 转成 24 kHz 单声道 m4a。
 * envelope 是每 1/88 段音频的响度（0–1，取 0.72 次幂让低声部分可见），
 * syllables 的起点是这条响度曲线上能量最低的四个位置，
 * 也就是「我 喜 欢 学 习」五个音节之间的界线。两者都跟着音频一起更新。
 */
export const voiceClip = {
  src: clipUrl,
  duration: 1.293,
  syllables: [
    { character: '我', start: 0, end: 0.24 },
    { character: '喜', start: 0.24, end: 0.43 },
    { character: '欢', start: 0.43, end: 0.75 },
    { character: '学', start: 0.75, end: 1.005 },
    { character: '习', start: 1.005, end: 1.245 },
  ] as VoiceSyllable[],
  envelope: [
    0.254, 0.618, 0.794, 0.857, 1, 0.976, 0.993, 0.892, 0.814, 0.817, 0.648, 0.373,
    0.299, 0.295, 0.32, 0.309, 0.265, 0.268, 0.304, 0.692, 0.818, 0.815, 0.729, 0.745,
    0.698, 0.657, 0.484, 0.237, 0.137, 0.081, 0.068, 0.209, 0.846, 0.917, 0.884, 0.838,
    0.824, 0.814, 0.815, 0.738, 0.756, 0.816, 0.864, 0.869, 0.65, 0.302, 0.382, 0.382,
    0.327, 0.29, 0.297, 0.259, 0.217, 0.603, 0.815, 0.808, 0.783, 0.832, 0.794, 0.834,
    0.771, 0.69, 0.529, 0.344, 0.311, 0.322, 0.317, 0.286, 0.274, 0.234, 0.348, 0.57,
    0.539, 0.536, 0.54, 0.543, 0.542, 0.583, 0.557, 0.554, 0.558, 0.558, 0.578, 0.463,
    0.211, 0.083, 0.014, 0.002,
  ],
};

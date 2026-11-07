import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { Fragment, useRef, useState, useEffect, type CSSProperties } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
const senderAvatar = moduleAssetUrl(moduleIdentity.id, "sender-avatar.png");
import './RNNTextToNumbersPage.css';

export interface RNNTextToNumbersPageProps {
  onComplete: () => void;
}

const sentence = '我打开书开始学习';
const characters = Array.from(sentence);
const seamCount = characters.length - 1;

/** 静态字级全量词表（最终标准字表） */
const finalVocabulary = characters.filter((c, i) => characters.indexOf(c) === i);
const finalCodeMap = new Map(finalVocabulary.map((c, i) => [c, i + 1]));
const repeatedChars = new Set(
  finalVocabulary.filter((c) => characters.filter((item) => item === c).length > 1),
);

/** 将切割状态切分成 Token 数组 */
function parseTokens(cuts: boolean[]) {
  const tokens: { text: string; indices: number[] }[] = [];
  let currentIndices: number[] = [];

  characters.forEach((_, index) => {
    currentIndices.push(index);
    if (index === characters.length - 1 || cuts[index]) {
      tokens.push({
        text: currentIndices.map((i) => characters[i]).join(''),
        indices: currentIndices,
      });
      currentIndices = [];
    }
  });
  return tokens;
}

export function RNNTextToNumbersPage({ onComplete }: RNNTextToNumbersPageProps) {
  // 切口状态
  const [cuts, setCuts] = useState<boolean[]>(() => Array(seamCount).fill(false));
  // 最小单字切分动画与完成状态
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const completedRef = useRef(false);

  const tokens = parseTokens(cuts);
  // 当前动态词表（词元去重）
  const currentVocab = Array.from(new Set(tokens.map((t) => t.text)));
  const currentCodeMap = new Map(currentVocab.map((t, idx) => [t, idx + 1]));

  const cutCount = cuts.filter(Boolean).length;
  const isFullySplit = cutCount === seamCount;

  // 用户自主切完 7 刀时，自动完成
  useEffect(() => {
    if (isFullySplit && !isFinalized && !isAnimating) {
      setIsFinalized(true);
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }
  }, [isFullySplit, isFinalized, isAnimating, onComplete]);

  // 手动切换切口
  const toggleSeam = (index: number) => {
    if (isFinalized || isAnimating) return;
    setCuts((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  // 一键拆解为最小单位序列动画
  const handleSplitToMinUnits = async () => {
    if (isAnimating || isFinalized) return;
    setIsAnimating(true);

    const missingIndices = cuts
      .map((v, i) => (!v ? i : -1))
      .filter((i) => i !== -1);

    // 逐个切口切开动画，每隔 160ms 拆开一刀
    for (let i = 0; i < missingIndices.length; i++) {
      await new Promise((r) => setTimeout(r, 160));
      const targetIdx = missingIndices[i];
      setCuts((prev) => {
        const next = [...prev];
        next[targetIdx] = true;
        return next;
      });
    }

    await new Promise((r) => setTimeout(r, 260));
    setIsAnimating(false);
    setIsFinalized(true);

    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  const tokenForCharIndex = (charIdx: number) => {
    return tokens.find((t) => t.indices.includes(charIdx));
  };

  const stationIndex = isFinalized ? 2 : cutCount > 0 ? 1 : 0;

  return (
    <ContentBlock
      headingLevel={1}
      className="nrnn-text-to-numbers"
      title="文本预处理：机器怎样“读懂”一段文本？"
      subtitle="机器看不见文字，只认数字。先把句子切成token，再把每个token换成词表编号。"
    >
      {/* 顶部三步站点 */}
      <ol className="nrnn-text-to-numbers__stations">
        {['原始文本', '词元化', '词表映射'].map((label, index) => (
          <li
            key={label}
            className={`nrnn-text-to-numbers__station${index === stationIndex ? ' is-current' : ''}${index < stationIndex ? ' is-done' : ''}`}
          >
            <span className="nrnn-text-to-numbers__station-index">
              <Typography as="span" variant="bodySmall" tone="inherit">{index + 1}</Typography>
            </span>
            <Typography as="span" variant="body" tone="inherit">{label}</Typography>
          </li>
        ))}
      </ol>

      {/* 句带：切词展示区 */}
      <section className="nrnn-text-to-numbers__band" aria-label="原始文本与切分">
        <header className="nrnn-text-to-numbers__band-head">
          <Typography as="span" variant="bodySmall" tone="warning">
            {isFinalized ? '最小词元 (字级 Token)' : '自由切词区域'}
          </Typography>
          <Typography as="span" variant="bodySmall" tone="muted">
            {isFinalized
              ? '已拆解为最小单位 · 8 个字级 token'
              : cutCount === 0
                ? '点击字符之间的缝隙自由切词'
                : `已切分成 ${tokens.length} 个词元 (Token)`}
          </Typography>
        </header>

        <div className={`nrnn-text-to-numbers__cells ${isFinalized ? 'is-finalized' : ''}`}>
          {characters.map((character, index) => {
            const token = tokenForCharIndex(index);
            const tokenText = token ? token.text : character;
            const isGroupStart = token ? token.indices[0] === index : true;
            const isGroupEnd = token ? token.indices[token.indices.length - 1] === index : true;
            const isSingle = token ? token.indices.length === 1 : false;

            // 动态/静态映射编号
            const assignedCode = isFinalized
              ? finalCodeMap.get(character)
              : currentCodeMap.get(tokenText);

            return (
              <Fragment key={`${character}-${index}`}>
                {index > 0 && (
                  <button
                    type="button"
                    className={`nrnn-text-to-numbers__seam${cuts[index - 1] ? ' is-cut' : ''}${isAnimating ? ' is-animating' : ''}`}
                    disabled={isFinalized || isAnimating}
                    aria-pressed={cuts[index - 1]}
                    aria-label={`切开「${characters[index - 1]}」与「${character}」之间的位置`}
                    onClick={() => toggleSeam(index - 1)}
                  />
                )}
                <div
                  className={`nrnn-text-to-numbers__cell${isSingle || isFinalized ? ' is-token' : ' is-chunk'}${isGroupStart ? ' is-group-start' : ''}${isGroupEnd ? ' is-group-end' : ''}`}
                  style={{ '--code-delay': `${index * 0.05}s` } as CSSProperties}
                >
                  <Typography
                    as="span"
                    variant="display"
                    tone={isFinalized ? 'light' : 'main'}
                    className="nrnn-text-to-numbers__character"
                  >
                    {character}
                  </Typography>

                  {/* 映射编号实时展示 */}
                  <span className={`nrnn-text-to-numbers__code${repeatedChars.has(character) && isFinalized ? ' is-repeat' : ''}`}>
                    {cutCount > 0 || isFinalized ? (
                      <Typography as="span" variant="h1" tone="inherit">
                        {assignedCode ?? '?'}
                      </Typography>
                    ) : null}
                  </span>
                </div>
              </Fragment>
            );
          })}
        </div>
      </section>

      {/* 词表映射区域 */}
      <section className="nrnn-text-to-numbers__vocabulary" aria-label="词表">
        <header className="nrnn-text-to-numbers__vocabulary-head">
          <Typography as="span" variant="bodySmall" tone="warning">③ 词表映射</Typography>
          <Typography as="span" variant="bodySmall" tone="muted">
            {isFinalized
              ? '字级词表：无论上下文，「开」都被固定映射为 3。单凭静态数字无法区分词义，因此记忆上文至关重要。'
              : '词表根据上方当前切分出的 token 实时映射'}
          </Typography>
        </header>

        <ol className="nrnn-text-to-numbers__entries">
          {(isFinalized ? finalVocabulary : currentVocab).map((item, index) => {
            const isRepeat = repeatedChars.has(item) && isFinalized;
            return (
              <li
                key={`${item}-${index}`}
                className={`nrnn-text-to-numbers__entry is-confirmed${isFinalized ? ' is-mapped' : ''}${isRepeat ? ' is-repeat' : ''}`}
              >
                <Typography as="span" variant="h3" tone="inherit">{item}</Typography>
                <Typography as="span" variant="bodySmall" tone="inherit" className="nrnn-text-to-numbers__entry-arrow">→</Typography>
                <Typography as="span" variant="h3" tone="inherit">{index + 1}</Typography>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 底部小提示（参考 WeightedSumPage 布局设计） */}
      <div className={`nrnn-text-to-numbers__tip${isFinalized ? ' is-finalized' : ''}`}>
        <div className="nrnn-text-to-numbers__tip-video">
          <img src={senderAvatar} alt="提示头像" />
        </div>
        <div className="nrnn-text-to-numbers__tip-copy">
          <div className="nrnn-text-to-numbers__tip-header">
            <Typography as="strong" variant="h3" tone="accent">小提示</Typography>
            {!isFinalized && cutCount > 0 && (
              <Button
                className="nrnn-text-to-numbers__min-btn"
                disabled={isAnimating}
                onClick={handleSplitToMinUnits}
              >
                <Typography as="span" variant="bodySmall" tone="inherit">
                  {isAnimating ? '正在拆分中...' : '⚡ 切分为最小单位'}
                </Typography>
              </Button>
            )}
          </div>
          <Typography as="p" variant="body" tone="muted">
            {isFinalized
              ? '✨ 拆分完成！注意「开」两次都被映射成了数字 3。但在「打开」和「开始」中含义截然不同——模型只看数字 3 无法分辨，因此必须依靠 RNN 携带前文的隐状态记忆，才能准确理解！'
              : cutCount === 0
                ? '点字与字之间的缝，可以切成词，也可以切成单字，词表会实时映射。'
                : `当前切出了 ${tokens.length} 个词元。大部分模型通常需要拆解为最小单位（单字/字符级）来精简词表。`}
          </Typography>
        </div>
      </div>
    </ContentBlock>
  );
}

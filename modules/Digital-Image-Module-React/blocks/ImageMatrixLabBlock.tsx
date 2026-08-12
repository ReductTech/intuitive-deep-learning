import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import {
  Button,
  Feedback,
  LessonStage,
} from '../../shared/react';
import { ImageSelectionCanvas } from '../components/ImageSelectionCanvas';
import { usePersistedActivity } from '../components/usePersistedActivity';
import {
  buildChannelImageData,
  createDemoImageData,
  dataUrlToImageData,
  imageElementToImageData,
  normalizeImageForSnapshot,
  pixelAt,
  sampleBounds,
  type PixelPoint,
} from '../model/imageMath';
import {
  createInitialImageMatrixSnapshot,
  normalizeImageMatrixSnapshot,
  type ImageMatrixSnapshot,
  type MatrixScaleMode,
} from '../model/imageSnapshot';

interface ImageMatrixLabBlockProps {
  onComplete?: () => void;
  lessonStepComplete?: boolean;
}

const channels = [
  { key: 'r', index: 0 as const, title: 'R 通道', description: '红色强度', color: '#c43f52' },
  { key: 'g', index: 1 as const, title: 'G 通道', description: '绿色强度', color: '#228d5c' },
  { key: 'b', index: 2 as const, title: 'B 通道', description: '蓝色强度', color: '#27446e' },
] as const;

function fileToImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法读取这张图片，请换一张图片重试。'));
    };
    image.src = url;
  });
}

function MatrixTable({
  imageData,
  selected,
  channelIndex,
  channelKey,
  mode,
}: {
  imageData: ImageData;
  selected: PixelPoint;
  channelIndex: 0 | 1 | 2;
  channelKey: 'r' | 'g' | 'b';
  mode: MatrixScaleMode;
}) {
  const bounds = sampleBounds(imageData.width, imageData.height, selected);
  const rows = Array.from({ length: bounds.size }, (_, dy) => (
    Array.from({ length: bounds.size }, (_, dx) => {
      const value = pixelAt(
        imageData,
        bounds.x + dx,
        bounds.y + dy,
      )[channelIndex];
      return {
        value,
        text: mode === 'unit' ? (value / 255).toFixed(2) : String(value),
        center:
          dx === Math.floor(bounds.size / 2)
          && dy === Math.floor(bounds.size / 2),
      };
    })
  ));

  return (
    <section className={`di-matrix-table di-matrix-table--${channelKey}`}>
      <h4>{channelKey.toUpperCase()} {channelKey === 'r' ? '红色' : channelKey === 'g' ? '绿色' : '蓝色'}强度 3 × 3</h4>
      <table>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, columnIndex) => (
                <td
                  className={cell.center ? 'is-center' : undefined}
                  key={columnIndex}
                  style={{ '--cell-alpha': String(0.04 + cell.value / 255 * 0.28) } as React.CSSProperties}
                >
                  {cell.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function ImageMatrixLabBlock({
  onComplete,
  lessonStepComplete = false,
}: ImageMatrixLabBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragDepth, setDragDepth] = useState(0);
  const activity = usePersistedActivity<ImageMatrixSnapshot>({
    stateKey: 'activity:digital-image-matrix',
    createInitial: createInitialImageMatrixSnapshot,
    normalizeState: normalizeImageMatrixSnapshot,
    getElement: () => rootRef.current,
  });

  useEffect(() => {
    if (!activity.hydrated || !activity.state) return;
    let active = true;
    const restore = async () => {
      try {
        if (activity.state?.sourceKind === 'demo') {
          if (active) setImageData(createDemoImageData());
        } else if (
          activity.state?.sourceKind === 'upload'
          && activity.state.imageDataUrl
        ) {
          const restored = await dataUrlToImageData(activity.state.imageDataUrl);
          if (active) setImageData(restored);
        } else if (active) {
          setImageData(null);
        }
      } catch {
        if (active) {
          setImageData(null);
          setError('此前保存的图片无法恢复，请重新选择图片。');
        }
      }
    };
    void restore();
    return () => {
      active = false;
    };
  }, [
    activity.hydrated,
    activity.state?.imageDataUrl,
    activity.state?.sourceKind,
  ]);

  useEffect(() => {
    if (
      activity.state?.splitDone
      && imageData
      && !lessonStepComplete
    ) {
      onComplete?.();
    }
  }, [activity.state?.splitDone, imageData, lessonStepComplete, onComplete]);

  const applyLoadedImage = useCallback((
    nextImageData: ImageData,
    snapshot: ImageMatrixSnapshot,
    eventName: 'digital_image_demo_load' | 'digital_image_upload_commit',
    properties: Record<string, unknown>,
  ) => {
    setImageData(nextImageData);
    setError('');
    activity.commit(eventName, snapshot, properties);
    if (!lessonStepComplete) onComplete?.();
  }, [activity, lessonStepComplete, onComplete]);

  const useDemoImage = useCallback(() => {
    const demo = createDemoImageData();
    const selected = {
      x: Math.floor(demo.width / 2),
      y: Math.floor(demo.height / 2),
    };
    applyLoadedImage(
      demo,
      {
        version: 1,
        sourceKind: 'demo',
        imageDataUrl: null,
        imageWidth: demo.width,
        imageHeight: demo.height,
        selected,
        scaleMode: '255',
        splitDone: true,
      },
      'digital_image_demo_load',
      { width: demo.width, height: demo.height },
    );
  }, [applyLoadedImage]);

  const loadFile = useCallback(async (file?: File | null) => {
    if (!file) return;
    if (!/^image\//.test(file.type || '')) {
      setError('请选择 PNG、JPEG、WebP 等图片文件。');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const image = await fileToImage(file);
      const resized = imageElementToImageData(image);
      const normalized = await normalizeImageForSnapshot(resized);
      const selected = {
        x: Math.floor(normalized.imageData.width / 2),
        y: Math.floor(normalized.imageData.height / 2),
      };
      applyLoadedImage(
        normalized.imageData,
        {
          version: 1,
          sourceKind: 'upload',
          imageDataUrl: normalized.dataUrl,
          imageWidth: normalized.imageData.width,
          imageHeight: normalized.imageData.height,
          selected,
          scaleMode: '255',
          splitDone: true,
        },
        'digital_image_upload_commit',
        {
          file_type: file.type,
          file_size: file.size,
          width: normalized.imageData.width,
          height: normalized.imageData.height,
        },
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : '无法读取这张图片，请换一张图片重试。',
      );
    } finally {
      setLoading(false);
    }
  }, [applyLoadedImage]);

  const sourceState = activity.state;
  const channelImages = useMemo(() => imageData
    ? channels.map((channel) => buildChannelImageData(imageData, channel.index))
    : [], [imageData]);

  function commitSelection(point: PixelPoint) {
    activity.commit(
      'digital_image_selection_commit',
      (current) => ({ ...current, selected: point }),
      { x: point.x, y: point.y },
    );
  }

  function setScaleMode(mode: MatrixScaleMode) {
    if (sourceState?.scaleMode === mode) return;
    activity.commit(
      'digital_image_scale_mode_commit',
      (current) => ({ ...current, scaleMode: mode }),
      { scale_mode: mode },
    );
  }

  const dragHandlers = {
    onDragEnter: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDragDepth((value) => value + 1);
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: () => setDragDepth((value) => Math.max(0, value - 1)),
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDragDepth(0);
      void loadFile(event.dataTransfer.files?.[0]);
    },
  };

  if (!activity.hydrated || !sourceState) {
    return (
      <LessonStage
        className="di-stage"
        title="现在换成你自己的图片"
        description="正在恢复图片实验状态。"
        aria-busy="true"
      />
    );
  }

  const selected = sourceState.selected;

  return (
    <LessonStage
      ref={rootRef}
      className="di-stage"
      title="现在换成你自己的图片"
      description="选择一张图片，看看它怎样按 RGB 约定拆成三个通道。图片只在本地处理，不会上传。"
      data-state-key="activity:digital-image-matrix"
      data-telemetry-manual
    >
      <section
        className={`di-upload-panel${dragDepth > 0 ? ' is-dragging' : ''}`}
        aria-label="上传一张图片"
        {...dragHandlers}
      >
        <label className="di-file-picker">
          <input
            type="file"
            accept="image/*"
            disabled={loading}
            onChange={(event) => {
              void loadFile(event.currentTarget.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
          <span className="di-upload-icon" aria-hidden="true">📷</span>
          <strong>{loading ? '正在读取图片' : '上传一张图片'}</strong>
          <span className="di-upload-instruction">点击或拖拽到这里</span>
        </label>
        <Button
          className="di-demo-link"
          disabled={loading}
          onClick={useDemoImage}
        >
          没有图片？<strong>使用示例图</strong><span aria-hidden="true">→</span>
        </Button>
      </section>

      {error && (
        <Feedback
          status="wrong"
          message={error}
          className="di-upload-feedback"
        />
      )}

      {imageData && sourceState.splitDone && (
        <section className="di-image-workspace" aria-label="图片 RGB 拆分结果">
          <div className="di-representation-grid is-split">
            <article className="edu-card di-image-card di-source-card">
              <h3 className="edu-panel-title">原始彩色图像</h3>
              <p className="edu-panel-description">
                拖动图像中的选区，查看不同位置的 3 × 3 数值。
              </p>
              <ImageSelectionCanvas
                imageData={imageData}
                selected={selected}
                selectionColor="#f07e47"
                ariaLabel="上传后的原始彩色图像"
                onSelectionDraft={(point) => {
                  activity.setDraft((current) => ({ ...current, selected: point }));
                }}
                onSelectionCommit={commitSelection}
              />
            </article>

            <section
              className="di-rgb-panel"
              aria-label="RGB 通道图与 3 × 3 数值矩阵"
            >
              <div className="di-rgb-head">
                <div className="di-channel-head">
                  <h3 className="edu-panel-title">RGB 通道图与数值矩阵</h3>
                  <p className="edu-panel-description">
                    每个通道图下方是选区对应的 3 × 3 数值。
                  </p>
                </div>
                <div
                  className="edu-toolbar-actions di-matrix-controls"
                  role="group"
                  aria-label="矩阵数值显示方式"
                >
                  <Button
                    active={sourceState.scaleMode === '255'}
                    aria-pressed={sourceState.scaleMode === '255'}
                    onClick={() => setScaleMode('255')}
                  >
                    0–255
                  </Button>
                  <Button
                    active={sourceState.scaleMode === 'unit'}
                    aria-pressed={sourceState.scaleMode === 'unit'}
                    onClick={() => setScaleMode('unit')}
                  >
                    0–1
                  </Button>
                </div>
              </div>

              <div
                className="di-channel-grid is-split"
                aria-label="RGB 通道拆分结果"
              >
                {channels.map((channel, index) => (
                  <section className="di-channel-column" key={channel.key}>
                    <article
                      className={`edu-card di-image-card di-channel-card di-channel-card--${channel.key}`}
                    >
                      <div className="di-card-head">
                        <span>{channel.title}</span>
                        <strong>{channel.description}</strong>
                      </div>
                      <ImageSelectionCanvas
                        imageData={channelImages[index]}
                        selected={selected}
                        selectionColor={channel.color}
                        ariaLabel={`${channel.description}通道图`}
                        onSelectionDraft={(point) => {
                          activity.setDraft((current) => ({ ...current, selected: point }));
                        }}
                        onSelectionCommit={commitSelection}
                      />
                    </article>
                    <div className="di-matrix-slot">
                      <MatrixTable
                        imageData={imageData}
                        selected={selected}
                        channelIndex={channel.index}
                        channelKey={channel.key}
                        mode={sourceState.scaleMode}
                      />
                    </div>
                  </section>
                ))}
              </div>
            </section>
          </div>
        </section>
      )}
    </LessonStage>
  );
}


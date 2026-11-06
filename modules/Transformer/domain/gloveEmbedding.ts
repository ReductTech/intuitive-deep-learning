export const DISPLAY_EMBEDDING_DIMENSIONS = 512;
const SOURCE_DIMENSIONS = 50;
export interface GloveTokenEmbedding {
    token: string;
    values: number[];
}
export type ModelProgress = (progress: number, message: string) => void;
export async function tokenizeForGlove(text: string): Promise<string[]> {
    return text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*|[^\s]/gu) ?? [];
}
// A fixed orthonormal cosine basis lifts the original vectors into the teaching
// width without adding semantic information. Dot products and distances survive.
const displayBasis = Array.from({ length: DISPLAY_EMBEDDING_DIMENSIONS }, (_, output) => Array.from({ length: SOURCE_DIMENSIONS }, (_, input) => Math.sqrt((input === 0 ? 1 : 2) / DISPLAY_EMBEDDING_DIMENSIONS) *
    Math.cos(Math.PI * (output + 0.5) * input / DISPLAY_EMBEDDING_DIMENSIONS)));
export async function embedWithGlove(text: string, onProgress?: ModelProgress): Promise<GloveTokenEmbedding[]> {
    const words = await tokenizeForGlove(text);
    onProgress?.(10, '正在查找词向量');
    const response = await fetch('/api/glove/embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, words }),
        signal: AbortSignal.timeout(60000),
    });
    const raw = await response.text();
    if (!raw)
        throw new Error('本地词向量服务暂未就绪，请稍后重试。');
    let data: {
        rows?: GloveTokenEmbedding[];
        hidden_size?: number;
        detail?: string;
    };
    try {
        data = JSON.parse(raw);
    }
    catch {
        throw new Error('词向量服务响应异常，请重试。');
    }
    if (!response.ok)
        throw new Error(response.status === 404
            ? '当前使用英文词表，请输入常见英文单词。'
            : data.detail || '读取词向量失败，请重试。');
    if (data.hidden_size !== SOURCE_DIMENSIONS || !Array.isArray(data.rows) ||
        data.rows.length !== words.length || data.rows.some(row => row.values.length !== SOURCE_DIMENSIONS ||
        row.values.some(value => !Number.isFinite(value)))) {
        throw new Error('模型返回的词向量不完整，请重试。');
    }
    onProgress?.(100, '已映射为课堂演示向量');
    return data.rows.map(row => ({
        token: row.token,
        values: displayBasis.map(axis => axis.reduce((sum, weight, index) => sum + weight * row.values[index], 0)),
    }));
}

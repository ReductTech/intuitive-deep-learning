export interface DigitPrediction {
  digit: string;
  confidence: number;
}

const SERVICE_URL = `${(import.meta.env.VITE_CNN_SERVICE_URL || 'http://127.0.0.1:28431').replace(/\/$/, '')}/emnist/predict-digits`;

export async function recognizeEmnistDigit(image: string): Promise<DigitPrediction> {
  let response: Response;
  try {
    response = await fetch(SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: [image] }),
    });
  } catch {
    throw new Error('无法连接本地手写识别服务。');
  }
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || '手写识别服务返回失败。');
  const prediction = payload.result?.predictions?.[0] as DigitPrediction | undefined;
  if (!prediction || !/^[0-9]$/.test(prediction.digit) || !Number.isFinite(prediction.confidence)) {
    throw new Error('手写识别结果格式错误。');
  }
  return prediction;
}

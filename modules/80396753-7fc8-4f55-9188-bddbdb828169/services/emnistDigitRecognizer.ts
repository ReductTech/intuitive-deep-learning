import {requestCourse} from '@shuku/course-runtime/react/courseRequests';

export interface DigitPrediction {
  digit: string;
  confidence: number;
}

export async function recognizeEmnistDigit(image: string): Promise<DigitPrediction> {
  const payload = await requestCourse<{ok:boolean;result?:{predictions?:DigitPrediction[]};error?:string}>({
    action:'compute',endpoint:'/emnist/predict-digits',payload:{images:[image]},
  });
  if (!payload.ok) throw new Error(payload.error || '手写识别服务返回失败。');
  const prediction = payload.result?.predictions?.[0] as DigitPrediction | undefined;
  if (!prediction || !/^[0-9]$/.test(prediction.digit) || !Number.isFinite(prediction.confidence)) {
    throw new Error('手写识别结果格式错误。');
  }
  return prediction;
}

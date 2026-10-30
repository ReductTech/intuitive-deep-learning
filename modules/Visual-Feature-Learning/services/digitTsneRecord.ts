import type {ProjectionSample} from './digitNetworkTraining';

export const tsneCourseId='80396753-7fc8-4f55-9188-bddbdb828169';
export const tsneEpochs=15;
export const tsneLearningRates=[0.0002,0.002,0.02] as const;
export const tsneBatchSizes=[64,128,256] as const;
export interface TsneFrame{epoch:number;points:number[][];train_loss:number;val_loss:number;train_accuracy:number;val_accuracy:number}
export interface TsneRecord{schema_version:number;samples:ProjectionSample[];frames:TsneFrame[];metadata:Record<string,unknown>;recording:{epochs:number;learning_rate:number;batch_size:number;train_count:number;val_count:number;version:string}}
const records=new Map<string,TsneRecord>();

export async function loadTsneRecord(learningRate:number,batchSize:number,signal:AbortSignal):Promise<TsneRecord>{
 const key=`${learningRate}:${batchSize}`;
 const cached=records.get(key);if(cached)return cached;
 const response=await fetch(`/api/courses/${tsneCourseId}/records/digit-tsne`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({learning_rate:learningRate,batch_size:batchSize}),signal});
 const body=await response.json();
 if(!response.ok||!body.ok)throw new Error(typeof body.detail==='string'?body.detail:'训练记录暂不可用，请稍后重试。');
 const record=body.result as TsneRecord;
 if(record.recording?.epochs!==tsneEpochs||record.recording.learning_rate!==learningRate||record.recording.batch_size!==batchSize||record.frames?.length!==tsneEpochs+1)throw new Error('训练记录与所选参数不匹配。');
 records.set(key,record);return record;
}

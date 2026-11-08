import {loadRecord} from './precomputedRecord';
export interface Layer {id:string;kind:'conv'|'pool';out_channels:number;kernel_size:number;stride:number;padding:number;pool_type:'max'|'avg'}
export interface Shape {h:number;w:number;c:number}
export interface Epoch {epoch:number;loss:number;train_accuracy:number;val_accuracy:number}
export interface ProjectionSample {id:number;label:number;image:string}
export interface ProjectionFrame {epoch:number;points:number[][];loss?:number;val_accuracy?:number}
export interface FeatureProjection {samples:ProjectionSample[];frames:ProjectionFrame[];metadata:{method:string;perplexity:number;random_state:number;max_iter:number;labels_used_in_projection:boolean};recording?:{epochs:number;session_id:string}}
export interface TrainingSnapshot {epoch:number;layers:{layer_index:number;side:number;channels:number;maps:number[][];raw_maps?:number[][]}[];conv_means:number[][];classifier_means:number[];probabilities:number[]}
export interface TrainingResult {history:Epoch[];train_accuracy:number;val_accuracy:number;epochs:number;train_count:number;val_count:number;conv_stats:number[][];session_id:string;snapshot?:TrainingSnapshot;projection?:FeatureProjection}
export interface Job {job_id:string;status:'queued'|'running'|'complete'|'error';progress:number;message:string;result?:TrainingResult;history?:Epoch[];error?:string;projection?:FeatureProjection;snapshot?:TrainingSnapshot}
let lastArchitecture:Layer[]|null=null;
export function digitTrainingArchitecture(){return (lastArchitecture??preset()).map(l=>({...l}));}
const jobs = new Map<string,Job>();
export async function startDigitTraining(architecture:Layer[],epochs:number,signal:AbortSignal,featureProjection=false){
 lastArchitecture=architecture.map(l=>({...l}));
 const result=await loadRecord<TrainingResult>('visual-feature-learning.digit-train',{architecture,epochs,feature_projection:featureProjection},signal);
 const job:Job={job_id:crypto.randomUUID(),status:'complete',progress:100,message:'预计算演示缓存',result,history:result.history,projection:result.projection};
 jobs.set(job.job_id,job);return job;
}
export async function readDigitTraining(id:string,signal:AbortSignal){signal.throwIfAborted();const job=jobs.get(id);if(!job)throw new Error('演示缓存已关闭，请重新打开。');return job;}
export function preset():Layer[]{return [8,16].flatMap((c,i)=>[{id:'conv'+i,kind:'conv' as const,out_channels:c,kernel_size:3,stride:1,padding:1,pool_type:'max' as const},{id:'pool'+i,kind:'pool' as const,out_channels:c,kernel_size:2,stride:2,padding:0,pool_type:'max' as const}]);}
export function shapes(layers:Layer[]){let current:Shape={h:28,w:28,c:1};return layers.map(layer=>{const input={...current};current=layer.kind==='pool'?{...current,h:Math.floor(current.h/2),w:Math.floor(current.w/2)}:{...current,c:layer.out_channels};return {layer,input,shape:{...current}};});}

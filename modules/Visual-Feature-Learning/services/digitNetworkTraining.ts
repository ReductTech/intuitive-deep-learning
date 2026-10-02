export interface Layer {id:string;kind:'conv'|'pool';out_channels:number;kernel_size:number;stride:number;padding:number;pool_type:'max'|'avg'}
export interface Shape {h:number;w:number;c:number}
export interface Epoch {epoch:number;loss:number;train_accuracy:number;val_accuracy:number}
export interface ProjectionSample {id:number;label:number;image:string}
export interface ProjectionFrame {epoch:number;points:number[][];loss?:number;val_accuracy?:number}
export interface FeatureProjection {samples:ProjectionSample[];frames:ProjectionFrame[];metadata:{method:string;perplexity:number;random_state:number;max_iter:number;labels_used_in_projection:boolean};recording?:{epochs:number;session_id:string}}
export interface TrainingResult {history:Epoch[];train_accuracy:number;val_accuracy:number;epochs:number;train_count:number;val_count:number;conv_stats:number[][];session_id:string;projection?:FeatureProjection}
export interface Job {job_id:string;status:'queued'|'running'|'complete'|'error';progress:number;message:string;result?:TrainingResult;history?:Epoch[];error?:string;projection?:FeatureProjection}
let lastArchitecture:Layer[]|null=null;
export function digitTrainingArchitecture(){return (lastArchitecture??preset()).map(l=>({...l}));}
const base=import.meta.env.VITE_CNN_SERVICE_URL || 'http://127.0.0.1:28431';
async function request(path:string,signal:AbortSignal,body?:unknown):Promise<Job>{const response=await fetch(base+path,{signal,method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||'训练服务返回失败');return data.result;}
export function startDigitTraining(architecture:Layer[],epochs:number,signal:AbortSignal,featureProjection=false){lastArchitecture=architecture.map(l=>({...l}));return request('/visual-feature-learning/digit-train',signal,{architecture,epochs,async:true,feature_projection:featureProjection});}
export function readDigitTraining(job:string,signal:AbortSignal){return request('/visual-feature-learning/digit-train-status?job_id='+encodeURIComponent(job),signal);}
export function preset():Layer[]{return [8,16,32,64].flatMap((c,i)=>[{id:'conv'+i,kind:'conv' as const,out_channels:c,kernel_size:3,stride:1,padding:1,pool_type:'max' as const},...(i<3?[{id:'pool'+i,kind:'pool' as const,out_channels:c,kernel_size:2,stride:2,padding:0,pool_type:'max' as const}]:[])]);}
export function shapes(layers:Layer[]){let current:Shape={h:28,w:28,c:1};return layers.map(layer=>{const input={...current};current=layer.kind==='pool'?{...current,h:Math.floor(current.h/2),w:Math.floor(current.w/2)}:{...current,c:layer.out_channels};return {layer,input,shape:{...current}};});}

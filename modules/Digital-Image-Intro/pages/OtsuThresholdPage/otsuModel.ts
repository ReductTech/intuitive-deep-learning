export type Candidate = { threshold:number; valid:boolean; w0:number; w1:number; mu0:number|null; mu1:number|null; score:number };
export function analyzeHistogram(histogram:number[]) {
  const total=histogram.reduce((sum,n)=>sum+n,0), sum=histogram.reduce((s,n,i)=>s+n*i,0);
  let count0=0,sum0=0,best:number|null=null,maxScore=-1;
  const candidates:Candidate[]=[];
  // Same convention as the preceding page: class 0 is I<T, class 1 is I>=T.
  // Prefix totals let every candidate reuse the actual histogram in O(256).
  for(let threshold=0;threshold<=256;threshold++) {
    if(threshold>0){count0+=histogram[threshold-1]??0;sum0+=(histogram[threshold-1]??0)*(threshold-1);}
    const count1=total-count0,valid=count0>0&&count1>0;
    const w0=total?count0/total:0,w1=total?count1/total:0,mu0=count0?sum0/count0:null,mu1=count1?(sum-sum0)/count1:null;
    const score=valid?w0*w1*(mu0!-mu1!)**2:0;
    candidates.push({threshold,valid,w0,w1,mu0,mu1,score});
    // Strict > makes ties deterministic: choose the first maximizing threshold.
    if(valid&&score>maxScore){best=threshold;maxScore=score;}
  }
  return {candidates,best,maxScore:Math.max(0,maxScore)};
}

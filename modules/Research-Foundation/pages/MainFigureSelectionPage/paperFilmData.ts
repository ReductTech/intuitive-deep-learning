export const SELECTED_PAGES=[1,2,3,4,6,8,9,10,11,12,13,14,15,16,17] as const;
export const PAPER_PAGES=SELECTED_PAGES.length;
export const elements=[
 {file:'figure-12.png',page:16,box:[72,78,540,302],label:'Figure 12',primary:true,gx:451,gy:135,scale:.70,rotate:-9,width:1000,height:500},
 {file:'figure-02.png',page:3,box:[72,78,540,230],label:'Figure 2',gx:70,gy:130,scale:.57,rotate:14,width:600,height:350},
 {file:'figure-03.png',page:4,box:[72,78,540,434],label:'Figure 3',gx:1195,gy:115,scale:.55,rotate:-14,width:600,height:430},
 {file:'table-02.png',page:9,box:[187,123,416,317],label:'Table 2',gx:70,gy:395,scale:.57,rotate:12,width:600,height:470},
 {file:'figure-05.png',page:10,box:[72,78,540,295],label:'Figure 5',gx:1190,gy:418,scale:.56,rotate:-12,width:600,height:360},
 {file:'figure-08.png',page:13,box:[72,78,540,219],label:'Figure 8',gx:794,gy:542,scale:.55,rotate:-5,width:600,height:275},
 {file:'figure-01.png',page:2,box:[70,78,542,366],label:'Figure 1',gx:431,gy:510,scale:.53,rotate:7,width:600,height:360},
] as const;
const durations=[700,1000,550,500,160,160,750,400,160,160,400,160,160,1250,160];
export const pageDuration=(index:number)=>durations[index]??160;

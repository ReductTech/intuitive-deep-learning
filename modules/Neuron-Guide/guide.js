(function(){'use strict';

function resizeC(c,W,H){var r=Math.min(window.devicePixelRatio||1,2);if(c.width!==Math.round(W*r)||c.height!==Math.round(H*r)){c.width=Math.round(W*r);c.height=Math.round(H*r);}var ctx=c.getContext('2d');ctx.setTransform(r,0,0,r,0,0);return ctx;}

var P={blue:'#3b6fb6',orange:'#f07e47',red:'#c43f52',green:'#228d5c',deepred:'#8b1a2b',purple:'#7b4ea5',gray:'#68778f',light:'#9fb0c8',bg:'#fbfdff',white:'#fff',road:'#8899aa',sky:'#d4e6f9'};

/* ==================================================================
   Car Drawing Helpers
   ================================================================== */
function drawCar(ctx,x,y,color,label){
  var w=60,h=22,r=6;
  ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x-w/2,y-h/2,w,h,r);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.4)';ctx.fillRect(x+4,y-h/2+3,22,h-6);
  ctx.fillStyle='#222';ctx.beginPath();ctx.arc(x-12,y+h/2,7,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+12,y+h/2,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='700 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(label,x,y);
}

/* ==================================================================
   Screen 0: Single Car + Stationary Front Car
   ================================================================== */
function drawCar1Scene(canvas,state){
  var W=760,H=200,ctx=resizeC(canvas,W,H);ctx.clearRect(0,0,W,H);
  // Sky and road
  ctx.fillStyle=P.sky;ctx.fillRect(0,0,W,H*0.45);
  ctx.fillStyle=P.road;ctx.fillRect(0,H*0.45,W,H*0.12);
  ctx.fillStyle='#bbb';ctx.fillRect(0,H*0.57,W,H*0.43);
  // Lane dash
  ctx.strokeStyle='#ffd700';ctx.lineWidth=2;ctx.setLineDash([30,20]);
  ctx.beginPath();ctx.moveTo(0,H*0.51);ctx.lineTo(W,H*0.51);ctx.stroke();ctx.setLineDash([]);

  var roadY=H*0.51;
  // Front car (stationary)
  var fx=W*0.7; drawCar(ctx,fx,roadY,P.blue,'前车');
  ctx.fillStyle=P.blue;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
  ctx.fillText('静止',fx,roadY-18);

  var bx=W*0.2;
  if(state){
    if(!state.phase||state.phase==='waiting'){ bx=W*0.2; ctx.fillStyle=P.gray;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText('本车',bx,roadY-18); }
    else if(state.phase==='driving'){ bx=state.bx; ctx.fillStyle=P.gray;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText('本车 →',bx,roadY-18); }
    else if(state.phase==='braking'){ bx=state.bx; ctx.fillStyle=P.gray;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText('刹车！',bx,roadY-18); }
    else if(state.phase==='stopped'){ bx=state.bx; ctx.fillStyle=P.gray;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText('已停',bx,roadY-18); }
    else if(state.phase==='crashed'){ bx=state.bx; ctx.fillStyle=P.gray;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText('💥撞车',bx,roadY-18); }
    else if(state.phase==='passed'){ bx=state.bx; }
    drawCar(ctx,bx,roadY,P.orange,'本车');

    // Threshold marker
    if(state.threshold){
      var tx=fx-state.threshold*(W*0.005);
      ctx.strokeStyle=P.red;ctx.lineWidth=2;ctx.setLineDash([4,4]);
      ctx.beginPath();ctx.moveTo(tx,H*0.3);ctx.lineTo(tx,H*0.65);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=P.red;ctx.font='700 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
      ctx.fillText('阈值',tx,H*0.3-4);
    }
  }else{
    drawCar(ctx,bx,roadY,P.orange,'本车');
    var fx2=W*0.7,tx2=fx2-30*(W*0.005);
    ctx.strokeStyle=P.red;ctx.lineWidth=2;ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(tx2,H*0.3);ctx.lineTo(tx2,H*0.65);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=P.red;ctx.font='700 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
    ctx.fillText('阈值',tx2,H*0.3-4);
  }

  // Scale
  ctx.fillStyle=P.gray;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillText('← 距离 →',W/2,H-16);
}

/* ==================================================================
   Screen 1: Three Cars
   ================================================================== */
function drawCar2Scene(canvas,state){
  var W=760,H=220,ctx=resizeC(canvas,W,H);ctx.clearRect(0,0,W,H);
  ctx.fillStyle=P.sky;ctx.fillRect(0,0,W,H*0.42);
  ctx.fillStyle=P.road;ctx.fillRect(0,H*0.42,W,H*0.12);
  ctx.fillStyle='#bbb';ctx.fillRect(0,H*0.54,W,H*0.46);
  ctx.strokeStyle='#ffd700';ctx.lineWidth=2;ctx.setLineDash([30,20]);
  ctx.beginPath();ctx.moveTo(0,H*0.48);ctx.lineTo(W,H*0.48);ctx.stroke();ctx.setLineDash([]);
  var ry=H*0.48;

  // Three cars
  var frontX=state?state.frontX:W*0.75;
  var egoX=state?state.egoX:W*0.35;
  var rearX=state?state.rearX:W*0.15;
  drawCar(ctx,frontX,ry,P.blue,'前车');
  if(state&&state.rearVisible) drawCar(ctx,rearX,ry,P.gray,'后车');
  drawCar(ctx,egoX,ry,P.orange,'本车');

  // Labels
  ctx.fillStyle=P.blue;ctx.font='700 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
  ctx.fillText('低速行驶 →',frontX,ry-18);
  ctx.fillStyle=P.orange;ctx.textAlign='center';
  ctx.fillText('本车 →',egoX,ry-18);
  if(state&&state.collision){
    ctx.fillStyle=P.red;ctx.font='900 14px sans-serif';ctx.fillText(state.collision,(frontX+egoX)/2,ry-40);
  }

  // Show first-level threshold as dashed comparison line
  if(state&&state.prevThreshold){
    var mPerPx2=250/760;
    var prevTx=frontX-state.prevThreshold/mPerPx2;
    ctx.strokeStyle='rgba(240,126,71,0.5)';ctx.lineWidth=2;ctx.setLineDash([6,4]);
    ctx.beginPath();ctx.moveTo(prevTx,H*0.25);ctx.lineTo(prevTx,H*0.62);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(240,126,71,0.7)';ctx.font='700 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
    ctx.fillText('第一关阈值: '+state.prevThreshold+'m',prevTx,H*0.25-4);
  }

  // Scale
  ctx.fillStyle=P.gray;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillText('← 橙色虚线 = 第一个场景的阈值 →',W/2,H-14);
}

/* ==================================================================
   Screen 2: Rain Demo
   ================================================================== */
function drawRainDemo(canvas,frame){
  var W=760,H=180,ctx=resizeC(canvas,W,H);ctx.clearRect(0,0,W,H);
  // Two scenes side by side
  // Left: dry
  ctx.fillStyle='#fef9e7';ctx.fillRect(0,0,W/2-2,H);
  ctx.fillStyle=P.gray;ctx.font='900 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillText('☀ 干燥路面',W/4,8);

  // Right: wet
  ctx.fillStyle='#e0e8f0';ctx.fillRect(W/2+2,0,W/2,H);
  ctx.fillStyle=P.gray;ctx.textAlign='center';
  ctx.fillText('🌧 雨天路面',W*0.75,8);

  // Animate raindrops on wet side
  if(frame&&frame%4===0){/*skip heavy rain anim for perf*/}
  for(var i=0;i<8;i++){ctx.fillStyle='rgba(100,150,200,0.3)';var rx=W*0.55+Math.random()*W*0.4,ry=10+Math.random()*(H-20);ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx+2,ry+6);ctx.stroke();}

  // Car comparison
  var ry2=H-40;
  // Dry: car stops
  drawCar(ctx,W*0.7,ry2,P.orange,'干燥刹停');
  ctx.fillStyle=P.green;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
  ctx.fillText('✓ 安全',W*0.7,ry2-18);

  // Wet: car crashes
  drawCar(ctx,W*0.88,ry2,P.orange,'雨天撞车');
  ctx.fillStyle=P.red;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
  ctx.fillText('💥 撞车',W*0.88,ry2-18);

  ctx.fillStyle=P.gray;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillText('同一阈值 25m，不同路面完全不同结果',W/2,H-14);
}

/* ==================================================================
   Screen 3: Biological Neuron
   ================================================================== */
function drawBioNeuron(canvas){
  var W=700,H=280,ctx=resizeC(canvas,W,H);ctx.clearRect(0,0,W,H);ctx.fillStyle=P.bg;ctx.fillRect(0,0,W,H);

  // Dendrites (left inputs)
  var inputs=[{y:H*0.22,l:'信号 1'},{y:H*0.42,l:'信号 2'},{y:H*0.62,l:'信号 3'},{y:H*0.82,l:'信号 4'}];
  inputs.forEach(function(inp){
    ctx.fillStyle=P.blue;ctx.beginPath();ctx.arc(60,inp.y,12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='700 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(inp.l,60,inp.y);
    // Dendrite branches
    ctx.strokeStyle=P.light;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(72,inp.y);ctx.quadraticCurveTo(150,inp.y-15,220,H/2-30+inp.y*0.1);ctx.stroke();
    ctx.beginPath();ctx.moveTo(72,inp.y);ctx.quadraticCurveTo(150,inp.y+15,220,H/2+20);ctx.stroke();
  });

  // Cell body
  var cx=300,cy=H/2,cr=40;
  var bodyGrad=ctx.createRadialGradient(cx-8,cy-8,cr*0.1,cx,cy,cr);
  bodyGrad.addColorStop(0,'#ffe0b2');bodyGrad.addColorStop(1,P.orange);
  ctx.fillStyle=bodyGrad;ctx.beginPath();ctx.arc(cx,cy,cr,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#e65100';ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='900 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('胞体',cx,cy);

  // Axon
  ctx.strokeStyle='rgba(240,126,71,0.6)';ctx.lineWidth=6;
  ctx.beginPath();ctx.moveTo(cx+cr,cy);ctx.lineTo(560,cy);ctx.stroke();

  // Axon terminal
  ctx.fillStyle=P.orange;ctx.beginPath();ctx.arc(580,cy,14,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='700 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('输出',580,cy);

  // Labels
  ctx.fillStyle=P.gray;ctx.font='800 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
  ctx.fillText('树突（接收信号）',100,H-30);
  ctx.fillText('轴突（输出信号）',450,H-30);
  ctx.fillStyle=P.gray;ctx.font='700 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillText('多输入 → 汇总 → 输出',W/2,H-8);
}

/* ==================================================================
   Screen 4: Artificial Neuron
   ================================================================== */
function drawArtificialNeuron(canvas){
  var W=700,H=280,ctx=resizeC(canvas,W,H);ctx.clearRect(0,0,W,H);ctx.fillStyle=P.bg;ctx.fillRect(0,0,W,H);

  var inputs=[{y:H*0.2,l:'距离危险度'},{y:H*0.4,l:'本车速度'},{y:H*0.6,l:'前车减速程度'},{y:H*0.8,l:'路面湿滑程度'}];
  var nx=450,ny=H/2,nr=36;
  inputs.forEach(function(inp,i){
    ctx.fillStyle=P.blue;ctx.beginPath();ctx.arc(60,inp.y,14,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='700 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('x'+(i+1),60,inp.y);
    ctx.strokeStyle='rgba(159,176,200,0.5)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(74,inp.y);ctx.lineTo(nx-nr,ny);ctx.stroke();
    ctx.fillStyle=P.gray;ctx.font='700 10px sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(inputs[i].l,82,inp.y);
  });

  // Neuron
  ctx.fillStyle=P.orange;ctx.beginPath();ctx.arc(nx,ny,nr,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#e65100';ctx.lineWidth=2.5;ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='900 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('神经元',nx,ny);

  // Output
  ctx.strokeStyle=P.orange;ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(nx+nr,ny);ctx.lineTo(620,ny);ctx.stroke();
  ctx.fillStyle=P.red;ctx.beginPath();ctx.arc(640,ny,16,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='700 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('风险',640,ny);

  ctx.fillStyle=P.gray;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillText('不再写死规则 → 学习每个信号的重要程度',W/2,H-10);
}

/* ==================================================================
   Screen 5: Weights
   ================================================================== */
function drawWeightsCanvas(canvas,xs,ws,z){
  var W=720,H=320,ctx=resizeC(canvas,W,H);ctx.clearRect(0,0,W,H);ctx.fillStyle=P.bg;ctx.fillRect(0,0,W,H);

  var inputs=[{y:H*0.18},{y:H*0.38},{y:H*0.58},{y:H*0.78}];
  var nx=440,ny=H/2,nr=32;

  inputs.forEach(function(inp,i){
    ctx.fillStyle=P.blue;ctx.beginPath();ctx.arc(60,inp.y,14,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='700 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('x'+(i+1),60,inp.y);

    // Edge thickness proportional to weight
    var lw=1+ws[i]*4;
    ctx.strokeStyle=ws[i]>0.7?'rgba(240,126,71,0.7)':'rgba(159,176,200,0.4)';
    ctx.lineWidth=lw;
    ctx.beginPath();ctx.moveTo(74,inp.y);ctx.lineTo(nx-nr,ny);ctx.stroke();

    // Weight label
    var midX=200,midY=inp.y-6;
    ctx.fillStyle=ws[i]>0.7?P.orange:P.gray;
    ctx.font='800 12px monospace';ctx.textAlign='center';ctx.textBaseline='bottom';
    ctx.fillText('w'+(i+1)+'='+ws[i].toFixed(2),midX,midY);

    // Contribution
    var contrib=xs[i]*ws[i];
    ctx.fillStyle=P.gray;ctx.font='700 10px monospace';ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText(sign(contrib)+contrib.toFixed(2),midX,midY+4);
  });

  // Neuron
  ctx.fillStyle=P.orange;ctx.beginPath();ctx.arc(nx,ny,nr,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e65100';ctx.lineWidth=2.5;ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='900 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Σ',nx,ny);

  // z output
  ctx.strokeStyle=P.orange;ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(nx+nr,ny);ctx.lineTo(600,ny);ctx.stroke();
  ctx.fillStyle='#fff';ctx.strokeStyle=P.orange;ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(580,ny-22,80,44,8);ctx.fill();ctx.stroke();
  ctx.fillStyle=P.orange;ctx.font='900 14px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('z='+z.toFixed(2),620,ny);

  ctx.fillStyle=P.gray;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillText('拉动下方滑块改变权重，观察连线粗细和贡献值变化',W/2,H-10);
}

/* ==================================================================
   Screen 6: Bias
   ================================================================== */
function drawBiasCanvas(canvas,z,b,zTotal){
  var W=720,H=300,ctx=resizeC(canvas,W,H);ctx.clearRect(0,0,W,H);ctx.fillStyle=P.bg;ctx.fillRect(0,0,W,H);

  // Contribution sum
  var cx=200,cy=H*0.35;
  ctx.fillStyle='rgba(59,111,182,0.08)';ctx.strokeStyle=P.blue;ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(cx-80,cy-22,160,44,8);ctx.fill();ctx.stroke();
  ctx.fillStyle=P.blue;ctx.font='900 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('输入贡献 = '+z.toFixed(2),cx,cy);

  // + sign
  ctx.fillStyle=P.gray;ctx.font='900 20px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('+',cx+100,cy);

  // Bias
  var bx=340,by=cy;
  ctx.fillStyle='rgba(240,126,71,0.08)';ctx.strokeStyle=P.orange;ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(bx-60,by-22,120,44,8);ctx.fill();ctx.stroke();
  ctx.fillStyle=P.orange;ctx.font='900 12px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('b='+bTotal.toFixed(2),bx,by);

  // = sign
  ctx.fillStyle=P.gray;ctx.font='900 20px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('=',bx+80,by);

  // Result z
  var rzx=500,rzy=cy;
  ctx.fillStyle=P.orange;ctx.strokeStyle='#e65100';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.roundRect(rzx-60,rzy-28,160,56,8);ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='900 16px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('z = '+(z+bTotal).toFixed(2),rzx,rzy);

  // Bar comparison
  var barX=130,barW=460,barY=H*0.7,barH=32;
  ctx.fillStyle=P.gray;ctx.font='800 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
  ctx.fillText('风险分数',barX+barW/2,barY-4);

  // Bar background
  ctx.fillStyle='rgba(159,176,200,0.15)';ctx.beginPath();ctx.roundRect(barX,barY,barW,barH,6);ctx.fill();

  // Bar fill
  var frac=Math.max(0,Math.min(1,((z+bTotal)+1.5)/4));
  ctx.fillStyle=frac>0.7?P.red:(frac>0.3?P.orange:P.green);
  ctx.beginPath();ctx.roundRect(barX,barY,barW*frac,barH,6);ctx.fill();

  ctx.fillStyle='#fff';ctx.font='900 12px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('z='+(z+bTotal).toFixed(2),barX+barW*frac/2,barY+barH/2);

  // Bias explanation
  ctx.fillStyle=P.gray;ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillText('偏置 b 让整个分数整体抬高或压低——就像系统整体更保守或更宽松',W/2,H-8);
}

function sign(v){return v>=0?'+':'';}

/* ==================================================================
   Exports
   ================================================================== */
window.ngDraw={
  car1:drawCar1Scene, car2:drawCar2Scene, rain:drawRainDemo,
  bioNeuron:drawBioNeuron, artificialNeuron:drawArtificialNeuron,
  weights:drawWeightsCanvas, biasCanvas:drawBiasCanvas
};
})();

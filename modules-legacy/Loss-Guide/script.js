(function(){'use strict';

  var LOSS_FEEDBACK_ENDPOINT='http://127.0.0.1:59414/loss/compare-feedback';
  var nlGT=7,nlPred=1.6,nlSolved=false,nlCueDismissed=false;
  var calcView={zoom:1,panX:0,panY:0,dragging:false,moved:false,lastX:0,lastY:0};
  var l1GradientQuestion=null,l2GradientQuestion=null,gradientQuestion=null;
  var recommendedVideos=[
    {
      title:'“损失函数”是如何设计出来的？直观理解最小二乘法和极大似然估计法',
      embed:'<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=758940884&bvid=BV1Y64y1Q7hi&cid=361568602&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="损失函数与最小二乘法"></iframe>'
    },
    {
      title:'8 分钟理解损失函数的本质',
      embed:'<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=115644930463746&bvid=BV1GHS1BzE6J&cid=34424164218&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="理解损失函数"></iframe>'
    },
    {
      title:'6 分钟理解机器学习中的损失函数',
      embed:'<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=513994584&bvid=BV1vg411172u&cid=789260398&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="机器学习损失函数"></iframe>'
    },
    {
      title:'线性回归、代价函数与损失函数动画讲解',
      embed:'<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=464296500&bvid=BV1RL411T7mT&cid=444320268&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="线性回归损失函数"></iframe>'
    }
  ];

  function initNumberLine(){
    var canvas=document.getElementById('nlCanvas');
    if(!canvas||canvas._bound) return;
    canvas._bound=true;

    var readout={l1:document.getElementById('nlL1'),l2:document.getElementById('nlL2')};
    var prompt=document.getElementById('nlPrompt');
    var status=document.getElementById('nlStatus');
    var dragging=false,hoverPred=false,rafId=0;

    function updateReadout(){
      var diff=nlGT-nlPred;
      readout.l1.textContent=Math.abs(diff).toFixed(1);
      readout.l2.textContent=(diff*diff).toFixed(1);
      if(Math.abs(diff)<0.05&&!nlSolved){
        nlSolved=true;
        nlPred=nlGT;
        if(prompt) prompt.textContent='做到了：预测值贴近真实值，Loss 变成 0。';
        if(status){
          status.classList.remove('edu-notice-strip--orange');
          status.classList.add('edu-notice-strip--green');
          var label=status.querySelector('strong');
          if(label) label.textContent='阶段完成：';
        }
        revealCalculation();
      }
    }
    function draw(isDrag,time){
      if(window.lgDraw){
        window.lgDraw.numberLine(canvas,nlGT,nlPred,isDrag,{
          highlightPred:!nlCueDismissed&&!dragging&&!nlSolved,
          pulseTime:time||performance.now(),
          solved:nlSolved
        });
      }
      updateReadout();
    }
    function pulse(time){
      draw(false,time);
      if(!nlCueDismissed&&!dragging&&!nlSolved) rafId=requestAnimationFrame(pulse);
      else rafId=0;
    }
    function ensurePulse(){
      if(!rafId&&!nlCueDismissed&&!dragging&&!nlSolved) rafId=requestAnimationFrame(pulse);
    }

    draw(false);
    ensurePulse();

    window.DLPlot.bindDraggableNumberLine(canvas,{
      getValue:function(){return nlPred;},
      setValue:function(value){nlPred=Math.round(value*10)/10;},
      step:0.1,
      onDragStart:function(){
        nlCueDismissed=true;
        dragging=true;
        draw(true);
      },
      onHover:function(hover){
        hoverPred=hover;
        if(hoverPred) nlCueDismissed=true;
        draw(false);
        ensurePulse();
      },
      onDrag:function(){
        draw(true);
      },
      onDragEnd:function(){
        dragging=false;
        draw(false);
        ensurePulse();
      }
    });
  }

  function drawCalc(){
    var canvas=document.getElementById('calcCanvas');
    if(window.lgDraw&&canvas) window.lgDraw.calc(canvas,3,7,calcView);
  }

  function revealCalculation(){
    var calc=document.getElementById('s-calc');
    if(!calc||!calc.hidden) return;
    calc.hidden=false;
    calc.setAttribute('aria-hidden','false');
    calc.classList.add('is-revealing');
    calc.addEventListener('animationend',function(){
      calc.classList.remove('is-revealing');
    },{once:true});
    drawCalc();
    window.requestAnimationFrame(function(){
      calc.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

  function initCalcCanvas(){
    var canvas=document.getElementById('calcCanvas');
    if(!canvas||canvas._bound) return;
    canvas._bound=true;
    canvas.style.cursor='grab';
    drawCalc();

    window.DLPlot.bindPanZoom(canvas,calcView,{
      zoomMin:0.55,
      zoomMax:2.6,
      zoomInFactor:1.1,
      zoomOutFactor:0.9,
      onChange:drawCalc
    });
  }

  function initCalcForm(){
    if(!window.DLModuleUI||!window.DLModuleUI.mountQuestion) return;
    var calcMount=document.getElementById('calcQuestionMount');
    var compareMount=document.getElementById('compareQuestionMount');
    var compareBlock=document.getElementById('compareQuestionBlock');
    if(!calcMount||!compareMount||!compareBlock||calcMount._bound) return;
    calcMount._bound=true;
    var compareQuestion=null;

    function setButtonBusy(button,busy){
      if(!button) return;
      button.disabled=busy;
      button.classList.toggle('is-loading',busy);
      if(busy) button.setAttribute('aria-busy','true');
      else button.removeAttribute('aria-busy');
      button.textContent=busy?'正在分析':'提交回答';
    }

    async function reviewComparison(result){
      var answer=String(result.answer[0]||'').trim();
      if(result.empty||!answer||!compareQuestion) return;
      setButtonBusy(compareQuestion.submit,true);
      compareQuestion.streamFeedback('正在分析你的回答，请稍候。','hint');

      function finishReview(){
        setButtonBusy(compareQuestion.submit,false);
        revealGradientLesson();
      }

      try{
        var response=await fetch(LOSS_FEEDBACK_ENDPOINT,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({answer:answer})
        });
        var data=await response.json().catch(function(){return {};});
        var review=window.DLModuleUI.requireServiceResult(response,data);
        var feedback=window.DLModuleUI.shortAnswerFeedback(review,'请再比较一下绝对值惩罚和平方惩罚。');
        compareQuestion.streamFeedback(feedback.message,feedback.tone,{onComplete:finishReview});
      }catch(error){
        compareQuestion.streamFeedback(window.DLModuleUI.friendlyErrorMessage(error),'wrong',{onComplete:finishReview});
      }
    }

    function mountComparisonQuestion(){
      if(compareQuestion) return;
      compareQuestion=window.DLModuleUI.mountQuestion(compareMount,{
        type:'short',
        title:'L1 Loss 和 L2 Loss 的区别是什么？',
        rows:5,
        answerLabel:'用自己的话比较 L1 Loss 和 L2 Loss',
        submitText:'提交回答',
        onCheck:reviewComparison
      });
    }

    var calcQuestion=window.DLModuleUI.mountQuestion(calcMount,{
      type:'fill',
      title:'真实值为 3、预测值为 7：L1 Loss = {{blank:0}}，L2 Loss = {{blank:1}}。',
      blanks:[
        {label:'L1 Loss',placeholder:'L1',chars:5},
        {label:'L2 Loss',placeholder:'L2',chars:5}
      ],
      submitText:'检查计算',
      validator:function(answers){
        var l1=Number(String(answers[0]||'').trim());
        var l2=Number(String(answers[1]||'').trim());
        var l1Ok=Number.isFinite(l1)&&l1===4;
        var l2Ok=Number.isFinite(l2)&&l2===16;
        if(l1Ok&&l2Ok) return {ok:true};
        var hints=[];
        if(!l1Ok) hints.push('L1 看距离本身：|3-7|=4。');
        if(!l2Ok) hints.push('L2 把距离平方：(3-7)²=16。');
        return {ok:false,message:hints.join(' ')};
      },
      feedback:{
        empty:'先填写 L1 和 L2 的计算结果。',
        correct:'计算正确。L1=4，L2=16。现在继续解释两种损失为什么会得到不同的数值。'
      },
      onCheck:function(result,root){
        if(!result.ok) return;
        root.querySelectorAll('[data-role="question-answer"]').forEach(function(field){field.disabled=true;});
        if(calcQuestion.submit) calcQuestion.submit.disabled=true;
        mountComparisonQuestion();
        compareBlock.hidden=false;
        window.requestAnimationFrame(function(){
          compareBlock.scrollIntoView({behavior:'smooth',block:'center'});
          var answer=compareBlock.querySelector('[data-role="question-answer"]');
          if(answer) answer.focus({preventScroll:true});
        });
      }
    });
  }

  function revealResources(){
    var resources=document.getElementById('s-loss-resources');
    if(!resources||!resources.hidden) return;
    renderLossRelatedLinks();
    resources.hidden=false;
    resources.setAttribute('aria-hidden','false');
    window.requestAnimationFrame(function(){
      resources.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

  function revealGradientStep(element){
    if(!element||!element.hidden) return;
    element.hidden=false;
    element.setAttribute('aria-hidden','false');
    element.classList.add('is-revealing');
    window.requestAnimationFrame(function(){
      element.scrollIntoView({behavior:'smooth',block:'center'});
    });
    window.setTimeout(function(){element.classList.remove('is-revealing');},420);
  }

  function mountFinalGradientQuestion(){
    if(gradientQuestion||!window.DLModuleUI||!window.DLModuleUI.mountQuestion) return;
    gradientQuestion=window.DLModuleUI.mountQuestion('#gradientQuestionMount',{
      type:'judgement',
      title:'L1 的梯度只有方向信息，这是否意味着 L1 Loss 一定不如 L2 Loss？',
      options:[
        {key:'对',value:'true',label:'是，L2 永远更好'},
        {key:'错',value:'false',label:'不是，两者适合不同的误差假设'}
      ],
      answer:'false',
      feedback:{
        correct:'正确。例如房价数据中，一套 500 万元的房子被误录成 5000 万元：L2 会产生极大的梯度，让这一条异常样本主导模型更新；L1 的梯度仍限制在 -1 或 +1，不会被离群点无限放大。因此，含有异常值时 L1 反而可能更稳健。',
        wrong:'不一定。例如一套 500 万元的房子被误录成 5000 万元时，L2 的巨大梯度可能让这条异常数据主导训练；L1 的梯度仍是 -1 或 +1，对离群点更稳健。'
      },
      onCheck:function(result){
        if(result.ok) window.setTimeout(revealResources,520);
      }
    });
  }

  function mountL2GradientQuestion(){
    if(l2GradientQuestion||!window.DLModuleUI||!window.DLModuleUI.mountQuestion) return;
    l2GradientQuestion=window.DLModuleUI.mountQuestion('#l2GradientQuestionMount',{
      type:'judgement',
      title:'L2 Loss 的梯度包含误差大小信息。',
      options:[
        {key:'对',value:'true',label:'有，梯度绝对值会随误差变化'},
        {key:'错',value:'false',label:'没有，梯度绝对值始终固定'}
      ],
      answer:'true',
      feedback:{
        correct:'正确。L2 梯度为 2(ŷ-y)，正负表示方向，绝对值会随着误差增大或减小。',
        wrong:'再看公式 2(ŷ-y)：当误差从 4 变成 40，梯度绝对值也会从 8 变成 80。'
      },
      onCheck:function(result){
        if(!result.ok) return;
        var finalBlock=document.getElementById('finalGradientQuestionBlock');
        mountFinalGradientQuestion();
        revealGradientStep(finalBlock);
      }
    });
  }

  function mountL1GradientQuestion(){
    if(l1GradientQuestion||!window.DLModuleUI||!window.DLModuleUI.mountQuestion) return;
    l1GradientQuestion=window.DLModuleUI.mountQuestion('#l1GradientQuestionMount',{
      type:'judgement',
      title:'L1 Loss 的梯度包含误差大小信息。',
      options:[
        {key:'对',value:'true',label:'有，误差越大梯度绝对值越大'},
        {key:'错',value:'false',label:'没有，它只用正负号表示方向'}
      ],
      answer:'false',
      feedback:{
        correct:'正确。L1 梯度通常只有 -1 或 +1：它能指出修正方向，但不会告诉模型当前误差究竟有多大。',
        wrong:'再看 sign(ŷ-y)：误差是 4 或 40 时，结果都只是 +1，所以没有保留误差大小。'
      },
      onCheck:function(result){
        if(!result.ok) return;
        var l2Lesson=document.getElementById('l2GradientLesson');
        mountL2GradientQuestion();
        revealGradientStep(l2Lesson);
      }
    });
  }

  function revealGradientLesson(){
    var gradient=document.getElementById('s-loss-gradient');
    if(!gradient||!gradient.hidden) return;
    mountL1GradientQuestion();
    gradient.hidden=false;
    gradient.setAttribute('aria-hidden','false');
    gradient.classList.add('is-revealing');
    window.requestAnimationFrame(function(){
      gradient.scrollIntoView({behavior:'smooth',block:'start'});
    });
    window.setTimeout(function(){gradient.classList.remove('is-revealing');},420);
  }

  function renderLossRelatedLinks(){
    var host=document.getElementById('lossRelatedLinks');
    if(!host||!window.DLModuleUI||!window.DLModuleUI.renderRelatedVideos) return;
    host.innerHTML=window.DLModuleUI.renderRelatedVideos(recommendedVideos,{
      showHeader:false,
      ariaLabel:'损失函数相关视频'
    });
  }

  function redrawCanvases(){
    var numberLine=document.getElementById('nlCanvas');
    if(window.lgDraw&&numberLine) window.lgDraw.numberLine(numberLine,nlGT,nlPred,false,{solved:nlSolved});
    drawCalc();
  }

  function observeCanvases(){
    var canvases=[document.getElementById('nlCanvas'),document.getElementById('calcCanvas')].filter(Boolean);
    if(window.DLCanvas&&window.DLCanvas.observe) window.DLCanvas.observe(canvases,redrawCanvases);
    else window.addEventListener('resize',redrawCanvases);
  }

  initNumberLine();
  initCalcCanvas();
  initCalcForm();
  observeCanvases();
})();

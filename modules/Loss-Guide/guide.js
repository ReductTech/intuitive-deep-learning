(function () {
  'use strict';

  function drawNumberLine(canvas, gt, pred, isDragging, options) {
    options = options || {};
    window.DLPlot.drawNumberLine(canvas, {
      gt: gt,
      pred: pred,
      isDragging: isDragging,
      highlightPred: options.highlightPred,
      pulseTime: options.pulseTime,
      solved: options.solved,
      showDistance: false,
      colors: {
        blue: '#3b6fb6',
        orange: '#f07e47',
        red: '#c43f52',
        green: '#228d5c',
        axis: '#68778f',
        tick: '#9fb0c8',
        bg: '#fbfdff',
      },
    });
  }

  function drawCalcCanvas(canvas, gt, pred, view) {
    window.DLPlot.drawLossComparison(canvas, {
      gt: gt,
      pred: pred,
      view: view,
      colors: {
        blue: '#27446e',
        orange: '#f07e47',
        red: '#c43f52',
        green: '#228d5c',
        axis: '#68778f',
        tick: '#9fb0c8',
        bg: '#fbfdff',
      },
    });
  }

  window.lgDraw = {
    numberLine: drawNumberLine,
    calc: drawCalcCanvas,
  };
})();

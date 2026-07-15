(function () {
  'use strict';

  function pixelRatio(maxRatio) {
    return Math.min(window.devicePixelRatio || 1, maxRatio || 2);
  }

  function readLogicalSize(canvas, options) {
    options = options || {};
    var rect = canvas.getBoundingClientRect();
    var ratio = pixelRatio(options.maxRatio);
    var width = options.width || rect.width || canvas.clientWidth || Number(canvas.getAttribute('width')) || canvas.width / ratio || 1;
    var height = options.height || rect.height || canvas.clientHeight || Number(canvas.getAttribute('height')) || canvas.height / ratio || 1;

    return {
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
      ratio: ratio,
    };
  }

  function resize(canvas, options) {
    var size = readLogicalSize(canvas, options);
    if (
      canvas.logicalWidth === size.width &&
      canvas.logicalHeight === size.height &&
      canvas.pixelRatio === size.ratio
    ) {
      return false;
    }

    canvas.logicalWidth = size.width;
    canvas.logicalHeight = size.height;
    canvas.pixelRatio = size.ratio;
    canvas.width = Math.round(size.width * size.ratio);
    canvas.height = Math.round(size.height * size.ratio);
    return true;
  }

  function context(canvas, options) {
    var ctx = canvas.getContext('2d');
    var ratio = canvas.pixelRatio || pixelRatio(options && options.maxRatio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return ctx;
  }

  function prepare(canvas, options) {
    resize(canvas, options);
    return context(canvas, options);
  }

  function size(canvas) {
    var ratio = canvas.pixelRatio || pixelRatio();
    return {
      width: canvas.logicalWidth || canvas.clientWidth || Number(canvas.getAttribute('width')) || canvas.width / ratio || 1,
      height: canvas.logicalHeight || canvas.clientHeight || Number(canvas.getAttribute('height')) || canvas.height / ratio || 1,
    };
  }

  function clear(ctx, canvas, fill) {
    var logical = size(canvas);
    ctx.clearRect(0, 0, logical.width, logical.height);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, logical.width, logical.height);
    }
    return logical;
  }

  function pointer(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    var logical = size(canvas);
    var width = rect.width || logical.width;
    var height = rect.height || logical.height;
    return {
      x: (event.clientX - rect.left) * (logical.width / width),
      y: (event.clientY - rect.top) * (logical.height / height),
    };
  }

  function observe(targets, onResize, options) {
    options = options || {};
    var list = Array.isArray(targets) ? targets : [targets];
    var rafId = 0;
    var observer = null;

    function schedule() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(function () {
        rafId = 0;
        onResize();
      });
    }

    if (window.ResizeObserver) {
      observer = new ResizeObserver(schedule);
      list.forEach(function (item) {
        if (!item) return;
        observer.observe(options.observeSelf ? item : (item.parentElement || item));
      });
    }

    window.addEventListener('resize', schedule);

    return {
      disconnect: function () {
        if (observer) observer.disconnect();
        if (rafId) window.cancelAnimationFrame(rafId);
        window.removeEventListener('resize', schedule);
      },
    };
  }

  window.DLCanvas = {
    pixelRatio: pixelRatio,
    resize: resize,
    context: context,
    prepare: prepare,
    size: size,
    clear: clear,
    pointer: pointer,
    observe: observe,
  };
})();

(function (global) {
  'use strict';
  const game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};


  // systems/similarity
  {
  let renderer = game.disguise.renderer;
  let lifecycle = game.systems.lifecycle;

  function cancelSimilarityUpdate(state) {
    window.clearTimeout(state.similarityTimer);
    state.similarityTimer = null;
    state.similarityRequestId = (state.similarityRequestId || 0) + 1;
    if (state.similarityController) state.similarityController.abort();
    state.similarityController = null;
  }

  function scheduleSimilarityUpdate(scene, state, meter) {
    // Invalidate immediately, including the debounce window before the next request starts.
    cancelSimilarityUpdate(state);
    state.lastSimilarity = null;
    if (lifecycle.signal(scene).aborted) return;
    if (meter && meter.setPending) meter.setPending();
    state.similarityTimer = window.setTimeout(function () {
      state.similarityTimer = null;
      updateSimilarity(scene, state, meter);
    }, 180);
  }

  function courseCompute(payload, signal) {
    return new Promise(function (resolve, reject) {
      if (global.parent === global) { reject(new Error('请在术库学习页面中使用人脸比较。')); return; }
      if (signal.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return; }
      var bytes = crypto.getRandomValues(new Uint8Array(16));
      var id = Array.from(bytes, function (value) { return value.toString(16).padStart(2, '0'); }).join('');
      function cleanup() { global.removeEventListener('message', receive); signal.removeEventListener('abort', abort); }
      function abort() { cleanup(); reject(new DOMException('Cancelled', 'AbortError')); }
      function receive(event) {
        var data = event.data;
        if (event.source !== global.parent || !data || data.channel !== 'shuku-course-v1' || data.id !== id) return;
        cleanup();
        if (typeof data.status !== 'number' || data.status < 200 || data.status >= 300) {
          reject(new Error(data.body && data.body.error || '人脸比较请求失败')); return;
        }
        resolve(data.body);
      }
      global.addEventListener('message', receive); signal.addEventListener('abort', abort, { once: true });
      global.parent.postMessage({ channel: 'shuku-course-v1', id: id, action: 'compute',
        endpoint: '/face-recog/embedding-similarity', payload: payload }, '*');
    });
  }

  function compressedFace(scene, textureKey, marks) {
    var canvas = renderer.drawFaceCanvas(scene, textureKey, marks);
    var context = canvas.getContext('2d', { willReadFrequently: true });
    var pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < pixels.data.length; i += 4) {
      var gray = Math.round(0.299 * pixels.data[i] + 0.587 * pixels.data[i + 1] + 0.114 * pixels.data[i + 2]);
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = gray;
    }
    context.putImageData(pixels, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.30);
  }

  async function requestDisguiseSimilarity(scene, textureKey, marks, signal) {
    var controller = new AbortController();
    var sceneSignal = lifecycle.signal(scene);
    var abort = function () { controller.abort(); };
    sceneSignal.addEventListener('abort', abort, { once: true });
    if (signal) signal.addEventListener('abort', abort, { once: true });
    if (sceneSignal.aborted || (signal && signal.aborted)) abort();
    var timeout = window.setTimeout(abort, 60000);
    try {
      var data = await courseCompute({
        image: compressedFace(scene, textureKey, marks),
        encoding: 'gray-jpeg-q30-v1',
        reference_asset: global.VFL_GAME_REFERENCE_ASSET
      }, controller.signal);
      if (controller.signal.aborted) throw new DOMException('Similarity request cancelled', 'AbortError');
      if (!data || !data.ok) throw new Error(data && data.error || '人脸比较失败');
      var result = data.result || {};
      var value = result.correlation == null ? result.similarity : result.correlation;
      var correlation = Number(value);
      if (value == null || !Number.isFinite(correlation)) throw new Error('Embedding service returned an invalid similarity');
      return Object.assign({}, result, {
        correlation: Math.max(0, Math.min(1, correlation)),
        similarityPercent: Math.max(0, Math.min(1, correlation)) * 100
      });
    } finally {
      window.clearTimeout(timeout);
      sceneSignal.removeEventListener('abort', abort);
      if (signal) signal.removeEventListener('abort', abort);
    }
  }

  async function updateSimilarity(scene, state, meter) {
    cancelSimilarityUpdate(state);
    var requestId = state.similarityRequestId;
    var controller = new AbortController();
    state.similarityController = controller;
    try {
      var result = await requestDisguiseSimilarity(scene, renderer.disguiseTextureForState(state), state.markData, controller.signal);
      if (requestId !== state.similarityRequestId || lifecycle.signal(scene).aborted) return;
      state.lastSimilarity = result;
      if (meter && meter.setValue) meter.setValue(result.similarityPercent);
    } catch (error) {
      if (requestId !== state.similarityRequestId || lifecycle.signal(scene).aborted) return;
      state.lastSimilarity = null;
      if (meter && meter.setUnavailable) meter.setUnavailable();
      else if (meter && meter.reset) meter.reset();
    } finally {
      if (state.similarityController === controller) state.similarityController = null;
    }
  }

  game.systems.similarity = {
    compressedFace: compressedFace,
    cancelSimilarityUpdate: cancelSimilarityUpdate,
    scheduleSimilarityUpdate: scheduleSimilarityUpdate,
    requestDisguiseSimilarity: requestDisguiseSimilarity,
    updateSimilarity: updateSimilarity
  };
  }
}(window));

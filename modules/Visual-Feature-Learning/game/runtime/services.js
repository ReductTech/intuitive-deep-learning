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

  async function requestDisguiseSimilarity(scene, textureKey, marks, signal) {
    var controller = new AbortController();
    var sceneSignal = lifecycle.signal(scene);
    var abort = function () { controller.abort(); };
    sceneSignal.addEventListener('abort', abort, { once: true });
    if (signal) signal.addEventListener('abort', abort, { once: true });
    if (sceneSignal.aborted || (signal && signal.aborted)) abort();
    var timeout = window.setTimeout(abort, 15000);
    try {
      var response = await fetch(game.constants.EMBEDDING_SIMILARITY_URL, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          left: renderer.textureToFaceSample(scene, 'anchorFace', []),
          right: renderer.textureToFaceSample(scene, textureKey, marks)
        })
      });
      var data = await response.json();
      if (controller.signal.aborted) throw new DOMException('Similarity request cancelled', 'AbortError');
      if (!response.ok || !data.ok) throw new Error(data.error || 'embedding service failed');
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
    cancelSimilarityUpdate: cancelSimilarityUpdate,
    scheduleSimilarityUpdate: scheduleSimilarityUpdate,
    requestDisguiseSimilarity: requestDisguiseSimilarity,
    updateSimilarity: updateSimilarity
  };
  }
}(window));

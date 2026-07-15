(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  var EMBEDDING_SIMILARITY_URL = game.constants.EMBEDDING_SIMILARITY_URL;
  var renderer = game.disguise.renderer;
  var textureToFaceSample = renderer.textureToFaceSample;
  var disguiseTextureForState = renderer.disguiseTextureForState;

  function scheduleSimilarityUpdate(scene, state, meter) {
    if (state.similarityTimer) {
      window.clearTimeout(state.similarityTimer);
    }
    if (meter && meter.setPending) meter.setPending();
    state.similarityTimer = window.setTimeout(function () {
      updateSimilarity(scene, state, meter);
    }, 180);
  }

  async function requestDisguiseSimilarity(scene, textureKey, marks) {
    var response = await fetch(EMBEDDING_SIMILARITY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        left: textureToFaceSample(scene, 'anchorFace', []),
        right: textureToFaceSample(scene, textureKey, marks)
      })
    });
    var data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'embedding service failed');
    }
    var result = data.result || {};
    var correlationValue = Number(result.correlation);
    if (!Number.isFinite(correlationValue)) correlationValue = Number(result.similarity);
    if (Number.isFinite(correlationValue)) {
      result.correlation = Math.max(0, Math.min(1, correlationValue));
      result.similarityPercent = result.correlation * 100;
    }
    return result;
  }

  async function updateSimilarity(scene, state, meter) {
    state.similarityRequestId = (state.similarityRequestId || 0) + 1;
    var requestId = state.similarityRequestId;
    try {
      var result = await requestDisguiseSimilarity(scene, disguiseTextureForState(state), state.markData);
      if (requestId !== state.similarityRequestId) return;
      state.lastSimilarity = result;
      var correlationPercent = Number(result.similarityPercent);
      if (!Number.isFinite(correlationPercent)) correlationPercent = 90;
      if (meter && meter.setValue) meter.setValue(correlationPercent);
    } catch (error) {
      if (requestId !== state.similarityRequestId) return;
      if (meter && meter.setUnavailable) meter.setUnavailable();
      else if (meter && meter.reset) meter.reset();
    }
  }

  game.systems = game.systems || {};
  game.systems.similarity = {
    scheduleSimilarityUpdate: scheduleSimilarityUpdate,
    requestDisguiseSimilarity: requestDisguiseSimilarity,
    updateSimilarity: updateSimilarity
  };
}(window));

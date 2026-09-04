(function () {
  'use strict';

  var game = window.Act3DisguiseGame || {};
  var constants = game.constants || {};
  var ASSET_ROOT = constants.ASSET_ROOT || './game_assets/';
  var OVERLAY_ASSET = constants.OVERLAY_ASSET || 'overlay_layer.png';
  var stopStartLight = null;

  function $(id) {
    return document.getElementById(id);
  }

  function clearHost(host) {
    while (host.firstChild) host.removeChild(host.firstChild);
  }

  function renderFallback(host) {
    var layer = document.createElement('div');
    var map = document.createElement('img');
    var overlay = document.createElement('img');

    layer.className = 'face-act3-fallback-layer';
    map.className = 'face-act3-fallback-map';
    overlay.className = 'face-act3-fallback-overlay';

    map.src = ASSET_ROOT + 'map.png';
    map.alt = '';
    overlay.src = ASSET_ROOT + OVERLAY_ASSET;
    overlay.alt = '';

    layer.appendChild(map);
    layer.appendChild(overlay);
    host.appendChild(layer);
  }

  function createStartLightEffect() {
    var canvas = $('act3StartLight');
    var layer = $('act3GameStart');
    var video = $('act3StartVideo');
    if (!canvas || !layer || !canvas.getContext) return function () {};

    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
    }

    var context = canvas.getContext('2d');
    var frameId = 0;
    var width = 0;
    var height = 0;
    var active = false;
    var stopped = false;
    var targetX = 0.36;
    var targetY = 0.58;
    var currentX = targetX;
    var currentY = targetY;
    var targetIntensity = 0.48;
    var currentIntensity = targetIntensity;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var nextWidth = Math.round(rect.width);
      var nextHeight = Math.round(rect.height);
      if (!nextWidth || !nextHeight) return false;
      if (nextWidth === width && nextHeight === height) return true;

      var pixelRatio = Math.min(2, window.devicePixelRatio || 1);
      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      return true;
    }

    function drawLight(now) {
      context.globalCompositeOperation = 'source-over';
      context.clearRect(0, 0, width, height);

      var easing = reduceMotion ? 1 : 0.055;
      currentX += (targetX - currentX) * easing;
      currentY += (targetY - currentY) * easing;
      currentIntensity += (targetIntensity - currentIntensity) * easing;

      var pulse = reduceMotion ? 1 : 0.96 + Math.sin(now * 0.0011) * 0.04;
      var glowAlpha = 0.14 * currentIntensity * pulse;
      var glowRadius = Math.max(width, height) * 0.48;

      context.save();
      context.translate(currentX * width, currentY * height);
      context.scale(1.45, 0.72);
      var glow = context.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
      glow.addColorStop(0, 'rgba(255, 214, 147, ' + glowAlpha.toFixed(3) + ')');
      glow.addColorStop(0.36, 'rgba(232, 160, 87, ' + (glowAlpha * 0.55).toFixed(3) + ')');
      glow.addColorStop(1, 'rgba(171, 94, 43, 0)');
      context.fillStyle = glow;
      context.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);
      context.restore();

      var vignette = context.createRadialGradient(
        width * 0.52, height * 0.48, Math.min(width, height) * 0.2,
        width * 0.52, height * 0.48, Math.max(width, height) * 0.72
      );
      vignette.addColorStop(0, 'rgba(3, 7, 10, 0)');
      vignette.addColorStop(0.68, 'rgba(3, 7, 10, 0.025)');
      vignette.addColorStop(1, 'rgba(3, 7, 10, 0.24)');
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);
    }

    function render(now) {
      frameId = 0;
      if (stopped || !active || !resize()) return;
      drawLight(now || performance.now());
      if (!reduceMotion) frameId = window.requestAnimationFrame(render);
    }

    function requestRender() {
      if (!stopped && active && !frameId) frameId = window.requestAnimationFrame(render);
    }

    function onPointerMove(event) {
      var rect = layer.getBoundingClientRect();
      targetX = Math.max(0.08, Math.min(0.92, (event.clientX - rect.left) / rect.width));
      targetY = Math.max(0.12, Math.min(0.88, (event.clientY - rect.top) / rect.height));
      targetIntensity = 0.9;
      requestRender();
    }

    function onPointerLeave() {
      targetX = 0.36;
      targetY = 0.58;
      targetIntensity = 0.48;
      requestRender();
    }

    layer.addEventListener('pointermove', onPointerMove);
    layer.addEventListener('pointerleave', onPointerLeave);

    var resizeObserver = window.ResizeObserver ? new window.ResizeObserver(requestRender) : null;
    if (resizeObserver) resizeObserver.observe(layer);

    var intersectionObserver = window.IntersectionObserver ? new window.IntersectionObserver(function (entries) {
      active = !!(entries[0] && entries[0].isIntersecting);
      if (active) requestRender();
      else if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }) : null;
    if (intersectionObserver) intersectionObserver.observe(layer);
    else {
      active = true;
      requestRender();
    }

    return function stop() {
      stopped = true;
      if (frameId) window.cancelAnimationFrame(frameId);
      if (resizeObserver) resizeObserver.disconnect();
      if (intersectionObserver) intersectionObserver.disconnect();
      layer.removeEventListener('pointermove', onPointerMove);
      layer.removeEventListener('pointerleave', onPointerLeave);
    };
  }

  function initAct3Game() {
    var host = $('act3GameScene');
    var stage = $('faceAct3');
    if (!host || host.dataset.gameStarted === 'true') return false;
    if (stage && (stage.classList.contains('is-locked') || stage.getAttribute('aria-hidden') === 'true')) return false;

    host.dataset.gameStarted = 'true';
    host.style.backgroundColor = '#000';

    if (stopStartLight) {
      stopStartLight();
      stopStartLight = null;
    }

    clearHost(host);

    if (!window.Phaser || !game.scene || !game.scene.createPhaserScene) {
      renderFallback(host);
      return true;
    }

    game.scene.createPhaserScene(host);
    return true;
  }

  function fadeStartToBlack() {
    var fade = $('act3StartFade');
    if (!fade) return Promise.resolve();

    return new Promise(function (resolve) {
      var settled = false;
      var fallbackTimer;
      function finish(event) {
        if (event && event.propertyName !== 'opacity') return;
        if (settled) return;
        settled = true;
        window.clearTimeout(fallbackTimer);
        fade.removeEventListener('transitionend', finish);
        window.setTimeout(resolve, 140);
      }

      fade.addEventListener('transitionend', finish);
      fade.offsetWidth;
      fade.classList.add('is-visible');
      fallbackTimer = window.setTimeout(finish, 1400);
    });
  }

  function prepareAct3Game() {
    var startButton = $('act3GameStartBtn');
    if (!startButton) return;
    stopStartLight = createStartLightEffect();
    var starting = false;
    async function start() {
      if (starting) return;
      starting = true;
      startButton.disabled = true;
      await fadeStartToBlack();
      if (initAct3Game()) {
        startButton.removeEventListener('click', start);
        return;
      }
      starting = false;
      startButton.disabled = false;
      var fade = $('act3StartFade');
      if (fade) fade.classList.remove('is-visible');
    }
    startButton.addEventListener('click', start);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prepareAct3Game);
  } else {
    prepareAct3Game();
  }
}());

(function () {
  'use strict';

  var currentScript = document.currentScript;
  var baseUrl = currentScript && currentScript.src
    ? new URL('./', currentScript.src)
    : new URL('./', document.baseURI);
  var mathliveUrl = new URL('vendor/mathlive/mathlive.min.mjs', baseUrl).href;

  function markUnavailable() {
    document.documentElement.classList.add('dl-mathlive-unavailable');
    document.dispatchEvent(new CustomEvent('dl:mathlive-unavailable'));
  }

  import(mathliveUrl).then(function () {
    document.documentElement.classList.add('dl-mathlive-ready');
    document.dispatchEvent(new CustomEvent('dl:mathlive-ready'));
  }).catch(markUnavailable);
})();

(function () {
  'use strict';

  if (window.__DL_AUTH_GUARD__) return;

  var DEV_HOSTS = { localhost: true, '127.0.0.1': true, '[::1]': true, '0.0.0.0': true };
  var PENDING_PAGE_PATH = '/shared/auth-pending.html';
  var IPC_WAIT_MS = 5000;
  var IPC_POLL_MS = 50;
  var BRIDGE_RETRY_MS = 200;
  var BRIDGE_RETRY_MAX = 25;
  var BACKGROUND_RETRY_MS = 3000;

  var checking = false;
  var backgroundTimer = null;
  var pendingErrorNode = null;
  var pendingContinueButton = null;

  function getConfig() {
    return window.__DL_AUTH_CONFIG__ || {};
  }

  function isDevHost() {
    return Boolean(DEV_HOSTS[window.location.hostname]);
  }

  function shouldRequireAuth() {
    var cfg = getConfig();
    if (isDevHost() && !cfg.requireAuth) return false;
    return true;
  }

  function isPendingPage() {
    return window.location.pathname.endsWith('/auth-pending.html');
  }

  function isBridgeNotReadyError(result) {
    if (!result || result.ok !== false || typeof result.error !== 'string') return false;
    return result.error.indexOf('不同根域名') !== -1;
  }

  function isNotIframeError(result) {
    if (!result || result.ok !== false || typeof result.error !== 'string') return false;
    return result.error.indexOf('不在 GrowAgent iframe 内') !== -1;
  }

  function isAuthPassed(result) {
    return Boolean(result && result.ok === true && result.isLoggedIn && result.tokenValid);
  }

  function shouldRedirectToPending(result) {
    if (!result) return false;
    if (result.ok === true) {
      return !result.isLoggedIn || !result.tokenValid;
    }
    return isNotIframeError(result);
  }

  function describeBlockedResult(result) {
    if (!result) {
      return '登录态校验失败，请稍后重试。';
    }

    if (result.ok === false) {
      if (isNotIframeError(result)) {
        return '请在 GrowAgent 中打开本课程，并完成登录后再继续。';
      }
      return result.error || '登录态校验失败，请稍后重试。';
    }

    if (!result.isLoggedIn) {
      return '请先登录后再使用本课程。';
    }

    if (!result.tokenValid) {
      return result.errorMessage || '登录已失效，请重新登录后重试。';
    }

    return '登录态校验失败，请稍后重试。';
  }

  function getReturnUrl() {
    var params = new URLSearchParams(window.location.search);
    var value = params.get('return') || '/CourseMap/';
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
      return '/CourseMap/';
    }
    if (value.indexOf('auth-pending.html') !== -1) {
      return '/CourseMap/';
    }

    try {
      var resolved = new URL(value, window.location.origin);
      if (resolved.origin !== window.location.origin) {
        return '/CourseMap/';
      }
      return resolved.pathname + resolved.search + resolved.hash;
    }
    catch (_error) {
      return '/CourseMap/';
    }
  }

  function redirectToPending() {
    if (isPendingPage()) return;
    var returnUrl = window.location.pathname + window.location.search + window.location.hash;
    var target = PENDING_PAGE_PATH + '?return=' + encodeURIComponent(returnUrl);
    window.location.replace(target);
  }

  function redirectToReturn() {
    window.location.replace(getReturnUrl());
  }

  function ensurePendingNodes() {
    if (pendingContinueButton) return;
    pendingErrorNode = document.getElementById('dlAuthPendingError');
    pendingContinueButton = document.getElementById('dlAuthPendingContinue');
    if (pendingContinueButton) {
      pendingContinueButton.addEventListener('click', function () {
        void handlePendingContinue();
      });
    }
  }

  function showPendingError(result) {
    ensurePendingNodes();
    if (!pendingErrorNode) return;
    pendingErrorNode.textContent = describeBlockedResult(result);
    pendingErrorNode.hidden = false;
  }

  function clearPendingError() {
    ensurePendingNodes();
    if (!pendingErrorNode) return;
    pendingErrorNode.textContent = '';
    pendingErrorNode.hidden = true;
  }

  function setPendingBusy(busy) {
    ensurePendingNodes();
    if (!pendingContinueButton) return;
    pendingContinueButton.disabled = busy;
  }

  function grantAccess(details) {
    if (window.__DL_AUTH__ && window.__DL_AUTH__.ok) return;
    window.__DL_AUTH__ = Object.assign({ ok: true }, details || {});
    window.dispatchEvent(new CustomEvent('dl-auth-ready', { detail: window.__DL_AUTH__ }));
  }

  function handleAuthResult(result, options) {
    var opts = options || {};

    if (isAuthPassed(result)) {
      grantAccess({ result: result });
      return { ok: true, result: result };
    }

    window.__DL_AUTH__ = {
      ok: false,
      result: result || null
    };

    if (isPendingPage()) {
      if (opts.showError) showPendingError(result);
      return window.__DL_AUTH__;
    }

    if (shouldRedirectToPending(result)) {
      redirectToPending();
    }

    return window.__DL_AUTH__;
  }

  function waitForIpc(timeoutMs) {
    var deadline = Date.now() + timeoutMs;
    return new Promise(function (resolve) {
      function poll() {
        var ipc = window.__growAgentIpc;
        if (ipc && typeof ipc.checkAuthSession === 'function') {
          resolve(ipc);
          return;
        }
        if (Date.now() >= deadline) {
          resolve(null);
          return;
        }
        window.setTimeout(poll, IPC_POLL_MS);
      }
      poll();
    });
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function requestAuthSession(ipc) {
    return ipc.checkAuthSession().then(function (result) {
      if (isAuthPassed(result)) return result;

      var attempts = 0;
      function retryIfNeeded(current) {
        if (isAuthPassed(current) || !isBridgeNotReadyError(current) || attempts >= BRIDGE_RETRY_MAX) {
          return current;
        }
        attempts += 1;
        return sleep(BRIDGE_RETRY_MS).then(function () {
          return ipc.checkAuthSession();
        }).then(retryIfNeeded);
      }

      return retryIfNeeded(result);
    });
  }

  function runAuthCheck(options) {
    var opts = options || {};
    if (checking) return Promise.resolve(window.__DL_AUTH__);
    checking = true;

    if (opts.showError) {
      clearPendingError();
      setPendingBusy(true);
    }

    return waitForIpc(IPC_WAIT_MS).then(function (ipc) {
      if (!ipc) {
        return handleAuthResult({
          ok: false,
          error: 'GrowAgent 接口未就绪，请稍后重试。'
        }, opts);
      }

      return requestAuthSession(ipc).then(function (result) {
        return handleAuthResult(result, opts);
      });
    }).catch(function (error) {
      return handleAuthResult({
        ok: false,
        error: error && error.message ? error.message : '登录态校验失败，请稍后重试。'
      }, opts);
    }).finally(function () {
      checking = false;
      setPendingBusy(false);
    });
  }

  function clearBackgroundRetry() {
    if (backgroundTimer != null) {
      window.clearTimeout(backgroundTimer);
      backgroundTimer = null;
    }
  }

  function scheduleBackgroundAuthCheck(delayMs) {
    clearBackgroundRetry();
    backgroundTimer = window.setTimeout(function () {
      backgroundTimer = null;
      void runBackgroundAuthCheck();
    }, delayMs == null ? BACKGROUND_RETRY_MS : delayMs);
  }

  function runBackgroundAuthCheck() {
    if (!shouldRequireAuth() || isPendingPage()) return;
    if (window.__DL_AUTH__ && window.__DL_AUTH__.ok) return;

    void runAuthCheck({ showError: false }).then(function (auth) {
      if (auth && auth.ok) {
        clearBackgroundRetry();
        return;
      }

      var result = auth && auth.result;
      if (shouldRedirectToPending(result)) {
        clearBackgroundRetry();
        return;
      }

      scheduleBackgroundAuthCheck(isBridgeNotReadyError(result) ? BRIDGE_RETRY_MS : BACKGROUND_RETRY_MS);
    });
  }

  function handlePendingContinue() {
    return runAuthCheck({ showError: true }).then(function (auth) {
      if (auth && auth.ok) {
        redirectToReturn();
      }
    });
  }

  function startPendingPage() {
    ensurePendingNodes();
    void runAuthCheck({ showError: false }).then(function (auth) {
      if (auth && auth.ok) {
        redirectToReturn();
      }
    });
  }

  function startModulePage() {
    scheduleBackgroundAuthCheck(0);
  }

  function start() {
    if (!shouldRequireAuth()) {
      if (isPendingPage()) {
        redirectToReturn();
        return;
      }
      grantAccess({ skipped: true });
      return;
    }

    if (isPendingPage()) {
      startPendingPage();
      return;
    }

    startModulePage();
  }

  window.__DL_AUTH_GUARD__ = {
    recheck: function () {
      if (isPendingPage()) {
        return runAuthCheck({ showError: true });
      }
      clearBackgroundRetry();
      return runAuthCheck({ showError: false });
    },
    shouldRequireAuth: shouldRequireAuth,
    getReturnUrl: getReturnUrl
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

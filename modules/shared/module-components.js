(function () {
  'use strict';

  var modelViewerRequested = false;
  var moduleComponentsUrl = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : document.baseURI;
  var sharedAssetsBaseUrl = new URL('./', moduleComponentsUrl);
  var streamTextRuns = typeof WeakMap === 'function' ? new WeakMap() : null;
  var relatedVideosInstance = 0;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function ensureModelViewer(src) {
    if (window.customElements && window.customElements.get('model-viewer')) return;
    if (modelViewerRequested) return;
    modelViewerRequested = true;

    var script = document.createElement('script');
    script.type = 'module';
    script.src = src || new URL('vendor/model-viewer/3.5.0/model-viewer.min.js', sharedAssetsBaseUrl).href;
    script.addEventListener('error', function () {
      modelViewerRequested = false;
      document.dispatchEvent(new CustomEvent('dl:model-viewer-error', {
        detail: { src: script.src }
      }));
    }, { once: true });
    document.head.appendChild(script);
  }

  function createContinueCue(options) {
    var cue = document.createElement('button');
    cue.type = 'button';
    cue.className = options.className || 'dl-continue-cue';
    cue.innerHTML = [
      '<span class="dl-continue-arrow">↓</span>',
      '<strong>' + escapeHtml(options.title || '继续') + '</strong>',
      options.body ? '<em>' + escapeHtml(options.body) + '</em>' : ''
    ].join('');

    cue.addEventListener('click', function () {
      if (typeof options.onClick === 'function') options.onClick(cue);
    });

    if (options.parent) {
      options.parent.appendChild(cue);
      if (options.scroll !== false) {
        window.setTimeout(function () {
          cue.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, options.delay || 120);
      }
    }

    return cue;
  }

  function renderContinueCue(options) {
    return [
      '<button class="dl-continue-cue" type="button" ' + (options.attrs || '') + '>',
      '  <span class="dl-continue-arrow">↓</span>',
      '  <strong>' + escapeHtml(options.title || '继续') + '</strong>',
      options.body ? '  <em>' + escapeHtml(options.body) + '</em>' : '',
      '</button>'
    ].join('');
  }

  function resolveElement(target) {
    if (!target) return null;
    if (typeof target === 'string') return document.querySelector(target);
    return target;
  }

  function streamText(target, text, options) {
    options = options || {};
    var element = resolveElement(target);
    if (!element) return null;

    var previous = streamTextRuns && streamTextRuns.get(element);
    if (previous) previous.stop(false);

    var source = String(text == null ? element.textContent : text);
    var characters = Array.from(source);
    var interval = Math.max(12, Number(options.interval) || 28);
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var owner = element.closest ? element.closest('.edu-callout--stream') : null;
    var timer = 0;
    var index = 0;

    function finish(fillRemaining) {
      if (timer) window.clearTimeout(timer);
      timer = 0;
      if (fillRemaining !== false) element.textContent = source;
      if (owner) owner.classList.remove('is-streaming');
      if (streamTextRuns) streamTextRuns.delete(element);
      if (typeof options.onComplete === 'function' && fillRemaining !== false) options.onComplete(element);
    }

    function step() {
      index += 1;
      element.textContent = characters.slice(0, index).join('');
      if (index >= characters.length) {
        finish(true);
        return;
      }
      timer = window.setTimeout(step, interval);
    }

    var controller = {
      element: element,
      stop: finish,
      replay: function () { return streamText(element, source, options); }
    };
    if (streamTextRuns) streamTextRuns.set(element, controller);

    element.textContent = '';
    if (reduceMotion || options.animate === false) {
      finish(true);
    }
    else {
      if (owner) owner.classList.add('is-streaming');
      timer = window.setTimeout(step, interval);
    }
    return controller;
  }

  function startButtonHint(target, options) {
    options = options || {};
    var button = resolveElement(target);
    if (!button) return null;
    button.classList.add(options.className || 'dl-button-hint');
    if (options.focus) button.focus({ preventScroll: true });
    if (options.scroll) button.scrollIntoView({ behavior: 'smooth', block: 'center' });

    var timer = 0;
    if (options.duration) {
      timer = window.setTimeout(function () {
        stopButtonHint(button, options);
      }, options.duration);
    }

    return {
      stop: function () {
        if (timer) window.clearTimeout(timer);
        stopButtonHint(button, options);
      },
      element: button
    };
  }

  function stopButtonHint(target, options) {
    options = options || {};
    var button = resolveElement(target);
    if (!button) return;
    button.classList.remove(options.className || 'dl-button-hint');
  }

  function dismissButtonHint(target) {
    var button = resolveElement(target);
    if (!button) return false;
    button.removeAttribute('data-dl-button-hint');
    stopButtonHint(button);
    return true;
  }

  function dismissDeclarativeButtonHint(event) {
    var button = event.target && event.target.closest
      ? event.target.closest('[data-dl-button-hint]')
      : null;
    if (button) dismissButtonHint(button);
  }

  document.addEventListener('pointerover', dismissDeclarativeButtonHint);
  document.addEventListener('focusin', dismissDeclarativeButtonHint);
  document.addEventListener('click', dismissDeclarativeButtonHint);

  var explainTooltip = null;
  var activeExplainButton = null;
  var explainTooltipId = 'dlExplainTooltip';

  function ensureExplainTooltip() {
    if (explainTooltip && explainTooltip.isConnected) return explainTooltip;
    explainTooltip = document.createElement('div');
    explainTooltip.id = explainTooltipId;
    explainTooltip.className = 'dl-explain-tooltip';
    explainTooltip.setAttribute('role', 'tooltip');
    explainTooltip.setAttribute('popover', 'manual');
    explainTooltip.hidden = true;
    document.body.appendChild(explainTooltip);
    return explainTooltip;
  }

  function positionExplainTooltip(button, tooltip) {
    var gap = 12;
    var viewportPadding = 12;
    var buttonRect = button.getBoundingClientRect();
    var tooltipRect = tooltip.getBoundingClientRect();
    var placeAbove = buttonRect.top >= tooltipRect.height + gap + viewportPadding;
    var top = placeAbove
      ? buttonRect.top - tooltipRect.height - gap
      : buttonRect.bottom + gap;
    var idealLeft = buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2;
    var left = Math.max(viewportPadding, Math.min(idealLeft, window.innerWidth - tooltipRect.width - viewportPadding));
    var arrowX = Math.max(12, Math.min(buttonRect.left + buttonRect.width / 2 - left, tooltipRect.width - 12));

    tooltip.dataset.placement = placeAbove ? 'top' : 'bottom';
    tooltip.style.top = Math.round(top) + 'px';
    tooltip.style.left = Math.round(left) + 'px';
    tooltip.style.setProperty('--dl-explain-arrow-x', Math.round(arrowX) + 'px');
  }

  function showExplainTooltip(target) {
    var button = resolveElement(target);
    if (!button || !button.matches('[data-dl-explain]')) return null;
    var text = button.getAttribute('data-dl-explain');
    if (!text) return null;

    var tooltip = ensureExplainTooltip();
    if (activeExplainButton && activeExplainButton !== button) {
      activeExplainButton.setAttribute('aria-expanded', 'false');
      activeExplainButton.removeAttribute('aria-describedby');
    }
    activeExplainButton = button;
    tooltip.className = 'dl-explain-tooltip';
    tooltip.removeAttribute('data-tone');
    if (button.getAttribute('data-dl-explain-variant') === 'network') {
      var panelKicker = button.getAttribute('data-dl-explain-kicker') || '信号信息';
      var panelTitle = button.getAttribute('data-dl-explain-title') || '当前信号';
      var panelValue = button.getAttribute('data-dl-explain-value') || '';
      var panelValueLabel = button.getAttribute('data-dl-explain-value-label') || '当前数值';
      var panelDetail = button.getAttribute('data-dl-explain-detail') || text;
      var panelDetailLabel = button.getAttribute('data-dl-explain-detail-label') || '说明：';
      var panelTone = button.getAttribute('data-dl-explain-tone') || 'input';
      var panelFormula = button.getAttribute('data-dl-explain-formula') || '';
      var panelSubstitution = button.getAttribute('data-dl-explain-substitution') || '';
      var panelCalculation = button.getAttribute('data-dl-explain-calculation') || '';
      var panelHead = document.createElement('div');
      var panelKickerNode = document.createElement('span');
      var panelTitleNode = document.createElement('strong');
      var panelBody;
      var panelDetailNode = document.createElement('div');
      var panelDetailLead = document.createElement('strong');
      var panelDetailText = document.createElement('span');

      tooltip.classList.add('dl-explain-tooltip--network');
      tooltip.setAttribute('data-tone', panelTone);
      panelHead.className = 'dl-explain-tooltip__head';
      panelKickerNode.className = 'edu-badge dl-explain-tooltip__badge';
      panelKickerNode.textContent = panelKicker;
      panelTitleNode.className = 'dl-explain-tooltip__title';
      panelTitleNode.textContent = panelTitle;
      panelHead.appendChild(panelKickerNode);
      panelHead.appendChild(panelTitleNode);
      tooltip.replaceChildren(panelHead);

      if (panelFormula) {
        var formulaMain = document.createElement('span');
        var formulaSubstitution = document.createElement('span');
        var formulaCalculation = document.createElement('span');
        var formulaResult = document.createElement('output');
        panelBody = document.createElement('div');
        panelBody.className = 'edu-formula-block dl-explain-tooltip__formula-block';
        formulaMain.className = 'edu-formula dl-explain-tooltip__formula-main';
        formulaMain.textContent = panelFormula;
        panelBody.appendChild(formulaMain);
        if (panelSubstitution) {
          formulaSubstitution.className = 'dl-explain-tooltip__formula-step';
          formulaSubstitution.textContent = panelSubstitution;
          panelBody.appendChild(formulaSubstitution);
        }
        if (panelCalculation) {
          formulaCalculation.className = 'dl-explain-tooltip__formula-step';
          formulaCalculation.textContent = panelCalculation;
          panelBody.appendChild(formulaCalculation);
        }
        if (panelValue) {
          formulaResult.className = 'dl-explain-tooltip__formula-result';
          formulaResult.textContent = 'y = ' + panelValue;
          panelBody.appendChild(formulaResult);
        }
      } else {
        var valueLabelNode = document.createElement('span');
        var valueNumberNode = document.createElement('output');
        panelBody = document.createElement('div');
        panelBody.className = 'edu-value-tile ' +
          (panelTone === 'output' ? 'edu-value-tile--orange' : 'edu-value-tile--blue') +
          ' dl-explain-tooltip__value-tile';
        valueLabelNode.className = 'edu-value-label';
        valueLabelNode.textContent = panelValueLabel;
        valueNumberNode.className = 'edu-value-number';
        valueNumberNode.textContent = panelValue;
        panelBody.appendChild(valueLabelNode);
        panelBody.appendChild(valueNumberNode);
      }
      tooltip.appendChild(panelBody);

      if (panelDetail) {
        panelDetailNode.className = 'edu-notice-strip ' +
          (panelTone === 'output' ? 'edu-notice-strip--orange' : 'edu-notice-strip--blue') +
          ' dl-explain-tooltip__detail';
        panelDetailLead.textContent = panelDetailLabel;
        panelDetailText.textContent = panelDetail;
        panelDetailNode.appendChild(panelDetailLead);
        panelDetailNode.appendChild(panelDetailText);
        tooltip.appendChild(panelDetailNode);
      }
    } else {
      tooltip.textContent = text;
    }
    tooltip.hidden = false;
    if (typeof tooltip.showPopover === 'function' && !tooltip.matches(':popover-open')) tooltip.showPopover();
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-describedby', explainTooltipId);
    positionExplainTooltip(button, tooltip);
    return tooltip;
  }

  function hideExplainTooltip(target) {
    var button = target ? resolveElement(target) : activeExplainButton;
    if (button && activeExplainButton && button !== activeExplainButton) return false;
    var tooltip = explainTooltip;
    if (activeExplainButton) {
      activeExplainButton.setAttribute('aria-expanded', 'false');
      activeExplainButton.removeAttribute('aria-describedby');
    }
    activeExplainButton = null;
    if (!tooltip) return false;
    if (typeof tooltip.hidePopover === 'function' && tooltip.matches(':popover-open')) tooltip.hidePopover();
    tooltip.hidden = true;
    return true;
  }

  function explainButtonFromEvent(event) {
    return event.target && event.target.closest
      ? event.target.closest('[data-dl-explain]')
      : null;
  }

  document.addEventListener('pointerover', function (event) {
    var button = explainButtonFromEvent(event);
    if (event.pointerType !== 'touch' && button && (!event.relatedTarget || !button.contains(event.relatedTarget))) showExplainTooltip(button);
  });

  document.addEventListener('pointerout', function (event) {
    var button = explainButtonFromEvent(event);
    if (event.pointerType !== 'touch' && button && (!event.relatedTarget || !button.contains(event.relatedTarget))) hideExplainTooltip(button);
  });

  document.addEventListener('focusin', function (event) {
    var button = explainButtonFromEvent(event);
    if (button) showExplainTooltip(button);
  });

  document.addEventListener('focusout', function (event) {
    var button = explainButtonFromEvent(event);
    if (button) hideExplainTooltip(button);
  });

  document.addEventListener('click', function (event) {
    var button = explainButtonFromEvent(event);
    if (button) showExplainTooltip(button);
    else if (activeExplainButton) hideExplainTooltip();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && activeExplainButton) hideExplainTooltip();
  });

  window.addEventListener('resize', function () {
    if (activeExplainButton && explainTooltip) positionExplainTooltip(activeExplainButton, explainTooltip);
  });

  window.addEventListener('scroll', function () {
    if (activeExplainButton && explainTooltip) positionExplainTooltip(activeExplainButton, explainTooltip);
  }, true);

  function startInputHint(target, options) {
    options = options || {};
    var input = resolveElement(target);
    if (!input) return null;
    input.classList.add(options.className || 'dl-input-hint');
    if (options.focus) input.focus({ preventScroll: true });
    if (options.scroll) input.scrollIntoView({ behavior: 'smooth', block: 'center' });

    var timer = 0;
    if (options.duration) {
      timer = window.setTimeout(function () {
        stopInputHint(input, options);
      }, options.duration);
    }

    return {
      stop: function () {
        if (timer) window.clearTimeout(timer);
        stopInputHint(input, options);
      },
      dismiss: function () {
        if (timer) window.clearTimeout(timer);
        dismissInputHint(input);
      },
      element: input
    };
  }

  function stopInputHint(target, options) {
    options = options || {};
    var input = resolveElement(target);
    if (!input) return;
    input.classList.remove(options.className || 'dl-input-hint');
  }

  function dismissInputHint(target) {
    var input = resolveElement(target);
    if (!input) return false;
    input.removeAttribute('data-dl-input-hint');
    stopInputHint(input);
    return true;
  }

  function bindInputHint(target, options) {
    var input = resolveElement(target);
    if (!input) return null;
    input.setAttribute('data-dl-input-hint', '');
    return startInputHint(input, options);
  }

  function bindInputHints(target, options) {
    var root = resolveElement(target) || document;
    return Array.prototype.map.call(root.querySelectorAll('[data-dl-input-hint]'), function (input) {
      return bindInputHint(input, options);
    });
  }

  function dismissDeclarativeInputHint(event) {
    var input = event.target && event.target.closest
      ? event.target.closest('[data-dl-input-hint]')
      : null;
    if (input) dismissInputHint(input);
  }

  document.addEventListener('pointerover', dismissDeclarativeInputHint);
  document.addEventListener('focusin', dismissDeclarativeInputHint);
  document.addEventListener('click', dismissDeclarativeInputHint);
  document.addEventListener('input', dismissDeclarativeInputHint);

  function bindSelectbox(target) {
    var root = resolveElement(target);
    if (!root) return null;
    if (root.__dlSelectbox) return root.__dlSelectbox;

    var trigger = root.querySelector('.edu-selectbox-trigger');
    var valueNode = root.querySelector('[data-selectbox-value]');
    var menu = root.querySelector('.edu-selectbox-menu');
    var hiddenInput = root.querySelector('input[type="hidden"]');
    var options = Array.prototype.slice.call(root.querySelectorAll('.edu-selectbox-option'));
    if (!trigger || !valueNode || !menu || !options.length) return null;

    function selectedOption() {
      return options.find(function (option) {
        return option.getAttribute('aria-selected') === 'true';
      }) || options[0];
    }

    function setOpen(open, focusOption) {
      root.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.hidden = !open;
      if (open && focusOption !== false) {
        window.requestAnimationFrame(function () {
          selectedOption().focus();
        });
      }
    }

    function choose(option) {
      options.forEach(function (item) {
        item.setAttribute('aria-selected', item === option ? 'true' : 'false');
      });
      valueNode.textContent = option.textContent.trim();
      if (hiddenInput) {
        hiddenInput.value = option.getAttribute('data-value') || option.textContent.trim();
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      setOpen(false, false);
      trigger.focus();
      root.dispatchEvent(new CustomEvent('dl-select-change', {
        bubbles: true,
        detail: { value: hiddenInput ? hiddenInput.value : option.textContent.trim(), option: option }
      }));
    }

    function focusByOffset(current, offset) {
      var index = options.indexOf(current);
      var next = Math.max(0, Math.min(options.length - 1, index + offset));
      options[next].focus();
    }

    trigger.addEventListener('click', function () {
      setOpen(menu.hidden);
    });

    trigger.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setOpen(true);
      }
      else if (event.key === 'Escape') {
        setOpen(false, false);
      }
    });

    options.forEach(function (option) {
      option.addEventListener('click', function () {
        choose(option);
      });
      option.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          focusByOffset(option, 1);
        }
        else if (event.key === 'ArrowUp') {
          event.preventDefault();
          focusByOffset(option, -1);
        }
        else if (event.key === 'Home') {
          event.preventDefault();
          options[0].focus();
        }
        else if (event.key === 'End') {
          event.preventDefault();
          options[options.length - 1].focus();
        }
        else if (event.key === 'Escape') {
          event.preventDefault();
          setOpen(false, false);
          trigger.focus();
        }
      });
    });

    document.addEventListener('pointerdown', function (event) {
      if (!root.contains(event.target)) setOpen(false, false);
    });

    var api = {
      root: root,
      open: function () { setOpen(true); },
      close: function () { setOpen(false, false); },
      value: function () { return hiddenInput ? hiddenInput.value : selectedOption().textContent.trim(); },
      select: function (value) {
        var match = options.find(function (option) {
          return (option.getAttribute('data-value') || option.textContent.trim()) === String(value);
        });
        if (match) choose(match);
      }
    };
    root.__dlSelectbox = api;
    return api;
  }

  function bindSelectboxes(scope) {
    var root = scope || document;
    return Array.prototype.map.call(root.querySelectorAll('[data-dl-selectbox]'), bindSelectbox);
  }

  function findRangeOutput(range) {
    var control = range.closest ? range.closest('.edu-control') : null;
    var outputs = (control || document).getElementsByTagName('output');
    var rangeId = range.id;
    var fallback = null;

    for (var index = 0; index < outputs.length; index += 1) {
      var output = outputs[index];
      if (!fallback && output.classList.contains('edu-control-value')) fallback = output;
      if (rangeId && (output.getAttribute('for') || '').split(/\s+/).indexOf(rangeId) >= 0) return output;
    }
    return fallback;
  }

  function formatRangeValue(range) {
    var value = Number(range.value);
    var digitsAttribute = range.getAttribute('data-range-digits');
    var digits = digitsAttribute == null ? null : Math.max(0, Math.min(20, Number(digitsAttribute) || 0));
    var formatted = digits == null || !Number.isFinite(value) ? range.value : value.toFixed(digits);
    return (range.getAttribute('data-range-prefix') || '') + formatted + (range.getAttribute('data-range-suffix') || '');
  }

  function updateRange(target, reveal) {
    var range = resolveElement(target);
    if (!range || !range.matches('[data-dl-range]')) return null;

    var control = range.closest ? range.closest('.edu-control') : null;
    if (reveal) {
      range.classList.remove('is-unset');
      if (control) control.classList.remove('is-unset');
    }

    var isUnset = range.classList.contains('is-unset') || (control && control.classList.contains('is-unset'));
    var output = findRangeOutput(range);
    var formatted = isUnset ? '' : formatRangeValue(range);
    if (output) output.value = formatted;
    if (!isUnset) range.setAttribute('aria-valuetext', formatted);
    return { range: range, output: output, value: range.value, formattedValue: formatted, isUnset: Boolean(isUnset) };
  }

  function bindRange(target) {
    return updateRange(target, false);
  }

  function bindRanges(scope) {
    var root = scope || document;
    var ranges = [];
    if (root.matches && root.matches('[data-dl-range]')) ranges.push(root);
    if (root.querySelectorAll) {
      ranges = ranges.concat(Array.prototype.slice.call(root.querySelectorAll('[data-dl-range]')));
    }
    return ranges.map(bindRange);
  }

  document.addEventListener('input', function (event) {
    var range = event.target && event.target.closest ? event.target.closest('[data-dl-range]') : null;
    if (range) updateRange(range, true);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { bindRanges(document); }, { once: true });
  }
  else {
    bindRanges(document);
  }

  function setQueryParam(source, key, value) {
    var hashIndex = source.indexOf('#');
    var hash = hashIndex >= 0 ? source.slice(hashIndex) : '';
    var url = hashIndex >= 0 ? source.slice(0, hashIndex) : source;
    var pattern = new RegExp('([?&])' + key + '=[^&]*');
    if (pattern.test(url)) {
      return url.replace(pattern, '$1' + key + '=' + encodeURIComponent(value)) + hash;
    }
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + key + '=' + encodeURIComponent(value) + hash;
  }

  function prepareRelatedVideoEmbed(embedHtml, title) {
    if (!embedHtml) return '';
    var template = document.createElement('template');
    template.innerHTML = String(embedHtml).trim();
    var iframe = template.content.querySelector('iframe');
    if (!iframe) return embedHtml;

    var source = iframe.getAttribute('src') || '';
    if (/player\.bilibili\.com/i.test(source)) {
      source = setQueryParam(source, 'muted', '1');
      source = setQueryParam(source, 'volume', '0');
      iframe.setAttribute('src', source);
    }

    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('tabindex', '-1');
    iframe.setAttribute('aria-hidden', 'true');
    if (!iframe.getAttribute('title')) iframe.setAttribute('title', title || '推荐视频');

    return template.innerHTML;
  }

  function resetRelatedVideoStart(iframe) {
    if (!iframe) return;
    var source = iframe.getAttribute('src') || '';
    if (!/player\.bilibili\.com/i.test(source)) return;
    source = setQueryParam(source, 't', '0');
    source = setQueryParam(source, 'start_progress', '0');
    iframe.setAttribute('src', source);
  }

  function renderRelatedVideos(videos, options) {
    var list = (videos || []).filter(function (video) {
      return video && (video.embed || video.title);
    });
    if (!list.length) return '';

    options = options || {};
    var showHeader = options.showHeader !== false;
    var viewerId = 'dl-related-video-viewer-' + (++relatedVideosInstance);
    return [
      '<section class="dl-related-section">',
      showHeader ? '  <h3>' + escapeHtml(options.title || '相关推荐') + '</h3>' : '',
      showHeader && options.body ? '  <p>' + escapeHtml(options.body) + '</p>' : '',
      '  <div class="dl-video-strip" aria-label="' + escapeHtml(options.ariaLabel || '相关推荐横向列表') + '">',
      list.map(function (video, index) {
        var title = video.title || '待填写标题';
        var embedHtml = video.embed ? prepareRelatedVideoEmbed(video.embed, title) : '';
        return [
          '    <article class="dl-video-card">',
          embedHtml ? [
            '      <div class="dl-video-embed">' + embedHtml + '</div>',
            '      <button class="dl-video-trigger" type="button" data-dl-video-trigger data-video-index="' + index + '" aria-controls="' + viewerId + '" aria-expanded="false" aria-label="在页面中播放：' + escapeHtml(title) + '" title="在页面中放大播放">',
            '        <span class="dl-video-play" aria-hidden="true">&#9654;</span>',
            '      </button>'
          ].join('') : '      <div class="dl-video-placeholder">待填写 iframe</div>',
          '      <strong>' + escapeHtml(title) + '</strong>',
          '    </article>'
        ].join('');
      }).join(''),
      '  </div>',
      '  <div class="dl-video-viewer" id="' + viewerId + '" data-dl-video-viewer hidden>',
      '    <div class="dl-video-viewer-head">',
      '      <strong data-dl-video-viewer-title></strong>',
      '      <button class="dl-video-viewer-close" type="button" data-dl-video-close aria-label="关闭放大播放器" title="关闭">&times;</button>',
      '    </div>',
      '    <div class="dl-video-viewer-media" data-dl-video-viewer-media></div>',
      '  </div>',
      '</section>'
    ].join('');
  }

  document.addEventListener('click', function (event) {
    var closeButton = event.target && event.target.closest ? event.target.closest('[data-dl-video-close]') : null;
    if (closeButton) {
      var closingViewer = closeButton.closest('[data-dl-video-viewer]');
      var closingSection = closingViewer && closingViewer.closest('.dl-related-section');
      var activeTrigger = closingSection && closingSection.querySelector('[data-dl-video-trigger][aria-expanded="true"]');
      var closingMedia = closingViewer && closingViewer.querySelector('[data-dl-video-viewer-media]');
      if (closingMedia) closingMedia.innerHTML = '';
      if (closingViewer) closingViewer.hidden = true;
      if (activeTrigger) {
        activeTrigger.setAttribute('aria-expanded', 'false');
        activeTrigger.closest('.dl-video-card').classList.remove('is-active');
        activeTrigger.focus();
      }
      return;
    }

    var trigger = event.target && event.target.closest ? event.target.closest('[data-dl-video-trigger]') : null;
    if (!trigger) return;

    var section = trigger.closest('.dl-related-section');
    var card = trigger.closest('.dl-video-card');
    var sourceEmbed = card && card.querySelector('.dl-video-embed');
    var viewer = section && section.querySelector('[data-dl-video-viewer]');
    var viewerMedia = viewer && viewer.querySelector('[data-dl-video-viewer-media]');
    var viewerTitle = viewer && viewer.querySelector('[data-dl-video-viewer-title]');
    if (!sourceEmbed || !viewer || !viewerMedia) return;

    Array.prototype.forEach.call(section.querySelectorAll('[data-dl-video-trigger]'), function (item) {
      item.setAttribute('aria-expanded', item === trigger ? 'true' : 'false');
      item.closest('.dl-video-card').classList.toggle('is-active', item === trigger);
    });

    var playerContent = sourceEmbed.cloneNode(true);
    var player = playerContent.querySelector('iframe');
    if (player) {
      resetRelatedVideoStart(player);
      player.removeAttribute('aria-hidden');
      player.removeAttribute('tabindex');
    }
    viewerMedia.innerHTML = '';
    while (playerContent.firstChild) viewerMedia.appendChild(playerContent.firstChild);
    if (viewerTitle) viewerTitle.textContent = card.querySelector('strong').textContent;
    viewer.hidden = false;
    window.requestAnimationFrame(function () {
      viewer.scrollIntoView({
        behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'nearest'
      });
    });
  });

  function renderModelViewer(options) {
    options = options || {};
    return [
      '<section class="dl-model-section">',
      '  <div class="dl-model-viewer-wrap">',
      '    <model-viewer class="dl-model-viewer" src="' + escapeHtml(options.src || '') + '" camera-controls auto-rotate rotation-per-second="' + escapeHtml(options.rotation || '22deg') + '" shadow-intensity="' + escapeHtml(options.shadowIntensity || '0.7') + '" exposure="' + escapeHtml(options.exposure || '1.05') + '" camera-orbit="' + escapeHtml(options.cameraOrbit || '35deg 70deg 2.4m') + '" alt="' + escapeHtml(options.alt || '3D model') + '">',
      '      <div class="dl-model-fallback" slot="poster">' + escapeHtml(options.posterText || '正在加载 3D 模型...') + '</div>',
      '    </model-viewer>',
      '  </div>',
      '  <div class="dl-model-copy">',
      options.title ? '    <h3>' + escapeHtml(options.title) + '</h3>' : '',
      (options.paragraphs || []).map(function (paragraph) {
        return '    <p>' + escapeHtml(paragraph) + '</p>';
      }).join(''),
      options.emphasis ? '    <p class="dl-emphasis">' + escapeHtml(options.emphasis) + '</p>' : '',
      '  </div>',
      '</section>'
    ].join('');
  }

  function renderNetworkNode(node) {
    var compact = Boolean(node.compact);
    var tooltip = String(node.tooltip || '').trim();
    var explainAttributes = '';
    if (tooltip) {
      explainAttributes = ' data-dl-explain="' + escapeHtml(tooltip) + '" aria-label="' + escapeHtml(tooltip) + '" aria-expanded="false" tabindex="0"';
      if (compact || node.tooltipVariant === 'network') {
        explainAttributes += ' data-dl-explain-variant="network"' +
          ' data-dl-explain-tone="' + escapeHtml(node.tooltipTone || (node.kind === 'output' ? 'output' : 'input')) + '"' +
          ' data-dl-explain-kicker="' + escapeHtml(node.tooltipKicker || (node.kind === 'output' ? '输出 y' : '输入信号')) + '"' +
          ' data-dl-explain-title="' + escapeHtml(node.tooltipTitle || node.label || node.title || '') + '"' +
          ' data-dl-explain-value="' + escapeHtml(node.tooltipValue != null ? node.tooltipValue : node.value) + '"' +
          ' data-dl-explain-value-label="' + escapeHtml(node.tooltipValueLabel || '当前数值') + '"' +
          ' data-dl-explain-detail="' + escapeHtml(node.tooltipDetail || tooltip) + '"' +
          ' data-dl-explain-detail-label="' + escapeHtml(node.tooltipDetailLabel || '说明：') + '"' +
          ' data-dl-explain-formula="' + escapeHtml(node.tooltipFormula || '') + '"' +
          ' data-dl-explain-substitution="' + escapeHtml(node.tooltipSubstitution || '') + '"' +
          ' data-dl-explain-calculation="' + escapeHtml(node.tooltipCalculation || '') + '"';
      }
    }
    return [
      '<div class="dl-network-node dl-network-node--' + escapeHtml(node.kind || 'input') + (compact ? ' dl-network-node--compact' : '') + (tooltip ? ' dl-network-node--explainable' : '') + '" xmlns="http://www.w3.org/1999/xhtml"' + explainAttributes + '>',
      compact || node.hideTitle ? '' : '  <strong>' + escapeHtml(node.title || '') + '</strong>',
      compact ? '' : (node.label ? '  <span>' + escapeHtml(node.label) + '</span>' : ''),
      node.value != null ? '  <b>' + escapeHtml(node.value) + '</b>' : '',
      '</div>'
    ].join('');
  }

  function renderNetworkGraph(options) {
    options = options || {};
    var factors = options.factors || [];
    var inputYs = factors.map(function (_, index) {
      if (factors.length === 1) return 120;
      if (factors.length === 2) return 89 + index * 62;
      return 58 + index * 62;
    });
    var svgHeight = Math.max(190, 58 + Math.max(0, factors.length - 1) * 62 + 58);
    var viewBoxTop = Number.isFinite(Number(options.viewBoxTop)) ? Number(options.viewBoxTop) : 0;
    var viewBoxHeight = Number.isFinite(Number(options.viewBoxHeight)) ? Number(options.viewBoxHeight) : svgHeight;
    var markerId = options.markerId || 'dlArrowHead';

    return [
      '<section class="dl-network-svg-wrap" aria-label="' + escapeHtml(options.ariaLabel || '多个输入进入一个汇总单元') + '">',
      '<svg class="dl-network-svg" viewBox="0 ' + viewBoxTop + ' 720 ' + viewBoxHeight + '" role="img">',
      '<defs><marker id="' + escapeHtml(markerId) + '" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L7,3 L0,6 Z" fill="rgba(39,68,110,0.56)"></path></marker></defs>',
      factors.map(function (factor, index) {
        var y = inputYs[index] || 120;
        var weight = Number.isFinite(Number(factor.weight)) ? Number(factor.weight) : 1;
        var lineWidth = 1.8 + Math.max(0, Math.min(1, weight)) * 1.5;
        var externalInputLabel = options.externalLabelPosition === 'side'
          ? '<foreignObject x="0" y="' + (y - 20) + '" width="28" height="40"><div class="dl-network-external-label dl-network-external-label--input dl-network-external-label--side" xmlns="http://www.w3.org/1999/xhtml"><span>输入</span><b>x' + (index + 1) + '</b></div></foreignObject>'
          : '<foreignObject x="24" y="' + (y - 68) + '" width="78" height="26"><div class="dl-network-external-label dl-network-external-label--input" xmlns="http://www.w3.org/1999/xhtml">输入 x</div></foreignObject>';
        return [
          options.externalLabels ? externalInputLabel : '',
          '<line class="dl-network-line" x1="102" y1="' + y + '" x2="341" y2="120" stroke-width="' + lineWidth.toFixed(1) + '" marker-end="url(#' + escapeHtml(markerId) + ')"></line>',
          '<foreignObject x="28" y="' + (y - 34) + '" width="70" height="70">',
          renderNetworkNode({
            kind: 'input',
            title: options.inputTitle || '输入',
            label: factor.label,
            value: factor.value,
            hideTitle: options.externalLabels,
            compact: options.compactNodes,
            tooltip: factor.tooltip || ('输入 x' + (index + 1) + '：' + (factor.label || '输入信号') + '，当前数值 ' + factor.value),
            tooltipKicker: factor.tooltipKicker || ('输入 x' + (index + 1)),
            tooltipTitle: factor.tooltipTitle || factor.label || '输入信号',
            tooltipValue: factor.tooltipValue != null ? factor.tooltipValue : factor.value,
            tooltipValueLabel: factor.tooltipValueLabel,
            tooltipDetail: factor.tooltipDetail
          }),
          '</foreignObject>',
          '<foreignObject x="166" y="' + (y - 15) + '" width="96" height="30">',
          '  <em class="dl-network-weight" xmlns="http://www.w3.org/1999/xhtml">权重 <b>' + escapeHtml(factor.weightLabel || weight.toFixed(2)) + '</b></em>',
          '</foreignObject>'
        ].join('');
      }).join(''),
      '<line class="dl-network-line" x1="440" y1="120" x2="602" y2="120" stroke-width="3" marker-end="url(#' + escapeHtml(markerId) + ')"></line>',
      '<foreignObject x="344" y="72" width="96" height="96">',
      renderNetworkNode({
        kind: 'unit',
        title: options.unitTitle || '汇总单元',
        label: options.unitLabel || '汇总信号',
        tooltip: options.unitTooltip,
        tooltipVariant: options.unitTooltip ? 'network' : '',
        tooltipTone: 'unit',
        tooltipKicker: options.unitTooltipKicker || '计算过程',
        tooltipTitle: options.unitTooltipTitle || options.unitLabel || '加权求和',
        tooltipValue: options.unitTooltipValue,
        tooltipDetail: options.unitTooltipDetail,
        tooltipDetailLabel: options.unitTooltipDetailLabel || '计算说明：',
        tooltipFormula: options.unitTooltipFormula,
        tooltipSubstitution: options.unitTooltipSubstitution,
        tooltipCalculation: options.unitTooltipCalculation
      }),
      '</foreignObject>',
      options.externalLabels ? '<foreignObject x="610" y="52" width="78" height="26"><div class="dl-network-external-label dl-network-external-label--output" xmlns="http://www.w3.org/1999/xhtml">输出 y</div></foreignObject>' : '',
      '<foreignObject x="614" y="86" width="70" height="70">',
      renderNetworkNode({
        kind: 'output',
        title: options.outputTitle || '输出',
        label: options.outputLabel || '输出分数',
        value: options.outputValue,
        hideTitle: options.externalLabels,
        compact: options.compactNodes,
        tooltip: options.outputTooltip || ('输出 y：' + (options.outputLabel || '输出分数') + ' ' + options.outputValue),
        tooltipKicker: options.outputTooltipKicker || '输出 y',
        tooltipTitle: options.outputTooltipTitle || options.outputLabel || '输出分数',
        tooltipValue: options.outputTooltipValue != null ? options.outputTooltipValue : options.outputValue,
        tooltipValueLabel: options.outputTooltipValueLabel,
        tooltipDetail: options.outputTooltipDetail
      }),
      '</foreignObject>',
      '</svg>',
      '</section>'
    ].join('');
  }

  function questionTypeLabel(type, multiple) {
    if (type === 'choice') return multiple ? '多选题' : '单选题';
    if (type === 'judgement') return '判断题';
    if (type === 'fill') return '填空题';
    if (type === 'short') return '简答题';
    return '题目';
  }

  function normalizeAnswer(value) {
    return String(value == null ? '' : value).trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function answerArray(value) {
    if (Array.isArray(value)) return value.map(normalizeAnswer).filter(Boolean).sort();
    if (value == null) return [];
    return [normalizeAnswer(value)].filter(Boolean);
  }

  function sameAnswerSet(left, right) {
    var a = answerArray(left);
    var b = answerArray(right);
    if (a.length !== b.length) return false;
    return a.every(function (value, index) {
      return value === b[index];
    });
  }

  function sameOrderedAnswers(left, right) {
    var a = Array.isArray(left) ? left.map(normalizeAnswer) : [normalizeAnswer(left)];
    var b = Array.isArray(right) ? right.map(normalizeAnswer) : [normalizeAnswer(right)];
    if (a.length !== b.length) return false;
    return a.every(function (value, index) {
      return value === b[index];
    });
  }

  function optionValue(option, index) {
    return option.value != null ? option.value : (option.key != null ? option.key : String(index));
  }

  function renderQuestionOptions(options) {
    var list = options.options || [];
    var inline = options.inlineOptions || options.type === 'judgement';
    return [
      '<div class="dl-question-options' + (inline ? ' dl-question-options--inline' : '') + '" role="' + (options.multiple ? 'group' : 'radiogroup') + '">',
      list.map(function (option, index) {
        var key = option.key || String.fromCharCode(65 + index);
        return [
          '<button class="dl-question-option" type="button" data-index="' + index + '" aria-pressed="false">',
          '  <span class="dl-option-key">' + escapeHtml(key) + '</span>',
          '  <span class="dl-option-body">' + escapeHtml(option.label || option.text || option.value || key) + '</span>',
          '</button>'
        ].join('');
      }).join(''),
      '</div>'
    ].join('');
  }

  function renderQuestionFields(options) {
    if (options.type === 'short') {
      return [
        '<div class="dl-question-fields">',
        '  <label class="dl-question-field">',
        '    <textarea data-role="question-answer" rows="' + escapeHtml(options.rows || 5) + '" aria-label="' + escapeHtml(options.answerLabel || '简答题回答') + '"></textarea>',
        '  </label>',
        '</div>'
      ].join('');
    }

    var blanks = options.blanks && options.blanks.length ? options.blanks : [{ label: options.answerLabel || '答案', placeholder: options.placeholder || '填写答案' }];
    return [
      '<div class="dl-question-fields">',
      blanks.map(function (blank, index) {
        return [
          '  <label class="dl-question-field">',
          '    <span>' + escapeHtml(blank.label || ('空 ' + (index + 1))) + '</span>',
          '    <input data-role="question-answer" data-index="' + index + '" type="text" autocomplete="off" placeholder="' + escapeHtml(blank.placeholder || '填写答案') + '">',
          '  </label>'
        ].join('');
      }).join(''),
      '</div>'
    ].join('');
  }

  function renderInlineBlank(blank, index) {
    blank = blank || {};
    var chars = Number(blank.chars || blank.size || 8);
    chars = Math.max(4, Math.min(22, Number.isFinite(chars) ? chars : 8));
    return [
      '<input class="dl-inline-blank" data-role="question-answer" data-index="' + index + '"',
      ' type="text" autocomplete="off"',
      ' aria-label="' + escapeHtml(blank.label || ('空 ' + (index + 1))) + '"',
      ' placeholder="' + escapeHtml(blank.placeholder || '') + '"',
      ' style="--dl-blank-width:' + chars + 'ch">',
    ].join('');
  }

  function renderFillText(text, options, state) {
    var source = String(text == null ? '' : text);
    var blanks = options.blanks && options.blanks.length ? options.blanks : [];
    var pattern = /\{\{blank(?::(\d+))?\}\}|_{3,}/g;
    var cursor = 0;
    var html = '';
    var match;

    while ((match = pattern.exec(source))) {
      var explicitIndex = match[1] != null ? parseInt(match[1], 10) : null;
      var blankIndex = Number.isFinite(explicitIndex) ? explicitIndex : state.nextIndex;
      state.nextIndex = Math.max(state.nextIndex, blankIndex + 1);
      state.inlineCount = Math.max(state.inlineCount, blankIndex + 1);
      html += escapeHtml(source.slice(cursor, match.index));
      html += renderInlineBlank(blanks[blankIndex], blankIndex);
      cursor = match.index + match[0].length;
    }

    html += escapeHtml(source.slice(cursor));
    return html;
  }

  function renderQuestionStem(options, type) {
    var state = { nextIndex: 0, inlineCount: 0 };
    if (type !== 'fill') {
      return {
        title: escapeHtml(options.title || '题目'),
        inlineCount: 0
      };
    }

    return {
      title: renderFillText(options.title || '题目', options, state),
      inlineCount: state.inlineCount
    };
  }

  function renderQuestion(options) {
    options = options || {};
    var type = options.type || 'choice';
    var multiple = !!options.multiple || type === 'multiple';
    if (type === 'multiple') type = 'choice';
    var instant = options.instant != null
      ? !!options.instant
      : (!multiple && (type === 'choice' || type === 'judgement'));
    var stem = renderQuestionStem(options, type);
    var body = type === 'choice' || type === 'judgement'
      ? renderQuestionOptions(Object.assign({}, options, { type: type, multiple: multiple }))
      : (type === 'fill' && stem.inlineCount ? '' : renderQuestionFields(Object.assign({}, options, { type: type })));

    return [
      '<section class="dl-question dl-question--' + escapeHtml(type) + (multiple ? ' dl-question--multiple' : '') + '" data-question-type="' + escapeHtml(type) + '" data-submit-mode="' + (instant ? 'instant' : 'manual') + '">',
      '  <header class="dl-question-head">',
      '    <span class="dl-question-type">' + escapeHtml(options.typeLabel || questionTypeLabel(type, multiple)) + '</span>',
      '    <div class="dl-question-title-row">',
      '      <strong class="dl-question-stem">' + stem.title + '</strong>',
      instant ? '' : '      <button class="edu-btn edu-btn--primary dl-question-submit" type="button">' + escapeHtml(options.submitText || '检查答案') + '</button>',
      '    </div>',
      '  </header>',
      body,
      '  <div class="edu-callout dl-question-feedback" data-stream-output aria-live="polite" hidden></div>',
      '</section>'
    ].join('');
  }

  function collectQuestionAnswer(root, options) {
    var type = options.type || 'choice';
    if (type === 'multiple') type = 'choice';

    if (type === 'choice' || type === 'judgement') {
      var selected = Array.prototype.slice.call(root.querySelectorAll('.dl-question-option.is-selected'));
      return selected.map(function (button) {
        var index = parseInt(button.getAttribute('data-index'), 10);
        return optionValue((options.options || [])[index] || {}, index);
      });
    }

    var fields = Array.prototype.slice.call(root.querySelectorAll('[data-role="question-answer"]'));
    return fields.map(function (field) {
      return field.value;
    });
  }

  function questionFeedbackClassName(tone, streaming) {
    var color = tone === 'correct' ? 'green' : (tone === 'wrong' ? 'red' : 'orange');
    return [
      'edu-callout',
      'edu-callout--' + color,
      streaming ? 'edu-callout--stream' : '',
      'dl-question-feedback',
      tone ? 'is-' + tone : '',
      streaming ? 'is-streaming' : ''
    ].filter(Boolean).join(' ');
  }

  function setQuestionFeedback(root, tone, text) {
    var feedback = root.querySelector('.dl-question-feedback');
    if (!feedback) return;
    var activeStream = streamTextRuns && streamTextRuns.get(feedback);
    if (activeStream) activeStream.stop(false);
    feedback.className = questionFeedbackClassName(tone, false);
    feedback.setAttribute('aria-busy', 'false');
    feedback.textContent = text || '';
    feedback.hidden = !text;
  }

  function streamQuestionFeedback(target, tone, text, options) {
    options = options || {};
    var root = resolveElement(target);
    if (!root) return null;
    var feedback = root.classList && root.classList.contains('dl-question-feedback')
      ? root
      : root.querySelector('.dl-question-feedback');
    if (!feedback) return null;

    feedback.className = questionFeedbackClassName(tone, true);
    feedback.setAttribute('aria-busy', 'true');
    feedback.hidden = false;
    feedback.textContent = String(text || '');
    return streamText(feedback, text, {
      interval: options.interval || 24,
      animate: options.animate,
      onComplete: function () {
        feedback.classList.remove('is-streaming');
        feedback.setAttribute('aria-busy', 'false');
        if (typeof options.onComplete === 'function') options.onComplete(feedback);
      }
    });
  }

  function resetQuestion(root) {
    root.querySelectorAll('.dl-question-option').forEach(function (button) {
      button.classList.remove('is-selected', 'is-correct', 'is-wrong');
      button.setAttribute('aria-pressed', 'false');
    });
    root.querySelectorAll('[data-role="question-answer"]').forEach(function (field) {
      field.value = '';
    });
    setQuestionFeedback(root, '', '');
  }

  function markQuestionOptions(root, options, answer, correct) {
    var expected = answerArray(options.answer);
    var multiple = !!options.multiple;
    root.querySelectorAll('.dl-question-option').forEach(function (button) {
      var index = parseInt(button.getAttribute('data-index'), 10);
      var value = normalizeAnswer(optionValue((options.options || [])[index] || {}, index));
      var selected = button.classList.contains('is-selected');
      button.classList.toggle('is-correct', multiple ? expected.indexOf(value) >= 0 : (selected && expected.indexOf(value) >= 0));
      button.classList.toggle('is-wrong', selected && !correct);
    });
  }

  function checkQuestion(root, options) {
    var answer = collectQuestionAnswer(root, options);
    var type = options.type || 'choice';
    if (type === 'multiple') type = 'choice';
    var empty = answer.every(function (value) {
      return !normalizeAnswer(value);
    });

    if (empty) {
      setQuestionFeedback(root, 'hint', (options.feedback && options.feedback.empty) || '先完成作答，再检查答案。');
      return { ok: false, empty: true, answer: answer };
    }

    var result;
    if (typeof options.validator === 'function') {
      result = options.validator(answer, root);
    }
    else if (type === 'short') {
      result = { ok: true, tone: 'hint' };
    }
    else if (type === 'fill') {
      result = { ok: sameOrderedAnswers(answer, options.answer) };
    }
    else {
      result = { ok: sameAnswerSet(answer, options.answer) };
    }

    if (typeof result === 'boolean') result = { ok: result };
    result = result || {};
    var correct = result.ok === true;
    var feedback = options.feedback || {};
    var text = result.message
      || (correct ? feedback.correct : feedback.wrong)
      || (type === 'short' ? (feedback.sample || '已记录回答，可以对照参考答案继续完善。') : (correct ? '回答正确。' : '再检查一下。'));

    if (type === 'choice' || type === 'judgement') markQuestionOptions(root, options, answer, correct);
    var tone = result.tone || (correct ? 'correct' : 'wrong');
    if (type === 'short') {
      streamQuestionFeedback(root, tone, text, { interval: options.feedbackStreamInterval });
    }
    else {
      setQuestionFeedback(root, tone, text);
    }
    return { ok: correct, empty: false, answer: answer, result: result };
  }

  function mountQuestion(target, options) {
    var root = resolveElement(target);
    if (!root) return null;
    options = options || {};
    var type = options.type || 'choice';
    var multiple = !!options.multiple || type === 'multiple';
    if (type === 'multiple') type = 'choice';
    var instant = options.instant != null
      ? !!options.instant
      : (!multiple && (type === 'choice' || type === 'judgement'));
    options = Object.assign({}, options, { type: type, multiple: multiple, instant: instant });
    root.innerHTML = renderQuestion(options);
    var question = root.querySelector('.dl-question');

    question.querySelectorAll('.dl-question-option').forEach(function (button) {
      button.addEventListener('click', function () {
        if (!multiple) {
          question.querySelectorAll('.dl-question-option').forEach(function (item) {
            item.classList.remove('is-selected', 'is-correct', 'is-wrong');
            item.setAttribute('aria-pressed', 'false');
          });
        }
        if (multiple) button.classList.toggle('is-selected');
        else button.classList.add('is-selected');
        button.classList.remove('is-correct', 'is-wrong');
        button.setAttribute('aria-pressed', button.classList.contains('is-selected') ? 'true' : 'false');
        setQuestionFeedback(question, '', '');
        if (instant) {
          var result = checkQuestion(question, options);
          if (typeof options.onCheck === 'function') options.onCheck(result, question);
        }
      });
    });

    question.querySelectorAll('[data-role="question-answer"]').forEach(function (field) {
      field.addEventListener('input', function () {
        setQuestionFeedback(question, '', '');
      });
    });

    var submit = question.querySelector('.dl-question-submit');
    if (submit) {
      submit.addEventListener('click', function () {
        stopButtonHint(submit);
        var result = checkQuestion(question, options);
        if (typeof options.onCheck === 'function') options.onCheck(result, question);
      });
    }
    if (options.hintButton && submit) startButtonHint(submit);

    return {
      root: question,
      submit: submit,
      reset: null,
      check: function () { return checkQuestion(question, options); },
      resetQuestion: function () { return resetQuestion(question); },
      streamFeedback: function (text, tone, streamOptions) {
        return streamQuestionFeedback(question, tone || 'hint', text, streamOptions);
      },
      startHint: function (hintOptions) { return startButtonHint(submit, hintOptions); },
      stopHint: function () { return stopButtonHint(submit); }
    };
  }

  var serviceErrorMessages = {
    MODEL_RESPONSE_FORMAT_ERROR: '分析结果格式异常，请重新提交。',
    INVALID_JSON: '分析服务返回了无法识别的数据，请稍后再试。',
    INVALID_REQUEST_BODY: '提交内容格式不正确，请刷新页面后重试。',
    INVALID_REQUEST: '提交内容不完整，请检查后重试。',
    REQUEST_BODY_TOO_LARGE: '提交内容过长，请精简后重试。',
    AI_CONFIGURATION_ERROR: '分析服务尚未配置完成，请联系管理员。',
    AI_QUOTA_EXHAUSTED: '分析服务额度已用完，请联系管理员后再试。',
    AI_RATE_LIMITED: '提交过于频繁，请稍后再试。',
    AI_AUTHENTICATION_FAILED: '分析服务认证失败，请联系管理员。',
    AI_REQUEST_TIMEOUT: '分析超时，请稍后再试。',
    AI_NETWORK_ERROR: '暂时无法连接分析服务，请稍后再试。',
    AI_INVALID_RESPONSE: '分析服务返回了异常结果，请稍后再试。',
    AI_EMPTY_RESPONSE: '分析服务没有返回内容，请稍后再试。',
    AI_SERVICE_UNAVAILABLE: '分析服务暂时不可用，请稍后再试。',
    INTERNAL_ERROR: '分析过程出现异常，请稍后再试。',
    NOT_FOUND: '当前分析功能暂不可用，请联系管理员。'
  };

  function serviceErrorMessage(payload, fallback) {
    payload = payload && typeof payload === 'object' ? payload : {};
    var warning = payload.warning && typeof payload.warning === 'object' ? payload.warning : {};
    var code = String(payload.errorCode || warning.code || '').trim();
    return serviceErrorMessages[code]
      || fallback
      || '分析服务暂时不可用，请稍后再试。';
  }

  function createServiceError(payload, fallback) {
    payload = payload && typeof payload === 'object' ? payload : {};
    var warning = payload.warning && typeof payload.warning === 'object' ? payload.warning : {};
    var error = new Error(serviceErrorMessage(payload, fallback));
    error.code = String(payload.errorCode || warning.code || 'SERVICE_UNAVAILABLE');
    error.retryable = payload.retryable !== false;
    error.userFacing = true;
    return error;
  }

  function createUserFacingError(message, code) {
    var error = new Error(String(message || '分析过程未能完成，请稍后再试。'));
    error.code = String(code || 'USER_FACING_ERROR');
    error.userFacing = true;
    return error;
  }

  function friendlyErrorMessage(error, fallback) {
    if (error && error.userFacing && error.message) return String(error.message);
    if (error && error.code && serviceErrorMessages[error.code]) {
      return serviceErrorMessages[error.code];
    }
    return fallback || '暂时无法连接分析服务，请稍后再试。';
  }

  function requireServiceResult(response, payload, options) {
    options = options || {};
    payload = payload && typeof payload === 'object' ? payload : {};
    if (!response || !response.ok || payload.ok !== true) {
      if (response && response.ok && !Object.keys(payload).length) {
        throw createServiceError({ errorCode: 'AI_INVALID_RESPONSE' });
      }
      throw createServiceError(payload, options.unavailableMessage);
    }
    if (payload.structured === false) {
      throw createServiceError(
        { warning: payload.warning || { code: 'MODEL_RESPONSE_FORMAT_ERROR' } },
        '分析结果格式异常，请重新提交。'
      );
    }
    if (!payload.result || typeof payload.result !== 'object') {
      throw createServiceError(
        { errorCode: 'AI_INVALID_RESPONSE' },
        options.invalidMessage || '分析服务返回了异常结果，请稍后再试。'
      );
    }
    return payload.result;
  }

  function shortAnswerFeedback(result, fallbackExplanation) {
    result = result && typeof result === 'object' ? result : {};
    var verdict = String(result.verdict || '').trim();
    var level = String(result.level || '').trim().toLowerCase();
    if (!level) {
      if (verdict === '正确') level = 'correct';
      else if (verdict === '接近正确') level = 'close';
      else if (verdict === '错误') level = 'incorrect';
      else level = result.is_correct === true ? 'correct' : 'incorrect';
    }
    if (level !== 'correct' && level !== 'close') level = 'incorrect';
    var defaultVerdict = level === 'correct' ? '正确' : (level === 'close' ? '接近正确' : '错误');
    var explanation = String(result.explanation || fallbackExplanation || '').trim();
    return {
      level: level,
      tone: level === 'correct' ? 'correct' : (level === 'close' ? 'hint' : 'wrong'),
      color: level === 'correct' ? 'green' : (level === 'close' ? 'orange' : 'red'),
      verdict: verdict || defaultVerdict,
      message: (verdict || defaultVerdict) + (explanation ? '：' + explanation : '')
    };
  }

  window.DLModuleUI = {
    escapeHtml: escapeHtml,
    ensureModelViewer: ensureModelViewer,
    createContinueCue: createContinueCue,
    renderContinueCue: renderContinueCue,
    streamText: streamText,
    startButtonHint: startButtonHint,
    stopButtonHint: stopButtonHint,
    dismissButtonHint: dismissButtonHint,
    showExplainTooltip: showExplainTooltip,
    hideExplainTooltip: hideExplainTooltip,
    startInputHint: startInputHint,
    stopInputHint: stopInputHint,
    dismissInputHint: dismissInputHint,
    bindInputHint: bindInputHint,
    bindInputHints: bindInputHints,
    bindSelectbox: bindSelectbox,
    bindSelectboxes: bindSelectboxes,
    bindRange: bindRange,
    bindRanges: bindRanges,
    updateRange: updateRange,
    renderRelatedVideos: renderRelatedVideos,
    renderModelViewer: renderModelViewer,
    renderNetworkGraph: renderNetworkGraph,
    renderQuestion: renderQuestion,
    mountQuestion: mountQuestion,
    streamQuestionFeedback: streamQuestionFeedback,
    serviceErrorMessage: serviceErrorMessage,
    createServiceError: createServiceError,
    createUserFacingError: createUserFacingError,
    friendlyErrorMessage: friendlyErrorMessage,
    requireServiceResult: requireServiceResult,
    shortAnswerFeedback: shortAnswerFeedback,
    checkQuestion: checkQuestion,
    resetQuestion: resetQuestion
  };
})();

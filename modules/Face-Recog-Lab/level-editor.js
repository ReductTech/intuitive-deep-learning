(function () {
  'use strict';

  var STORAGE_KEY = 'face-recog-cutscene-level-editor-v1';
  var SOURCE_CONFIG_URL = './game/assets/disguise-config.js';
  var PROJECT_START = '/* LEVEL_EDITOR_PROJECT_START';
  var PROJECT_END = 'LEVEL_EDITOR_PROJECT_END */';
  var MAX_HISTORY = 80;
  var DIRECTIONS = ['down', 'left', 'right', 'up'];
  var TOOL_LABELS = { select: '选择', path: '添加路径点', pan: '平移' };

  var game = window.Act3DisguiseGame || {};
  var gameAssets = game.assets || {};
  var sourceRuntimePoints = gameAssets.CUTSCENE_POINTS || {};
  var sourceText = '';
  var sourceProject = null;
  var toastTimer = 0;
  var frameRequest = 0;

  var dom = {};
  var resources = {
    ready: false,
    map: null,
    overlay: null,
    collisionCanvas: null,
    navGrid: null,
    pathCache: {},
    actors: {}
  };

  var state = {
    project: null,
    sceneId: null,
    actorId: null,
    pointSelection: null,
    tool: 'select',
    showGrid: false,
    snap: true,
    showOverlay: false,
    showCollision: false,
    showLabels: true,
    dirty: false,
    zoom: 1,
    panX: 0,
    panY: 0,
    view: null,
    pointer: null,
    spacePressed: false,
    previewProgress: 0,
    playing: false,
    playbackRate: 1,
    playbackStartedAt: 0,
    playbackStartProgress: 0,
    history: [],
    historyIndex: -1
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function rounded(value) {
    var next = Math.round(number(value, 0) * 10) / 10;
    return Number.isInteger(next) ? String(next) : String(next);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function safeId(value) {
    var base = String(value || 'point').replace(/[^A-Za-z0-9_$-]+/g, '-').replace(/^-+|-+$/g, '');
    return base || 'point';
  }

  function pointLabelMap() {
    return {
      playerSpawn: '林墨初始点',
      civilSpawn: '晚宁初始点',
      doorGuest: '门口会合',
      clothesRack: '衣架前',
      dresserPlayer: '梳妆台·林墨',
      dresserPartner: '梳妆台·晚宁',
      inspectionPlayer: '排查位·林墨',
      inspectionCivil: '排查位·晚宁',
      officerEntry: '军官入口',
      soldierLeftEntry: '日军 A 入口',
      soldierCenterEntry: '日军 B 入口',
      soldierRightEntry: '日军 C 入口',
      soldierCenterInspect: '日军 B 排查点',
      officerInspect: '军官排查点',
      soldierLeftInspect: '日军 A 排查点',
      soldierRightInspect: '日军 C 排查点',
      officerExit: '军官退场',
      soldierLeftExit: '日军 A 退场',
      soldierCenterExit: '日军 B 退场',
      soldierRightExit: '日军 C 退场'
    };
  }

  function makeActor(id, label, actorKey, color) {
    var config = (gameAssets.ACTORS || {})[actorKey] || {};
    return {
      id: id,
      label: label,
      actorKey: actorKey,
      asset: 'game_assets/' + (config.asset || ''),
      bounds: 'game_assets/' + (config.bounds || ''),
      color: color
    };
  }

  function createDefaultProject(runtimePoints) {
    var labels = pointLabelMap();
    var points = {};
    var runtimePointOrder = [];

    Object.keys(runtimePoints || {}).forEach(function (pointId) {
      if (pointId === 'dresserPartnerOffset') return;
      runtimePointOrder.push(pointId);
      points[pointId] = {
        label: labels[pointId] || pointId,
        x: number(runtimePoints[pointId].x, 0),
        y: number(runtimePoints[pointId].y, 0),
        runtime: true
      };
    });

    var dresser = points.dresserPlayer || { x: 419, y: 415 };
    var partnerOffset = runtimePoints.dresserPartnerOffset || { x: 92, y: 6 };
    points.dresserPartner = {
      label: labels.dresserPartner,
      x: dresser.x + number(partnerOffset.x, 92),
      y: dresser.y + number(partnerOffset.y, 6),
      runtime: true,
      virtual: true
    };

    var actorLibrary = {
      player: makeActor('player', '林墨', 'balujun', '#42d7b1'),
      civil1: makeActor('civil1', '晚宁', 'civil1', '#f4bd54'),
      jpOfficer: makeActor('jpOfficer', '日本军官', 'jpOfficier', '#ff6f68'),
      jpSoldierA: makeActor('jpSoldierA', '日军 A', 'jpSoldier', '#ff9d4d'),
      jpSoldierB: makeActor('jpSoldierB', '日军 B', 'jpSoldier', '#e77452'),
      jpSoldierC: makeActor('jpSoldierC', '日军 C', 'jpSoldier', '#e94d5d'),
      trader: makeActor('trader', '商人', 'trader', '#65b8c2'),
      teacher: makeActor('teacher', '教师', 'teacher', '#9c8bf5')
    };

    function track(actorId, start, waypoints, speed, facing, loop) {
      return {
        actorId: actorId,
        start: start,
        waypoints: (waypoints || []).map(function (pointId) {
          return { point: pointId, speed: speed, wait: 0 };
        }),
        speed: speed,
        facing: facing,
        loop: Boolean(loop),
        visible: true
      };
    }

    return {
      version: 1,
      updatedAt: '',
      world: {
        width: 1448,
        height: 1086,
        map: 'game_assets/map.png',
        overlay: 'game_assets/overlay_layer.png',
        gridSize: 16
      },
      runtimePointOrder: runtimePointOrder,
      actorLibrary: actorLibrary,
      points: points,
      scenes: [
        {
          id: 'opening-spawn',
          label: '01 · 初始站位',
          cue: '敲门前',
          tracks: [
            track('player', 'playerSpawn', [], 260, 'up'),
            track('civil1', 'civilSpawn', [], 250, 'right')
          ]
        },
        {
          id: 'guest-approach',
          label: '02 · 门口会合',
          cue: '听到敲门',
          tracks: [
            track('player', 'playerSpawn', [], 260, 'up'),
            track('civil1', 'civilSpawn', ['doorGuest'], 250, 'down')
          ]
        },
        {
          id: 'clothes-rack',
          label: '03 · 取衣服',
          cue: '进屋对话后',
          tracks: [
            track('player', 'playerSpawn', [], 260, 'up'),
            track('civil1', 'doorGuest', ['clothesRack'], 250, 'right')
          ]
        },
        {
          id: 'dresser-rendezvous',
          label: '04 · 梳妆台会合',
          cue: '玩家进入触发区',
          tracks: [
            track('player', '@current', ['dresserPlayer'], 260, 'left'),
            track('civil1', 'clothesRack', ['dresserPartner'], 320, 'right')
          ]
        },
        {
          id: 'inspection-lineup',
          label: '05 · 伪装后站位',
          cue: '完成伪装',
          tracks: [
            track('player', 'dresserPlayer', ['inspectionPlayer'], 260, 'down'),
            track('civil1', 'dresserPartner', ['inspectionCivil'], 260, 'down')
          ]
        },
        {
          id: 'inspection-entry',
          label: '06 · 搜查队进场',
          cue: '两人站定后',
          tracks: [
            track('player', 'inspectionPlayer', [], 260, 'down'),
            track('civil1', 'inspectionCivil', [], 260, 'down'),
            track('jpOfficer', 'officerEntry', ['officerInspect'], 230, 'up'),
            track('jpSoldierA', 'soldierLeftEntry', ['soldierLeftInspect'], 230, 'up'),
            track('jpSoldierB', 'soldierCenterEntry', ['soldierCenterInspect'], 230, 'up'),
            track('jpSoldierC', 'soldierRightEntry', ['soldierRightInspect'], 230, 'up')
          ]
        },
        {
          id: 'inspection-exit',
          label: '07 · 搜查队退场',
          cue: '伪装通过',
          tracks: [
            track('player', 'inspectionPlayer', [], 260, 'down'),
            track('civil1', 'inspectionCivil', [], 260, 'down'),
            track('jpOfficer', 'officerInspect', ['officerExit'], 250, 'down'),
            track('jpSoldierA', 'soldierLeftInspect', ['soldierLeftExit'], 250, 'down'),
            track('jpSoldierB', '@current', ['soldierCenterExit'], 250, 'down'),
            track('jpSoldierC', 'soldierRightInspect', ['soldierRightExit'], 250, 'down')
          ]
        }
      ]
    };
  }

  function validProject(project) {
    return Boolean(
      project &&
      project.world &&
      project.points &&
      project.actorLibrary &&
      Array.isArray(project.scenes)
    );
  }

  function normalizeProject(project) {
    project.version = 1;
    project.updatedAt = new Date().toISOString();
    project.world.width = number(project.world.width, 1448);
    project.world.height = number(project.world.height, 1086);
    project.world.gridSize = Math.max(1, number(project.world.gridSize, 16));
    project.scenes.forEach(function (scene, sceneIndex) {
      scene.id = scene.id || 'scene-' + (sceneIndex + 1);
      scene.label = scene.label || '未命名剧情段';
      scene.cue = scene.cue || '';
      scene.tracks = Array.isArray(scene.tracks) ? scene.tracks : [];
      scene.tracks.forEach(function (track) {
        track.speed = Math.max(20, number(track.speed, 260));
        track.facing = DIRECTIONS.indexOf(track.facing) >= 0 ? track.facing : 'down';
        track.visible = track.visible !== false;
        track.loop = Boolean(track.loop);
        track.waypoints = Array.isArray(track.waypoints) ? track.waypoints : [];
        track.waypoints.forEach(function (waypoint) {
          waypoint.speed = Math.max(20, number(waypoint.speed, track.speed));
          waypoint.wait = Math.max(0, number(waypoint.wait, 0));
        });
      });
    });
    return project;
  }

  function getScene() {
    if (!state.project) return null;
    return state.project.scenes.find(function (scene) { return scene.id === state.sceneId; }) || null;
  }

  function getTrack() {
    var scene = getScene();
    if (!scene) return null;
    return scene.tracks.find(function (track) { return track.actorId === state.actorId; }) || null;
  }

  function getActor(actorId) {
    return state.project && state.project.actorLibrary[actorId] || null;
  }

  function getPoint(pointId) {
    return state.project && state.project.points[pointId] || null;
  }

  function getSelectedPointInfo() {
    var track = getTrack();
    if (!track || !state.pointSelection) return null;
    if (state.pointSelection.type === 'start') {
      if (!track.start || track.start === '@current') return null;
      return {
        type: 'start',
        index: -1,
        pointId: track.start,
        point: getPoint(track.start),
        waypoint: null
      };
    }
    var index = state.pointSelection.index;
    var waypoint = track.waypoints[index];
    if (!waypoint) return null;
    return {
      type: 'waypoint',
      index: index,
      pointId: waypoint.point,
      point: getPoint(waypoint.point),
      waypoint: waypoint
    };
  }

  function ensureSelection() {
    var scenes = state.project.scenes;
    if (!getScene()) state.sceneId = scenes.length ? scenes[0].id : null;
    var scene = getScene();
    if (!scene) {
      state.actorId = null;
      state.pointSelection = null;
      return;
    }
    if (!scene.tracks.some(function (track) { return track.actorId === state.actorId; })) {
      state.actorId = scene.tracks.length ? scene.tracks[0].actorId : null;
    }
    var track = getTrack();
    if (!track) {
      state.pointSelection = null;
      return;
    }
    if (!state.pointSelection) {
      state.pointSelection = track.start === '@current' && track.waypoints.length
        ? { type: 'waypoint', index: 0 }
        : { type: 'start', index: -1 };
    }
    if (state.pointSelection.type === 'waypoint' && !track.waypoints[state.pointSelection.index]) {
      state.pointSelection = track.start === '@current'
        ? (track.waypoints.length ? { type: 'waypoint', index: 0 } : null)
        : { type: 'start', index: -1 };
    }
  }

  function snapshot() {
    return JSON.stringify(state.project);
  }

  function setProject(project, options) {
    options = options || {};
    state.project = normalizeProject(clone(project));
    state.sceneId = state.project.scenes.length ? state.project.scenes[0].id : null;
    state.actorId = null;
    state.pointSelection = null;
    state.previewProgress = 0;
    state.playing = false;
    ensureSelection();
    state.history = [snapshot()];
    state.historyIndex = 0;
    state.dirty = Boolean(options.dirty);
    if (options.fit !== false) fitCanvas();
    renderAll();
    if (options.persist !== false) persistDraft();
  }

  function pushHistory() {
    var next = snapshot();
    if (state.history[state.historyIndex] === next) return;
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(next);
    if (state.history.length > MAX_HISTORY) state.history.shift();
    state.historyIndex = state.history.length - 1;
    state.dirty = true;
    persistDraft();
    updateHistoryButtons();
    updateSaveState();
  }

  function commit(mutator) {
    mutator();
    normalizeProject(state.project);
    ensureSelection();
    pushHistory();
    renderAll();
  }

  function undo() {
    if (state.historyIndex <= 0) return;
    state.historyIndex -= 1;
    state.project = JSON.parse(state.history[state.historyIndex]);
    state.dirty = true;
    ensureSelection();
    persistDraft();
    renderAll();
  }

  function redo() {
    if (state.historyIndex >= state.history.length - 1) return;
    state.historyIndex += 1;
    state.project = JSON.parse(state.history[state.historyIndex]);
    state.dirty = true;
    ensureSelection();
    persistDraft();
    renderAll();
  }

  function persistDraft() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        updatedAt: new Date().toISOString(),
        project: state.project
      }));
    } catch (error) {
      console.warn('Unable to persist level editor draft', error);
    }
  }

  function readDraft() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var draft = raw ? JSON.parse(raw) : null;
      return draft && validProject(draft.project) ? draft : null;
    } catch (error) {
      return null;
    }
  }

  function showToast(message, isError) {
    clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.classList.toggle('is-error', Boolean(isError));
    dom.toast.classList.add('is-visible');
    toastTimer = window.setTimeout(function () {
      dom.toast.classList.remove('is-visible');
    }, 2600);
  }

  function updateSaveState() {
    if (!state.project) return;
    dom.saveState.textContent = state.dirty ? '未保存 · 本地草稿已更新' : '已与配置文件同步';
  }

  function updateHistoryButtons() {
    dom.undoButton.disabled = state.historyIndex <= 0;
    dom.redoButton.disabled = state.historyIndex >= state.history.length - 1;
  }

  function selectScene(sceneId) {
    stopPlayback(false);
    state.sceneId = sceneId;
    state.actorId = null;
    state.pointSelection = null;
    state.previewProgress = 0;
    ensureSelection();
    renderAll();
  }

  function selectTrack(actorId) {
    stopPlayback(false);
    state.actorId = actorId;
    var track = getTrack();
    state.pointSelection = track && track.start !== '@current'
      ? { type: 'start', index: -1 }
      : (track && track.waypoints.length ? { type: 'waypoint', index: 0 } : null);
    state.previewProgress = 0;
    renderAll();
  }

  function selectPoint(type, index, focus) {
    state.pointSelection = { type: type, index: index };
    renderAll();
    if (focus) focusSelectedPoint();
  }

  function renderSceneList() {
    var scenes = state.project.scenes;
    dom.sceneCount.textContent = scenes.length;
    dom.sceneList.innerHTML = scenes.map(function (scene, index) {
      var waypointCount = scene.tracks.reduce(function (sum, track) {
        return sum + track.waypoints.length;
      }, 0);
      return '<button class="le-scene-row' + (scene.id === state.sceneId ? ' is-selected' : '') + '" type="button" data-scene-id="' + escapeHtml(scene.id) + '">' +
        '<span class="le-scene-index">' + String(index + 1).padStart(2, '0') + '</span>' +
        '<span class="le-scene-copy"><strong>' + escapeHtml(scene.label) + '</strong><span>' + escapeHtml(scene.cue || '无触发备注') + ' · ' + scene.tracks.length + '角色/' + waypointCount + '点</span></span>' +
        '</button>';
    }).join('');
    dom.projectPointCount.textContent = Object.keys(state.project.points).length + ' 个坐标点';
  }

  function renderTracks() {
    var scene = getScene();
    var tracks = scene ? scene.tracks : [];
    dom.trackCount.textContent = tracks.length;
    dom.trackList.innerHTML = tracks.map(function (track) {
      var actor = getActor(track.actorId) || { label: track.actorId, color: '#999999' };
      var count = (track.start === '@current' ? 0 : 1) + track.waypoints.length;
      return '<button class="le-track-row' + (track.actorId === state.actorId ? ' is-selected' : '') + '" type="button" data-actor-id="' + escapeHtml(track.actorId) + '">' +
        '<span class="le-track-color" style="background:' + escapeHtml(actor.color) + '"></span>' +
        '<strong>' + escapeHtml(actor.label) + '</strong>' +
        '<span>' + count + ' P' + (track.loop ? ' ∞' : '') + '</span>' +
        '</button>';
    }).join('');

    var used = {};
    tracks.forEach(function (track) { used[track.actorId] = true; });
    var available = Object.keys(state.project.actorLibrary).filter(function (actorId) { return !used[actorId]; });
    dom.actorLibrarySelect.innerHTML = available.length
      ? available.map(function (actorId) {
        return '<option value="' + escapeHtml(actorId) + '">' + escapeHtml(state.project.actorLibrary[actorId].label) + '</option>';
      }).join('')
      : '<option value="">无可添加角色</option>';
    dom.addTrackButton.disabled = !available.length;
  }

  function renderInspector() {
    var scene = getScene();
    var track = getTrack();
    var actor = track ? getActor(track.actorId) : null;
    var pointInfo = getSelectedPointInfo();

    dom.sceneLabelInput.value = scene ? scene.label : '';
    dom.sceneCueInput.value = scene ? scene.cue : '';
    dom.moveSceneUpButton.disabled = !scene || state.project.scenes.indexOf(scene) <= 0;
    dom.moveSceneDownButton.disabled = !scene || state.project.scenes.indexOf(scene) >= state.project.scenes.length - 1;
    dom.deleteSceneButton.disabled = state.project.scenes.length <= 1;

    dom.trackInspectorSection.hidden = !track;
    dom.pointInspectorSection.hidden = !pointInfo;
    if (track) {
      dom.selectedActorName.textContent = actor ? actor.label : track.actorId;
      dom.trackSpeedInput.value = track.speed;
      dom.trackFacingSelect.value = track.facing;
      dom.trackVisibleInput.checked = track.visible !== false;
      dom.trackLoopInput.checked = Boolean(track.loop);
    }

    if (pointInfo && pointInfo.point) {
      dom.selectionKind.textContent = pointInfo.type === 'start' ? '起始点' : '路径点';
      dom.selectedPointRole.textContent = pointInfo.type === 'start' ? '角色起始点' : '路径点 ' + (pointInfo.index + 1);
      dom.pointIdInput.value = pointInfo.pointId;
      dom.pointLabelInput.value = pointInfo.point.label || pointInfo.pointId;
      dom.pointXInput.value = rounded(pointInfo.point.x);
      dom.pointYInput.value = rounded(pointInfo.point.y);
      dom.pointSpeedInput.value = pointInfo.waypoint ? pointInfo.waypoint.speed : track.speed;
      dom.pointWaitInput.value = pointInfo.waypoint ? pointInfo.waypoint.wait : 0;
      document.querySelectorAll('.le-waypoint-only').forEach(function (element) {
        element.hidden = pointInfo.type !== 'waypoint';
      });
      dom.deletePointButton.disabled = pointInfo.type !== 'waypoint';
      dom.movePointUpButton.disabled = pointInfo.type !== 'waypoint' || pointInfo.index <= 0;
      dom.movePointDownButton.disabled = pointInfo.type !== 'waypoint' || pointInfo.index >= track.waypoints.length - 1;
    } else {
      dom.selectionKind.textContent = track && track.start === '@current' ? '继承当前位置' : (track ? '角色轨道' : '剧情段');
    }

    dom.addWaypointButton.disabled = !track;
    dom.deleteTrackButton.disabled = !track;
    dom.stageSceneName.textContent = scene ? scene.label : '无剧情段';
    dom.stageSceneCue.textContent = scene ? scene.cue : '';
  }

  function trackNodes(track) {
    var nodes = [];
    var startPoint = runtimeInheritedStart(track);
    if (startPoint) {
      nodes.push({ type: 'start', index: -1, pointId: track.start, point: startPoint });
    }
    track.waypoints.forEach(function (waypoint, index) {
      var point = getPoint(waypoint.point);
      if (!point) return;
      nodes.push({ type: 'waypoint', index: index, pointId: waypoint.point, point: point, waypoint: waypoint });
    });
    return nodes;
  }

  function runtimeInheritedStart(track) {
    if (!track) return null;
    var scenes = state.project && state.project.scenes || [];
    var sceneIndex = scenes.findIndex(function (scene) { return scene.id === state.sceneId; });
    var isSpawnedInspectionActor = state.sceneId === 'inspection-entry' && /^jp(?:Officer|Soldier[ABC])$/.test(track.actorId);
    if (sceneIndex > 0 && !isSpawnedInspectionActor) {
      for (var index = sceneIndex - 1; index >= 0; index -= 1) {
        var previousTrack = scenes[index].tracks.find(function (item) { return item.actorId === track.actorId; });
        if (!previousTrack) continue;
        if (previousTrack.waypoints && previousTrack.waypoints.length) {
          var finalPoint = getPoint(previousTrack.waypoints[previousTrack.waypoints.length - 1].point);
          if (finalPoint) return finalPoint;
        }
        var previousStart = previousTrack.start !== '@current' && getPoint(previousTrack.start);
        if (previousStart) return previousStart;
      }
    }
    return track.start && track.start !== '@current' ? getPoint(track.start) : null;
  }

  function isDirectRuntimeTrack(track) {
    return state.sceneId === 'inspection-entry' && /^jp(?:Officer|Soldier[ABC])$/.test(track.actorId);
  }

  function editorActorBounds(actorId, x, y) {
    var resource = resources.actors[actorId];
    var scene = getScene();
    var track = scene && scene.tracks.find(function (item) { return item.actorId === actorId; });
    var directionIndex = Math.max(0, DIRECTIONS.indexOf(track && track.facing));
    var frame = resource && resource.frames && resource.frames[directionIndex * 3 + 1];
    var frameWidth = frame && frame.w ? frame.w : 100;
    var frameHeight = frame && frame.h ? frame.h : 164;
    var displayHeight = 164;
    var displayWidth = displayHeight * frameWidth / frameHeight;
    var bodyWidth = Math.max(20, displayWidth * 0.32);
    var bodyHeight = Math.max(18, displayHeight * 0.20);
    var scaledBottomMargin = 4 * displayHeight / frameHeight;
    var centerOffsetY = displayHeight / 2 - bodyHeight / 2 - scaledBottomMargin;
    return {
      left: x - bodyWidth / 2 - 12,
      right: x + bodyWidth / 2 + 12,
      top: y + centerOffsetY - bodyHeight / 2 - 12,
      bottom: y + centerOffsetY + bodyHeight / 2 + 12
    };
  }

  function navCellAt(x, y) {
    var grid = resources.navGrid;
    return { col: Math.floor(x / grid.tileWidth), row: Math.floor(y / grid.tileHeight) };
  }

  function navCellCenter(cell) {
    var grid = resources.navGrid;
    return { x: (cell.col + 0.5) * grid.tileWidth, y: (cell.row + 0.5) * grid.tileHeight };
  }

  function navPointPassable(actorId, x, y) {
    var grid = resources.navGrid;
    if (!grid) return true;
    var bounds = editorActorBounds(actorId, x, y);
    var min = navCellAt(bounds.left, bounds.top);
    var max = navCellAt(bounds.right, bounds.bottom);
    for (var row = min.row; row <= max.row; row += 1) {
      for (var col = min.col; col <= max.col; col += 1) {
        if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols || grid.solid[row][col]) return false;
      }
    }
    return true;
  }

  function navCellPassable(actorId, cell) {
    var point = navCellCenter(cell);
    return navPointPassable(actorId, point.x, point.y);
  }

  function nearestPassableCell(actorId, cell) {
    var grid = resources.navGrid;
    if (navCellPassable(actorId, cell)) return cell;
    var origin = {
      col: Math.max(0, Math.min(grid.cols - 1, cell.col)),
      row: Math.max(0, Math.min(grid.rows - 1, cell.row))
    };
    if (navCellPassable(actorId, origin)) return origin;
    var maxRadius = Math.max(grid.cols, grid.rows);
    for (var radius = 1; radius <= maxRadius; radius += 1) {
      for (var dy = -radius; dy <= radius; dy += 1) {
        for (var dx = -radius; dx <= radius; dx += 1) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          var candidate = { col: origin.col + dx, row: origin.row + dy };
          if (candidate.col < 0 || candidate.col >= grid.cols || candidate.row < 0 || candidate.row >= grid.rows) continue;
          if (navCellPassable(actorId, candidate)) return candidate;
        }
      }
    }
    return origin;
  }

  function findEditorNavPath(actorId, start, destination) {
    if (!resources.navGrid) return [destination];
    var scene = getScene();
    var track = scene && scene.tracks.find(function (item) { return item.actorId === actorId; });
    var cacheKey = [state.sceneId, actorId, track && track.facing, start.x, start.y, destination.x, destination.y].join('|');
    if (resources.pathCache[cacheKey]) return resources.pathCache[cacheKey];
    var startCell = nearestPassableCell(actorId, navCellAt(start.x, start.y));
    var goalCell = nearestPassableCell(actorId, navCellAt(destination.x, destination.y));
    var key = function (cell) { return cell.col + ',' + cell.row; };
    var open = [startCell];
    var openKeys = {}; openKeys[key(startCell)] = true;
    var closed = {};
    var cameFrom = {};
    var scores = {}; scores[key(startCell)] = 0;
    var goalKey = key(goalCell);
    var cells = null;
    while (open.length) {
      var bestIndex = 0;
      var bestScore = Infinity;
      for (var index = 0; index < open.length; index += 1) {
        var candidateScore = (scores[key(open[index])] || 0) + Math.abs(open[index].col - goalCell.col) + Math.abs(open[index].row - goalCell.row);
        if (candidateScore < bestScore) { bestScore = candidateScore; bestIndex = index; }
      }
      var current = open.splice(bestIndex, 1)[0];
      var currentKey = key(current);
      delete openKeys[currentKey];
      if (currentKey === goalKey) {
        cells = [current];
        while (cameFrom[key(cells[0])]) cells.unshift(cameFrom[key(cells[0])]);
        break;
      }
      closed[currentKey] = true;
      [{ col: current.col + 1, row: current.row }, { col: current.col - 1, row: current.row },
        { col: current.col, row: current.row + 1 }, { col: current.col, row: current.row - 1 }].forEach(function (neighbor) {
        var neighborKey = key(neighbor);
        if (closed[neighborKey] || !navCellPassable(actorId, neighbor)) return;
        var nextScore = scores[currentKey] + 1;
        if (scores[neighborKey] != null && nextScore >= scores[neighborKey]) return;
        cameFrom[neighborKey] = current;
        scores[neighborKey] = nextScore;
        if (!openKeys[neighborKey]) { open.push(neighbor); openKeys[neighborKey] = true; }
      });
    }
    if (!cells || !cells.length) {
      resources.pathCache[cacheKey] = [];
      return resources.pathCache[cacheKey];
    }
    var points = [];
    var push = function (point) {
      var previous = points[points.length - 1];
      if (!previous || Math.hypot(previous.x - point.x, previous.y - point.y) >= 2) points.push(point);
    };
    var firstCenter = navCellCenter(cells[0]);
    if (Math.abs(start.y - firstCenter.y) >= 2) push({ x: start.x, y: firstCenter.y });
    push(firstCenter);
    var lastDx = 0; var lastDy = 0;
    for (var i = 1; i < cells.length; i += 1) {
      var stepX = cells[i].col - cells[i - 1].col;
      var stepY = cells[i].row - cells[i - 1].row;
      if (i > 1 && (stepX !== lastDx || stepY !== lastDy)) push(navCellCenter(cells[i - 1]));
      lastDx = stepX; lastDy = stepY;
    }
    var goalCenter = navCellCenter(cells[cells.length - 1]);
    push(goalCenter);
    if (navPointPassable(actorId, destination.x, destination.y)) {
      if (Math.abs(destination.x - goalCenter.x) >= 2) push({ x: destination.x, y: goalCenter.y });
      push({ x: destination.x, y: destination.y });
    }
    resources.pathCache[cacheKey] = points;
    return resources.pathCache[cacheKey];
  }

  function runtimeTrackNodes(track) {
    var authored = trackNodes(track);
    if (authored.length < 2 || isDirectRuntimeTrack(track)) return authored;
    var result = [authored[0]];
    var current = authored[0].point;
    for (var index = 1; index < authored.length; index += 1) {
      var path = findEditorNavPath(track.actorId, current, authored[index].point);
      path.forEach(function (point, pathIndex) {
        result.push({
          type: 'runtime',
          index: index,
          point: point,
          waypoint: pathIndex === path.length - 1 ? authored[index].waypoint : null
        });
      });
      if (path.length) current = path[path.length - 1];
    }
    return result;
  }

  function trackDuration(track) {
    var nodes = runtimeTrackNodes(track);
    if (nodes.length < 2) return 0;
    var total = 0;
    for (var i = 1; i < nodes.length; i += 1) {
      var dx = nodes[i].point.x - nodes[i - 1].point.x;
      var dy = nodes[i].point.y - nodes[i - 1].point.y;
      var speed = number(nodes[i].waypoint && nodes[i].waypoint.speed, track.speed);
      total += Math.sqrt(dx * dx + dy * dy) / Math.max(20, speed) * 1000;
      total += number(nodes[i].waypoint && nodes[i].waypoint.wait, 0);
    }
    return total;
  }

  function sceneDuration() {
    var scene = getScene();
    if (!scene) return 0;
    return scene.tracks.reduce(function (longest, track) {
      return Math.max(longest, trackDuration(track));
    }, 0);
  }

  function renderTimeline() {
    var track = getTrack();
    var actor = track ? getActor(track.actorId) : null;
    var nodes = track ? trackNodes(track) : [];
    var duration = sceneDuration();
    dom.timelineActorName.textContent = actor ? actor.label + ' · 路径节点' : '未选择角色';
    dom.timelineDuration.textContent = (duration / 1000).toFixed(1) + ' s';
    dom.timelineScrubber.value = Math.round(state.previewProgress * 1000);
    dom.timelineScrubber.disabled = duration <= 0;
    dom.playButton.disabled = duration <= 0;
    dom.stopButton.disabled = !state.playing && state.previewProgress === 0;

    var inherited = track && track.start === '@current'
      ? '<button class="le-node-button' + (state.pointSelection && state.pointSelection.type === 'start' ? ' is-selected' : '') + '" type="button" data-node-type="start" data-node-index="-1" disabled>' +
        '<span class="le-node-number">S</span><span class="le-node-copy"><strong>继承当前位置</strong><span>dynamic</span></span></button>'
      : '';

    dom.nodeStrip.innerHTML = inherited + nodes.map(function (node, visibleIndex) {
      var selected = state.pointSelection && state.pointSelection.type === node.type && state.pointSelection.index === node.index;
      return '<button class="le-node-button' + (selected ? ' is-selected' : '') + '" type="button" data-node-type="' + node.type + '" data-node-index="' + node.index + '">' +
        '<span class="le-node-number">' + (node.type === 'start' ? 'S' : visibleIndex) + '</span>' +
        '<span class="le-node-copy"><strong>' + escapeHtml(node.point.label || node.pointId) + '</strong><span>' + rounded(node.point.x) + ', ' + rounded(node.point.y) + '</span></span>' +
        '</button>';
    }).join('');
  }

  function renderToolState() {
    dom.levelCanvas.dataset.tool = state.tool;
    dom.canvasMode.textContent = TOOL_LABELS[state.tool];
    dom.toolSelector.querySelectorAll('[data-tool]').forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.tool === state.tool);
    });
    dom.gridToggle.checked = state.showGrid;
    dom.snapToggle.checked = state.snap;
    dom.overlayToggle.checked = state.showOverlay;
    dom.collisionToggle.checked = state.showCollision;
    dom.labelToggle.checked = state.showLabels;
    dom.zoomReadout.textContent = Math.round(state.zoom * 100) + '%';
  }

  function renderAll() {
    if (!state.project) return;
    ensureSelection();
    renderSceneList();
    renderTracks();
    renderInspector();
    renderTimeline();
    renderToolState();
    updateHistoryButtons();
    updateSaveState();
    drawCanvas();
  }

  function resizeCanvas() {
    var rect = dom.canvasWrap.getBoundingClientRect();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var width = Math.max(1, Math.round(rect.width));
    var height = Math.max(1, Math.round(rect.height));
    if (dom.levelCanvas.width !== Math.round(width * dpr) || dom.levelCanvas.height !== Math.round(height * dpr)) {
      dom.levelCanvas.width = Math.round(width * dpr);
      dom.levelCanvas.height = Math.round(height * dpr);
    }
    drawCanvas();
  }

  function calculateView() {
    var rect = dom.levelCanvas.getBoundingClientRect();
    var world = state.project.world;
    var fit = Math.min((rect.width - 24) / world.width, (rect.height - 24) / world.height);
    fit = Math.max(0.05, fit);
    var scale = fit * state.zoom;
    return {
      width: rect.width,
      height: rect.height,
      fit: fit,
      scale: scale,
      offsetX: (rect.width - world.width * scale) / 2 + state.panX,
      offsetY: (rect.height - world.height * scale) / 2 + state.panY
    };
  }

  function screenToWorld(clientX, clientY) {
    var rect = dom.levelCanvas.getBoundingClientRect();
    var view = state.view || calculateView();
    return {
      x: (clientX - rect.left - view.offsetX) / view.scale,
      y: (clientY - rect.top - view.offsetY) / view.scale
    };
  }

  function worldToScreen(x, y) {
    var view = state.view || calculateView();
    return {
      x: view.offsetX + x * view.scale,
      y: view.offsetY + y * view.scale
    };
  }

  function fitCanvas() {
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
    drawCanvas();
  }

  function setZoom(nextZoom, anchorClientX, anchorClientY) {
    if (!state.project) return;
    var before = anchorClientX == null ? null : screenToWorld(anchorClientX, anchorClientY);
    state.zoom = Math.max(0.35, Math.min(4, nextZoom));
    if (before) {
      var rect = dom.levelCanvas.getBoundingClientRect();
      var world = state.project.world;
      var fit = Math.min((rect.width - 24) / world.width, (rect.height - 24) / world.height);
      var scale = fit * state.zoom;
      var baseX = (rect.width - world.width * scale) / 2;
      var baseY = (rect.height - world.height * scale) / 2;
      state.panX = anchorClientX - rect.left - baseX - before.x * scale;
      state.panY = anchorClientY - rect.top - baseY - before.y * scale;
    }
    renderToolState();
    drawCanvas();
  }

  function drawArrow(context, from, to, scale, color) {
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    var length = Math.sqrt(dx * dx + dy * dy);
    if (length < 8 / scale) return;
    var ux = dx / length;
    var uy = dy / length;
    var size = 8 / scale;
    var x = to.x - ux * 13 / scale;
    var y = to.y - uy * 13 / scale;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x - ux * size - uy * size * 0.6, y - uy * size + ux * size * 0.6);
    context.lineTo(x - ux * size + uy * size * 0.6, y - uy * size - ux * size * 0.6);
    context.closePath();
    context.fill();
  }

  function drawTrack(context, track, actor, isSelected, scale) {
    if (track.visible === false) return;
    var nodes = runtimeTrackNodes(track);
    if (!nodes.length) return;
    var color = actor && actor.color || '#aab2ad';
    context.save();
    context.globalAlpha = isSelected ? 1 : 0.48;
    context.strokeStyle = color;
    context.lineWidth = (isSelected ? 3 : 2) / scale;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    if (track.start === '@current') context.setLineDash([8 / scale, 6 / scale]);
    context.beginPath();
    context.moveTo(nodes[0].point.x, nodes[0].point.y);
    for (var i = 1; i < nodes.length; i += 1) context.lineTo(nodes[i].point.x, nodes[i].point.y);
    context.stroke();
    context.setLineDash([]);
    for (var segment = 1; segment < nodes.length; segment += 1) {
      drawArrow(context, nodes[segment - 1].point, nodes[segment].point, scale, color);
    }
    context.restore();
  }

  function drawNode(context, node, track, actor, isSelectedTrack, scale) {
    var selected = isSelectedTrack && state.pointSelection && state.pointSelection.type === node.type && state.pointSelection.index === node.index;
    var color = actor && actor.color || '#aab2ad';
    var radius = (selected ? 9 : 6) / scale;
    context.save();
    context.globalAlpha = isSelectedTrack ? 1 : 0.64;
    context.fillStyle = node.type === 'start' ? '#111512' : color;
    context.strokeStyle = selected ? '#ffffff' : color;
    context.lineWidth = (selected ? 3 : 2) / scale;
    if (node.type === 'start') {
      context.beginPath();
      context.rect(node.point.x - radius, node.point.y - radius, radius * 2, radius * 2);
    } else {
      context.beginPath();
      context.arc(node.point.x, node.point.y, radius, 0, Math.PI * 2);
    }
    context.fill();
    context.stroke();

    if (state.showLabels && (isSelectedTrack || selected)) {
      var text = (node.type === 'start' ? 'S · ' : 'P' + (node.index + 1) + ' · ') + (node.point.label || node.pointId);
      context.font = '600 ' + (11 / scale) + 'px "Microsoft YaHei", sans-serif';
      var width = context.measureText(text).width;
      var x = node.point.x + 11 / scale;
      var y = node.point.y - 12 / scale;
      context.fillStyle = 'rgba(13, 16, 14, 0.88)';
      context.fillRect(x - 4 / scale, y - 12 / scale, width + 8 / scale, 18 / scale);
      context.fillStyle = '#f5f8f6';
      context.fillText(text, x, y + 1 / scale);
    }
    context.restore();
  }

  function positionOnTrack(track, timeMs) {
    var nodes = runtimeTrackNodes(track);
    if (!nodes.length) return null;
    if (nodes.length === 1) return { x: nodes[0].point.x, y: nodes[0].point.y };
    var local = Math.max(0, timeMs);
    var duration = trackDuration(track);
    if (track.loop && duration > 0 && state.previewProgress < 1) local %= duration;

    for (var i = 1; i < nodes.length; i += 1) {
      var from = nodes[i - 1].point;
      var to = nodes[i].point;
      var dx = to.x - from.x;
      var dy = to.y - from.y;
      var speed = number(nodes[i].waypoint && nodes[i].waypoint.speed, track.speed);
      var moveDuration = Math.sqrt(dx * dx + dy * dy) / Math.max(20, speed) * 1000;
      if (local <= moveDuration) {
        var t = moveDuration > 0 ? local / moveDuration : 1;
        return { x: from.x + dx * t, y: from.y + dy * t };
      }
      local -= moveDuration;
      var waitDuration = number(nodes[i].waypoint && nodes[i].waypoint.wait, 0);
      if (local <= waitDuration) return { x: to.x, y: to.y };
      local -= waitDuration;
    }
    var last = nodes[nodes.length - 1].point;
    return { x: last.x, y: last.y };
  }

  function staticActorPosition(track) {
    var nodes = trackNodes(track);
    if (!nodes.length) return null;
    if (track.actorId === state.actorId) {
      var selected = getSelectedPointInfo();
      if (selected && selected.point) return { x: selected.point.x, y: selected.point.y };
    }
    return { x: nodes[0].point.x, y: nodes[0].point.y };
  }

  function drawActor(context, track, actor, position, scale) {
    if (!position || track.visible === false) return;
    var resource = resources.actors[track.actorId];
    context.save();
    if (resource && resource.image && resource.frames && resource.frames.length === 12) {
      var directionIndex = Math.max(0, DIRECTIONS.indexOf(track.facing));
      var frame = resource.frames[directionIndex * 3 + 1];
      var height = 164;
      var width = height * frame.w / frame.h;
      context.imageSmoothingEnabled = false;
      context.drawImage(
        resource.image,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        position.x - width / 2,
        position.y - height / 2,
        width,
        height
      );
    } else {
      context.fillStyle = actor && actor.color || '#cccccc';
      context.beginPath();
      context.arc(position.x, position.y, 18, 0, Math.PI * 2);
      context.fill();
    }

    if (track.actorId === state.actorId) {
      context.strokeStyle = actor && actor.color || '#ffffff';
      context.lineWidth = 2 / scale;
      context.setLineDash([5 / scale, 4 / scale]);
      context.beginPath();
      context.ellipse(position.x, position.y + 82, 32, 10, 0, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  }

  function drawGrid(context, world, scale) {
    var step = world.gridSize * (scale < 0.45 ? 4 : (scale < 0.8 ? 2 : 1));
    context.save();
    context.strokeStyle = 'rgba(219, 234, 225, 0.13)';
    context.lineWidth = 1 / scale;
    context.beginPath();
    for (var x = 0; x <= world.width; x += step) {
      context.moveTo(x, 0);
      context.lineTo(x, world.height);
    }
    for (var y = 0; y <= world.height; y += step) {
      context.moveTo(0, y);
      context.lineTo(world.width, y);
    }
    context.stroke();
    context.restore();
  }

  function drawCanvas() {
    if (!dom.levelCanvas || !state.project) return;
    var context = dom.levelCanvas.getContext('2d');
    if (!context) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var view = calculateView();
    var world = state.project.world;
    state.view = view;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, dom.levelCanvas.width, dom.levelCanvas.height);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = '#090b0a';
    context.fillRect(0, 0, view.width, view.height);
    context.translate(view.offsetX, view.offsetY);
    context.scale(view.scale, view.scale);

    context.fillStyle = '#161916';
    context.fillRect(0, 0, world.width, world.height);
    if (resources.map) {
      context.imageSmoothingEnabled = false;
      context.drawImage(resources.map, 0, 0, world.width, world.height);
    }
    context.strokeStyle = 'rgba(221, 234, 226, 0.28)';
    context.lineWidth = 1 / view.scale;
    context.strokeRect(0, 0, world.width, world.height);

    if (state.showOverlay && resources.overlay) {
      context.save();
      context.globalAlpha = 0.72;
      context.drawImage(resources.overlay, 0, 0, world.width, world.height);
      context.restore();
    }
    if (state.showCollision && resources.collisionCanvas) {
      context.drawImage(resources.collisionCanvas, 0, 0, world.width, world.height);
    }
    if (state.showGrid) drawGrid(context, world, view.scale);

    var scene = getScene();
    if (!scene) return;
    scene.tracks.forEach(function (track) {
      drawTrack(context, track, getActor(track.actorId), track.actorId === state.actorId, view.scale);
    });

    var duration = sceneDuration();
    var timeMs = duration * state.previewProgress;
    var actorDraws = scene.tracks.map(function (track) {
      return {
        track: track,
        actor: getActor(track.actorId),
        position: state.previewProgress > 0 || state.playing ? positionOnTrack(track, timeMs) : staticActorPosition(track)
      };
    }).filter(function (item) { return item.position && item.track.visible !== false; });
    actorDraws.sort(function (a, b) { return a.position.y - b.position.y; });
    actorDraws.forEach(function (item) {
      drawActor(context, item.track, item.actor, item.position, view.scale);
    });

    scene.tracks.forEach(function (track) {
      var actor = getActor(track.actorId);
      var isSelected = track.actorId === state.actorId;
      trackNodes(track).forEach(function (node) {
        drawNode(context, node, track, actor, isSelected, view.scale);
      });
    });
  }

  function hitTest(clientX, clientY) {
    var scene = getScene();
    if (!scene) return null;
    var point = screenToWorld(clientX, clientY);
    var threshold = 14 / state.view.scale;
    var hits = [];
    scene.tracks.forEach(function (track) {
      if (track.visible === false) return;
      trackNodes(track).forEach(function (node) {
        var dx = node.point.x - point.x;
        var dy = node.point.y - point.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= threshold) hits.push({ track: track, node: node, distance: distance });
      });
    });
    hits.sort(function (a, b) {
      if (a.track.actorId === state.actorId && b.track.actorId !== state.actorId) return -1;
      if (b.track.actorId === state.actorId && a.track.actorId !== state.actorId) return 1;
      return a.distance - b.distance;
    });
    return hits[0] || null;
  }

  function snappedCoordinate(value) {
    var grid = state.project.world.gridSize;
    return state.snap ? Math.round(value / grid) * grid : Math.round(value);
  }

  function movePointFromPointer(clientX, clientY) {
    var drag = state.pointer;
    if (!drag || drag.kind !== 'point') return;
    var worldPoint = screenToWorld(clientX, clientY);
    var point = getPoint(drag.pointId);
    if (!point) return;
    point.x = Math.max(-512, Math.min(state.project.world.width + 512, snappedCoordinate(worldPoint.x)));
    point.y = Math.max(-512, Math.min(state.project.world.height + 512, snappedCoordinate(worldPoint.y)));
    dom.pointXInput.value = rounded(point.x);
    dom.pointYInput.value = rounded(point.y);
    state.dirty = true;
    updateSaveState();
    renderTimeline();
    drawCanvas();
  }

  function addWaypointAt(x, y) {
    var track = getTrack();
    if (!track) {
      showToast('请先选择一条角色轨道', true);
      return;
    }
    commit(function () {
      var pointId = uniquePointId(state.sceneId + '-' + state.actorId + '-path');
      state.project.points[pointId] = {
        label: '路径点 ' + (track.waypoints.length + 1),
        x: snappedCoordinate(x),
        y: snappedCoordinate(y),
        runtime: false
      };
      track.waypoints.push({ point: pointId, speed: track.speed, wait: 0 });
      state.pointSelection = { type: 'waypoint', index: track.waypoints.length - 1 };
    });
  }

  function addWaypointAfterLast() {
    var track = getTrack();
    if (!track) return;
    var nodes = trackNodes(track);
    var last = nodes.length ? nodes[nodes.length - 1].point : { x: state.project.world.width / 2, y: state.project.world.height / 2 };
    addWaypointAt(last.x + 48, last.y + 16);
  }

  function uniquePointId(base) {
    var candidate = safeId(base);
    var index = 1;
    while (state.project.points[candidate]) {
      candidate = safeId(base) + '-' + index;
      index += 1;
    }
    return candidate;
  }

  function pointReferenceCount(pointId) {
    var count = 0;
    state.project.scenes.forEach(function (scene) {
      scene.tracks.forEach(function (track) {
        if (track.start === pointId) count += 1;
        track.waypoints.forEach(function (waypoint) {
          if (waypoint.point === pointId) count += 1;
        });
      });
    });
    return count;
  }

  function deleteSelectedWaypoint() {
    var track = getTrack();
    var info = getSelectedPointInfo();
    if (!track || !info || info.type !== 'waypoint') return;
    commit(function () {
      var removed = track.waypoints.splice(info.index, 1)[0];
      if (removed && pointReferenceCount(removed.point) === 0 && state.project.points[removed.point] && !state.project.points[removed.point].runtime) {
        delete state.project.points[removed.point];
      }
      state.pointSelection = track.waypoints.length
        ? { type: 'waypoint', index: Math.min(info.index, track.waypoints.length - 1) }
        : (track.start !== '@current' ? { type: 'start', index: -1 } : null);
    });
  }

  function moveSelectedWaypoint(delta) {
    var track = getTrack();
    var info = getSelectedPointInfo();
    if (!track || !info || info.type !== 'waypoint') return;
    var nextIndex = info.index + delta;
    if (nextIndex < 0 || nextIndex >= track.waypoints.length) return;
    commit(function () {
      var moved = track.waypoints.splice(info.index, 1)[0];
      track.waypoints.splice(nextIndex, 0, moved);
      state.pointSelection = { type: 'waypoint', index: nextIndex };
    });
  }

  function addScene() {
    commit(function () {
      var sceneId = 'scene-' + (state.project.scenes.length + 1);
      var suffix = 1;
      while (state.project.scenes.some(function (scene) { return scene.id === sceneId; })) {
        suffix += 1;
        sceneId = 'scene-' + (state.project.scenes.length + suffix);
      }
      state.project.scenes.push({ id: sceneId, label: '新剧情段', cue: '', tracks: [] });
      state.sceneId = sceneId;
      state.actorId = null;
      state.pointSelection = null;
    });
  }

  function duplicateScene() {
    var scene = getScene();
    if (!scene) return;
    commit(function () {
      var copy = clone(scene);
      copy.id = uniqueSceneId(scene.id + '-copy');
      copy.label = scene.label + ' 副本';
      state.project.scenes.splice(state.project.scenes.indexOf(scene) + 1, 0, copy);
      state.sceneId = copy.id;
      state.actorId = copy.tracks.length ? copy.tracks[0].actorId : null;
      state.pointSelection = null;
    });
  }

  function uniqueSceneId(base) {
    var candidate = safeId(base);
    var index = 2;
    while (state.project.scenes.some(function (scene) { return scene.id === candidate; })) {
      candidate = safeId(base) + '-' + index;
      index += 1;
    }
    return candidate;
  }

  function deleteScene() {
    var scene = getScene();
    if (!scene || state.project.scenes.length <= 1) return;
    if (!window.confirm('删除剧情段“' + scene.label + '”？')) return;
    commit(function () {
      var index = state.project.scenes.indexOf(scene);
      state.project.scenes.splice(index, 1);
      state.sceneId = state.project.scenes[Math.min(index, state.project.scenes.length - 1)].id;
      state.actorId = null;
      state.pointSelection = null;
    });
  }

  function moveScene(delta) {
    var scene = getScene();
    if (!scene) return;
    var index = state.project.scenes.indexOf(scene);
    var next = index + delta;
    if (next < 0 || next >= state.project.scenes.length) return;
    commit(function () {
      state.project.scenes.splice(index, 1);
      state.project.scenes.splice(next, 0, scene);
    });
  }

  function addTrack() {
    var scene = getScene();
    var actorId = dom.actorLibrarySelect.value;
    if (!scene || !actorId) return;
    commit(function () {
      var pointId = uniquePointId(scene.id + '-' + actorId + '-spawn');
      state.project.points[pointId] = {
        label: state.project.actorLibrary[actorId].label + '起始点',
        x: Math.round(state.project.world.width / 2),
        y: Math.round(state.project.world.height / 2),
        runtime: false
      };
      scene.tracks.push({ actorId: actorId, start: pointId, waypoints: [], speed: 260, facing: 'down', loop: false, visible: true });
      state.actorId = actorId;
      state.pointSelection = { type: 'start', index: -1 };
    });
  }

  function deleteTrack() {
    var scene = getScene();
    var track = getTrack();
    if (!scene || !track) return;
    commit(function () {
      var index = scene.tracks.indexOf(track);
      scene.tracks.splice(index, 1);
      state.actorId = scene.tracks.length ? scene.tracks[Math.min(index, scene.tracks.length - 1)].actorId : null;
      state.pointSelection = null;
    });
  }

  function focusSelectedPoint() {
    var info = getSelectedPointInfo();
    if (!info || !info.point) return;
    var view = calculateView();
    var screen = worldToScreen(info.point.x, info.point.y);
    var margin = 80;
    if (screen.x < margin || screen.x > view.width - margin || screen.y < margin || screen.y > view.height - margin) {
      state.panX += view.width / 2 - screen.x;
      state.panY += view.height / 2 - screen.y;
      drawCanvas();
    }
  }

  function startPlayback() {
    var duration = sceneDuration();
    if (duration <= 0) return;
    state.playing = true;
    state.playbackStartedAt = performance.now();
    state.playbackStartProgress = state.previewProgress >= 1 ? 0 : state.previewProgress;
    if (state.previewProgress >= 1) state.previewProgress = 0;
    cancelAnimationFrame(frameRequest);
    frameRequest = requestAnimationFrame(playbackFrame);
    renderTimeline();
  }

  function playbackFrame(now) {
    if (!state.playing) return;
    var duration = sceneDuration();
    var elapsed = (now - state.playbackStartedAt) * state.playbackRate;
    state.previewProgress = state.playbackStartProgress + elapsed / Math.max(1, duration);
    if (state.previewProgress >= 1) {
      state.previewProgress = 1;
      state.playing = false;
    }
    dom.timelineScrubber.value = Math.round(state.previewProgress * 1000);
    drawCanvas();
    renderTimeline();
    if (state.playing) frameRequest = requestAnimationFrame(playbackFrame);
  }

  function stopPlayback(reset) {
    state.playing = false;
    cancelAnimationFrame(frameRequest);
    if (reset !== false) state.previewProgress = 0;
    if (dom.timelineScrubber) renderTimeline();
    drawCanvas();
  }

  function imagePromise(src) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () { resolve(image); };
      image.onerror = function () { reject(new Error('Image failed: ' + src)); };
      image.src = src;
    });
  }

  function buildCollisionResources(image) {
    var sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = image.naturalWidth;
    sourceCanvas.height = image.naturalHeight;
    var sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
    sourceContext.drawImage(image, 0, 0);
    var imageData;
    try {
      imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
    } catch (error) {
      console.warn('Collision preview is unavailable', error);
      return { canvas: null, navGrid: null };
    }
    var tile = 16;
    var cols = Math.ceil(sourceCanvas.width / tile);
    var rows = Math.ceil(sourceCanvas.height / tile);
    var mask = document.createElement('canvas');
    mask.width = state.project.world.width;
    mask.height = state.project.world.height;
    var maskContext = mask.getContext('2d');
    var tileWidth = tile * mask.width / sourceCanvas.width;
    var tileHeight = tile * mask.height / sourceCanvas.height;
    var solidGrid = new Array(rows);
    maskContext.fillStyle = 'rgba(240, 74, 82, 0.42)';

    for (var row = 0; row < rows; row += 1) {
      solidGrid[row] = new Array(cols);
      for (var col = 0; col < cols; col += 1) {
        var startX = col * tile;
        var startY = row * tile;
        var endX = Math.min(startX + tile, sourceCanvas.width);
        var endY = Math.min(startY + tile, sourceCanvas.height);
        var total = Math.max(1, (endX - startX) * (endY - startY));
        var required = Math.max(10, Math.ceil(total * 0.12));
        var solid = 0;
        for (var y = startY; y < endY && solid < required; y += 1) {
          for (var x = startX; x < endX; x += 1) {
            if (imageData[(y * sourceCanvas.width + x) * 4 + 3] > 32) solid += 1;
            if (solid >= required) break;
          }
        }
        solidGrid[row][col] = solid >= required;
        if (solidGrid[row][col]) {
          maskContext.fillRect(col * tileWidth, row * tileHeight, Math.ceil(tileWidth), Math.ceil(tileHeight));
        }
      }
    }
    return {
      canvas: mask,
      navGrid: { solid: solidGrid, cols: cols, rows: rows, tileWidth: tileWidth, tileHeight: tileHeight }
    };
  }

  async function loadResources() {
    var world = state.project.world;
    var actorEntries = Object.keys(state.project.actorLibrary).map(function (actorId) {
      var actor = state.project.actorLibrary[actorId];
      return Promise.all([
        imagePromise(actor.asset),
        fetch(actor.bounds).then(function (response) {
          if (!response.ok) throw new Error('Bounds failed: ' + actor.bounds);
          return response.json();
        })
      ]).then(function (loaded) {
        resources.actors[actorId] = { image: loaded[0], frames: loaded[1].frames || [] };
      }).catch(function (error) {
        console.warn(error);
      });
    });

    var loaded = await Promise.all([
      imagePromise(world.map),
      imagePromise(world.overlay),
      Promise.all(actorEntries)
    ]);
    resources.map = loaded[0];
    resources.overlay = loaded[1];
    var collision = buildCollisionResources(resources.overlay);
    resources.collisionCanvas = collision.canvas;
    resources.navGrid = collision.navGrid;
    resources.pathCache = {};
    resources.ready = true;
    dom.canvasLoading.hidden = true;
    resizeCanvas();
  }

  function extractProjectMetadata(text) {
    var start = text.indexOf(PROJECT_START);
    if (start < 0) return null;
    var jsonStart = text.indexOf('\n', start);
    var end = text.indexOf(PROJECT_END, jsonStart);
    if (jsonStart < 0 || end < 0) return null;
    try {
      var project = JSON.parse(text.slice(jsonStart + 1, end).trim());
      return validProject(project) ? project : null;
    } catch (error) {
      console.warn('Invalid embedded level editor project', error);
      return null;
    }
  }

  function metadataPattern() {
    return /\/\* LEVEL_EDITOR_PROJECT_START[\s\S]*?LEVEL_EDITOR_PROJECT_END \*\/[\r\n]*/g;
  }

  function findAssignmentRange(text, variableName) {
    var token = 'var ' + variableName;
    var start = text.indexOf(token);
    if (start < 0) return null;
    var open = text.indexOf('{', start + token.length);
    if (open < 0) return null;
    var depth = 0;
    var quote = '';
    var escaped = false;
    var lineComment = false;
    var blockComment = false;
    for (var index = open; index < text.length; index += 1) {
      var char = text[index];
      var next = text[index + 1];
      if (lineComment) {
        if (char === '\n') lineComment = false;
        continue;
      }
      if (blockComment) {
        if (char === '*' && next === '/') {
          blockComment = false;
          index += 1;
        }
        continue;
      }
      if (quote) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = '';
        continue;
      }
      if (char === '/' && next === '/') {
        lineComment = true;
        index += 1;
        continue;
      }
      if (char === '/' && next === '*') {
        blockComment = true;
        index += 1;
        continue;
      }
      if (char === '"' || char === "'" || char === '`') {
        quote = char;
        continue;
      }
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          var end = index + 1;
          while (/\s/.test(text[end] || '')) end += 1;
          if (text[end] === ';') end += 1;
          return { start: start, end: end };
        }
      }
    }
    return null;
  }

  function parseRuntimePoints(text) {
    var range = findAssignmentRange(text, 'CUTSCENE_POINTS');
    if (!range) return null;
    var block = text.slice(range.start, range.end);
    var points = {};
    var expression = /([A-Za-z_$][\w$-]*)\s*:\s*\{\s*x\s*:\s*(-?\d+(?:\.\d+)?)\s*,\s*y\s*:\s*(-?\d+(?:\.\d+)?)/g;
    var match;
    while ((match = expression.exec(block))) {
      points[match[1]] = { x: Number(match[2]), y: Number(match[3]) };
    }
    return Object.keys(points).length ? points : null;
  }

  function runtimePointCode(project) {
    var points = project.points;
    var order = (project.runtimePointOrder || []).slice();
    Object.keys(points).forEach(function (pointId) {
      if (pointId === 'dresserPartner') return;
      if (order.indexOf(pointId) < 0) order.push(pointId);
    });
    var dresser = points.dresserPlayer;
    var partner = points.dresserPartner;
    var lines = ['var CUTSCENE_POINTS = {'];
    order.forEach(function (pointId) {
      var point = points[pointId];
      if (!point) return;
      var key = /^[A-Za-z_$][\w$]*$/.test(pointId) ? pointId : JSON.stringify(pointId);
      lines.push('  ' + key + ': { x: ' + rounded(point.x) + ', y: ' + rounded(point.y) + ' },');
    });
    if (dresser && partner) {
      lines.push('  dresserPartnerOffset: { x: ' + rounded(partner.x - dresser.x) + ', y: ' + rounded(partner.y - dresser.y) + ' },');
    }
    if (lines.length > 1) lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '');
    lines.push('};');
    return lines.join('\n');
  }

  function runtimeSceneCode(project) {
    var scenes = {};
    project.scenes.forEach(function (scene) {
      scenes[scene.id] = {
        label: scene.label,
        cue: scene.cue,
        tracks: clone(scene.tracks)
      };
    });
    return 'var CUTSCENE_SCENES = ' + JSON.stringify(scenes, null, 2) + ';';
  }

  function buildUpdatedConfig() {
    if (!sourceText) throw new Error('无法读取原配置文件');
    var clean = sourceText.replace(metadataPattern(), '');
    var range = findAssignmentRange(clean, 'CUTSCENE_POINTS');
    if (!range) throw new Error('未找到 CUTSCENE_POINTS 配置块');
    var projectCopy = clone(state.project);
    projectCopy.updatedAt = new Date().toISOString();
    var metadata = PROJECT_START + '\n' + JSON.stringify(projectCopy, null, 2) + '\n' + PROJECT_END;
    var updated = clean.slice(0, range.start) + runtimePointCode(projectCopy) + clean.slice(range.end);
    var sceneRange = findAssignmentRange(updated, 'CUTSCENE_SCENES');
    if (sceneRange) {
      updated = updated.slice(0, sceneRange.start) + runtimeSceneCode(projectCopy) + updated.slice(sceneRange.end);
    } else {
      var pointRange = findAssignmentRange(updated, 'CUTSCENE_POINTS');
      updated = updated.slice(0, pointRange.end) + '\n' + runtimeSceneCode(projectCopy) + updated.slice(pointRange.end);
    }
    sceneRange = findAssignmentRange(updated, 'CUTSCENE_SCENES');
    return updated.slice(0, sceneRange.end) + '\n' + metadata + updated.slice(sceneRange.end);
  }

  function downloadText(filename, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function saveConfig() {
    var updated;
    try {
      updated = buildUpdatedConfig();
    } catch (error) {
      showToast(error.message, true);
      return;
    }
    try {
      if (window.showSaveFilePicker) {
        var handle = await window.showSaveFilePicker({
          suggestedName: 'disguise-config.js',
          types: [{ description: 'JavaScript', accept: { 'text/javascript': ['.js'] } }]
        });
        var writable = await handle.createWritable();
        await writable.write(updated);
        await writable.close();
      } else {
        downloadText('disguise-config.js', updated, 'text/javascript;charset=utf-8');
      }
      sourceText = updated;
      sourceProject = clone(state.project);
      state.dirty = false;
      persistDraft();
      updateSaveState();
      showToast('配置 JS 已保存');
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      showToast('保存失败：' + (error.message || error), true);
    }
  }

  async function importFile(file) {
    if (!file) return;
    var text = await file.text();
    var project = null;
    if (/\.json$/i.test(file.name)) {
      try { project = JSON.parse(text); } catch (error) { project = null; }
    } else {
      project = extractProjectMetadata(text);
      if (!project) {
        var runtimePoints = parseRuntimePoints(text);
        if (runtimePoints) project = createDefaultProject(runtimePoints);
      }
      if (project) sourceText = text;
    }
    if (!validProject(project)) {
      showToast('文件中没有可用的关卡数据', true);
      return;
    }
    setProject(project, { dirty: true });
    await loadResources();
    showToast('关卡数据已导入');
  }

  function exportJson() {
    var project = clone(state.project);
    project.updatedAt = new Date().toISOString();
    downloadText('face-recog-cutscene-layout.json', JSON.stringify(project, null, 2), 'application/json;charset=utf-8');
    showToast('JSON 已导出');
  }

  function resetProject() {
    if (!window.confirm('恢复 disguise-config.js 中的坐标并清除本地草稿？')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* no-op */ }
    setProject(sourceProject || createDefaultProject(sourceRuntimePoints), { dirty: false });
    showToast('已恢复源配置');
  }

  function bindInputs() {
    dom.sceneLabelInput.addEventListener('change', function () {
      var value = this.value.trim() || '未命名剧情段';
      commit(function () { getScene().label = value; });
    });
    dom.sceneCueInput.addEventListener('change', function () {
      var value = this.value.trim();
      commit(function () { getScene().cue = value; });
    });
    dom.trackSpeedInput.addEventListener('change', function () {
      var value = Math.max(20, number(this.value, 260));
      commit(function () {
        var track = getTrack();
        track.speed = value;
        track.waypoints.forEach(function (waypoint) {
          waypoint.speed = value;
        });
      });
    });
    dom.trackFacingSelect.addEventListener('change', function () {
      var value = this.value;
      commit(function () { getTrack().facing = value; });
    });
    dom.trackVisibleInput.addEventListener('change', function () {
      var value = this.checked;
      commit(function () { getTrack().visible = value; });
    });
    dom.trackLoopInput.addEventListener('change', function () {
      var value = this.checked;
      commit(function () { getTrack().loop = value; });
    });
    dom.pointLabelInput.addEventListener('change', function () {
      var info = getSelectedPointInfo();
      var value = this.value.trim() || info.pointId;
      commit(function () { info.point.label = value; });
    });
    dom.pointXInput.addEventListener('change', function () {
      var info = getSelectedPointInfo();
      var value = number(this.value, info.point.x);
      commit(function () { info.point.x = value; });
    });
    dom.pointYInput.addEventListener('change', function () {
      var info = getSelectedPointInfo();
      var value = number(this.value, info.point.y);
      commit(function () { info.point.y = value; });
    });
    dom.pointSpeedInput.addEventListener('change', function () {
      var info = getSelectedPointInfo();
      if (!info || !info.waypoint) return;
      var value = Math.max(20, number(this.value, getTrack().speed));
      commit(function () { info.waypoint.speed = value; });
    });
    dom.pointWaitInput.addEventListener('change', function () {
      var info = getSelectedPointInfo();
      if (!info || !info.waypoint) return;
      var value = Math.max(0, number(this.value, 0));
      commit(function () { info.waypoint.wait = value; });
    });
  }

  function bindCanvas() {
    dom.levelCanvas.addEventListener('pointerdown', function (event) {
      dom.levelCanvas.focus();
      dom.levelCanvas.setPointerCapture(event.pointerId);
      var panMode = state.tool === 'pan' || state.spacePressed || event.button === 1;
      if (panMode) {
        state.pointer = {
          kind: 'pan',
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          panX: state.panX,
          panY: state.panY
        };
        dom.levelCanvas.classList.add('is-panning');
        return;
      }
      if (state.tool === 'path') {
        var point = screenToWorld(event.clientX, event.clientY);
        addWaypointAt(point.x, point.y);
        return;
      }
      var hit = hitTest(event.clientX, event.clientY);
      if (!hit) return;
      state.actorId = hit.track.actorId;
      state.pointSelection = { type: hit.node.type, index: hit.node.index };
      state.pointer = {
        kind: 'point',
        pointerId: event.pointerId,
        pointId: hit.node.pointId,
        before: snapshot()
      };
      renderAll();
    });

    dom.levelCanvas.addEventListener('pointermove', function (event) {
      var worldPoint = screenToWorld(event.clientX, event.clientY);
      dom.cursorCoordinates.textContent = 'X ' + Math.round(worldPoint.x) + ' · Y ' + Math.round(worldPoint.y);
      if (!state.pointer || state.pointer.pointerId !== event.pointerId) return;
      if (state.pointer.kind === 'pan') {
        state.panX = state.pointer.panX + event.clientX - state.pointer.startX;
        state.panY = state.pointer.panY + event.clientY - state.pointer.startY;
        drawCanvas();
      } else {
        movePointFromPointer(event.clientX, event.clientY);
      }
    });

    function finishPointer(event) {
      if (!state.pointer || state.pointer.pointerId !== event.pointerId) return;
      if (state.pointer.kind === 'point' && state.pointer.before !== snapshot()) pushHistory();
      state.pointer = null;
      dom.levelCanvas.classList.remove('is-panning');
      renderAll();
    }
    dom.levelCanvas.addEventListener('pointerup', finishPointer);
    dom.levelCanvas.addEventListener('pointercancel', finishPointer);
    dom.levelCanvas.addEventListener('dblclick', function (event) {
      if (state.tool !== 'select') return;
      var point = screenToWorld(event.clientX, event.clientY);
      addWaypointAt(point.x, point.y);
    });
    dom.levelCanvas.addEventListener('wheel', function (event) {
      event.preventDefault();
      setZoom(state.zoom * (event.deltaY > 0 ? 0.9 : 1.1), event.clientX, event.clientY);
    }, { passive: false });
  }

  function bindEvents() {
    dom.sceneList.addEventListener('click', function (event) {
      var button = event.target.closest('[data-scene-id]');
      if (button) selectScene(button.dataset.sceneId);
    });
    dom.trackList.addEventListener('click', function (event) {
      var button = event.target.closest('[data-actor-id]');
      if (button) selectTrack(button.dataset.actorId);
    });
    dom.nodeStrip.addEventListener('click', function (event) {
      var button = event.target.closest('[data-node-type]');
      if (!button || button.disabled) return;
      selectPoint(button.dataset.nodeType, Number(button.dataset.nodeIndex), true);
    });
    dom.toolSelector.addEventListener('click', function (event) {
      var button = event.target.closest('[data-tool]');
      if (!button) return;
      state.tool = button.dataset.tool;
      renderToolState();
    });

    dom.undoButton.addEventListener('click', undo);
    dom.redoButton.addEventListener('click', redo);
    dom.zoomOutButton.addEventListener('click', function () { setZoom(state.zoom / 1.2); });
    dom.zoomInButton.addEventListener('click', function () { setZoom(state.zoom * 1.2); });
    dom.zoomReadout.addEventListener('click', fitCanvas);
    dom.gridToggle.addEventListener('change', function () { state.showGrid = this.checked; drawCanvas(); });
    dom.snapToggle.addEventListener('change', function () { state.snap = this.checked; });
    dom.overlayToggle.addEventListener('change', function () { state.showOverlay = this.checked; drawCanvas(); });
    dom.collisionToggle.addEventListener('change', function () { state.showCollision = this.checked; drawCanvas(); });
    dom.labelToggle.addEventListener('change', function () { state.showLabels = this.checked; drawCanvas(); });

    dom.addSceneButton.addEventListener('click', addScene);
    dom.duplicateSceneButton.addEventListener('click', duplicateScene);
    dom.deleteSceneButton.addEventListener('click', deleteScene);
    dom.moveSceneUpButton.addEventListener('click', function () { moveScene(-1); });
    dom.moveSceneDownButton.addEventListener('click', function () { moveScene(1); });
    dom.addTrackButton.addEventListener('click', addTrack);
    dom.deleteTrackButton.addEventListener('click', deleteTrack);
    dom.addWaypointButton.addEventListener('click', addWaypointAfterLast);
    dom.deletePointButton.addEventListener('click', deleteSelectedWaypoint);
    dom.movePointUpButton.addEventListener('click', function () { moveSelectedWaypoint(-1); });
    dom.movePointDownButton.addEventListener('click', function () { moveSelectedWaypoint(1); });

    dom.playButton.addEventListener('click', startPlayback);
    dom.stopButton.addEventListener('click', function () { stopPlayback(true); });
    dom.playbackSpeedSelect.addEventListener('change', function () { state.playbackRate = Number(this.value); });
    dom.timelineScrubber.addEventListener('input', function () {
      state.playing = false;
      cancelAnimationFrame(frameRequest);
      state.previewProgress = Number(this.value) / 1000;
      drawCanvas();
      renderTimeline();
    });

    dom.importButton.addEventListener('click', function () { dom.fileInput.click(); });
    dom.fileInput.addEventListener('change', function () {
      importFile(this.files && this.files[0]).catch(function (error) {
        showToast('导入失败：' + error.message, true);
      });
      this.value = '';
    });
    dom.exportJsonButton.addEventListener('click', exportJson);
    dom.saveConfigButton.addEventListener('click', saveConfig);
    dom.resetButton.addEventListener('click', resetProject);

    window.addEventListener('keydown', function (event) {
      var tag = document.activeElement && document.activeElement.tagName;
      var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (event.code === 'Space' && !typing) {
        state.spacePressed = true;
        event.preventDefault();
      }
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      } else if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))) {
        event.preventDefault();
        redo();
      } else if (!typing && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault();
        deleteSelectedWaypoint();
      } else if (!typing && event.key.toLowerCase() === 'v') {
        state.tool = 'select';
        renderToolState();
      } else if (!typing && event.key.toLowerCase() === 'p') {
        state.tool = 'path';
        renderToolState();
      } else if (!typing && event.key.toLowerCase() === 'h') {
        state.tool = 'pan';
        renderToolState();
      }
    });
    window.addEventListener('keyup', function (event) {
      if (event.code === 'Space') state.spacePressed = false;
    });

    bindInputs();
    bindCanvas();
    var observer = new ResizeObserver(resizeCanvas);
    observer.observe(dom.canvasWrap);
  }

  function collectDom() {
    [
      'saveState', 'undoButton', 'redoButton', 'toolSelector', 'zoomOutButton', 'zoomReadout', 'zoomInButton',
      'gridToggle', 'snapToggle', 'overlayToggle', 'collisionToggle', 'labelToggle', 'importButton',
      'exportJsonButton', 'saveConfigButton', 'sceneCount', 'addSceneButton', 'sceneList', 'projectPointCount',
      'resetButton', 'stageSceneName', 'stageSceneCue', 'cursorCoordinates', 'canvasWrap', 'levelCanvas',
      'canvasLoading', 'canvasMode', 'selectionKind', 'moveSceneUpButton', 'moveSceneDownButton',
      'duplicateSceneButton', 'deleteSceneButton', 'sceneLabelInput', 'sceneCueInput', 'trackCount', 'trackList',
      'actorLibrarySelect', 'addTrackButton', 'trackInspectorSection', 'selectedActorName', 'deleteTrackButton',
      'trackSpeedInput', 'trackFacingSelect', 'trackVisibleInput', 'trackLoopInput', 'pointInspectorSection',
      'selectedPointRole', 'movePointUpButton', 'movePointDownButton', 'deletePointButton', 'pointIdInput',
      'pointLabelInput', 'pointXInput', 'pointYInput', 'pointSpeedInput', 'pointWaitInput', 'addWaypointButton',
      'playButton', 'stopButton', 'playbackSpeedSelect', 'timelineActorName', 'timelineDuration',
      'timelineScrubber', 'nodeStrip', 'fileInput', 'toast'
    ].forEach(function (id) {
      dom[id] = document.getElementById(id);
    });
  }

  async function bootstrap() {
    collectDom();
    bindEvents();

    var defaultProject = createDefaultProject(sourceRuntimePoints);
    try {
      var response = await fetch(SOURCE_CONFIG_URL, { cache: 'no-store' });
      if (response.ok) {
        sourceText = await response.text();
        var embedded = extractProjectMetadata(sourceText);
        var parsedPoints = parseRuntimePoints(sourceText);
        sourceProject = embedded || createDefaultProject(parsedPoints || sourceRuntimePoints);
      }
    } catch (error) {
      console.warn('Unable to read source configuration text', error);
    }
    sourceProject = sourceProject || defaultProject;

    var draft = readDraft();
    var sourceTime = Date.parse(sourceProject.updatedAt || 0) || 0;
    var draftTime = draft ? (Date.parse(draft.updatedAt || draft.project.updatedAt || 0) || 0) : 0;
    if (draft && draftTime >= sourceTime) {
      setProject(draft.project, { dirty: true, persist: false });
      showToast('已恢复本地草稿');
    } else {
      setProject(sourceProject, { dirty: false, persist: false });
    }

    try {
      await loadResources();
    } catch (error) {
      dom.canvasLoading.textContent = '素材加载失败';
      showToast(error.message || '素材加载失败', true);
    }
  }

  window.Act3LevelEditor = {
    getProject: function () { return state.project ? clone(state.project) : null; },
    buildConfigSource: function () { return buildUpdatedConfig(); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}());

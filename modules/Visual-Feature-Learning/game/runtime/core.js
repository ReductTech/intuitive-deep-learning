(function (global) {
  'use strict';
  const game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  game.systems = game.systems || {};
  game.actors = game.actors || {};

  // systems/lifecycle
  {
  let scopes = new WeakMap();

  function cancelled() {
    return new DOMException('Scene stopped', 'AbortError');
  }

  function scopeFor(scene) {
    if (scopes.has(scene)) return scopes.get(scene);
    var scope = { controller: new AbortController(), pending: new Set(), tasks: new Map() };
    scopes.set(scene, scope);
    scene.events.once('shutdown', function () {
      scope.controller.abort();
      Array.from(scope.pending).forEach(function (cancel) { cancel(); });
      scope.tasks.clear();
      // Phaser owns the scene objects, timers and tweens; our promises own their listeners.
    });
    return scope;
  }

  function promise(scene, setup) {
    var scope = scopeFor(scene);
    return new Promise(function (resolve, reject) {
      if (scope.controller.signal.aborted) { reject(cancelled()); return; }
      var settled = false;
      var cleanup;
      function finish(error, value) {
        if (settled) return;
        settled = true;
        scope.pending.delete(cancel);
        if (cleanup) cleanup();
        if (error) reject(error);
        else resolve(value);
      }
      function cancel() { finish(cancelled()); }
      scope.pending.add(cancel);
      try {
        cleanup = setup(function (value) { finish(null, value); }, function (error) { finish(error); });
        if (settled && cleanup) cleanup();
      } catch (error) { finish(error); }
    });
  }

  function isCancelled(error) { return error && error.name === 'AbortError'; }

  function run(scene, key, operation, recover) {
    var scope = scopeFor(scene);
    if (scope.controller.signal.aborted) return Promise.resolve();
    if (scope.tasks.has(key)) return scope.tasks.get(key);
    var task = Promise.resolve().then(function () {
      if (scope.controller.signal.aborted) throw cancelled();
      return operation();
    }).catch(async function (error) {
      if (scope.controller.signal.aborted) return;
      console.warn('Game sequence failed: ' + key, error);
      if (recover) await recover(error);
    }).catch(function (error) {
      if (!isCancelled(error)) console.warn('Game sequence recovery failed: ' + key, error);
    }).finally(function () { scope.tasks.delete(key); });
    scope.tasks.set(key, task);
    return task;
  }

  game.systems.lifecycle = {
    promise: promise,
    run: run,
    isCancelled: isCancelled,
    signal: function (scene) { return scopeFor(scene).controller.signal; }
  };
  }

  // systems/collision
  {
  let constants = game.constants;
  let SCENE_WIDTH = constants.SCENE_WIDTH;
  let SCENE_HEIGHT = constants.SCENE_HEIGHT;
  let OVERLAY_COLLISION_TILE = constants.OVERLAY_COLLISION_TILE;
  let OVERLAY_ALPHA_THRESHOLD = constants.OVERLAY_ALPHA_THRESHOLD;
  let OVERLAY_SOLID_COVERAGE = constants.OVERLAY_SOLID_COVERAGE;

  function addWall(scene, x, y, width, height) {
    var wall = scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0xff3f5f, 0);
    scene.physics.add.existing(wall, true);
    scene.walls.add(wall);
    return wall;
  }

  function createOverlayCollision(scene) {
    var image = scene.textures.get('overlay').getSourceImage();
    var width = image && image.width ? image.width : 0;
    var height = image && image.height ? image.height : 0;
    if (!width || !height) return;

    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    context.drawImage(image, 0, 0);
    var data = context.getImageData(0, 0, width, height).data;
    var cols = Math.ceil(width / OVERLAY_COLLISION_TILE);
    var rows = Math.ceil(height / OVERLAY_COLLISION_TILE);
    var solid = new Array(rows);

    for (var row = 0; row < rows; row += 1) {
      solid[row] = new Array(cols);
      for (var col = 0; col < cols; col += 1) {
        solid[row][col] = tileHasAlpha(data, width, height, col, row);
      }
    }

    var scaleX = SCENE_WIDTH / width;
    var scaleY = SCENE_HEIGHT / height;
    scene.navGrid = {
      solid: solid,
      cols: cols,
      rows: rows,
      tileWidth: OVERLAY_COLLISION_TILE * scaleX,
      tileHeight: OVERLAY_COLLISION_TILE * scaleY
    };

    for (var y = 0; y < rows; y += 1) {
      var x = 0;
      while (x < cols) {
        while (x < cols && !solid[y][x]) x += 1;
        if (x >= cols) break;
        var startX = x;
        while (x < cols && solid[y][x]) x += 1;
        addWall(
          scene,
          startX * OVERLAY_COLLISION_TILE * scaleX,
          y * OVERLAY_COLLISION_TILE * scaleY,
          (x - startX) * OVERLAY_COLLISION_TILE * scaleX,
          OVERLAY_COLLISION_TILE * scaleY
        );
      }
    }
  }

  function tileHasAlpha(data, width, height, col, row) {
    var startX = col * OVERLAY_COLLISION_TILE;
    var startY = row * OVERLAY_COLLISION_TILE;
    var endX = Math.min(startX + OVERLAY_COLLISION_TILE, width);
    var endY = Math.min(startY + OVERLAY_COLLISION_TILE, height);
    var solidPixels = 0;
    var totalPixels = Math.max(1, (endX - startX) * (endY - startY));
    var requiredPixels = Math.max(10, Math.ceil(totalPixels * OVERLAY_SOLID_COVERAGE));

    for (var y = startY; y < endY; y += 1) {
      for (var x = startX; x < endX; x += 1) {
        if (data[(y * width + x) * 4 + 3] > OVERLAY_ALPHA_THRESHOLD) {
          solidPixels += 1;
          if (solidPixels >= requiredPixels) {
            return true;
          }
        }
      }
    }
    return false;
  }

  game.systems.collision = {
    createOverlayCollision: createOverlayCollision
  };
  }

  // actors/animation
  {
  let ACTOR_DIRECTIONS = game.constants.ACTOR_DIRECTIONS;

  function createActorFrames(scene, actorKey) {
    var texture = scene.textures.get(actorKey);
    var bounds = scene.cache.json.get(actorKey + 'Bounds');
    var frames = bounds && Array.isArray(bounds.frames) ? bounds.frames : [];

    if (frames.length !== 12) {
      throw new Error('Expected 12 frames for ' + actorKey + ', got ' + frames.length);
    }

    ACTOR_DIRECTIONS.forEach(function (direction, rowIndex) {
      [0, 1, 2].forEach(function (columnIndex) {
        var frame = frames[rowIndex * 3 + columnIndex];
        texture.add(
          direction + '-' + columnIndex,
          0,
          frame.x,
          frame.y,
          frame.w,
          frame.h
        );
      });
    });

    ACTOR_DIRECTIONS.forEach(function (direction, rowIndex) {
      var frame = frames[rowIndex * 3 + 1];
      texture.add(direction + '-idle', 0, frame.x, frame.y, frame.w, frame.h);
    });
  }

  function createActorAnimations(scene, actorKey) {
    ACTOR_DIRECTIONS.forEach(function (direction) {
      scene.anims.create({
        key: actorKey + '-walk-' + direction,
        frames: [0, 1, 2].map(function (index) {
          return { key: actorKey, frame: direction + '-' + index };
        }),
        frameRate: 10,
        repeat: -1
      });
    });
  }

  game.actors.animation = {
    createActorFrames: createActorFrames,
    createActorAnimations: createActorAnimations
  };
  }

  // actors/actor
  {
  let constants = game.constants;
  let ACTOR_DEPTH_BASE = constants.ACTOR_DEPTH_BASE;
  let ACTOR_DISPLAY_HEIGHT = constants.ACTOR_DISPLAY_HEIGHT;

  function createActor(scene, actorKey, x, y, facing, enablePhysics) {
    var actor = scene.physics.add.sprite(x, y, actorKey, facing + '-idle');
    normalizeActorDisplay(actor);
    actor.setDepth(ACTOR_DEPTH_BASE + actorFootY(actor));
    actor.actorKey = actorKey;
    actor.facing = facing;
    actor.isPlayer = Boolean(enablePhysics);
    if (actor.body) {
      configureActorBody(actor);
      actor.setCollideWorldBounds(true);
      actor.setImmovable(!actor.isPlayer);
      if (!actor.isPlayer && actor.setPushable) actor.setPushable(false);
      if (scene.walls) {
        actor.wallCollider = scene.physics.add.collider(actor, scene.walls);
      }
      registerActorColliders(scene, actor);
    }
    scene.actors.push(actor);
    return actor;
  }

  function registerActorColliders(scene, actor) {
    if (!scene.actors || !scene.physics) return;
    scene.actorColliders = scene.actorColliders || [];
    scene.actors.forEach(function (otherActor) {
      if (!otherActor || otherActor === actor || !otherActor.body) return;
      scene.actorColliders.push(scene.physics.add.collider(actor, otherActor));
    });
  }

  function normalizeActorDisplay(actor) {
    var frameWidth = actor.frame && actor.frame.width ? actor.frame.width : 1;
    var frameHeight = actor.frame && actor.frame.height ? actor.frame.height : 1;
    var displayWidth = ACTOR_DISPLAY_HEIGHT * (frameWidth / frameHeight);
    actor.setDisplaySize(displayWidth, ACTOR_DISPLAY_HEIGHT);
  }

  function configureActorBody(actor) {
    var frameWidth = actor.frame && actor.frame.width ? actor.frame.width : 1;
    var frameHeight = actor.frame && actor.frame.height ? actor.frame.height : 1;
    var bodyWidth = Math.max(20, frameWidth * 0.32);
    var bodyHeight = Math.max(18, frameHeight * 0.20);
    actor.body.setSize(bodyWidth, bodyHeight);
    actor.body.setOffset((frameWidth - bodyWidth) / 2, frameHeight - bodyHeight - 4);
  }

  function actorFootY(actor) {
    return actor.y + actor.displayHeight / 2;
  }

  function updateActorDepths(scene) {
    if (!scene.actors) return;
    scene.actors.forEach(function (actor) {
      normalizeActorDisplay(actor);
      configureActorBody(actor);
      actor.setDepth(ACTOR_DEPTH_BASE + actorFootY(actor));
    });
  }

  function faceActor(actor, direction) {
    actor.facing = direction;
    actor.anims.stop();
    actor.setFrame(direction + '-idle');
  }

  function directionToward(fromActor, toActor) {
    var dx = toActor.x - fromActor.x;
    var dy = toActor.y - fromActor.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx >= 0 ? 'right' : 'left';
    }
    return dy >= 0 ? 'down' : 'up';
  }

  function faceActorsTowardEachOther(actorA, actorB) {
    faceActor(actorA, directionToward(actorA, actorB));
    faceActor(actorB, directionToward(actorB, actorA));
  }

  function setActorKind(actor, actorKey, facing) {
    actor.actorKey = actorKey;
    actor.facing = facing || actor.facing || 'down';
    actor.anims.stop();
    actor.setTexture(actorKey, actor.facing + '-idle');
    normalizeActorDisplay(actor);
    configureActorBody(actor);
  }

  game.actors.actor = {
    createActor: createActor,
    normalizeActorDisplay: normalizeActorDisplay,
    configureActorBody: configureActorBody,
    actorFootY: actorFootY,
    updateActorDepths: updateActorDepths,
    registerActorColliders: registerActorColliders,
    faceActor: faceActor,
    directionToward: directionToward,
    faceActorsTowardEachOther: faceActorsTowardEachOther,
    setActorKind: setActorKind
  };
  }

  // systems/navigation
  {
  let NAV_COLLISION_PADDING = game.constants.NAV_COLLISION_PADDING;

  function actorNavSize(actor) {
    if (actor.body && actor.body.width && actor.body.height) {
      return {
        width: Math.max(22, actor.body.width + NAV_COLLISION_PADDING * 2),
        height: Math.max(18, actor.body.height + NAV_COLLISION_PADDING * 2)
      };
    }
    return {
      width: Math.max(22, actor.displayWidth * 0.32 + NAV_COLLISION_PADDING * 2),
      height: Math.max(18, actor.displayHeight * 0.20 + NAV_COLLISION_PADDING * 2)
    };
  }

  function actorNavBounds(actor, x, y) {
    var padding = NAV_COLLISION_PADDING;
    if (actor.body && actor.body.width && actor.body.height) {
      var bodyCenterX = actor.body.x + actor.body.width / 2;
      var bodyCenterY = actor.body.y + actor.body.height / 2;
      var offsetX = bodyCenterX - actor.x;
      var offsetY = bodyCenterY - actor.y;
      return {
        left: x + offsetX - actor.body.width / 2 - padding,
        right: x + offsetX + actor.body.width / 2 + padding,
        top: y + offsetY - actor.body.height / 2 - padding,
        bottom: y + offsetY + actor.body.height / 2 + padding
      };
    }

    var size = actorNavSize(actor);
    return {
      left: x - size.width / 2,
      right: x + size.width / 2,
      top: y - size.height / 2,
      bottom: y + size.height / 2
    };
  }

  function worldToNavCell(scene, x, y) {
    var grid = scene.navGrid;
    return {
      col: Math.floor(x / grid.tileWidth),
      row: Math.floor(y / grid.tileHeight)
    };
  }

  function navCellCenter(scene, cell) {
    var grid = scene.navGrid;
    return {
      x: (cell.col + 0.5) * grid.tileWidth,
      y: (cell.row + 0.5) * grid.tileHeight
    };
  }

  function isNavCellSolid(scene, col, row) {
    var grid = scene.navGrid;
    if (!grid || row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) return true;
    return Boolean(grid.solid[row][col]);
  }

  function isNavPointPassable(scene, actor, x, y) {
    var grid = scene.navGrid;
    if (!grid) return true;
    var bounds = actorNavBounds(actor, x, y);
    var minCell = worldToNavCell(scene, bounds.left, bounds.top);
    var maxCell = worldToNavCell(scene, bounds.right, bounds.bottom);
    for (var row = minCell.row; row <= maxCell.row; row += 1) {
      for (var col = minCell.col; col <= maxCell.col; col += 1) {
        if (isNavCellSolid(scene, col, row)) return false;
      }
    }
    return true;
  }

  function isNavCellPassable(scene, actor, cell) {
    var point = navCellCenter(scene, cell);
    return isNavPointPassable(scene, actor, point.x, point.y);
  }

  function nearestPassableCell(scene, actor, cell) {
    if (isNavCellPassable(scene, actor, cell)) return cell;
    var grid = scene.navGrid;
    if (!grid) return cell;
    var origin = {
      col: Math.max(0, Math.min(grid.cols - 1, cell.col)),
      row: Math.max(0, Math.min(grid.rows - 1, cell.row))
    };
    if (isNavCellPassable(scene, actor, origin)) return origin;
    var maxRadius = Math.max(grid.cols, grid.rows);
    for (var radius = 1; radius <= maxRadius; radius += 1) {
      for (var dy = -radius; dy <= radius; dy += 1) {
        for (var dx = -radius; dx <= radius; dx += 1) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          var candidate = {
            col: origin.col + dx,
            row: origin.row + dy
          };
          if (candidate.col < 0 || candidate.col >= grid.cols || candidate.row < 0 || candidate.row >= grid.rows) continue;
          if (isNavCellPassable(scene, actor, candidate)) return candidate;
        }
      }
    }
    return cell;
  }

  function cellKey(cell) {
    return cell.col + ',' + cell.row;
  }

  function reconstructNavPath(cameFrom, current) {
    var path = [current];
    var key = cellKey(current);
    while (cameFrom[key]) {
      current = cameFrom[key];
      path.push(current);
      key = cellKey(current);
    }
    path.reverse();
    return path;
  }

  function navScore(scores, key) {
    return Object.prototype.hasOwnProperty.call(scores, key) ? scores[key] : Infinity;
  }

  function findNavPath(scene, actor, startX, startY, endX, endY) {
    if (!scene.navGrid) {
      console.warn('Navigation grid is unavailable; refusing to move through unknown walls.');
      return [];
    }
    var start = nearestPassableCell(scene, actor, worldToNavCell(scene, startX, startY));
    var goal = nearestPassableCell(scene, actor, worldToNavCell(scene, endX, endY));
    var goalKey = cellKey(goal);
    var open = [start];
    var openKeys = {};
    var closedKeys = {};
    var cameFrom = {};
    var gScore = {};
    var fScore = {};
    var startKey = cellKey(start);
    openKeys[startKey] = true;
    gScore[startKey] = 0;
    fScore[startKey] = Math.abs(start.col - goal.col) + Math.abs(start.row - goal.row);

    while (open.length) {
      var bestIndex = 0;
      for (var i = 1; i < open.length; i += 1) {
        if (navScore(fScore, cellKey(open[i])) < navScore(fScore, cellKey(open[bestIndex]))) {
          bestIndex = i;
        }
      }
      var current = open.splice(bestIndex, 1)[0];
      var currentKey = cellKey(current);
      delete openKeys[currentKey];
      closedKeys[currentKey] = true;
      if (currentKey === goalKey) {
        return compressNavPath(scene, reconstructNavPath(cameFrom, current), startX, startY, endX, endY, actor);
      }

      [
        { col: current.col + 1, row: current.row },
        { col: current.col - 1, row: current.row },
        { col: current.col, row: current.row + 1 },
        { col: current.col, row: current.row - 1 }
      ].forEach(function (neighbor) {
        if (!isNavCellPassable(scene, actor, neighbor)) return;
        var neighborKey = cellKey(neighbor);
        if (closedKeys[neighborKey]) return;
        var tentative = navScore(gScore, currentKey) + 1;
        if (tentative >= navScore(gScore, neighborKey)) return;
        cameFrom[neighborKey] = current;
        gScore[neighborKey] = tentative;
        fScore[neighborKey] = tentative + Math.abs(neighbor.col - goal.col) + Math.abs(neighbor.row - goal.row);
        if (!openKeys[neighborKey]) {
          open.push(neighbor);
          openKeys[neighborKey] = true;
        }
      });
    }

    console.warn('No navigation path found', {
      actor: actor.actorKey,
      from: { x: startX, y: startY },
      to: { x: endX, y: endY }
    });
    return [];
  }

  function pushWaypoint(points, point) {
    var previous = points.length ? points[points.length - 1] : null;
    if (previous && Phaser.Math.Distance.Between(previous.x, previous.y, point.x, point.y) < 2) return;
    points.push(point);
  }

  function compressNavPath(scene, cells, startX, startY, endX, endY, actor) {
    if (!cells.length) return [];
    var points = [];
    var startCenter = navCellCenter(scene, cells[0]);
    if (Math.abs(startY - startCenter.y) >= 2) {
      pushWaypoint(points, { x: startX, y: startCenter.y });
    }
    pushWaypoint(points, startCenter);

    var lastDx = 0;
    var lastDy = 0;
    for (var i = 1; i < cells.length; i += 1) {
      var dx = cells[i].col - cells[i - 1].col;
      var dy = cells[i].row - cells[i - 1].row;
      if (i > 1 && (dx !== lastDx || dy !== lastDy)) {
        pushWaypoint(points, navCellCenter(scene, cells[i - 1]));
      }
      lastDx = dx;
      lastDy = dy;
    }

    var goalCenter = navCellCenter(scene, cells[cells.length - 1]);
    pushWaypoint(points, goalCenter);
    if (isNavPointPassable(scene, actor, endX, endY)) {
      if (Math.abs(endX - goalCenter.x) >= 2) {
        pushWaypoint(points, { x: endX, y: goalCenter.y });
      }
      pushWaypoint(points, { x: endX, y: endY });
    }
    return points;
  }

  function resolvePassablePoint(scene, actor, x, y) {
    if (!scene.navGrid || isNavPointPassable(scene, actor, x, y)) {
      return { x: x, y: y, adjusted: false };
    }
    var cell = nearestPassableCell(scene, actor, worldToNavCell(scene, x, y));
    var point = navCellCenter(scene, cell);
    point.adjusted = true;
    return point;
  }

  game.systems.navigation = {
    actorNavSize: actorNavSize,
    actorNavBounds: actorNavBounds,
    worldToNavCell: worldToNavCell,
    navCellCenter: navCellCenter,
    isNavCellSolid: isNavCellSolid,
    isNavPointPassable: isNavPointPassable,
    isNavCellPassable: isNavCellPassable,
    nearestPassableCell: nearestPassableCell,
    resolvePassablePoint: resolvePassablePoint,
    findNavPath: findNavPath,
    compressNavPath: compressNavPath
  };
  }

  // actors/movement
  {
  let PLAYER_SPEED = game.constants.PLAYER_SPEED;
  let navigation = game.systems.navigation;
  let findNavPath = navigation.findNavPath;
  let isNavPointPassable = navigation.isNavPointPassable;
  let resolvePassablePoint = navigation.resolvePassablePoint;
  let faceActor = game.actors.actor.faceActor;

  function suspendNpcWallCollision(actor) {
    if (!actor || actor.isPlayer || !actor.wallCollider) return null;
    var previousActive = actor.wallCollider.active;
    actor.wallCollider.active = false;
    return function restoreNpcWallCollision() {
      if (actor.wallCollider) {
        actor.wallCollider.active = previousActive;
      }
    };
  }

  function suspendActorCollisions(scene) {
    var states = (scene.actorColliders || []).filter(Boolean).map(function (collider) {
      var state = { collider: collider, active: collider.active };
      collider.active = false;
      return state;
    });
    return function restoreActorCollisions() {
      states.forEach(function (state) {
        if (state.collider) state.collider.active = state.active;
      });
    };
  }

  function walkActorTo(scene, actor, x, y, duration, options) {
    options = options || {};
    var direction = Math.abs(x - actor.x) > Math.abs(y - actor.y)
      ? (x >= actor.x ? 'right' : 'left')
      : (y >= actor.y ? 'down' : 'up');
    var distance = Phaser.Math.Distance.Between(actor.x, actor.y, x, y);
    var speed = duration > 0 ? distance / duration * 1000 : PLAYER_SPEED;
    var timeout = Math.max(260, duration + 650);
    actor.facing = direction;
    actor.anims.play(actor.actorKey + '-walk-' + direction, true);
    return game.systems.lifecycle.promise(scene, function (resolve) {
      var settled = false;
      var startedAt = scene.time.now;
      actor.scriptedMove = true;
      scene.physics.moveTo(actor, x, y, speed);

      function finish(status) {
        if (settled) return;
        settled = true;
        actor.setVelocity(0, 0);
        actor.scriptedMove = false;
        step.remove(false);
        if (!options.keepWalking) {
          faceActor(actor, direction);
        }
        resolve({ status: status || 'reached' });
      }

      var step = scene.time.addEvent({
        delay: 16,
        loop: true,
        callback: function () {
          if (!actor.active || Phaser.Math.Distance.Between(actor.x, actor.y, x, y) <= 4) {
            finish(actor.active ? 'reached' : 'inactive');
            return;
          }
          if (scene.time.now - startedAt >= timeout) {
            console.warn('Scripted actor movement stopped before target', {
              actor: actor.actorKey,
              target: { x: x, y: y },
              current: { x: actor.x, y: actor.y }
            });
            finish('timeout');
          }
        }
      });
      return function () {
        step.remove(false);
        if (game.systems.lifecycle.signal(scene).aborted && actor.active) {
          actor.setVelocity(0, 0);
          actor.scriptedMove = false;
        }
      };
    });
  }

  async function walkActorDirectToTarget(scene, actor, x, y, speed) {
    var restoreWallCollision = suspendNpcWallCollision(actor);
    var distance = Phaser.Math.Distance.Between(actor.x, actor.y, x, y);
    var moveSpeed = speed || PLAYER_SPEED;
    try {
      return await walkActorTo(
        scene,
        actor,
        x,
        y,
        Math.max(80, distance / moveSpeed * 1000)
      );
    } finally {
      if (restoreWallCollision) restoreWallCollision();
    }
  }

  function isNavSegmentPassable(scene, actor, fromX, fromY, toX, toY) {
    var distance = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
    var steps = Math.max(1, Math.ceil(distance / 8));
    for (var i = 0; i <= steps; i += 1) {
      var t = i / steps;
      var x = fromX + (toX - fromX) * t;
      var y = fromY + (toY - fromY) * t;
      if (!isNavPointPassable(scene, actor, x, y)) {
        return false;
      }
    }
    return true;
  }

  async function walkActorToOrthogonalPoint(scene, actor, point, moveSpeed, keepWalking) {
    var dx = Math.abs(point.x - actor.x);
    var dy = Math.abs(point.y - actor.y);
    if (dx >= 2 && dy >= 2) {
      var horizontalFirst = { x: point.x, y: actor.y };
      var verticalFirst = { x: actor.x, y: point.y };
      var corner = null;
      if (
        isNavSegmentPassable(scene, actor, actor.x, actor.y, horizontalFirst.x, horizontalFirst.y) &&
        isNavSegmentPassable(scene, actor, horizontalFirst.x, horizontalFirst.y, point.x, point.y)
      ) {
        corner = horizontalFirst;
      } else if (
        isNavSegmentPassable(scene, actor, actor.x, actor.y, verticalFirst.x, verticalFirst.y) &&
        isNavSegmentPassable(scene, actor, verticalFirst.x, verticalFirst.y, point.x, point.y)
      ) {
        corner = verticalFirst;
      }
      if (!corner) {
        console.warn('Refusing diagonal scripted move without a passable orthogonal corner', {
          actor: actor.actorKey,
          from: { x: actor.x, y: actor.y },
          to: point
        });
        return { status: 'blocked' };
      }
      var cornerResult = await walkActorToOrthogonalPoint(scene, actor, corner, moveSpeed, true);
      if (cornerResult && cornerResult.status !== 'reached') {
        return cornerResult;
      }
    }
    var distance = Phaser.Math.Distance.Between(actor.x, actor.y, point.x, point.y);
    if (distance < 2) return { status: 'reached' };
    if (!isNavSegmentPassable(scene, actor, actor.x, actor.y, point.x, point.y)) {
      console.warn('Refusing scripted move through a blocked navigation segment', {
        actor: actor.actorKey,
        from: { x: actor.x, y: actor.y },
        to: point
      });
      return { status: 'blocked' };
    }
    return walkActorTo(scene, actor, point.x, point.y, Math.max(80, distance / moveSpeed * 1000), {
      keepWalking: keepWalking
    });
  }


  async function walkActorToTarget(scene, actor, x, y, speed) {
    var restoreWallCollision = suspendNpcWallCollision(actor);
    try {
      if (scene.navGrid && !isNavPointPassable(scene, actor, actor.x, actor.y)) {
        var start = resolvePassablePoint(scene, actor, actor.x, actor.y);
        console.warn('Actor started inside collision; moved to nearest passable point', {
          actor: actor.actorKey,
          from: { x: actor.x, y: actor.y },
          to: { x: start.x, y: start.y }
        });
        actor.setVelocity(0, 0);
        actor.setPosition(start.x, start.y);
        if (actor.body && actor.body.reset) {
          actor.body.reset(start.x, start.y);
        }
      }
      var target = resolvePassablePoint(scene, actor, x, y);
      if (target.adjusted) {
        console.warn('Navigation target was inside collision; using nearest passable point', {
          actor: actor.actorKey,
          requested: { x: x, y: y },
          target: { x: target.x, y: target.y }
        });
      }
      var moveSpeed = speed || PLAYER_SPEED;
      for (var attempt = 0; attempt < 4; attempt += 1) {
        var waypoints = findNavPath(scene, actor, actor.x, actor.y, target.x, target.y);
        if (!waypoints.length && Phaser.Math.Distance.Between(actor.x, actor.y, target.x, target.y) > 4) {
          console.warn('No scripted actor path available', {
            actor: actor.actorKey,
            current: { x: actor.x, y: actor.y },
            target: { x: target.x, y: target.y }
          });
          break;
        }
        var shouldReplan = false;
        for (var i = 0; i < waypoints.length; i += 1) {
          var point = waypoints[i];
          var result = await walkActorToOrthogonalPoint(scene, actor, point, moveSpeed, i < waypoints.length - 1);
          if (result && (result.status === 'timeout' || result.status === 'blocked')) {
            shouldReplan = true;
            break;
          }
        }
        if (!shouldReplan) return;
        console.warn('Replanning scripted actor path after blocked segment', {
          actor: actor.actorKey,
          attempt: attempt + 1,
          current: { x: actor.x, y: actor.y },
          target: { x: target.x, y: target.y }
        });
      }
      actor.setVelocity(0, 0);
      faceActor(actor, actor.facing || 'down');
    } finally {
      if (restoreWallCollision) restoreWallCollision();
    }
  }

  game.actors.movement = {
    suspendActorCollisions: suspendActorCollisions,
    walkActorTo: walkActorTo,
    walkActorDirectToTarget: walkActorDirectToTarget,
    walkActorToOrthogonalPoint: walkActorToOrthogonalPoint,
    walkActorToTarget: walkActorToTarget
  };
  }
}(window));

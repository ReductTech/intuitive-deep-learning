(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  var NAV_COLLISION_PADDING = game.constants.NAV_COLLISION_PADDING;

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

  game.systems = game.systems || {};
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
}(window));

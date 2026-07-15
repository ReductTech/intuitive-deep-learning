(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  var constants = game.constants;
  var SCENE_WIDTH = constants.SCENE_WIDTH;
  var SCENE_HEIGHT = constants.SCENE_HEIGHT;
  var OVERLAY_COLLISION_TILE = constants.OVERLAY_COLLISION_TILE;
  var OVERLAY_ALPHA_THRESHOLD = constants.OVERLAY_ALPHA_THRESHOLD;
  var OVERLAY_SOLID_COVERAGE = constants.OVERLAY_SOLID_COVERAGE;

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

  game.systems = game.systems || {};
  game.systems.collision = {
    createOverlayCollision: createOverlayCollision
  };
}(window));

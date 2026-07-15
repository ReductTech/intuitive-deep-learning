(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  var ACTOR_DIRECTIONS = game.constants.ACTOR_DIRECTIONS;

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

  game.actors = game.actors || {};
  game.actors.animation = {
    createActorFrames: createActorFrames,
    createActorAnimations: createActorAnimations
  };
}(window));

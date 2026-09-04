(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  var PLAYER_SPEED = game.constants.PLAYER_SPEED;
  var navigation = game.systems.navigation;
  var findNavPath = navigation.findNavPath;
  var isNavPointPassable = navigation.isNavPointPassable;
  var resolvePassablePoint = navigation.resolvePassablePoint;
  var faceActor = game.actors.actor.faceActor;

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
    return new Promise(function (resolve) {
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

  game.actors = game.actors || {};
  game.actors.movement = {
    suspendActorCollisions: suspendActorCollisions,
    walkActorTo: walkActorTo,
    walkActorDirectToTarget: walkActorDirectToTarget,
    walkActorToOrthogonalPoint: walkActorToOrthogonalPoint,
    walkActorToTarget: walkActorToTarget
  };
}(window));

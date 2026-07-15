(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  var constants = game.constants;
  var ACTOR_DEPTH_BASE = constants.ACTOR_DEPTH_BASE;
  var ACTOR_DISPLAY_HEIGHT = constants.ACTOR_DISPLAY_HEIGHT;

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

  game.actors = game.actors || {};
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
}(window));

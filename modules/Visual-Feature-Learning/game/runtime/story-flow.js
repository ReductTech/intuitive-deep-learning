(function (global) {
  'use strict';
  const game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  game.cutscene = game.cutscene || {};

  // cutscene/tracks
  {
  let assets = game.assets;
  let actorApi = game.actors.actor;
  let movement = game.actors.movement;
  let dialogue = game.ui.dialogue;
  let CUTSCENE_POINTS = assets.CUTSCENE_POINTS;
  let CUTSCENE_SCENES = assets.CUTSCENE_SCENES || {};
  let faceActor = actorApi.faceActor;
  let walkActorDirectToTarget = movement.walkActorDirectToTarget;
  let walkActorToTarget = movement.walkActorToTarget;
  let wait = dialogue.wait;

  function cutsceneTrack(sceneId, actorId) {
    var sceneConfig = CUTSCENE_SCENES[sceneId];
    if (!sceneConfig || !Array.isArray(sceneConfig.tracks)) return null;
    return sceneConfig.tracks.find(function (track) {
      return track.actorId === actorId;
    }) || null;
  }

  function cutsceneSpeed(sceneId, actorId, fallback) {
    var track = cutsceneTrack(sceneId, actorId);
    var speed = track ? Number(track.speed) : NaN;
    return Number.isFinite(speed) && speed > 0 ? speed : fallback;
  }

  function cutsceneFacing(sceneId, actorId, fallback) {
    var track = cutsceneTrack(sceneId, actorId);
    return track && track.facing ? track.facing : fallback;
  }

  function faceActorFromTrack(actor, sceneId, actorId, fallback) {
    faceActor(actor, cutsceneFacing(sceneId, actorId, fallback));
  }

  async function walkActorAlongTrack(scene, actor, sceneId, actorId, fallbackPoint, fallbackSpeed, direct) {
    var track = cutsceneTrack(sceneId, actorId);
    var waypoints = track && Array.isArray(track.waypoints) ? track.waypoints : [];
    var steps = waypoints.map(function (waypoint) {
      var point = CUTSCENE_POINTS[waypoint.point];
      if (!point) return null;
      return {
        x: point.x,
        y: point.y,
        speed: Number(waypoint.speed) > 0 ? Number(waypoint.speed) : cutsceneSpeed(sceneId, actorId, fallbackSpeed),
        wait: Math.max(0, Number(waypoint.wait) || 0)
      };
    }).filter(Boolean);
    if (!steps.length && fallbackPoint) {
      steps.push({
        x: fallbackPoint.x,
        y: fallbackPoint.y,
        speed: cutsceneSpeed(sceneId, actorId, fallbackSpeed),
        wait: 0
      });
    }
    for (var index = 0; index < steps.length; index += 1) {
      var step = steps[index];
      if (direct) {
        await walkActorDirectToTarget(scene, actor, step.x, step.y, step.speed);
      } else {
        await walkActorToTarget(scene, actor, step.x, step.y, step.speed);
      }
      if (step.wait > 0) await wait(scene, step.wait);
    }
  }


  game.cutscene.tracks = { cutsceneTrack: cutsceneTrack, cutsceneSpeed: cutsceneSpeed, cutsceneFacing: cutsceneFacing, faceActorFromTrack: faceActorFromTrack, walkActorAlongTrack: walkActorAlongTrack };
  }

  // cutscene/opening
  {
  let constants = game.constants;
  let assets = game.assets;
  let actorApi = game.actors.actor;
  let movement = game.actors.movement;
  let dialogue = game.ui.dialogue;
  let SCENE_WIDTH = constants.SCENE_WIDTH;
  let SCENE_HEIGHT = constants.SCENE_HEIGHT;
  let UI_DEPTH = constants.UI_DEPTH;
  let CUTSCENE_POINTS = assets.CUTSCENE_POINTS;
  let INSPECTION_ACTOR_KEYS = assets.INSPECTION_ACTOR_KEYS;
  let createActor = actorApi.createActor;
  let faceActor = actorApi.faceActor;
  let faceActorsTowardEachOther = actorApi.faceActorsTowardEachOther;
  let setActorKind = actorApi.setActorKind;
  let suspendActorCollisions = movement.suspendActorCollisions;
  let showDialogueLines = dialogue.showDialogueLines;
  let wait = dialogue.wait;

  let story = game.cutscene.story;
  let tracks = game.cutscene.tracks;
  let presentation = game.cutscene.presentation;
  let showRelatedVideos = presentation.showRelatedVideos;
  let cutsceneFacing = tracks.cutsceneFacing;
  let faceActorFromTrack = tracks.faceActorFromTrack;
  let walkActorAlongTrack = tracks.walkActorAlongTrack;
  let showOutcomeTitle = presentation.showOutcomeTitle;
  let showKnockCascade = presentation.showKnockCascade;
  let showMovementHint = presentation.showMovementHint;
  let hideMovementHint = presentation.hideMovementHint;
  let showInspectionAlert = presentation.showInspectionAlert;
  let showWantedPoster = presentation.showWantedPoster;
  let fadeToBlack = presentation.fadeToBlack;
  let fadeFromBlack = presentation.fadeFromBlack;
  let runDisguiseTeaching = game.cutscene.teaching.runDisguiseTeaching;

  let inspectionCast = [
    { id: 'jpOfficer', kind: 'jpOfficier', entry: 'officerEntry', inspect: 'officerInspect', exit: 'officerExit' },
    { id: 'jpSoldierA', kind: 'jpSoldier', entry: 'soldierLeftEntry', inspect: 'soldierLeftInspect', exit: 'soldierLeftExit' },
    { id: 'jpSoldierB', kind: 'jpSoldier', entry: 'soldierCenterEntry', inspect: 'soldierCenterInspect', exit: 'soldierCenterExit' },
    { id: 'jpSoldierC', kind: 'jpSoldier', entry: 'soldierRightEntry', inspect: 'soldierRightInspect', exit: 'soldierRightExit' }
  ];

  function moveInspectionCast(scene, sceneId, destination, speed, direct) {
    return Promise.all(inspectionCast.map(function (member) {
      return walkActorAlongTrack(scene, scene[member.id], sceneId, member.id, CUTSCENE_POINTS[member[destination]], speed, direct);
    }));
  }

  async function turnActorInPlace(scene, actor, finalFacing) {
    var directions = ['down', 'left', 'up', 'right'];
    var startIndex = Math.max(0, directions.indexOf(actor.facing));
    for (var step = 1; step <= directions.length; step += 1) {
      faceActor(actor, directions[(startIndex + step) % directions.length]);
      await wait(scene, 210);
    }
    faceActor(actor, finalFacing || actor.facing || 'down');
  }

  async function startOpeningCutscene(scene) {
    scene.cutsceneActive = true;
    faceActorFromTrack(scene.player, 'opening-spawn', 'player', 'up');
    faceActorFromTrack(scene.civil1, 'opening-spawn', 'civil1', 'right');

    await fadeToBlack(scene, 0);
    var knockLayer = await showKnockCascade(scene);
    scene.tweens.add({
      targets: knockLayer,
      alpha: 0,
      duration: 900,
      ease: 'Sine.easeIn',
      onComplete: function () {
        if (knockLayer && knockLayer.active) knockLayer.destroy(true);
      }
    });
    await showDialogueLines(scene, story.password);
    scene.dialogue.hide();
    if (knockLayer && knockLayer.active) knockLayer.destroy(true);
    await fadeFromBlack(scene, 1900);
    await Promise.all([
      walkActorAlongTrack(
        scene,
        scene.player,
        'guest-approach',
        'player',
        CUTSCENE_POINTS['guest-approach-player-path'],
        260
      ),
      walkActorAlongTrack(
        scene,
        scene.civil1,
        'guest-approach',
        'civil1',
        CUTSCENE_POINTS.doorGuest,
        250
      )
    ]);
    faceActorsTowardEachOther(scene.civil1, scene.player);
    await showDialogueLines(scene, story.introduction);
    faceActorsTowardEachOther(scene.civil1, scene.player);
    await showDialogueLines(scene, [story.dresserInvitation]);
    scene.dialogue.hide();
    scene.dresserQuestActive = true;
    scene.dresserTriggered = false;
    scene.dresserTrigger.setVisible(true);
    scene.cutsceneActive = false;
    showMovementHint(scene);
    await walkActorAlongTrack(
      scene,
      scene.civil1,
      'clothes-rack',
      'civil1',
      CUTSCENE_POINTS.clothesRack,
      250
    );
    faceActorFromTrack(scene.civil1, 'clothes-rack', 'civil1', 'right');
  }

  async function startDresserCutscene(scene) {
    scene.dresserTriggered = true;
    scene.dresserQuestActive = false;
    scene.cutsceneActive = true;
    scene.dresserTrigger.setVisible(false);
    hideMovementHint(scene);
    if (CUTSCENE_POINTS.dresserPlayer) {
      await walkActorAlongTrack(
        scene,
        scene.player,
        'dresser-rendezvous',
        'player',
        CUTSCENE_POINTS.dresserPlayer,
        260
      );
    }
    faceActorFromTrack(scene.player, 'dresser-rendezvous', 'player', 'left');
    await walkActorAlongTrack(
      scene,
      scene.civil1,
      'dresser-rendezvous',
      'civil1',
      {
        x: scene.player.x + CUTSCENE_POINTS.dresserPartnerOffset.x,
        y: scene.player.y + CUTSCENE_POINTS.dresserPartnerOffset.y
      },
      320
    );
    faceActorsTowardEachOther(scene.civil1, scene.player);
    await showDialogueLines(scene, [story.dresserReady]);
    scene.dialogue.hide();
    await fadeToBlack(scene, 650);
    scene.disguiseEditor.show();
  }

  function clearInspectionActors(scene) {
    INSPECTION_ACTOR_KEYS.forEach(function (key) {
      if (scene[key]) {
        var index = scene.actors.indexOf(scene[key]);
        if (index >= 0) scene.actors.splice(index, 1);
        scene[key].destroy();
        scene[key] = null;
      }
    });
  }

  async function startInspectionSequence(scene) {
    scene.cutsceneActive = true;
    scene.dialogue.hide();
    clearInspectionActors(scene);
    setActorKind(scene.player, scene.disguiseActorKey || 'balujun', 'down');
    placeActorAt(scene.player, CUTSCENE_POINTS.dresserPlayer);
    await showInspectionAlert(scene);
    await fadeFromBlack(scene, 650);

    scene.player.setVelocity(0, 0);
    await Promise.all([
      walkActorAlongTrack(
        scene,
        scene.player,
        'inspection-lineup',
        'player',
        CUTSCENE_POINTS.inspectionPlayer,
        260
      ),
      walkActorAlongTrack(
        scene,
        scene.civil1,
        'inspection-lineup',
        'civil1',
        CUTSCENE_POINTS.inspectionCivil,
        260
      )
    ]);
    faceActorFromTrack(scene.player, 'inspection-lineup', 'player', 'down');
    faceActorFromTrack(scene.civil1, 'inspection-lineup', 'civil1', 'down');

    inspectionCast.forEach(function (member) {
      var point = CUTSCENE_POINTS[member.entry];
      scene[member.id] = createActor(scene, member.kind, point.x, point.y, 'up', false);
    });
    var restoreInspectionCollisions = suspendActorCollisions(scene);
    try {
      await moveInspectionCast(scene, 'inspection-entry', 'inspect', 230, true);
    } finally {
      restoreInspectionCollisions();
    }
    inspectionCast.forEach(function (member) { faceActorFromTrack(scene[member.id], 'inspection-entry', member.id, 'up'); });
    await showDialogueLines(scene, story.inspectionGreeting);
    await showWantedPoster(scene);
    await showDialogueLines(scene, [story.notSeen]);
    await showDialogueLines(scene, [story.questionPlayer]);
    await showDialogueLines(scene, [story.playerReply]);
    await showDialogueLines(scene, [story.officerChallenge]);
    await showDialogueLines(scene, [story.playerDefense]);
    await showDialogueLines(scene, [story.turnCivil]);
    scene.dialogue.hide();
    await turnActorInPlace(
      scene,
      scene.civil1,
      cutsceneFacing('inspection-lineup', 'civil1', 'down')
    );
    await showDialogueLines(scene, [story.turnPlayer]);
    scene.dialogue.hide();
    await turnActorInPlace(
      scene,
      scene.player,
      cutsceneFacing('inspection-lineup', 'player', 'down')
    );

    var result = await runDisguiseTeaching(scene);
    if (result.passed) {
      await showDialogueLines(scene, story.inspectionPassed);
      await moveInspectionCast(scene, 'inspection-exit', 'exit', 250);
      clearInspectionActors(scene);
      await showDialogueLines(scene, story.farewell);
      scene.dialogue.hide();
      await showOutcomeTitle(scene, true);
      showRelatedVideos();
      scene.cutsceneActive = false;
      scene.inspectionRunning = false;
      return;
    } else {
      await showDialogueLines(scene, [story.arrest]);
      clearInspectionActors(scene);
      scene.dialogue.hide();
      await showOutcomeTitle(scene, false);
      await restartFromDisguiseCheckpoint(scene);
    }
  }

  async function restartFromDisguiseCheckpoint(scene) {
    scene.dialogue.hide();
    clearInspectionActors(scene);
    await fadeToBlack(scene, 420);
    setActorKind(scene.player, 'balujun', 'down');
    placeActorAt(scene.player, CUTSCENE_POINTS.dresserPlayer);
    placeActorAt(scene.civil1, {
      x: CUTSCENE_POINTS.dresserPlayer.x + CUTSCENE_POINTS.dresserPartnerOffset.x,
      y: CUTSCENE_POINTS.dresserPlayer.y + CUTSCENE_POINTS.dresserPartnerOffset.y
    });
    scene.disguiseEditor.reset();
    scene.disguiseEditor.show();
    scene.cutsceneActive = true;
    scene.inspectionRunning = false;
  }

  function placeActorAt(actor, point) {
    if (!actor || !point) return;
    actor.setVelocity(0, 0);
    actor.setPosition(point.x, point.y);
    if (actor.body && actor.body.reset) {
      actor.body.reset(point.x, point.y);
    }
  }

  game.cutscene.opening = {
    startOpeningCutscene: function (scene) { return game.systems.lifecycle.run(scene, 'opening', function () { return startOpeningCutscene(scene); }); },
    startDresserCutscene: function (scene) { return game.systems.lifecycle.run(scene, 'dresser', function () { return startDresserCutscene(scene); }); },
    clearInspectionActors: clearInspectionActors,
    startInspectionSequence: function (scene) {
      return game.systems.lifecycle.run(scene, 'inspection', function () {
        return startInspectionSequence(scene);
      }, async function () {
        // A failed model request returns to the existing editor with the disguise intact.
        clearInspectionActors(scene);
        scene.dialogue.hide();
        placeActorAt(scene.player, CUTSCENE_POINTS.dresserPlayer);
        scene.disguiseSimilarity = null;
        scene.disguiseSimilarityPromise = null;
        scene.disguiseEditor.showUnavailable();
        await fadeFromBlack(scene, 450);
        scene.inspectionRunning = false;
      });
    },
    runDisguiseTeaching: runDisguiseTeaching,
    fadeToBlack: fadeToBlack,
    fadeFromBlack: fadeFromBlack
  };
  }
}(window));

(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  var constants = game.constants;
  var assets = game.assets;
  var animation = game.actors.animation;
  var actorApi = game.actors.actor;
  var collision = game.systems.collision;
  var dialogue = game.ui.dialogue;
  var editor = game.disguise.editor;
  var opening = game.cutscene.opening;
  var SCENE_WIDTH = constants.SCENE_WIDTH;
  var SCENE_HEIGHT = constants.SCENE_HEIGHT;
  var ASSET_ROOT = constants.ASSET_ROOT;
  var OVERLAY_ASSET = constants.OVERLAY_ASSET;
  var PLAYER_ACTOR = constants.PLAYER_ACTOR;
  var PLAYER_SPEED = constants.PLAYER_SPEED;
  var OVERLAY_DEPTH = constants.OVERLAY_DEPTH;
  var VIGNETTE_DEPTH = constants.VIGNETTE_DEPTH;
  var TRIGGER_DEPTH = constants.TRIGGER_DEPTH;
  var DRESSER_TRIGGER = constants.DRESSER_TRIGGER;
  var DISGUISE_ICON_ROOT = constants.DISGUISE_ICON_ROOT;
  var DISGUISE_TEMPLATES = assets.DISGUISE_TEMPLATES;
  var DISGUISE_TOOL_ICONS = assets.DISGUISE_TOOL_ICONS;
  var DISGUISE_DOTS = assets.DISGUISE_DOTS;
  var ACTORS = assets.ACTORS;
  var CUTSCENE_POINTS = assets.CUTSCENE_POINTS;
  var createActorFrames = animation.createActorFrames;
  var createActorAnimations = animation.createActorAnimations;
  var createActor = actorApi.createActor;
  var updateActorDepths = actorApi.updateActorDepths;
  var createOverlayCollision = collision.createOverlayCollision;
  var createDialogueBox = dialogue.createDialogueBox;
  var createDisguiseEditor = editor.createDisguiseEditor;
  var startOpeningCutscene = opening.startOpeningCutscene;
  var startDresserCutscene = opening.startDresserCutscene;

  function createPhaserScene(host) {
    return new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: SCENE_WIDTH,
      height: SCENE_HEIGHT,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      backgroundColor: '#050403',
      antialias: true,
      pixelArt: false,
      roundPixels: false,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [Act3Scene]
    });
  }

  class Act3Scene extends Phaser.Scene {
    constructor() {
      super('Act3Scene');
    }

    preload() {
      this.load.image('room', ASSET_ROOT + 'map.png');
      this.load.image('overlay', ASSET_ROOT + OVERLAY_ASSET);
      this.load.image('anchorFace', ASSET_ROOT + 'anchor_face.png');
      this.load.image('wantedPoster', ASSET_ROOT + 'wanted.png');
      Object.keys(DISGUISE_TEMPLATES).forEach(function (templateKey) {
        var template = DISGUISE_TEMPLATES[templateKey];
        this.load.image(template.textureKey, ASSET_ROOT + template.asset);
        Object.keys(template.beard || {}).forEach(function (variantKey) {
          var variant = template.beard[variantKey];
          this.load.image(variant.textureKey, ASSET_ROOT + variant.asset);
        }, this);
      }, this);
      Object.keys(DISGUISE_TOOL_ICONS).forEach(function (iconKey) {
        var icon = DISGUISE_TOOL_ICONS[iconKey];
        this.load.svg(icon.textureKey, ASSET_ROOT + DISGUISE_ICON_ROOT + icon.asset, {
          width: 128,
          height: 128
        });
      }, this);
      DISGUISE_DOTS.forEach(function (dot) {
        this.load.image(dot.textureKey, ASSET_ROOT + dot.asset);
      }, this);
      Object.keys(ACTORS).forEach(function (actorKey) {
        this.load.image(actorKey, ASSET_ROOT + ACTORS[actorKey].asset);
        this.load.json(actorKey + 'Bounds', ASSET_ROOT + ACTORS[actorKey].bounds);
      }, this);
    }

    create() {
      Object.keys(ACTORS).forEach(function (actorKey) {
        createActorFrames(this, actorKey);
        createActorAnimations(this, actorKey);
      }, this);

      var room = this.add.image(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, 'room');
      room.setDisplaySize(SCENE_WIDTH, SCENE_HEIGHT);
      room.setDepth(0);

      this.walls = this.physics.add.staticGroup();
      createOverlayCollision(this);
      this.actors = [];

      this.player = createActor(this, PLAYER_ACTOR, CUTSCENE_POINTS.playerSpawn.x, CUTSCENE_POINTS.playerSpawn.y, 'up', true);
      this.player.setCollideWorldBounds(true);
      this.playerFacing = 'up';
      this.civil1 = createActor(this, 'civil1', CUTSCENE_POINTS.civilSpawn.x, CUTSCENE_POINTS.civilSpawn.y, 'down', false);

      this.keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D
      });
      this.input.keyboard.addCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);

      var overlay = this.add.image(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, 'overlay');
      overlay.setDisplaySize(SCENE_WIDTH, SCENE_HEIGHT);
      overlay.setDepth(OVERLAY_DEPTH);

      var vignette = this.add.graphics();
      vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.12, 0.12, 0.55, 0.55);
      vignette.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
      vignette.setDepth(VIGNETTE_DEPTH);

      this.dialogue = createDialogueBox(this);
      this.dresserTrigger = createDresserTrigger(this);
      this.disguiseEditor = createDisguiseEditor(this);
      startOpeningCutscene(this);
    }

    update() {
      updatePlayer(this);
      updateActorDepths(this);
      updateDresserTrigger(this);
    }
  }

  function createDresserTrigger(scene) {
    var point = dresserTriggerPoint();
    var marker = scene.add.container(point.x, point.y).setDepth(TRIGGER_DEPTH).setVisible(false);
    var ring = scene.add.circle(0, 0, 28, 0xf3c36f, 0.18);
    ring.setStrokeStyle(4, 0xffd27a, 0.86);
    var dot = scene.add.circle(0, 0, 7, 0xfff0b8, 0.95);
    marker.add([ring, dot]);
    scene.tweens.add({
      targets: marker,
      scaleX: 1.18,
      scaleY: 1.18,
      alpha: 0.58,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    return marker;
  }

  function updateDresserTrigger(scene) {
    if (!scene.dresserQuestActive || scene.dresserTriggered || scene.cutsceneActive || !scene.player) return;
    var point = dresserTriggerPoint();
    var dx = scene.player.x - point.x;
    var dy = scene.player.y - point.y;
    if (Math.sqrt(dx * dx + dy * dy) <= DRESSER_TRIGGER.radius) {
      startDresserCutscene(scene);
    }
  }

  function dresserTriggerPoint() {
    return CUTSCENE_POINTS.dresserPlayer || DRESSER_TRIGGER;
  }

  function updatePlayer(scene) {
    if (!scene.player || !scene.keys) return;
    if (scene.cutsceneActive) {
      if (!scene.player.scriptedMove) {
        scene.player.setVelocity(0, 0);
      }
      return;
    }

    var velocityX = 0;
    var velocityY = 0;
    var keys = scene.keys;

    if (keys.left.isDown) velocityX -= PLAYER_SPEED;
    if (keys.right.isDown) velocityX += PLAYER_SPEED;
    if (keys.up.isDown) velocityY -= PLAYER_SPEED;
    if (keys.down.isDown) velocityY += PLAYER_SPEED;

    if (velocityX && velocityY) {
      var horizontalTime = Math.max(keys.left.timeDown || 0, keys.right.timeDown || 0);
      var verticalTime = Math.max(keys.up.timeDown || 0, keys.down.timeDown || 0);
      if (horizontalTime >= verticalTime) velocityY = 0;
      else velocityX = 0;
    }

    scene.player.setVelocity(velocityX, velocityY);

    if (velocityY < 0) {
      scene.playerFacing = 'up';
      scene.player.anims.play(scene.player.actorKey + '-walk-up', true);
    } else if (velocityY > 0) {
      scene.playerFacing = 'down';
      scene.player.anims.play(scene.player.actorKey + '-walk-down', true);
    } else if (velocityX < 0) {
      scene.playerFacing = 'left';
      scene.player.anims.play(scene.player.actorKey + '-walk-left', true);
    } else if (velocityX > 0) {
      scene.playerFacing = 'right';
      scene.player.anims.play(scene.player.actorKey + '-walk-right', true);
    } else {
      scene.player.anims.stop();
      scene.player.setFrame((scene.playerFacing || 'down') + '-idle');
    }
  }

  game.scene = game.scene || {};
  game.scene.Act3Scene = Act3Scene;
  game.scene.createPhaserScene = createPhaserScene;
}(window));

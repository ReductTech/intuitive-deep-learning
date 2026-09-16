(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};

  var DISGUISE_TEMPLATES = {
    normal: {
      label: '不变',
      textureKey: 'posFaceNormal',
      asset: 'pos_face_normal.png',
      beard: {
        h1: { textureKey: 'posFaceNormalH1', asset: 'pos_face_normal_h1.png' },
        h2: { textureKey: 'posFaceNormalH2', asset: 'pos_face_h2.png' }
      },
      actorKey: 'balujun'
    },
    farmer: {
      label: '农民',
      textureKey: 'posFaceFarmer',
      asset: 'pos_face_farmer.png',
      beard: {
        h1: { textureKey: 'posFaceFarmerH1', asset: 'pos_face_farmer_h1.png' },
        h2: { textureKey: 'posFaceFarmerH2', asset: 'pos_face_farmer_h2.png' }
      },
      actorKey: 'balujun'
    },
    trader: {
      label: '商人',
      textureKey: 'posFaceTrader',
      asset: 'pos_face_trader.png',
      beard: {
        h1: { textureKey: 'posFaceTraderH1', asset: 'pos_face_trader_h1.png' },
        h2: { textureKey: 'posFaceTraderH2', asset: 'pos_face_trader_h2.png' }
      },
      actorKey: 'trader'
    },
    teacher: {
      label: '老师',
      textureKey: 'posFaceTeacher',
      asset: 'pos_face_teacher.png',
      beard: {
        h1: { textureKey: 'posFaceTeacherH1', asset: 'pos_face_teacher_h1.png' },
        h2: { textureKey: 'posFaceTeacherH2', asset: 'pos_face_teacher_h2.png' }
      },
      actorKey: 'teacher'
    }
  };
  var DISGUISE_TEMPLATE_ORDER = ['normal', 'farmer', 'trader', 'teacher'];
  var DISGUISE_TOOL_ICONS = {
    identity: { textureKey: 'act3IconIdentity', asset: 'id_logo.svg' },
    moustache: { textureKey: 'act3IconMoustache', asset: 'huzi.svg' },
    mole: { textureKey: 'act3IconMole', asset: 'zhi.svg' },
    makeup: { textureKey: 'act3IconMakeup', asset: 'face_mod.svg' },
    lipstick: { textureKey: 'act3IconLipstick', asset: 'kouhong.svg' },
    eyebrow: { textureKey: 'act3IconEyebrow', asset: 'meimao.svg' }
  };
  var DISGUISE_DOTS = [
    { textureKey: 'act3Dot1', asset: 'dots/ct1.png' },
    { textureKey: 'act3Dot2', asset: 'dots/ct2.png' },
    { textureKey: 'act3Dot3', asset: 'dots/ct3.png' },
    { textureKey: 'act3Dot4', asset: 'dots/ct4.png' },
    { textureKey: 'act3Dot5', asset: 'dots/ct5.png' },
    { textureKey: 'act3Dot6', asset: 'dots/ct6.png' }
  ];
  var BRUSH_KINDS = [
    { key: 'browPencil', label: '眉笔' },
    { key: 'eyeliner', label: '眼线笔' },
    { key: 'powderPuff', label: '粉扑' },
    { key: 'makeupBrush', label: '化妆刷' }
  ];
  var BRUSH_PALETTE_COLORS = [
    { fill: 0x241108, css: 'rgba(36, 17, 8, 0.68)' },
    { fill: 0x4a2a18, css: 'rgba(74, 42, 24, 0.62)' },
    { fill: 0x80241e, css: 'rgba(128, 36, 30, 0.58)' },
    { fill: 0x965236, css: 'rgba(150, 82, 54, 0.42)' },
    { fill: 0xb76b4c, css: 'rgba(183, 107, 76, 0.36)' },
    { fill: 0x99703f, css: 'rgba(153, 112, 63, 0.32)' },
    { fill: 0x5d4638, css: 'rgba(93, 70, 56, 0.50)' },
    { fill: 0x1b1713, css: 'rgba(27, 23, 19, 0.78)' }
  ];
var CUTSCENE_POINTS = {
  playerSpawn: { x: 731, y: 945 },
  civilSpawn: { x: 322, y: 523 },
  doorGuest: { x: 735, y: 686 },
  clothesRack: { x: 478, y: 489 },
  dresserPlayer: { x: 419, y: 415 },
  dresserPartnerOffset: { x: 92, y: 6 },
  inspectionPlayer: { x: 659, y: 404 },
  inspectionCivil: { x: 787, y: 404 },
  officerEntry: { x: 731, y: 945 },
  soldierLeftEntry: { x: 731, y: 945 },
  soldierCenterEntry: { x: 731, y: 945 },
  soldierRightEntry: { x: 731, y: 945 },
  officerColumn: { x: 732, y: 498 },
  soldierLeftColumn: { x: 414, y: 513 },
  soldierCenterColumn: { x: 672, y: 596 },
  soldierRightColumn: { x: 953, y: 688 },
  officerInspect: { x: 749, y: 638 },
  soldierLeftInspect: { x: 592, y: 688 },
  soldierCenterPatrolLeft: { x: 650, y: 940 },
  soldierCenterPatrolRight: { x: 828, y: 940 },
  soldierRightInspect: { x: 847, y: 611 },
  officerExit: { x: 708, y: 972 },
  soldierLeftExit: { x: 709, y: 1042 },
  soldierCenterExit: { x: 745, y: 933 },
  soldierRightExit: { x: 774, y: 1246 }
};
  var INSPECTION_ACTOR_KEYS = ['jpOfficer', 'jpSoldierA', 'jpSoldierB', 'jpSoldierC'];
  var ACTORS = {
    balujun: {
      asset: 'balujun_male_civ.png',
      bounds: 'balujun_male_civ.bounds.json',
      scale: 1
    },
    civil1: {
      asset: 'civil_2.png',
      bounds: 'civil_2.bounds.json',
      scale: 1
    },
    jpOfficier: {
      asset: 'jp_officier.png',
      bounds: 'jp_officier.bounds.json',
      scale: 1
    },
    jpSoldier: {
      asset: 'jp_soldier_1.png',
      bounds: 'jp_soldier_1.bounds.json',
      scale: 1
    },
    trader: {
      asset: 'trader.png',
      bounds: 'trader.bounds.json',
      scale: 1
    },
    teacher: {
      asset: 'teacher.png',
      bounds: 'teacher.bounds.json',
      scale: 1
    }
  };

  game.assets = {
    DISGUISE_TEMPLATES: DISGUISE_TEMPLATES,
    DISGUISE_TEMPLATE_ORDER: DISGUISE_TEMPLATE_ORDER,
    DISGUISE_TOOL_ICONS: DISGUISE_TOOL_ICONS,
    DISGUISE_DOTS: DISGUISE_DOTS,
    BRUSH_KINDS: BRUSH_KINDS,
    BRUSH_PALETTE_COLORS: BRUSH_PALETTE_COLORS,
    CUTSCENE_POINTS: CUTSCENE_POINTS,
    INSPECTION_ACTOR_KEYS: INSPECTION_ACTOR_KEYS,
    ACTORS: ACTORS
  };
}(window));

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
    skinTone: { textureKey: 'act3IconSkinTone', asset: 'face_mod.svg' },
    reshape: { textureKey: 'act3IconReshape', asset: 'face_mod.svg' },
    lipstick: { textureKey: 'act3IconLipstick', asset: 'kouhong.svg' },
    eyebrow: { textureKey: 'act3IconEyebrow', asset: 'meimao.svg' },
    guidePencil: { textureKey: 'act3GuidePencil', asset: 'drawing_pencil.svg' },
    guideHand: { textureKey: 'act3GuideHand', asset: 'hand_thin_point.svg' }
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
    {
      key: 'shapeBrow',
      label: '修眉',
      color: 'rgba(55, 31, 19, 0.82)',
      fill: 0x371f13,
      diameter: 18,
      strength: 4
    },
    {
      key: 'blush',
      label: '腮红',
      color: 'rgba(190, 72, 78, 0.46)',
      fill: 0xbe484e,
      diameter: 38,
      strength: 3
    },
    {
      key: 'pixelate',
      label: '像素',
      color: 'rgba(218, 184, 132, 0.42)',
      fill: 0xc29a62,
      diameter: 56,
      strength: 3
    },
    {
      key: 'blurBrush',
      label: '去皱',
      color: 'rgba(214, 194, 178, 0.34)',
      fill: 0xbfa794,
      diameter: 56,
      strength: 3
    }
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
  playerSpawn: { x: 720, y: 944 },
  civilSpawn: { x: 320, y: 528 },
  doorGuest: { x: 720, y: 720 },
  clothesRack: { x: 1104, y: 512 },
  dresserPlayer: { x: 288, y: 400 },
  inspectionPlayer: { x: 640, y: 400 },
  inspectionCivil: { x: 784, y: 400 },
  officerEntry: { x: 720, y: 816 },
  soldierLeftEntry: { x: 720, y: 880 },
  soldierCenterEntry: { x: 720, y: 848 },
  soldierRightEntry: { x: 720, y: 976 },
  soldierCenterInspect: { x: 864, y: 544 },
  officerInspect: { x: 720, y: 496 },
  soldierLeftInspect: { x: 576, y: 560 },
  soldierRightInspect: { x: 720, y: 912 },
  officerExit: { x: 736, y: 1008 },
  soldierLeftExit: { x: 656, y: 768 },
  soldierCenterExit: { x: 864, y: 560 },
  soldierRightExit: { x: 592, y: 960 },
  "dresser-rendezvous-civil1-path": { x: 704, y: 400 },
  "dresser-rendezvous-civil1-path-1": { x: 384, y: 400 },
  "inspection-exit-jpSoldierB-path": { x: 800, y: 768 },
  "scene-8-player-spawn": { x: 688, y: 896 },
  "scene-8-player-path": { x: 752, y: 816 },
  "guest-approach-player-path": { x: 720, y: 784 },
  dresserPartnerOffset: { x: 112, y: 0 }
};
var CUTSCENE_SCENES = {
  "opening-spawn": {
    "label": "01 · 初始站位",
    "cue": "敲门前",
    "tracks": [
      {
        "actorId": "player",
        "start": "playerSpawn",
        "waypoints": [],
        "speed": 260,
        "facing": "up",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "civil1",
        "start": "civilSpawn",
        "waypoints": [],
        "speed": 250,
        "facing": "right",
        "loop": false,
        "visible": true
      }
    ]
  },
  "guest-approach": {
    "label": "02 · 门口会合",
    "cue": "听到敲门",
    "tracks": [
      {
        "actorId": "player",
        "start": "playerSpawn",
        "waypoints": [
          {
            "point": "guest-approach-player-path",
            "speed": 260,
            "wait": 0
          }
        ],
        "speed": 260,
        "facing": "up",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "civil1",
        "start": "civilSpawn",
        "waypoints": [
          {
            "point": "doorGuest",
            "speed": 500,
            "wait": 0
          }
        ],
        "speed": 500,
        "facing": "down",
        "loop": false,
        "visible": true
      }
    ]
  },
  "clothes-rack": {
    "label": "03 · 取衣服",
    "cue": "进屋对话后",
    "tracks": [
      {
        "actorId": "player",
        "start": "playerSpawn",
        "waypoints": [],
        "speed": 300,
        "facing": "up",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "civil1",
        "start": "doorGuest",
        "waypoints": [
          {
            "point": "clothesRack",
            "speed": 250,
            "wait": 0
          }
        ],
        "speed": 250,
        "facing": "right",
        "loop": false,
        "visible": true
      }
    ]
  },
  "dresser-rendezvous": {
    "label": "04 · 梳妆台会合",
    "cue": "玩家进入触发区",
    "tracks": [
      {
        "actorId": "player",
        "start": "@current",
        "waypoints": [
          {
            "point": "dresserPlayer",
            "speed": 260,
            "wait": 0
          }
        ],
        "speed": 350,
        "facing": "up",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "civil1",
        "start": "clothesRack",
        "waypoints": [
          {
            "point": "dresser-rendezvous-civil1-path",
            "speed": 550,
            "wait": 0
          },
          {
            "point": "dresser-rendezvous-civil1-path-1",
            "speed": 550,
            "wait": 0
          }
        ],
        "speed": 550,
        "facing": "left",
        "loop": false,
        "visible": true
      }
    ]
  },
  "inspection-lineup": {
    "label": "05 · 伪装后站位",
    "cue": "完成伪装",
    "tracks": [
      {
        "actorId": "player",
        "start": "dresserPlayer",
        "waypoints": [
          {
            "point": "inspectionPlayer",
            "speed": 260,
            "wait": 0
          }
        ],
        "speed": 260,
        "facing": "down",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "civil1",
        "start": "dresserPartner",
        "waypoints": [
          {
            "point": "inspectionCivil",
            "speed": 260,
            "wait": 0
          }
        ],
        "speed": 260,
        "facing": "down",
        "loop": false,
        "visible": true
      }
    ]
  },
  "inspection-entry": {
    "label": "06 · 搜查队进场",
    "cue": "两人站定后",
    "tracks": [
      {
        "actorId": "player",
        "start": "inspectionPlayer",
        "waypoints": [],
        "speed": 260,
        "facing": "down",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "civil1",
        "start": "inspectionCivil",
        "waypoints": [],
        "speed": 260,
        "facing": "down",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "jpOfficer",
        "start": "officerEntry",
        "waypoints": [
          {
            "point": "officerInspect",
            "speed": 230,
            "wait": 0
          }
        ],
        "speed": 250,
        "facing": "up",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "jpSoldierA",
        "start": "soldierLeftEntry",
        "waypoints": [
          {
            "point": "soldierLeftInspect",
            "speed": 150,
            "wait": 0
          }
        ],
        "speed": 150,
        "facing": "up",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "jpSoldierB",
        "start": "soldierCenterEntry",
        "waypoints": [
          {
            "point": "soldierCenterInspect",
            "speed": 230,
            "wait": 0
          }
        ],
        "speed": 240,
        "facing": "up",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "jpSoldierC",
        "start": "soldierRightEntry",
        "waypoints": [
          {
            "point": "soldierRightInspect",
            "speed": 230,
            "wait": 0
          }
        ],
        "speed": 230,
        "facing": "down",
        "loop": false,
        "visible": true
      }
    ]
  },
  "inspection-exit": {
    "label": "07 · 搜查队退场",
    "cue": "伪装通过",
    "tracks": [
      {
        "actorId": "player",
        "start": "inspectionPlayer",
        "waypoints": [],
        "speed": 260,
        "facing": "down",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "civil1",
        "start": "inspectionCivil",
        "waypoints": [],
        "speed": 260,
        "facing": "down",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "jpOfficer",
        "start": "officerInspect",
        "waypoints": [
          {
            "point": "officerExit",
            "speed": 250,
            "wait": 0
          }
        ],
        "speed": 250,
        "facing": "down",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "jpSoldierA",
        "start": "soldierLeftInspect",
        "waypoints": [
          {
            "point": "soldierLeftExit",
            "speed": 550,
            "wait": 0
          }
        ],
        "speed": 550,
        "facing": "down",
        "loop": false,
        "visible": true
      },
      {
        "actorId": "jpSoldierB",
        "start": "@current",
        "waypoints": [
          {
            "point": "soldierCenterExit",
            "speed": 450,
            "wait": 0
          },
          {
            "point": "inspection-exit-jpSoldierB-path",
            "speed": 450,
            "wait": 0
          }
        ],
        "speed": 450,
        "facing": "down",
        "loop": false,
        "visible": true
      }
    ]
  }
};
/* LEVEL_EDITOR_PROJECT_START
{
  "version": 1,
  "updatedAt": "2026-07-10T11:57:40.748Z",
  "world": {
    "width": 1448,
    "height": 1086,
    "map": "game_assets/map.png",
    "overlay": "game_assets/overlay_layer.png",
    "gridSize": 16
  },
  "runtimePointOrder": [
    "playerSpawn",
    "civilSpawn",
    "doorGuest",
    "clothesRack",
    "dresserPlayer",
    "inspectionPlayer",
    "inspectionCivil",
    "officerEntry",
    "soldierLeftEntry",
    "soldierCenterEntry",
    "soldierRightEntry",
    "soldierCenterInspect",
    "officerInspect",
    "soldierLeftInspect",
    "soldierRightInspect",
    "officerExit",
    "soldierLeftExit",
    "soldierCenterExit",
    "soldierRightExit"
  ],
  "actorLibrary": {
    "player": {
      "id": "player",
      "label": "八路军",
      "actorKey": "balujun",
      "asset": "game_assets/balujun_male_civ.png",
      "bounds": "game_assets/balujun_male_civ.bounds.json",
      "color": "#42d7b1"
    },
    "civil1": {
      "id": "civil1",
      "label": "化妆师",
      "actorKey": "civil1",
      "asset": "game_assets/civil_2.png",
      "bounds": "game_assets/civil_2.bounds.json",
      "color": "#f4bd54"
    },
    "jpOfficer": {
      "id": "jpOfficer",
      "label": "日本军官",
      "actorKey": "jpOfficier",
      "asset": "game_assets/jp_officier.png",
      "bounds": "game_assets/jp_officier.bounds.json",
      "color": "#ff6f68"
    },
    "jpSoldierA": {
      "id": "jpSoldierA",
      "label": "日军 A",
      "actorKey": "jpSoldier",
      "asset": "game_assets/jp_soldier_1.png",
      "bounds": "game_assets/jp_soldier_1.bounds.json",
      "color": "#ff9d4d"
    },
    "jpSoldierB": {
      "id": "jpSoldierB",
      "label": "日军 B",
      "actorKey": "jpSoldier",
      "asset": "game_assets/jp_soldier_1.png",
      "bounds": "game_assets/jp_soldier_1.bounds.json",
      "color": "#e77452"
    },
    "jpSoldierC": {
      "id": "jpSoldierC",
      "label": "日军 C",
      "actorKey": "jpSoldier",
      "asset": "game_assets/jp_soldier_1.png",
      "bounds": "game_assets/jp_soldier_1.bounds.json",
      "color": "#e94d5d"
    },
    "trader": {
      "id": "trader",
      "label": "商人",
      "actorKey": "trader",
      "asset": "game_assets/trader.png",
      "bounds": "game_assets/trader.bounds.json",
      "color": "#65b8c2"
    },
    "teacher": {
      "id": "teacher",
      "label": "教师",
      "actorKey": "teacher",
      "asset": "game_assets/teacher.png",
      "bounds": "game_assets/teacher.bounds.json",
      "color": "#9c8bf5"
    }
  },
  "points": {
    "playerSpawn": {
      "label": "八路军初始点",
      "x": 720,
      "y": 944,
      "runtime": true
    },
    "civilSpawn": {
      "label": "化妆师初始点",
      "x": 320,
      "y": 528,
      "runtime": true
    },
    "doorGuest": {
      "label": "门口会合",
      "x": 720,
      "y": 720,
      "runtime": true
    },
    "clothesRack": {
      "label": "衣架前",
      "x": 1104,
      "y": 512,
      "runtime": true
    },
    "dresserPlayer": {
      "label": "梳妆台·八路军",
      "x": 288,
      "y": 400,
      "runtime": true
    },
    "inspectionPlayer": {
      "label": "排查位·八路军",
      "x": 640,
      "y": 400,
      "runtime": true
    },
    "inspectionCivil": {
      "label": "排查位·化妆师",
      "x": 784,
      "y": 400,
      "runtime": true
    },
    "officerEntry": {
      "label": "军官入口",
      "x": 720,
      "y": 816,
      "runtime": true
    },
    "soldierLeftEntry": {
      "label": "日军 A 入口",
      "x": 720,
      "y": 880,
      "runtime": true
    },
    "soldierCenterEntry": {
      "label": "日军 B 入口",
      "x": 720,
      "y": 848,
      "runtime": true
    },
    "soldierRightEntry": {
      "label": "日军 C 入口",
      "x": 720,
      "y": 976,
      "runtime": true
    },
    "soldierCenterInspect": {
      "label": "日军 B 排查点",
      "x": 864,
      "y": 544,
      "runtime": true
    },
    "officerInspect": {
      "label": "军官排查点",
      "x": 720,
      "y": 496,
      "runtime": true
    },
    "soldierLeftInspect": {
      "label": "日军 A 排查点",
      "x": 576,
      "y": 560,
      "runtime": true
    },
    "soldierRightInspect": {
      "label": "日军 C 排查点",
      "x": 720,
      "y": 912,
      "runtime": true
    },
    "officerExit": {
      "label": "军官退场",
      "x": 736,
      "y": 1008,
      "runtime": true
    },
    "soldierLeftExit": {
      "label": "日军 A 退场",
      "x": 656,
      "y": 768,
      "runtime": true
    },
    "soldierCenterExit": {
      "label": "日军 B 退场",
      "x": 864,
      "y": 560,
      "runtime": true
    },
    "soldierRightExit": {
      "label": "日军 C 退场",
      "x": 592,
      "y": 960,
      "runtime": true
    },
    "dresserPartner": {
      "label": "梳妆台·化妆师",
      "x": 400,
      "y": 400,
      "runtime": true,
      "virtual": true
    },
    "dresser-rendezvous-civil1-path": {
      "label": "路径点 2",
      "x": 704,
      "y": 400,
      "runtime": false
    },
    "dresser-rendezvous-civil1-path-1": {
      "label": "路径点 3",
      "x": 384,
      "y": 400,
      "runtime": false
    },
    "inspection-exit-jpSoldierB-path": {
      "label": "路径点 2",
      "x": 800,
      "y": 768,
      "runtime": false
    },
    "scene-8-player-spawn": {
      "label": "八路军起始点",
      "x": 688,
      "y": 896,
      "runtime": false
    },
    "scene-8-player-path": {
      "label": "路径点 1",
      "x": 752,
      "y": 816,
      "runtime": false
    },
    "guest-approach-player-path": {
      "label": "路径点 1",
      "x": 720,
      "y": 784,
      "runtime": false
    }
  },
  "scenes": [
    {
      "id": "opening-spawn",
      "label": "01 · 初始站位",
      "cue": "敲门前",
      "tracks": [
        {
          "actorId": "player",
          "start": "playerSpawn",
          "waypoints": [],
          "speed": 260,
          "facing": "up",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "civil1",
          "start": "civilSpawn",
          "waypoints": [],
          "speed": 250,
          "facing": "right",
          "loop": false,
          "visible": true
        }
      ]
    },
    {
      "id": "guest-approach",
      "label": "02 · 门口会合",
      "cue": "听到敲门",
      "tracks": [
        {
          "actorId": "player",
          "start": "playerSpawn",
          "waypoints": [
            {
              "point": "guest-approach-player-path",
              "speed": 260,
              "wait": 0
            }
          ],
          "speed": 260,
          "facing": "up",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "civil1",
          "start": "civilSpawn",
          "waypoints": [
            {
              "point": "doorGuest",
              "speed": 500,
              "wait": 0
            }
          ],
          "speed": 500,
          "facing": "down",
          "loop": false,
          "visible": true
        }
      ]
    },
    {
      "id": "clothes-rack",
      "label": "03 · 取衣服",
      "cue": "进屋对话后",
      "tracks": [
        {
          "actorId": "player",
          "start": "playerSpawn",
          "waypoints": [],
          "speed": 300,
          "facing": "up",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "civil1",
          "start": "doorGuest",
          "waypoints": [
            {
              "point": "clothesRack",
              "speed": 250,
              "wait": 0
            }
          ],
          "speed": 250,
          "facing": "right",
          "loop": false,
          "visible": true
        }
      ]
    },
    {
      "id": "dresser-rendezvous",
      "label": "04 · 梳妆台会合",
      "cue": "玩家进入触发区",
      "tracks": [
        {
          "actorId": "player",
          "start": "@current",
          "waypoints": [
            {
              "point": "dresserPlayer",
              "speed": 260,
              "wait": 0
            }
          ],
          "speed": 350,
          "facing": "up",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "civil1",
          "start": "clothesRack",
          "waypoints": [
            {
              "point": "dresser-rendezvous-civil1-path",
              "speed": 550,
              "wait": 0
            },
            {
              "point": "dresser-rendezvous-civil1-path-1",
              "speed": 550,
              "wait": 0
            }
          ],
          "speed": 550,
          "facing": "left",
          "loop": false,
          "visible": true
        }
      ]
    },
    {
      "id": "inspection-lineup",
      "label": "05 · 伪装后站位",
      "cue": "完成伪装",
      "tracks": [
        {
          "actorId": "player",
          "start": "dresserPlayer",
          "waypoints": [
            {
              "point": "inspectionPlayer",
              "speed": 260,
              "wait": 0
            }
          ],
          "speed": 260,
          "facing": "down",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "civil1",
          "start": "dresserPartner",
          "waypoints": [
            {
              "point": "inspectionCivil",
              "speed": 260,
              "wait": 0
            }
          ],
          "speed": 260,
          "facing": "down",
          "loop": false,
          "visible": true
        }
      ]
    },
    {
      "id": "inspection-entry",
      "label": "06 · 搜查队进场",
      "cue": "两人站定后",
      "tracks": [
        {
          "actorId": "player",
          "start": "inspectionPlayer",
          "waypoints": [],
          "speed": 260,
          "facing": "down",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "civil1",
          "start": "inspectionCivil",
          "waypoints": [],
          "speed": 260,
          "facing": "down",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "jpOfficer",
          "start": "officerEntry",
          "waypoints": [
            {
              "point": "officerInspect",
              "speed": 230,
              "wait": 0
            }
          ],
          "speed": 250,
          "facing": "up",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "jpSoldierA",
          "start": "soldierLeftEntry",
          "waypoints": [
            {
              "point": "soldierLeftInspect",
              "speed": 150,
              "wait": 0
            }
          ],
          "speed": 150,
          "facing": "up",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "jpSoldierB",
          "start": "soldierCenterEntry",
          "waypoints": [
            {
              "point": "soldierCenterInspect",
              "speed": 230,
              "wait": 0
            }
          ],
          "speed": 240,
          "facing": "up",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "jpSoldierC",
          "start": "soldierRightEntry",
          "waypoints": [
            {
              "point": "soldierRightInspect",
              "speed": 230,
              "wait": 0
            }
          ],
          "speed": 230,
          "facing": "down",
          "loop": false,
          "visible": true
        }
      ]
    },
    {
      "id": "inspection-exit",
      "label": "07 · 搜查队退场",
      "cue": "伪装通过",
      "tracks": [
        {
          "actorId": "player",
          "start": "inspectionPlayer",
          "waypoints": [],
          "speed": 260,
          "facing": "down",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "civil1",
          "start": "inspectionCivil",
          "waypoints": [],
          "speed": 260,
          "facing": "down",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "jpOfficer",
          "start": "officerInspect",
          "waypoints": [
            {
              "point": "officerExit",
              "speed": 250,
              "wait": 0
            }
          ],
          "speed": 250,
          "facing": "down",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "jpSoldierA",
          "start": "soldierLeftInspect",
          "waypoints": [
            {
              "point": "soldierLeftExit",
              "speed": 550,
              "wait": 0
            }
          ],
          "speed": 550,
          "facing": "down",
          "loop": false,
          "visible": true
        },
        {
          "actorId": "jpSoldierB",
          "start": "@current",
          "waypoints": [
            {
              "point": "soldierCenterExit",
              "speed": 450,
              "wait": 0
            },
            {
              "point": "inspection-exit-jpSoldierB-path",
              "speed": 450,
              "wait": 0
            }
          ],
          "speed": 450,
          "facing": "down",
          "loop": false,
          "visible": true
        }
      ]
    }
  ]
}
LEVEL_EDITOR_PROJECT_END */
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
    CUTSCENE_SCENES: CUTSCENE_SCENES,
    INSPECTION_ACTOR_KEYS: INSPECTION_ACTOR_KEYS,
    ACTORS: ACTORS
  };
}(window));

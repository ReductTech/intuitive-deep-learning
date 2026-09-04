(function () {
  const STORAGE_KEY = "intuitive-deep-learning-course-map-progress-v2";
  const STATUS_LABELS = {
    seen: "看过",
    unlearned: "未学习",
  };

  const STATUS_COLORS = {
    seen: 0x39a96b,
    unlearned: 0x8b96a3,
  };

  const NODE_WORLD_POSITIONS = {
    "Neuron-Guide": [-4.2, 0, 1.2],
    "Loss-Guide": [-1.65, 0, 0.15],
    "Gradient-Descent-Module": [1.2, 0, 1.05],
    "Activation-Func-Module": [5.3, 0, -1.25],
    MLP_playground: [8.2, 0, -2.35],
    "Last-Layer-Module": [12.0, 0, -1.0],
    "Gradient-Explode-Module": [21.8, 0, 2.9],
  };

  const KENNEY_MODEL_BASE = "./assets/";
  const KENNEY_MODELS = {
    tree: "city_kit/tree-large.glb",
    treeSmall: "city_kit/tree-small.glb",
    treePine: "holiday_kit/tree.glb",
    treePineSmall: "platform_kit/tree-pine-small.glb",
    treeSnow: "holiday_kit/tree-snow-a.glb",
    rocks: "pirate_kit/rocks-a.glb",
    stones: "holiday_kit/rocks-small.glb",
    grass: "pirate_kit/grass.glb",
    flowers: "platform_kit/flowers.glb",
    plant: "pirate_kit/grass-plant.glb",
    flag: "pirate_kit/flag-high.glb",
    lock: "platform_kit/lock.glb",
    sign: "platform_kit/sign.glb",
    mascot: "platform_kit/character-oobi.glb",
    crate: "platform_kit/crate.glb",
    chest: "pirate_kit/chest.glb",
    ladder: "platform_kit/ladder.glb",
    doorOpen: "platform_kit/door-open.glb",
    blockGrassLarge: "platform_kit/block-grass-large.glb",
    blockGrassLong: "platform_kit/block-grass-long.glb",
    blockSnowLarge: "platform_kit/block-snow-large.glb",
    coinGold: "platform_kit/coin-gold.glb",
    star: "platform_kit/star.glb",
    pathLong: "city_kit/path-long.glb",
    pathShort: "city_kit/path-short.glb",
    pathStonesLong: "city_kit/path-stones-long.glb",
    pathStonesMessy: "city_kit/path-stones-messy.glb",
    houseA: "modular_building/building-sample-house-a.glb",
    houseB: "modular_building/building-sample-house-b.glb",
    houseC: "modular_building/building-sample-house-c.glb",
    towerA: "modular_building/building-sample-tower-a.glb",
    towerB: "modular_building/building-sample-tower-b.glb",
    towerC: "modular_building/building-sample-tower-c.glb",
    towerD: "modular_building/building-sample-tower-d.glb",
    cityBuildingA: "city_kit/building-type-a.glb",
    cityBuildingK: "city_kit/building-type-k.glb",
    castleGate: "pirate_kit/castle-gate.glb",
    castleDoor: "pirate_kit/castle-door.glb",
    towerWatch: "pirate_kit/tower-watch.glb",
    shipSmall: "pirate_kit/ship-small.glb",
    shipWreck: "pirate_kit/ship-wreck.glb",
    dockSmall: "pirate_kit/structure-platform-dock-small.glb",
    palmStraight: "pirate_kit/palm-straight.glb",
    palmBend: "pirate_kit/palm-bend.glb",
    sandPatch: "pirate_kit/patch-sand.glb",
    cabinTreeSnow: "holiday_kit/tree-snow-b.glb",
    train: "holiday_kit/train-locomotive.glb",
    railStraight: "holiday_kit/trainset-rail-straight.glb",
  };

  const modelCache = new Map();
  const modelStatus = {
    base: KENNEY_MODEL_BASE,
    loaderAvailable: false,
    total: Object.keys(KENNEY_MODELS).length,
    loaded: 0,
    missing: [],
    errors: {},
  };
  window.CourseMapModelStatus = modelStatus;
  let modelLoadPromise = null;

  const dom = {};
  const app = {
    course: null,
    progress: null,
    learningRecords: {},
    selectedNodeId: null,
    map3d: null,
  };

  document.addEventListener("DOMContentLoaded", start);

  async function start() {
    bindDom();
    app.course = await window.CourseMapData.loadCourseMapData();
    app.course.nodes = app.course.nodes.map((node, index) => ({
      ...node,
      position: NODE_WORLD_POSITIONS[node.id] || [10 + index * 1.4, 0, index % 2 ? -1.2 : 0.8],
    }));
    app.progress = loadProgress(app.course.nodes);
    app.learningRecords = await loadLearningRecords();
    mergeTrackerProgress(app.course.nodes);
    renderCatalog();
    bindUiEvents();

    const recommended = getRecommendedNode(app.course.nodes, app.progress);
    const initialNode = recommended || app.course.nodes[0] || null;
    if (initialNode) selectNode(initialNode.id, { focus: false, movePlayer: false, openPanel: false });
    updateProgressText();

    if (!window.THREE) {
      dom.engineFallback.hidden = false;
      dom.engineFallback.querySelector("p").textContent =
        "3D 地图引擎没有加载成功。请确认本地 Three.js 资源已随模块一同提供。";
      return;
    }

    await preloadKenneyModels();
    app.map3d = new CourseMap3D(dom.mapCanvas, app.course, app.progress, handleNodeActivation);
    app.map3d.start(initialNode?.id);
  }

  function bindDom() {
    dom.mapCanvas = document.getElementById("mapCanvas");
    dom.infoPanel = document.getElementById("infoPanel");
    dom.panelClose = document.getElementById("panelClose");
    dom.catalogToggle = document.getElementById("catalogToggle");
    dom.progressDock = document.getElementById("progressDock");
    dom.profileDock = document.getElementById("profileDock");
    dom.mapToggle = document.getElementById("mapToggle");
    dom.catalogView = document.getElementById("catalogView");
    dom.catalogList = document.getElementById("catalogList");
    dom.engineFallback = document.getElementById("engineFallback");
    dom.resetProgress = document.getElementById("resetProgress");
    dom.backButton = document.getElementById("backButton");
    dom.progressText = document.getElementById("progressText");
    dom.hudProgress = document.getElementById("hudProgress");
    dom.sourceText = document.getElementById("sourceText");
    dom.moduleCode = document.getElementById("moduleCode");
    dom.moduleStatus = document.getElementById("moduleStatus");
    dom.moduleTitle = document.getElementById("moduleTitle");
    dom.moduleChapter = document.getElementById("moduleChapter");
    dom.moduleSummary = document.getElementById("moduleSummary");
    dom.modulePrereq = document.getElementById("modulePrereq");
    dom.knowledgeList = document.getElementById("knowledgeList");
    dom.lockedHint = document.getElementById("lockedHint");
    dom.startModule = document.getElementById("startModule");
    dom.completeModule = document.getElementById("completeModule");
  }

  function bindUiEvents() {
    dom.catalogToggle.addEventListener("click", () => toggleCatalogView(dom.catalogView.hidden));
    dom.mapToggle.addEventListener("click", () => toggleCatalogView(false));
    dom.panelClose.addEventListener("click", () => {
      dom.infoPanel.hidden = true;
    });
    dom.progressDock.addEventListener("click", () => {
      const node = getSelectedNode() || getRecommendedNode(app.course.nodes, app.progress) || app.course.nodes[0];
      if (node) selectNode(node.id, { focus: true, movePlayer: false, openPanel: true });
    });
    dom.profileDock.addEventListener("click", () => {
      const node = getSelectedNode() || getRecommendedNode(app.course.nodes, app.progress) || app.course.nodes[0];
      if (node) selectNode(node.id, { focus: false, movePlayer: false, openPanel: true });
    });
    dom.resetProgress.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      app.progress = loadProgress(app.course.nodes);
      mergeTrackerProgress(app.course.nodes);
      const recommended = getRecommendedNode(app.course.nodes, app.progress) || app.course.nodes[0];
      selectNode(recommended.id, { focus: true, movePlayer: true, openPanel: true });
      refreshSceneState();
    });
    dom.backButton.addEventListener("click", () => {
      if (window.history.length > 1) window.history.back();
      else window.location.href = "../";
    });

    dom.startModule.addEventListener("click", () => {
      const node = getSelectedNode();
      if (!node) return;
      window.location.href = node.entry;
    });

    dom.completeModule.addEventListener("click", () => {
      const node = getSelectedNode();
      if (!node) return;
      markNodeCompleted(node.id);
      const next = getRecommendedNode(app.course.nodes, app.progress) || node;
      selectNode(next.id, { focus: true, movePlayer: true });
      refreshSceneState();
    });
  }

  class CourseMap3D {
    constructor(container, course, progress, onNodeClick) {
      this.container = container;
      this.course = course;
      this.progress = progress;
      this.onNodeClick = onNodeClick;
      this.nodeGroups = new Map();
      this.nodePickTargets = [];
      this.roadLights = [];
      this.clock = new THREE.Clock();
      this.cameraTarget = new THREE.Vector3(1.2, 0, 1.05);
      this.desiredTarget = this.cameraTarget.clone();
      this.playerTarget = null;
      this.hovered = null;
      this.drag = null;
    }

    start(initialNodeId) {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xa7d3dc);
      this.scene.fog = new THREE.Fog(0xa7d3dc, 34, 64);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if ("outputEncoding" in this.renderer) this.renderer.outputEncoding = THREE.sRGBEncoding;
      if ("toneMapping" in this.renderer) {
        this.renderer.toneMapping =
          THREE.LinearToneMapping !== undefined ? THREE.LinearToneMapping : THREE.NoToneMapping;
      }
      if ("toneMappingExposure" in this.renderer) this.renderer.toneMappingExposure = 0.82;
      this.container.innerHTML = "";
      this.container.appendChild(this.renderer.domElement);

      this.createCamera();
      this.createLights();
      this.createWorld();
      this.createRoads();
      this.createNodes();
      this.createMascot();
      this.bindEvents();
      this.resize();

      if (initialNodeId) {
        this.focusNode(initialNodeId, true);
        this.moveMascotTo(initialNodeId, true);
        this.setSelectedNode(initialNodeId);
      }

      this.animate();
    }

    createCamera() {
      const aspect = Math.max(1, this.container.clientWidth / Math.max(1, this.container.clientHeight));
      const size = 5.9;
      this.camera = new THREE.OrthographicCamera(
        -size * aspect,
        size * aspect,
        size,
        -size,
        0.1,
        80,
      );
      this.camera.position.set(2.8, 7.2, 6.2);
      this.camera.lookAt(this.cameraTarget);
    }

    createLights() {
      const ambient = new THREE.AmbientLight(0xf8fbff, 0.52);
      this.scene.add(ambient);

      const hemi = new THREE.HemisphereLight(0xdff7ff, 0x78915d, 0.72);
      this.scene.add(hemi);

      const sun = new THREE.DirectionalLight(0xffedc2, 1.28);
      sun.position.set(-4, 10, 5);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.left = -14;
      sun.shadow.camera.right = 14;
      sun.shadow.camera.top = 14;
      sun.shadow.camera.bottom = -14;
      this.scene.add(sun);
    }

    createWorld() {
      this.backgroundLayer = createLayer("backgroundLayer");
      this.terrainLayer = createLayer("terrainLayer");
      this.roadLayer = createLayer("roadLayer");
      this.decorationLayer = createLayer("decorationLayer");
      this.nodeLayer = createLayer("nodeLayer");
      this.playerLayer = createLayer("playerLayer");
      this.fxLayer = createLayer("fxLayer");
      this.scene.add(
        this.backgroundLayer,
        this.terrainLayer,
        this.roadLayer,
        this.decorationLayer,
        this.nodeLayer,
        this.playerLayer,
        this.fxLayer,
      );

      this.createSkyBackdrops();
      this.createGrassIsland();
      this.createMlpHills();
      this.createTrainingWorkshopZone();
      this.createVisionCoast();
      this.createSequenceForest();
      this.createWorldDecor();
      this.createKenneyShowcaseProps();
    }

    createSkyBackdrops() {
      const mountainMat = toonMaterial(0x6f98a6, { transparent: true, opacity: 0.3 });
      for (let i = 0; i < 9; i += 1) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(1.2 + i * 0.03, 2.2 + (i % 3) * 0.4, 4), mountainMat);
        cone.position.set(-5 + i * 2.4, -0.72, -6.4 - (i % 2) * 0.4);
        cone.rotation.y = Math.PI / 4;
        cone.receiveShadow = true;
        this.backgroundLayer.add(cone);
      }

      const cloudMat = toonMaterial(0xf4ffff, { transparent: true, opacity: 0.46 });
      for (let i = 0; i < 8; i += 1) {
        const cloud = new THREE.Group();
        addBlob(cloud, cloudMat, [-0.38, 0, 0], [0.52, 0.18, 0.28]);
        addBlob(cloud, cloudMat, [0.04, 0.04, 0], [0.62, 0.22, 0.32]);
        addBlob(cloud, cloudMat, [0.48, 0, 0], [0.42, 0.16, 0.24]);
        cloud.position.set(-6 + i * 2.8, 1.15 + (i % 3) * 0.12, -4.6 - (i % 2) * 0.7);
        cloud.scale.setScalar(0.85 + (i % 2) * 0.18);
        this.backgroundLayer.add(cloud);
      }
    }

    createGrassIsland() {
      const grass = toonMaterial(0x56ba43);
      const side = toonMaterial(0x357f34);
      const island = makeRoundedBox(7.4, 0.5, 4.4, 0.22, grass);
      island.position.set(-1.6, -0.25, 0.75);
      island.castShadow = true;
      island.receiveShadow = true;
      this.terrainLayer.add(island);

      const underside = makeRoundedBox(7.55, 0.5, 4.55, 0.18, side);
      underside.position.set(-1.6, -0.6, 0.75);
      underside.receiveShadow = true;
      this.terrainLayer.add(underside);

      const shadow = createGroundShadow(7.9, 4.85, 0.2);
      shadow.position.set(-1.45, -0.88, 0.95);
      this.terrainLayer.add(shadow);
    }

    createMlpHills() {
      const hillMat = toonMaterial(0x5e93cc);
      const towerMat = toonMaterial(0x315aa5);
      const roofMat = toonMaterial(0x233f78);
      const plateau = makeRoundedBox(6.6, 0.42, 3.9, 0.18, toonMaterial(0x5f9bcf));
      plateau.position.set(7.1, -0.2, -1.35);
      plateau.rotation.y = -0.08;
      plateau.receiveShadow = true;
      this.terrainLayer.add(plateau);

      for (let i = 0; i < 6; i += 1) {
        const hill = new THREE.Mesh(new THREE.ConeGeometry(0.62 + i * 0.03, 1.4 + (i % 2) * 0.35, 5), hillMat);
        hill.position.set(4.35 + i * 0.9, 0.42, -2.4 + (i % 3) * 0.58);
        hill.rotation.y = Math.PI / 5;
        hill.castShadow = true;
        hill.receiveShadow = true;
        this.decorationLayer.add(hill);
      }

      [
        [5.35, -0.22],
        [7.45, -0.55],
        [9.3, -1.35],
      ].forEach(([x, z], index) => {
        const tree = createTreeModel(0.62 + index * 0.08, "snow");
        tree.position.set(x, 0, z);
        this.decorationLayer.add(tree);
      });

      const tower = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.8, 0.72), towerMat);
      body.position.y = 0.9;
      body.castShadow = true;
      body.receiveShadow = true;
      tower.add(body);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.64, 0.74, 4), roofMat);
      roof.position.y = 2.15;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      tower.add(roof);
      tower.position.set(8.65, 0.05, -2.25);
      this.decorationLayer.add(tower);
    }

    createTrainingWorkshopZone() {
      const ground = makeRoundedBox(4.2, 0.35, 2.9, 0.14, toonMaterial(0xa87836));
      ground.position.set(12.05, -0.25, -0.15);
      ground.rotation.y = 0.1;
      ground.receiveShadow = true;
      this.terrainLayer.add(ground);
      for (let i = 0; i < 2; i += 1) {
        const workshop = createWorkshopModel();
        workshop.position.set(11.35 + i * 1.28, 0, -0.58 + i * 0.42);
        workshop.scale.setScalar(0.72);
        this.decorationLayer.add(workshop);
      }

      for (let i = 0; i < 6; i += 1) {
        const rail = createKenneyModel("railStraight", { scale: 1.25, rotationY: 0.15 });
        if (!rail) continue;
        rail.position.set(10.55 + i * 0.48, 0.02, 0.88 + i * 0.08);
        this.decorationLayer.add(rail);
      }
      const train = createKenneyModel("train", { scale: 1.35, rotationY: 0.15 });
      if (train) {
        train.position.set(12.18, 0.04, 1.1);
        this.decorationLayer.add(train);
      }
    }

    createVisionCoast() {
      const sand = makeRoundedBox(4.65, 0.34, 2.65, 0.14, toonMaterial(0xc9923e));
      sand.position.set(15.75, -0.27, -1.95);
      sand.receiveShadow = true;
      this.terrainLayer.add(sand);

      const sandPatch = createKenneyModel("sandPatch", { scale: 0.42, rotationY: 0.04 });
      if (sandPatch) {
        sandPatch.position.set(15.85, 0.01, -1.96);
        this.terrainLayer.add(sandPatch);
      }

      for (let x = 14.7; x < 17.6; x += 0.55) {
        for (let z = -2.82; z < -1.58; z += 0.55) {
          const tile = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.46), toonMaterial(0x3c8ea8));
          tile.position.set(x, -0.02, z);
          this.terrainLayer.add(tile);
          const tile2 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.03, 0.04), toonMaterial(0x3c8ea8));
          tile2.position.set(x, -0.02, z);
          this.terrainLayer.add(tile2);
        }
      }

      const dock = createKenneyModel("dockSmall", { scale: 0.42, rotationY: -0.35 });
      if (dock) {
        dock.position.set(17.25, 0, -1.18);
        this.decorationLayer.add(dock);
      }
      const ship = createKenneyModel("shipSmall", { scale: 0.12, rotationY: -0.62 });
      if (ship) {
        ship.position.set(17.95, 0, -2.75);
        this.decorationLayer.add(ship);
      }
      [
        ["palmStraight", [14.35, 0, -1.02], 0.22, -0.45],
        ["palmBend", [16.95, 0, -3.05], 0.2, 0.75],
      ].forEach(([key, position, scale, rotationY]) => {
        const palm = createKenneyModel(key, { scale, rotationY });
        if (!palm) return;
        palm.position.set(position[0], position[1], position[2]);
        this.decorationLayer.add(palm);
      });
    }

    createSequenceForest() {
      const ground = makeRoundedBox(5.9, 0.42, 3.75, 0.2, toonMaterial(0x438f4f));
      ground.position.set(21.75, -0.24, 2.9);
      ground.rotation.y = 0.05;
      ground.receiveShadow = true;
      this.terrainLayer.add(ground);
      const river = makeRoundedBox(5.1, 0.08, 0.42, 0.08, toonMaterial(0x48bad0, { transparent: true, opacity: 0.9 }));
      river.position.set(21.85, -0.01, 3.18);
      river.rotation.y = -0.28;
      this.terrainLayer.add(river);
      for (let i = 0; i < 14; i += 1) {
        const tree = createTreeModel(0.78 + (i % 3) * 0.12, "pine");
        const column = i % 7;
        const row = Math.floor(i / 7);
        const gap = column === 3 ? 0.48 : 0;
        tree.position.set(19.65 + column * 0.66 + gap, 0, 1.25 + row * 2.05);
        this.decorationLayer.add(tree);
      }
    }

    createWorldDecor() {
      const placements = [
        [-5.3, 0.9],
        [-3.6, 2.15],
        [-2.2, -1.08],
        [0.2, 2.0],
        [2.2, 1.8],
        [3.35, -0.25],
        [6.25, -3.12],
        [10.25, 1.55],
        [13.85, -3.2],
        [18.15, 0.15],
        [20.2, 4.95],
        [23.9, 2.1],
      ];
      placements.forEach(([x, z], index) => {
        const item = index % 3 === 0 ? createTreeModel(0.78) : index % 3 === 1 ? createRockModel() : createGrassClump();
        item.position.set(x, 0, z);
        this.decorationLayer.add(item);
      });

      this.addWoodSign("机器学习基础", "新手草原", [-5.05, 0, -0.95]);
      this.addWoodSign("多层神经网络", "层叠丘陵", [4.9, 0, -3.45]);
      this.addWoodSign("神经网络训练", "参数工坊", [10.65, 0, 1.75]);
      this.addWoodSign("CNN", "图像海岸", [14.0, 0, -3.55]);
      this.addWoodSign("RNN", "序列森林", [19.25, 0, 5.2]);
    }

    createKenneyShowcaseProps() {
      const terrainBlocks = [
        ["blockGrassLarge", [-5.45, -0.72, 1.98], 0.42, 0.1],
        ["blockGrassLong", [-2.65, -0.62, 2.48], 0.38, -0.18],
        ["blockSnowLarge", [6.05, -0.7, -3.52], 0.4, 0.2],
      ];
      terrainBlocks.forEach(([key, position, scale, rotationY]) => {
        const model = createKenneyModel(key, { scale, rotationY });
        if (!model) return;
        model.position.set(position[0], position[1], position[2]);
        this.terrainLayer.add(model);
      });

      const props = [
        ["chest", [0.35, 0, 1.95], 0.34, -0.45],
        ["crate", [2.45, 0, 1.75], 0.3, 0.35],
        ["coinGold", [-3.15, 0.05, -0.35], 0.22, 0.2],
        ["star", [1.75, 0.06, -0.28], 0.18, -0.2],
        ["pathStonesLong", [-3.45, 0.045, 0.58], 2.5, 1.2],
        ["pathStonesMessy", [-0.85, 0.045, 0.45], 2.4, 0.85],
        ["pathLong", [1.72, 0.045, 0.72], 2.2, 1.35],
      ];
      props.forEach(([key, position, scale, rotationY]) => {
        const model = createKenneyModel(key, { scale, rotationY });
        if (!model) return;
        model.position.set(position[0], position[1], position[2]);
        this.decorationLayer.add(model);
      });
    }

    addWoodSign(title, subtitle, position) {
      const model = createKenneyModel("sign", { scale: 0.78, rotationY: -0.35 });
      if (model) {
        model.position.set(position[0], 0, position[2]);
        model.userData.label = `${title} / ${subtitle}`;
        this.decorationLayer.add(model);
        return;
      }

      const sign = new THREE.Group();
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.58, 0.08), toonMaterial(0x8b5a32));
      post.position.y = 0.29;
      sign.add(post);
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.42, 0.08), toonMaterial(0xb8793f));
      board.position.y = 0.72;
      board.castShadow = true;
      sign.add(board);
      sign.position.set(position[0], 0, position[2]);
      sign.rotation.y = -0.35;
      sign.userData.label = `${title} / ${subtitle}`;
      this.decorationLayer.add(sign);
    }

    createRoads() {
      this.roadGroup = new THREE.Group();
      this.roadLayer.add(this.roadGroup);
      const nodes = this.course.nodes;
      for (let index = 1; index < nodes.length; index += 1) {
        this.addRoadSegment(nodes[index - 1], nodes[index]);
      }
    }

    addRoadSegment(from, to) {
      const toStatus = getNodeStatus(to, this.progress);
      const fromStatus = getNodeStatus(from, this.progress);
      const completed = fromStatus === "seen" && toStatus === "seen";
      const curve = makeRoadCurve(from.position, to.position);
      const roadColor = completed ? 0xf0c45c : 0x78838c;
      const edgeColor = completed ? 0xa36522 : 0x4f5963;

      const edge = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 48, 0.23, 10, false),
        toonMaterial(edgeColor, { roughness: 1 }),
      );
      edge.position.y = 0.022;
      edge.receiveShadow = true;
      this.roadGroup.add(edge);

      const road = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 48, 0.16, 10, false),
        toonMaterial(roadColor, { roughness: 1 }),
      );
      road.position.y = 0.045;
      road.receiveShadow = true;
      this.roadGroup.add(road);

      for (let i = 0; i < 10; i += 1) {
        const p = curve.getPoint(i / 9);
        const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.045, 0), toonMaterial(0xf6dfb2));
        stone.position.set(p.x + (i % 2 ? 0.12 : -0.12), 0.12, p.z + (i % 3) * 0.04);
        stone.castShadow = true;
        this.roadGroup.add(stone);
      }

      if (toStatus === "unlearned") {
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), toonMaterial(0xfff1a8, { emissive: 0xff9d2e }));
        this.fxLayer.add(light);
        this.roadLights.push({ mesh: light, curve, offset: 0 });
      }
    }

    createNodes() {
      this.nodesGroup = new THREE.Group();
      this.nodeLayer.add(this.nodesGroup);
      this.nodeGroups.clear();
      this.nodePickTargets = [];
      this.course.nodes.forEach((node, index) => {
        const group = this.createNodeGroup(node, index);
        group.position.set(node.position[0], 0, node.position[2]);
        this.nodesGroup.add(group);
        this.nodeGroups.set(node.id, group);
      });
    }

    createNodeGroup(node, index) {
      const status = getNodeStatus(node, this.progress);
      const group = new THREE.Group();
      group.userData.nodeId = node.id;

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.72, 0.18, 8), toonMaterial(status === "seen" ? 0x8acb78 : 0xaeb5bc));
      base.position.y = 0.09;
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      const landmark = createLandmarkModel(node, status, index);
      landmark.position.y = 0.18;
      group.add(landmark);

      const board = createCodeBoard(node.code, status);
      board.position.set(0, 0.55, 0.74);
      board.rotation.x = -0.25;
      group.add(board);

      if (status === "seen") {
        const flag = createFlagModel(0x39a96b);
        flag.position.set(0.48, 0.55, -0.25);
        group.add(flag);
      }

      const pick = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 1.5, 12), invisibleMaterial());
      pick.position.y = 0.75;
      pick.userData.nodeId = node.id;
      group.add(pick);
      this.nodePickTargets.push(pick);

      return group;
    }

    createMascot() {
      this.mascot = createMascotModel();
      this.playerLayer.add(this.mascot);
    }

    bindEvents() {
      this.raycaster = new THREE.Raycaster();
      this.pointer = new THREE.Vector2();

      this.container.addEventListener("pointerdown", (event) => {
        this.drag = { x: event.clientX, y: event.clientY, moved: false };
      });
      this.container.addEventListener("pointermove", (event) => {
        this.updatePointer(event);
        this.updateHover();
        if (!this.drag) return;
        const dx = event.clientX - this.drag.x;
        const dy = event.clientY - this.drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 8) this.drag.moved = true;
        this.desiredTarget.x -= dx * 0.012;
        this.desiredTarget.z -= dy * 0.012;
        this.drag.x = event.clientX;
        this.drag.y = event.clientY;
      });
      this.container.addEventListener("pointerup", (event) => {
        this.updatePointer(event);
        if (this.drag && !this.drag.moved) {
          const hit = this.pickNode();
          if (hit) this.onNodeClick(hit.userData.nodeId);
        }
        this.drag = null;
      });
      this.container.addEventListener("wheel", (event) => {
        event.preventDefault();
        const delta = Math.sign(event.deltaY) * 0.5;
        const current = this.camera.top;
        const next = clamp(current + delta, 4.0, 8.4);
        this.setCameraSize(next);
      }, { passive: false });
      window.addEventListener("resize", () => this.resize());
    }

    updatePointer(event) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    }

    pickNode() {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.nodePickTargets, false);
      return hits[0]?.object || null;
    }

    updateHover() {
      const hit = this.pickNode();
      const next = hit?.userData.nodeId || null;
      if (next === this.hovered) return;
      if (this.hovered) {
        const oldGroup = this.nodeGroups.get(this.hovered);
        if (oldGroup && this.hovered !== app.selectedNodeId) oldGroup.scale.setScalar(1);
      }
      this.hovered = next;
      if (next) {
        const group = this.nodeGroups.get(next);
        if (group) group.scale.setScalar(1.07);
      }
      this.container.style.cursor = next ? "pointer" : "grab";
    }

    resize() {
      const width = Math.max(1, this.container.clientWidth);
      const height = Math.max(1, this.container.clientHeight);
      this.renderer.setSize(width, height, false);
      const size = this.camera.top;
      const aspect = width / height;
      this.camera.left = -size * aspect;
      this.camera.right = size * aspect;
      this.camera.top = size;
      this.camera.bottom = -size;
      this.camera.updateProjectionMatrix();
    }

    setCameraSize(size) {
      const aspect = Math.max(1, this.container.clientWidth / Math.max(1, this.container.clientHeight));
      this.camera.left = -size * aspect;
      this.camera.right = size * aspect;
      this.camera.top = size;
      this.camera.bottom = -size;
      this.camera.updateProjectionMatrix();
    }

    focusNode(nodeId, immediate = false) {
      const node = findNode(nodeId);
      if (!node) return;
      this.desiredTarget.set(node.position[0], 0, node.position[2]);
      if (immediate) this.cameraTarget.copy(this.desiredTarget);
    }

    moveMascotTo(nodeId, immediate = false) {
      const node = findNode(nodeId);
      if (!node || !this.mascot) return;
      const target = new THREE.Vector3(node.position[0] + 0.15, 0.18, node.position[2] - 0.82);
      if (immediate) {
        this.mascot.position.copy(target);
        return;
      }
      this.playerTarget = target;
    }

    setSelectedNode(nodeId) {
      this.nodeGroups.forEach((group, id) => {
        group.scale.setScalar(id === nodeId ? 1.1 : 1);
      });
    }

    refresh(progress) {
      this.progress = progress;
      this.roadLayer.remove(this.roadGroup);
      this.nodeLayer.remove(this.nodesGroup);
      this.roadLights.forEach((item) => this.fxLayer.remove(item.mesh));
      this.roadLights = [];
      this.createRoads();
      this.createNodes();
      if (app.selectedNodeId) this.setSelectedNode(app.selectedNodeId);
    }

    animate() {
      requestAnimationFrame(() => this.animate());
      const delta = this.clock.getDelta();
      const elapsed = this.clock.elapsedTime;

      this.cameraTarget.lerp(this.desiredTarget, 1 - Math.pow(0.002, delta));
      if (this.backgroundLayer) {
        this.backgroundLayer.position.x = this.cameraTarget.x * 0.16;
        this.backgroundLayer.position.z = this.cameraTarget.z * 0.1;
      }
      this.camera.position.set(this.cameraTarget.x + 3.1, 7.2, this.cameraTarget.z + 6.0);
      this.camera.lookAt(this.cameraTarget.x, 0, this.cameraTarget.z);

      this.nodeGroups.forEach((group) => {
        const ring = group.children.find((child) => child.userData && child.userData.isPulseRing);
        if (ring) {
          const s = 1 + Math.sin(elapsed * 3.2) * 0.12;
          ring.scale.set(s, s, s);
          ring.material.opacity = 0.55 + Math.sin(elapsed * 3.2) * 0.22;
        }
      });

      this.roadLights.forEach((item, index) => {
        const t = (elapsed * 0.26 + index * 0.21) % 1;
        const point = item.curve.getPoint(t);
        item.mesh.position.set(point.x, 0.22, point.z);
      });

      if (this.mascot) {
        this.mascot.position.y = 0.18 + Math.sin(elapsed * 4.2) * 0.05;
        if (this.playerTarget) {
          this.mascot.position.lerp(this.playerTarget, 1 - Math.pow(0.001, delta));
          if (this.mascot.position.distanceTo(this.playerTarget) < 0.03) this.playerTarget = null;
        }
      }

      this.renderer.render(this.scene, this.camera);
    }
  }

  function handleNodeActivation(nodeId) {
    const node = findNode(nodeId);
    if (!node) return;
    selectNode(nodeId, { focus: true, movePlayer: true });
  }

  function selectNode(nodeId, options = {}) {
    const node = findNode(nodeId);
    if (!node) return;
    app.selectedNodeId = nodeId;
    updateInfoPanel(node);
    renderCatalog();
    if (options.openPanel !== false) dom.infoPanel.hidden = false;

    if (app.map3d) {
      app.map3d.setSelectedNode(nodeId);
      if (options.focus) app.map3d.focusNode(nodeId, false);
      if (options.movePlayer) app.map3d.moveMascotTo(nodeId, false);
    }
  }

  function focusNode(nodeId) {
    if (app.map3d) app.map3d.focusNode(nodeId, false);
  }

  function updateInfoPanel(node) {
    const status = getNodeStatus(node, app.progress);
    const record = getLearningRecord(node.id);

    dom.moduleCode.textContent = node.code;
    dom.moduleStatus.textContent = STATUS_LABELS[status];
    dom.moduleStatus.dataset.status = status;
    dom.moduleTitle.textContent = node.title;
    dom.moduleChapter.textContent = `${node.chapter} / ${node.id}`;
    dom.moduleSummary.textContent = node.description;
    dom.modulePrereq.innerHTML = "";
    const recentLine = document.createElement("span");
    recentLine.textContent = `最近学习：${formatRecentTime(record?.lastSeenAt)}`;
    const interactionLine = document.createElement("span");
    interactionLine.textContent = `互动次数：${record?.interactionCount || 0} 次`;
    dom.modulePrereq.append(recentLine, interactionLine);

    dom.knowledgeList.innerHTML = "";
    const knowledge = node.knowledgePrerequisites.length ? node.knowledgePrerequisites : ["无特别要求"];
    knowledge.forEach((item) => {
      const tag = document.createElement("span");
      tag.textContent = item;
      dom.knowledgeList.appendChild(tag);
    });

    dom.lockedHint.hidden = true;
    dom.lockedHint.textContent = "";

    dom.startModule.disabled = false;
    dom.completeModule.disabled = status === "seen";

    dom.startModule.textContent = status === "seen" ? "继续学习" : "开始学习";
    dom.completeModule.textContent = status === "seen" ? "已看过" : "标记看过";
  }

  function renderCatalog() {
    if (!app.course) return;
    dom.catalogList.innerHTML = "";
    app.course.chapters.forEach((chapter) => {
      const section = document.createElement("section");
      section.className = "catalog-chapter";

      const title = document.createElement("h3");
      title.textContent = chapter.title;
      const subtitle = document.createElement("p");
      subtitle.textContent = chapter.subtitle;
      const items = document.createElement("div");
      items.className = "catalog-items";

      chapter.modules
        .map((id) => findNode(id))
        .filter(Boolean)
        .forEach((node) => {
          const status = getNodeStatus(node, app.progress);
          const row = document.createElement("div");
          row.className = "catalog-item";
          row.dataset.status = status;

          const code = document.createElement("span");
          code.className = "catalog-item__code";
          code.textContent = node.code;

          const copy = document.createElement("div");
          const itemTitle = document.createElement("span");
          itemTitle.className = "catalog-item__title";
          itemTitle.textContent = node.title;
          const itemMeta = document.createElement("span");
          itemMeta.className = "catalog-item__meta";
          itemMeta.textContent = STATUS_LABELS[status];
          copy.append(itemTitle, itemMeta);

          const action = document.createElement("button");
          action.type = "button";
          action.textContent = status === "seen" ? "继续" : "进入";
          action.disabled = false;
          action.addEventListener("click", () => {
            selectNode(node.id, { focus: true, movePlayer: true, openPanel: true });
            window.location.href = node.entry;
          });

          row.addEventListener("click", (event) => {
            if (event.target === action) return;
            selectNode(node.id, { focus: true, movePlayer: true, openPanel: true });
          });

          row.append(code, copy, action);
          items.appendChild(row);
        });

      section.append(title, subtitle, items);
      dom.catalogList.appendChild(section);
    });
  }

  function toggleCatalogView(show) {
    dom.catalogView.hidden = !show;
    dom.catalogToggle.querySelector(".dock-label").textContent = show ? "地图" : "目录";
    dom.catalogToggle.setAttribute("aria-label", show ? "返回地图" : "目录视图");
    if (!show && app.selectedNodeId) focusNode(app.selectedNodeId);
  }

  async function preloadKenneyModels() {
    if (modelLoadPromise) return modelLoadPromise;
    const entries = Object.entries(KENNEY_MODELS);
    if (!window.THREE || !THREE.GLTFLoader) {
      modelStatus.loaderAvailable = false;
      modelStatus.loaded = 0;
      modelStatus.fallbackLoader = "mini-glb";
      console.warn("[CourseMap] GLTFLoader 没有加载成功，正在使用内置 mini-glb 加载 Kenney 模型。");
      modelLoadPromise = preloadKenneyModelsWithMiniLoader(entries);
      return modelLoadPromise;
    }

    modelStatus.loaderAvailable = true;
    modelStatus.fallbackLoader = null;
    const loader = new THREE.GLTFLoader();
    modelLoadPromise = Promise.allSettled(
      entries.map(([key, file]) =>
        new Promise((resolve) => {
          loader.load(
            `${KENNEY_MODEL_BASE}${file}`,
            (gltf) => {
              const scene = gltf.scene;
              scene.traverse((child) => {
                if (!child.isMesh) return;
                child.castShadow = true;
                child.receiveShadow = true;
              });
              modelCache.set(key, scene);
              resolve({ key, ok: true });
            },
            undefined,
            (error) => resolve({ key, ok: false, error: error?.message || String(error) }),
          );
        }),
      ),
    ).then(finishKenneyModelLoad);
    return modelLoadPromise;
  }

  function preloadKenneyModelsWithMiniLoader(entries) {
    return Promise.allSettled(
      entries.map(([key, file]) =>
        loadMiniGlbScene(`${KENNEY_MODEL_BASE}${file}`, key)
          .then((scene) => {
            scene.traverse((child) => {
              if (!child.isMesh) return;
              child.castShadow = true;
              child.receiveShadow = true;
            });
            modelCache.set(key, scene);
            return { key, ok: true };
          })
          .catch((error) => ({ key, ok: false, error: error?.message || String(error) })),
      ),
    ).then(finishKenneyModelLoad);
  }

  function finishKenneyModelLoad(results) {
    const missing = [];
    const errors = {};
    results.forEach((result) => {
      if (result.status !== "fulfilled" || !result.value?.ok) {
        const key = result.value?.key || "unknown";
        missing.push(key);
        errors[key] = result.value?.error || result.reason?.message || "load failed";
      }
    });
    modelStatus.loaded = modelCache.size;
    modelStatus.missing = missing;
    modelStatus.errors = errors;
    document.body.dataset.courseMapModels = `${modelStatus.loaded}-${modelStatus.total}`;
    console.info(
      `[CourseMap] Kenney GLB loaded ${modelStatus.loaded}/${modelStatus.total}`,
      missing.length ? { missing, errors } : "",
    );
  }

  function createKenneyModel(key, options = {}) {
    const source = modelCache.get(key);
    if (!source) return null;
    const root = new THREE.Group();
    const model = source.clone(true);
    const scale = options.scale ?? 1;
    model.scale.setScalar(scale);
    if (options.rotationY) model.rotation.y = options.rotationY;
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (options.tint && child.material && child.material.color) {
        child.material = child.material.clone();
        child.material.color.lerp(new THREE.Color(options.tint), options.tintStrength ?? 0.55);
      }
    });
    if (options.ground !== false) {
      const bounds = new THREE.Box3().setFromObject(model);
      if (Number.isFinite(bounds.min.y)) model.position.y -= bounds.min.y;
    }
    root.add(model);
    if (options.position) root.position.set(options.position[0], options.position[1], options.position[2]);
    return root;
  }

  async function loadMiniGlbScene(url, key) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const buffer = await response.arrayBuffer();
    const glb = parseGlbChunks(buffer);
    const textures = await loadMiniTextures(glb.json, glb.bin, url);
    const scene = buildMiniGltfScene(glb.json, glb.bin, key, textures);
    scene.name = key;
    return scene;
  }

  function parseGlbChunks(buffer) {
    const view = new DataView(buffer);
    if (view.getUint32(0, true) !== 0x46546c67) throw new Error("not a GLB file");
    const version = view.getUint32(4, true);
    if (version !== 2) throw new Error(`unsupported GLB version ${version}`);
    let offset = 12;
    let json = null;
    let bin = null;
    while (offset < buffer.byteLength) {
      const chunkLength = view.getUint32(offset, true);
      const chunkType = view.getUint32(offset + 4, true);
      const chunkStart = offset + 8;
      const chunk = buffer.slice(chunkStart, chunkStart + chunkLength);
      if (chunkType === 0x4e4f534a) {
        json = JSON.parse(new TextDecoder().decode(chunk).trim());
      } else if (chunkType === 0x004e4942) {
        bin = chunk;
      }
      offset = chunkStart + chunkLength;
    }
    if (!json || !bin) throw new Error("missing GLB chunks");
    return { json, bin };
  }

  async function loadMiniTextures(gltf, bin, glbUrl) {
    const textures = new Map();
    const loader = new THREE.TextureLoader();
    const glbAbsoluteUrl = new URL(glbUrl, window.location.href);
    await Promise.all(
      (gltf.textures || []).map(async (textureDef, textureIndex) => {
        const image = gltf.images?.[textureDef.source];
        if (!image) return;
        const sampler = gltf.samplers?.[textureDef.sampler] || {};
        let textureUrl = null;
        let revokeUrl = null;
        if (image.uri) {
          textureUrl = new URL(image.uri, glbAbsoluteUrl).toString();
        } else if (image.bufferView !== undefined) {
          const view = gltf.bufferViews?.[image.bufferView];
          if (!view) return;
          const bytes = bin.slice(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
          const blob = new Blob([bytes], { type: image.mimeType || "image/png" });
          textureUrl = URL.createObjectURL(blob);
          revokeUrl = textureUrl;
        }
        if (!textureUrl) return;
        let texture = null;
        try {
          texture = await new Promise((resolve, reject) => {
            loader.load(textureUrl, resolve, undefined, reject);
          });
        } catch (error) {
          console.warn("[CourseMap] texture load failed", textureUrl, error);
        } finally {
          if (revokeUrl) URL.revokeObjectURL(revokeUrl);
        }
        if (!texture) return;
        texture.flipY = false;
        applyMiniTextureSampler(texture, sampler);
        if ("colorSpace" in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
        if ("encoding" in texture && THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
        texture.needsUpdate = true;
        textures.set(textureIndex, texture);
      }),
    );
    return textures;
  }

  function applyMiniTextureSampler(texture, sampler) {
    const filterMap = {
      9728: THREE.NearestFilter,
      9729: THREE.LinearFilter,
      9984: THREE.NearestMipmapNearestFilter,
      9985: THREE.LinearMipmapNearestFilter,
      9986: THREE.NearestMipmapLinearFilter,
      9987: THREE.LinearMipmapLinearFilter,
    };
    const wrapMap = {
      33071: THREE.ClampToEdgeWrapping,
      33648: THREE.MirroredRepeatWrapping,
      10497: THREE.RepeatWrapping,
    };
    texture.magFilter = filterMap[sampler.magFilter] || THREE.NearestFilter;
    texture.minFilter = filterMap[sampler.minFilter] || THREE.NearestFilter;
    texture.wrapS = wrapMap[sampler.wrapS] || THREE.RepeatWrapping;
    texture.wrapT = wrapMap[sampler.wrapT] || THREE.RepeatWrapping;
  }

  function buildMiniGltfScene(gltf, bin, key, textures) {
    const root = new THREE.Group();
    const sceneIndex = gltf.scene || 0;
    const sceneNodes = gltf.scenes?.[sceneIndex]?.nodes || [0];
    sceneNodes.forEach((nodeIndex) => {
      const child = buildMiniGltfNode(gltf, bin, nodeIndex, key, textures);
      if (child) root.add(child);
    });
    return root;
  }

  function buildMiniGltfNode(gltf, bin, nodeIndex, key, textures) {
    const node = gltf.nodes?.[nodeIndex];
    if (!node) return null;
    const group = new THREE.Group();
    group.name = node.name || `${key}-node-${nodeIndex}`;
    if (node.translation) group.position.fromArray(node.translation);
    if (node.rotation) group.quaternion.fromArray(node.rotation);
    if (node.scale) group.scale.fromArray(node.scale);
    if (node.matrix) group.matrix.fromArray(node.matrix);
    if (node.matrix) group.matrix.decompose(group.position, group.quaternion, group.scale);

    if (node.mesh !== undefined) {
      const meshGroup = buildMiniGltfMesh(gltf, bin, node.mesh, key, textures);
      if (meshGroup) group.add(meshGroup);
    }
    (node.children || []).forEach((childIndex) => {
      const child = buildMiniGltfNode(gltf, bin, childIndex, key, textures);
      if (child) group.add(child);
    });
    return group;
  }

  function buildMiniGltfMesh(gltf, bin, meshIndex, key, textures) {
    const meshDef = gltf.meshes?.[meshIndex];
    if (!meshDef) return null;
    const group = new THREE.Group();
    group.name = meshDef.name || `${key}-mesh-${meshIndex}`;
    (meshDef.primitives || []).forEach((primitive, primitiveIndex) => {
      const geometry = new THREE.BufferGeometry();
      const position = getMiniAccessorArray(gltf, bin, primitive.attributes?.POSITION);
      if (!position) return;
      geometry.setAttribute("position", new THREE.BufferAttribute(position.array, position.itemSize));

      const normal = getMiniAccessorArray(gltf, bin, primitive.attributes?.NORMAL);
      if (normal) geometry.setAttribute("normal", new THREE.BufferAttribute(normal.array, normal.itemSize));

      const uv = getMiniAccessorArray(gltf, bin, primitive.attributes?.TEXCOORD_0);
      if (uv) geometry.setAttribute("uv", new THREE.BufferAttribute(uv.array, uv.itemSize));

      const indices = getMiniAccessorArray(gltf, bin, primitive.indices);
      if (indices) geometry.setIndex(new THREE.BufferAttribute(indices.array, 1));
      if (!normal) geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      const material = createMiniMaterial(gltf, primitive.material, key, primitiveIndex, textures);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `${group.name}-part-${primitiveIndex}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });
    return group;
  }

  function getMiniAccessorArray(gltf, bin, accessorIndex) {
    if (accessorIndex === undefined || accessorIndex === null) return null;
    const accessor = gltf.accessors?.[accessorIndex];
    const view = gltf.bufferViews?.[accessor?.bufferView];
    if (!accessor || !view) return null;
    const itemSize = getMiniAccessorItemSize(accessor.type);
    const TypedArray = getMiniTypedArray(accessor.componentType);
    const bytesPerElement = TypedArray.BYTES_PER_ELEMENT;
    const byteOffset = (view.byteOffset || 0) + (accessor.byteOffset || 0);
    const byteStride = view.byteStride || itemSize * bytesPerElement;
    const arrayLength = accessor.count * itemSize;
    let array;
    if (byteStride === itemSize * bytesPerElement) {
      array = new TypedArray(bin, byteOffset, arrayLength).slice();
    } else {
      array = new TypedArray(arrayLength);
      const data = new DataView(bin);
      for (let i = 0; i < accessor.count; i += 1) {
        const start = byteOffset + i * byteStride;
        for (let j = 0; j < itemSize; j += 1) {
          array[i * itemSize + j] = readMiniComponent(data, start + j * bytesPerElement, accessor.componentType);
        }
      }
    }
    return { array, itemSize };
  }

  function getMiniAccessorItemSize(type) {
    if (type === "SCALAR") return 1;
    if (type === "VEC2") return 2;
    if (type === "VEC3") return 3;
    if (type === "VEC4") return 4;
    throw new Error(`unsupported accessor type ${type}`);
  }

  function getMiniTypedArray(componentType) {
    if (componentType === 5120) return Int8Array;
    if (componentType === 5121) return Uint8Array;
    if (componentType === 5122) return Int16Array;
    if (componentType === 5123) return Uint16Array;
    if (componentType === 5125) return Uint32Array;
    if (componentType === 5126) return Float32Array;
    throw new Error(`unsupported component type ${componentType}`);
  }

  function readMiniComponent(data, offset, componentType) {
    if (componentType === 5120) return data.getInt8(offset);
    if (componentType === 5121) return data.getUint8(offset);
    if (componentType === 5122) return data.getInt16(offset, true);
    if (componentType === 5123) return data.getUint16(offset, true);
    if (componentType === 5125) return data.getUint32(offset, true);
    if (componentType === 5126) return data.getFloat32(offset, true);
    throw new Error(`unsupported component type ${componentType}`);
  }

  function createMiniMaterial(gltf, materialIndex, key, primitiveIndex, textures) {
    const material = gltf.materials?.[materialIndex];
    const pbr = material?.pbrMetallicRoughness;
    const textureIndex = pbr?.baseColorTexture?.index;
    const texture = textures?.get(textureIndex);
    const color = texture ? 0xffffff : getMiniMaterialColor(material, key, primitiveIndex);
    const threeMaterial = toonMaterial(color, {
      transparent: Boolean(material?.alphaMode === "BLEND"),
      opacity: pbr?.baseColorFactor?.[3] ?? 1,
      roughness: 1,
    });
    if (texture) {
      threeMaterial.map = texture;
      threeMaterial.needsUpdate = true;
    }
    if (material?.doubleSided) threeMaterial.side = THREE.DoubleSide;
    return threeMaterial;
  }

  function getMiniMaterialColor(material, key, primitiveIndex) {
    const factor = material?.pbrMetallicRoughness?.baseColorFactor;
    if (factor) {
      return new THREE.Color(factor[0], factor[1], factor[2]).getHex();
    }
    const palette = {
      tree: [0x4faa57, 0x8a633d],
      treePine: [0x3e8c5b, 0x8a633d],
      treePineSmall: [0x4ea867, 0x8a633d],
      treeSnow: [0xd9f2f1, 0x8a633d],
      sign: [0xbe7b3e],
      flag: [0xff9d2e],
      lock: [0x8b96a3],
      mascot: [0x59a8d8, 0xffd8ba, 0x2e7ac8],
      crate: [0xb8793f],
      chest: [0xd89034, 0xf5d06a],
      ladder: [0xa66b3b],
      doorOpen: [0x54a7d8],
      blockGrassLarge: [0x62bd58],
      blockGrassLong: [0x62bd58],
      blockSnowLarge: [0xd9f2f1],
      rocks: [0x9aa6aa],
      stones: [0x9aa6aa],
      grass: [0x55b96b],
      flowers: [0xffd35b],
      plant: [0x55b96b],
      coinGold: [0xf6c84b],
      star: [0xffdf56],
      pathLong: [0xd9b57c],
      pathShort: [0xd9b57c],
      pathStonesLong: [0xb7aaa0],
      pathStonesMessy: [0xb7aaa0, 0xd6c5ab],
      houseA: [0x86c7d6, 0xe38b53, 0xf8e0b0],
      houseB: [0x8ec66e, 0xd87545, 0xf8e0b0],
      houseC: [0xd69a55, 0xba5d45, 0xf8e0b0],
      towerA: [0x71a8dc, 0x4a70b8, 0xe6f0ff],
      towerB: [0x71a8dc, 0x4a70b8, 0xe6f0ff],
      towerC: [0x5f91d2, 0x2f5ea4, 0xe6f0ff],
      towerD: [0x5f91d2, 0x2f5ea4, 0xe6f0ff],
      towerWatch: [0xb98b52, 0x6f4a32],
      cityBuildingA: [0xd1904f, 0xf1d48a],
      cityBuildingK: [0xc07f45, 0xf1d48a],
      castleGate: [0x9aa6aa, 0x6d7782],
      castleDoor: [0x8a6a4d, 0x6d7782],
      shipSmall: [0x9b653b, 0xd9b36a],
      shipWreck: [0x80634a],
      dockSmall: [0x9b653b],
      palmStraight: [0x43a45b, 0x9a6a3f],
      palmBend: [0x43a45b, 0x9a6a3f],
      sandPatch: [0xd9b36a],
      cabinTreeSnow: [0xdff4f3, 0x7a573a],
      train: [0xca4d48, 0xf0c65a, 0x4b5968],
      railStraight: [0x6f5a46, 0x9b785a],
    };
    const colors = palette[key] || [0xd8c3a3];
    return colors[primitiveIndex % colors.length];
  }

  function refreshSceneState() {
    saveProgress(app.progress);
    updateProgressText();
    renderCatalog();
    const node = getSelectedNode();
    if (node) updateInfoPanel(node);
    if (app.map3d) app.map3d.refresh(app.progress);
  }

  function updateProgressText() {
    const total = app.course.nodes.length;
    const seen = app.progress.completed.length;
    const text = `${seen}/${total} 看过`;
    dom.progressText.textContent = text;
    dom.hudProgress.textContent = `${seen}/${total}`;
    dom.sourceText.textContent = app.course.source;
    if (app.course.loadError) dom.sourceText.title = app.course.loadError;
  }

  function markNodeCompleted(nodeId) {
    if (!app.progress.completed.includes(nodeId)) app.progress.completed.push(nodeId);
    if (!app.learningRecords[nodeId]) {
      app.learningRecords[nodeId] = {
        status: "seen",
        eventCount: 0,
        interactionCount: 0,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      };
    }
    app.progress.recommended = getRecommendedNode(app.course.nodes, app.progress)?.id || null;
    saveProgress(app.progress);
  }

  function loadProgress(nodes) {
    let completed = [];
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && Array.isArray(saved.completed)) completed = saved.completed;
    } catch (_error) {
      completed = [];
    }
    const nodeIds = new Set(nodes.map((node) => node.id));
    completed = completed.filter((id) => nodeIds.has(id));
    const progress = { completed, recommended: null };
    progress.recommended = getRecommendedNode(nodes, progress)?.id || null;
    saveProgress(progress);
    return progress;
  }

  function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  async function loadLearningRecords() {
    try {
      const response = await fetch("/api/tracker-summary", { cache: "no-store" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const data = await response.json();
      return data && data.ok && data.modules && typeof data.modules === "object" ? data.modules : {};
    } catch (_error) {
      return {};
    }
  }

  function mergeTrackerProgress(nodes) {
    const nodeIds = new Set(nodes.map((node) => node.id));
    const seenIds = Object.keys(app.learningRecords).filter((id) => nodeIds.has(id));
    const merged = new Set([...(app.progress.completed || []), ...seenIds]);
    app.progress.completed = Array.from(merged).filter((id) => nodeIds.has(id));
    app.progress.recommended = getRecommendedNode(nodes, app.progress)?.id || null;
    saveProgress(app.progress);
  }

  function getLearningRecord(nodeId) {
    return app.learningRecords[nodeId] || null;
  }

  function formatRecentTime(value) {
    if (!value) return "暂无";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "暂无";
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    const time = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
    if (sameDay) return `今天 ${time}`;
    return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }) + ` ${time}`;
  }

  function getSelectedNode() {
    return app.selectedNodeId ? findNode(app.selectedNodeId) : null;
  }

  function findNode(id) {
    return app.course.nodes.find((node) => node.id === id) || null;
  }

  function isNodeOpen(node, progress) {
    return true;
  }

  function getNodeStatus(node, progress) {
    return progress.completed.includes(node.id) ? "seen" : "unlearned";
  }

  function getRecommendedNode(nodes, progress) {
    return nodes.find((node) => !progress.completed.includes(node.id) && isNodeOpen(node, progress)) || null;
  }

  function getPrereqNames(node) {
    return node.prereq.map((id) => {
      const prereq = findNode(id);
      return prereq ? `${prereq.code} ${prereq.title}` : id;
    });
  }

  function getLockedPrereqNames(node) {
    return node.prereq
      .filter((id) => !app.progress.completed.includes(id))
      .map((id) => {
        const prereq = findNode(id);
        return prereq ? `${prereq.code} ${prereq.title}` : id;
      });
  }

  function createLayer(name) {
    const layer = new THREE.Group();
    layer.name = name;
    return layer;
  }

  function toonMaterial(color, options = {}) {
    const MaterialClass = THREE.MeshLambertMaterial || THREE.MeshStandardMaterial;
    const material = new MaterialClass({
      color,
      flatShading: true,
      transparent: Boolean(options.transparent),
      opacity: options.opacity ?? 1,
    });
    if ("roughness" in material) material.roughness = options.roughness ?? 0.9;
    if ("metalness" in material) material.metalness = 0;
    if (material.transparent) material.depthWrite = options.depthWrite ?? false;
    if (options.emissive) {
      material.emissive = new THREE.Color(options.emissive);
      material.emissiveIntensity = 0.42;
    }
    return material;
  }

  function invisibleMaterial() {
    return new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  }

  function makeRoundedBox(width, height, depth, _radius, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth, 3, 1, 3), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function createGroundShadow(width, depth, opacity = 0.16) {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1, 32),
      new THREE.MeshBasicMaterial({
        color: 0x31514c,
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(width * 0.5, depth * 0.5, 1);
    return shadow;
  }

  function makeRoadCurve(from, to) {
    const a = new THREE.Vector3(from[0], 0.04, from[2]);
    const b = new THREE.Vector3(to[0], 0.04, to[2]);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);
    const side = dz >= 0 ? 1 : -1;
    const longHop = length > 5.4;
    const bend = clamp(length * (longHop ? 0.36 : 0.26), 0.75, longHop ? 2.8 : 1.9) * side;
    const first = a.clone().lerp(b, 0.32).add(new THREE.Vector3(0, 0, bend));
    const second = a.clone().lerp(b, 0.7).add(new THREE.Vector3(0, 0, bend * (longHop ? 1.05 : 0.72)));
    return new THREE.CatmullRomCurve3([a, first, second, b]);
  }

  function distance2D(from, to) {
    return Math.hypot(to[0] - from[0], to[2] - from[2]);
  }

  function createLandmarkModel(node, status, index) {
    const group = new THREE.Group();
    const locked = status === "unlearned";
    const palette = getPalette(node.theme, index, locked);
    const type = index % 6;
    if (type === 0) group.add(createHouseModel(palette, index));
    else if (type === 1) group.add(createMeasuringTowerModel(palette, index));
    else if (type === 2) group.add(createCheckpointModel(palette, index));
    else if (type === 3) group.add(createTowerModel(palette, index));
    else if (type === 4) group.add(createPortalModel(palette));
    else group.add(createWorkshopModel(palette));
    return group;
  }

  function getPalette(theme, index, locked) {
    if (locked) return { main: 0x99a3ad, roof: 0x747e89, trim: 0xd2d7dc };
    if (theme === "starter-plain") return { main: index % 2 ? 0x78c66a : 0x63b86c, roof: 0xc9793d, trim: 0xfff0bd };
    if (theme === "mlp-hills") return { main: 0x5c8ed6, roof: 0x385ba2, trim: 0xe6f0ff };
    if (theme === "sequence-forest") return { main: 0x4c9c67, roof: 0x2f6b52, trim: 0xf3e8ae };
    return { main: 0xd19148, roof: 0xa86035, trim: 0xffedbd };
  }

  function createHouseModel(palette, index = 0) {
    const keys = ["houseA", "houseB", "houseC"];
    const model = createKenneyModel(keys[index % keys.length], {
      scale: index % 3 === 2 ? 0.38 : 0.48,
      rotationY: -0.28 + index * 0.18,
      tint: palette.main,
      tintStrength: 0.08,
    });
    if (model) return model;

    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.52, 0.55), toonMaterial(palette.main));
    body.position.y = 0.32;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.42, 4), toonMaterial(palette.roof));
    roof.position.y = 0.82;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.04), toonMaterial(palette.trim));
    door.position.set(0, 0.21, 0.29);
    group.add(door);
    return group;
  }

  function createMeasuringTowerModel(palette, index = 0) {
    const keys = ["towerA", "towerB"];
    const model = createKenneyModel(keys[index % keys.length], {
      scale: 0.42,
      rotationY: -0.2,
      tint: palette.main,
      tintStrength: 0.08,
    });
    if (model) return model;

    const group = new THREE.Group();
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.92, 6), toonMaterial(palette.main));
    tower.position.y = 0.54;
    tower.castShadow = true;
    group.add(tower);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.28, 6), toonMaterial(palette.roof));
    cap.position.y = 1.14;
    group.add(cap);
    for (let i = 0; i < 4; i += 1) {
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.03, 0.03), toonMaterial(palette.trim));
      mark.position.set(0, 0.35 + i * 0.14, 0.24);
      group.add(mark);
    }
    return group;
  }

  function createCheckpointModel(palette, index = 0) {
    const model = createKenneyModel(index % 2 ? "castleDoor" : "castleGate", {
      scale: index % 2 ? 0.2 : 0.18,
      rotationY: 0.15,
      tint: palette.main,
      tintStrength: 0.08,
    });
    if (model) return model;

    const group = new THREE.Group();
    const archA = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.7, 0.16), toonMaterial(palette.main));
    archA.position.set(-0.25, 0.43, 0);
    const archB = archA.clone();
    archB.position.x = 0.25;
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.16, 0.18), toonMaterial(palette.roof));
    lintel.position.y = 0.82;
    group.add(archA, archB, lintel);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), toonMaterial(palette.trim, { emissive: palette.trim }));
    gem.position.y = 1.05;
    group.add(gem);
    return group;
  }

  function createTowerModel(palette, index = 0) {
    const keys = ["towerC", "towerD", "towerWatch"];
    const model = createKenneyModel(keys[index % keys.length], {
      scale: keys[index % keys.length] === "towerWatch" ? 0.28 : 0.34,
      rotationY: -0.25,
      tint: palette.main,
      tintStrength: 0.06,
    });
    if (model) return model;

    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.15, 0.45), toonMaterial(palette.main));
    body.position.y = 0.66;
    body.castShadow = true;
    group.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.52, 4), toonMaterial(palette.roof));
    roof.position.y = 1.48;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
    return group;
  }

  function createPortalModel(palette) {
    const door = createKenneyModel("doorOpen", { scale: 0.86, tint: palette.main, tintStrength: 0.18 });
    if (door) return door;

    const group = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 8, 20), toonMaterial(palette.main, { emissive: palette.main }));
    ring.position.y = 0.6;
    ring.rotation.y = Math.PI / 2;
    group.add(ring);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.14, 0.36), toonMaterial(palette.roof));
    base.position.y = 0.12;
    group.add(base);
    return group;
  }

  function createWorkshopModel(palette = { main: 0xbe7b3e, roof: 0x734832, trim: 0xf5d06a }) {
    const building = createKenneyModel("cityBuildingK", {
      scale: 0.62,
      rotationY: 0.05,
      tint: palette.main,
      tintStrength: 0.08,
    });
    if (building) {
      const group = new THREE.Group();
      group.add(building);
      const crate = createKenneyModel("crate", { scale: 0.34, rotationY: 0.5 });
      if (crate) {
        crate.position.set(-0.45, 0, 0.48);
        group.add(crate);
      }
      const ladder = createKenneyModel("ladder", { scale: 0.38, rotationY: Math.PI / 2 });
      if (ladder) {
        ladder.position.set(0.5, 0.04, -0.34);
        group.add(ladder);
      }
      return group;
    }

    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.46, 0.62), toonMaterial(palette.main));
    body.position.y = 0.33;
    body.castShadow = true;
    group.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.18, 0.72), toonMaterial(palette.roof));
    roof.position.y = 0.66;
    group.add(roof);
    const gear = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 12), toonMaterial(palette.trim));
    gear.position.set(0, 0.38, 0.34);
    group.add(gear);

    const crate = createKenneyModel("crate", { scale: 0.3, rotationY: 0.5 });
    if (crate) {
      crate.position.set(-0.36, 0, 0.35);
      group.add(crate);
    }
    const ladder = createKenneyModel("ladder", { scale: 0.36, rotationY: Math.PI / 2 });
    if (ladder) {
      ladder.position.set(0.42, 0.04, -0.28);
      group.add(ladder);
    }

    return group;
  }

  function createCodeBoard(code, status) {
    const group = new THREE.Group();
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = status === "unlearned" ? "#6f7882" : "#8b5a32";
    roundRect(ctx, 20, 30, 216, 70, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,245,213,.9)";
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.fillStyle = "#fff7d8";
    ctx.font = "900 44px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(code, 128, 66);
    const texture = new THREE.CanvasTexture(canvas);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
    group.add(board);
    return group;
  }

  function createFlagModel(color) {
    const model = createKenneyModel("flag", { scale: 0.56, tint: color, tintStrength: 0.38 });
    if (model) return model;

    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), toonMaterial(0x79512f));
    pole.position.y = 0.45;
    group.add(pole);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.25, 0.035), toonMaterial(color));
    flag.position.set(0.22, 0.74, 0);
    group.add(flag);
    return group;
  }

  function createLockModel() {
    const model = createKenneyModel("lock", { scale: 0.48 });
    if (model) return model;

    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.16), toonMaterial(0x747e89));
    body.position.y = 0.18;
    group.add(body);
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 16, Math.PI), toonMaterial(0x747e89));
    shackle.position.y = 0.34;
    shackle.rotation.z = Math.PI;
    group.add(shackle);
    return group;
  }

  function createTreeModel(scale = 1, variant = "tree") {
    const key = variant === "snow" ? "treeSnow" : variant === "pine" ? "treePine" : "tree";
    const model = createKenneyModel(key, { scale: scale * 0.54, rotationY: scale * 0.9 });
    if (model) return model;

    const group = new THREE.Group();
    group.scale.setScalar(scale);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.45, 6), toonMaterial(0x7a5231));
    trunk.position.y = 0.22;
    trunk.castShadow = true;
    group.add(trunk);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.75, 7), toonMaterial(0x3fa66a));
    crown.position.y = 0.77;
    crown.castShadow = true;
    group.add(crown);
    return group;
  }

  function createRockModel() {
    const useStones = createRockModel.count % 2 === 0;
    createRockModel.count += 1;
    const model = createKenneyModel(useStones ? "stones" : "rocks", { scale: useStones ? 0.52 : 0.44 });
    if (model) return model;

    const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), toonMaterial(0x9aa6aa));
    mesh.position.y = 0.18;
    mesh.scale.set(1.2, 0.65, 0.9);
    mesh.castShadow = true;
    return mesh;
  }
  createRockModel.count = 0;

  function createGrassClump() {
    const variants = ["grass", "flowers", "plant"];
    const key = variants[createGrassClump.count % variants.length];
    createGrassClump.count += 1;
    const model = createKenneyModel(key, { scale: key === "grass" ? 0.5 : 0.42, rotationY: createGrassClump.count * 0.6 });
    if (model) return model;

    const group = new THREE.Group();
    for (let i = 0; i < 5; i += 1) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.32 + (i % 2) * 0.1, 4), toonMaterial(0x56b96d));
      blade.position.set(-0.18 + i * 0.09, 0.14, (i % 2) * 0.06);
      blade.rotation.z = (-0.25 + i * 0.1);
      group.add(blade);
    }
    return group;
  }
  createGrassClump.count = 0;

  function createMistPuff(scale = 0.5) {
    const group = new THREE.Group();
    const material = toonMaterial(0xeef4f4, { transparent: true, opacity: 0.38, depthWrite: false });
    addBlob(group, material, [-0.18, 0.02, 0], [0.34, 0.09, 0.2]);
    addBlob(group, material, [0.08, 0.05, 0.02], [0.42, 0.12, 0.24]);
    addBlob(group, material, [0.34, 0.01, -0.02], [0.28, 0.08, 0.18]);
    group.scale.setScalar(scale);
    return group;
  }

  function addBlob(group, material, position, scale) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    group.add(mesh);
  }

  function createMascotModel() {
    const model = createKenneyModel("mascot", { scale: 0.52, rotationY: -0.35 });
    if (model) return model;

    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), toonMaterial(0x2f6ed3));
    body.scale.set(0.9, 1.1, 0.8);
    body.position.y = 0.38;
    body.castShadow = true;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), toonMaterial(0xfff0d7));
    head.position.y = 0.75;
    head.castShadow = true;
    group.add(head);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 5), toonMaterial(0x2d8ee4));
    cap.position.y = 0.96;
    cap.rotation.y = Math.PI / 5;
    group.add(cap);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.25, 20), toonMaterial(0x253142, { transparent: true, opacity: 0.18 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    group.add(shadow);
    return group;
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.CourseMapApp = {
    getNodeStatus,
    isNodeOpen,
    getPrereqNames,
    selectNode,
    focusNode,
    updateInfoPanel,
    toggleCatalogView,
  };
})();

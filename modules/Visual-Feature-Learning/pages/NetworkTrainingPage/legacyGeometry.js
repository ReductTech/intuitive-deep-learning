// Geometry copied from the archived lab; standalone, with no legacy runtime dependency.
import * as THREE from 'three';
const IMAGE_HEIGHT=28, IMAGE_WIDTH=28;
const MORANDI={charcoal:0x748db3,ivory:0xffffff,stone:0xffc5a8,blueGray:0x91b8f5,slate:0xb5d1fa,pool:0xc1e9df,poolEdge:0x79b8ac,activation:0xc5d6fa};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const clampToChannelPreset=x=>clamp(x,8,64);
function createModuleShadow(){return new THREE.Group();}
function setArchLayerUserData(group,index){group.traverse(child=>child.userData.layerIndex=index);}
  function morandiMatteMaterial(color, emissive, opacity) {
    var alpha = opacity === undefined || opacity >= 0.98 ? 1 : opacity;
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || MORANDI.charcoal,
      emissiveIntensity: 0.018,
      roughness: 0.32,
      metalness: 0.08,
      transparent: alpha < 1,
      opacity: alpha,
      side: THREE.DoubleSide,
    });
  }

  function glassMaterial(color, emissive, opacity) {
    return new THREE.MeshPhysicalMaterial({
      color: color,
      emissive: emissive || color,
      emissiveIntensity: 0.025,
      roughness: 0.26,
      metalness: 0.06,
      clearcoat: 0.58,
      clearcoatRoughness: 0.38,
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
      depthWrite: opacity > 0.58,
    });
  }

  function poolFlatMaterial(opacity) {
    var alpha = opacity === undefined || opacity >= 0.98 ? 1 : opacity;
    return new THREE.MeshBasicMaterial({
      color: MORANDI.pool,
      transparent: alpha < 1,
      opacity: alpha,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
  }

  function addEdges(mesh, color, opacity) {
    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity || 0.55 })
    );
    edges.userData.edgeLine = true;
    edges.userData.baseEdgeColor = color;
    edges.userData.baseEdgeOpacity = opacity || 0.55;
    mesh.add(edges);
    return edges;
  }

  function channelSpan(channels) {
    var count = Math.max(1, Number(channels) || 1);
    return clamp(Math.sqrt(count) * 0.083, 0.10, 1.02);
  }

  function factorGrid(count) {
    var safeCount = Math.max(1, Math.round(Number(count) || 1));
    var rows = 1;
    for (var candidate = Math.floor(Math.sqrt(safeCount)); candidate >= 1; candidate -= 1) {
      if (safeCount % candidate === 0) {
        rows = candidate;
        break;
      }
    }
    var columns = safeCount / rows;
    return { columns: columns, rows: rows };
  }

  function featureMapSize(shape) {
    shape = shape || { h: IMAGE_HEIGHT, w: IMAGE_WIDTH, c: 3 };
    var channels = Math.max(1, Number(shape.c) || 1);
    return {
      height: clamp((Number(shape.h) || IMAGE_HEIGHT) / IMAGE_HEIGHT * 0.68, 0.12, 0.68),
      depth: clamp((Number(shape.w) || IMAGE_WIDTH) / IMAGE_WIDTH * 0.52, 0.10, 0.52),
      thickness: clamp(0.035 + Math.log2(channels + 1) * 0.020, 0.055, 0.18),
      channels: channels,
    };
  }

  function createActivationPlate3d(height, depth) {
    var group = new THREE.Group();
    var plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, height, depth),
      glassMaterial(MORANDI.activation, 0x111515, 0.66)
    );
    plate.userData.draggable = true;
    addEdges(plate, 0x8aaee7, 0.38);
    group.add(plate);
    return group;
  }

  function createPoolFrustum3d(inputShape, outputShape) {
    var left = featureMapSize(inputShape);
    var right = featureMapSize(outputShape);
    var length = 0.32;
    var x0 = -length / 2;
    var x1 = length / 2;
    var lh = left.height / 2;
    var ld = left.depth / 2;
    var rh = right.height / 2;
    var rd = right.depth / 2;
    var vertices = new Float32Array([
      x0, -lh, -ld,  x0, lh, -ld,  x0, lh, ld,  x0, -lh, ld,
      x1, -rh, -rd,  x1, rh, -rd,  x1, rh, rd,  x1, -rh, rd,
    ]);
    var indices = [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      3, 2, 6, 3, 6, 7,
      1, 5, 6, 1, 6, 2,
      0, 3, 7, 0, 7, 4,
    ];
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    var mesh = new THREE.Mesh(
      geometry,
      poolFlatMaterial(0.96)
    );
    mesh.userData.role = 'poolFrustum';
    mesh.userData.poolFrustum = {
      length: length,
      left: { height: left.height, depth: left.depth },
      right: { height: right.height, depth: right.depth },
    };
    mesh.userData.draggable = true;
    addEdges(mesh, MORANDI.poolEdge, 0.40);
    return { mesh: mesh, length: length, left: left, right: right };
  }

  function createConv3d(layer, index, entry) {
    var group = new THREE.Group();
    var inputChannels = entry && entry.input ? Number(entry.input.c) || 3 : 3;
    var outChannels = clampToChannelPreset(Number(layer.out_channels) || 16);
    var kernel = clamp(Number(layer.kernel_size) || 3, 1, 7);
    var kernelCount = Math.round(outChannels);
    var grid = factorGrid(kernelCount);
    var columns = grid.columns;
    var rows = grid.rows;
    var cell = clamp(0.084 + kernel * 0.009, 0.078, 0.12);
    var gap = 0.020;
    var kernelLength = channelSpan(inputChannels);
    var totalDepth = columns * cell + (columns - 1) * gap;
    var totalHeight = rows * cell + (rows - 1) * gap;
    var startZ = -totalDepth / 2 + cell / 2;
    var startY = totalHeight / 2 - cell / 2;
    var activationGap = 0.006;
    var activationThickness = 0.042;
    var totalLength = kernelLength + activationGap + activationThickness;
    var cursor = -totalLength / 2;
    var kernelCenterX = cursor + kernelLength / 2;
    var kernelMaterial = morandiMatteMaterial(MORANDI.blueGray, 0x111515, 0.98);
    for (var i = 0; i < kernelCount; i += 1) {
      var col = i % columns;
      var row = Math.floor(i / columns);
      var material = kernelMaterial.clone();
      material.color.setHex(i % 5 === 0 ? MORANDI.stone : (i % 2 === 0 ? MORANDI.blueGray : MORANDI.slate));
      var brick = new THREE.Mesh(
        new THREE.BoxGeometry(kernelLength, cell, cell),
        material
      );
      brick.position.set(kernelCenterX, startY - row * (cell + gap), startZ + col * (cell + gap));
      brick.userData.role = 'convKernel';
      brick.userData.draggable = true;
      brick.userData.kernelIndex = i;
      brick.userData.baseColor = brick.material.color.getHex();
      addEdges(brick, MORANDI.ivory, kernelCount <= 48 ? 0.24 : 0.20);
      group.add(brick);
    }
    cursor += kernelLength + activationGap;
    var activation = createActivationPlate3d(totalHeight, totalDepth);
    activation.position.x = cursor + activationThickness / 2;
    group.add(activation);
    var pickHeight = Math.max(0.70, totalHeight) + 0.18;
    var pickDepth = Math.max(0.58, totalDepth) + 0.16;
    var pick = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.76, totalLength + 0.12), pickHeight, pickDepth),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    pick.position.y = 0.03;
    pick.userData.pickable = false;
    group.add(pick, createModuleShadow(Math.max(0.42, totalLength * 0.58), 0.22 + pickDepth * 0.16, 0.22));
    setArchLayerUserData(group, index);
    return group;
  }

  function createPool3d(layer, index, entry) {
    var group = new THREE.Group();
    var frustum = createPoolFrustum3d(
      entry && entry.input ? entry.input : null,
      entry && entry.shape ? entry.shape : null
    );
    group.add(frustum.mesh);
    var pickHeight = Math.max(0.70, frustum.left.height, frustum.right.height) + 0.18;
    var pickDepth = Math.max(0.58, frustum.left.depth, frustum.right.depth) + 0.16;
    var pick = new THREE.Mesh(
      new THREE.BoxGeometry(
        Math.max(0.62, frustum.length + 0.10),
        pickHeight,
        pickDepth
      ),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    pick.position.y = 0.03;
    pick.userData.pickable = false;
    group.add(pick, createModuleShadow(Math.max(0.34, frustum.length * 0.56), 0.22 + pickDepth * 0.16, 0.20));
    setArchLayerUserData(group, index);
    return group;
  }

export {createConv3d,createPool3d,addEdges};

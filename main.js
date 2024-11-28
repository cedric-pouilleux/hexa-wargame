import * as THREE from 'three';

import { useSun } from './src/sun.js';
import { useControls } from './src/controls.js';
import { useWater } from './src/water.js';
import { useStats } from './src/ui/stats.js';
import { useGUI } from './src/ui/gui.js';
import { useRenderer } from './src/renderer.js';
import { useMap } from './src/map.js';
import { useClouds } from './src/clouds.js';
import { mapConfig } from './src/config/map.js';
import { axialToGrid, getValidNeighbors, gridToAxial } from './src/utils/grid.js';

const hexWidth = () => Math.sqrt(3) * mapConfig.hexRadius;
const hexHeight = () => 2 * mapConfig.hexRadius;
const verticalSpacing = () => hexHeight() * 0.75;
const gridWidth = () => (mapConfig.cols - 1) * hexWidth() + hexWidth();
const gridHeight = () => (mapConfig.rows - 1) * verticalSpacing() + hexHeight();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 10000);
camera.zoom = 1.2;
camera.updateProjectionMatrix();
const { renderer } = useRenderer();

const bordersGroup = new THREE.Group();
const tileColors = new Map();

const { stats } = useStats();
const { controls } = useControls(camera, renderer.domElement, camera);
const { updateSun, sunLight } = useSun();
const { waterSurface, waterVolume, updateWater } = await useWater({ waterHeight: mapConfig.waterHeight }, gridWidth(), gridHeight());
const { map, updateMap, hexs } = useMap(mapConfig, gridWidth(), gridHeight());
const { clouds, cloudsAnimate, cloudsUpdate } = await useClouds(gridWidth(), gridHeight(), mapConfig.weatherMode);

const ground = createGround();

function init() {
  setupScene();
  setupGUI();
  animate();
  startColonization(centerColonizationConfig());
  startColonization(randomColonizationConfig());
  updateBorders();
  setInterval(checkAndFillSurroundedTiles, 1000);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
  updateSun(mapConfig.sunRotationSpeed);
  waterSurface.material.uniforms['time'].value += 1.0 / 60.0;
  cloudsAnimate();
  renderer.render(scene, camera);
}

function setupScene() {
  scene.add(new THREE.AmbientLight(0x333333));
  scene.add(map, waterSurface, waterVolume, ground, sunLight, bordersGroup);
  if (clouds.length) scene.add(...clouds);
  camera.position.set(300, 500, 300);
  document.body.appendChild(renderer.domElement);
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('click', selectAndHighlightNeighbors, false);
}

function setupGUI() {
  useGUI({
    updateMapCallBack: () => {
      scene.remove(map);
      updateMap(mapConfig, gridWidth(), gridHeight());
      scene.add(map);
      updateBorders();
    },
    updateWaterCallBack: () => updateWater({
      waterHeight: mapConfig.waterHeight,
      gridHeight: gridHeight(),
      gridWidth: gridWidth(),
    }),
    updateCloudCallBack: () => {
      scene.remove(...clouds);
      cloudsUpdate({ width: gridWidth(), height: gridHeight(), weatherMode: mapConfig.weatherMode });
      clouds.length && scene.add(...clouds);
    },
    saveMapCallback: saveMap,
  });
}

function createGround() {
  const groundGeometry = new THREE.PlaneGeometry(200000, 200000);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -10;
  return ground;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function saveMap() {
  const blob = new Blob([JSON.stringify(hexs)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `iron-grid-${Date()}.json`;
  link.click();
}

function updateBorders() {
  bordersGroup.clear();
  hexs.forEach((hex, instanceId) => {
    const { q, r } = getTileCoordinates(instanceId);
    const neighbors = getValidNeighbors(q, r, mapConfig.cols, mapConfig.rows);
    neighbors.forEach(([nq, nr]) => {
      const neighborInstanceId = getInstanceIdFromCoordinates(nq, nr);
      if (neighborInstanceId !== undefined && tileColors.has(instanceId) && tileColors.has(neighborInstanceId)) {
        const color1 = tileColors.get(instanceId);
        const color2 = tileColors.get(neighborInstanceId);
        if (color1 !== color2) {
          createBorderLineBetweenHexes(instanceId, neighborInstanceId);
        }
      }
    });
  });
}

function createBorderLineBetweenHexes(instanceId1, instanceId2) {
  const pos1 = getHexPosition(instanceId1);
  const pos2 = getHexPosition(instanceId2);
  pos1.y += 2;
  pos2.y += 2;
  const geometry = new THREE.BufferGeometry().setFromPoints([pos1, pos2]);
  const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 4, depthTest: false });
  const line = new THREE.Line(geometry, material);
  bordersGroup.add(line);
}

function getHexPosition(instanceId) {
  const { q, r } = getTileCoordinates(instanceId);
  const x = q * hexWidth();
  const z = r * verticalSpacing() + (q % 2 === 0 ? 0 : verticalSpacing() / 2);
  const y = hexs[instanceId].elevation;
  return new THREE.Vector3(x, y, z);
}

function getTileCoordinates(instanceId) {
  const row = Math.floor(instanceId / mapConfig.cols);
  const col = instanceId % mapConfig.cols;
  return gridToAxial(col, row);
}

function getInstanceIdFromCoordinates(q, r) {
  const { col, row } = axialToGrid(q, r);
  if (col < 0 || col >= mapConfig.cols || row < 0 || row >= mapConfig.rows) {
    return undefined;
  }
  return row * mapConfig.cols + col;
}

function selectAndHighlightNeighbors(event) {
  event.preventDefault();
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const instancedTopMesh = map.children[0];
  const intersects = raycaster.intersectObject(instancedTopMesh);
  if (intersects.length > 0) {
    const intersection = intersects[0];
    const instanceId = intersection.instanceId;
    if (instanceId !== undefined) {
      highlightTile(instanceId, 0xcccccc);
      const { q, r } = getTileCoordinates(instanceId);
      const neighbors = getValidNeighbors(q, r, mapConfig.cols, mapConfig.rows);
      neighbors.forEach(([nq, nr]) => {
        const neighborInstanceId = getInstanceIdFromCoordinates(nq, nr);
        if (neighborInstanceId !== undefined) {
          highlightTile(neighborInstanceId, 0xffffff);
        }
      });
    }
  }
  instancedTopMesh.instanceColor.needsUpdate = true;
}

function highlightTile(instanceId, color) {
  map.children[0].setColorAt(instanceId, new THREE.Color(color));
  tileColors.set(instanceId, color);
}

function startColonization(config) {
  const visited = new Set();
  const queue = [config.start];
  visited.add(config.start.id);
  tileColors.set(config.start.id, config.start.color);
  setInterval(() => expandColonization(queue, visited, config), config.interval);
}

function expandColonization(queue, visited, config) {
  if (queue.length > 0) {
    const current = queue.shift();
    const { q, r } = getTileCoordinates(current.id);
    const neighbors = getValidNeighbors(q, r, mapConfig.cols, mapConfig.rows);
    neighbors.sort(() => Math.random() - 0.5);
    if (config.sortNeighbors) {
      neighbors.sort(config.sortNeighbors);
    }
    const branchFactor = Math.ceil(Math.random() * 2) + 1;
    for (let i = 0; i < branchFactor && neighbors.length > 0; i++) {
      const [nq, nr] = neighbors.shift();
      const neighborInstanceId = getInstanceIdFromCoordinates(nq, nr);
      if (neighborInstanceId !== undefined && !visited.has(neighborInstanceId) && !tileColors.has(neighborInstanceId)) {
        queue.push({ id: neighborInstanceId, color: config.color(current) });
        visited.add(neighborInstanceId);
        map.children[0].setColorAt(neighborInstanceId, new THREE.Color(config.color(current)));
        tileColors.set(neighborInstanceId, config.color(current));
      }
    }
    map.children[0].instanceColor.needsUpdate = true;
  }
}

function checkAndFillSurroundedTiles() {
  hexs.forEach((hex, instanceId) => {
    if (!tileColors.has(instanceId)) return;
    const { q, r } = getTileCoordinates(instanceId);
    const neighbors = getValidNeighbors(q, r, mapConfig.cols, mapConfig.rows);
    const currentColor = tileColors.get(instanceId);
    if (neighbors.length > 0 && neighbors.every(([nq, nr]) => {
      const neighborInstanceId = getInstanceIdFromCoordinates(nq, nr);
      return neighborInstanceId !== undefined && tileColors.has(neighborInstanceId) && tileColors.get(neighborInstanceId) === currentColor;
    })) {
      highlightTile(instanceId, currentColor);
      map.children[0].instanceColor.needsUpdate = true;
    }
  });
}

function centerColonizationConfig() {
  const centerCol = Math.floor(mapConfig.cols / 2);
  const centerRow = Math.floor(mapConfig.rows / 2);
  const centerInstanceId = centerRow * mapConfig.cols + centerCol;
  return {
    start: { id: centerInstanceId, color: 0x000000, distance: 0 },
    color: (current) => new THREE.Color(0x000000).lerp(new THREE.Color(0xffffff), current.distance / 100).getHex(),
    interval: 10,
  };
}

function randomColonizationConfig() {
  const randomCol = Math.floor(Math.random() * mapConfig.cols);
  const randomRow = Math.floor(Math.random() * mapConfig.rows);
  const randomInstanceId = randomRow * mapConfig.cols + randomCol;
  return {
    start: { id: randomInstanceId, color: 0xffffff },
    color: (current) => current.color,
    interval: 10,
    sortNeighbors: ([nq1, nr1], [nq2, nr2]) => {
      const neighborId1 = getInstanceIdFromCoordinates(nq1, nr1);
      const neighborId2 = getInstanceIdFromCoordinates(nq2, nr2);
      return hexs[neighborId1].elevation - hexs[neighborId2].elevation;
    },
  };
}

init();
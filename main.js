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
const {renderer} = useRenderer();

const {stats} = useStats();
const {controls} = useControls(camera, renderer.domElement, camera);

const {updateSun, sunLight} = useSun();
const {waterSurface, waterVolume, updateWater} = await useWater({waterHeight: mapConfig.waterHeight}, gridWidth(), gridHeight());
const {map, updateMap, hexs} = useMap(mapConfig, gridWidth(), gridHeight());
const {clouds, cloudsAnimate, cloudsUpdate} = await useClouds(gridWidth(), gridHeight(), mapConfig.weatherMode);

const groundGeometry = new THREE.PlaneGeometry(200000, 200000);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x000000});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -10;

function init() {
  // scene.add(new THREE.AxesHelper( 1500 ));
  // scene.add( new THREE.DirectionalLightHelper( sunLight, 50 ) );
  scene.add(new THREE.AmbientLight(0x333333));
  scene.add(map);
  scene.add(waterSurface);
  scene.add(waterVolume);
  scene.add(ground);
  scene.add(sunLight);
  clouds.length && scene.add(...clouds);
  camera.position.set(300, 500, 300);
  useGUI({
    updateMapCallBack: () => {
      scene.remove(map);
      updateMap(mapConfig, gridWidth(), gridHeight());
      scene.add(map);
    },
    updateWaterCallBack:() => updateWater({
      waterHeight: mapConfig.waterHeight,
      gridHeight: gridHeight(),
      gridWidth: gridWidth()
    }),
    updateCloudCallBack: () => {
      scene.remove(...clouds);
      cloudsUpdate({width: gridWidth(), height: gridHeight(), weatherMode: mapConfig.weatherMode});
      clouds.length && scene.add(...clouds);
    },
    saveMapCallback: () => {
      const blob = new Blob([JSON.stringify(hexs)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `iron-grid-${Date()}.json`;
      link.click();
    }
  });
  animate();
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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

document.addEventListener('click', selectAndHighlightNeighbors, false);

let isRightMouseDown = false;
let lastLevelingTime = 0;
const levelingInterval = 1; // en millisecondes

document.addEventListener('mousedown', onDocumentMouseDown, false);
document.addEventListener('mouseup', onDocumentMouseUp, false);
document.addEventListener('mousemove', onDocumentMouseMove, false);

// Modifiez l'écouteur de clic existant pour le bouton gauche
document.addEventListener('click', (event) => {
  if (event.button === 0) { // 0 est le bouton gauche
    selectAndHighlightNeighbors(event);
  }
}, false);

function onDocumentMouseDown(event) {
  if (event.button === 2) { // 2 est le bouton droit
    isRightMouseDown = true;
  }
}

function onDocumentMouseUp(event) {
  if (event.button === 2) {
    isRightMouseDown = false;
  }
}

function onDocumentMouseMove(event) {
  if (isRightMouseDown) {
    const currentTime = Date.now();
    if (currentTime - lastLevelingTime > levelingInterval) {
      levelTiles(event);
      lastLevelingTime = currentTime;
    }
  }
}

function levelTiles(event) {
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
      const { q, r } = getTileCoordinates(instanceId);
      const tilesToLevel = getTilesWithinDistance(q, r, 3);

      tilesToLevel.forEach(({ q: nq, r: nr, distance }) => {
        const neighborInstanceId = getInstanceIdFromCoordinates(nq, nr);
        if (neighborInstanceId !== undefined) {
          lowerTile(neighborInstanceId, distance);
        }
      });

      instancedTopMesh.instanceMatrix.needsUpdate = true;
    }
  }
}

function getTilesWithinDistance(q, r, maxDistance) {
  const tiles = [];
  for (let dx = -maxDistance; dx <= maxDistance; dx++) {
    for (let dy = Math.max(-maxDistance, -dx - maxDistance); dy <= Math.min(maxDistance, -dx + maxDistance); dy++) {
      const dz = -dx - dy;
      const distance = (Math.abs(dx) + Math.abs(dy) + Math.abs(dz)) / 2;
      if (distance <= maxDistance) {
        const nq = q + dx;
        const nr = r + dy;
        // Convertir les coordonnées axiales en coordonnées de grille
        const { col, row } = axialToGrid(nq, nr);
        if (col >= 0 && row >= 0 && col < mapConfig.cols && row < mapConfig.rows) {
          tiles.push({ q: nq, r: nr, distance });
        }
      }
    }
  }
  return tiles;
}

function lowerTile(instanceId, distance) {
  const instancedTopMesh = map.children[0];

  const matrix = new THREE.Matrix4();
  instancedTopMesh.getMatrixAt(instanceId, matrix);

  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  matrix.decompose(position, quaternion, scale);

  // Calculer la quantité de réduction basée sur la distance (linéaire)
  const maxReduction = 1; // La hauteur maximale à réduire pour la tuile centrale
  const reduction = maxReduction * (1 - distance / 3);

  // Réduire la hauteur et ajuster la position en conséquence
  scale.y = Math.max(0.1, scale.y - reduction);
  position.y = scale.y / 2;

  // Recomposer la matrice
  matrix.compose(position, quaternion, scale);
  instancedTopMesh.setMatrixAt(instanceId, matrix);

  // Optionnel : mettre à jour la couleur pour indiquer le changement
  // instancedTopMesh.setColorAt(instanceId, new THREE.Color(0x8B4513)); // Marron pour la terre abaissée
  // instancedTopMesh.instanceColor.needsUpdate = true;
}

document.body.appendChild(renderer.domElement);
init();

// Game main
function getTileCoordinates(instanceId) {
  console.log(instanceId);
  const row = Math.floor(instanceId / mapConfig.cols);
  const col = instanceId % mapConfig.cols;
  return gridToAxial(col, row);
}

function getInstanceIdFromCoordinates(q, r) {
  const { col, row } = axialToGrid(q, r); 
  const instanceId = row * mapConfig.cols + col;
  return instanceId;
}

function selectAndHighlightNeighbors(event){
  event.preventDefault();
  const rect = renderer.domElement.getBoundingClientRect();

  const mouse = new THREE.Vector2();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const instancedTopMesh = map.children[0];

  const intersects = raycaster.intersectObject(instancedTopMesh); // Revert to selecting only the hex map layer

  if (intersects.length > 0) {
    const intersection = intersects[0];
    const instanceId = intersection.instanceId;

    if (instanceId !== undefined) {
      // Highlight the selected tile
      instancedTopMesh.setColorAt(instanceId, new THREE.Color(0xcccccc));
      instancedTopMesh.instanceColor.needsUpdate = true;

      // Get and highlight neighbors
      const { q, r } = getTileCoordinates(instanceId); 
      const neighbors = getValidNeighbors(q, r, mapConfig.cols, mapConfig.rows);

      neighbors.forEach(([nq, nr]) => {
        const neighborInstanceId = getInstanceIdFromCoordinates(nq, nr); 
        if (neighborInstanceId !== undefined) {
          instancedTopMesh.setColorAt(neighborInstanceId, new THREE.Color(0xffffff));
        }
      });
      instancedTopMesh.instanceColor.needsUpdate = true;
    }
  }
}

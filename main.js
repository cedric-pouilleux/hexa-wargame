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
const {map, updateMap} = useMap(mapConfig, gridWidth(), gridHeight());
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

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

const hexWidth = () => Math.sqrt(3) * mapConfig.hexRadius;
const hexHeight = () => 2 * mapConfig.hexRadius;
const verticalSpacing = () => hexHeight() * 0.75;
const gridWidth = () => (mapConfig.cols - 1) * hexWidth() + hexWidth();
const gridHeight = () => (mapConfig.rows - 1) * verticalSpacing() + hexHeight();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);

const {renderer} = useRenderer();
const {stats} = useStats();
const {controls} = useControls(camera, renderer.domElement);

const {sunLight, sunMesh, updateSun} = useSun();
const {waterSurface, waterVolume, updateWater} = await useWater({waterHeight: mapConfig.waterHeight}, gridWidth(), gridHeight());
const {map, instancedTopMesh, updateMap} = useMap(mapConfig, gridWidth(), gridHeight());
const {clouds, cloudsAnimate, cloudsUpdate} = await useClouds(gridWidth(), gridHeight(), mapConfig.weatherMode);

function init() {
  scene.add(new THREE.AxesHelper( 1500 ));
  scene.add(new THREE.AmbientLight(0x404040));
  scene.add(map);
  scene.add(waterSurface);
  scene.add(waterVolume);
  scene.add(sunMesh);
  scene.add(sunLight);
  scene.add(...clouds);
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
    scene.add(...clouds);
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

document.addEventListener('click', (event) => {
  event.preventDefault();
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(instancedTopMesh);

  if (intersects.length > 0) {
    const intersection = intersects[0];
    const instanceId = intersection.instanceId;

    if (instanceId !== undefined) {
      instancedTopMesh.setColorAt(instanceId, new THREE.Color(0xff0000));
      instancedTopMesh.instanceColor.needsUpdate = true;
    }
  }
}, false);

document.body.appendChild(renderer.domElement);
init();


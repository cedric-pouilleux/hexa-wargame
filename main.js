import * as THREE from 'three';
import GUI from 'lil-gui';

import { useSun } from './src/sun.js';
import { useControls } from './src/controls.js';
import { useWater } from './src/water.js';
import { useStats } from './src/stats.js';
import { useRenderer } from './src/renderer.js';
import { useMap } from './src/map.js';
import { useClouds } from './src/clouds.js';
import { EffectComposer, RenderPass } from 'postprocessing';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GodraysPass } from 'three-good-godrays';

const mapConfig = {
  scale: 200,
  rows:40,
  cols:40,
  waterHeight: 20,
  hexRadius: 3,
  frequency: 0.4,
  amplitude: 0.8,
  maxAmplitude: 0,
  persistence: 0.5,
  lacunarity: 2,
  octaves: 3
}

const hexWidth = () => Math.sqrt(3) * mapConfig.hexRadius;
const hexHeight = () => 2 * mapConfig.hexRadius;
const verticalSpacing = () => hexHeight() * 0.75;
const gridWidth = () => (mapConfig.cols - 1) * hexWidth() + hexWidth();
const gridHeight = () => (mapConfig.rows - 1) * verticalSpacing() + hexHeight();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);

const {renderer} = useRenderer();
const {sunLight, sunMesh, updateSun} = useSun();
const {controls} = useControls(camera, renderer.domElement);
const {waterSurface, waterVolume, updateWater} = useWater({waterHeight: mapConfig.waterHeight}, gridWidth(), gridHeight());
const {stats} = useStats();
const {map, instancedTopMesh, updateMap} = useMap(mapConfig, gridWidth(), gridHeight());
const {clouds, cloudsAnimate, cloudsUpdate} = await useClouds(gridWidth(), gridHeight());


// Paramètres configurables
let sunRotationSpeed = 0.01;
let weatherMode = 'clear';

function init() {
  // scene.add(new THREE.AxesHelper( 1500 ));
  scene.add(new THREE.AmbientLight(0x404040));
  scene.add(map);
  scene.add(waterSurface);
  scene.add(waterVolume);
  scene.add(sunMesh);
  scene.add(sunLight);
  scene.add(...clouds);
  
  camera.position.set(300, 500, 300);

  // scene.fog = new THREE.Fog(0xd0e0f0, 1, 1200);
  
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
  updateSun(sunRotationSpeed);
  // waterSurface.material.uniforms['time'].value += 1.0 / 60.0;
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

// Interface utilisateur avec lil-gui
const gui = new GUI();
gui.add({ sunRotationSpeed }, 'sunRotationSpeed', 0, 0.1, 0.001).name('Sun Rotation Speed').onChange(value => {
  sunRotationSpeed = value;
});

gui.add({ weatherMode }, 'weatherMode', ['clear', 'cloudy', 'stormy']).name('Weather Mode').onChange(value => {
  // weatherMode = value;
  // updateWeatherMode(weatherMode);
  // updateCloudsInScene();
});

gui.add({ hexRadius: mapConfig.hexRadius }, 'hexRadius', 1, 10, 0.1).name('Hex Radius').onChange(value => {
  mapConfig.hexRadius = value;
  updateWaterAfterChange();
  updateMapAfterChange();
});

gui.add({ rows: mapConfig.rows }, 'rows', 10, 200, 1).name('Rows').onChange(value => {
  scene.remove(...clouds);
  mapConfig.rows = value;
  cloudsUpdate({width: gridWidth(), height: gridHeight()});
  updateWaterAfterChange();
  updateMapAfterChange();
  scene.add(...clouds);
});

gui.add({ cols: mapConfig.cols}, 'cols', 10, 200, 1).name('Cols').onChange(value => {
  scene.remove(...clouds);
  mapConfig.cols = value;
  cloudsUpdate({width: gridWidth(), height: gridHeight()});
  updateWaterAfterChange();
  updateMapAfterChange();
  scene.add(...clouds);
});

gui.add({ scale: mapConfig.scale}, 'scale', 10, 600, 1).name('Scale').onChange(value => {
  mapConfig.scale = value;
  updateMapAfterChange();
});

gui.add({ frequency: mapConfig.frequency}, 'frequency', 0.1, 1, 0.05).name('Frequency').onChange(value => {
  mapConfig.frequency = value;
  updateMapAfterChange();
});

gui.add({ amplitude: mapConfig.amplitude}, 'amplitude', 0, 4, 0.05).name('Amplitude').onChange(value => {
  mapConfig.amplitude = value;
  updateMapAfterChange();
});

gui.add({ maxAmplitude: mapConfig.maxAmplitude}, 'maxAmplitude', 0, 10, 0.05).name('Max Amplitude').onChange(value => {
  mapConfig.maxAmplitude = value;
  updateMapAfterChange();
});

gui.add({ persistence: mapConfig.persistence}, 'persistence', 0, 20, 0.05).name('Persistence').onChange(value => {
  mapConfig.persistence = value;
  updateMapAfterChange();
});

gui.add({ lacunarity: mapConfig.lacunarity}, 'lacunarity', 0, 10, 0.1).name('Lacunarity').onChange(value => {
  mapConfig.lacunarity = value;
  updateMapAfterChange();
});

gui.add({ octaves: mapConfig.octaves}, 'octaves', 0.1, 8, 0.1).name('Octaves').onChange(value => {
  mapConfig.octaves = value;
  updateMapAfterChange();
});

gui.add({ waterHeight: mapConfig.waterHeight}, 'waterHeight', 1, 100, 1).name('Water Height').onChange(value => {
  mapConfig.waterHeight = value;
  updateWaterAfterChange();
  updateMapAfterChange();
});

function updateMapAfterChange(){
  scene.remove(map);
  updateMap(mapConfig, gridWidth(), gridHeight());
  scene.add(map);
}

function updateWaterAfterChange(){
  updateWater({
    waterHeight: mapConfig.waterHeight,
    gridHeight: gridHeight(),
    gridWidth: gridWidth()
  }); 
}

init();

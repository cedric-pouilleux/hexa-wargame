import * as THREE from 'three';

import { useSun } from './src/sun.js';
import { useControls } from './src/controls.js';
import { useWater } from './src/water.js';
import { useStats } from './src/stats.js'
import { useRenderer } from './src/renderer.js';
import { useMap } from './src/map.js';

const hexRadius = 3;
const rows = 100;
const cols = 100;
const hexWidth = Math.sqrt(3) * hexRadius;  
const hexHeight = 2 * hexRadius;
const verticalSpacing = hexHeight * 0.75;
const gridWidth = (cols - 1) * hexWidth + hexWidth;
const gridHeight = (rows - 1) * verticalSpacing + hexHeight; 

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);

const {renderer} = useRenderer();
const {sunLight, sunMesh, updateSun} = useSun();
const {controls} = useControls(camera, renderer.domElement);
const {waterSurface, waterVolume} = useWater(gridWidth, gridHeight);
const {stats} = useStats();
const {map, instancedTopMesh} = useMap(rows, cols, hexRadius, gridWidth, gridHeight);
 
function init() {
  scene.add(sunMesh);
  scene.add(new THREE.AmbientLight(0x404040));
  scene.add(sunLight);
  scene.add(map);
  // scene.add(new THREE.AxesHelper( 1500 ));
  scene.add(waterSurface);
  scene.add(waterVolume);
  camera.position.set(300, 300, 500);
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
  updateSun();
  waterSurface.material.uniforms['time'].value += 1.0 / 60.0;
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
      console.log(`Instance cliquée: ${instanceId}`);
      instancedTopMesh.setColorAt(instanceId, new THREE.Color(0xff0000));
      instancedTopMesh.instanceColor.needsUpdate = true;
    }
  }
}, false);


document.body.appendChild(renderer.domElement);
init();


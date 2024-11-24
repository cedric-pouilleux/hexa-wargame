import * as THREE from 'three';

import { useSun } from './src/sun.js';
import { useControls } from './src/controls.js';
import { useWater } from './src/water.js';
import { useStats } from './src/stats.js'
import { useRenderer } from './src/renderer.js';
import { useMap } from './src/map.js';
import { useClouds } from './src/clouds.js';
import { EffectComposer, RenderPass } from 'postprocessing';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GodraysPass } from 'three-good-godrays';

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
const {clouds, cloudsAnimate} = await useClouds(gridWidth, gridHeight);

// // Composer
// const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
// const renderPass = new RenderPass(scene, camera);
// renderPass.renderToScreen = false;
// composer.addPass(renderPass);

// const godraysPass = new GodraysPass(sunLight, camera, {
//   density: 0.5,
//   maxDensity: 0.2,
//   edgeStrength: 5.0,
//   edgeRadius: 2.0,
//   distanceAttenuation: 2.0,
//   color: new THREE.Color(0xffffff), // Ajustez la couleur pour correspondre à la lumière du soleil
//   raymarchSteps: 100,
// });
// // If this is the last pass in your pipeline, set `renderToScreen` to `true`
// godraysPass.renderToScreen = true;
// composer.addPass(godraysPass);

function init() {
  // scene.add(new THREE.AxesHelper( 1500 ));

  scene.add(new THREE.AmbientLight(0x404040));
  
  scene.add(map);

  scene.add(sunMesh);
  scene.add(sunLight);
  scene.add(waterSurface);
  scene.add(waterVolume);
  scene.add(...clouds);
  
  camera.position.set(300, 300, 500);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
  updateSun();
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
      console.log(`Instance cliquée: ${instanceId}`);
      instancedTopMesh.setColorAt(instanceId, new THREE.Color(0xff0000));
      instancedTopMesh.instanceColor.needsUpdate = true;
    }
  }
}, false);


document.body.appendChild(renderer.domElement);
init();


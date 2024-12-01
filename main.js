// main.js
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

const { stats } = useStats();
const { controls } = useControls(camera, renderer.domElement, camera);

const { updateSun, sunLight } = useSun();
const { waterSurface, waterVolume, updateWater } = await useWater({ waterHeight: mapConfig.waterHeight }, gridWidth(), gridHeight());
const { map, updateMap, hexs } = useMap(mapConfig, gridWidth(), gridHeight());
const { clouds, cloudsAnimate, cloudsUpdate } = await useClouds(gridWidth(), gridHeight(), mapConfig.weatherMode);

const groundGeometry = new THREE.PlaneGeometry(200000, 200000);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -10;

// Configuration du picking
const pickingScene = new THREE.Scene();
const pickingRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
  format: THREE.RGBAFormat,
});
const instanceCount = mapConfig.rows * mapConfig.cols;

function init() {
  // Ajout des éléments à la scène principale
  scene.add(new THREE.AmbientLight(0x333333));
  scene.add(map);
  scene.add(waterSurface);
  scene.add(waterVolume);
  scene.add(ground);
  scene.add(sunLight);
  if (clouds.length) scene.add(...clouds);
  camera.position.set(300, 500, 300);
  
  // Configuration de l'interface utilisateur
  useGUI({
    updateMapCallBack: () => {
      scene.remove(map);
      updateMap(mapConfig, gridWidth(), gridHeight());
      scene.add(map);
    },
    updateWaterCallBack: () => updateWater({
      waterHeight: mapConfig.waterHeight,
      gridHeight: gridHeight(),
      gridWidth: gridWidth()
    }),
    updateCloudCallBack: () => {
      scene.remove(...clouds);
      cloudsUpdate({ width: gridWidth(), height: gridHeight(), weatherMode: mapConfig.weatherMode });
      if (clouds.length) scene.add(...clouds);
    },
    saveMapCallback: () => {
      const blob = new Blob([JSON.stringify(hexs)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `iron-grid-${Date.now()}.json`;
      link.click();
    }
  });

  // Création de la scène de picking
  setupPickingScene(map.children[0]);

  // Ajout du contrôle de hauteur des hexagones
  addHexHeightControl(map.children[0], camera, renderer);
  
  // Démarrage de l'animation
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
  pickingRenderTarget.setSize(window.innerWidth, window.innerHeight);
}, false);

document.body.appendChild(renderer.domElement);
init();

/**
 * Fonction pour configurer la scène de picking
 * @param {THREE.InstancedMesh} instancedMesh - L'InstancedMesh de la carte
 */
function setupPickingScene(instancedMesh) {
  // Générer la texture de picking
  const { texture, width, height } = generatePickingTexture(instanceCount);

  // Création du matériau de picking
  const pickingMaterial = new THREE.RawShaderMaterial({
    vertexShader: `
      precision mediump float;
      attribute vec3 position;
      attribute mat4 instanceMatrix;
      attribute float instanceId;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      varying float vInstanceId;

      void main() {
        vInstanceId = instanceId;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      varying float vInstanceId;
      uniform sampler2D pickingTexture;
      uniform float textureWidth;
      uniform float textureHeight;

      void main() {
        float id = vInstanceId;
        float u = mod(id, textureWidth) / textureWidth + (0.5 / textureWidth);
        float v = floor(id / textureWidth) / textureHeight + (0.5 / textureHeight);
        vec3 color = texture2D(pickingTexture, vec2(u, v)).rgb;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    uniforms: {
      pickingTexture: { value: texture },
      textureWidth: { value: width },
      textureHeight: { value: height },
    },
  });

  // Création de l'InstancedMesh pour le picking
  const pickingInstancedMesh = new THREE.InstancedMesh(
    instancedMesh.geometry,
    pickingMaterial,
    instanceCount
  );

  // Copier les matrices d'instance de l'InstancedMesh original
  const dummy = new THREE.Object3D();
  for (let i = 0; i < instanceCount; i++) {
    instancedMesh.getMatrixAt(i, dummy.matrix);
    pickingInstancedMesh.setMatrixAt(i, dummy.matrix);
  }
  pickingInstancedMesh.instanceMatrix.needsUpdate = true;

  // Copier les attributs nécessaires
  pickingInstancedMesh.geometry.setAttribute(
    'instanceId',
    instancedMesh.geometry.attributes.instanceId
  );

  // Désactiver le frustum culling pour s'assurer que tous les hexagones sont rendus
  pickingInstancedMesh.frustumCulled = false;

  // Ajouter l'InstancedMesh de picking à la scène de picking
  pickingScene.add(pickingInstancedMesh);
}

/**
 * Génère une texture de picking avec des couleurs uniques pour chaque instance
 * @param {number} count - Nombre total d'instances
 * @returns {Object} - Texture générée et ses dimensions
 */
function generatePickingTexture(count) {
  const width = Math.ceil(Math.sqrt(count));
  const height = width;
  const size = width * height;
  const data = new Uint8Array(size * 4); // RGBA nécessite 4 composants

  for (let i = 0; i < count; i++) {
    const color = idToColor(i + 1); // Commence à 1 pour éviter le fond (id=0)
    data[i * 4 + 0] = Math.floor(color.r * 255);
    data[i * 4 + 1] = Math.floor(color.g * 255);
    data[i * 4 + 2] = Math.floor(color.b * 255);
    data[i * 4 + 3] = 255; // Canal alpha défini au maximum
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;

  // Configuration des paramètres de texture
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.flipY = false;

  return { texture, width, height };
}

/**
 * Convertit un identifiant en couleur RGB
 * @param {number} id - Identifiant de l'instance
 * @returns {THREE.Color} - Couleur correspondante
 */
function idToColor(id) {
  const r = ((id >> 16) & 0xff) / 255;
  const g = ((id >> 8) & 0xff) / 255;
  const b = (id & 0xff) / 255;
  return new THREE.Color(r, g, b);
}

/**
 * Fonction pour contrôler la hauteur des hexagones en fonction des clics de souris
 * @param {THREE.InstancedMesh} instancedMesh - L'InstancedMesh de la carte
 * @param {THREE.Camera} camera - La caméra de la scène
 * @param {THREE.WebGLRenderer} renderer - Le renderer de Three.js
 */
function addHexHeightControl(instancedMesh, camera, renderer) {
  const mouse = new THREE.Vector2();
  let isMouseDown = false;

  renderer.domElement.addEventListener('mousedown', (event) => {
    isMouseDown = true;
    pickInstance(event);
  });

  renderer.domElement.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  renderer.domElement.addEventListener('mousemove', (event) => {
    if (isMouseDown) {
      pickInstance(event);
    }
  });

  function pickInstance(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Obtenir le pixelRatio
    const pixelRatio = renderer.getPixelRatio();

    const pixelX = Math.floor(mouseX * pixelRatio);
    const pixelY = Math.floor(mouseY * pixelRatio);

    const flippedY = pickingRenderTarget.height - pixelY - 1;

    const pixelBuffer = new Uint8Array(4);

    // Stocker les paramètres originaux du renderer
    const originalToneMapping = renderer.toneMapping;
    const originalOutputEncoding = renderer.outputEncoding;
    const originalAutoClear = renderer.autoClear;
    const originalRenderTarget = renderer.getRenderTarget();

    // Configurer le renderer pour le picking
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputEncoding = THREE.LinearEncoding;
    renderer.autoClear = true;
    renderer.setClearColor(0x000000, 0);

    // Rendu de la scène de picking
    renderer.setRenderTarget(pickingRenderTarget);
    renderer.clear();
    renderer.render(pickingScene, camera);
    renderer.setRenderTarget(originalRenderTarget);

    // Restaurer les paramètres du renderer
    renderer.toneMapping = originalToneMapping;
    renderer.outputEncoding = originalOutputEncoding;
    renderer.autoClear = originalAutoClear;

    // Lecture du pixel
    try {
      renderer.readRenderTargetPixels(
        pickingRenderTarget,
        pixelX,
        flippedY,
        1,
        1,
        pixelBuffer
      );
    } catch (error) {
      console.warn('readRenderTargetPixels error:', error);
      return;
    }

    const id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2];

    console.log(`Pixel coordinates: x=${pixelX}, y=${flippedY}`);
    console.log(`Pixel buffer: [${pixelBuffer[0]}, ${pixelBuffer[1]}, ${pixelBuffer[2]}, ${pixelBuffer[3]}]`);
    console.log(`Picked id: ${id}`);

    if (id >= 1 && id <= instanceCount) {
      const actualId = id - 1;
      const instanceHeightAttr = instancedMesh.geometry.attributes.instanceHeight;
      if (instanceHeightAttr) {
        instanceHeightAttr.array[actualId] += 0.1;
        instanceHeightAttr.needsUpdate = true;
      }
    }
  }
}
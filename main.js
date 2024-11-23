import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

// Importer les modules (si vous les avez séparés)
import { createHexGrid } from './terrain.js';
import {initLights} from './lights.js'; 
import {updateSun} from './sun.js';

let scene, camera, renderer, controls;
let gridCenterX = 0, gridCenterZ = 0;

let water;
let stats;

// Ajouter les statistiques FPS
if (typeof document !== 'undefined') {
  stats = Stats();
  document.body.appendChild(stats.dom);
}

let instancedTopMesh;

const textureLoader = new THREE.TextureLoader();
const waterNormals = textureLoader.load('./assets/waternormals.jpg', function (texture) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
});

let hexMeshes = []; // Tableau pour stocker les hexagones individuels
let selectedHex = null; // Hexagone actuellement sélectionné

const hexRadius = 5;
const rows = 50;
const cols = 50;

let hexWidth, hexHeight, verticalSpacing;
const waterHeight = 20; // Variable unique pour la hauteur de l'eau

  
// Configurer les lumières
const {ambientLight, sunLight} = initLights();
const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  emissive: 0xffff00,
  emissiveIntensity: 1,
});
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.copy(sunLight.position);

function init() {
  // Initialiser la scène
  scene = new THREE.Scene();
  
  // Initialiser la caméra
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
  
  // Initialiser le renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  
  // Initialiser les contrôles
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.5;
  controls.screenSpacePanning = false; 
  controls.maxPolarAngle = Math.PI / 2;
  controls.enablePan = false;

  scene.add(sunMesh);
  scene.add(ambientLight);
  scene.add(sunLight);

  // Créer le terrain
  createTerrain();

  // Ajouter l'eau
  addWater();
  
  // Initialiser les écouteurs d'événements
  initEventListeners();
  
  // Démarrer l'animation
  animate();
}

function createTerrain() {
  // Les variables hexRadius, rows, cols sont déjà globales
  const scale = 100;
  const offsetX = Math.random() * 1000;
  const offsetY = Math.random() * 1000; 
  
  // Calculer les dimensions des hexagones
  hexWidth = Math.sqrt(3) * hexRadius; // Largeur effective d'un hexagone
  hexHeight = 2 * hexRadius; // Hauteur effective d'un hexagone
  verticalSpacing = hexHeight * 0.75; // Espacement vertical entre les rangées

  const instanceCount = rows * cols;

  // Créer la géométrie et le matériau partagés pour les faces supérieures
  const topGeometry = new THREE.CircleGeometry(hexRadius, 6);
  topGeometry.rotateX(-Math.PI / 2); // Faire tourner la géométrie pour qu'elle soit horizontale
  const materialTop = new THREE.MeshStandardMaterial({
    color: 0x228B22,
    flatShading: true,
    metalness: 0,
    roughness: 1,
  });

  instancedTopMesh = new THREE.InstancedMesh(topGeometry, materialTop, instanceCount);

  const gridData = createHexGrid(rows, cols, hexRadius, scale, offsetX, offsetY, undefined,instancedTopMesh );
  const hexGrid = gridData.grid;
  gridCenterX = gridData.gridCenterX;
  gridCenterZ = gridData.gridCenterZ;

  // Collecter les meshes des hexagones
  hexGrid.traverse(function(child) {
    if (child.isMesh) {
      hexMeshes.push(child);
      // Stocker la couleur originale
      child.userData.originalColor = child.material.color.clone();
    }
  });

  scene.add(hexGrid);
  
  camera.position.set(gridCenterX + 300, 300, gridCenterZ + 500); 
  camera.lookAt(new THREE.Vector3(gridCenterX, 0, gridCenterZ));

  controls.target.set(gridCenterX, 0, gridCenterZ);
  controls.update();
}

function addWater() {
  // Calculer la taille de la grille
  const gridWidth = (cols - 1) * hexWidth + hexWidth;
  const gridHeight = (rows - 1) * verticalSpacing + hexHeight;

  // **Créer le volume d'eau**
  // Créer la géométrie du volume d'eau
  const waterVolumeGeometry = new THREE.BoxGeometry(gridWidth + 5, 25, gridHeight + 5);

  // Créer le matériau pour le volume d'eau
  const waterVolumeMaterial = new THREE.MeshPhongMaterial({
    color: 0x437a93,
    transparent: true,
  });

  const waterVolume = new THREE.Mesh(waterVolumeGeometry, waterVolumeMaterial);

  // Positionner le volume d'eau
  waterVolume.position.set(gridCenterX, waterHeight, gridCenterZ);

  scene.add(waterVolume);

  // **Créer le plan d'eau avec le shader pour la surface**

  // Créer la géométrie du plan d'eau
  const waterSurfaceGeometry = new THREE.PlaneGeometry(gridWidth + 5, gridHeight + 5);

  // Créer le matériau d'eau avancé
  water = new Water(
    waterSurfaceGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormals,
      // sunDirection: sunLight.position.clone().normalize(),
      sunColor: 0xffffff,
      waterColor: 0x437a93,
      distortionScale: 5,
      fog: true
    }
  );

  // Positionner le plan d'eau
  water.rotation.x = - Math.PI / 2;
  water.position.set(gridCenterX, waterHeight + 12.6, gridCenterZ);

  // Ajuster l'ordre de rendu
  water.renderOrder = 1;

  scene.add(water);
}

function initEventListeners() {
  window.addEventListener('resize', onWindowResize, false);
  renderer.domElement.addEventListener('click', onMouseClick, false);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
  updateSun(sunLight, sunMesh, gridCenterX, gridCenterZ);

  // Animer l'eau
  water.material.uniforms['time'].value += 1.0 / 60.0;
  renderer.render(scene, camera);
}


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function selectHexagon(hex) {
  // Désélectionner l'hexagone précédemment sélectionné
  if (selectedHex && selectedHex !== hex) {
    selectedHex.material.color.copy(selectedHex.userData.originalColor);
  }

  if (selectedHex === hex) {
    // Si l'hexagone est déjà sélectionné, le désélectionner
    hex.material.color.copy(hex.userData.originalColor);
    selectedHex = null;
  } else {
    // Sélectionner le nouvel hexagone
    hex.material.color.set(0xff0000); // Changer la couleur pour indiquer la sélection
    selectedHex = hex;
  }
}

// Gestion du clic pour l'InstancedMesh
document.addEventListener('click', onMouseClick, false);

function onMouseClick(event) {
  event.preventDefault();

  // Convertir la position de la souris en coordonnées normalisées (-1 à +1)
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Mettre à jour le raycaster
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Vérifier l'intersection avec l'InstancedMesh
  const intersects = raycaster.intersectObject(instancedTopMesh);

  if (intersects.length > 0) {
    const intersection = intersects[0];
    const instanceId = intersection.instanceId;

    if (instanceId !== undefined) {
      // Utiliser instanceId pour identifier l'hexagone cliqué
      console.log(`Instance cliquée: ${instanceId}`);
      // Par exemple, changer la couleur de l'instance cliquée
      instancedTopMesh.setColorAt(instanceId, new THREE.Color(0xff0000));
      instancedTopMesh.instanceColor.needsUpdate = true;
    }
  }
}

init();

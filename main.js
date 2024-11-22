import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';

// Importer les modules (si vous les avez séparés)
import { createHexGrid } from './terrain.js';

let scene, camera, renderer, controls;
let gridCenterX = 0, gridCenterZ = 0;
let sunLight, sunMesh, sunAngle = 0, sunSpeed = 0.01;
const sunOrbitRadius = 500;
const maxHeight = 100;

const waterLevel = -32;
let water;

const textureLoader = new THREE.TextureLoader();
const waterNormals = textureLoader.load('./waternormals.jpg', function (texture) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
});

let hexMeshes = []; // Tableau pour stocker les hexagones individuels
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let selectedHex = null; // Hexagone actuellement sélectionné

const hexRadius = 5;
const rows = 50;
const cols = 50;

let hexWidth, hexHeight, verticalSpacing;

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
  
  // Configurer les lumières
  initLights();
  
  // Créer le terrain
  createTerrain();

  // Ajouter l'eau
  addWater();
  
  // Initialiser les écouteurs d'événements
  initEventListeners();
  
  // Démarrer l'animation
  animate();
}

function initLights() {
  // Lumière directionnelle
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(100, 100, 100);
  scene.add(light); 
  
  // Lumière ambiante
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  
  // Lumière du soleil
  initSunLight();
}

function initSunLight() {
  sunLight = new THREE.DirectionalLight(0xffffff, 1);
  sunLight.position.set(0, 500, 0);
  sunLight.castShadow = true;
  
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 1000;
  sunLight.shadow.camera.left = -500;
  sunLight.shadow.camera.right = 500;
  sunLight.shadow.camera.top = 500;
  sunLight.shadow.camera.bottom = -500;
  
  scene.add(sunLight);
  
  const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 1,
  });
  sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
  sunMesh.position.copy(sunLight.position);
  scene.add(sunMesh);
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

  const gridData = createHexGrid(rows, cols, hexRadius, scale, offsetX, offsetY);
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

  // Calculer la profondeur de l'eau
  const waterDepth = maxHeight; // Ajustez selon vos besoins

  // Créer la géométrie du volume d'eau
  const waterVolumeGeometry = new THREE.BoxGeometry(gridWidth, waterDepth, gridHeight);

  // Créer le matériau pour le volume d'eau
  const waterVolumeMaterial = new THREE.MeshPhongMaterial({
    color: 0x001e0f,
    transparent: true,
    opacity: 0.1,
    shininess: 100,
  });

  const waterVolume = new THREE.Mesh(waterVolumeGeometry, waterVolumeMaterial);

  // Positionner le volume d'eau
  waterVolume.position.set(gridCenterX, waterLevel - waterDepth / 2, gridCenterZ);

  scene.add(waterVolume);

  // **Créer le plan d'eau avec le shader pour la surface**

  // Créer la géométrie du plan d'eau
  const waterSurfaceGeometry = new THREE.PlaneGeometry(gridWidth, gridHeight);

  // Créer le matériau d'eau avancé
  water = new Water(
    waterSurfaceGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormals,
      sunDirection: sunLight.position.clone().normalize(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: true
    }
  );

  // Positionner le plan d'eau
  water.rotation.x = - Math.PI / 2;
  water.position.set(gridCenterX, waterLevel, gridCenterZ);

  // Ajuster l'ordre de rendu
  waterVolume.renderOrder = 1;
  water.renderOrder = 2;

  // Désactiver l'écriture dans le tampon de profondeur pour le plan d'eau
  water.material.depthWrite = false;

  scene.add(water);
}

function initEventListeners() {
  window.addEventListener('resize', onWindowResize, false);
  renderer.domElement.addEventListener('click', onMouseClick, false);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateSun();

  // Animer l'eau
  water.material.uniforms['time'].value += 1.0 / 60.0;

  renderer.render(scene, camera);
}

function updateSun() {
  sunAngle += sunSpeed;

  const sunX = gridCenterX + sunOrbitRadius * Math.cos(sunAngle);
  const sunZ = gridCenterZ + sunOrbitRadius * Math.sin(sunAngle);
  const sunY = sunOrbitRadius * Math.sin(sunAngle);

  sunLight.position.set(sunX, sunY, sunZ);
  sunMesh.position.copy(sunLight.position);

  sunLight.target.position.set(gridCenterX, 0, gridCenterZ);
  sunLight.target.updateMatrixWorld();

  const sunHeightFactor = Math.max(0, sunY / sunOrbitRadius);
  sunLight.intensity = 1.2 * sunHeightFactor;

  // Mettre à jour la direction du soleil pour l'eau
  water.material.uniforms['sunDirection'].value.copy(sunLight.position.clone().normalize());
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseClick(event) {
  event.preventDefault();

  // Convertir la position de la souris en coordonnées normalisées (-1 à +1)
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Mettre à jour le raycaster
  raycaster.setFromCamera(mouse, camera);

  // Calculer les objets intersectés
  const intersects = raycaster.intersectObjects(hexMeshes);

  if (intersects.length > 0) {
    const intersectedHex = intersects[0].object;

    // Gérer la sélection
    selectHexagon(intersectedHex);
  }
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

    // Vous pouvez également exécuter d'autres actions ici
    // Par exemple, afficher des informations sur l'hexagone sélectionné
  }
}

init();

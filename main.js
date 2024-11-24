import * as THREE from 'three';

import { useSun } from './src/sun.js';
import { useControls } from './src/controls.js';
import { useWater } from './src/water.js';
import { useStats } from './src/stats.js'
import { useRenderer } from './src/renderer.js';
import { useMap } from './src/map.js';

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
const {map, instancedTopMesh, hexs} = useMap(rows, cols, hexRadius, gridWidth, gridHeight);

const cloudParticles = [];
const loader = new THREE.TextureLoader();

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

loader.load('./assets/cloud.jpg', (texture) => { 

const gridWidth = 500; // Remplace par la vraie valeur de ta carte
const gridHeight = 500; // Remplace par la vraie valeur de ta carte

// Créer plusieurs groupes de nuages
for (let i = 0; i < 10; i++) {
  const cloudGroup = new THREE.Group();

  // Ajouter des particules dans chaque groupe pour simuler un nuage
  for (let j = 0; j < 30; j++) {
    const cloudGeo = new THREE.SphereGeometry(15, 25, 25); // Géométrie de chaque "boule" de nuage
    const cloudMaterial = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8, // Réglez l'opacité pour que les particules se mélangent bien
      depthWrite: false,
    });

    const cloud = new THREE.Mesh(cloudGeo, cloudMaterial);

    // Position aléatoire des particules dans le groupe
    cloud.position.set(
      Math.random() * 60 - 30, // Variation X
      Math.random() * 20 - 10, // Variation Y (légère variation verticale)
      Math.random() * 60 - 30  // Variation Z
    );

    cloud.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    // Ajouter chaque sphère de nuage au groupe
    cloudGroup.add(cloud);
  }

  // Positionner le groupe entier au-dessus de la scène (ex. : au-dessus des collines)
 cloudGroup.position.set(
    (Math.random() * gridWidth) - gridWidth / 2,  // Limite X : position entre -gridWidth/2 et gridWidth/2
    140 + Math.random() * 30,                      // Hauteur au-dessus du terrain
    (Math.random() * gridHeight) - gridHeight / 2 // Limite Z : position entre -gridHeight/2 et gridHeight/2
  );

  const sunDirection = new THREE.Vector3();
  sunLight.getWorldDirection(sunDirection);

  cloudParticles.forEach((cloudGroup) => {
    const distance = camera.position.distanceTo(cloudGroup.position);
    const maxDistance = 800; // Ajuster selon la taille de la scène
    const minOpacity = 0.3; // Opacité minimale souhaitée

    cloudParticles.castShadow = true;

    cloudGroup.children.forEach((cloud) => {
      cloud.castShadow = true;
      const cloudToSun = new THREE.Vector3().subVectors(cloud.position, sunLight.position).normalize();
      const intensity = Math.max(0, cloudToSun.dot(sunDirection));
      cloud.material.color.setHSL(0, 0, 0.2 + 0.4 * intensity); // Ajuster la teinte, la saturation et la luminosité
      cloud.material.opacity = Math.max(minOpacity, 1 - distance / maxDistance);
    });
  });

  cloudParticles.push(cloudGroup);
  scene.add(cloudGroup);
}
});

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
  
  cloudParticles.forEach((cloudGroup) => {
    cloudGroup.position.x += 0.05; // Vitesse de déplacement vers la droite
    cloudGroup.position.z += 0.05; // Légère composante de mouvement sur l'axe Z

    // Vérifier si le groupe de nuages est sorti des limites de la carte
    if (cloudGroup.position.x > gridWidth / 2) {
      cloudGroup.position.x = -gridWidth / 2; // Réinitialiser sur le côté gauche
    }
    if (cloudGroup.position.z > gridHeight / 2) {
      cloudGroup.position.z = -gridHeight / 2; // Réinitialiser au début de l'axe Z
    }

    // Optionnel : ajouter un léger mouvement de va-et-vient vertical pour une sensation de "flottement"
    cloudGroup.position.y += Math.sin(Date.now() * 0.001) * 0.005;
  });


  waterSurface.material.uniforms['time'].value += 1.0 / 60.0;

  waterSurface.material.uniforms['time'].value += 1.0 / 60.0;
  // renderer.render(scene, camera);

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


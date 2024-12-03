import * as THREE from "three";
import { TextureLoader } from "three";
import {
  Lensflare,
  LensflareElement,
} from "three/examples/jsm/objects/Lensflare.js";

export function useSun() {
  let sunAngle = 1.8;
  const sunOrbitRadius = 400;

  const sunLight = new THREE.DirectionalLight(0xffffff, 15);
  sunLight.castShadow = true;

  // Shadow properties
  sunLight.shadow.radius = 50;
  sunLight.shadow.blurSamples = 3;
  sunLight.shadow.autoUpdate = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 1000;
  sunLight.shadow.camera.left = -500;
  sunLight.shadow.camera.right = 500;
  sunLight.shadow.camera.top = 500;
  sunLight.shadow.camera.bottom = -500;
  sunLight.shadow.camera.updateProjectionMatrix();

  const textureLoader = new TextureLoader();
  const textureFlare0 = textureLoader.load("../../assets/lensflare0.png");
  const textureFlare3 = textureLoader.load("../../assets/lensflare3.png");
  //const textureFlare2 = textureLoader.load( "../../assets/lensflare3.png" );
  sunLight.lookAt(0, 0, 0);

  // Créer le lens flare
  const lensflare = new Lensflare();
  lensflare.addElement(new LensflareElement(textureFlare0, 200, 0));
  lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6));
  lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7));
  lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9));
  lensflare.addElement(new LensflareElement(textureFlare3, 70, 1));

  function updateSun(sunRotationSpeed) {
    // Mise à jour de l'angle du soleil pour simuler le mouvement
    sunAngle += sunRotationSpeed;

    // Calculer la position du soleil (X, Y, Z)
    const sunX = sunOrbitRadius * Math.cos(sunAngle);
    const sunZ = sunOrbitRadius * Math.sin(sunAngle);
    const sunY = sunOrbitRadius * Math.sin(sunAngle); // Donne un effet de lever/coucher de soleil

    // Mettre à jour la position du sunMesh et du sunLight
    sunLight.position.set(sunX, sunY, sunZ);

    // Faire en sorte que la lumière du soleil "regarde" le centre de la scène
    sunLight.lookAt(0, 0, 0);

    // Ajuster l'intensité de la lumière en fonction de la hauteur du soleil
    const sunHeightFactor = Math.max(0, sunY / sunOrbitRadius);
    sunLight.intensity = 3 * sunHeightFactor;
  }

  sunLight.add(lensflare);

  return {
    sunLight,
    updateSun,
  };
}

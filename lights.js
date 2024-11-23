import * as THREE from 'three';

export function initLights() {
  
  // Lumière ambiante
  const ambientLight = new THREE.AmbientLight(0x404040);

  // Lumière du soleil
  const sunLight = new THREE.DirectionalLight(0xffffff, 1);
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

  return {
    ambientLight,
    sunLight,
  }
}
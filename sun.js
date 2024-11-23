import * as THREE from 'three';
let sunAngle = 0, sunSpeed = 0.001;
const sunOrbitRadius = 500;

export function useSun() {
  // Sun geometry
  const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 1,
  });
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);


  // Sun light
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
  
  sunMesh.position.copy(sunLight.position);
  

  function updateSun() {
    sunAngle += sunSpeed;
  
    const sunX = sunOrbitRadius * Math.cos(sunAngle);
    const sunZ = sunOrbitRadius * Math.sin(sunAngle);
    const sunY = sunOrbitRadius * Math.sin(sunAngle);

    sunLight.position.set(sunX, sunY, sunZ);
    sunMesh.position.copy(sunLight.position);

    sunLight.target.updateMatrixWorld();

    const sunHeightFactor = Math.max(0, sunY / sunOrbitRadius);
    sunLight.intensity = 1.2 * sunHeightFactor;
  }

  return {
    sunMesh,
    sunLight,
    updateSun
  }

}

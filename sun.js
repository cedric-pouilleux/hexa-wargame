let sunAngle = 0, sunSpeed = 0.01;
const sunOrbitRadius = 500;

export function updateSun(sunLight, sunMesh, gridCenterX, gridCenterZ) {
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
  // water.material.uniforms['sunDirection'].value.copy(sunLight.position.clone().normalize());
}

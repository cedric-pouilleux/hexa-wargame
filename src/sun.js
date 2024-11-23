import { useSunGeometry } from './geometry/sun';
import { useSunLight } from './lights/sun';
let sunAngle = 0, sunSpeed = 0.01;
const sunOrbitRadius = 600; 

export function useSun() {

  const { sunMesh }= useSunGeometry();
  const { sunLight } = useSunLight();
  
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

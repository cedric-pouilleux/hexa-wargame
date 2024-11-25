import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function useControls(camera, domElement){
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.5;
  //controls.screenSpacePanning = false; 
  controls.enablePan = false;

  return {
    controls 
  }
}
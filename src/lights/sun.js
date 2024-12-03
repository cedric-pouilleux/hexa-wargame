import * as THREE from "three";
import { TextureLoader, Vector3, DirectionalLight, Color } from "three";
import {
  Lensflare,
  LensflareElement,
} from "three/examples/jsm/objects/Lensflare.js";

export function useSunLight({
  color = 0xffffff,
  intensity = 15,
  position = new THREE.Vector3(100, 500, 100),
} = {}) {
  const sunLight = new THREE.DirectionalLight(color, intensity);
  sunLight.position.copy(position);
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

  // Ajouter le lens flare à la lumière du soleil
  sunLight.add(lensflare);

  return {
    sunLight,
  };
}

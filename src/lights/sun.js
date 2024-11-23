import * as THREE from 'three';

export function useSunLight(){
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(0, 500, 0);
    sunLight.castShadow = true;

    // that properties need use generale map configuration, avoiding square light in on fat map
    sunLight.shadow.radius=5;
    sunLight.shadow.blurSamples=20;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 2000;
    sunLight.shadow.camera.left = -1500;
    sunLight.shadow.camera.right = 1500;
    sunLight.shadow.camera.top = 1500;
    sunLight.shadow.camera.bottom = -1500;

    return {
        sunLight
    }
}
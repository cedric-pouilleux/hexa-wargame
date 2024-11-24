import * as THREE from 'three';

export function useSunLight(){
    
    const lightPos = new THREE.Vector3(0, 500, 0);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(0, 500, 0);
    sunLight.castShadow = true;

    // that properties need use generale map configuration, avoiding square light in on fat map
    sunLight.shadow.radius=5;
    sunLight.shadow.blurSamples=3;
    sunLight.shadow.autoUpdate = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 1000;
    sunLight.shadow.camera.left = -500;
    sunLight.shadow.camera.right = 500;
    sunLight.shadow.camera.top = 500;
    sunLight.shadow.camera.bottom = -500;
    sunLight.shadow.camera.updateProjectionMatrix();
    sunLight.position.copy(lightPos);

    return {
        sunLight
    }
}
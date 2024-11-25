import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';

export async function useWater(opt, gridWidth, gridHeight) {
    let options = {
        waterHeight: opt.waterHeight || 26,
        gridHeight,
        gridWidth
    };

    const waterVolumeMaterial = new THREE.MeshPhongMaterial({
        color: 0x437a93,
        transparent: true,
        opacity: 0.6
    });

    let waterVolume = new THREE.Mesh(new THREE.BoxGeometry(options.gridWidth, options.waterHeight, options.gridHeight), waterVolumeMaterial);
    let waterSurface = new Water(
        new THREE.PlaneGeometry(options.gridWidth, options.gridHeight), {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('./assets/waternormals.jpg', function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(0, 1, 0),
            sunColor: 0xffffff,
            waterColor: 0x437a93,
            distortionScale: 5, 
        }
    );

    function createWater() {
        waterVolume.geometry.dispose();
        waterVolume.geometry = new THREE.BoxGeometry(options.gridWidth + 5, options.waterHeight, options.gridHeight + 5);

        waterSurface.geometry.dispose();
        waterSurface.geometry = new THREE.PlaneGeometry(options.gridWidth + 5, options.gridHeight+5);

        waterSurface.rotation.x = -Math.PI / 2;
        waterSurface.position.set(0, (options.waterHeight * 0.5 + 0.1) * 2, 0);
        waterVolume.position.set(0, options.waterHeight * 0.5 + 0.1, 0);
    }

    function updateWater(pOpt) {
        options = {
            ...options,
            ...pOpt
        };
        createWater();
    }

    createWater();

    return {
        waterVolume,
        waterSurface,
        updateWater
    };
}

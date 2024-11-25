import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';

/**
 * TODO => Rework water update, scale is not a good way
 */
export function useWater(opt, gridWidth, gridHeight){

    let options = {
        waterHeight: opt.waterHeight || 26,
        gridHeight,
        gridWidth
    }

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.loadAsync('./assets/waternormals.jpg');
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    const globalWaterWidth = options.gridWidth + 10; 
    const globalWaterHeight = options.gridHeight + 10;

    const waterVolumeGeometry = new THREE.BoxGeometry(globalWaterWidth, options.waterHeight, globalWaterHeight);
    const waterSurfaceGeometry = new THREE.PlaneGeometry(globalWaterWidth, globalWaterHeight);
    const waterVolumeMaterial = new THREE.MeshPhongMaterial({
        color: 0x437a93,
        transparent: true, 
    });

    const waterVolume = new THREE.Mesh(waterVolumeGeometry, waterVolumeMaterial); 
    const waterSurface  = new Water(
        waterSurfaceGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: texture,
            // sunDirection: sunLight.position.clone().normalize(),
            sunColor: 0xffffff,
            waterColor: 0x437a93,
            distortionScale: 5,
            fog: true
        }
    );

    function createWater(){
        const scaleX = options.gridWidth / 210.5;
        const scaleY = options.gridHeight / 181.5;

        waterVolume.scale.set(scaleX, options.waterHeight * 0.2, scaleY);
        waterSurface.scale.set(scaleX, scaleY, 1);

        waterSurface.rotation.x = - Math.PI / 2;
        waterSurface.position.set(0, options.waterHeight * 2 + 0.1, 0);

        waterVolume.geometry.width = 20;
        waterSurface.updateMatrix();
    }

    function updateWater(pOpt){
        options = pOpt;
        console.log(options);
        createWater();
    }

    createWater();
    
    return {
        waterVolume,
        waterSurface,
        updateWater
    }
}

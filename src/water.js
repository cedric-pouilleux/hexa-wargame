import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';

const waterHeight = 26; // Variable unique pour la hauteur de l'eau

export function useWater(gridWidth, gridHeight){

    const textureLoader = new THREE.TextureLoader();
    const waterNormals = textureLoader.load('./assets/waternormals.jpg', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    });

    const globalWwaterWidth = gridWidth + 10;
    const globalWaterHeight = gridHeight + 10;


    const waterVolumeGeometry = new THREE.BoxGeometry(globalWwaterWidth, 50, globalWaterHeight);
    const waterVolumeMaterial = new THREE.MeshPhongMaterial({
        color: 0x437a93,
        transparent: true, 
    });

    const waterVolume = new THREE.Mesh(waterVolumeGeometry, waterVolumeMaterial);

    // Positionner le volume d'eau
    waterVolume.position.set(0, waterHeight, 0);

    // Créer la géométrie du plan d'eau
    const waterSurfaceGeometry = new THREE.PlaneGeometry(globalWwaterWidth, globalWaterHeight);

    // Créer le matériau d'eau avancé
    const waterSurface = new Water(
        waterSurfaceGeometry,
        {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: waterNormals,
        // sunDirection: sunLight.position.clone().normalize(),
        sunColor: 0xffffff,
        waterColor: 0x437a93,
        distortionScale: 5,
        fog: true
        }
    );

    // Positionner le plan d'eau
    waterSurface.rotation.x = - Math.PI / 2;
    waterSurface.position.set(0, waterHeight + 25.1, 0);

    // Ajuster l'ordre de rendu
    waterSurface.renderOrder = 1;

    return {
        waterVolume,
        waterSurface
    }
}
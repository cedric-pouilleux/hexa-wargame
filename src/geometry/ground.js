import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';

export function useGround(sideGeometries) {
    const mergedSideGeometry = mergeGeometries(sideGeometries);
    const materialSide = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        flatShading: true,
        metalness: 0,
        roughness: 1,
    });

    const ground = new THREE.Mesh(mergedSideGeometry, materialSide);
    ground.raycast = () => {};
    ground.castShadow = true;
    ground.receiveShadow = true;

    return {
        ground
    }
}
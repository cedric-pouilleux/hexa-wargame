import * as THREE from 'three';

export function useTileGeometry(hexRadius) {
    const geometry = new THREE.CircleGeometry(hexRadius, 6);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
        color: 0x228B22,
        flatShading: true,
        metalness: 0,
        roughness: 1,
    });

    return {
        geometry,
        material
    }
}
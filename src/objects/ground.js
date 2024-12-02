import * as THREE from 'three';

export function useGroundGeometry(width, height, color) {
    const groundGeometry = new THREE.PlaneGeometry(width, height);
    const groundMaterial = new THREE.MeshStandardMaterial({color});
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10; 

    return {
        ground
    };
}
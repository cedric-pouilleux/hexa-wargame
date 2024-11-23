import * as THREE from 'three';

export function useSunGeometry() {
    const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 1,
    });
    
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

    return {
        sunMesh
    }
}
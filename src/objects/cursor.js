import * as THREE from 'three';

export function useCursor() {
    // Définition du curseur
    const cursorHeight = 5; // Hauteur du cône
    const cursorRadius = 1;  // Rayon de la base du cône

    // Définition du curseur
    const cursorGeometry = new THREE.ConeGeometry(cursorRadius, cursorHeight, 16); // radius, height, radialSegments
    const cursorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    });
    cursorMaterial.depthTest = false; // Facultatif : rend le curseur toujours visible
    const cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
    cursor.rotation.x = Math.PI; // Faire pointer le cône vers le bas
    cursor.renderOrder = 999; // Facultatif : rend le curseur par-dessus les autres objets
    cursor.visible = false; // Caché par défaut

    return {
        cursor
    }
}
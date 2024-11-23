import * as THREE from 'three';

export function useTilesGroundGeometry(hexRadius, terrainHeight) {
     const groundGeometry = new THREE.CylinderGeometry(
        hexRadius,      // Rayon supérieur
        hexRadius,      // Rayon inférieur
        terrainHeight,  // Hauteur du terrain pour les côtés
        6,              // Nombre de segments radiaux pour un hexagone
        1,              // Hauteur segmentée en 1 seul segment
        true            // Ouvrir le haut et le bas pour pouvoir manipuler les sommets
    );

    return {
        groundGeometry
    }
}
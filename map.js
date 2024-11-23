import { createHexGrid } from "./terrain";
import * as THREE from 'three';

export function useMap(rows, cols, hexRadius, gridWidth, gridHeight){

    const hexMeshes = [];

    const scale = 200; // Define map complexity, hight value get flat map
    const offsetX = Math.random() * 1000;
    const offsetY = Math.random() * 1000;

    const instanceCount = rows * cols;

    // Créer la géométrie et le matériau partagés pour les faces supérieures
    const topGeometry = new THREE.CircleGeometry(hexRadius, 6);
    topGeometry.rotateX(-Math.PI / 2); // Faire tourner la géométrie pour qu'elle soit horizontale
    const materialTop = new THREE.MeshStandardMaterial({
        color: 0x228B22,
        flatShading: true,
        metalness: 0,
        roughness: 1,
    });

    const instancedTopMesh = new THREE.InstancedMesh(topGeometry, materialTop, instanceCount);

    const gridData = createHexGrid(rows, cols, hexRadius, scale, offsetX, offsetY, undefined, instancedTopMesh );
    const map = gridData.grid;

    // Collecter les meshes des hexagones
    map.traverse(function(child) {
        if (child.isMesh) {
        hexMeshes.push(child);
        child.userData.originalColor = child.material.color.clone();
        }
    });

    map.position.set(-gridWidth/2 + 2, 0 , -gridHeight / 2 + 5 );

    return {
        map,
        instancedTopMesh
    }
}
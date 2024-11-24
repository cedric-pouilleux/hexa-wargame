import * as THREE from 'three';
import { useTileGeometry } from './geometry/tile';
import { useTilesGroundGeometry } from './geometry/tilesGround.js';
import { useGround } from './geometry/ground.js';
import { getMapUtils } from './utils/map.js';

const scale = 200;


function getColorBasedOnHeight(height) {
  if (height < 0) {
    // Zones sous l'eau
    return new THREE.Color(0x0000ff); // Bleu
  } else if (height < 5) {
    // Zones basses
    return new THREE.Color(0x00ff00); // Vert
  } else if (height < 10) {
    // Zones moyennes
    return new THREE.Color(0xffff00); // Jaune
  } else {
    // Zones élevées
    return new THREE.Color(0xffffff); // Blanc (neige)
  }
}
 

export function useMap(rows, cols, hexRadius, gridWidth, gridHeight){
    const hexMeshes = [];
    const map = new THREE.Group();
    const {geometry, material} = useTileGeometry(hexRadius);
    
    const instancedTopMesh = new THREE.InstancedMesh(geometry, material, rows * cols);
    instancedTopMesh.castShadow = true;
    instancedTopMesh.receiveShadow = true;

    const sideGeometries = []; 
    let index = 0;
    const hexWidth = Math.sqrt(3) * hexRadius;
    const verticalSpacing = hexRadius * 1.5;

    const hexs = [];

    for (let row = 0; row < rows; row++) {
        hexs[row] = [];
        for (let col = 0; col < cols; col++) {
            const {terrainHeight, x, z} = getMapUtils(row, col, scale, hexWidth, verticalSpacing);

            // ground tiling
            const {groundGeometry} = useTilesGroundGeometry(hexRadius, terrainHeight);
            groundGeometry.translate(x, terrainHeight / 2, z);
            sideGeometries.push(groundGeometry);

            // clickable tile
            const matrix = new THREE.Matrix4();
            matrix.makeRotationY(Math.PI / 6);
            matrix.setPosition(x, terrainHeight, z);
            instancedTopMesh.setMatrixAt(index, matrix);
            instancedTopMesh.setColorAt(index, new THREE.Color(`rgb(0, ${Math.round(terrainHeight) * 2}, 0)`)); // care with that
            hexs[row][col] = { id: index, properties: {} };

            index++;
        }
    }

    instancedTopMesh.instanceColor.needsUpdate = true;

    const {ground} = useGround(sideGeometries);

    map.add(ground);

    map.traverse(function(child) {
        if (child.isMesh) {
        hexMeshes.push(child);
        child.userData.originalColor = child.material.color.clone();
        }
    });

    map.position.set(-gridWidth/2 + 2, 0 , -gridHeight / 2 + 5 );

    map.add(instancedTopMesh);

    return {
        map,
        instancedTopMesh,
        hexs
    }
}
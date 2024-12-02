// src/events/mouseEvents.js
import * as THREE from 'three';
import { getTileCoordinates, getInstanceIdFromCoordinates } from '../utils/grid.js';

let isRightMouseDown = false;
let lastLevelingTime = 0;
const levelingInterval = 1; // ms
const mouse = new THREE.Vector2();

export function handleMouseDown(event) {
  if (event.button === 2) { // 2 est le bouton droit
    isRightMouseDown = true;
  }
}

export function handleMouseUp(event) {
  if (event.button === 2) {
    isRightMouseDown = false;
  }
}

export function handleMouseMove(event, raycaster, map, camera, renderer, cursor, cols, rows) {
  if (isRightMouseDown) {
    const currentTime = Date.now();
    if (currentTime - lastLevelingTime > levelingInterval) {
      levelTiles(event, raycaster, map, renderer, camera, cols, rows);
      lastLevelingTime = currentTime;
    }
  }

  // Mise à jour du curseur
  const instancedTopMesh = map.children[0];
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(instancedTopMesh);

  if (intersects.length > 0) {
    const intersection = intersects[0];
    const instanceId = intersection.instanceId;

    if (instanceId !== undefined) {
      const matrix = new THREE.Matrix4();
      instancedTopMesh.getMatrixAt(instanceId, matrix);
      instancedTopMesh.setColorAt(instanceId, new THREE.Color(0xffffff));

      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();

      matrix.decompose(position, quaternion, scale);

      const hexagonHeight = scale.y;
      const cursorHeightOffset = 3;

      cursor.position.set(
        position.x + map.position.x,
        position.y + map.position.y + hexagonHeight / 2 + cursorHeightOffset,
        position.z + map.position.z
      );
      cursor.visible = true;
    }
  } else {
    cursor.visible = false; // Cache le curseur si aucune tuile n'est survolée
  }
}

export function handleClick(event, raycaster, map, mapConfig) {
  if (event.button === 0) { // 0 est le bouton gauche
    selectAndHighlightNeighbors(event, raycaster, map, mapConfig);
  }
}

function levelTiles(event, raycaster, map, renderer, camera, cols, rows) {
  // Fonction pour réduire la hauteur des tuiles
  event.preventDefault();
  const rect = renderer.domElement.getBoundingClientRect();

  const mouse = new THREE.Vector2();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const instancedTopMesh = map.children[0];

  const intersects = raycaster.intersectObject(instancedTopMesh);

  if (intersects.length > 0) {
    const intersection = intersects[0];
    const instanceId = intersection.instanceId;

    if (instanceId !== undefined) {
      const { q, r } = getTileCoordinates(instanceId, cols);
      const tilesToLevel = getTilesWithinDistance(q, r, 3);

      tilesToLevel.forEach(({ q: nq, r: nr, distance }) => {
        const neighborInstanceId = getInstanceIdFromCoordinates(nq, nr, cols, rows);
        if (neighborInstanceId !== undefined) {
          lowerTile(neighborInstanceId, distance, instancedTopMesh);
        }
      });

      instancedTopMesh.instanceMatrix.needsUpdate = true;
    }
  }
}

function getTilesWithinDistance(q, r, maxDistance) {
  // Récupère les tuiles dans une certaine distance
  const tiles = [];
  for (let dx = -maxDistance; dx <= maxDistance; dx++) {
    for (let dy = Math.max(-maxDistance, -dx - maxDistance); dy <= Math.min(maxDistance, -dx + maxDistance); dy++) {
      const dz = -dx - dy;
      const distance = (Math.abs(dx) + Math.abs(dy) + Math.abs(dz)) / 2;
      if (distance <= maxDistance) {
        const nq = q + dx;
        const nr = r + dy;
        tiles.push({ q: nq, r: nr, distance });
      }
    }
  }
  return tiles;
}

function lowerTile(instanceId, distance, instancedTopMesh) {
  const tempMatrix = new THREE.Matrix4();
  const tempPosition = new THREE.Vector3();
  const tempQuaternion = new THREE.Quaternion();
  const tempScale = new THREE.Vector3();

  instancedTopMesh.getMatrixAt(instanceId, tempMatrix);

  tempMatrix.decompose(tempPosition, tempQuaternion, tempScale);

  const maxReduction = 5;
  const reduction = maxReduction * (1 - distance / 3);

  tempScale.y = Math.max(0.1, tempScale.y - reduction);
  tempPosition.y = tempScale.y / 2;

  tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
  instancedTopMesh.setMatrixAt(instanceId, tempMatrix);
}

// function selectAndHighlightNeighbors(event){
//   event.preventDefault();
//   const rect = renderer.domElement.getBoundingClientRect();

//   const mouse = new THREE.Vector2();
//   mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
//   mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

//   raycaster.setFromCamera(mouse, camera);

//   const instancedTopMesh = map.children[0];

//   const intersects = raycaster.intersectObject(instancedTopMesh); // Revert to selecting only the hex map layer

//   if (intersects.length > 0) {
//     const intersection = intersects[0];
//     const instanceId = intersection.instanceId;

//     if (instanceId !== undefined) {
//       // Highlight the selected tile
//       instancedTopMesh.setColorAt(instanceId, new THREE.Color(0xcccccc));
//       instancedTopMesh.instanceColor.needsUpdate = true;

//       // Get and highlight neighbors
//       const { q, r } = getTileCoordinates(instanceId); 
//       const neighbors = getValidNeighbors(q, r, mapConfig.cols, mapConfig.rows);

//       neighbors.forEach(([nq, nr]) => {
//         const neighborInstanceId = getInstanceIdFromCoordinates(nq, nr); 
//         if (neighborInstanceId !== undefined) {
//           instancedTopMesh.setColorAt(neighborInstanceId, new THREE.Color(0xffffff));
//         }
//       });
//       instancedTopMesh.instanceColor.needsUpdate = true;
//     }
//   }
// }

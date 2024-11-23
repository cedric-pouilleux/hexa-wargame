import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const simplex = new SimplexNoise();

export function createHexGrid(rows, cols, hexRadius, scale, offsetX, offsetY, maxHeight = 100, instancedTopMesh) {
  const hexWidth = Math.sqrt(3) * hexRadius; // Largeur effective d'un hexagone
  const verticalSpacing = hexRadius * 1.5; // Espacement vertical entre les rangées
  const grid = new THREE.Group();

  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  const sideGeometries = [];

  let index = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Décalage horizontal pour les lignes impaires
      const x = col * hexWidth + (row % 2 === 1 ? hexWidth / 2 : 0);
      const z = row * verticalSpacing;

      // Mettre à jour les positions minimales et maximales
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);

      // Calculer la hauteur du terrain
      const noiseX = (x + offsetX) / scale;
      const noiseZ = (z + offsetY) / scale;
      const terrainHeight = THREE.MathUtils.clamp(getHeight(noiseX, noiseZ, maxHeight, simplex), 0, maxHeight);

      // Créer la géométrie pour les côtés du cylindre (marron, décoratifs)
      const sideGeometry = new THREE.CylinderGeometry(
        hexRadius,      // Rayon supérieur
        hexRadius,      // Rayon inférieur
        terrainHeight,  // Hauteur du terrain pour les côtés
        6,              // Nombre de segments radiaux pour un hexagone
        1,              // Hauteur segmentée en 1 seul segment
        true            // Ouvrir le haut et le bas pour pouvoir manipuler les sommets
      );
      sideGeometry.translate(x, terrainHeight / 2, z);
      sideGeometries.push(sideGeometry);

      // Positionner la face supérieure de l'hexagone
      const matrix = new THREE.Matrix4();
      matrix.makeRotationY(Math.PI / 6); // Faire tourner la face supérieure pour correspondre à l'orientation précédente
      matrix.setPosition(x, terrainHeight, z);
      instancedTopMesh.setMatrixAt(index, matrix);
      index++;
    }
  }

  // Fusionner toutes les géométries des côtés en une seule
  const mergedSideGeometry = mergeGeometries(sideGeometries);

  // Créer un matériau marron pour les côtés
  const materialSide = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    flatShading: true,
    metalness: 0,
    roughness: 1,
  });

  const mergedSideMesh = new THREE.Mesh(mergedSideGeometry, materialSide);
  mergedSideMesh.raycast = () => {}; // Désactiver la sélection des hexagones marron
  mergedSideMesh.castShadow = true;
  mergedSideMesh.receiveShadow = true;
  grid.add(mergedSideMesh);

  // Ajouter les faces supérieures en tant qu'InstancedMesh
  instancedTopMesh.castShadow = true;
  instancedTopMesh.receiveShadow = true;
  grid.add(instancedTopMesh);

  // Calculer le centre de la grille
  const gridCenterX = (minX + maxX) / 2;
  const gridCenterZ = (minZ + maxZ) / 2;

  return { grid, gridCenterX, gridCenterZ, instancedTopMesh };
}

function getHeight(x, z, maxHeight, simplex) {
  let height = 0;
  let frequency = 0.4;
  let amplitude = 0.2;
  let maxAmplitude = 0;

  const persistence = 0.5;
  const lacunarity = 2; // Augmenté pour un changement de fréquence plus significatif
  const octaves = 4; // Augmenté pour plus de détails

  for (let i = 0; i < octaves; i++) {
    const noiseValue = simplex.noise2D(x * frequency, z * frequency);
    height += noiseValue * amplitude;
    maxAmplitude += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  // Normaliser la hauteur entre 0 et 1
  height = (height / maxAmplitude + 1) / 2; // Valeur entre 0 et 1

  // Appliquer une fonction exponentielle pour accentuer les reliefs (facultatif)
  return Math.pow(height, 1.5) * maxHeight; // Hauteur finale entre 0 et maxHeight
}

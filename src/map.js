import * as THREE from 'three';
import { gridToAxial } from './utils/grid';
import alea from 'alea';
import { createNoise2D } from 'simplex-noise';

export function useMap(opt, gridWidth, gridHeight){

  let map = new THREE.Group();

  let options = {
    seed: opt.seed,
    scale: opt.scale || 200,
    rows: opt.rows || 10,
    cols: opt.cols || 10,
    hexRadius: opt.hexRadius || 5,
    frequency: opt.frequency || 0.4,
    amplitude: opt.amplitude || 0.8,
    maxAmplitude: opt.maxAmplitude || 0,
    persistence: opt.persistence || 0.5,
    lacunarity: opt.lacunarity || 2,
    octaves: opt.octaves || 3,
    gridWidth,
    gridHeight
  }

  // Cette valeur est requise pour remplacer la position Y des nuages,
  let maxHeight = 0;
  let hexs = [];

  function generateMap() {
    map.clear();
    hexs = [];
    const prng = alea(options.seed);
    const mapNoise = createNoise2D(prng);
    
    const material = new THREE.MeshStandardMaterial({
        color: 0x228B22,
        flatShading: true,
        metalness: 0,
        roughness: 1,
    });

    const instancedTopMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(
          options.hexRadius,      // Rayon supérieur
          options.hexRadius,      // Rayon inférieur
          1,                      // Hauteur initiale de l'hexagone (sera modifiée dynamiquement)
          6,                      // Nombre de segments radiaux pour un hexagone
          1,                      // Hauteur segmentée en 1 seul segment
          false                   // Ne pas ouvrir le haut et le bas pour manipuler les sommets
    ), material, options.rows * options.cols);
    instancedTopMesh.castShadow = true;
    instancedTopMesh.receiveShadow = true;

    let index = 0;

    const hexWidth = Math.sqrt(3) * options.hexRadius;
    const verticalSpacing = options.hexRadius * 1.5;
    
    for (let row = 0; row < options.rows; row++) {
      for (let col = 0; col < options.cols; col++) {
        const x = col * hexWidth + (row % 2 === 1 ? hexWidth / 2 : 0);
        const z = row * verticalSpacing;
        const noiseX = x / options.scale;
        const noiseZ = z / options.scale;

        let minHeight = 0;
        let frequency = options.frequency;
        let amplitude = options.amplitude;
        let maxAmplitude = options.maxAmplitude;
        const persistence = options.persistence;
        const lacunarity = options.lacunarity;
        const octaves = options.octaves;

        for (let i = 0; i < octaves; i++) {
          const noiseValue = mapNoise(noiseX * frequency, noiseZ * frequency);
          minHeight += noiseValue * amplitude;
          maxAmplitude -= amplitude;
          amplitude *= persistence;
          frequency *= lacunarity;
        }

        // Normaliser la hauteur entre 0 et 1
        minHeight = (minHeight / maxAmplitude + 1) / 2;

        const height = THREE.MathUtils.clamp(Math.pow(minHeight, 1.5) * options.scale, 0, options.scale);

        if (height > maxHeight) {
          maxHeight = height;
        }

        // Modifier la géométrie pour étendre les hexagones jusqu'en bas
        const matrix = new THREE.Matrix4();
        matrix.setPosition(x, height / 2, z);
        matrix.scale(new THREE.Vector3(1, height, 1)); // Étendre la hauteur de la géométrie
        instancedTopMesh.setMatrixAt(index, matrix);
        instancedTopMesh.setColorAt(index, new THREE.Color(`rgb(0, ${Math.round(height) * 2}, 0)`));

        hexs.push({ 
          index,
          properties: { type: 'ground'},
          onMap: { row, col, ...gridToAxial(col, row), height },
        });
        index++;
      }
    }

    instancedTopMesh.instanceColor.needsUpdate = true;

    map.add(instancedTopMesh);

    map.traverse(function(child) {
      if (child.isMesh) {
        child.userData.originalColor = child.material.color.clone();
      }
    });

    // Positionner la carte en tenant compte du décalage
    map.position.set(-options.gridWidth / 2 + 2, 0, -options.gridHeight / 2 + 5);
  }

  function updateMap(updateOptions, pGridWidth, pGridHeight){
    options = {
      ...options,
      ...updateOptions
    }
    options.gridWidth = pGridWidth;
    options.gridHeight = pGridHeight;
    generateMap();
  }

  generateMap()

  return {
    map,
    updateMap,
    maxHeight,
    hexs,
  }
}

import * as THREE from 'three';

const offsetX = Math.random() * 1000;
const offsetY = Math.random() * 1000;
const simplex = new SimplexNoise();

export function useMap(opt, gridWidth, gridHeight){

  let map = new THREE.Group();

  let options = {
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

  // This value is required for replace cloud y position,
  let maxHeight = 0;

  function generateMap() {
    map.clear();
    const hexMeshes = [];
    
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
          false                   // Ouvrir le haut et le bas pour pouvoir manipuler les sommets
    ), material, options.rows * options.cols);
    instancedTopMesh.castShadow = true;
    instancedTopMesh.receiveShadow = true;

    let index = 0;

    const hexWidth = Math.sqrt(3) * options.hexRadius;
    const verticalSpacing = options.hexRadius * 1.5;

    const hexs = [];

    for (let row = 0; row < options.rows; row++) {
      hexs[row] = [];
      for (let col = 0; col < options.cols; col++) {
        const {terrainHeight, x, z} = getMapUtils(row, col, options.scale, hexWidth, verticalSpacing);

        if (terrainHeight > maxHeight) {
          maxHeight = terrainHeight;
        }

        // Modifier la géométrie pour étendre les hexagones jusqu'en bas
        const matrix = new THREE.Matrix4();
        matrix.setPosition(x, terrainHeight / 2, z);
        matrix.scale(new THREE.Vector3(1, terrainHeight, 1)); // Étendre la hauteur de la géométrie
        instancedTopMesh.setMatrixAt(index, matrix);

        instancedTopMesh.setColorAt(index, new THREE.Color(`rgb(0, ${Math.round(terrainHeight) * 2}, 0)`));
        hexs[row][col] = { id: index, properties: {} };

        index++;
      }
    }

    instancedTopMesh.instanceColor.needsUpdate = true;

    map.add(instancedTopMesh);

    map.traverse(function(child) {
      if (child.isMesh) {
        hexMeshes.push(child);
        child.userData.originalColor = child.material.color.clone();
      }
    });

    map.position.set(-options.gridWidth/2 + 2, 0 , -options.gridHeight / 2 + 5 );
  }

  function updateMap(updateOptions, pGridWidth, pGridHeight){
    options = {
      ...updateOptions
    }
    options.gridWidth = pGridWidth;
    options.gridHeight = pGridHeight;
    generateMap();
  }

  function getMapUtils(row, col, scale, hexWidth, verticalSpacing){
      const x = col * hexWidth + (row % 2 === 1 ? hexWidth / 2 : 0);
      const z = row * verticalSpacing;
      
      const noiseX = (x + offsetX) / scale;
      const noiseZ = (z + offsetY) / scale;
      
      const terrainHeight = THREE.MathUtils.clamp(getHeight(noiseX, noiseZ, scale, simplex), 0, scale);

      return {
          terrainHeight,
          x,
          z
      }
  }

  function getHeight(x, z, maxHeight, simplex) {
    let height = 0;
    let frequency = options.frequency;
    let amplitude = options.amplitude;
    let maxAmplitude = options.maxAmplitude;

    const persistence = options.persistence;
    const lacunarity = options.lacunarity;
    const octaves = options.octaves;

    for (let i = 0; i < octaves; i++) {
      const noiseValue = simplex.noise2D(x * frequency, z * frequency);
      height += noiseValue * amplitude;
      maxAmplitude -= amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    // Normaliser la hauteur entre 0 et 1
    height = (height / maxAmplitude + 1) / 2; // Valeur entre 0 et 1

    // Appliquer une fonction exponentielle pour accentuer les reliefs (facultatif)
    return Math.pow(height, 1.5) * maxHeight; // Hauteur finale entre 0 et maxHeight
  }

  generateMap()

  return {
    map,
    updateMap,
    maxHeight
  }

}

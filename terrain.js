import * as THREE from 'three';

const maxHeight = 100;
const simplex = new SimplexNoise();

export function createHexGrid(rows, cols, hexRadius, scale, offsetX, offsetY) {
  const hexWidth = Math.sqrt(3) * hexRadius; // Largeur effective d'un hexagone
  const hexHeight = 2 * hexRadius; // Hauteur effective d'un hexagone
  const verticalSpacing = hexHeight * 0.75; // Espacement vertical entre les rangées
  const grid = new THREE.Group();

  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

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
      let terrainHeight = getHeight(noiseX, noiseZ);

      terrainHeight = THREE.MathUtils.clamp(terrainHeight, 0, maxHeight);

      const hexagon = createHexagonWithHeight(hexRadius, terrainHeight);

      hexagon.position.set(x, 0, z);
      grid.add(hexagon);
    }
  }

  // Calculer le centre de la grille
  const gridCenterX = (minX + maxX) / 2;
  const gridCenterZ = (minZ + maxZ) / 2; 

  // Retourner la grille et le centre
  return { grid, gridCenterX, gridCenterZ };
}

function getHeight(x, z) {
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
  height = height / maxAmplitude; // Valeur entre environ -1 et 1
  height = (height + 1) / 2;      // Valeur entre 0 et 1

  // Appliquer une fonction exponentielle pour accentuer les reliefs (facultatif)
  const exponent = 1.5; // Ajusté pour des reliefs plus doux
  height = Math.pow(height, exponent);

  // Multiplier par la hauteur maximale souhaitée
  return height * maxHeight; // Hauteur finale entre 0 et maxHeight
}

function createHexagonWithHeight(radius, terrainHeight) {
  // Créer une géométrie de cylindre avec une hauteur constante
  const geometry = new THREE.CylinderGeometry(
    radius,      // Rayon supérieur
    radius,      // Rayon inférieur
    maxHeight,   // Hauteur constante pour tous les hexagones
    6,           // Nombre de segments radiaux pour un hexagone
    1,           // Hauteur segmentée en 1 seul segment
    false         // Ouvrir le haut et le bas pour pouvoir manipuler les sommets
  );

  // Obtenir les positions des sommets
  const positionAttribute = geometry.attributes.position;
  const vertexCount = positionAttribute.count;

  // Calculer le décalage en Y pour le sommet en fonction de la hauteur du terrain
  const topOffset = terrainHeight - maxHeight;

  // Ajuster les sommets supérieurs pour représenter la hauteur du terrain
  for (let i = 0; i < vertexCount; i++) {
    // Obtenir la position Y du sommet
    let y = positionAttribute.getY(i);

    // Si le sommet est sur la face supérieure (y positive)
    if (y === maxHeight / 2) {
      // Ajuster la position Y du sommet
      positionAttribute.setY(i, y + topOffset);
    }
  }

  // Indiquer que la géométrie a été mise à jour
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  // Créer le matériau
  const material = new THREE.MeshStandardMaterial({
    color: 0x8c8c8c,
    wireframe: false,
    flatShading: true,
  }); 

  const mesh = new THREE.Mesh(geometry, material);

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}


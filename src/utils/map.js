import * as THREE from 'three';

const offsetX = Math.random() * 1000;
const offsetY = Math.random() * 1000;
const simplex = new SimplexNoise();

export function getMapUtils(row, col, scale, hexWidth, verticalSpacing){
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


export function getHeight(x, z, maxHeight, simplex) {
  let height = 0;
  let frequency = 0.4;
  let amplitude = 0.2;
  let maxAmplitude = 0;

  const persistence = 0.5;
  const lacunarity = 2; // more significative frequency
  const octaves = 3; // more details

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
import * as THREE from 'three';
import { gridToAxial } from './utils/grid';
import alea from 'alea';
import { createNoise2D } from 'simplex-noise';

export function useMap(opt, gridWidth, gridHeight) {
  const map = new THREE.Group();

  const options = {
    seed: opt.seed,
    scale: opt.scale || 200,
    rows: opt.rows || 10,
    cols: opt.cols || 10,
    hexRadius: opt.hexRadius || 5,
    frequency: opt.frequency || 0.4,
    amplitude: opt.amplitude || 0.8,
    persistence: opt.persistence || 0.5,
    lacunarity: opt.lacunarity || 2,
    octaves: opt.octaves || 3,
    gridWidth,
    gridHeight,
  };

  let maxHeight = 0;
  const hexs = [];

  function generateMap() {
    map.clear();

    const prng = alea(options.seed);
    const mapNoise = createNoise2D(prng);

    const instanceCount = options.rows * options.cols;

    // Géométrie de base pour les hexagones
    const baseGeometry = new THREE.CylinderGeometry(
      options.hexRadius,
      options.hexRadius,
      1,
      6,
      1,
      false
    );

    // Matériau avec shaders personnalisés
    const material = new THREE.MeshStandardMaterial({
      flatShading: true,
      metalness: 0,
      roughness: 1,
    });

    // Création de l'InstancedMesh
    const instancedMesh = new THREE.InstancedMesh(baseGeometry, material, instanceCount);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    // Tableaux pour les attributs d'instance
    const instanceHeights = new Float32Array(instanceCount);
    const instanceColors = new Float32Array(instanceCount * 3);
    const instanceIds = new Float32Array(instanceCount);

    const hexWidth = Math.sqrt(3) * options.hexRadius;
    const verticalSpacing = options.hexRadius * 1.5;

    let index = 0;

    const dummy = new THREE.Object3D();

    // Calcul des décalages pour centrer la carte
    const offsetX = -options.gridWidth / 2 + options.hexRadius;
    const offsetZ = -options.gridHeight / 2 + options.hexRadius;

    for (let row = 0; row < options.rows; row++) {
      for (let col = 0; col < options.cols; col++) {
        // Positions ajustées pour centrer la carte
        const x = col * hexWidth + ((row % 2) * hexWidth) / 2 + offsetX;
        const z = row * verticalSpacing + offsetZ;

        const height = computeHeight(x, z, mapNoise);
        maxHeight = Math.max(maxHeight, height);

        // Hauteur et couleur de l'instance
        instanceHeights[index] = height;

        const color = new THREE.Color(`rgb(0, ${Math.round(height) * 2}, 0)`);
        instanceColors.set([color.r, color.g, color.b], index * 3);

        // Identifiant de l'instance pour le picking
        instanceIds[index] = index;

        // Position de l'instance via la matrice
        dummy.position.set(x, 0, z);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(index, dummy.matrix);

        hexs.push({
          index,
          properties: { type: 'ground' },
          onMap: { row, col, ...gridToAxial(row, col), height },
        });

        index++;
      }
    }

    // Ajout des attributs d'instance à la géométrie de l'InstancedMesh
    instancedMesh.geometry.setAttribute(
      'instanceHeight',
      new THREE.InstancedBufferAttribute(instanceHeights, 1).setUsage(THREE.DynamicDrawUsage)
    );
    instancedMesh.geometry.setAttribute(
      'instanceColor',
      new THREE.InstancedBufferAttribute(instanceColors, 3)
    );
    instancedMesh.geometry.setAttribute(
      'instanceId',
      new THREE.InstancedBufferAttribute(instanceIds, 1)
    );

    // Modification du shader pour ajuster la hauteur et la couleur
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = `
        attribute float instanceHeight;
        attribute vec3 instanceColor;
        varying vec3 vInstanceColor;
        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
          vec3 transformed = position;
          transformed.y *= instanceHeight;
          transformed.y += (instanceHeight - 1.0) * 0.5;
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <color_vertex>',
        'vInstanceColor = instanceColor;'
      );

      shader.fragmentShader = `
        varying vec3 vInstanceColor;
        ${shader.fragmentShader}
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        'vec4 diffuseColor = vec4( vInstanceColor, opacity );'
      );
    };

    map.add(instancedMesh);
  }

  function computeHeight(x, z, noiseFunction) {
    let totalHeight = 0;
    let amplitude = options.amplitude;
    let frequency = options.frequency;
    let maxPossibleHeight = 0;

    for (let i = 0; i < options.octaves; i++) {
      const noiseValue = noiseFunction(
        (x / options.scale) * frequency,
        (z / options.scale) * frequency
      );
      totalHeight += noiseValue * amplitude;
      maxPossibleHeight += amplitude;
      amplitude *= options.persistence;
      frequency *= options.lacunarity;
    }

    // Normalisation de la hauteur
    totalHeight = totalHeight / maxPossibleHeight;
    totalHeight = (totalHeight + 1) / 2; // Mappe la valeur entre 0 et 1
    const height = THREE.MathUtils.clamp(
      Math.pow(totalHeight, 1.5) * options.scale,
      0,
      options.scale
    );
    return height;
  }

  function updateMap(updateOptions, pGridWidth, pGridHeight) {
    Object.assign(options, updateOptions, {
      gridWidth: pGridWidth,
      gridHeight: pGridHeight,
    });
    generateMap();
  }

  generateMap();

  return {
    map,
    updateMap,
    maxHeight,
    hexs,
  };
}

# ThreeJS hexagonal environment for game


A 3D interactive sandbox scene, offering a dynamic and customizable environment. The hexagonal grid, generated using procedural noise, simulates natural terrain with mountains and valleys.
A realistic water surface, utilizing advanced shaders for reflections and textures, covers the lower areas. 
Interactivity includes real-time hexagon selection through a raycasting system. 
The tiles have been optimized to ensure a steady 75 FPS performance. Immersive lighting is provided by a directional light simulating a dynamic, rotating sun.

## Setup
```Shell
pnpm i
npx vite
```

## Roadmap
- [x] Hexagonal grid: Generated hexagons with procedural noise-based heights.
- [x] Natural reliefs: Simulated mountains, valleys, and plains with realistic height variations.
- [x] Dynamic water: Realistic water surface with advanced shaders, reflections, and submerged zones.
- [x] Immersive lighting: Dynamic rotating sun, soft shadows, and day/night effect.
- [x] Interactivity: Real-time hexagon selection using raycasting.
- [x] Optimization: Simplified geometry to maintain 75 FPS performance.
- [x] Weather gesture
- [x] Map editor


### GUI Configurable testing

#### Map
- [x] Col and row
- [x] Tile size

#### Map noize generation
- [x] Frequency
- [x] Amplitude
- [x] Max Amplitude (To be rework)
- [x] Persistence
- [x] Lacunarity
- [x] Octaves

#### Sun
- [x] Speed
- [ ] Rotate angle
- [ ] Rotate radius

#### Water
- [x] Height

#### Clouds
- [x] Weather change
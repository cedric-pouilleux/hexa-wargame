import * as THREE from "three";

import { useSun } from "./src/sun.js";
import { useControls } from "./src/controls.js";
import { useWater } from "./src/water.js";
import { useStats } from "./src/ui/stats.js";
import { useGUI } from "./src/ui/gui.js";
import { useRenderer } from "./src/renderer.js";
import { useMap } from "./src/map.js";
import { useClouds } from "./src/clouds.js";
import { mapConfig } from "./src/config/map.js";
import { useGroundGeometry } from "./src/objects/ground.js";
import { useCursor } from "./src/objects/cursor.js";
import {
  handleClick,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
} from "./src/events/mouseEvents.js";

const hexWidth = () => Math.sqrt(3) * mapConfig.hexRadius;
const hexHeight = () => 2 * mapConfig.hexRadius;
const verticalSpacing = () => hexHeight() * 0.75;
const gridWidth = () => (mapConfig.cols - 1) * hexWidth() + hexWidth();
const gridHeight = () => (mapConfig.rows - 1) * verticalSpacing() + hexHeight();

const raycaster = new THREE.Raycaster();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  80,
  window.innerWidth / window.innerHeight,
  1,
  10000,
);

const { renderer } = useRenderer();
const { stats } = useStats();
const { controls } = useControls(camera, renderer.domElement, camera);
const { updateSun, sunLight } = useSun();
const { waterSurface, waterVolume, updateWater } = await useWater(
  { waterHeight: mapConfig.waterHeight },
  gridWidth(),
  gridHeight(),
);
const { map, updateMap, hexs } = useMap(mapConfig, gridWidth(), gridHeight());
const { clouds, cloudsAnimate, cloudsUpdate } = await useClouds(
  gridWidth(),
  gridHeight(),
  mapConfig.weatherMode,
);
const { ground } = useGroundGeometry(200000, 200000, 0x000000);
const { cursor } = useCursor();

function init() {
  scene.add(new THREE.AmbientLight(0x333333));
  scene.add(map);
  scene.add(waterSurface);
  scene.add(waterVolume);
  scene.add(ground);
  scene.add(sunLight);
  clouds.length && scene.add(...clouds);
  camera.position.set(300, 500, 300);
  useGUI({
    updateMapCallBack: () => {
      scene.remove(map);
      updateMap(mapConfig, gridWidth(), gridHeight());
      scene.add(map);
    },
    updateWaterCallBack: () =>
      updateWater({
        waterHeight: mapConfig.waterHeight,
        gridHeight: gridHeight(),
        gridWidth: gridWidth(),
      }),
    updateCloudCallBack: () => {
      scene.remove(...clouds);
      cloudsUpdate({
        width: gridWidth(),
        height: gridHeight(),
        weatherMode: mapConfig.weatherMode,
      });
      clouds.length && scene.add(...clouds);
    },
    saveMapCallback: () => {
      const blob = new Blob([JSON.stringify(hexs)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `iron-grid-${Date()}.json`;
      link.click();
    },
  });
  scene.add(cursor);
  camera.zoom = 1.2;
  camera.updateProjectionMatrix();
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
  updateSun(mapConfig.sunRotationSpeed);
  waterSurface.material.uniforms["time"].value += 1.0 / 60.0;
  cloudsAnimate();
  renderer.render(scene, camera);
}

document.addEventListener("mousedown", (event) =>
  handleMouseDown(event, raycaster, map, camera),
);

document.addEventListener("mouseup", (event) => handleMouseUp(event));

document.addEventListener("mousemove", (event) =>
  handleMouseMove(
    event,
    raycaster,
    map,
    camera,
    renderer,
    cursor,
    mapConfig.cols,
    mapConfig.rows,
  ),
);

document.addEventListener("click", (event) =>
  handleClick(event, raycaster, map, mapConfig),
);

window.addEventListener(
  "resize",
  () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  },
  false,
);

document.body.appendChild(renderer.domElement);
init();

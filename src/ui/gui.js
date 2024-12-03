import GUI from "lil-gui";
import { mapConfig } from "../config/map.js";

export function useGUI({
  updateMapCallBack,
  updateWaterCallBack,
  updateCloudCallBack,
  saveMapCallback,
}) {
  const gui = new GUI();
  const sunFolder = gui.addFolder("Sun");
  sunFolder
    .add(mapConfig, "sunRotationSpeed", 0, 0.2, 0.001)
    .name("Sun Rotation Speed");
  gui
    .add(mapConfig, "weatherMode", ["sunset", "clear", "cloudy", "stormy"])
    .name("Weather Mode")
    .onChange(updateCloudCallBack);
  gui
    .add(mapConfig, "hexRadius", 1, 10, 0.1)
    .name("Hex Radius")
    .onChange((_) => {
      updateWaterCallBack();
      updateMapCallBack();
      updateCloudCallBack();
    });

  const sizeMapGenerateFolder = gui.addFolder("Map size generation");
  sizeMapGenerateFolder
    .add(mapConfig, "rows", 10, 200, 1)
    .name("Rows")
    .onChange((_) => {
      updateWaterCallBack();
      updateMapCallBack();
      updateCloudCallBack();
    });
  sizeMapGenerateFolder
    .add(mapConfig, "cols", 10, 200, 1)
    .name("Cols")
    .onChange((_) => {
      updateWaterCallBack();
      updateMapCallBack();
      updateCloudCallBack();
    });
  sizeMapGenerateFolder
    .add(mapConfig, "waterHeight", 1, 100, 1)
    .name("Water Height")
    .onChange((_) => {
      updateWaterCallBack();
      updateMapCallBack();
    });

  const obj = {
    fn: () => {
      saveMapCallback();
    },
  };

  const noiseMapGenerateFolder = gui.addFolder("Map noise generation");
  noiseMapGenerateFolder
    .add(mapConfig, "seed")
    .name("Seed")
    .onChange(updateMapCallBack);
  noiseMapGenerateFolder
    .add(mapConfig, "scale", 10, 600, 1)
    .name("Scale")
    .onChange(updateMapCallBack);
  noiseMapGenerateFolder
    .add(mapConfig, "frequency", 0.1, 1, 0.05)
    .name("Frequency")
    .onChange(updateMapCallBack);
  noiseMapGenerateFolder
    .add(mapConfig, "amplitude", 0, 4, 0.05)
    .name("Amplitude")
    .onChange(updateMapCallBack);
  noiseMapGenerateFolder
    .add(mapConfig, "maxAmplitude", 0, 10, 0.05)
    .name("Max Amplitude")
    .onChange(updateMapCallBack);
  noiseMapGenerateFolder
    .add(mapConfig, "persistence", 0, 20, 0.05)
    .name("Persistence")
    .onChange(updateMapCallBack);
  noiseMapGenerateFolder
    .add(mapConfig, "lacunarity", 0, 10, 0.1)
    .name("Lacunarity")
    .onChange(updateMapCallBack);
  noiseMapGenerateFolder
    .add(mapConfig, "octaves", 0.1, 8, 0.1)
    .name("Octaves")
    .onChange(updateMapCallBack);
  noiseMapGenerateFolder.add(obj, "fn", "Save map");
}

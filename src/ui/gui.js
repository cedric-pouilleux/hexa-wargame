import GUI from 'lil-gui';
import { mapConfig } from '../config/map.js';

export function useGUI({
    updateMapCallBack,
    updateWaterCallBack,
    updateCloudCallBack
}){
    const gui = new GUI();

    gui.add(mapConfig, 'sunRotationSpeed', 0, 0.2, 0.001).name('Sun Rotation Speed');
    gui.add(mapConfig, 'weatherMode', ['sunset', 'clear', 'cloudy', 'stormy']).name('Weather Mode').onChange(updateCloudCallBack);
    gui.add(mapConfig, 'hexRadius', 1, 10, 0.1).name('Hex Radius').onChange(_ => {
        updateWaterCallBack();
        updateMapCallBack();
        updateCloudCallBack();
    });
    gui.add(mapConfig, 'rows', 10, 200, 1).name('Rows').onChange(_ => {
        updateWaterCallBack();
        updateMapCallBack();
        updateCloudCallBack();
    });
    gui.add(mapConfig, 'cols', 10, 200, 1).name('Cols').onChange(_ => {
        updateWaterCallBack();
        updateMapCallBack();
        updateCloudCallBack();
    });
    gui.add(mapConfig, 'scale', 10, 600, 1).name('Scale').onChange(updateMapCallBack);
    gui.add(mapConfig, 'frequency', 0.1, 1, 0.05).name('Frequency').onChange(updateMapCallBack);
    gui.add(mapConfig, 'amplitude', 0, 4, 0.05).name('Amplitude').onChange(updateMapCallBack);
    gui.add(mapConfig, 'maxAmplitude', 0, 10, 0.05).name('Max Amplitude').onChange(updateMapCallBack);
    gui.add(mapConfig, 'persistence', 0, 20, 0.05).name('Persistence').onChange(updateMapCallBack);
    gui.add(mapConfig, 'lacunarity', 0, 10, 0.1).name('Lacunarity').onChange(updateMapCallBack);
    gui.add(mapConfig, 'octaves', 0.1, 8, 0.1).name('Octaves').onChange(updateMapCallBack);
    gui.add(mapConfig, 'waterHeight', 1, 100, 1).name('Water Height').onChange(_ => {
        updateWaterCallBack();
        updateMapCallBack();
    });

}
import * as THREE from 'three';

export async function useClouds(width, height, weatherMode = 'clear') {
    const loader = new THREE.TextureLoader();
    const texture = await loader.loadAsync('./assets/cloud.jpg');

    let options = {
        width,
        height
    }

    let clouds = [];
    const cloudGeo = new THREE.IcosahedronGeometry(15, 2);

    // Paramètres de rendu en fonction du mode météo
    let cloudGroupCount, cloudCount, colorRange;
    setWeatherMode(weatherMode);

    function setWeatherMode(mode) {
        if (mode === 'clear') {
            cloudGroupCount = 20; // Peu de groupes de nuages
            cloudCount = 10; // Peu de nuages par groupe
            colorRange = [85, 100]; // Nuages blancs (85% à 100% de luminosité)
        } else if (mode === 'cloudy') {
            cloudGroupCount = 50; // Quantité modérée de groupes de nuages
            cloudCount = 20; // Quantité modérée de nuages par groupe
            colorRange = [50, 85]; // Nuances de gris clair (50% à 85% de luminosité)
        } else if (mode === 'stormy') {
            cloudGroupCount = 100; // Beaucoup de groupes de nuages
            cloudCount = 30; // Beaucoup de nuages par groupe
            colorRange = [20, 50]; // Nuages sombres (20% à 50% de luminosité)
        } else {
            throw new Error('Invalid weather mode. Choose between "clear", "cloudy", or "stormy".');
        }
    }

    function createClouds() {
        clouds.length = 0; 
        for (let i = 0; i < cloudGroupCount; i++) {
            const cloudGroup = new THREE.Group();
            const instancedMesh = new THREE.InstancedMesh(cloudGeo, new THREE.MeshLambertMaterial({
                map: texture,
                transparent: true,
                opacity: 0.6,
                depthWrite: false
            }), cloudCount);

            const tempMatrix = new THREE.Matrix4();

            for (let j = 0; j < cloudCount; j++) {
                const position = new THREE.Vector3(
                    Math.random() * 60 - 30,
                    Math.random() * 20 - 10,
                    Math.random() * 60 - 30
                );

                const scaleValue = 0.8 + Math.random() * 0.4;  // between 0.8 & 1.2
                const scale = new THREE.Vector3(scaleValue, scaleValue, scaleValue);

                const color = new THREE.Color(`hsl(0, 0%, ${colorRange[0] + Math.random() * (colorRange[1] - colorRange[0])}%)`);
                instancedMesh.setColorAt(j, color);

                tempMatrix.compose(position, new THREE.Quaternion(), scale);
                instancedMesh.setMatrixAt(j, tempMatrix);
            }

            instancedMesh.castShadow = true;
            cloudGroup.add(instancedMesh);

            cloudGroup.position.set(
                (Math.random() * options.width) - options.width / 2,    // Limite X : position entre -gridWidth/2 et gridWidth/2
                140 + Math.random() * 30,                               // Hauteur au-dessus du terrain
                (Math.random() * options.height) - options.height / 2   // Limite Z : position entre -gridHeight/2 et gridHeight/2
            );

            cloudGroup.userData.speedX = Math.random() * 0.05 + 0.02;   // Vitesse aléatoire entre 0.02 et 0.07
            cloudGroup.userData.speedZ = Math.random() * 0.03 + 0.01;   // Légère composante Z

            clouds.push(cloudGroup);
        }
    }

    createClouds();

    function cloudsAnimate() {
        clouds.forEach((cloudGroup, index) => {
            cloudGroup.position.x += cloudGroup.userData.speedX;
            cloudGroup.position.z += cloudGroup.userData.speedZ;

            if (cloudGroup.position.x > options.width / 2) {
                cloudGroup.position.x = -options.width / 2;
            }
            if (cloudGroup.position.z > options.height / 2) {
                cloudGroup.position.z = -options.height / 2;
            }

            cloudGroup.position.y += Math.sin(Date.now() * 0.001 + index) * 0.005;
        });
    }

    function cloudsUpdate(opt) { 
        options = {
            ...opt,
        }
        createClouds();
    }

    function updateWeatherMode(newWeatherMode) {
        setWeatherMode(newWeatherMode);
        createClouds();
    }

    return {
        clouds,
        cloudsAnimate,
        cloudsUpdate,
        updateWeatherMode
    };
}

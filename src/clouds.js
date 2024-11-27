import * as THREE from 'three';

export async function useClouds(width, height, weatherMode) {
    let options = {
        weatherMode: weatherMode || 'stormy',
        width,
        height
    }

    let clouds = [];
    const cloudGeo = new THREE.IcosahedronGeometry(15, 2);

    // Paramètres de rendu en fonction du mode météo
    let cloudGroupCount, cloudCount, colorRange;
    setWeatherMode(options.weatherMode);
 
    function setWeatherMode(mode) {
        const count = Math.floor(options.width * options.height * (0.002 / 100));
        if (mode === 'sunset') {
            cloudGroupCount = count;
            cloudCount = 20; 
            colorRange = [0.9, 1];
        }
        else if (mode === 'clear') {
            cloudGroupCount = count * 2; 
            cloudCount = 40; 
            colorRange = [0.8, 1.0];
        } else if (mode === 'cloudy') {
            cloudGroupCount = count * 3;
            cloudCount = 60;
            colorRange = [0.5, 0.85];
        } else if (mode === 'stormy') {
            cloudGroupCount = count * 5;
            cloudCount = 60;
            colorRange = [0.1, 0.3];
        } else {
            throw new Error('Invalid weather mode. Choose between "clear", "cloudy", "stormy", "foggy", or "sunset".');
        }
    }

    function createClouds() {
        clouds.length = 0; 
        for (let i = 0; i < cloudGroupCount; i++) {
            const cloudGroup = new THREE.Group();
            const materialColor = new THREE.Color().setHSL(0, 0, THREE.MathUtils.lerp(colorRange[0], colorRange[1], Math.random()));
            const cloudMaterial = new THREE.MeshLambertMaterial({
                color: materialColor,
                transparent: true,
                opacity: 1,
                depthWrite: false
            });
            const instancedMesh = new THREE.InstancedMesh(cloudGeo, cloudMaterial, cloudCount);

            const tempMatrix = new THREE.Matrix4();

            for (let j = 0; j < cloudCount; j++) {
                const position = new THREE.Vector3(
                    Math.random() * 60 - 30,
                    Math.random() * 20 - 10,
                    Math.random() * 60 - 30
                );
                const scaleValue = 0.4 + Math.random() * 0.4;  // between 0.8 & 1.2
                const scale = new THREE.Vector3(scaleValue, scaleValue, scaleValue);
                tempMatrix.compose(position, new THREE.Quaternion(), scale);
                instancedMesh.setMatrixAt(j, tempMatrix);
            }

            instancedMesh.castShadow = true;
            instancedMesh.material.opacity = 0.02 + Math.random() * 0.8; // Ajuster l'opacité en fonction de la densité
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
            ...options,
            ...opt,
        }
        setWeatherMode(options.weatherMode);
        createClouds();
    }

    return {
        clouds,
        cloudsAnimate,
        cloudsUpdate,
    };
}

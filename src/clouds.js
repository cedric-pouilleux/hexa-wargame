import * as THREE from 'three';

export async function useClouds(gridWidth, gridHeight) {
    const clouds = [];
    const loader = new THREE.TextureLoader();


   const texture = await loader.loadAsync('./assets/cloud.jpg')
   
    for (let i = 0; i < 10; i++) {
        const cloudGroup = new THREE.Group();
        for (let j = 0; j < 30; j++) {
            const cloudGeo = new THREE.SphereGeometry(15, 25, 25);
            const cloudMaterial = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: true,
                opacity: 0.8,
                depthWrite: false,
            });

             const cloud = new THREE.Mesh(cloudGeo, cloudMaterial);

            cloud.position.set(
                Math.random() * 60 - 30, 
                Math.random() * 20 - 10,
                Math.random() * 60 - 30 
            );

            cloud.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            cloudGroup.add(cloud);
        }

        cloudGroup.position.set(
            (Math.random() * gridWidth) - gridWidth / 2,  // Limite X : position entre -gridWidth/2 et gridWidth/2
            140 + Math.random() * 30,                     // Hauteur au-dessus du terrain
            (Math.random() * gridHeight) - gridHeight / 2 // Limite Z : position entre -gridHeight/2 et gridHeight/2
        );

        clouds.forEach((cloudGroup) => {
            clouds.castShadow = true;
                cloudGroup.children.forEach((cloud) => {
                cloud.castShadow = true;
                cloud.material.opacity = 0.5;
            });
        });

        clouds.push(cloudGroup);
    }

    function cloudsAnimate(){
        clouds.forEach((cloudGroup) => {
            cloudGroup.position.x += 0.05; // Vitesse de déplacement vers la droite
            cloudGroup.position.z += 0.05; // Légère composante de mouvement sur l'axe Z

            // Vérifier si le groupe de nuages est sorti des limites de la carte
            if (cloudGroup.position.x > gridWidth / 2) {
            cloudGroup.position.x = -gridWidth / 2; // Réinitialiser sur le côté gauche
            }
            if (cloudGroup.position.z > gridHeight / 2) {
            cloudGroup.position.z = -gridHeight / 2; // Réinitialiser au début de l'axe Z
            }

            // Optionnel : ajouter un léger mouvement de va-et-vient vertical pour une sensation de "flottement"
            cloudGroup.position.y += Math.sin(Date.now() * 0.001) * 0.005;
        });
    }

    return {
        clouds,
        cloudsAnimate
    }
}
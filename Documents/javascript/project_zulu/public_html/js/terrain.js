/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var nReps = 5.0;
terrainUniforms.uSplat1Repeat.value.x = nReps;
terrainUniforms.uSplat1Repeat.value.y = nReps;
terrainUniforms.uSplat2Repeat.value.x = nReps;
terrainUniforms.uSplat2Repeat.value.y = nReps;
terrainUniforms.uSplat3Repeat.value.x = nReps;
terrainUniforms.uSplat3Repeat.value.y = nReps;
terrainUniforms.uSplat4Repeat.value.x = nReps;
terrainUniforms.uSplat4Repeat.value.y = nReps;


var terrainMaterial;

function initTerrain() {

    function onGeometryLoaded(geometry, materials) {

        terrainUniforms.tSplat1.value = THREE.ImageUtils.loadTexture("images/SUNNY-Assorted-Ground.png");
        terrainUniforms.tSplat2.value = THREE.ImageUtils.loadTexture("images/grass-and-rock.png");
        terrainUniforms.tSplat3.value = THREE.ImageUtils.loadTexture("images/snow.png");
        terrainUniforms.tSplat4.value = THREE.ImageUtils.loadTexture("images/SUNNY-Mottled-Stone-and-Dirt.png");
        terrainUniforms.tAlphaMap.value = THREE.ImageUtils.loadTexture("images/splat1.png");


        terrainMaterial = new THREE.TerrainMaterial({
            uniforms: terrainUniforms,
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragShader,
            lights: true,
        });
        //materials.push(terrainMaterial);
        plane = new THREE.Mesh(geometry, terrainMaterial);
        //terrainMesh.receiveShadow = true;
        scene.add(plane);
        objects.push(plane);


    }

    var loader = new THREE.JSONLoader();

    loader.load("models/terrain/plane2.json", onGeometryLoaded);
}


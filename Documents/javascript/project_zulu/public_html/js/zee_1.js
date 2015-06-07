/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// global variables and usual functions
var box;
var scene, camera,cameraFirst,cameraCount, controls;
var cameraDefaultPos;
var objects = [];
var mouse, raycaster, plane;
var geometry, material, cube;
var tank;
var tanks = [];
//var entitiesCollider = [];
var myCanvas, w, h;
var container;
var shiftPressed = false;
var ctrlPressed = false;
var entitiesBoundingBox = [];
var selectables = [];

var sky, sunSphere;
var sunInclination;

var collisions1, earthLevel;
var firstBlood = false;

var pointFront = new THREE.Vector3();
var toEarth = new THREE.Vector3(0, -1, 0);
var pointUp = new THREE.Vector3();



function allItemsLoaded() {
    $('.onepix-imgloader').fadeOut();
    // fade in content (using opacity instead of fadein() so it retains it's height.
    $('.loading-container > *:not(.onepix-imgloader)').fadeTo(8000, 100);
}
//initialize the manager to handle all loaded events (currently just works for OBJ and image files)
var manager = new THREE.LoadingManager();

manager.onProgress = function (item, loaded, total) {
    console.log(item, loaded, total);
};
manager.onLoad = function () {
    console.log('all items loaded');
    allItemsLoaded();
};
manager.onError = function () {
    console.log('there has been an error');
};


var hitProb = {
    'tank': {'tank': .8, 'art': .9, 'inf': .5}

};

var terrainType = {
    0: 1,
    1: 2,
    2: 0,
    3: .5
};


var initScene = function () {
    myCanvas = document.getElementsByTagName("canvas")[0];

    w = myCanvas.clientWidth;
    h = myCanvas.clientHeight;

    renderer = new THREE.WebGLRenderer({canvas: myCanvas});
    renderer.setSize(w, h);
//var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;	
//
//renderer = new THREE.WebGLRenderer( {antialias:true} );
//renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
//container = document.getElementById( 'container' );
//container.appendChild( renderer.domElement );

      renderer.autoClearColor = false;
    //renderer.setClearColor(0x777777);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
            35, // Field of view
            w / h, // Aspect ratio
            0.1, // Near
            2000000   // Far
            );
    cameraFirst = new THREE.PerspectiveCamera(
            35, // Field of view
            w / h, // Aspect ratio
            0.1, // Near
            2000000   // Far
            );
    cameraCount = 0;
};
function initSky() {

    // Add Sky Mesh
    sky = new THREE.Sky();
    scene.add(sky.mesh);


    // Add Sun Helper
    sunSphere = new THREE.Mesh(new THREE.SphereGeometry(20000, 30, 30),
            new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: false}));
    sunSphere.position.y = -700000;
    sunSphere.visible = true;
    scene.add(sunSphere);
    sunInclination=0;

//    /// GUI
//
    var effectController = {
        turbidity: 10,
        reileigh: 2,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.8,
        luminance: 1,
        inclination: 0, // elevation / inclination
        azimuth: 0.25, // Facing front,
        sun: !true
    };
//
    var distance = 400000;
//
//    function guiChanged() {
        var uniforms = sky.uniforms;
        uniforms.turbidity.value = effectController.turbidity;
        uniforms.reileigh.value = effectController.reileigh;
        uniforms.luminance.value = effectController.luminance;
        uniforms.mieCoefficient.value = effectController.mieCoefficient;
        uniforms.mieDirectionalG.value = effectController.mieDirectionalG;

        var theta = Math.PI * (effectController.inclination - 0.5);
        var phi = 2 * Math.PI * (effectController.azimuth - 0.5);

        sunSphere.position.x = distance * Math.cos(phi);
        sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
        sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta);

        sunSphere.visible = effectController.sun;

        sky.uniforms.sunPosition.value.copy(sunSphere.position);

    }
    function sunUpdate(dt){
        if (sunInclination>.53 && sunInclination <1.78)
            sunInclination += dt/10;
        else
        sunInclination += dt/100;
//    console.log(sunInclination);
        var theta = Math.PI * (sunInclination - 0.5);
        var phi = 2 * Math.PI * (0.25 - 0.5);

        sunSphere.position.x = 400000 * Math.cos(phi);
        sunSphere.position.y = 400000 * Math.sin(phi) * Math.sin(theta);
        sunSphere.position.z = 400000 * Math.sin(phi) * Math.cos(theta);

        sky.uniforms.sunPosition.value.copy(sunSphere.position);
        
    }

    function randomChoice(list) {
        var i = Math.floor(Math.random() * list.length);
        return list[i];
    }

    function angleBetweenQuats(qBefore, qAfter) {
        q1 = new THREE.Quaternion();
        q1.copy(qBefore);
        q1.inverse();
        q1.multiply(qAfter);
        var halfTheta = Math.acos(q1.w);
        return 2 * halfTheta;
    }
    THREE.Raycaster.prototype.setFromCameraNew = function (coords, camera){ // is not working on child cameras
	//camera is assumed perspective camera
	var vector = new THREE.Vector3();
	vector.setFromMatrixPosition(camera.matrixWorld);
	this.ray.origin.copy( vector );
	this.ray.direction.set( coords.x, coords.y, 0.5 ).unproject( camera ).sub( vector ).normalize();
}

    function lookTowards(fromObject, toPosition, dTheta, goalDirection, tank, how) {
        var quat0 = new THREE.Quaternion();
        var eye = fromObject.position;
        quat0.setFromRotationMatrix(fromObject.matrix);
        var up = new THREE.Vector3(0, 1, 0);
        //var center = toPosition;
        if (goalDirection)
            var center = goalDirection;
        else
            //var center = new THREE.Vector3(toPosition.x,0,toPosition.z);
            var center = toPosition;
        var mat = new THREE.Matrix4();
        mat.lookAt(center, eye, up);
        var quat1 = new THREE.Quaternion();
        quat1.setFromRotationMatrix(mat);
        var deltaTheta = angleBetweenQuats(quat0, quat1);
        //console.log(deltaTheta);
        var frac = dTheta / deltaTheta;
        if (frac > 1)
            frac = 1;

        fromObject.quaternion.slerp(quat1, frac);
        if (tank && !tank.rotatedToTarget) {
            if (deltaTheta < 0.001 || isNaN(deltaTheta))
                tank.rotatedToTarget = true;
        }
        if (how && !tank.levitatedToTarget) {
            if (deltaTheta < 0.001 || isNaN(deltaTheta))
                tank.levitatedToTarget = true;
        }
    }

    function onDocumentMouseMove(event) {

        event.preventDefault();

        mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

        if (cameraCount%2===1)
            raycaster.setFromCameraNew(mouse, cameraFirst);
        else
        raycaster.setFromCamera(mouse, camera);

        var intersects = raycaster.intersectObjects(objects);

        if (intersects.length > 0) {

            var intersect = intersects[ 0 ];

            cube.position.copy(intersect.point).add(intersect.face.normal);
            cube.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);

        }



    }

    function onDocumentMouseDown(event) {

        event.preventDefault();

        //mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
        mouse.set((event.pageX / w) * 2 - 1, -(event.pageY / h) * 2 + 1);
        
        if (cameraCount%2===1)
            raycaster.setFromCameraNew(mouse, cameraFirst);
        else
        raycaster.setFromCamera(mouse, camera);
    
        var planeIntersects = raycaster.intersectObjects(objects);
//    var intersects = raycaster.intersectObjects(entitiesCollider);
        var intersects = raycaster.intersectObjects(selectables);

        if (!ctrlPressed && event.button === 2) {
            tank = null;
            for (i = 0; i < tanks.length; ++i) {
                tanks[i].selectMesh.visible = false;
                //tanks[i].line.visible = false;
            }
            return;
        }
        if (intersects.length > 0) {
            //console.log(intersects[0].point.x + "---" + intersects[0].point.z);
            for (i = 0; i < tanks.length; ++i) {
                tanks[i].selectMesh.visible = false;
                //tanks[i].line.visible = false;
                if (tanks[i].chassisMesh === intersects[0].object.object) {
                    tank = tanks[i];
                    tank.selectMesh.visible = true;
                    //tank.line.visible = controller.wayPoints;
                    console.log("tank" + tank.id + " selected");
                    //setTimeout(function () {
                    //    tank.selectMesh.visible = false;
                    //}, 1000);
                    //break;
                }
            }

        }
        else if (shiftPressed && planeIntersects.length > 0 && event.button === 0) {
            if (tank) {
                //console.log('looo');

                tank.wayPoints.push(planeIntersects[0].point);
                //tank.line.geometry.vertices[tank.wayPoints.length] = planeIntersects[0].point;
                //tank.line.geometry.verticesNeedUpdate = true;
                //console.log(tank.wayPoints.length);
                this.wayPointsClicked += 1;


            }
        }
        else {
            if (!ctrlPressed && planeIntersects.length > 0 && event.button === 0) {

                if (tank) {
                    tank.wayPoints = [];
                    //tank.wayPoints.pop();
                    //tank.line.geometry.vertices[1] = planeIntersects[0].point;
                    //tank.line.geometry.verticesNeedUpdate = true;
                    tank.wayPoints.push(planeIntersects[0].point);
                    //console.log(tank.wayPoints.length);


                }
            }
        }

    }
    function onKeyDown(evt) {
        switch (evt.keyCode) {
            case 16: //shift key
                shiftPressed = true;
                break;
            case 17: //control key
                ctrlPressed = true;
                break;
        }
    }

    function onKeyUp(evt) {
        switch (evt.keyCode) {
            case 16: //shift key
                shiftPressed = false;
                break;
            case 17: //control key
                ctrlPressed = false;
                break;
        }
}
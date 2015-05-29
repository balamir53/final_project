 /* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// global variables and usual functions
var box;
var scene, camera, controls;
var objects = [];
var mouse, raycaster, plane;
var geometry, material, cube;
var tank, tank01, tank02, tank03;
var tanks = [];
var entitiesCollider = [];
var myCanvas, w, h;
var shiftPressed = false;

var hitProb = {
    'tank': {'tank': .8, 'art': .9, 'inf': .5}

};

var terrainType = {
    0: 1,
    1: 2,
    2: 0
};

var initScene = function () {
    myCanvas = document.getElementsByTagName("canvas")[0];

    w = myCanvas.clientWidth;
    h = myCanvas.clientHeight;

    renderer = new THREE.WebGLRenderer({canvas: myCanvas});
    renderer.setSize(w, h);
    renderer.setClearColor(0xffffff);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
            35, // Field of view
            w / h, // Aspect ratio
            0.1, // Near
            10000   // Far
            );
};

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

function lookTowards(fromObject, toPosition, dTheta, goalDirection, tank) {
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
}

function onDocumentMouseMove(event) {

    event.preventDefault();

    mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

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
    raycaster.setFromCamera(mouse, camera);
    var planeIntersects = raycaster.intersectObjects(objects);
    var intersects = raycaster.intersectObjects(entitiesCollider);

    if (event.button === 2) {
        tank = null;
        for (i = 0; i < tanks.length; ++i) {
            tanks[i].selectMesh.visible = false;
            tanks[i].line.visible = false;
        }
        return;
    }
    if (intersects.length > 0) {
        //console.log(intersects[0].point.x + "---" + intersects[0].point.z);
        for (i = 0; i < tanks.length; ++i) {
            tanks[i].selectMesh.visible = false;
            tanks[i].line.visible = false;
            if (tanks[i].chassisMesh === intersects[0].object) {
                tank = tanks[i];
                tank.selectMesh.visible = true;
                tank.line.visible = true;
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
        if (planeIntersects.length > 0 && event.button === 0) {

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
    }
}

function onKeyUp(evt) {
    switch (evt.keyCode) {
        case 16: //shift key
            shiftPressed = false;
            break;
    }
}
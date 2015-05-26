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

function lookTowards(fromObject, toPosition, dTheta,goalDirection) {
    var quat0 = new THREE.Quaternion();
    var eye = fromObject.position;
    quat0.setFromRotationMatrix(fromObject.matrix);
    var up = new THREE.Vector3(0, 1, 0);
    //var center = toPosition;
    if(goalDirection)
        var center = goalDirection;
    else
        //var center = new THREE.Vector3(toPosition.x,0,toPosition.z);
        var center = toPosition;
    var mat = new THREE.Matrix4();
    mat.lookAt(center, eye, up);
    
//    if(fromObject.parent!==scene){
//        //quat0.setFromRotationMatrix(fromObject.getWorldRotation());
//        quat0.setFromEuler(fromObject.getWorldRotation());
//        //quat0 = fromObject.getWorldQuaternion();
//        eye = fromObject.getWorldPosition();
//        //if (eye.z>0)
//        //    mat.lookAt(eye, center, up);
//        //else
//            mat.lookAt(center, eye, up);
//        
//    }
    var quat1 = new THREE.Quaternion();
    quat1.setFromRotationMatrix(mat);
    var deltaTheta = angleBetweenQuats(quat0, quat1);
    var frac = dTheta / deltaTheta;
    if (frac > 1)
        frac = 1;
//    if(fromObject.parent!==scene){
//     THREE.SceneUtils.detach(fromObject,parent,scene);
//     fromObject.quaternion.slerp(quat1, 1);
//     THREE.SceneUtils.attach(fromObject,scene,parent);
//    }else
    fromObject.quaternion.slerp(quat1, frac);
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

    if(event.button === 2){
        tank = null;
        for (i = 0; i < tanks.length; ++i) {
            tanks[i].selectMesh.visible=false;}
        return;
    }
    if (intersects.length > 0) {
        //console.log(intersects[0].point.x + "---" + intersects[0].point.z);
        for (i = 0; i < tanks.length; ++i) {
            tanks[i].selectMesh.visible=false;
            if (tanks[i].chassisMesh === intersects[0].object) {
                tank = tanks[i];
                tank.selectMesh.visible = true;
                //setTimeout(function () {
                //    tank.selectMesh.visible = false;
                //}, 1000);

                //break;
            }
        }
        //tank=tank02;
        //tank.selectMesh.visible = true;
    }
    else {
        if (planeIntersects.length > 0 && event.button === 0) {
            //console.log("hedef secildi");
            //console.log(planeIntersects[0].point.y);
            if (tank){
                //tank.state = 'moving';
                tank.goal = planeIntersects[0].point;
                //tank.goal = new THREE.Vector3(planeIntersects[0].point.x,0,planeIntersects[0].point.z);
        }}
    }

}

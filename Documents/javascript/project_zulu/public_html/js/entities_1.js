/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var entityProto = {
    nextID: 1,
    closeEnough: .3,
    distTo: function (unit) {
        var dx = this.pos.x - unit.pos.x;
        var dz = this.pos.z - unit.pos.z;
        return Math.sqrt(dx * dx + dz * dz);
    },
    getClosestTarget: function () {
        this.target = null;
        for (var tank in tanks) {
            //if(!tanks[tank]) return;
            if (tanks[tank].pos && tanks[tank].state !== 'dead' && tanks[tank].side !== this.side && this.distTo(tanks[tank]) < this.range) {
                //console.log('aha');
                this.target = tanks[tank];
                this.state = 'engaged';
            }
        }
        if (this.target === null) {
            this.state = 'idle';
        }

    },
    move: function (dt) {
        // the point in front of the entity
        var pointFront = new THREE.Vector3(0, .4, 2);
        this.mesh.localToWorld(pointFront);
        //the vector down
        var toEarth = new THREE.Vector3(0, -1, 0);
        var ray = new THREE.Raycaster(pointFront, toEarth);
        var collisions = ray.intersectObject(plane);
        //to visualize the front point
        box.position.set(pointFront.x, pointFront.y, pointFront.z);



        //the point above the entity mesh
        var toCenter = new THREE.Vector3(0, 10, 0);
        this.mesh.localToWorld(toCenter);
        var ray1 = new THREE.Raycaster(new THREE.Vector3(this.mesh.position.x, this.mesh.position.y + 10, this.mesh.position.z), toEarth);
        var earthLevel = ray1.intersectObject(plane);

        var dTheta = dt * this.rotationSpeed;
        //var dx = new THREE.Vector3().subVectors(this.goal, this.mesh.position);




        if (collisions[0]) {

            // taking the direction of a vector which is perpendicular to the plane
            var vec = new THREE.Vector3();
            vec.subVectors(this.goal, collisions[0].point);
            vec.projectOnPlane(collisions[0].face.normal);
            vec.multiplyScalar(100);
            var goalDirection = new THREE.Vector3().addVectors(collisions[0].point, vec);
            //this.goal2 = undefined;

            this.terrainMaterial = collisions[0].face.materialIndex;
            //if (this.normal !== collisions[0].face.normal)
            this.goal2 = goalDirection;
            this.normalY = collisions[0].face.normal.clone().y;

            var yDir = this.goal2.clone();
            yDir.normalize();

            if (this.goal.y - this.pos.y < .01 && this.normalY === 1)
                this.goal2 = null;
            if (yDir.y > 0)
                this.normalY = Math.pow(this.normalY, 6);



        }

        //if (dx.length() > .3)
        lookTowards(this.mesh, this.goal, dTheta, this.goal2);
        //if (dx.length() > this.closeEnough)
        this.mesh.translateZ(dt * this.speed * terrainType[this.terrainMaterial] * this.normalY);
        if (earthLevel[0])
            this.mesh.position.y = earthLevel[0].point.y;

    },
    chooseAmmo: function () {
        for (var i = 0; i < this.ammoNumber; ++i) {
            if (this.ammo[i].fired === false) {
                this.ammo[i].cube.position.copy(new THREE.Vector3().setFromMatrixPosition(this.barrelMesh.matrixWorld));
                this.ammo[i].cube.visible = true;
                this.ammo[i].fired = true;
                return this.ammo[i];
            }
        }

    },
    shoot: function (dt) {
        lookTowards(this.shotAmmo.cube, this.shotAtPos, 100);
        var dx = new THREE.Vector3();
        //dx.subVectors(this.shotAtPos, this.shotAmmo.cube.position);
        dx.subVectors(this.shotAtPos, this.shotFromPos);
        var ahead0 = dx.clone();
        ahead0.normalize();
        ahead0.multiplyScalar(dt * this.shotAmmo.speed);
        this.shotAmmo.fireDistance += ahead0.length();
        this.shotAmmo.cube.position.add(ahead0);

        if (this.shotAmmo.cube.position.distanceTo(this.shotToTarget.turretMesh.getWorldPosition()) < 1) {
            this.hit(this.shotToTarget);
            this.shotAmmo.cube.position.copy(new THREE.Vector3().setFromMatrixPosition(this.barrelMesh.matrixWorld));
            this.shotAmmo.fired = false;
            this.shotAmmo.cube.visible = false;
            this.shotAmmo.fireDistance = 0;
            this.shooting = false;
        }
        //else if (dx.length() < .1) {
        else if (this.shotAmmo.fireDistance > this.shotAmmo.maxDistance) {

            this.shotAmmo.cube.position.copy(new THREE.Vector3().setFromMatrixPosition(this.barrelMesh.matrixWorld));
            this.shotAmmo.fired = false;
            this.shotAmmo.cube.visible = false;
            this.shotAmmo.fireDistance = 0;
            this.shooting = false;

        }

        //if (hitProb[this.type][target.type]> Math.random())

    },
    hit: function (target) {
        console.log("ateeees" + this.id);
        target.health -= 25;


    },
    update: function (dt) {
        if (!this.mesh)
            return;

        if (this.state === 'dead') {
            this.mesh.visible = false;
            this.ammo[0].cube.visible = false;
            this.target = null;
            return;
        }

        if (this.shooting)
            this.shoot(dt);

        //beginning of the line
//        if(this.wayPointsClicked - this.wayPoints.length>0){
//        for (var i =0 ; i< this.wayPointsClicked - this.wayPoints.length; ++i){
//            this.line.geometry.vertices[10 -this.wayPointsClicked + this.wayPoints.length]= this.pos;
//        }
//    }
        if (this.wayPoints[0]){
        this.line.geometry.vertices[0] = this.pos;
        for (var i =0 ; i<this.wayPoints.length; ++i){
            this.line.geometry.vertices[i+1]=this.wayPoints[i];
        }

        for (var i = 0; i < 9 - this.wayPoints.length; ++i) {
            this.line.geometry.vertices[9-i] = this.wayPoints[this.wayPoints.length-1];
            //this.line.geometry.vertices[this.wayPointsClicked - this.wayPoints.length -1 ] = this.pos;

        }
        this.line.geometry.verticesNeedUpdate = true;}

        if (this.wayPoints[0])
            this.goal = this.wayPoints[0];
        if (this.goal)
            var dx = new THREE.Vector3().subVectors(this.goal, this.mesh.position);
        else
            dx = new THREE.Vector3().copy(this.pos);

        this.getClosestTarget();

        if (
                //this.state !== 'engaged' && 
                dx.length() > this.closeEnough
                || this.wayPoints.length > 0)
            this.state = 'moving';

        switch (this.state) {
            case('idle'):
                if (this.health < 0)
                    this.state = 'dead';
                return;
            case('moving'):
                if (this.health < 0)
                    this.state = 'dead';
                if (dx.length() <= this.closeEnough) {
                    this.wayPoints.shift();
                    this.state = 'idle';
                    return;
                }
                this.move(dt);
                return;

            case('engaged'):
                if (this.health < 0)
                    this.state = 'dead';
                var dTheta = dt * this.traverseSpeed;
                this.rotatedToTarget = false;
                lookTowards(this.turretMesh, this.mesh.worldToLocal(this.target.turretMesh.getWorldPosition()), dTheta, undefined, this);
                if (this.rotatedToTarget && !this.reloading) {
                    //this.shoot(dt,this.target);
                    this.shotToTarget = this.target;
                    this.shotAmmo = this.chooseAmmo();
                    this.shotAtPos = this.target.turretMesh.getWorldPosition();
                    this.shotFromPos = this.turretMesh.getWorldPosition();
                    this.shooting = true;
                    this.reloading = true;
                    var that = this;
                    setTimeout(function () {
                        that.reloading = false;
                    }, 3000);
                }
                //console.log(this.health + " " + this.id);
                return;

            case ('dead'):
                this.mesh.visible = false;
                this.ammo[0].cube.visible = false;
                this.target = null;
                return;
        }


    }
};
function Tank(side, scene, loc, loader, camera, collid, yRotation) {
    this.id = this.nextID;
    entityProto.nextID += 1;
    this.type = 'tank';
    this.speed = 10.0;
    this.rotationSpeed = 5.0;
    this.traverseSpeed = 2.0;
    this.elevateSpeed = 0.0;
    this.camera = camera;

    //this.goal = new THREE.Vector3(loc.x, loc.y, loc.z-3.45);
    //this.goal = new THREE.Vector3();


    //this.goal = new THREE.Vector3(100, 100, 100);

    //movement
    this.terrainMaterial = 0;
    this.normalY = 1;
    this.wayPoints = [];
    this.goal;

    this.mesh = new THREE.Object3D();
    this.turretMesh = new THREE.Object3D();
    this.barrelMesh = new THREE.Object3D();
    this.pos = new THREE.Vector3();

    //movement line
    var material = new THREE.LineBasicMaterial({color: 0xff0000});
    var geometry = new THREE.Geometry();
    for (var i = 0; i < 10; ++i) {
        geometry.vertices.push(new THREE.Vector3(loc.x, loc.y, loc.z));
    }
    this.line = new THREE.Line(geometry, material);
    this.line.geometry.verticesNeedUpdate = true;
    this.line.visible = false;
    scene.add(this.line);
    this.wayPointsClicked = 0;

    //this.wayPoints.push(this.pos)

    this.state = 'idle';
    this.side = side;
    this.target = null;

    this.range = 20;
    this.health = 100;

    //engaging and shootin
    this.rotatedToTarget = false;
    this.reloading = false;
    this.shooting = false;
    this.shotAtPos = new THREE.Vector3();
    this.shotAmmo = null;
    this.shotToTarget = null;
    this.shotFromPos = new THREE.Vector3();
    //this.damageList = [];
    //experiment
    this.goal2;


    this.fireGun = false;
    this.ahead = new THREE.Vector3(0, 0, 1);
    //this.hit = false;
    this.ammo = [];
    this.ammoNumber = 1;

    for (i = 0; i < this.ammoNumber; ++i) {
        this.ammo.push(new Ammos(i));
    }
    ;


    var that = this;

    var onGeometry = function (geom, mats) {

        that.chassisMesh = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(mats));
        that.chassisMesh.position.set(loc.x, loc.y, loc.z);
        if (yRotation)
            that.chassisMesh.rotation.y = yRotation;
        that.chassisMesh.castShadow = true;
        that.mesh = that.chassisMesh;
        that.pos = that.chassisMesh.position;
        that.wayPoints.push(that.pos);
        collid.push(that.chassisMesh);
        scene.add(that.chassisMesh);

        //parent = that.chassisMesh;
        loader.load("models/tank/turret.json", onGeometryTurret);
        loader.load("models/tank/selected.json", onGeometrySel);
    };
    var onGeometryTurret = function (geom, mats) {
        that.turretMesh = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(mats));
        that.chassisMesh.add(that.turretMesh);

        //that.turretMesh.position.set(0.00734,-0.63025,1.17879);
        that.turretMesh.position.set(0.00734, 1.17879, -0.63025);
        loader.load("models/tank/barrel.json", onGeometryBarrel);
    };
    var onGeometryBarrel = function (geom, mats) {
        that.barrelMesh = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(mats));
        //that.barrelMesh.position.set(0,1.46306-1.50835,0.64304);
        that.barrelMesh.position.set(0, 0.25, .9);
        that.turretMesh.add(that.barrelMesh);
        //var myCamera = camera;
        //that.barrelMesh.add(myCamera);
        //myCamera.position.set(0, 2, -10);
        //myCamera.rotation.y = Math.PI;
        //mesh = that.barrelMesh;

    };


    var onGeometrySel = function (geom, mats) {
        that.selectMesh = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(mats));
        mats[0].depthWrite = false;  // important --> particle system over transparent object
        that.selectMesh.visible = false;
        that.chassisMesh.add(that.selectMesh);
    };

    loader.load("models/tank/body.json", onGeometry);

}

Tank.prototype = entityProto;

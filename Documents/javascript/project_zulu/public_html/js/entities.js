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
        for (var tank in tanks) {
            //if(!tanks[tank]) return;
            if (tanks[tank].pos && tanks[tank].side !== this.side && this.distTo(tanks[tank]) < this.range) {
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
        var pointFront = new THREE.Vector3(0, .2, 2);
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
        var dx = new THREE.Vector3().subVectors(this.goal, this.mesh.position);
        
        
        
        
       if (collisions[0]) {

            // taking the direction of a vector which is perpendicular to the plane
            var vec = new THREE.Vector3();
            vec.subVectors(this.goal, collisions[0].point);
            vec.projectOnPlane(collisions[0].face.normal);
            vec.multiplyScalar(100);
            var goalDirection = new THREE.Vector3().addVectors(collisions[0].point, vec);
            //this.goal2 = undefined;
            
            //if (this.normal !== collisions[0].face.normal)
            this.goal2 = goalDirection;
            //this.normal = collisions[0].face.normal;


        }

        if (dx.length() > 3)
            lookTowards(this.mesh, this.goal, dTheta, this.goal2);
        if (dx.length() > .5)
            this.mesh.translateZ(dt * this.speed);
        if (earthLevel[0])
            this.mesh.position.y = earthLevel[0].point.y;

    },
    update: function (dt) {
        if (!this.mesh)
            return;

        if (this.state === 'dead') {
            this.target = null;
            return;
        }
        var dx = new THREE.Vector3().subVectors(this.goal, this.mesh.position);

        this.getClosestTarget();
        if (this.state !== 'engaged' && dx.length() > this.closeEnough)
            this.state = 'moving';

        switch (this.state) {
            case('idle'):
                return;
            case('moving'):
                if (dx.length() <= this.closeEnough) {
                    this.state = 'idle';
                    return;
                }
//                var dTheta = dt * this.rotationSpeed;
//                lookTowards(this.mesh, this.goal, dTheta);
//                if (dx.length() > this.closeEnough) {
//                    this.mesh.translateZ(dt * this.speed);
//                }
                this.move(dt);
                return;

            case('engaged'):
                var dTheta = dt * this.traverseSpeed;
                //lookTowards(this.turretMesh, this.target.turretMesh.getWorldPosition(), dTheta);
                //lookTowards(this.turretMesh, new THREE.Vector3(this.target.mesh.position.x,this.target.mesh.position.y+1.18,this.target.mesh.position.z), dTheta);
                //lookTowards(this.turretMesh, this.target.turretMesh.getWorldPosition(), dTheta,undefined,this.mesh);
                lookTowards(this.mesh, this.target.turretMesh.getWorldPosition(), dTheta);
                return;
        }


    }
};
function Tank(side, scene, loc, loader, camera, collid, yRotation) {
    this.id = this.nextID;
    entityProto.nextID += 1;
    this.type = 'tank';
    this.speed = 10.0;
    this.rotationSpeed = 10.0;
    this.traverseSpeed = 2.0;
    this.elevateSpeed = 0.0;
    this.camera = camera;

    this.goal = new THREE.Vector3(loc.x, 0, loc.z);

    this.state = 'idle';
    this.side = side;
    this.target = null;

    this.range = 10;
    this.health = 100;

    //experiment
    this.goal2;
    this.normal;

    this.fireGun = false;
    this.ahead = new THREE.Vector3(0, 0, 1);
    this.hit = false;
    this.ammo = [];
    this.ammoNumber = 5;

    //for (i = 0; i < this.ammoNumber; ++i) {
    //    this.ammo.push(new Ammos(i));
    //}
    //;


    var that = this;

    var onGeometry = function (geom, mats) {

        that.chassisMesh = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(mats));
        that.chassisMesh.position.set(loc.x, 0, loc.z);
        if (yRotation)
            that.chassisMesh.rotation.y = yRotation;
        that.chassisMesh.castShadow = true;
        that.mesh = that.chassisMesh;
        that.pos = that.chassisMesh.position;
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



    this.quat = new THREE.Quaternion();

    /*this.update = function (dt) {
     
     if (!this.barrelMesh)
     return;
     
     if (this.fireGun) {
     
     for (i = 0; i < this.ammoNumber; ++i) {
     if (this.ammo[i].toTarget)
     this.ammo[i].hit(dt);
     
     }
     
     
     for (i = 0; i < this.ammoNumber; ++i) {
     if (this.ammo[i].fired && !this.ammo[i].toTarget)
     this.ammo[i].fly(dt);
     
     }
     }
     
     var dTheta = dt * this.rotationSpeed;
     this.quat.setFromAxisAngle(yUnit, dTheta);
     this.chassisMesh.quaternion.multiply(this.quat);
     var dZ = dt * this.translationSpeed;
     this.chassisMesh.translateZ(dZ);
     
     dTheta = dt * this.traverseSpeed;
     this.quat.setFromAxisAngle(yUnit, dTheta);
     this.turretMesh.quaternion.multiply(this.quat);
     
     var yhead = new THREE.Vector3(0, 0, 1);
     yhead.transformDirection(this.barrelMesh.matrixWorld);
     //console.log(yhead.y);
     //if (yhead.y<=0)/// try to impede elevation of barrel under 0
     //	this.elevateSpeed = -.25
     dTheta = dt * this.elevateSpeed;
     this.quat.setFromAxisAngle(xUnit, dTheta);
     this.barrelMesh.quaternion.multiply(this.quat);
     
     
     };*/

    this.hitCol = function (collided) {
        for (i = 0; i < this.ammoNumber; ++i) {

            if (this.ammo[i].fired === false) {
                this.ammo[i].cube.position.copy(new THREE.Vector3().setFromMatrixPosition(this.barrelMesh.matrixWorld));
                this.ammo[i].cube.visible = true;
                this.ammo[i].fired = true;
                this.ammo[i].toTarget = true;
                this.ammo[i].target = collided.object;
                this.ammo[i].goal.copy(collided.point);
                break;
            }
        }
        this.hit = true;
        this.fireGun = true;
        ///
        //var removeCol = colliders.indexOf(collided.object);
        //colliders.splice(removeCol, 1);
    };

    this.fire = function (direction) {
        for (i = 0; i < this.ammoNumber; ++i) {

            if (this.ammo[i].fired === false) {
                console.log(i + ' fired');
                this.ammo[i].cube.position.copy(new THREE.Vector3().setFromMatrixPosition(this.barrelMesh.matrixWorld));
                this.ammo[i].cube.visible = true;
                this.ammo[i].fired = true;
                this.ammo[i].goal.copy(direction);
                break;
            }
        }
        this.fireDistance = 0.0;
        this.fireGun = true;
    };

}
Tank.prototype = entityProto;

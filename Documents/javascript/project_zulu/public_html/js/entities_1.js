/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var entityProto = {
    nextID: 1,
    closeEnough: .7,
    intersectsEntity: 1,
    minDistance: Infinity,
    distance: null,
    localVariable: null,
    minRange: 0,
    isAttackedBy: null,
    ray: new THREE.Raycaster(),
    ray1: new THREE.Raycaster(),
    init: function () {

        this.id = this.nextID;
        entityProto.nextID += 1;
        this.terrainMaterial = 0;
        this.normalY = 1;
        this.wayPoints = [];
        this.goal;
        this.turretMesh = new THREE.Object3D();
        this.barrelMesh = new THREE.Object3D();

        this.pos = null;

        //movement line
        var material = new THREE.LineBasicMaterial({color: 0xff0000});
        var geometry = new THREE.Geometry();
        for (var i = 0; i < 10; ++i) {
            geometry.vertices.push(new THREE.Vector3()
                    //loc.x, loc.y, loc.z)
                    );
        }
        this.line = new THREE.Line(geometry, material);
        this.line.geometry.verticesNeedUpdate = true;
        this.line.visible = false;
        scene.add(this.line);
        this.wayPointsClicked = 0;

        this.state = 'idle';
        this.target = null;

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

        this.cloud = {cloud: new THREE.Object3D()};
        this.cloud.cloud.visible = false;

        var that = this;
        function particlesLoaded(mapA) {

            that.cloud.cloud.position.set(5, 5, 5);
            scene.add(that.cloud.cloud);
            that.cloud.cloud.visible = false;

            that.cloud = new SpriteParticleSystem({
                cloud: that.cloud.cloud,
                rate: 30,
                num: 30,
                texture: mapA,
                //scaleR:[0.1,.2],
                scaleR: [0.01, .05],
                speedR: [0, 0.5],
                rspeedR: [-0.1, 0.3],
                lifespanR: [1, 4],
                terminalSpeed: 20
            });
//            that.cloud.addForce(new THREE.Vector3(0, 20, 0));
        }

        THREE.ImageUtils.loadTexture("images/tank_explode.png", undefined, particlesLoaded);


        tanks.push(this);

    },
    loadModel: function (model00Url, model00Pos, model01Url, model01Pos, model02Url, model02Pos, scene, yRotation, collid, manager, selectables,barrelCloud) {

        var that = this;
        var loader = new THREE.JSONLoader();
        loader.imageLoader = new THREE.ImageLoader(manager);

        var onGeometry = function (geom, mats) {

            that.chassisMesh = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(mats));
            that.chassisMesh.position.set(model00Pos.x, model00Pos.y, model00Pos.z);
            if (yRotation)
                that.chassisMesh.rotation.y = yRotation;
            that.chassisMesh.castShadow = true;
            that.mesh = that.chassisMesh;
//            that.boundingBox = new THREE.BoundingBoxHelper(that.mesh, 0xff0000);
            that.boundingBox = new THREE.BoundingBoxHelper(that.mesh, 0xff0000);
            //that.boundingBox.update();
            scene.add(that.boundingBox);

            that.healthBar = new THREE.Mesh(new THREE.BoxGeometry(2, .2, .2), new THREE.MeshBasicMaterial({color: 0x0000ff}));
            that.healthBar.position.y = 2.5;
            that.mesh.add(that.healthBar);

            that.pos = that.chassisMesh.position;
            that.wayPoints.push(that.pos);
//        collid.push(that.chassisMesh);
            collid.push(that.boundingBox);
            if (that.side === "blue")
                selectables.push(that.boundingBox);

            scene.add(that.chassisMesh);

            //parent = that.chassisMesh;
            if (that.side === 'red')
                loader.load(model01Url, onGeometryTurret, "models/tank/red");
            else
                loader.load(model01Url, onGeometryTurret);
            loader.load("models/tank/selected.json", onGeometrySel);
        };
        var onGeometryTurret = function (geom, mats) {
            that.turretMesh = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(mats));
            that.chassisMesh.add(that.turretMesh);

            //that.turretMesh.position.set(0.00734,-0.63025,1.17879);
            that.turretMesh.position.set(model01Pos.x, model01Pos.y, model01Pos.z);
            if (model02Url) {
                if (that.side === 'red')
                    loader.load(model02Url, onGeometryBarrel, "models/tank/red");
                else
                    loader.load(model02Url, onGeometryBarrel);
            }
        };
        var onGeometryBarrel = function (geom, mats) {
            that.barrelMesh = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(mats));
            //that.barrelMesh.position.set(0,1.46306-1.50835,0.64304);
            that.barrelMesh.position.set(model02Pos.x, model02Pos.y, model02Pos.z);
            that.turretMesh.add(that.barrelMesh);
            if (barrelCloud){
            barrelCloud.position.set(0,0,2);
            that.barrelMesh.add(barrelCloud);}
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
        if (this.side === 'red')
            loader.load(model00Url, onGeometry, "models/tank/red");
        else
            loader.load(model00Url, onGeometry);


    },
    getClosestTarget: function () {
        if (this.isAttackedBy && tanks[this.isAttackedBy - 1].state === "dead")
            this.isAttackedBy = null;
        this.minDistance = Infinity;
        this.target = null;
        for (var i = 0; i < tanks.length; ++i) {
            if (!tanks[i].mesh)
                break;
            if (tanks[i].side === this.side || tanks[i].type !== this.type || tanks[i].state === 'dead')
                continue;
            this.distance = this.pos.distanceTo(tanks[i].pos);
            if (this.distance < this.range && this.distance >this.minRange && this.minDistance>this.distance) {
                this.target = tanks[i];
                this.state = 'engaged';
                this.minDistance = this.distance;
            }

        }
        if (!this.target) {
            this.minDistance = Infinity;
            for (var i = 0; i < tanks.length; ++i) {
                if (!tanks[i].mesh)
                    break;
                this.distance = this.pos.distanceTo(tanks[i].pos);
                if (tanks[i].side === this.side || tanks[i].state === 'dead')
                    continue;
                if (this.distance < this.range && this.distance > this.minRange && this.minDistance>this.distance) {
                    this.target = tanks[i];
                    this.state = 'engaged';
                    this.minDistance = this.distance;
                }

            }
        }

        if (this.target === null) {
            this.state = 'idle';
            lookTowards(this.turretMesh, new THREE.Vector3(0, 1.18, 10), .01);
            if(this.type==="how")
            lookTowards(this.barrelMesh, new THREE.Vector3(0, 1.18, 10), .01);
        }

    },
    move: function (dt) {
        //intersection of entities
//        this.mesh.geometry.verticesNeedUpdate = true;
//        this.mesh.geometry.computeBoundingBox();
//        this.boundingBox.setFromObject(this.mesh);
        for (var i = 0; i < entitiesBoundingBox.length; ++i) {
//            tanks[i].mesh.geometry.verticesNeedUpdate = true;
//            tanks[i].boundingBox.setFromObject(tanks[i].mesh);
//            tanks[i].mesh.geometry.computeBoundingBox();
            if (!this.boundingBox.box.equals(entitiesBoundingBox[i].box) && this.boundingBox.box.isIntersectionBox(entitiesBoundingBox[i].box)) {
                this.intersectsEntity = 0;
                //console.log("girdi");
                break;
            } else
                this.intersectsEntity = 1;
        }
        ;

        // the point in front of the entity
        pointFront.set(0, .4, 2);
        this.mesh.localToWorld(pointFront);
        //the vector down

        this.ray.set(pointFront, toEarth);
        collisions1 = this.ray.intersectObject(plane);
        //to visualize the front point
//        box.position.set(pointFront.x, pointFront.y, pointFront.z);



        //the point above the entity mesh
        pointUp.copy(this.mesh.position);
        pointUp.setY(this.mesh.position.y + 10);
        this.ray1.set(pointUp, toEarth);
        earthLevel = this.ray1.intersectObject(plane);

        var dTheta = dt * this.rotationSpeed;
        //var dx = new THREE.Vector3().subVectors(this.goal, this.mesh.position);




        if (collisions1[0]) {

            // taking the direction of a vector which is perpendicular to the plane
            var vec = new THREE.Vector3();
            vec.subVectors(this.goal, collisions1[0].point);
            vec.projectOnPlane(collisions1[0].face.normal);
            var goalDirection = new THREE.Vector3().addVectors(collisions1[0].point, vec.multiplyScalar(100));
            //this.goal2 = undefined;

            this.terrainMaterial = collisions1[0].face.materialIndex;
            //if (this.normal !== collisions[0].face.normal)
            this.goal2 = goalDirection;
            this.normalY = collisions1[0].face.normal.clone().y;

            var yDir = this.goal2.clone();
            yDir.normalize();

            if (this.goal.y - this.pos.y < .01 && this.normalY === 1)
                this.goal2 = null;
            if (yDir.y > 0)
                this.normalY = Math.pow(this.normalY, 6);

        }

        if (this.mesh.position.distanceTo(this.goal) > 2)
            lookTowards(this.mesh, this.goal, dTheta, this.goal2);
        //lookTowards(this.mesh, this.goal, dTheta);
        //if (dx.length() > this.closeEnough)
        this.mesh.translateZ(dt * this.speed * terrainType[this.terrainMaterial] * this.normalY * this.intersectsEntity);
        if (earthLevel[0])
            this.mesh.position.y = earthLevel[0].point.y;


    },
    updateLines: function (dt) {
        if (!this.selectMesh || this.state === "dead")
            return;
        if (this.selectMesh.visible)
            this.line.visible = controller.wayPoints;
        else this.line.visible = false;
        var lineHeight = 2;
        var vectora = this.pos.clone();
        vectora.y = vectora.y + lineHeight;
        if (this.wayPoints[0]) {

            this.line.geometry.vertices[0] = vectora;
            for (var i = 0; i < this.wayPoints.length; ++i) {
                var vector = this.wayPoints[i].clone();
                vector.y = vector.y + lineHeight;
                this.line.geometry.vertices[i + 1] = vector;
            }

            for (var i = 0; i < 9 - this.wayPoints.length; ++i) {
                var vector = this.wayPoints[this.wayPoints.length - 1].clone();
                vector.y = vector.y + lineHeight;
                this.line.geometry.vertices[9 - i] = vector;
                //this.line.geometry.vertices[this.wayPointsClicked - this.wayPoints.length -1 ] = this.pos;

            }

        } else {
            for (var i = 0; i < 10; ++i) {
                this.line.geometry.vertices[i] = vectora;
            }

        }
        this.line.geometry.verticesNeedUpdate = true;
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
    hit: function (target) {



    },
    die: function () {
        this.mesh.visible = false;
        if(this.type!=="inf")
        this.ammo[0].cube.visible = false;
        this.target = null;

        this.cloud.cloud.visible = false;
        this.cloud.stop();

        this.localVariable = entitiesBoundingBox.indexOf(this.boundingBox);
        if (this.localVariable !== -1)
            ;
        entitiesBoundingBox.splice(this.localVariable, 1);
        this.boundingBox.visible = false;
    },
    update: function (dt) {
        if (!this.mesh)
            return;

        if (this.state === 'dead') {

            return;
        }

        if (this.shooting)
            this.shoot(dt);

//        if(this.mesh.geometry)
//        this.mesh.geometry.verticesNeedUpdate = true;

        this.boundingBox.update();
        this.boundingBox.visible = controller.boundingBoxes;

        this.healthBar.visible = controller.healthBar;
        this.healthBar.scale.x = this.health / this.armor;
        if (this.health / this.armor < .9)
            this.healthBar.material.color.setHex(0Xffff00);
        if (this.health / this.armor < .5)
            this.healthBar.material.color.setHex(0Xff0000);

        //clouds
        if (this.cloud.cloud.visible)
//if (this.cloud.cloud.rate)
            this.cloud.update(dt);
        if (this.blastCloud && this.blastCloud.cloud.visible)
            this.blastCloud.update(dt);
        if (this.barrelCloud && this.barrelCloud.cloud.visible)
            this.barrelCloud.update(dt);


        //beginning of the line
//        if(this.wayPointsClicked - this.wayPoints.length>0){
//        for (var i =0 ; i< this.wayPointsClicked - this.wayPoints.length; ++i){
//            this.line.geometry.vertices[10 -this.wayPointsClicked + this.wayPoints.length]= this.pos;
//        }
//    }
//if(firstBlood&&this.side==="red"&&this.type==="how"&&this.range<201)this.range+=15;


        if (this.wayPoints[0])
            this.goal = this.wayPoints[0];
//        else
//            this.goal = this.pos.clone();
        if (this.goal)
            var dx = new THREE.Vector3().subVectors(this.goal, this.mesh.position);
        else
            dx = 0;


        this.getClosestTarget();

        if (//this.state !== 'engaged' && 
                dx.length() > this.closeEnough
                || this.wayPoints.length > 0) {
            if (this.side === "blue" || (this.side === "red" && this.state !== "engaged"))
                this.state = 'moving';

        }

        if (controller.enemyBehavior === "1" 
                && this.side === "red" && Boolean(this.isAttackedBy) 
                && tanks[this.isAttackedBy - 1].side === "blue" && tanks[this.isAttackedBy - 1].state !== "dead"
                ) {
            for (var i = 0; i < tanks.length; ++i) {
                if (tanks[i].side === "blue" || tanks[i].type === "how" || tanks[i].state === "engaged")
                    continue;
                tanks[i].goal = tanks[this.isAttackedBy - 1].pos;

            }

        }
        switch (this.state) {
            case('idle'):
                if (this.health < 0) {
                    this.state = 'dead';
                    this.die();
                    return;
                }



                return;
            case('moving'):
                if (this.health < 0) {
                    this.state = 'dead';
                    this.die();
                    return;
                }
                if (dx.length() <= this.closeEnough) {
                    this.wayPoints.shift();
                    this.state = 'idle';
                    return;
                }
                this.move(dt);
                return;

            case('engaged'):
                if (this.health < 0) {
                    this.state = 'dead';
                    this.die();
                    return;
                }
                if (this.target === null) {
                    this.state = 'idle';
                    return;
                }
                this.engage(dt);
                //console.log(this.health + " " + this.id);
                return;

            case ('dead'):
                this.die();
                return;
        }


    }
};
function Tank(side, scene, loc, loader, collid, selectables, yRotation) {

    this.type = 'tank';
    this.speed = 10.0;
    this.rotationSpeed = 5.0;
    this.traverseSpeed = 2.0;
    this.elevateSpeed = 0.0;

    this.armor = 150;

    this.side = side;

    this.range = 30;
    this.health = this.armor;
    this.damage = 25;

    this.ammo = [];
    this.ammoNumber = 2;

    for (i = 0; i < this.ammoNumber; ++i) {
        this.ammo.push(new Ammos(i));
    }
    ;

    this.model00Url = "models/tank/t72_body.js";
    this.model01Url = "models/tank/t72_turret.js";
    this.model02Url = "models/tank/t72_barrel.js";
    this.loadModel(this.model00Url, new THREE.Vector3(loc.x, loc.y, loc.z), this.model01Url, new THREE.Vector3(0.00344, 1.10835, -0.15043), this.model02Url, new THREE.Vector3(0, 0.14, -.70), scene, yRotation, collid, loader, selectables);
    
    this.hit = function(target){

        target.cloud.cloud.position.copy(target.pos);
        target.cloud.cloud.visible = true;
        target.cloud.start();

        setTimeout(function () {
            target.cloud.cloud.visible = false;
            target.cloud.stop();
        }, 1200);

        target.health -= this.damage;
        target.isAttackedBy = this.id;
        
    };
    this.shoot = function (dt) {
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

    };

    this.engage = function (dt) {
        var dTheta = dt * this.traverseSpeed;
        this.rotatedToTarget = false;
        lookTowards(this.turretMesh, this.mesh.worldToLocal(this.target.turretMesh.getWorldPosition()), dTheta, undefined, this);
        if (this.rotatedToTarget && !this.reloading && !this.shooting) {
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

    };
    this.init();

}
function Infantry(side, scene, loc, loader, collid, selectables, yRotation) {

    this.type = 'inf';
    this.speed = 15.0;
    this.rotationSpeed = 3.0;
    this.traverseSpeed = 2.0;
    this.elevateSpeed = 0.0;

    this.armor = 75;

    this.side = side;
    
    this.barrelPos = new THREE.Vector3(0,0,1);

    this.range = 20;
    this.health = this.armor;
    this.damage = 10;

this.barrelCloud = {cloud: new THREE.Object3D()};
    this.barrelCloud.cloud.visible = false;

    var that = this;
    function particlesLoaded(mapA) {

        that.barrelCloud.cloud.position.set(5, 5, 5);
//        scene.add(that.barrelCloud.cloud);
        that.barrelCloud.cloud.visible = false;

        that.barrelCloud = new SpriteParticleSystem({
            cloud: that.barrelCloud.cloud,
            rate: 30,
            num: 30,
            texture: mapA,
            //scaleR:[0.1,.2],
            scaleR: [.0025, .05],
            speedR: [0, 0.5],
            rspeedR: [-0.1, 0.3],
            lifespanR: [1, 4],
            terminalSpeed: 20
        });
//        this.blastCloud.start();
        //that.barrelCloud.addForce(new THREE.Vector3(0, 40, 0));

    }
    THREE.ImageUtils.loadTexture("images/barrel_light.png", undefined, particlesLoaded);

    this.model00Url = "models/tank/inf_body.js";
    this.model01Url = "models/tank/inf_turret.js";
    this.model02Url = "models/tank/inf_barrel.js";
    this.loadModel(this.model00Url, new THREE.Vector3(loc.x, loc.y, loc.z), this.model01Url, new THREE.Vector3(0.08076, 1.52923, 0.42493), this.model02Url, new THREE.Vector3(.012, 0.168, .583), scene, yRotation, collid, loader, selectables,this.barrelCloud.cloud);

   this.hit = function(target){

//       this.barrelCloud.cloud.position.copy(this.barrelMesh.getWorldPosition());
        this.barrelCloud.cloud.visible = true;
        this.barrelCloud.start();
        var that =this;
        setTimeout(function () {
            that.barrelCloud.cloud.visible = false;
            that.barrelCloud.stop();
        }, 1200);

        target.health -= this.damage;
        target.isAttackedBy = this.id;
        
    };
    this.shoot = function (dt) {
        this.hit(this.shotToTarget);
        this.shooting = false;

    };

    this.engage = function (dt) {
        var dTheta = dt * this.traverseSpeed;
        this.rotatedToTarget = false;
        lookTowards(this.turretMesh, this.mesh.worldToLocal(this.target.turretMesh.getWorldPosition()), dTheta, undefined, this);
        if (this.rotatedToTarget && !this.reloading && !this.shooting) {

            this.shotToTarget = this.target;

            this.shooting = true;
            this.reloading = true;
            var that = this;
            setTimeout(function () {
                that.reloading = false;
            }, 1000);
        }

    };
    this.init();

}

function Howitzer(side, scene, loc, loader, collid, selectables, yRotation) {

    this.type = 'how';
    this.speed = 10.0;
    this.rotationSpeed = 5.0;
    this.traverseSpeed = 2.0;
    this.elevateSpeed = .5;

    this.armor = 100;

    this.side = side;

    this.range = 150;
    this.minRange = 50;
    this.health = this.armor;
    this.effectRange = 20;
    this.damage = 25;

    //engaging and shootin
    this.heightPoint = new THREE.Vector3();
    this.heightPointY = new THREE.Vector3();
    this.halfDistance = new THREE.Vector3();
    
    this.levitatedToTarget = false;

    this.blastCloud = {cloud: new THREE.Object3D()};
    this.blastCloud.cloud.visible = false;

    var that = this;
    function particlesLoaded(mapA) {

        that.blastCloud.cloud.position.set(5, 5, 5);
        scene.add(that.blastCloud.cloud);
        that.blastCloud.cloud.visible = false;

        that.blastCloud = new SpriteParticleSystem({
            cloud: that.blastCloud.cloud,
            rate: 30,
            num: 30,
            texture: mapA,
            //scaleR:[0.1,.2],
            scaleR: [0.05, .1],
            speedR: [0, 0.5],
            rspeedR: [-0.1, 0.3],
            lifespanR: [1, 4],
            terminalSpeed: 20
        });
//        this.blastCloud.start();
        that.blastCloud.addForce(new THREE.Vector3(0, 40, 0));

    }
    THREE.ImageUtils.loadTexture("images/smoke1.png", undefined, particlesLoaded);

    //shooting path
    this.curve = new THREE.QuadraticBezierCurve3(
            //this.curve = new THREE.SplineCurve3([
            new THREE.Vector3(-10, 0, 0),
            new THREE.Vector3(20, 15, 0),
            new THREE.Vector3(10, 0, 0)
            //]
            );
    this.curve.needsUpdate = true;
    var geometry = new THREE.Geometry();
    geometry.vertices = this.curve.getPoints(50);
    var material = new THREE.LineBasicMaterial({color: 0xff0000});
    this.curveObject = new THREE.Line(geometry, material);
    this.curveObject.geometry.verticesNeedUpdate = true;
    this.curveObject.visible = false;
    scene.add(this.curveObject);

    this.ammoCounter = 0;

    //this.hit = false;
    this.ammo = [];
    this.ammoNumber = 2;

    for (i = 0; i < this.ammoNumber; ++i) {
        this.ammo.push(new Ammos(i));
    }
    ;

    this.model00Url = "models/tank/how_body.js";
    this.model01Url = "models/tank/how_turret.js";
    this.model02Url = "models/tank/how_barrel.js";
    this.loadModel(this.model00Url, new THREE.Vector3(loc.x, loc.y, loc.z), this.model01Url, new THREE.Vector3(-0.09898, .85355, .04284), this.model02Url, new THREE.Vector3(-.04, 0.42, 1.15), scene, yRotation, collid, loader, selectables);

    this.hit = function (position) {
        this.blastCloud.cloud.position.copy(position);
        this.blastCloud.cloud.visible = true;
        //this.blastCloud.addForce(new THREE.Vector3(0, 40, 0));
        this.blastCloud.start();

        var that = this;
        setTimeout(function () {
            that.blastCloud.stop();
            that.blastCloud.cloud.visible = false;

        }, 2000);


        for (var i = 0; i < tanks.length; ++i) {
            this.localVariable = position.distanceTo(tanks[i].pos);
            if (this.localVariable < this.effectRange) {
                tanks[i].health -= this.damage * (this.effectRange - this.localVariable) / this.effectRange;
                tanks[i].isAttackedBy = this.id;
                if (this.side === "blue")
                    firstBlood = true;
                //console.log(tanks[i].health)
            }

        }
        if (firstBlood) {
            for (var i = 0; i < tanks.length; ++i) {
                if (tanks[i].side === "red" && tanks[i].type === "how"&&tanks[i].range<200)
                    tanks[i].range += 15;
            }
        }

    };

    this.shoot = function (dt) {

        this.ammoCounter += dt / 4;


        if (this.ammoCounter <= 1) {
//        cube.position.copy(this.curve.getPointAt(this.ammoCounter));
            this.shotAmmo.cube.position.copy(this.curve.getPointAt(this.ammoCounter));
            lookTowards(this.shotAmmo.cube, this.shotAmmo.cube.position.clone().add(this.curve.getTangentAt(this.ammoCounter)), 100);
//    lookTowards(this.shotAmmo.cube, this.curve.getTangentAt(this.ammoCounter), 100);
        }

        if (this.ammoCounter > 1) {
            //(this.shotAmmo.fireDistance > this.shotAmmo.maxDistance) {
            this.hit(this.shotAtPos);
            this.shotAmmo.cube.position.copy(new THREE.Vector3().setFromMatrixPosition(this.barrelMesh.matrixWorld));
            this.shotAmmo.fired = false;
            this.shotAmmo.cube.visible = false;
            //this.shotAmmo.fireDistance = 0;
            this.ammoCounter = 0;
            this.shooting = false;
            this.curveObject.visible = false;

        }

    };

    this.engage = function (dt) {
        var dTheta = dt * this.rotationSpeed;
        var dTheta1 = dt * this.elevateSpeed;
        this.halfDistance = this.target.pos.clone().sub(this.pos).multiplyScalar(3 / 4);
        this.heightPoint.copy(this.pos).add(this.halfDistance).add(this.heightPointY.setY(this.halfDistance.length()));
//        this.heightPoint.copy(this.halfDistance).add(this.heightPointY.setY(this.halfDistance.length()));
        this.rotatedToTarget = false;
        lookTowards(this.turretMesh, this.mesh.worldToLocal(this.heightPoint.clone().setY(this.turretMesh.getWorldPosition().y)), dTheta, undefined, this);
        if (this.rotatedToTarget)
            lookTowards(this.barrelMesh, this.turretMesh.worldToLocal(this.heightPoint.clone()), dTheta1, undefined, this, true);
        if (this.levitatedToTarget && !this.reloading && !this.shooting && this.pos.distanceTo(this.target.pos) > this.minRange) {

            //renew the ballistic path
            this.curve.v0.copy(this.barrelMesh.getWorldPosition());
            this.curve.v2.copy(this.target.pos);
            this.curve.v1.copy(this.heightPoint);


            this.curveObject.geometry.vertices = this.curve.getPoints(50);
            this.curve.needsUpdate = true;
            this.curveObject.geometry.verticesNeedUpdate = true;
            if (controller.ballisticTrajectory)
                this.curveObject.visible = true;



            //this.shoot(dt,this.target);
            this.ammoCounter = 0;
            this.shotToTarget = this.target;
            this.shotAmmo = this.chooseAmmo();
            this.shotAtPos.copy(this.target.pos);
            this.shotFromPos = this.turretMesh.getWorldPosition();
            this.shooting = true;
            this.reloading = true;
            var that = this;
            setTimeout(function () {
                that.reloading = false;
            }, 8000);
        }

    };
    this.init();
}

Tank.prototype = entityProto;
Howitzer.prototype = entityProto;
Infantry.prototype = entityProto;

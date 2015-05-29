/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
function Ammos(id) {
    this.id = id;
    this.fired = false;
    this.maxDistance = 30.0;
    this.fireDistance = 0.0;
    this.toTarget = false;
    this.speed = 25.0;
    this.target = undefined;
    this.destroyedTarget = [];
    this.cube = new THREE.Object3D();
    //this.cloud = cloud1;
    var loader = new THREE.JSONLoader();
    var that = this;
    var onGeometry = function (geom, mats) {
        that.cube = new THREE.Mesh(geom, new THREE.MeshFaceMaterial(mats));
        that.cube.visible = false;
        that.cube.scale.set(.3, .3, .3);
        //that.cube.useQuaternion = true;
        scene.add(that.cube);
    };
    loader.load("models/tank/ammo.json", onGeometry);
    this.goal = new THREE.Vector3();
    this.reset = function () {
        this.cube.position.copy(new THREE.Vector3().setFromMatrixPosition(tank.barrelMesh.matrixWorld));
        this.fired = false;
        this.cube.visible = false;
        this.fireDistance = 0.0;

    };
    this.fly = function (dt) {
        var goal1 = new THREE.Vector3();
        var temp = new THREE.Vector3();
        temp.copy(this.goal);
        goal1.addVectors(this.cube.position, temp.multiplyScalar(20));
        lookTowards(this.cube, goal1, 100);
        var ahead0 = new THREE.Vector3();
        ahead0.copy(this.goal);
        ahead0.multiplyScalar(dt * this.speed);
        this.cube.position.add(ahead0);
        this.fireDistance = this.fireDistance + ahead0.length();
        //console.log (this.fireDistance);
        if (this.fireDistance > this.maxDistance) {
            this.reset();
        }
    };
    this.hit = function (dt) {
        lookTowards(this.cube, this.goal, 100);
        var dx = new THREE.Vector3();
        dx.subVectors(this.goal, this.cube.position);
        var ahead0 = dx.clone()
        ahead0.normalize();
        ahead0.multiplyScalar(dt * this.speed);
        this.cube.position.add(ahead0);
        if (dx.length() <= closeEnough) {
            console.log("al kirdin kirdin");
            //sound
            var source1 = context1.createBufferSource();
            source1.buffer = buffer1;
            source1.connect(context1.destination);
            source1.start(0);


            this.cloud.cloud.position.copy(this.goal);
            this.cloud.cloud.visible = true;
            this.cloud.start();
            var that = this;
            setTimeout(function () {
                that.cloud.cloud.visible = false;
                that.cloud.stop();
            }, 2000);



            ///
            var removeCol = colliders.indexOf(this.target);
            colliders.splice(removeCol, 1);
            //var removeCol = colliders.indexOf(this.target);
            //colliders.splice(removeCol, 1);

            this.destroyedTarget.push(this.target);
            var that = this;

            /*setTimeout(function () {
             while (that.destroyedTarget[0]){
             that.destroyedTarget[0].parent.visible = false;
             that.destroyedTarget.shift();
             }
             }, 1000);*/

            for (i = 0; i < barrels.length; ++i) {
                //if (this.destroyedTarget[0] === barrels[i].mesh.children[4]){
                if (this.destroyedTarget[0] === barrels[i].mesh) {
                    barrels[i].destroy();
                    break;
                }
            }
            this.destroyedTarget.shift();
            tank.hit = false;

            this.toTarget = false;
            this.reset();
        }
    };
}


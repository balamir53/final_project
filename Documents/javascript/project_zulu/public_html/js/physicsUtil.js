var PhysicsUtil = {

createCollisionShape : function(mesh,mass,shape,color,dynamicsWorld,initMatrices) {
  if (initMatrices===undefined)
    initMatrices = true;
  if (initMatrices) {
    mesh.updateMatrix();
    mesh.updateMatrixWorld();
  }
  if (!mesh.geometry.boundingBox)  
    mesh.geometry.computeBoundingBox();
  if (!mesh.geometry.boundingSphere)  
    mesh.geometry.computeBoundingSphere();

  var bb = mesh.geometry.boundingBox;
  var xdim = bb.max.x-bb.min.x;
  var ydim = bb.max.y-bb.min.y;
  var zdim = bb.max.z-bb.min.z;
  var bs = mesh.geometry.boundingSphere;
  
  var collmesh;
  if (shape=="box") {
    // physics collision shape
    var shape=new Ammo.btBoxShape(new Ammo.btVector3(xdim/2,ydim/2,zdim/2));
    // three.js collision shape
    collmesh = new THREE.Mesh(
      new THREE.BoxGeometry( xdim, ydim, zdim ),
      new THREE.MeshLambertMaterial( { color: color, ambient: color } )
    );
    collmesh.position.set(bb.min.x+xdim/2, bb.min.y+ydim/2, bb.min.z+zdim/2);
  }
  else if (shape=="sphere") {
    // physics collision shape
    var shape=new Ammo.btSphereShape(bs.radius);
    // three.js collision shape
    collmesh = new THREE.Mesh(
      new THREE.SphereGeometry( bs.radius ),
      new THREE.MeshLambertMaterial( { color: color, ambient: color } )
    );
    collmesh.position.copy(bs.center);
  }
  else if (shape=="cylinder") { 
    // physics collision shape
    var shape=new Ammo.btCylinderShape(new Ammo.btVector3(bs.radius,bs.radius,bs.radius));
    // three.js collision shape
    collmesh = new THREE.Mesh(
      new THREE.CylinderGeometry( bs.radius, bs.radius, ydim ),
      new THREE.MeshLambertMaterial( { color: color, ambient: color } )
    );  
    collmesh.position.copy(bs.center);
  }
  else {  // plane
    // physics collision shape
    var normalDir = new Ammo.btVector3(1,0,0);
    var planeConstant = bs.center.x;
    var minDim = xdim;
    if (ydim<minDim)  { 
      normalDir.setValue(0,1,0);
      planeConstant = bs.center.y;
      minDim = ydim;
    }
    if (zdim<minDim) {
      normalDir.setValue(0,0,1);
      planeConstant = bs.center.z;
      minDim = zdim;
    }
    var maxWidth = Math.max(xdim,ydim,zdim);
    var shape=new Ammo.btStaticPlaneShape(normalDir,planeConstant);
    // three.js collision shape
    collmesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry( 2*maxWidth, 2*maxWidth ),
      new THREE.MeshLambertMaterial( { color: color, ambient: color } )
    );  
    if (normalDir.x())  collmesh.rotation.y = Math.PI/2;
    if (normalDir.y())  collmesh.rotation.x = Math.PI/2;
    collmesh.position.copy(bs.center);
  }
  
  // init physics transform from three transform
  var transform=new Ammo.btTransform();
  var mat = mesh.matrixWorld;
  PhysicsUtil.three2b(mat,transform);
  
  var localInertia=new Ammo.btVector3(0,0,0);
  if (mass>0.0)
    shape.calculateLocalInertia(mass,localInertia);
  var motionState = new Ammo.btDefaultMotionState( transform );
  var cInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
  var body=new Ammo.btRigidBody(cInfo);
  dynamicsWorld.addRigidBody(body);
  // three.js collision shape
  //mesh.add(collmesh);
  collmesh.visible = false;
  return {mesh:collmesh,body:body};
},

b2three : function(trans,mat) {
  var basis = trans.getBasis();
  var origin = trans.getOrigin();
  var m = mat.elements;
  var v = basis.getRow(0);
  m[0] = v.x(); m[4+0] = v.y(); m[8+0] = v.z(); m[12+0] = origin.x();
  v = basis.getRow(1);
  m[1] = v.x(); m[4+1] = v.y(); m[8+1] = v.z(); m[12+1] = origin.y();
  v = basis.getRow(2);
  m[2] = v.x(); m[4+2] = v.y(); m[8+2] = v.z(); m[12+2] = origin.z();
  m[3] = 0.0; m[4+3] = 0.0; m[8+3] = 0.0; m[12+3] = 1.0;
},

three2b : function(mat,trans) {
  var basis = trans.getBasis();
  var origin = trans.getOrigin();
  var m = mat.elements;
  var v = basis.getRow(0);
  v.setX(m[0]); v.setY(m[4+0]); v.setZ(m[8+0]); origin.setX(m[12+0]); 
  v = basis.getRow(1);
  v.setX(m[1]); v.setY(m[4+1]); v.setZ(m[8+1]); origin.setY(m[12+1]);
  v = basis.getRow(2);
  v.setX(m[2]); v.setY(m[4+2]); v.setZ(m[8+2]); origin.setZ(m[12+2]);
},

initPhysics : function() {
  var collision_config = new Ammo.btDefaultCollisionConfiguration();
  var dispatcher = new Ammo.btCollisionDispatcher( collision_config );
  var overlappingPairCache =  new Ammo.btDbvtBroadphase();
  var solver = new Ammo.btSequentialImpulseConstraintSolver();
  dynamicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, overlappingPairCache, solver, collision_config );
  dynamicsWorld.setGravity(new Ammo.btVector3(0, -6, 0));
  return dynamicsWorld;
},

applyScale : function(mesh) {
  var verts = mesh.geometry.vertices;
  var scale = mesh.scale;
  for (var i=0;i<mesh.geometry.vertices.length;i++) {
    var vertex = verts[i];
    for (var j=0;j<3;j++)
      vertex[j] *= scale[j];
  }
  scale.set(1,1,1);
},

FPSMover : function(radius,height,scene,physics,controls,visualizeB) {
  this.controls = controls;
  // z value supposedly not used, but setting to radius just in case
  var shape = new Ammo.btCylinderShape(new Ammo.btVector3(radius,height/2,radius));
  var transform = new Ammo.btTransform();
  transform.setIdentity();
  // slightly off the ground
  transform.setOrigin(new Ammo.btVector3(0,15.1,0));
  localInertia = new Ammo.btVector3(0,0,0);
  var motionState = new Ammo.btDefaultMotionState( transform );
  var mass=2;
  shape.calculateLocalInertia(mass,localInertia);
  var cInfo = new Ammo.btRigidBodyConstructionInfo(mass,motionState,shape,localInertia);
  cInfo.set_m_friction(1.0);
  this.body = new Ammo.btRigidBody(cInfo);
  this.body.setWorldTransform(transform);
  // turns off all rotation
  this.body.setAngularFactor(0,0,0);
  // keeps physics from going to sleep (from bullet documentation)
  var DISABLE_DEACTIVATION = 4; 
  this.body.setActivationState(DISABLE_DEACTIVATION);
  dynamicsWorld.addRigidBody(this.body);
  
  // add visualization of mover
	this.mesh = new THREE.Mesh(
	  new THREE.CylinderGeometry( 1,1,2*1 ),
	  new THREE.MeshLambertMaterial( { color: 0x00FF00, ambient: 0x00FF00 } )
  );
  scene.add( this.mesh );
  this.mesh.matrixAutoUpdate = false;
  this.mesh.visible = visualizeB;
  
  // fps constants and storage
  this.forward = false;
  this.right = false;
  this.left = false;
  this.back = false;
  this.forceMag = 10;
  
  this.prerender = function(dt) {
    // move objects
    var trans=this.body.getWorldTransform(trans);
    var mat = this.mesh.matrixWorld;
    PhysicsUtil.b2three(trans,mat);
    // get camera direction
    var dir3 = new THREE.Vector3();
    this.controls.getDirection(dir3);
    var dir = new Ammo.btVector3(dir3.x,dir3.y,dir3.z);
    // project to plane
    var yUnit = new Ammo.btVector3(0,1,0);
    var zComponent = yUnit.dot(dir);
    yUnit.op_mul(zComponent);
    dir.op_sub(yUnit);
    dir.normalize();
    // right direction is dir X yUnit
    var right = yUnit.cross(dir);

      
      // set up physics for next time
    if (!this.ahead && !this.right && !this.left && !this.back)
      return;
    var forceV = new Ammo.btVector3(0,0,0);
    if (this.ahead)
      forceV.op_add(dir);
    if (this.right)
      forceV.op_add(right);
    if (this.left)
      forceV.op_sub(right);
    if (this.back)
      forceV.op_sub(dir);
    forceV.normalize();
    forceV.op_mul(this.forceMag);
    this.body.applyCentralForce(forceV);
  };
},

body2world : function(body,v3B) {
  var trans = body.getWorldTransform();
  var result = trans.op_mul(v3B);
  return result;
}

}; // end definition of PhysicsUtil

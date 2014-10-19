'use strict';

var camera, scene, renderer;

var time = Date.now(), clock = new THREE.Clock();

var fullScreenButton;

var geometry, material, mesh;

var vrEffect;
var vrControls;

var objects = [];

var video, vid;
var texture;

var videoData = {
	src: 'cache/dO4k2Rvs94I.webm'
};

var duckie;

var config = {
	autoplay: 0,
	fbUrl: 'https://web-cinema-vr.firebaseio.com/',
	roomName: 'vrhackathon',
	social: 1
};

var numChairs = 7;

var _screen;

// modes: cube, screen
var mode = 'screen';

var has = {
	WebVR: !!navigator.getVRDevices
};

var envs = {
	'earth': {
		skyColor: 0xf0f0ff,
		gndColor: 0x407000
	},
	'moon': {
		skyColor: 0x000000
	},
	'mars': {
		skyColor: 0x000000
	}
};

var environment = 'earth';
var _env = envs[environment];

var users = [
];
var me;

var headObj;

var playerId = 'p0';

var fbRef, roomRef, usersRef, myRef;

var lastUpdate = 0;



window.addEventListener('load', load);

function load() {
	loadDuckie();
	playerId = prompt('Username: ');

	init();
	animate();
}


function init() {
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0xffffff, 0, 6000);

	fullScreenButton = document.querySelector('.button');

	if (config.social)
		setupFirebase();

	setupRendering();


	setupVideo();

	setEnv(environment);

	setupScene();

	setupUsers();

	setupEvents();
}

function setupFirebase() {
	fbRef = new Firebase(config.fbUrl);

	var roomName = config.roomName;

	roomRef = fbRef.child('rooms/'+roomName);
	usersRef = roomRef.child('users');

	myRef = usersRef.child(playerId);

	roomRef.on('value', function(snapshot){

	});

	roomRef.child('env').on('value', function(snapshot) {
		console.log('change env');

		var env = snapshot.val();

		// todo: update env
		// console.log();
	});

	roomRef.child('screenDist').on('value', function(snapshot){
		console.log('update screen pos');

		var dist = snapshot.val();
		console.log(dist);

		_screen.position.setZ(dist);
		// set screen dist
	});

	usersRef.on('value', function(snapshot){
		var _users = snapshot.val();

		processUsers(_users);
	});

	/*roomRef.update({
		env: environment
	});*/

	myRef.update({
		id: playerId,
		position: [0,0,0],
		orientation: [0,0,0,0]
	});
}

function processUsers(users) {
	//_.forEach(users, processUser);
	var orientation;

	var u;

	if (playerId == 'p1') {
		u = users['p2'];
	} else {
		u = users['p1'];
	}

	orientation = u.orientation;

	updateHeadObj([0,0,0], orientation);
}

function processUser(user) {
	// id, orientation, position

	//update objects
}

function setupLights() {
	var light = new THREE.DirectionalLight(0xffffff, 1.5);
	light.position.set(1, 1, 1);
	//scene.add(light);

	light = new THREE.DirectionalLight(0xffffff, 0.75);
	light.position.set(-1, -0.5, -1);
	light.rotation.set(Math.random(), Math.random(), Math.random());
	scene.add(light);

	//light = new THREE.AmbientLight(0x666666);
	//scene.add(light);

	var light = new THREE.HemisphereLight( 0xfff0f0, 0x606066 );
  light.position.set( 1, 1, 1 );
  scene.add( light );	
}

function setupVideo() {
	video = document.createElement('video');
	video.src = videoData.src;
	if (config.autoplay) video.play();

	texture = new THREE.Texture(video);
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.format = THREE.RGBFormat;
	texture.generateMipmaps = false;
}

function setupUsers() {
	// setup self
	headObj = createUserMesh();

	var hs = 8;
	headObj.scale.set(hs,hs,hs);

	headObj.position.set(0, 10, -10);

	scene.add(headObj);

	var user = {
		position: [0,6,0],
		hmdPosition: [0,0,0],
		hmdOrientation: [0,0,0,0],
		chairNum: 3,
		headObj: headObj
	};

	me = user;

	// tmp, don't need own

	users.push(user);
}

function updateHeadObj(position, orientation) {
	headObj.quaternion.fromArray(orientation);
}

function createUserMesh() {
	return duckie;
}

function loadDuckie() {
  var loader = new THREE.ObjectLoader();

	var callbackFinished = function(obj) {
		var container = new THREE.Object3D();

		var s = 0.01;
		obj.scale.set(s,s,s);
		obj.position.set(1,-1.3,0);
		//obj.rotation.set(0,0.6,0);

		container.scale.set(s,s,s);
		container.add(obj);

		//container.rotation.set(0,90*Math.PI/180,0);
		//container.position.set(0, -83, 0);

		duckie = container;

		//scene.add(container);
	};

	loader.load('models/duckie.obj', callbackFinished);

	/*var geo = new THREE.BoxGeometry(0.7, 0.35, 0.35);
	var mat = new THREE.MeshPhongMaterial({ color: 0x00f0ff });
	var mesh = new THREE.Mesh(geo, mat);*/

	//return mesh;	
}

function setupScene() {
	setupLights();

	//setupFloor();

	if (mode == 'cube')
		setupCubes();
	else
		setupScreen();

	//setupLoader();

	setupEnv(_env);
}

function setupEnv(env) {
	var gndColor = env.gndColor;

  var gnd = setupGround(gndColor);
  scene.add(gnd);

  //sky
  var geometry = new THREE.Sky();
  var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
  var mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );

  setupTrees(gnd);

 	setupChairs();
}

function setupGround(color) {
	var geometry = new THREE.PlaneGeometry( 5000, 5000, 15, 15 );
  geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
  var material = new THREE.MeshLambertMaterial( { color: color, shading: THREE.FlatShading } );

  for ( var i = 0; i < geometry.vertices.length; i ++ ) {

    var vertex = geometry.vertices[ i ];

    var distance = ( vertex.distanceTo( scene.position ) / 5 ) - 250;

    vertex.x += Math.random() * 100 - 50;
    vertex.y = Math.random() * Math.max( 0, distance );
    vertex.x += Math.random() * 100 - 50;
  }

  geometry.computeFaceNormals();

  var gnd = new THREE.Mesh( geometry, material );

	return gnd;
}

function setupTrees(gnd) {
  var geometry = new THREE.Trees( gnd );
  var material = new THREE.MeshBasicMaterial( { color: 0x407000, side: THREE.DoubleSide } );
  var mesh = new THREE.Mesh( geometry, material );

  scene.add( mesh );	
}

function setupChairs() {
  var loader = new THREE.ObjectLoader();

	var callbackFinished = function(obj) {
		var chairs = new THREE.Object3D();

		var chairWidth = 80;

		for (var i = 0; i < numChairs; i++) {
			var o = obj.clone();
			o.position.set(0, 0, chairWidth*i - 240);
			chairs.add(o);
		}

		var s = 0.05;
		chairs.scale.set(s*1.10,s,s);
		chairs.rotation.set(0,90*Math.PI/180,0);
		chairs.position.set(0, 0, -1);

		scene.add(chairs);
		
		//scene.add(container);
	};

	loader.load('models/chair.json', callbackFinished);
}

function getChairPos(n) {
	var pos = [0,10,-10];
	pos[0] = n*10 - 0.1;
	return pos;
}

function setupLoader() {
	var dae;
	var loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	loader.load( 'models/webvrcinemaforest.dae', function ( collada ) {

		dae = collada.scene;

		//dae.scale.x = dae.scale.y = dae.scale.z = 0.002;
		dae.updateMatrix();

		scene.add(dae);

	} );
}

function setupFloor() {
	var geometry = new THREE.PlaneGeometry(2000, 2000, 1, 1);
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

	var texture = THREE.ImageUtils.loadTexture('textures/checker.png');
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;

	texture.repeat = new THREE.Vector2(20, 20);

	var material = new THREE.MeshBasicMaterial( { color: 0xcccccc, map: texture } );

	var mesh = new THREE.Mesh(geometry, material);
	mesh.receiveShadow = true;

	scene.add(mesh);
}

function setupCubes() {	
	var geo = new THREE.BoxGeometry(30, 30, 30);

	console.log(texture);

	var s = 1.6;

	var blankMat = new THREE.MeshBasicMaterial({
		color: 0x000000, shading: THREE.FlatShading
	});

	var vidMat = new THREE.MeshBasicMaterial({
		map: texture
	});

	var cubeMat = new THREE.MeshFaceMaterial([
		vidMat, vidMat, blankMat, blankMat, vidMat, vidMat
		]);

	for (var i = 0; i < 200; i ++) {
		var object = new THREE.Mesh(geo, cubeMat);

		//object.material.ambient = object.material.color;

		object.position.x = Math.random() * 1000 - 500;
		object.position.y = Math.random() * 700 - 350;
		object.position.z = Math.random() * 800 - 400;

		//object.rotation.x = Math.random() * 2 * Math.PI;
		object.rotation.y = Math.random() * 2 * Math.PI;
		//object.rotation.z = Math.random() * 2 * Math.PI;

		object.scale.x = 16/9 * s;
		object.scale.y = 9/9 * s;
		object.scale.z = 16/9 * s;

		object.castShadow = true;
		object.receiveShadow = true;

		scene.add(object);

		objects.push(object);
	}
}

function setupScreen() {
	var s = 10;
	var geo = new THREE.PlaneGeometry(16*s, 9*s);

	var vidMat = new THREE.MeshBasicMaterial({
		map: texture
	});

	_screen = new THREE.Mesh(geo, vidMat);

	_screen.position.set(0,45, -170);

	scene.add(_screen);
}

function setupRendering() {
	renderer = new THREE.WebGLRenderer({
		antialias: false,
	});
	//renderer.setClearColor(env.skyColor, 1);
	renderer.shadowMapEnabled = true

	function VREffectLoaded(error) {
		if (error) {
			fullScreenButton.innerHTML = error;
			fullScreenButton.classList.add('error');
		}
	}

	renderer.setSize(window.innerWidth, window.innerHeight);
	vrEffect = new THREE.VREffect(renderer, VREffectLoaded);
	vrControls = new THREE.VRControls(camera);

	var container = document.createElement('div');
	document.body.insertBefore(container, document.body.firstChild);
	container.appendChild(renderer.domElement);
}

function setEnv(name) {
	var env = envs[name];
	_env = env;

	renderer.setClearColor(env.skyColor, 1);
}

function setupEvents() {
	window.addEventListener('resize', onWindowResize, false);
	document.addEventListener('keydown', keyPressed, false);

	fullScreenButton.addEventListener('click', function(){
		enterTheRift();
	}, true);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function keyPressed (e) {
	switch (e.keyCode) {
		case 82: // R
			vrControls._vrInput.zeroSensor();
			break;
		case 70: // F
			enterTheRift();
			break;
		case 32: // space
			video.paused ? video.play() : video.pause();
			break;
		case 79: // O
			moveScreen(-10);
			break;
		case 80: // P
			moveScreen(10);
			break;
		case 37: // left
			moveSeats(-1, 0);
			break;
		case 39: // right
			moveSeats(1, 0);
			break;
		case 38: // up
			moveSeats(0, -1);
			break;
		case 40: // down
			moveSeats(0, 1);
			break;
		default:
			break;
	}
}

function enterTheRift() {
	var W = 1920, H = 1080;

	renderer.setSize(W, H);
	vrEffect.setFullScreen(true);
}

function moveSeats(dSeat, dRow) {
	var newChairNum = me.chairNum + dSeat;

	newChairNum = Math.max(Math.min(newChairNum, numChairs), 0);

	me.chairNum = newChairNum;
}

function moveScreen(d) {
	var min = -240;
	var max = -30;
	var newZ = _screen.position.z + d;
	var newZ = Math.min(Math.max(min, newZ), max);
	_screen.position.setZ(newZ);

	if (config.social) {
		roomRef.update({
			screenDist: newZ
		});
	}
}


function animate(t) {
	requestAnimationFrame(animate);

	var dt = clock.getDelta();

	//cube mode
	for (var i = 0; i < objects.length; i++) {
		var obj = objects[i];
		//obj.rotation.x = Math.sin(1/(1000+i) * t);
		var r = (i / 20000) - 1/10000;
		obj.rotation.y += r;

		obj.position.y += 0.1;

		if (obj.position.y > 500) {
			obj.position.y -= 800;
		}
	}



	var _pos = [me.position[0], me.position[1], me.position[2]];
	var vrState = vrControls.getVRState();

	updateUsers(dt, vrState);


	var s = 4;
	if (vrState) {
		var vrPos = vrState.hmd.position;
		var vrOr = vrState.hmd.rotation;

		//console.log(vrState);

		me.hmdPosition = [vrPos[0], vrPos[1], vrPos[2]];
		me.hmdOrientation = [vrOr[0], vrOr[1], vrOr[2], vrOr[3]];

		_pos[0] = _pos[0] + vrPos[0]*s;
		_pos[1] = _pos[1] + vrPos[1]*s;
		_pos[2] = _pos[2] + vrPos[2]*s;
	}

	camera.position.fromArray(_pos);


	if (video.readyState === video.HAVE_ENOUGH_DATA) {
		if (texture)
			texture.needsUpdate = true;
	}

	vrControls.update();
	vrEffect.render(scene, camera);

	time = Date.now();
}

function updateUsers(dt, vrState) {
	var fps = 10;
	lastUpdate += dt;
	if (lastUpdate > 1/fps) {
		lastUpdate = 0;
	} else {
		return;
	}

	if (vrState) {
		console.log(me.hmdPosition);

		setUserPosition();
	}


	for (var i = 0; i < users.length; i++) {
		var u = users[i];

		//u.headObj.position.fromArray( u.hmdPosition );
		//u.headObj.quaternion.fromArray( u.hmdOrientation );
	}
}

function setUserPosition() {
	if (!config.social)
		return;

	myRef.update({
		position: me.hmdPosition,
		orientation: me.hmdOrientation
	});
}


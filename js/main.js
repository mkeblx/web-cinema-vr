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

var config = {
	autoplay: 0
};

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

var _env = envs['earth'];

var users = [
];


window.addEventListener('load', load);

function load() {
	init();

	animate();
}


function init() {
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0xffffff, 0, 6000);

	fullScreenButton = document.querySelector('.button');

	setupRendering();

	setupVideo();

	setEnv('earth');

	setupScene();

	setupUsers();

	setupEvents();
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
	var geo = new THREE.BoxGeometry(0.7, 0.35, 0.35);
	var mat = new THREE.MeshPhongMaterial({ color: 0x00f0ff });
	var headObj = new THREE.Mesh(geo, mat);

	headObj.scale.set(10,10,10);

	var user = {
		position: [0,10,-10],
		orientation: [0,0,0,0],
		chairNum: 3, // of 7
		headObj: headObj
	};

	scene.add(headObj);
	console.log(headObj); 

	users.push(user);
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

		var numChairs = 7;
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
	console.log(e.keyCode);

	if (e.keyCode == 'R'.charCodeAt(0)) {
		console.log(vrControls._vrInput);
		vrControls._vrInput.zeroSensor();
	} else if (e.keyCode == 'F'.charCodeAt(0)) {
		enterTheRift();
	} else if (e.keyCode == ' '.charCodeAt(0)) {
		video.paused ? video.play() : video.pause();
	} else if (e.keyCode == 'O'.charCodeAt(0)) {
		moveScreen(-10);
	} else if (e.keyCode == 'P'.charCodeAt(0)) {
		moveScreen(10);
	}
}

function enterTheRift() {
	var W = 1920, H = 1080;

	renderer.setSize(W, H);
	vrEffect.setFullScreen(true);
}

function moveScreen(d) {
	var min = -240;
	var max = -30;
	var newZ = _screen.position.z + d;
	var newZ = Math.min(Math.max(min, newZ), max);
	_screen.position.setZ(newZ);
}

function animate(t) {
	requestAnimationFrame(animate);

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

	var vrState = vrControls.getVRState();
	var s = 0.1;

	var pos = [0,6,0];
	if (vrState) {
		var vrPos = vrState.hmd.position;
		pos[0] = pos[0] + vrPos[0]*s;
		pos[1] = pos[1] + vrPos[1]*s;
		pos[2] = pos[2] + vrPos[2]*s;
	}

	camera.position.fromArray(pos);

	updateUsers(t, vrState);

	if (video.readyState === video.HAVE_ENOUGH_DATA) {
		if (texture)
			texture.needsUpdate = true;
	}

	vrControls.update();
	vrEffect.render(scene, camera);

	time = Date.now();
}

function updateUsers(t, vrState) {
	if (vrState && users.length) {
		users[0].orientation = vrState.hmd.rotation;
	}

	for (var i = 0; i < users.length; i++) {
		var u = users[i];

		u.headObj.position.fromArray( u.position );
		u.headObj.quaternion.fromArray( u.orientation );
	}
}


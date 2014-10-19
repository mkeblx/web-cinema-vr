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
	autoplay: false
};

var _screen;

// modes: cube, screen
var mode = 'screen';

var has = {
	WebVR: !!navigator.getVRDevices
};


window.addEventListener('load', load);

function load() {
	init();
	animate();
}


function init() {
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);

	scene = new THREE.Scene();
	//scene.fog = new THREE.Fog(0xffffff, 0, 1500);

	fullScreenButton = document.querySelector('.button');

	setupRendering();

	setupVideo();

	setupScene();

	setupEvents();
}

function setupLights() {
	var light = new THREE.DirectionalLight(0xffffff, 1.5);
	light.position.set(1, 1, 1);
	scene.add(light);

	light = new THREE.DirectionalLight(0xffffff, 0.75);
	light.position.set(-1, -0.5, -1);
	scene.add(light);

	light = new THREE.AmbientLight(0x666666);
	scene.add(light);
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

function setupScene() {
	setupLights();

	//setupFloor();

	if (mode == 'cube')
		setupCubes();
	else
		setupScreen();
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

	_screen.position.set(0,0, -80);

	scene.add(_screen);
}

function setupRendering() {
	renderer = new THREE.WebGLRenderer({
		antialias: false,
	});
	renderer.setClearColor(0x000000, 1);

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

function setupEvents() {
	//window.addEventListener('resize', onWindowResize, false);
	document.addEventListener('keydown', keyPressed, false);

	fullScreenButton.addEventListener('click', function(){
		vrEffect.setFullScreen(true);
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
		vrEffect.setFullScreen(true);
	} else if (e.keyCode == ' '.charCodeAt(0)) {
		video.paused ? video.play() : video.pause();
	} else if (e.keyCode == 'O'.charCodeAt(0)) {
		moveScreen(-10);
	} else if (e.keyCode == 'P'.charCodeAt(0)) {
		moveScreen(10);
	}
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

	var vrState = vrControls.getVRState();

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

	var s = 200;

	var pos = [0,0,0];
	if (vrState) {
		var vrPos = vrState.hmd.position;
		pos = vrPos;
		pos[0] *= s;
		pos[1] *= s;
		pos[2] *= s;
	}

	camera.position.fromArray(pos);

	if (video.readyState === video.HAVE_ENOUGH_DATA) {
		if (texture)
			texture.needsUpdate = true;
	}

	vrControls.update();
	vrEffect.render(scene, camera);

	time = Date.now();
}


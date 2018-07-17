/**
 * Copyright (C) 2012 Bruno P. Evangelista. All rights reserved.
 * 
 */
var MeshPackages = {
	kCompressed3 : {loaded:false, compressed:true, name:'c3.', filepath:'assets/c3.sponza-meshes'},	// Compressed Quantized + SphereMap normals
	//kCompressed2 : {loaded:false, compressed:true, name:'c2.', filepath:'assets/c2.sponza-meshes'},	// Compressed Quantized + Azimuthal normals
	//kCompressed1 : {loaded:false, compressed:true, name:'c1.', filepath:'assets/c1.sponza-meshes'},	// Compressed Quantized 16b attributes
	kUncompressed : {loaded:false, compressed:false, name:'uc.', filepath:'assets/uc.sponza-meshes'}	// Uncompressed
};

var MaterialPackages = {
	kCompressedDXT1 : {loaded:false, compressed:true, name:'c5.', filepath:'assets/c5.sponza-materials'},	// DXT1 compression
	kUncompressed : {loaded:false, compressed:false, name:'uc.', filepath:'assets/uc.sponza-materials'}	// Uncompressed
};

/**
 * @constructor
 * @extends efw.Application
 * @export
 */
var CustomApp = function()
{
	efw.Application.call(this);
	
	// 
	this.centerHud = null;
	this.fpsHud = null;
	this.topMenu = null;

	// Loader and resource manager
	this.loader = new efw.Loader();
	this.resourceManager = new efw.ResourceManager(this.graphicsDevice);

	this.camera = new efw.CameraPerspective();
	this.lights = [];
	this.shaderPrograms = [];
	this.selectedProgram = null;
	
	this._uberShaderVertexSource = null;
	this._uberShaderFragmentSource = null;
	this.shaderIndex = 0;
	this.customFresnel0 = null;
	
	// Global transformation used for all objects
	this.matWorld = null;
	this.matWorldIT = null;
	
	// Fade
	this._fadeItem = null;
	this._fadeDirection = 1;
	this._fadeAlpha = 1.0;
	this._fadeTimer = null;

	// General
	this._isFirstDraw = true;
	this.meshPackage = MeshPackages.kCompressed3;
	this.materialPackage = MaterialPackages.kCompressedDXT1;
	this.restoreQueue = [];
	
	this._useMipMapOverlay = false;
}
CustomApp.prototype = Object.create( efw.Application.prototype );
CustomApp.prototype.constructor = CustomApp;


CustomApp.prototype.setHuds = function(userCenterHud, userFpsHud, topMenu)
{
	this.centerHud = userCenterHud;
	this.fpsHud = userFpsHud;
	this.topMenu = topMenu;
}


// Fade In/Out
// ----------------------------------------------------------------------------------------------------
CustomApp.prototype.fadeUpdate = function()
{
	this._fadeAlpha += (this._fadeDirection>0)? 0.05 : -0.05;
	this._fadeItem.style.opacity = this._fadeAlpha;
	
	if (this._fadeDirection > 0 && this._fadeAlpha >= 1.0 ||
		this._fadeDirection < 0 && this._fadeAlpha <= 0.0)
	{
		clearInterval(this._fadeTimer);

		this._fadeAlpha = (this._fadeDirection > 0)? 1.0 : 0.0;
		this._fadeItem = null;
		this._fadeTimer = null;
	}
}
CustomApp.prototype.startFadeOut = function(item, startOpacity, fadeTime)
{
	if (this._fadeTimer)
		clearInterval(this._fadeTimer);

	item.style.opacity = startOpacity;

	this._fadeItem = item;
	this._fadeDirection = -1;
	this._fadeAlpha = startOpacity;
	this._fadeTimer = setInterval(this.fadeUpdate.bind(this), fadeTime/(20 * this._fadeAlpha));
}
CustomApp.prototype.startFadeIn = function(item, startOpacity, fadeTime)
{
	if (this._fadeTimer)
		clearInterval(this._fadeTimer);
		
	item.style.opacity = startOpacity;

	this._fadeItem = item;
	this._fadeDirection = 1;	
	this._fadeAlpha = startOpacity;
	this._fadeTimer = setInterval(this.fadeUpdate.bind(this), fadeTime/(20.0 - 20.0 * this._fadeAlpha));
}

// Handle UI messages
// ----------------------------------------------------------------------------------------------------
CustomApp.prototype.hideStartMessage = function() {
	this.startFadeOut(this.centerHud, 1.0, 1000);
	
	var self = this;
	setTimeout(function() { self.centerHud.innerHTML = ""; }, 1100);
}
CustomApp.prototype.showStartMessage = function() {
	this.centerHud.innerHTML = 'Drag to look around<br/>Use the mouse buttons and wheel to navigate';
	this.startFadeIn(this.centerHud, 0.0, 600);
	
	setTimeout(this.hideStartMessage.bind(this), 5000);
}
CustomApp.prototype.showOptionMenu = function() {
	this.topMenu.style.display = 'inherit';
	
	var currentMesh = document.getElementById('option-' + this.meshPackage.name + 'mesh');
	var currentMaterial = document.getElementById('option-' + this.materialPackage.name + 'material');
	currentMesh.checked = true;
	currentMaterial.checked = true;
	
	if (!this.graphicsDevice.extensions[efw.GraphicsDeviceExtensions.kCompressedTextures])
	{
		var htmlItem = document.getElementById('option-c5.material');
		htmlItem.disabled = true;
		htmlItem = document.getElementById('label-c5.material');
		htmlItem.style.textDecoration = 'line-through';
	}
}
CustomApp.prototype.updateLoadContentProgress = function() {
	var progress = this.loader.getProgress();
	this.centerHud.innerHTML = 'Loading Awesome WebGL Demo!<br/><br/> Loading ' + progress + '%';

	if (progress != 100)
		setTimeout(this.updateLoadContentProgress.bind(this), 100);
}


CustomApp.prototype.userLoadContent = function()
{
	// Change material package if necessary
	if (this.materialPackage.compressed && !this.graphicsDevice.extensions[efw.GraphicsDeviceExtensions.kCompressedTextures])
	{
		// Stop loading all compressed materials
		for (var key in MaterialPackages)
		{
			var material = MaterialPackages[key];
			if (material.compressed)
				material.loaded = true;
		}
		this.materialPackage = MaterialPackages.kUncompressed;
	}

	if (this.meshPackage.compressed)
		window.console.log("Using compressed meshes.");
	if (this.materialPackage.compressed)
		window.console.log("Using compressed textures.");

	// Load
	var package0 = this.loader.loadPackageAsync(this.meshPackage.filepath + '.evd', this.meshPackage.filepath + '.evb');
	var package1 = this.loader.loadPackageAsync(this.materialPackage.filepath + '.evd', this.materialPackage.filepath + '.evb');
	this.resourceManager.addPackage(package0);
	this.resourceManager.addPackage(package1);
	
	// Mark those files as loaded
	this.meshPackage.loaded = true;
	this.materialPackage.loaded = true;
	
	var self = this;
	this.loader.loadFileAsync('assets/_vs_programs.glsl', 'text', function(data) { self._uberShaderVertexSource = data; } );
	this.loader.loadFileAsync('assets/_fs_programs.glsl', 'text', function(data) { self._uberShaderFragmentSource = data; } );
	
	setTimeout( this.updateLoadContentProgress.bind(this), 200);
}
CustomApp.prototype.userLoadContentStep2 = function()
{
	// Load remaining mesh packages
	for (var key in MeshPackages)
	{
		var item = MeshPackages[key];
		if (!item.loaded)
		{
			var package0 = this.loader.loadPackageAsync(item.filepath + '.evd', item.filepath + '.evb');
			this.resourceManager.addPackage(package0);
			item.loaded = true;
			
			var label = document.getElementById('label-' + item.name + 'mesh');
			var option = document.getElementById('option-' + item.name + 'mesh');
			this.restoreQueue.push( {label:label, option:option, innerHTML:label.innerHTML} );
			label.innerHTML = 'Loading <img src="loading.gif" width="16" height="16" alt="loading-icon"/>';
			option.disabled = true;
		}
	}
	
	// Load remaining material packages
	for (var key in MaterialPackages)
	{
		var item = MaterialPackages[key];
		if (!item.loaded)
		{
			var package0 = this.loader.loadPackageAsync(item.filepath + '.evd', item.filepath + '.evb');
			this.resourceManager.addPackage(package0);
			item.loaded = true;				
			
			var label = document.getElementById('label-' + item.name + 'material');
			var option = document.getElementById('option-' + item.name + 'material');
			this.restoreQueue.push( {label:label, option:option, innerHTML:label.innerHTML} );
			label.innerHTML = 'Loading <img src="loading.gif" width="16" height="16" alt="loading-icon"/>';
			option.disabled = true;
		}
	}
	setTimeout(this.initializeAsyncPackages.bind(this), 2000);
}


CustomApp.prototype.initializeAsyncPackages = function()
{
	if (this.loader.hasPendingAsyncCalls())
	{
		setTimeout(this.initializeAsyncPackages.bind(this), 2000);
		return;
	}
	
	this.loader.clear();
	this.resourceManager.initializeAllQueuedPackages();
	
	//
	for (var i=0; i<this.restoreQueue.length; ++i)
	{
		this.restoreQueue[i].label.innerHTML = this.restoreQueue[i].innerHTML;
		this.restoreQueue[i].option.disabled = false; 
	}
	this.restoreQueue = null;
}


CustomApp.prototype.setDefaultRenderStates = function()
{
	this.graphicsDevice.setClearColor(122/255.0, 170/255.0, 255/255.0, 1.0);
	this.graphicsDevice.setClearDepth(1.0);
	this.graphicsDevice.enableState(efw.GraphicsDeviceState.kDepthTest);
	this.graphicsDevice.enableState(efw.GraphicsDeviceState.kCullFace);
	
	this.graphicsDevice.gl.cullFace(this.graphicsDevice.gl.FRONT);
	this.graphicsDevice.gl.activeTexture(this.graphicsDevice.gl.TEXTURE0);
}

/*
CustomApp.prototype.startRandomizeLight = function()
{
	//var nextTime = 100 + Math.random() * 200;
	var nextTime = 1.0/15.0 * 1000;
	
	var intensityDelta = (Math.random() - 0.5) * 0.005;
	var newLight0Color = this.lights[0].color;
	newLight0Color[0] = (newLight0Color[0] + intensityDelta);
	newLight0Color[1] = (newLight0Color[1] + intensityDelta);
	newLight0Color[2] = (newLight0Color[2] + intensityDelta);
	
	var cancel = (newLight0Color[0] < 0.0 || newLight0Color[0] > 1.0);
	cancel |= (newLight0Color[1] < 0.0 || newLight0Color[1] > 1.0);
	cancel |= (newLight0Color[2] < 0.0 || newLight0Color[2] > 1.0);
	if (!cancel)
	{
		this.lights[0].color = newLight0Color;
		this.graphicsDevice.setActiveShaderUniform("gLight0Color", this.lights[0].color, false);
	}
	
	setTimeout(this.startRandomizeLight.bind(this), nextTime);
}
*/

CustomApp.prototype.userOnresize = function()
{
	this.camera.initPerspective(Math.PI/3.0, this.viewportWidth/this.viewportHeight, 1.0, 5000.0);
}


CustomApp.prototype.setShader = function(vertexIndex, fragmentIndex)
{
	if (vertexIndex == null)
		vertexIndex = this.shaderIndex % 4;
	if (fragmentIndex == null)
		fragmentIndex = Math.floor(this.shaderIndex / 4);
	
	this.shaderIndex = fragmentIndex * 4 + vertexIndex;
	this.graphicsDevice.setShaderProgram(this.shaderPrograms[ this.shaderIndex ]);

	// One time updates
	this.matWorld = mat4.mul( mat4.translate(vec3.create(100.0, 0, 0)), mat4.scale(vec3.create(1.5, 1.0, 1.5)) );
	this.matWorldIT = mat4.scale( vec3.create(1/1.5, 1.0, 1/1.5) );
	
	this.graphicsDevice.setActiveShaderUniform("gMatW", new Float32Array(this.matWorld), false);
	this.graphicsDevice.setActiveShaderUniform("gMatWIT", new Float32Array( mat4.upper3x3(this.matWorldIT) ), false);

	this.camera.update();
	var matWVP = mat4.mul(this.matWorld, this.camera.viewProjectionMatrix);
	this.graphicsDevice.setActiveShaderUniform("gMatWVP", matWVP, false);
	this.graphicsDevice.setActiveShaderUniform("gWorldEyePosition", this.camera.position, false);


	// Physically based ones
	if (this.shaderIndex >= 4)
	{

		this.graphicsDevice.setActiveShaderUniform("gLight0Color", this.lights[0].color, false);
		this.graphicsDevice.setActiveShaderUniform("gLight1Color", this.lights[1].color, false);
		this.graphicsDevice.setActiveShaderUniform("gLight0WorldPosition", this.lights[0].position, false);
		this.graphicsDevice.setActiveShaderUniform("gLight1WorldPosition", this.lights[1].position, false);

		this.customFresnel0 = new Float32Array([0.1, 0.1, 0.1465]);
		this.graphicsDevice.setActiveShaderUniform("gMaterialFresnel0", this.customFresnel0, false);
		this.graphicsDevice.setActiveShaderUniform("gMaterialRoughness", 18);
	}
	else
	{
		this.graphicsDevice.setActiveShaderUniform("gLight0Color", this.lights[2].color, false);
		this.graphicsDevice.setActiveShaderUniform("gLight0WorldPosition", this.lights[2].position, false);
		
		this.graphicsDevice.setActiveShaderUniform("gMaterialRoughness", 48);
	}

}


CustomApp.prototype.userInitializeContent = function()
{
	if (this.loader.hasPendingAsyncCalls())
	{
		setTimeout(this.userInitializeContent.bind(this), 2000);
		return;
	}
	
	this.setDefaultRenderStates();
	
	this.loader.clear();
	this.resourceManager.initializeAllQueuedPackages();
	
	// Create camera
	this.camera.initPerspective(Math.PI/3.0, this.viewportWidth/this.viewportHeight, 1.0, 5000.0);
	this.camera.initLookAt( [-500.0, 700.0, 0.0], vec3.normalize([-1.0, 0.0, 0.0]), vec3.normalize([0.0, 1.0, 0.0]) );

	// Create lights
	this.lights[0] = new efw.PointLight();
	this.lights[1] = new efw.PointLight();
	this.lights[2] = new efw.PointLight();
	
	this.lights[0].init( [700.0, 1400.0, 0.0], [0.4, 0.8, 0.5] );
	this.lights[1].init( [-700.0, 1400.0, 200.0], [0.4, 0.4, 0.9] );
	this.lights[2].init( [0.0, 1400.0, 0.0], [1.0, 1.0, 1.0] );

	// Compile all vertex shaders
	var vertexShaders = [];
	vertexShaders[vertexShaders.length] = this.graphicsDevice.compileVS(this._uberShaderVertexSource, '-DVS_SIMPLE');
	vertexShaders[vertexShaders.length] = this.graphicsDevice.compileVS(this._uberShaderVertexSource, '-DNORMAL_ENCODING_U16 -DVS_COMPRESSED');
	vertexShaders[vertexShaders.length] = this.graphicsDevice.compileVS(this._uberShaderVertexSource, '-DNORMAL_ENCODING_AZIMUTHAL -DVS_COMPRESSED');
	vertexShaders[vertexShaders.length] = this.graphicsDevice.compileVS(this._uberShaderVertexSource, '-DNORMAL_ENCODING_SPHEREMAP -DVS_COMPRESSED');

	// Compile all fragment shaders
	var fragmentShaders = [];
	fragmentShaders[fragmentShaders.length] = this.graphicsDevice.compilePS(this._uberShaderFragmentSource, '-DFS_SIMPLE');
	fragmentShaders[fragmentShaders.length] = this.graphicsDevice.compilePS(this._uberShaderFragmentSource, '-DFS_PHYSICALLY_2L');
	
	// Link all programs
	this.shaderPrograms.push( this.graphicsDevice.createShaderProgram(vertexShaders[0], fragmentShaders[0]) );
	this.shaderPrograms.push( this.graphicsDevice.createShaderProgram(vertexShaders[1], fragmentShaders[0]) );
	this.shaderPrograms.push( this.graphicsDevice.createShaderProgram(vertexShaders[2], fragmentShaders[0]) );
	this.shaderPrograms.push( this.graphicsDevice.createShaderProgram(vertexShaders[3], fragmentShaders[0]) );
	this.shaderPrograms.push( this.graphicsDevice.createShaderProgram(vertexShaders[0], fragmentShaders[1]) );
	this.shaderPrograms.push( this.graphicsDevice.createShaderProgram(vertexShaders[1], fragmentShaders[1]) );
	this.shaderPrograms.push( this.graphicsDevice.createShaderProgram(vertexShaders[2], fragmentShaders[1]) );
	this.shaderPrograms.push( this.graphicsDevice.createShaderProgram(vertexShaders[3], fragmentShaders[1]) );

	this.setShader(3, 1);

	// Start
	this.run();
}


CustomApp.prototype.userUpdate = function(elapsedTimeMillis)
{
	// Update camera
	if (this.inputs.mouse.isPressed[0])
	{
		var deltaX = this.inputs.mouse.positionDelta[0] * elapsedTimeMillis * 0.05;
		var deltaY = -this.inputs.mouse.positionDelta[1] * elapsedTimeMillis * 0.07;
		this.camera.rotateLookAt(deltaX, deltaY);
	}

	if (this.inputs.mouse.wheelDelta != 0)
	{
		var walkTime = -this.inputs.mouse.wheelDelta * elapsedTimeMillis * 7;
		this.camera.walk(walkTime);
	}
	
	// Update camera
	this.camera.update(elapsedTimeMillis);
	if (this.camera.hasChanged)
	{
		var matWVP = mat4.mul(this.matWorld, this.camera.viewProjectionMatrix);

		//this.graphicsDevice.setActiveShaderUniform("gMatWVP", new Float32Array(matWVP), false);
		//this.graphicsDevice.setActiveShaderUniform("gWorldEyePosition", new Float32Array(this.camera.position), false);
		this.graphicsDevice.setActiveShaderUniform("gMatWVP", matWVP, false);
		this.graphicsDevice.setActiveShaderUniform("gWorldEyePosition", this.camera.position, false);
	}
	
	if (this.shaderIndex >= 4)
	{
		// Rotate lights around
		var angle = elapsedTimeMillis * 0.5;
		var cosAngle = Math.cos(angle);
		var sinAngle = Math.sin(angle);
		this.lights[0].position[2] = this.lights[0].position[2] * cosAngle - this.lights[0].position[0] * sinAngle;
		this.lights[0].position[0] = this.lights[0].position[0] * cosAngle + this.lights[0].position[2] * sinAngle;
		this.lights[1].position[2] = this.lights[1].position[2] * cosAngle - this.lights[1].position[0] * sinAngle;
		this.lights[1].position[0] = this.lights[1].position[0] * cosAngle + this.lights[1].position[2] * sinAngle;
	
		// Update light position	
		this.graphicsDevice.setActiveShaderUniform("gLight0WorldPosition", this.lights[0].position, false);
		this.graphicsDevice.setActiveShaderUniform("gLight1WorldPosition", this.lights[1].position, false);
	}
	
	//this.startRandomizeLight();
}


CustomApp.prototype.userDraw = function(elapsedTimeMillis)
{
	this.fpsHud.innerHTML = 'Update Fps/Ms: ' + this.fpsStats.updateFps + '/' + this.fpsStats.updateTimeMs + 
	'<br/>Draw Fps/Ms: ' + this.fpsStats.drawFps + '/' + this.fpsStats.drawTimeMs;
	
	this.graphicsDevice.setViewport(0, 0, this.viewportWidth, this.viewportHeight);
	this.graphicsDevice.clear(true, true, false);
	
	for (var key in this.resourceManager.resourceTable.meshes)
	{
		// Skip meshes that are not from the current used package
		if (key.indexOf(this.meshPackage.name) != 0)
			continue;
			
		var mesh = this.resourceManager.resourceTable.meshes[key];
		// Grab materials from the current selected material package
		var material = this.resourceManager.resourceTable.materials[this.materialPackage.name + mesh.materialGuid];
		//console.log(mesh);
		//console.log(material);
		
		if (material)
		{
        	this.graphicsDevice.setTexture(0, material.albedoTexture);
		}

		if (typeof mesh.optPositionScale != 'undefined' && mesh.optPositionScale != null)
		{
			this.graphicsDevice.setActiveShaderUniform("gPositionScale", mesh.optPositionScale, false);
			this.graphicsDevice.setActiveShaderUniform("gPositionBias", mesh.optPositionBias, false);
		}

		if (typeof mesh.optUv0ScaleBias != 'undefined' && mesh.optUv0ScaleBias != null)
		{
			this.graphicsDevice.setActiveShaderUniform("gUvScaleBias", mesh.optUv0ScaleBias, false);
		}
					
		this.graphicsDevice.setIndexBuffer(mesh.indexBuffer);
		this.graphicsDevice.setVertexBuffer(mesh.vertexBuffer);
		this.graphicsDevice.setVertexFormat(mesh.vertexFormat);
		this.graphicsDevice.drawIndexed(mesh.indexCount);
	}
	
	if (this._isFirstDraw)
	{
		// Load all other available packages
		this.userLoadContentStep2();
		
		this._isFirstDraw = false;
		this.showStartMessage();
		this.showOptionMenu();
	}
}

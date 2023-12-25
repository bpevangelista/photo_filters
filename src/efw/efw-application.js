/**
 * Copyright (C) 2012 Bruno P. Evangelista. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * 
 * THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 * LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @constructor 
 */
efw.Mouse = function()
{
	this.position = [0, 0];
	this.positionDelta = [0, 0];
	this.isPressed = [false, false, false];
	this.wheelDelta = 0;
}

/**
 * @constructor 
 */
efw.FpsStats = function()
{
	this.updateFps = 0;
	this.updateTimeMs = 0.0;
	
	this.drawFps = 0;
	this.drawTimeMs = 0.0;
}

/**
 * @constructor 
 */
efw.Application = function() {

	// User configurations
	// ----------------------------------------------------------------------------------------------------
	this.configs = {};
	this.configs.fpsCounterEnabled = false;
	this.configs.stopRunningOnError = false;
	this.configs.webGLDebugEnabled = false;
	this.configs.maxUpdateIterations = 3;
	this.configs.desiredElapsedTime = 32;
	
	// User attributes
	// ----------------------------------------------------------------------------------------------------
	this.inputs = {};
	this.inputs.mouse = new efw.Mouse();
	this.fpsStats = new efw.FpsStats();
	this._fpsStatsWrite = new efw.FpsStats();
	
	// Viewport size
	this.viewportWidth = 4;
	this.viewportHeight = 4;
	
	// Graphics
	this.graphicsDevice = new efw.GraphicsDevice();
	
	// Input
	this._mouseRead = new efw.Mouse();
	this._mouseReadLast = new efw.Mouse();
	this._mouseWrite = new efw.Mouse();
	
	// Timer
	this._animationFrameRequest = null;
	this._previousTime = 0;
	this._elapsedTime = 0;
	
	// General
	this._fpsStats = new efw.FpsStats();
	this.isInitialized = false;
}


// User defined methods
// ----------------------------------------------------------------------------------------------------
/** @type {function()?} */
efw.Application.prototype.userLoadContent = null;
/** @type {function()?} */
efw.Application.prototype.userInitializeContent = null;
/** @type {function(number)?} */
efw.Application.prototype.userUpdate = null;
/** @type {function(number)?} */
efw.Application.prototype.userDraw = null;
	
// Optional callbacks
// ----------------------------------------------------------------------------------------------------
/** @type {function()?} */
efw.Application.prototype.userOnresize = null;


efw.Application.prototype.initializeInput = function()
{
	var self = this;
	
	// Add event listeners
	this.graphicsDevice.canvas.addEventListener('mousedown', function(e) { self._mouseWrite.isPressed[e.button] = true; self.onMouseMove(e); self.mouseUpdate(); self.mouseUpdate(); /*window.console.log(e)*/ }, false);
	this.graphicsDevice.canvas.addEventListener('mouseup', function(e) { self._mouseWrite.isPressed[e.button] = false; /*window.console.log(e)*/ }, false);
	this.graphicsDevice.canvas.addEventListener('mouseout', this.onMouseOut.bind(this), false);
	this.graphicsDevice.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false);
	this.graphicsDevice.canvas.addEventListener('mousewheel', this.onMouseWheel.bind(this), false);
	this.graphicsDevice.canvas.addEventListener('DOMMouseScroll', this.onMouseWheelFirefox.bind(this), false);
}


efw.Application.prototype.mainLoop = function()
{
	var startTime = new Date().getTime();
	
	// Stop graphics device if there's any pending errors
	if (!this.configs.stopRunningOnError || !this.graphicsDevice.hasError())
		this._animationFrameRequest = window.requestAnimFrame(this.mainLoop.bind(this));
		
	this._elapsedTime += startTime - this._previousTime;
	this._previousTime = startTime;
	//window.console.log(this._elapsedTime);
	
	// Calculate required loop count
	var requiredUpdateCount = Math.floor(this._elapsedTime / this.configs.desiredElapsedTime);
	var loopCount = Math.min( requiredUpdateCount, this.configs.maxUpdateIterations);
	if (requiredUpdateCount > 0)
		this._elapsedTime = 0;

	// Input handling
	this.updateInput();

	// Update
	for (var i=0; i < loopCount; i++)
    {
		this.userUpdate(this.configs.desiredElapsedTime*0.001);
		this._fpsStatsWrite.updateFps++;
    }
	this._fpsStatsWrite.updateTimeMs += new Date().getTime() - startTime;
       
    // Draw
    var drawStartTime = new Date().getTime();
    //if (requiredUpdateCount >= 1 && requiredUpdateCount <= 2)
    if (requiredUpdateCount >= 1)
    {
		this.userDraw(this.configs.desiredElapsedTime*0.001);
		this._fpsStatsWrite.drawFps++;
	}
	this._fpsStatsWrite.drawTimeMs += new Date().getTime() - drawStartTime;
}


// Built-in fps counter
// ------------------------------------------------------------------------------------------
efw.Application.prototype.updateFps = function()
{
	setTimeout(this.updateFps.bind(this), 1000);
	if (this.configs.fpsCounterEnabled)
	{
		var updateTimeMs = (this._fpsStatsWrite.updateFps > 0)?
			(this._fpsStatsWrite.updateTimeMs/this._fpsStatsWrite.updateFps).toFixed(3) : this._fpsStatsWrite.updateTimeMs; 
		
		var drawTimeMs = (this._fpsStatsWrite.drawFps > 0)?
			(this._fpsStatsWrite.drawTimeMs/this._fpsStatsWrite.drawFps).toFixed(3) : this._fpsStatsWrite.drawTimeMs;
		
		this.fpsStats = { 'updateFps': this._fpsStatsWrite.updateFps, 'updateTimeMs': updateTimeMs,
			'drawFps': this._fpsStatsWrite.drawFps, 'drawTimeMs': drawTimeMs };
	
		this._fpsStatsWrite.updateFps = 0;
		this._fpsStatsWrite.drawFps = 0;
		this._fpsStatsWrite.updateTimeMs = 0;
		this._fpsStatsWrite.drawTimeMs = 0;
	}
}


// Input event handling
// ------------------------------------------------------------------------------------------
efw.Application.prototype.updateInput = function() {
	this.mouseUpdate();
}
efw.Application.prototype._mouseDeepCopy = function(dest, src) {
	dest.position = src.position;
	dest.positionDelta = src.positionDelta;
	dest.isPressed = src.isPressed;
	dest.wheelDelta = src.wheelDelta;
}
efw.Application.prototype.mouseUpdate = function() {
	this._mouseDeepCopy(this._mouseReadLast, this._mouseRead);
	this._mouseDeepCopy(this._mouseRead, this._mouseWrite);

	// Clear write wheel delta
	this._mouseWrite.positionDelta = [0, 0];
	this._mouseWrite.wheelDelta = 0;
	
	// Copy out (don't allow the user to change our internal variable)
	this._mouseDeepCopy(this.inputs.mouse, this._mouseRead);

	// Calculate current position delta
	this.inputs.mouse.positionDelta = [ this._mouseRead.position[0] - this._mouseReadLast.position[0],
		this._mouseRead.position[1] - this._mouseReadLast.position[1] ];
}
efw.Application.prototype.onMouseOut = function(e) {
	this._mouseWrite.isPressed = [false, false, false];
}
efw.Application.prototype.onMouseMove = function(e) {
	this._mouseWrite.position = [e.clientX, e.clientY];
}
efw.Application.prototype.onMouseWheel = function(e) {
	this._mouseWrite.wheelDelta = e.wheelDelta;
}
efw.Application.prototype.onMouseWheelFirefox = function(e) {
	this._mouseWrite.wheelDelta = e.detail*-40;
}

// Other event handlers
// ------------------------------------------------------------------------------------------
efw.Application.prototype.handleCanvasResize = function()
{
	// Round window size to 32 pixels
	var desiredWidth = (window.innerWidth+31) & ~31;
	var desiredHeight = (window.innerHeight+31) & ~31;
	
	this.viewportWidth = desiredWidth;
	this.viewportHeight = desiredHeight;
	this.graphicsDevice.canvas.width = desiredWidth;
	this.graphicsDevice.canvas.height = desiredHeight;
	//window.console.log("Canvas [" + canvas.width + "px, " + canvas.height + "px]");
	
	if (this.userOnresize != null)
		this.userOnresize();
}


// Start application
// ------------------------------------------------------------------------------------------
efw.Application.prototype.init = function()
{
	if (this.userLoadContent == null
		|| this.userInitializeContent == null
		|| this.userUpdate == null
		|| this.userDraw == null )
	{
		window.console.log('Error! You must implement the following methods:');
		window.console.log('efw.Application.userLoadContent\n');
		window.console.log('efw.Application.userInitializeContent\n');
		window.console.log('efw.Application.userUpdate\n');
		window.console.log('efw.Application.userDraw\n');
		return false;
	}

	if (this.graphicsDevice.canvas == null)
		return false;
	
	// Enable graphics device debugging	
	if (this.configs.webGLDebugEnabled)
		this.graphicsDevice.setDebugEnable(true);

	// Force handle canvas resize
	this.handleCanvasResize();

	// Load content, initialize input and wait for user content to be loaded before initialing it	
	this.userLoadContent();
	this.userInitializeContent();
	this.initializeInput();
	
	this.isInitialized = true;
	return true;
}


// Run application
// ------------------------------------------------------------------------------------------
efw.Application.prototype.run = function()
{
	// Start update fps
	setTimeout(this.updateFps.bind(this), 1000);
	
	// Start main loop
	this._previousTime = new Date().getTime();
	this._animationFrameRequest = window.requestAnimFrame(this.mainLoop.bind(this));
}

//
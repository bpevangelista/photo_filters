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

// Browser compatibility layer
window.requestAnimFrame = ( function() {
	return window.requestAnimationFrame 
		|| window.webkitRequestAnimationFrame
		|| window.mozRequestAnimationFrame
		|| window.oRequestAnimationFrame
		|| window.msRequestAnimationFrame
		|| function(callback) { window.setTimeout(callback, 1000.0/60.0); }
})();
window.cancelRequestAnimFrame = ( function() {
	return window.cancelAnimationFrame
    	|| window.webkitCancelRequestAnimationFrame
		|| window.mozCancelRequestAnimationFrame
		|| window.oCancelRequestAnimationFrame
		|| window.msCancelRequestAnimationFrame
        || clearTimeout
} )();


// Evangelista framework namespace
var efw = efw || {};

efw.isBrowserSupported = function()
{
	return (
		(typeof Object.create != 'undefined') &&
		
		// Typed arrays 
		(typeof Uint8Array != 'undefined') &&
		(typeof Float32Array != 'undefined') &&
		
		// WebGL
		(typeof window.WebGLRenderingContext != 'undefined') && 
		window.WebGLRenderingContext != null
	);
}


// Stop errors on IE while parsing the javascript
if (!efw.isBrowserSupported())
{
	window.Int8Array = Array;
	window.Uint8Array = Array;
	window.Uint8ClampedArray = Array;
	window.Int16Array = Array;
	window.Uint16Array = Array;
	window.Int32Array = Array;
	window.Uint32Array = Array; 
	window.Float32Array = Array;

	Object.create = (Object.create || function(val) { return {}; });
}
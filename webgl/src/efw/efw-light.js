
/**
 * @constructor 
 */
efw.PointLight = function()
{
	this.position = null;
	this.color = null;
}

efw.PointLight.prototype.init = function(positionArray, colorArray)
{
	this.position = new Float32Array(positionArray);
	this.color = new Float32Array(colorArray);
}

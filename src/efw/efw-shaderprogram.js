efw.ShaderHelper = efw.ShaderHelper || {};


/**
 * @constructor 
 */
efw.ShaderProgram = function()
{
	this.program = null;
	this.attribs = null;
	this.uniforms = null;
}


/**
 * @constructor 
 */
efw.ShaderAttribEntry = function()
{
	this.location = 0;
	this.type = 0;
}


efw.ShaderAttribEntry.prototype.init = function(location, type)
{
	this.location = location;
	this.type = type;
}


/**
 * @constructor 
 */
efw.ShaderUniformEntry = function()
{
	this.location = null;
	this.type = 0;
}


efw.ShaderUniformEntry.prototype.init = function(location, type)
{
	this.location = location;
	this.type = type;
}


efw.ShaderProgram.prototype.init = function(program, uniforms, attribs)
{
	this.program = program;
	this.attribs = attribs;
	this.uniforms = uniforms;
}

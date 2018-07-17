/** @export */
efw.GraphicsDeviceExtensions = {
	kCompressedTextures:0
};


efw.GraphicsDeviceState = {
	kBlend			:1,
	kCullFace		:2,
	kDepthTest		:3
};


/**
 * @constructor 
 */
efw.GraphicsDevice = function()
{
	if (typeof document == 'undefined' || document == null)
		return null;
	
	// 
	// --------------------------------------------------------------------------------------------------------------
	this.canvas = document.createElement('canvas');
	this.gl = null;
	this.glRelease = null; // OpenGL release
	this.glExtensions = [];
	
	this.activeShaderProgram = null;

	// Device caps
	// --------------------------------------------------------------------------------------------------------------
	this.extensions = {};
	for (var key in efw.GraphicsDeviceExtensions) {
		this.extensions[key] = false;
	}
		
	// 
	// --------------------------------------------------------------------------------------------------------------
	try {
		this.gl = this.canvas.getContext("webgl")
			|| this.canvas.getContext("experimental-webgl");
		this.glRelease = this.gl;
	} 
	catch (e) {
		window.console.log("*** Failed to create GraphicsDevice");
		return null;
	}
	
	if (this.gl) {
		// Grab available extensions
		this.glExtensions.push( 
			this.gl.getExtension("WEBGL_compressed_texture_s3tc") ||
			this.gl.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc") || 
			this.gl.getExtension("MOZ_WEBGL_compressed_texture_s3tc") );
		//window.console.log(glExtensions);
		
		if (this.gl.compressedTexImage2D != null)
		{
			this.gl.COMPRESSED_RGBA_S3TC_DXT1_EXT = this.glExtensions[0].COMPRESSED_RGBA_S3TC_DXT1_EXT;
			this.gl.COMPRESSED_RGBA_S3TC_DXT3_EXT = this.glExtensions[0].COMPRESSED_RGBA_S3TC_DXT3_EXT;
			this.gl.COMPRESSED_RGBA_S3TC_DXT5_EXT = this.glExtensions[0].COMPRESSED_RGBA_S3TC_DXT5_EXT;
			this.gl.COMPRESSED_RGB_S3TC_DXT1_EXT = this.glExtensions[0].COMPRESSED_RGB_S3TC_DXT1_EXT;
		}

		// Features		
		this.extensions[efw.GraphicsDeviceExtensions.kCompressedTextures] = 
			(this.gl.compressedTexImage2D != null);
	}


	this.generateTextureMipmaps = function(textureBuffer)
	{
		this.gl.bindTexture(this.gl.TEXTURE_2D, textureBuffer);
		this.gl.generateMipmap(this.gl.TEXTURE_2D);
	}
	
	
	this.clear = function(clearColor, clearDepth, clearStencil)
	{
		var clearFlags = 0;
		clearFlags |= ((clearColor)? this.gl.COLOR_BUFFER_BIT : 0);
		clearFlags |= ((clearDepth)? this.gl.DEPTH_BUFFER_BIT : 0);
		clearFlags |= ((clearStencil)? this.gl.STENCIL_BUFFER_BIT : 0);
		
		this.gl.clear( clearFlags );
	}
	
	
	this.compileVS = function(shaderSource, optDefines)
	{
		return this._compileShaderWithDefines(shaderSource, this.gl.VERTEX_SHADER, optDefines);
	}
	
	
	this.compilePS = function(shaderSource, optDefines)
	{
		return this._compileShaderWithDefines(shaderSource, this.gl.FRAGMENT_SHADER, optDefines);
	}
	

	this.createBuffer = function()
	{
		return this.gl.createBuffer();
	}
	
	
	this.createShaderProgram = function(vertexShader, fragmentShader)
	{
		var program = this.gl.createProgram();
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);
		
		if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS) == false)
		{
			window.console.error("Error linking shader programs: " + vertexShader + " and " + fragmentShader);
	
			this.gl.deleteProgram(program);
			program = null;
		}
		
		if (program != null)
		{
			var result = new efw.ShaderProgram();
			result.init(program, 
				this._getShaderProgramUniformTable(program), 
				this._getShaderProgramAttribTable(program));
	
			return result;
		}
		
		return program;
	}


	this.createTexture = function()
	{
		return this.gl.createTexture();
	}
	
	
	this.drawIndexed = function(indexCount)
	{
		this.gl.drawElements(this.gl.TRIANGLES, indexCount, this.gl.UNSIGNED_SHORT, 0);
	}
	
	
	
	this.hasError = function()
	{
		return (this.gl.getError() != this.gl.NO_ERROR);
	}
	
	
	this.setActiveShaderUniform = function(uniformName, data, transposeMatrix)
	{
		this.setShaderUniform(this.activeShaderProgram, uniformName, data, transposeMatrix);
	}


	this.setClearColor = function(red, green, blue, alpha)
	{
		this.gl.clearColor(red, green, blue, alpha);
	}
	
	
	this.setClearDepth = function(depth)
	{
		this.gl.clearDepth(depth);
	}
	
	
	this.setClearStencil = function(stencil)
	{
		this.gl.clearStencil(stencil);	
	}
	
	
	this.setDebugEnable = function(enabled)
	{
		this.gl = this.glRelease;
		
		var debugInstance = null;
		if (typeof WebGLDebugUtils != 'undefined')
			debugInstance = WebGLDebugUtils;
		
		if (enabled && debugInstance != null)
		{
			window.console.log("*** Graphics device debug is enabled");
			this.gl = WebGLDebugUtils.makeDebugContext(this.gl);
		}
	}


	this.setIndexBuffer = function(indexBuffer)
	{
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	}


	this.setShaderProgram = function(shaderProgram)
	{
		for (var i=0; i<16; i++)
			this.gl.disableVertexAttribArray(i);

		this.gl.useProgram(shaderProgram.program);
		this.activeShaderProgram = shaderProgram;
		
		for (var key in this.activeShaderProgram.attribs)
		{
			this.gl.enableVertexAttribArray( this.activeShaderProgram.attribs[key].location );
		}		
	}
	
	
	this.setShaderUniform = function(shaderProgram, uniformName, data, transposeMatrix)
	{
		//transposeMatrix = transposeMatrix || false;
		var uniform = shaderProgram.uniforms[uniformName];
		
		switch (uniform.type)
		{
			//case this.gl.FLOAT:
			case 0x1406:
				this.gl.uniform1f(uniform.location, data);
				break;
				
			//case this.gl.FLOAT_VEC2:
			case 0x8B50:
				this.gl.uniform2fv(uniform.location, data);
				break; 
			
			//case this.gl.FLOAT_VEC3:
			case 0x8B51:
				this.gl.uniform3fv(uniform.location, data);
				break;
				
			//case this.gl.FLOAT_VEC4:
			case 0x8B52:
				this.gl.uniform4fv(uniform.location, data);
				break;
				
			//case this.gl.INT_VEC2:
			case 0x8B53:
				this.gl.uniform2iv(uniform.location, data);
				break;
				
			//case this.gl.INT_VEC3:
			case 0x8B54:
				this.gl.uniform3iv(uniform.location, data);
				break;
				
			//case this.gl.INT_VEC4:
			case 0x8B55:
				this.gl.uniform4iv(uniform.location, data);
				break;

			//case this.gl.INT:
			//case this.gl.SAMPLER_2D:
			//case this.gl.SAMPLER_CUBE:
			case 0x1404:
			case 0x8B5E:
			case 0x8B60:
				this.gl.uniform1i(uniform.location, data);
				break;
				
			/*
			case this.gl.BOOL:
				break;
				
			case this.gl.BOOL_VEC2:
				break;
				
			case this.gl.BOOL_VEC3:
				break;
				
			case this.gl.BOOL_VEC4:
				break;
			*/
			
			//case this.gl.FLOAT_MAT2:
			case 0x8B5A:
				this.gl.uniformMatrix2fv(uniform.location, transposeMatrix, data);
				break;
				
			//case this.gl.FLOAT_MAT3:
			case 0x8B5B:
				this.gl.uniformMatrix3fv(uniform.location, transposeMatrix, data);
				break;
				
			//case this.gl.FLOAT_MAT4:
			case 0x8B5C:
				this.gl.uniformMatrix4fv(uniform.location, transposeMatrix, data);
				break;
		}
	}
	
		
	this.setTexture = function(unitNumber, textureBuffer)
	{
		this.gl.activeTexture(this.gl.TEXTURE0 + unitNumber);
		this.gl.bindTexture(this.gl.TEXTURE_2D, textureBuffer);
	}
	
	
	this.setTextureFiltering = function(textureBuffer, magFilter, minFilter)
	{
		var internalMin = this.gl.NEAREST;
		var internalMag = this.gl.LINEAR;
		
		switch(magFilter)
		{
			case efw.TextureFilters.kMagPoint:
				internalMag = this.gl.NEAREST;
				break;
			
			case efw.TextureFilters.kMagLinear:
				internalMag = this.gl.LINEAR;
				break;
		}
		
		switch(minFilter)
		{
			case efw.TextureFilters.kMinPointNoMip:
				internalMin = this.gl.NEAREST;
				break;
				
			case efw.TextureFilters.kMinLinearNoMip:
				internalMin = this.gl.LINEAR;
				break;
				
			case efw.TextureFilters.kMinLinearMipNear:
				internalMin = this.gl.LINEAR_MIPMAP_NEAREST;
				break;
				
			case efw.TextureFilters.kMinLinearMipLinear:
				internalMin = this.gl.LINEAR_MIPMAP_LINEAR;
				break;
		}
	
		this.gl.bindTexture(this.gl.TEXTURE_2D, textureBuffer);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, internalMag);
    	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, internalMin);
	}
	
	
	this.setVertexBuffer = function(vertexBuffer)
	{
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
	}
	
	
	this.setVertexFormat = function(vertexFormat)
	{
		var vstride = vertexFormat.stride;
		var vattribs = vertexFormat.attribs;
		
		//this.gl.bindBuffer(graphicsDevice.ARRAY_BUFFER, mesh.vertexBuffer);
		for (var key in this.activeShaderProgram.attribs)
		{
			var attribute = this.activeShaderProgram.attribs[key];
			this.gl.vertexAttribPointer(attribute.location, vattribs[key].count, 
				vattribs[key].type, vattribs[key].normalized, vstride, vattribs[key].offset);
			
			//window.console.log(attribute);
			//window.console.log(vattribs[key]);
		}
	}
	

	this.setViewport = function(left, top, right, bottom)
	{
		this.gl.viewport(left, top, right, bottom);		
	}


	this.uploadIndexBufferData = function(buffer, indexData)
	{
   		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexData, this.gl.STATIC_DRAW);
	}
	
	
	this.uploadTextureData = function(textureBuffer, mipLevel, textureFormat, 
		mipWidth, mipHeight, mipBorderColor, mipData)
	{
		this.gl.bindTexture(this.gl.TEXTURE_2D, textureBuffer);
		
		var isCompressed = false;
		var internalFormat = this.gl.RGBA;
		switch(textureFormat)
		{
			case efw.TextureFormats.kL8:
				internalFormat = this.gl.LUMINANCE;
				break;
			case efw.TextureFormats.kRGB:
				internalFormat = this.gl.RGB;
				break;
			case efw.TextureFormats.kRGBA:
				internalFormat = this.gl.RGBA;
				break;
			case efw.TextureFormats.kDXT1:
				internalFormat = this.gl.COMPRESSED_RGBA_S3TC_DXT1_EXT;
				isCompressed = true;
				break;
			case efw.TextureFormats.kDXT3:
				internalFormat = this.gl.COMPRESSED_RGBA_S3TC_DXT3_EXT;
				isCompressed = true;
				break;
			case efw.TextureFormats.kDXT5:
				internalFormat = this.gl.COMPRESSED_RGBA_S3TC_DXT5_EXT;
				isCompressed = true;
				break;
		}
		
		if (isCompressed)
			this.gl.compressedTexImage2D(this.gl.TEXTURE_2D, mipLevel, internalFormat, 
				mipWidth, mipHeight, mipBorderColor, mipData);
		else
		{
			this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
			this.gl.texImage2D(this.gl.TEXTURE_2D, mipLevel, internalFormat, mipWidth, mipHeight, 
				mipBorderColor, internalFormat, this.gl.UNSIGNED_BYTE, mipData);
		}
	}
	
	
	this.uploadVertexBufferData = function(buffer, vertexData)
	{
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexData, this.gl.STATIC_DRAW);
	}
	
		
	this.enableState = function(state)
	{
		switch(state)
		{
			case efw.GraphicsDeviceState.kBlend:
				this.gl.enable(this.gl.BLEND);
				break;
				
			case efw.GraphicsDeviceState.kCullFace:
				this.gl.enable(this.gl.CULL_FACE);
				break;

			case efw.GraphicsDeviceState.kDepthTest:
				this.gl.enable(this.gl.DEPTH_TEST);
				break;
		}
	}
	

	this.disableState = function(state)
	{
		switch(state)
		{
			case efw.GraphicsDeviceState.kBlend:
				this.gl.disable(this.gl.BLEND);
				break;
				
			case efw.GraphicsDeviceState.kCullFace:
				this.gl.disable(this.gl.CULL_FACE);
				break;

			case efw.GraphicsDeviceState.kDepthTest:
				this.gl.disable(this.gl.DEPTH_TEST);
				break;
		}
	}
	
	
	this._compileShaderWithDefines = function(shaderSource, shaderType, defines)
	{
		var newShaderSource = shaderSource;
		if (defines != null)
			newShaderSource = _parseShaderDefines(defines) + shaderSource;
		
		var shader = this.gl.createShader(shaderType);
		if (!shader)
			return null;
		
		this.gl.shaderSource(shader, newShaderSource);
		this.gl.compileShader(shader);
		
		if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS) == false)
		{
			var lines = shaderSource.split(/[\r][\n]/);
			for (var i=0; i<lines.length; i++)
				lines[i] = '' + (i+1) + ': ' + lines[i];
				
			window.console.log("Shader source:\n" + lines.join('\r\n'));
			window.console.error("Error compiling shader:\n" + this.gl.getShaderInfoLog(shader));
			
			this.gl.deleteShader(shader);
			shader = null;
		}
			
		return shader;
	}
	
	
	this._getShaderProgramUniformTable = function(shaderProgram)
	{
		var uniformTable = {};
	
		var uniformCount = this.gl.getProgramParameter(shaderProgram, this.gl.ACTIVE_UNIFORMS);
		for (var i=0; i<uniformCount; i++)
		{
			var uniform = this.gl.getActiveUniform(shaderProgram, i);
			if (uniform != null)
			{
				var uniformLocation = this.gl.getUniformLocation(shaderProgram, uniform.name);
				//window.console.log(uniform);
				//window.console.log(uniformLocation);
	
				var newEntry = new efw.ShaderUniformEntry();
				newEntry.init(uniformLocation, uniform.type);
				uniformTable[uniform.name] = newEntry;
			}
		}
		
		return uniformTable;
	}
	
	
	this._getShaderProgramAttribTable = function(shaderProgram)
	{
		var attribTable = {};
		
		var attribCount = this.gl.getProgramParameter(shaderProgram, this.gl.ACTIVE_ATTRIBUTES);
		for (var i=0; i<attribCount; i++)
		{
			var attrib = this.gl.getActiveAttrib(shaderProgram, i);
			if (attrib != null)
			{
				var attribLocation = this.gl.getAttribLocation(shaderProgram, attrib.name);
				//window.console.log(attrib);
				//window.console.log(attribLocation);
	
				var newEntry = new efw.ShaderAttribEntry();
				newEntry.init(attribLocation, attrib.type);
				attribTable[attrib.name] = newEntry;
			}
		}
		
		return attribTable;
	}


	var _parseShaderDefines = function(defines)
	{
		// Defines are split with spaces
		var listDefines = defines.split(' ');
		var result = '';
		
		for (var i=0; i<listDefines.length; i++)
		{
			if (listDefines[i].length > 2 && listDefines[i].substring(0, 2) == '-D')
			{
				var keyAndValue = listDefines[i].split('=');
							 
				if (keyAndValue.length == 1)
				{
					result += '#define ' + keyAndValue[0].substring(2) + '\r\n';
				}
				else if (keyAndValue.length == 2)
				{
					result += '#define ' + keyAndValue[0].substring(2) + ' ' + keyAndValue[1] + '\r\n';
				}
				else
				{
					// Invalid
					window.console.log("Error parsing shader defines!");
				}
			}
		}
		result += '\r\n';
		
		//window.console.log(result);
		return result;
	}

}


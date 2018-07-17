
/**
 * @constructor 
 */
efw.CameraPerspective = function()
{
	this.position = [0, 0, 0];
	this.strafeVec = [1, 0, 0];
	this.upVec = [0, 1, 0];
	this.lookAtVec = [0, 0, 1];
	
	this.fovY = 1.0;
	this.aspectRatio = 1.0;
	this.nearZ = 1.0;
	this.farZ = 1.0;

	this.viewMatrix = null;
	this.projectionMatrix = null;
	this.viewProjectionMatrix = null;

	// Flags
	this.hasChanged = false;
	this._needUpdateView = true;
	this._needUpdateProjection = true;
	this._needUpdateViewProjection = true;
}


efw.CameraPerspective.prototype.initPerspective = function(fovY, aspectRatio, nearZ, farZ)
{
	this.fovY = fovY;
	this.aspectRatio = aspectRatio;
	this.nearZ = nearZ;
	this.farZ = farZ;
	
	this.projectionMatrix = mat4.perspectiveFovRH(this.fovY, this.aspectRatio, this.nearZ, this.farZ);
	this._needUpdateViewProjection = true;
}


efw.CameraPerspective.prototype.initLookAt = function(position, lookAtVec, upVec)
{
	var lookAtPos = vec3.add(position, lookAtVec);
	this.viewMatrix = mat4.lookAtRH(position, lookAtPos, upVec);
	
	this.position = position;
	this.strafeVec = mat4.getVec3X(this.viewMatrix);
	this.upVec = mat4.getVec3Y(this.viewMatrix);
	this.lookAtVec = mat4.getVec3Z(this.viewMatrix);
	
	this._needUpdateViewProjection = true;
}


efw.CameraPerspective.prototype.rotateLookAt = function(deltaOverY, deltaOverX)
{
	var sinAngX = Math.sin(deltaOverY);
	var cosAngX = Math.cos(deltaOverY);
		
	// Rotate lookAtPosition around Y vector (not up)
	var newLookAtVec = this.lookAtVec;
	newLookAtVec[0] = vec3.dot(this.lookAtVec, vec3.create(cosAngX, 0, sinAngX));
	newLookAtVec[2] = vec3.dot(this.lookAtVec, vec3.create(-sinAngX, 0, cosAngX));
	this.lookAtVec = vec3.normalize(newLookAtVec);
	//this.strafeVec = vec3.normalize( vec3.cross(this.upVec, this.lookAtVec) );
	
	// Rotate lookAtPosition around "strafe" vector
	//var sinAngY = Math.sin(deltaOverY);
	//var cosAngY = Math.cos(deltaOverY);
	var tempStrafe = vec3.normalize( vec3.cross([0, 1, 0], this.lookAtVec) );
	var tempUp = vec3.normalize( vec3.cross(this.lookAtVec, tempStrafe) );
	
	var cameraMat = mat4.createFromVec3(tempStrafe, tempUp, this.lookAtVec);
	var invCameraMat = mat4.transpose(cameraMat);
	var rotateXMat = mat4.rotateX(deltaOverX);
	var rotateOverRight = mat4.mul(mat4.mul(invCameraMat, rotateXMat), cameraMat);
	this.lookAtVec = vec3.mulMat4(this.lookAtVec, rotateOverRight);
	this.strafeVec = vec3.normalize( vec3.cross(this.upVec, this.lookAtVec) );
	//this.upVec = vec3.normalize( vec3.cross(this.lookAtVec, this.strafeVec) );

	//efw.assert( vec3.isUnit(rightVec) );
	//efw.assert( vec3.isUnit(upVec) );
	//efw.assert( vec3.isUnit(gCamera.lookAtVec) );

	this._needUpdateView = true;
}


efw.CameraPerspective.prototype.walk = function(time)
{
	var scaledLookAt = vec3.mulScalar(this.lookAtVec, time);
	this.position = vec3.add(this.position, scaledLookAt);
	
	this._needUpdateView = true;
}


efw.CameraPerspective.prototype.update = function(time)
{
	this.hasChanged = false;
	
	if (this._needUpdateView)
	{
		//this.viewMatrix = mat4.lookAtVecRH(this.position, this.strafeVec, this.upVec, this.lookAtVec);
		this.viewMatrix = mat4.lookAtRH(this.position, vec3.add(this.position, this.lookAtVec), this.upVec);
		this._needUpdateView = false;
		this._needUpdateViewProjection = true;
	}
	
	if (this._needUpdateProjection)
	{
		this.projectionMatrix = mat4.perspectiveFovRH(this.fovY, this.aspectRatio, this.nearZ, this.farZ);
		this._needUpdateProjection = false;
		this._needUpdateViewProjection = true;
	}
	
	if (this._needUpdateViewProjection)
	{
		this.viewProjectionMatrix = mat4.mul(this.viewMatrix, this.projectionMatrix);
		this._needUpdateViewProjection = false;
		this.hasChanged = true;
	}
}


/*
efw.FollowCamera = function()
{
	
}
*/
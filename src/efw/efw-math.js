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
efw.vec3 = efw.vec3 || {};
efw.vec4 = efw.vec4 || {};
efw.mat4 = efw.mat4 || {};

efw.kEpsilon = 1e-6;

efw.vec3.isUnit = function(v) {
	return Math.abs(efw.vec3.lengthSquared(v) - 1.0) < efw.kEpsilon;
}
efw.vec3.create = function(x, y, z) {
	return [x, y, z];
}
efw.vec3.add = function(v1, v2) {
	return [v1[0]+v2[0], v1[1]+v2[1], v1[2]+v2[2]];
}
efw.vec3.sub = function(v1, v2) {
	return [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]];
}
efw.vec3.mul = function(v1, v2) {
	return [ v1[0]*v2[0], v1[1]*v2[1], v1[2]*v2[2] ];
}
efw.vec3.mulMat4 = function(v, m) {
	return [ 
		v[0]*m[0]+v[1]*m[4]+v[2]*m[8],
		v[0]*m[1]+v[1]*m[5]+v[2]*m[9],
		v[0]*m[2]+v[1]*m[6]+v[2]*m[10] 
		];
}
efw.vec3.mulScalar = function(v, s) {
	return [ v[0]*s, v[1]*s, v[2]*s ];
}
efw.vec3.length = function(v) {
	return Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
}
efw.vec3.lengthSquared = function(v) {
	return v[0]*v[0]+v[1]*v[1]+v[2]*v[2];
}
efw.vec3.normalize = function(v) {
	var lengthInv = 1.0/efw.vec3.length(v);
	return [v[0]*lengthInv, v[1]*lengthInv, v[2]*lengthInv];
}
efw.vec3.dot = function(v1, v2) {
	return (v1[0]*v2[0]+v1[1]*v2[1]+v1[2]*v2[2]); 
}
efw.vec3.cross = function(v1, v2) {
	return [
		v1[1]*v2[2] - v1[2]*v2[1],
		v1[2]*v2[0] - v1[0]*v2[2],
		v1[0]*v2[1] - v1[1]*v2[0]
	];
}

efw.vec4.isUnit = function(v) {
	return Math.abs(efw.vec4.lengthSquared(v) - 1.0) < efw.kEpsilon;
}
efw.vec4.create = function(x, y, z, w) {
	return [x, y, z, w];
}
efw.vec4.add = function(v1, v2) {
	return [v1[0]+v2[0], v1[1]+v2[1], v1[2]+v2[2], v1[3]+v2[3]];
}
efw.vec4.sub = function(v1, v2) {
	return [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2], v1[3]-v2[3]];
}
efw.vec4.mul = function(v1, v2) {
	return [ v1[0]*v2[0], v1[1]*v2[1], v1[2]*v2[2], v1[3]*v2[3] ];
}
efw.vec4.mulMat4 = function(v, m) {
	return [ 
		v[0]*m[0]+v[1]*m[4]+v[2]*m[8]+v[3]*m[12],
		v[0]*m[1]+v[1]*m[5]+v[2]*m[9]+v[3]*m[13],
		v[0]*m[2]+v[1]*m[6]+v[2]*m[10]+v[3]*m[14],
		v[0]*m[3]+v[1]*m[7]+v[2]*m[11]+v[3]*m[15]
		];
}
efw.vec4.mulScalar = function(v, s) {
	return [ v[0]*s, v[1]*s, v[2]*s, v[3]*s ];
}
efw.vec4.length = function(v) {
	return Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]+v[3]*v[3]);
}
efw.vec4.lengthSquared = function(v) {
	return v[0]*v[0]+v[1]*v[1]+v[2]*v[2]+v[3]*v[3];
}
efw.vec4.normalize = function(v) {
	var lengthInv = 1.0/efw.vec4.length(v);
	return [v[0]*lengthInv, v[1]*lengthInv, v[2]*lengthInv, v[3]*lengthInv];
}
efw.vec4.dot = function(v1, v2) {
	return (v1[0]*v2[0]+v1[1]*v2[1]+v1[2]*v2[2]+v1[3]*v2[3]);
}

// Matrices work (and shoulb be used) as row-major matrices
// Internally they are stored as column-major (required by OpenGL), 
// so if you directly access its data its in column-major order 
//
// Matrix stored as: [m00, m04, m08, m12, m01, m05 ..., m07, m11, m15]
//
// Representation:
// m00 m01 m02 m03
// m04 m05 m06 m07
// m08 m09 m10 m11
// m12 m13 m14 m15
// 
efw.mat4.log = function(m) {
	window.console.log("[ %f, %f, %f, %f ]\n[ %f, %f, %f, %f ]\n[ %f, %f, %f, %f ]\n[ %f, %f, %f, %f ]\n", 
		m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11], m[12], m[13], m[14], m[15]);
}
efw.mat4.create = function(m00,m10,m20,m30,m01,m11,m21,m31,m02,m12,m22,m32,m03,m13,m23,m33) {
	return [
		m00,m10,m20,m30,
		m01,m11,m21,m31,
		m02,m12,m22,m32,
		m03,m13,m23,m33
	];
}
efw.mat4.createFromMat3 = function(m33) {
	return [
		m33[0],m33[1],m33[2],0,
		m33[3],m33[4],m33[5],0,
		m33[6],m33[7],m33[8],0,
		0,0,0,1
	];
}
efw.mat4.createFromVec3 = function(axisX, axisY, axisZ) {
	return [
		axisX[0],axisY[0],axisZ[0],0,
		axisX[1],axisY[1],axisZ[1],0,
		axisX[2],axisY[2],axisZ[2],0,
		0,0,0,1
	];
}
efw.mat4.identity = function() {
	return [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];
}
efw.mat4.transpose = function(m) {
	return [
		m[0], m[4], m[8], m[12],  
		m[1], m[5], m[9], m[13],
		m[2], m[6], m[10], m[14],
		m[3], m[7], m[11], m[15]
	];
}
efw.mat4.mul = function(m1, m2) {
	return [
		m2[0] * m1[0] + m2[1] * m1[4] + m2[2] * m1[8] + m2[3] * m1[12],  
		m2[0] * m1[1] + m2[1] * m1[5] + m2[2] * m1[9] + m2[3] * m1[13],
		m2[0] * m1[2] + m2[1] * m1[6] + m2[2] * m1[10] + m2[3] * m1[14],
		m2[0] * m1[3] + m2[1] * m1[7] + m2[2] * m1[11] + m2[3] * m1[15],
		
		m2[4] * m1[0] + m2[5] * m1[4] + m2[6] * m1[8] + m2[7] * m1[12],  
		m2[4] * m1[1] + m2[5] * m1[5] + m2[6] * m1[9] + m2[7] * m1[13],
		m2[4] * m1[2] + m2[5] * m1[6] + m2[6] * m1[10] + m2[7] * m1[14],
		m2[4] * m1[3] + m2[5] * m1[7] + m2[6] * m1[11] + m2[7] * m1[15],
		
		m2[8] * m1[0] + m2[9] * m1[4] + m2[10] * m1[8] + m2[11] * m1[12],  
		m2[8] * m1[1] + m2[9] * m1[5] + m2[10] * m1[9] + m2[11] * m1[13],
		m2[8] * m1[2] + m2[9] * m1[6] + m2[10] * m1[10] + m2[11] * m1[14],
		m2[8] * m1[3] + m2[9] * m1[7] + m2[10] * m1[11] + m2[11] * m1[15],
		
		m2[12] * m1[0] + m2[13] * m1[4] + m2[14] * m1[8] + m2[15] * m1[12],  
		m2[12] * m1[1] + m2[13] * m1[5] + m2[14] * m1[9] + m2[15] * m1[13],
		m2[12] * m1[2] + m2[13] * m1[6] + m2[14] * m1[10] + m2[15] * m1[14],
		m2[12] * m1[3] + m2[13] * m1[7] + m2[14] * m1[11] + m2[15] * m1[15]
	];
}
efw.mat4.upper3x3 = function(m) {
	return [ 
		m[0], m[1], m[2],
		m[4], m[5], m[6],
		m[8], m[9], m[10] 
	];
}
efw.mat4.getVec3X = function(m)
{
	return [m[0], m[1], m[2]];
}
efw.mat4.getVec3Y = function(m)
{
	return [m[4], m[5], m[6]];
}
efw.mat4.getVec3Z = function(m)
{
	return [m[8], m[9], m[10]];
}
efw.mat4.lookAtRH = function(eyePos, lookAtPos, upVec) {
	var axisZ = efw.vec3.normalize( efw.vec3.sub(lookAtPos, eyePos) );
	var axisX = efw.vec3.normalize( efw.vec3.cross(upVec, axisZ) );
	var axisY = efw.vec3.cross(axisZ, axisX);

	return [
		axisX[0], axisX[1], axisX[2], -efw.vec3.dot(axisX, eyePos),
		axisY[0], axisY[1], axisY[2], -efw.vec3.dot(axisY, eyePos),
		axisZ[0], axisZ[1], axisZ[2], -efw.vec3.dot(axisZ, eyePos),
		0, 0, 0, 1
	];
}
efw.mat4.lookAtVecRH = function(eyePos, axisX, axisY, axisZ)
{
	return [
		axisX[0], axisX[1], axisX[2], -efw.vec3.dot(axisX, eyePos),
		axisY[0], axisY[1], axisY[2], -efw.vec3.dot(axisY, eyePos),
		axisZ[0], axisZ[1], axisZ[2], -efw.vec3.dot(axisZ, eyePos),
		0, 0, 0, 1
	];
}
efw.mat4.perspectiveFovRH = function(fovY, aspectRatio, nearZ, farZ) {
	var scaleY = 1.0/Math.tan(fovY*0.5);
	var scaleX = scaleY / aspectRatio;
	var rangeZInv = 1.0/(farZ-nearZ);
	return [
		scaleX, 0, 0, 0,
		0, scaleY, 0, 0,
		0, 0, -farZ*rangeZInv, -nearZ*farZ*rangeZInv,
		0, 0, -1, 0
	];
}
efw.mat4.rotateX = function(ang) {
	var sinAng = Math.sin(ang);
	var cosAng = Math.cos(ang);
	return [
		1, 0, 0, 0,
		0, cosAng, -sinAng, 0,
		0, sinAng, cosAng, 0,
		0, 0, 0, 1
	];
}
efw.mat4.rotateY = function(ang) {
	var sinAng = Math.sin(ang);
	var cosAng = Math.cos(ang);
	return [
		cosAng, 0, sinAng, 0,
		0, 1, 0, 0,
		-sinAng, 0, cosAng, 0,
		0, 0, 0, 1
	];
}
efw.mat4.rotateZ = function(ang) {
	var sinAng = Math.sin(ang);
	var cosAng = Math.cos(ang);
	return [
		cosAng, -sinAng, 0, 0,
		sinAng, cosAng, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];	
}
efw.mat4.scale = function(s) {
	return [
		s[0], 0, 0, 0,
		0, s[1], 0, 0,
		0, 0, s[2], 0,
		0, 0, 0, 1
	];
}
efw.mat4.translate = function(t) {
	return [
		1, 0, 0, t[0],
		0, 1, 0, t[1],
		0, 0, 1, t[2],
		0, 0, 0, 1
	];
}

// Using namespaces
var vec3 = efw.vec3;
var vec4 = efw.vec4;
var mat4 = efw.mat4;

precision mediump float;

uniform mat4 gMatW;
uniform mat3 gMatWIT;
uniform mat4 gMatWVP;

uniform vec4 gPositionScale;
uniform vec4 gPositionBias;
uniform vec4 gUvScaleBias;

// ----------

attribute vec3 aPosition;

// Normal
#if defined(NORMAL_ENCODING_SPHEREMAP) || defined(NORMAL_ENCODING_AZIMUTHAL)
attribute vec2 aNormal;
#else
attribute vec3 aNormal;
#endif

attribute vec2 aUv0;

// ----------

varying vec3 oWorldPosition;
varying vec3 oWorldNormalVec;
varying vec2 oUv0;

#ifdef MIP_OVERLAY
varying vec2 oUvDebug;
#endif

// ----------


vec4 applyScaleAndBias(vec4 value, vec4 scale, vec4 bias)
{
	return value * scale + bias;
}
vec2 applyScaleAndBias(vec2 value, vec2 scale, vec2 bias)
{
	return value * scale + bias;
}

vec3 decodeNormal_SphereMap(vec2 encoding)
{
	vec2 enc = encoding * vec2(2.0) - vec2(1.0);

	vec3 normal;
	normal.z = dot(enc, enc) * 2.0 - 1.0;
	float length = sqrt(1.0 - normal.z*normal.z);
	normal.xy = normalize(enc) * length;
	return normal;
}

vec3 decodeNormal_AzimuthalProjection(vec2 encoding)
{
	vec2 enc = encoding * vec2(4.0) - vec2(2.0);
	
	vec3 normal;
	float dotEnc = dot(enc,enc);
	normal.xy = enc * vec2( sqrt(1.0 - dotEnc * 0.25) );
	normal.z = 1.0 - dotEnc * 0.5;
	return normal;
}


#ifdef VS_SIMPLE
void main()
{
	vec4 position = vec4(aPosition, 1.0);
	oWorldPosition = (position * gMatW).xyz;
	gl_Position = position * gMatWVP;

	oWorldNormalVec = aNormal * gMatWIT;
	oUv0 = aUv0;

#ifdef MIP_OVERLAY
	oUvDebug = aUv0 / 8;
#endif
}
#endif


#ifdef VS_COMPRESSED
void main()
{
	vec4 position = vec4(aPosition, 1.0);
	position = position * gPositionScale + gPositionBias;
	oWorldPosition = (position * gMatW).xyz;
	gl_Position = position * gMatWVP;

#if defined NORMAL_ENCODING_U16
	vec3 normal = aNormal * vec3(2.0) - vec3(1.0); 
#elif defined NORMAL_ENCODING_SPHEREMAP
	vec3 normal = decodeNormal_SphereMap(aNormal);
#elif defined NORMAL_ENCODING_AZIMUTHAL
	vec3 normal = decodeNormal_AzimuthalProjection(aNormal);
#else
	vec3 normal = aNormal;
#endif
	oWorldNormalVec = normal * gMatWIT;

	oUv0 = aUv0 * gUvScaleBias.xy + gUvScaleBias.zw;

#ifdef MIP_OVERLAY
	oUvDebug = aUv0 / 8;
#endif
}
#endif
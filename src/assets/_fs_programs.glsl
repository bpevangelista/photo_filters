precision mediump float;

uniform vec3 gWorldEyePosition;
uniform vec3 gLight0WorldPosition;
uniform vec3 gLight1WorldPosition;
uniform vec3 gLight0Color;
uniform vec3 gLight1Color;

uniform sampler2D gSamplerAlbedo;
uniform vec3 gMaterialFresnel0;
uniform float gMaterialRoughness;

varying vec3 oWorldPosition;
varying vec3 oWorldNormalVec;
varying vec2 oUv0;

#ifdef MIP_OVERLAY
varying vec2 oUvDebug;
#endif


float convertShininessToRoughness(float value)
{
	return sqrt(2.0 / (value + 2.0));
}

// Refractive index is per wavelength (opt pass 3 parameters)
vec3 calculateF0(float n2)
{
	float result = (1.0 - n2) / (1.0 + n2);
	result *= result;
	return vec3(result);
}

vec3 fresnel(vec3 f0, float dotHV)
{
	// where dotHV is the cosine of the half angle between the incoming and outgoing light directions
	return f0 + (vec3(1.0) - f0) * vec3(pow(1.0 - dotHV, 5.0));
}

vec3 gamma(vec3 value)
{
	return pow(value, vec3(1.0/2.2));
}

vec3 degamma(vec3 value)
{
	return pow(value, vec3(2.2));
}


vec3 blinnPhong(vec3 normalVec, vec3 eyeVec, vec3 lightVec, vec3 materialAlbedo, float materialShininess, vec3 lightColor)
{
	vec3 halfVec = normalize(eyeVec + lightVec);
	
	float dotNormalLight = max(dot(normalVec, lightVec), 0.0);
	float dotNormalHalf = max(dot(normalVec, halfVec), 0.0);
	
	// Specular
	vec3 specular = vec3( pow(dotNormalHalf, materialShininess) );
	
	// Diffuse
	return ( 0.7 * materialAlbedo + 0.3 * specular ) * dotNormalLight * lightColor;
}


vec3 blinnPhongNrm(vec3 normalVec, vec3 eyeVec, vec3 lightVec, vec3 materialAlbedo, float materialShininess, vec3 lightColor)
{
	vec3 halfVec = normalize(eyeVec + lightVec);
	
	float dotNormalLight = max(dot(normalVec, lightVec), 0.0);
	float dotNormalHalf = max(dot(normalVec, halfVec), 0.0);
	float dotEyeHalf = max(dot(eyeVec, halfVec), 0.0);
	
	float kOneOverPi = 1.0/3.141592;
	float kOneOver2Pi = 0.5 / 3.141592;

	// Specular
	vec3 specularFresnel = fresnel(gMaterialFresnel0, dotEyeHalf);
	// normalization == shininess + 2 / 2PI == shininess / 2PI + 1/PI
	float specularNormalization = materialShininess * kOneOver2Pi + kOneOverPi;
	vec3 specularNormalizedNdf = vec3( pow(dotNormalHalf, materialShininess) * specularNormalization );
	
	// Diffuse
	return ( 
		(1.0 - specularFresnel) * materialAlbedo * kOneOverPi + 
		0.5 * materialAlbedo * specularFresnel * specularNormalizedNdf + 
		0.5 * specularFresnel * specularNormalizedNdf ) * dotNormalLight * lightColor;
}


#ifdef FS_SIMPLE
void main()
{
	vec3 worldPosition = oWorldPosition;
	vec3 worldNormalVec = normalize(oWorldNormalVec);
	vec3 worldEyeVec = normalize(gWorldEyePosition - worldPosition);

	vec3 worldLight0Vec = normalize(gLight0WorldPosition - worldPosition);

	// Material	
	vec3 materialAlbedoColor = degamma( texture2D(gSamplerAlbedo, oUv0).xyz );
	
	// Lights
	vec3 result0 = blinnPhong(worldNormalVec, worldEyeVec, worldLight0Vec, materialAlbedoColor, gMaterialRoughness, gLight0Color);
	gl_FragColor = vec4( gamma(result0), 1.0 );
}
#endif


#ifdef FS_PHYSICALLY_2L
void main()
{
	vec3 worldPosition = oWorldPosition;
	vec3 worldNormalVec = normalize(oWorldNormalVec);
	vec3 worldEyeVec = normalize(gWorldEyePosition - worldPosition);

	vec3 worldLight0Vec = gLight0WorldPosition - worldPosition;
	vec3 worldLight1Vec = gLight1WorldPosition - worldPosition;
	float light0Dist = length(worldLight0Vec);
	float light1Dist = length(worldLight1Vec);
	worldLight0Vec *= 1.0 / light0Dist; 
	worldLight1Vec *= 1.0 / light1Dist;
	
	//const float innerRange = 200.0;
	const float outerRange = 2100.0;
	//float light0Attn = 1.0 - clamp((light0Dist - innerRange) / outerRange, 0.0, 1.0); 
	//float light1Attn = 1.0 - clamp((light1Dist - innerRange) / outerRange, 0.0, 1.0);
	float light0Attn = 1.0 - clamp(light0Dist / outerRange, 0.0, 1.0);
	float light1Attn = 1.0 - clamp(light1Dist / outerRange, 0.0, 1.0);
	light0Attn *= light0Attn;
	light1Attn *= light1Attn;
	
	// Material	
	vec3 materialAlbedoColor = degamma( texture2D(gSamplerAlbedo, oUv0).xyz );
	
	// Lights
	vec3 result0 = blinnPhongNrm(worldNormalVec, worldEyeVec, worldLight0Vec, materialAlbedoColor, gMaterialRoughness, gLight0Color * light0Attn);
	vec3 result1 = blinnPhongNrm(worldNormalVec, worldEyeVec, worldLight1Vec, materialAlbedoColor, gMaterialRoughness, gLight1Color * light1Attn);
	gl_FragColor = vec4( 0.05 + gamma(result0 + result1), 1.0 );
}
#endif

efw.TextureFormats = {
	kUnknown:0,
	kL8:1,
	kRGB:2,
	kRGBA:3,
	kDXT1:5,
	kDXT3:6,
	kDXT5:7
};

efw.TextureFilters = {
	kMagPoint:0,
	kMagLinear:1,
	kMinPointNoMip:2,
	kMinLinearNoMip:3,
	kMinLinearMipNear:4,
	kMinLinearMipLinear:5
}


/**
 * @constructor 
 */
efw.Material = function()
{
	this.albedoTexture = null;
	this.normalMapTexture = null;
	this.fresnel0 = null;
	this.roughness = null;
}


efw.Material.prototype.init = function(albedoTextureObj, normalMapTextureObj, fresnel0Array, roughness)
{
	this.albedoTexture = albedoTextureObj;
	this.normalMapTexture = normalMapTextureObj;
	this.fresnel0 = new Float32Array(fresnel0Array);
	this.roughness = roughness;
}

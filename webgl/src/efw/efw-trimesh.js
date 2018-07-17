
/**
 * @constructor 
 */
efw.TriMeshVertexFormat = function(vformat)
{
	this.stride = 0;
	this.attribs = {};

	var positionIndex = 		(vformat >> 0) & 0x1;
	var tangentFrameIndex = 	(vformat >> 1) & 0x7;
	var color0Index = 			(vformat >> 4) & 0x1;
	var color1Index = 			(vformat >> 5) & 0x1;
	var uv0Index = 				(vformat >> 6) & 0x3;
	var uv1Index = 				(vformat >> 8) & 0x3;
	var uv2Index = 				(vformat >> 10) & 0x3;
	var uv3Index =	 			(vformat >> 12) & 0x3;
	
	var i = 0;
	var extras = [];
	extras[i++] = efw.TriMeshVertexTangentFrameFormats[tangentFrameIndex];
	extras[i++] = efw.TriMeshVertexColorFormats[color0Index];
	extras[i++] = efw.TriMeshVertexColorFormats[color1Index];
	extras[i++] = efw.TriMeshVertexUvFormats[uv0Index];
	extras[i++] = efw.TriMeshVertexUvFormats[uv1Index];
	extras[i++] = efw.TriMeshVertexUvFormats[uv2Index];
	extras[i++] = efw.TriMeshVertexUvFormats[uv3Index];

	var extraCount = {
		aColor:0,
		aUv:0
	};
	
	var attribute = efw.TriMeshVertexPositionFormats[positionIndex];
	this.attribs[attribute.key] = attribute.value;

	var currentOffset = attribute.value.count * efw.TriMeshVertexFormatsSize[attribute.value.type];
	for (var j=0; j < i; j++)
	{
		if (extras[j] != null)
		{
			attribute = extras[j];
			var newKey = attribute.key;
			
			if (extraCount[attribute.key] != null)
			{
				newKey = attribute.key + extraCount[attribute.key];
				extraCount[attribute.key]++; 
			}
			
			this.attribs[newKey] = attribute.value;
			this.attribs[newKey].offset = currentOffset;
			currentOffset += attribute.value.count * efw.TriMeshVertexFormatsSize[attribute.value.type];
		}
	}
	
	this.stride = currentOffset;
}

efw.TriMeshVertexFormatsSize = 
{
	0x1401/*gl.UNSIGNED_BYTE*/ : 1,
	0x1403/*gl.UNSIGNED_SHORT*/ : 2,
	0x1406/*gl.FLOAT*/ : 4
};

efw.TriMeshVertexPositionFormats = [
	{key:"aPosition", value:{type:0x1406/*gl.FLOAT*/,offset:0,count:3,normalized:false}},
	{key:"aPosition", value:{type:0x1403/*gl.UNSIGNED_SHORT*/,offset:0,count:3,normalized:true}}
];
efw.TriMeshVertexTangentFrameFormats = [
	null,
	{key:"aNormal", value:{type:0x1406/*gl.FLOAT*/,offset:0,count:3,normalized:false}},
	{key:"aNormal", value:{type:0x1403/*gl.UNSIGNED_SHORT*/,offset:0,count:4,normalized:true}},
	{key:"aNormal", value:{type:0x1401/*gl.UNSIGNED_BYTE*/ ,offset:0,count:4,normalized:true}},
	{key:"aNormal", value:{type:0x1403/*gl.UNSIGNED_SHORT*/,offset:0,count:2,normalized:true}}
];
efw.TriMeshVertexColorFormats = [
	null,
	{key:"aColor", value:{type:0x1401/*gl.UNSIGNED_BYTE*/,offset:0,count:4,normalized:true}}
];
efw.TriMeshVertexUvFormats = [
	null,
	{key:"aUv", value:{type:0x1406/*gl.FLOAT*/,offset:0,count:2,normalized:false}},
	{key:"aUv", value:{type:0x1403/*gl.UNSIGNED_SHORT*/,offset:0,count:2,normalized:true}}
];


/*
 * Static Mesh  /  Animated Mesh
 * 
 */


/**
 * @constructor 
 */
efw.TriMesh = function()
{
	this.materialGuid = null;
	
	this.vertexBuffer = null;
	this.vertexFormat = null;
	
	this.indexBuffer = null;
	this.indexCount = 0;
	
	// Extra arrays
	this.optPositionScale = null;
	this.optPositionBias = null;
	this.optUv0ScaleBias = null;
}


efw.TriMesh.prototype.init = function(materialGuid, vertexBuffer, vertexFormat, indexBuffer, indexCount)
{
	this.materialGuid = materialGuid;
	this.vertexBuffer = vertexBuffer;
	this.vertexFormat = vertexFormat;
	this.indexBuffer = indexBuffer;
	this.indexCount = indexCount;
}


efw.TriMesh.prototype.initOpt = function(positionScaleArray, positionBiasArray, uvScaleBiasArray)
{
	this.optPositionScale = (positionScaleArray != null)? new Float32Array(positionScaleArray) : null;
	this.optPositionBias = (positionBiasArray != null)? new Float32Array(positionBiasArray) : null;
	this.optUv0ScaleBias = (uvScaleBiasArray != null)? new Float32Array(uvScaleBiasArray) : null;

}

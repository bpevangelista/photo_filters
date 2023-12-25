
/**
 * @constructor 
 */
efw.ResourceManager = function(graphicsDevice)
{
	this.graphicsDevice = graphicsDevice;
	
	this.resourceTable = {
		meshes : {},
		materials : {}
	};
	
	this._packageQueue = [];
}


efw.ResourceManager.prototype.addPackage = function(resourcePackage)
{
	this._packageQueue.push( resourcePackage );
}


efw.ResourceManager.prototype.initializeQueuedPackage = function()
{
	if (this._packageQueue.length > 0)
	{
		var resourcePackage = this._packageQueue[this._packageQueue.length-1];
		this._packageQueue.pop();
		
		var meshResources = resourcePackage.description["meshes"];
		var materialResources = resourcePackage.description["materials"];
		
		var readedBytes = this._loadAllMeshes(meshResources, resourcePackage.data, 0);
		readedBytes = this._loadAllMaterials(materialResources, resourcePackage.data, readedBytes);
		
		if (readedBytes != resourcePackage.data.byteLength)
		{
			window.console.log("Package description or binary data is corrupted!");
		}

	}
}


efw.ResourceManager.prototype.initializeAllQueuedPackages = function()
{
	while (this._packageQueue.length > 0)
	{
		this.initializeQueuedPackage();
	}
}


efw.ResourceManager.prototype._loadAllMeshes = function(descriptions, resourceData, resourceDataOffset)
{
	// Debug
	//window.console.log(resource.description);
	//window.console.log(resource.data);
	
	var dataIndex = resourceDataOffset;
	for (var key in descriptions)
	{
		/**
		 * @type {{mat:string,vformat:number,vcount:number,icount:number,posCustom:Array,uvCustom:Array}} 
		 */
		var mesh = descriptions[key];
		//window.console.log(mesh);

		var vertexFormat = new efw.TriMeshVertexFormat(mesh.vformat)
		
		var arraySize = mesh.vcount * vertexFormat.stride;
		dataIndex = ((dataIndex + 3) & ~3); // align input data
		var vertices = new Uint8Array(resourceData, dataIndex, arraySize);
		dataIndex += arraySize * 1;
		
		arraySize = mesh.icount;
		var indices = new Uint16Array(resourceData, dataIndex, arraySize);
		dataIndex += arraySize * 2;

		// Debug
		//window.console.log(vertices);
		//window.console.log(indices);
		
		var vertexBuffer = this.graphicsDevice.createBuffer();
		this.graphicsDevice.uploadVertexBufferData(vertexBuffer, vertices);
		
		var indexBuffer = this.graphicsDevice.createBuffer();
		this.graphicsDevice.uploadIndexBufferData(indexBuffer, indices);
		
		// Optinal
		var positionScale = (mesh.posCustom != null)? [mesh.posCustom[0], mesh.posCustom[1], mesh.posCustom[2], 1] : null;
		var positionBias = (mesh.posCustom != null)? [mesh.posCustom[3], mesh.posCustom[4], mesh.posCustom[5], 0] : null;
		var uv0ScaleBias = (mesh.uvCustom != null)? [mesh.uvCustom[0], mesh.uvCustom[1], mesh.uvCustom[2], mesh.uvCustom[3]] : null;

		// Create resource
		var newTriMesh = new efw.TriMesh();
		newTriMesh.init(mesh.mat, vertexBuffer, vertexFormat, indexBuffer, mesh.icount);
		newTriMesh.initOpt(positionScale, positionBias, uv0ScaleBias);
		
		// Add new resource to the table
		if (this.resourceTable.meshes[key] != null)
		{
			window.console.log("Duplicated \"mesh\" entry found, old entry will be replaced!");
		}
		this.resourceTable.meshes[key] = newTriMesh;
	}
	
	//window.console.log(this.resourceTable);
	return dataIndex;
}


efw.ResourceManager.prototype._loadAllMaterials = function(descriptions, resourceData, resourceDataOffset)
{
	// Debug
	//console.log(resource.description);
	//console.log(resource.data);

	var dataIndex = resourceDataOffset;
	for (var key in descriptions)
	{
		/**
		 * @type {{albedoTexture:{width:number,height:number,mipCount:number,format:number,size:number},normalTexture:Object,fresnel0:Array,roughness:number}} 
		 */
		var material = descriptions[key];

		var albedoTexture = material.albedoTexture;
		if (albedoTexture == null)
		{
			window.console.log("Material has no albedo texture.")
			window.console.log(material);
			continue;
		}
		
		var textureSize = albedoTexture.size;
		var albedoTextureObj = this.graphicsDevice.createTexture();
		
		var width = albedoTexture.width;
		var height = albedoTexture.height;
		
		for (var j=0; j<albedoTexture.mipCount; ++j)
		{
			if (albedoTexture.format == efw.TextureFormats.kDXT1)
			{
				var layerSize = Math.max(1, Math.floor((width+3)/4)) * Math.max(1, Math.floor((height+3)/4)) * 8;
				var mipTextureData = new Uint8Array(resourceData, dataIndex, layerSize);

				this.graphicsDevice.uploadTextureData(albedoTextureObj, j, efw.TextureFormats.kDXT1, Math.max(1, width), Math.max(1, height), 0 /*border*/, mipTextureData);
			}
			else if (albedoTexture.format == efw.TextureFormats.kRGBA)
			{
				var layerSize = Math.max(1, width) * Math.max(1, height) * 4;
				var mipTextureData = new Uint8Array(resourceData, dataIndex, layerSize);

				this.graphicsDevice.uploadTextureData(albedoTextureObj, j, efw.TextureFormats.kRGBA, Math.max(1, width), Math.max(1, height), 0 /*border*/, mipTextureData);
			}

			dataIndex += layerSize;
			width >>= 1;
			height >>= 1;
		}

		// If the texture is not compressed and has only one mip level we should generate the full mip chain
		if (albedoTexture.format == efw.TextureFormats.kRGBA && albedoTexture.mipCount == 1)
		{
			this.graphicsDevice.generateTextureMipmaps(albedoTextureObj);
		}
		
		this.graphicsDevice.setTextureFiltering(albedoTextureObj, efw.TextureFilters.kMagLinear, efw.TextureFilters.kMinLinearMipNear);
    	
    	// 
    	var newMaterial = new efw.Material();
    	newMaterial.init(albedoTextureObj, null, material.fresnel0, material.roughness);
    	
    	// Add new resource to the table
		if (this.resourceTable.materials[key] != null)
		{
			window.console.log("Duplicated \"material\" entry found, old entry will be replaced!");
		}
    	this.resourceTable.materials[key] = newMaterial;
   	}
   	
   	//window.console.log(this.resourceTable);
   	return dataIndex;
}



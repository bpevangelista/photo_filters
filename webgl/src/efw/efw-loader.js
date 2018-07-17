
/**
 * @constructor 
 */
efw.ResourcePackage = function() {
	this.description = null;
	this.data = null;
}


/**
 * @constructor 
 */
efw.Loader = function() {
	
	this._asyncLoading = 0;
	
	/**
	 * Queue of requests 
	 */
	this._requests = [];
	
	/**
	 * Maps XMLHttpRequest to the last received progress event
	 */
	this._progress = {};	
}


efw.Loader.prototype.hasFinished = function()
{
	return this._asyncLoading == 0;
}


efw.Loader.prototype.clear = function()
{
	this._asyncLoading = 0;
	this._requests = [];
	this._progress = {};
}


efw.Loader.prototype.getProgress = function()
{
	// If there's no requests we are 100% done
	if (this._progress.length == 0)
	{
		return 100;
	}
	
	var sumPosition = 0;
	var sumSize = 0;

	for (var key in this._progress)
	{
		sumPosition += this._progress[key].loaded; 
		sumSize += this._progress[key].total;			
	}
	
	var totalProgress = 0;
	if (sumSize > 0)
	{
		totalProgress = Math.floor(100 * sumPosition/sumSize);
		totalProgress = Math.min( Math.max(totalProgress, 0), 100);
	}
	
	return totalProgress;
}


efw.Loader.prototype.loadFileAsync = function(fullFilePath, fileType, functionPtr)
{
	var self = this;
	
	this._asyncLoading++;
	
	var xhr = new XMLHttpRequest();
	xhr.open('GET', fullFilePath, true);
	xhr.responseType = fileType;
	//xhr.overrideMimeType('text/plain; charset=UTF-8');
	xhr.overrideMimeType("text/plain; charset=x-user-defined");  

	xhr.onload = function(e) {
		//window.console.log(e);
		functionPtr(this.response);
		self._asyncLoading--;
	};
	xhr.onprogress = function(e) {
		//window.console.log(e);
		if (e.lengthComputable)
		{
			self._progress[e.target.fullFilePath] = {loaded:e.loaded, total:e.total};
		}
	}
	xhr.onerror = xhr.onabort = function(e) { 
		self._asyncLoading--;
	};

	// Keep track of it using the "hopefully" unique file path
	xhr.fullFilePath = fullFilePath;
	
	xhr.send();
	this._requests.push( xhr );
	this._progress[fullFilePath] = {loaded:0, total:0};
	
	return xhr;
}


efw.Loader.prototype.loadPackageAsync = function(packageFilename, binaryFilename)
{
	var resourcePackage = new efw.ResourcePackage();
	this.loadFileAsync(packageFilename, 'text', function(data) { resourcePackage.description = window.JSON.parse(data); } );
	this.loadFileAsync(binaryFilename, 'arraybuffer', function(data) { resourcePackage.data = data; } );
	
	return resourcePackage;
}


efw.Loader.prototype.hasPendingAsyncCalls = function()
{
	return (this._asyncLoading != 0);
}

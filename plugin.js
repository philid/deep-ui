if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}

define(function (require){
	//console.log("PLUGIN LOADED")
	var deep = require("deep/deep");

	var layer = {
		prototype:{
			post:function(uri, options)
			{
				options = options || {};
				var self = this;
				function func(){
					return function(){
						self._entries.forEach(function (item) 
						{
							deep.when(deep.request.post(item.value, uri, options)).then(function (result) 
							{
								self.running = false;
								deep.chain.nextQueueItem.apply(self, [ result, null ]);
							}, 
							function (error) 
							{
								console.error("error : deep.post : ", error);
								if(options.continueIfErrors)
								{
									self.running = false;
									deep.chain.nextQueueItem.apply(self, [ null, error ]);
								}
								else
									self.reject(error);
							});
						})
					}
				}
				deep.chain.addInQueue.apply(this,[func()]);
				return this;
			},
			put:function(uri, options)
			{
				var self = this;
				function func(){
					return function(){
						self._entries.forEach(function (item) 
						{
							deep.when(DeepRequest.put(item.value, uri, options)).then(function (result) {
								self.running = false;
								deep.chain.nextQueueItem.apply(self, [ result, null]);
							}, 
							function (error) 
							{
								console.error("error : deep.put : ", error);
								if(options.continueIfErrors)
								{
									self.running = false;
									deep.chain.nextQueueItem.apply(self, [null, error]);
								}
								else
									self.reject(error);
							});
						})
					}
				}
				deep.chain.addInQueue.apply(this,[func()]);
				return this;
			},
			deeplink:function (path, applyMap) {
				var self = this;
				var func = function  (s,e) {
					console.log("deeplink plugin : path=",path);
					if(applyMap)
					{
						_APP.internalChange(path);
					}
					else
					{
						_APP.updateDeepLink(path);
					}

					self.running = false;
					deep.chain.nextQueueItem.apply(self, [true, null]);
				}
				deep.chain.addInQueue.apply(this,[func]);
				return this;
			},
			databind:function (parentSelector, options) {
				var self = this;
				var func = function  (s,e) {
					
					self.running = false;
					deep.chain.nextQueueItem.apply(self, [true, null]);
				}
				deep.chain.addInQueue.apply(this,[func]);
				return this;
			}
		}
	}

	deep.utils.up( layer.prototype, deep.Handler.prototype);

	//console.log("deep after lugin : ", layer)

	return layer;

});
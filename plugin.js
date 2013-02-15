if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}

define(function (require){
	//console.log("PLUGIN LOADED")
	var deep = require("deep/deep");
	var VC = require("deep-ui/view-controller");
	var AC = require("deep-ui/app-controller");

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
			},
			render:function (renderable) {
				var self = this;
				var func = function  (s,e) {
					
					var alls = [];
					if(renderable)
					{
						self._entries.forEach(function (entry) {
							alls.push(deep.ui.refreshRenderable.apply(renderable, [entry, true]));
						});
					}
					else
					{
						self._entries.forEach(function (entry) {
							if(typeof entry.refresh === 'function')
								alls.push(entry.refresh());
							else
								alls.push(JSON.stringify(entry.value));
						});
					}
					deep.all(alls)
					.done(function (results) {
						self.running = false;
						deep.chain.nextQueueItem.apply(self, [results, null]);
					})
					
				}
				deep.chain.addInQueue.apply(this,[func]);
				return this;
				
			}
		}
	}
	deep.ui = {
		appendTo:function (selector) {
			return function(rendered, nodes){
	            if(nodes)
	            {
	                var newNodes = $(rendered);
	                $(nodes).replaceWith(newNodes);
	                return newNodes;
	            }
	            return $(rendered).appendTo(selector);
	        }
		},
		prependTo:function (selector) {
			return function(rendered, nodes){
	            if(nodes)
	            {
	                var newNodes = $(rendered);
	                $(nodes).replaceWith(newNodes);
	                return newNodes;
	            }
	            return $(rendered).prependTo(selector);
	        }
		},
		htmlOf:function (selector) {
			return function(rendered, nodes){
	            if(nodes)
	            {
	                var newNodes = $(rendered);
	                $(nodes).replaceWith(newNodes);
	                return newNodes;
	            }
	            return $(selector).empty().html(rendered);
	        }
		},
		ViewController:VC,
		AppController:AC,
		refreshRenderable : function (context, useContextAsDefaultWhat) 
		{
			if(!this.how || this.condition === false)
				return false;
			if(this.condition)
				if(typeof this.condition === "function" && !this.condition())
					return false;
			context = context || this;
			var self = this;
			var objs = [];
			//console.log("view-controller will retrieve : from : ",this._deep_entry)
			if(this.what)
				objs.push(deep.request.retrieve(this.what, { callFunctions:true, root:context._deep_entry || context, acceptQueryThis:true }));
			if(typeof this.how === "string")
				objs.push(deep.request.retrieve(this.how, { callFunctions:false, root:context._deep_entry || context, acceptQueryThis:true }));
			if(typeof this.where === "string")
				objs.push(deep.request.retrieve(this.where, { callFunctions:false, root:context._deep_entry || context, acceptQueryThis:true }));

			return deep.all(objs)
			.done(function (results) {
				var what = (self.what)?results.shift():((useContextAsDefaultWhat)?context:{});
				if(what._isDQ_NODE_)
					what = what.value;
				var how = (typeof self.how === "string")?results.shift():self.how;
				var where = (typeof self.where === "string")?results.shift():self.where;
				try{
					self.rendered = how(what);
					if(where)
						self.nodes = where(self.rendered, self.nodes);
				}
				catch(e){
					console.log("Error while rendering : ", e);
					if(typeof self.fail === 'function')
						return self.fail(e) || e;
					return e;
				}
				if(typeof self.done === "function")
					return self.done(self.nodes || self.rendered) || self.nodes || self.rendered;
				return self.nodes || self.rendered; 
			})
			.fail(function  (error) {
				console.log("Error while rendering : ", error);
				if(typeof self.fail === 'function')
					return self.fail(error) || error;
				return error;
			})
		}
	}
	deep.utils.up( layer.prototype, deep.Handler.prototype);

	//console.log("deep after lugin : ", layer)

	return layer;

});
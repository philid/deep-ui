if(typeof define !== 'function'){
	var define = require('amdefine')(module);
	var swig = require("swig");
}

define(["require", "deep/deep", "deep-ui/view-controller", "deep-ui/app-controller", "deep-ui/inputs-data-binder"],
	function (require, deep, VC, AC, Binder){
	//console.log("PLUGIN LOADED")
	//var deep = require("deep/deep");

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
					//var binder = new Binder(parentSelector, self.entries[0], schema)
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
		swig:function (string, options) {
			options= options || {};
			return swig.compile(string);
		},
		appendTo:function (selector) {
			return function(rendered, nodes){
	            if(!force && nodes)
	            {
	                var newNodes = $(rendered);
	                $(nodes).replaceWith(newNodes);
	                return newNodes;
	            }
	            return $(rendered).appendTo(selector);
	        }
		},
		prependTo:function (selector, force) {
			return function(rendered, nodes){
				console.log("deep ui plugin PrepentTo");
	            if(!force && nodes)
	            {
	                var newNodes = $(rendered);
	                $(nodes).replaceWith(newNodes);
	                return newNodes;
	            }
	            return $(rendered).prependTo(selector);
	        }
		},
		replace:function (selector) {
			return function(rendered, nodes){
	            var newNodes = $(rendered);
	            $(selector).replaceWith(newNodes);
	            return newNodes;
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
		Binder:Binder,
		render:function (renderable, context) {
			return deep.ui.refreshRenderable.apply(renderable, [context || {}, true]);
		},
		refreshRenderable : function (context, dontKeepNodes) 
		{
			if(!this.how || this.condition === false)
				return false;
			if(this.condition)
				if(typeof this.condition === "function" && !this.condition.apply(this))
					return false;
			context = context || this;
			var self = this;
			var objs = [];
			//console.log("view-controller will retrieve : from : ",this._deep_entry)

			if(this.what)
			{
				this.what = deep.interpret(this.what, context);
				objs.push(deep.request.retrieve(this.what, { callFunctions:true, root:context._deep_entry || context, acceptQueryThis:true }));
			}
			if(typeof this.how === "string")
				objs.push(deep.request.retrieve(this.how, { callFunctions:false, root:context._deep_entry || context, acceptQueryThis:true }));
			if(typeof this.where === "string")
				objs.push(deep.request.retrieve(this.where, { callFunctions:false, root:context._deep_entry || context, acceptQueryThis:true }));

			return deep.all(objs)
			.done(function (results) {
				var what = (self.what)?results.shift():context;
				if(what._isDQ_NODE_)
					what = what.value;
				var how = (typeof self.how === "string")?results.shift():self.how;
				var where = (typeof self.where === "string")?results.shift():self.where;
				var r = "";
				var nodes = self.nodes || null;
				try{
					r = how(what);
					if(where)
						nodes = where(r, nodes);
				}
				catch(e)
				{
					console.log("Error while rendering : ", e);
					if(typeof self.fail === 'function')
						return self.fail.apply(context, [e]) || e;
					return e;
				}
				if(!dontKeepNodes)
					self.nodes = nodes;
				if(typeof self.done === "function")
					return self.done.apply(context, [nodes, r, what]) || nodes || r;

				return nodes || r; 
			})
			.fail(function  (error) {
				console.log("Error while rendering : ", error);
				if(typeof self.fail === 'function')
					return self.fail.apply(context, [error]) || error;
				return error;
			})
		}
	}
	deep.utils.up( layer.prototype, deep.Handler.prototype);

	deep.linker = {
		addToPath:function (section) {
			if(section instanceof DeepHandler)
				section = section._entries[0].value;
			console.log(" DEEP.LINKER Add TO PATH : ", section)
		    var old = $.address.path();
		    if(old[old.length-1] != "/")
		    	old += "/";
		    $.address.path(old+section);
		},
		setPath:function (path) {
			$.address.path(path);
		}		
	}
	//console.log("deep after lugin : ", layer)

	return deep;

});

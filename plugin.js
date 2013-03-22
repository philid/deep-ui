if (typeof define !== 'function') {
	var define = require('amdefine')(module);
	var swig = require("swig");
}

define(["require", "deep/deep", "./view-controller", "./app-controller", "./inputs-data-binder"],

function(require, deep, VC, AC, Binder) {
	//console.log("PLUGIN LOADED")
	//var deep = require("deep/deep");

	var layer = {
		prototype: {
			post: function(uri, options) {
				options = options || {};
				var self = this;

				function func() {
					return function() {
						self._entries.forEach(function(item) {
							deep.when(deep.request.post(item.value, uri, options)).then(function(result) {
								self.running = false;
								deep.chain.nextQueueItem.apply(self, [result, null]);
							},

							function(error) {
								console.error("error : deep.post : ", error);
								if (options.continueIfErrors) {
									self.running = false;
									deep.chain.nextQueueItem.apply(self, [null, error]);
								} else self.reject(error);
							});
						});
					};
				}
				deep.chain.addInQueue.apply(this, [func()]);
				return this;
			},
			put: function(uri, options) {
				var self = this;

				function func() {
					return function() {
						self._entries.forEach(function(item) {
							deep.when(DeepRequest.put(item.value, uri, options)).then(function(result) {
								self.running = false;
								deep.chain.nextQueueItem.apply(self, [result, null]);
							},

							function(error) {
								console.error("error : deep.put : ", error);
								if (options.continueIfErrors) {
									self.running = false;
									deep.chain.nextQueueItem.apply(self, [null, error]);
								} else self.reject(error);
							});
						});
					};
				}
				deep.chain.addInQueue.apply(this, [func()]);
				return this;
			},
			deeplink: function(path, applyMap) {
				var self = this;
				var func = function(s, e) {
					console.log("deeplink plugin : path=", path);
					if (applyMap) {
						_APP.internalChange(path);
					} else {
						_APP.updateDeepLink(path);
					}

					self.running = false;
					deep.chain.nextQueueItem.apply(self, [true, null]);
				};
				deep.chain.addInQueue.apply(this, [func]);
				return this;
			},
			databind: function(parentSelector, options) {
				var self = this;
				var func = function(s, e) {
					//var binder = new Binder(parentSelector, self.entries[0], schema)
					self.running = false;
					deep.chain.nextQueueItem.apply(self, [true, null]);
				};
				deep.chain.addInQueue.apply(this, [func]);
				return this;
			},
			render: function(renderable) {
				var self = this;
				var func = function(s, e) {

					var alls = [];
					if (renderable) {
						self._entries.forEach(function(entry) {
							alls.push(deep.ui.applyRenderable.apply(renderable, [entry]));
						});
					} else {
						self._entries.forEach(function(entry) {
							if (typeof entry.refresh === 'function') alls.push(entry.refresh());
							else alls.push(JSON.stringify(entry.value));
						});
					}
					deep.all(alls)
						.done(function(results) {
						self.running = false;
						deep.chain.nextQueueItem.apply(self, [results, null]);
					});
				};
				deep.chain.addInQueue.apply(this, [func]);
				return this;
			}
		}
	};
	deep.ui = {
		swig: function(string, options) {
			options = options || {};
			return swig.compile(string);
		},
		appendTo: function(selector, force) {
			return function(rendered, nodes) {
				if (!force && nodes && nodes.parents('html').length > 0) {
					var newNodes = $(rendered);
					$(nodes).replaceWith(newNodes);
					return newNodes;
				}
				return $(rendered).appendTo(selector);
			};
		},
		prependTo: function(selector, force) {
			return function(rendered, nodes) {
				if (!force && nodes && nodes.parents('html').length > 0) {
					var newNodes = $(rendered);
					$(nodes).replaceWith(newNodes);
					return newNodes;
				}
				return $(rendered).prependTo(selector);
			};
		},
		replace: function(selector) {
			return function(rendered, nodes) {
				var newNodes = $(rendered);
				$(selector).replaceWith(newNodes);
				return newNodes;
			};
		},
		htmlOf: function(selector) {
			return function(rendered, nodes) {
				var newNodes = $(rendered);
				$(selector).empty();
				return newNodes.appendTo(selector);
			};
		},
		ViewController: VC,
		AppController: AC,
		Binder: Binder,
		render: function(renderable, context) {
			return deep.ui.applyRenderable.apply(renderable, [context || {}]);
		},
		applyRenderable: function(context) {
			if (!this.how || this.condition === false) return false;
			if (this.condition) if (typeof this.condition === "function" && !this.condition.apply(this)) return false;
			context = context || this;
			var self = this;
			var objs = [];
			//console.log("view-controller will retrieve : from : ",this._deep_entry)

			if (typeof this.what === 'string') {
				var what = deep.interpret(this.what, context);
				objs.push(deep.request.retrieve(what, {
					root: context._deep_entry || context,
					acceptQueryThis: true
				}));
			} else if (typeof this.what === 'function') {
				objs.push(this.what.apply(controller));
			} else if (this.what) objs.push(this.what);

			if (typeof this.how === "string") {
				var how = deep.interpret(this.how, context);
				objs.push(deep.request.retrieve(how, {
					root: context._deep_entry || context,
					acceptQueryThis: true
				}));
			}
			if (typeof this.where === "string") {
				var where = deep.interpret(this.where, context);
				objs.push(deep.request.retrieve(where, {
					root: context._deep_entry || context,
					acceptQueryThis: true
				}));
			}
			return deep.all(objs)
				.done(function(results) {
				var what = (self.what) ? results.shift() : context;
				if (what._isDQ_NODE_) what = what.value;
				var how = (typeof self.how === "string") ? results.shift() : self.how;
				var where = (typeof self.where === "string") ? results.shift() : self.where;
				var r = "";
				var nodes = self.nodes || null;
				try {
					r = how(what);
					if (where) nodes = where(r, nodes);
				} catch (e) {
					console.log("Error while rendering : ", e);
					if (typeof self.fail === 'function')
						return self.fail.apply(context, [e]) || e;
					return e;
				}
				//if(!dontKeepNodes)
				//	self.nodes = nodes;
				if (typeof self.done === "function")
					return self.done.apply(context, [nodes, r, what]) || [nodes, r, what];

				return nodes || r;
			})
			.fail(function(error) {
				console.log("Error while rendering : ", error);
				if (typeof self.fail === 'function')
					return self.fail.apply(context, [error]) || error;
				return error;
			});
		}
	};
	deep.utils.up(layer.prototype, deep.Handler.prototype);

	deep.linker = {
		addToPath: function(section) {
			if (section instanceof DeepHandler)
				section = section._entries[0].value;
			console.log(" DEEP.LINKER Add TO PATH : ", section);
			var old = $.address.path();
			if (old[old.length - 1] != "/")
				old += "/";
			$.address.path(old + section);
		},
		setPath: function(path) {
			$.address.path(path);
		}
	};

	deep.mediaCache = {
		cache:{},
		reloadablesUriDico : {},
		reloadablesRegExpDico : [ /^(json::)/gi /* ,/(\.json)$/gi */ ],
		clearCache:function ()
		{
			this.cache = {};
		}
	};

	var manageCache = function (response, uri) {
		if(deep.mediaCache.reloadablesUriDico[uri])
			return;
		var count = 0;
		reg = deep.mediaCache.reloadablesRegExpDico[count];
		while(reg && !uri.match(reg))
			reg = deep.mediaCache.reloadablesRegExpDico[++count];
		if(count == deep.mediaCache.reloadablesRegExpDico.length)
			deep.mediaCache.cache[uri] = response;
	}

	deep.stores.json = new deep.store.DeepStore();
	deep.utils.up({
			manageCache:manageCache,
			writeJQueryDefaultHeaders : function (req) {
				
			},
			get:function (id) {
				if(deep.mediaCache.cache[id])
					return deep(deep.mediaCache.cache[id]).store(this);
				var self = this;
				var d = deep($.ajax({
					beforeSend :function(req) {
						self.writeJQueryDefaultHeaders(req);
						req.setRequestHeader("Accept", "application/json; charset=utf-8");
					},
					contentType: "application/json; charset=utf-8",
					url:id,
					method:"GET",
					datatype:"json"
				})
				.done(function(data, msg, jqXHR){
					if(typeof data === 'string')
						data = JSON.parse(data);
					self.manageCache(data, id);
					return data;
				})
				.fail(function(){
					console.log("deep.store.json error : ", arguments);
					return new Error("deep.store.json failed : "+id+" - \n\n"+JSON.stringify(arguments));
				})).store(this);
				self.manageCache(d, id);
				return d;
			},
			put:function (object, id) {
				id = id || object.id;
				if(options.schema)
					deep(object)
					.validate(options.schema)
					.fail(function (error) {
						object = error;
					})
					.root(arr)
					.replace("./*?id="+id, object);
				else
					deep(arr)
					.replace("./*?id="+id, object);
				return deep(object).store(this);
			},
			post:function (object, id) {
				id = id || object.id;
				if(!id)
					object.id = id = new Date().valueOf(); // mongo styled id
				if(options.schema)
					deep(object)
					.validate(options.schema)
					.done(function (report) {
						arr.push(object);
					})
					.fail(function (error) {
						object = error;
					});
				else
					arr.push(object);
				return deep(object).store(this);
			},
			del:function (id) {
				return deep(arr).remove("./*?id="+id).store(this);
			},
			patch:function (object, id) {
				return deep(arr).query("./*?id="+id).up(object).store(this);
			}
	}, deep.stores.json);
	return deep;

});
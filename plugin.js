if (typeof define !== 'function') {
	var define = require('amdefine')(module);
	var swig = require("swig");
}

define(["require", "deep/deep", "./view-controller", "./app-controller", "./inputs-data-binder", "./stores/remote-json", , "./stores/html"],
function(require, deep, VC, AC, Binder)
{
	//_____________________________________________________________ Custom Chain Handler

	var layer = {
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
							alls.push(deep.applyTreatment.apply(renderable, [entry.value]));
						});
					} else {
						self._entries.forEach(function(entry) {
							if (typeof entry.value.refresh === 'function')
								alls.push(entry.value.refresh());
							else
								alls.push(JSON.stringify(entry.value));
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
	};
	deep.utils.up(layer, deep.Handler.prototype);

	//__________________________________________________________________________ Additional API

	deep.ui = {
		swig: function(string, options) {
			options = options || {};
			return swig.compile(string);
		},
		appendTo: function(selector, force) {
			return function(rendered, nodes) {
				//console.log("deep.ui.appendTo : ", rendered, nodes, selector)
				if (!force && nodes && nodes.parents('html').length > 0) {
					var newNodes = $(rendered);
					$(nodes).replaceWith(newNodes);
					return newNodes;
				}
				nodes = $(rendered).appendTo(selector);
				//console.log("appendto : appended : ", $(selector));
				return nodes;
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
			return deep.applyTreatment.apply(renderable, [context || {}]);
		}
	};

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

	//___________________________________ STORES

	deep.mediaCache = {
		cache:{},
		reloadablesUriDico : {},
		reloadablesRegExpDico : [ /^(json::)/gi /* ,/(\.json)$/gi */ ],
		clearCache:function ()
		{
			this.cache = {};
		},
		manage:function (response, uri) {
			//console.log("manage cache : ", response, uri);
			if(this.reloadablesUriDico[uri])
				return;
			var count = 0;
			reg = this.reloadablesRegExpDico[count];
			while(reg && !(reg.test(uri)))
				reg = this.reloadablesRegExpDico[++count];
			if(count == this.reloadablesRegExpDico.length)
			{
				this.cache[uri] = response;
				//console.log("deep-ui : deep.mediaCache.manage : retain !!!")
			}
		}
	};



	//__________________________________________________

	deep.stores["dom.appendTo"] = {
		get:function (selector, options) {
			return deep.ui.appendTo(selector);
		}
	};
	deep.stores["dom.prependTo"] = {
		get:function (selector, options) {
			return deep.ui.prependTo(selector);
		}
	};
	deep.stores["dom.htmlOf"] = {
		get:function (selector, options) {
			return deep.ui.htmlOf(selector);
		}
	};
	deep.stores["dom.replace"] = {
		get:function (selector, options) {
			return deep.ui.replace(selector);
		}
	};
	return deep;
});
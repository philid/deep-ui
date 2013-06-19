if (typeof define !== 'function') {
	var define = require('amdefine')(module);
	var swig = require("swig");
}

define(["require", "deep/deep", "./view-controller", "./app-controller", "./inputs-data-binder", "./stores/json", "./stores/ajax", "./stores/xml", "./stores/html"],
function(require, deep, VC, AC, Binder)
{
	//_____________________________________________________________ Custom Chain Handler

	var layer = {
			deeplink: function(path, applyMap) {
				var infos = path;
				var params =null;
				if(typeof path === 'object')
				{
					params = infos.parameters;
					path = infos.path
				}
				var self = this;
				var func = function(s, e) {
					console.log("deeplink plugin : path=", infos);
					if (applyMap) {
						_APP.internalChange(path, params);
					} else {
						_APP.updateDeepLink(path, params);
					}

					self.running = false;
					deep.chain.nextQueueItem.apply(self, [true, null]);
				};
				deep.chain.addInQueue.apply(this, [func]);
				return this;
			}
	};
	deep.utils.up(layer, deep.Chain.prototype);

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
				$(selector).empty();
				return $(rendered).appendTo(selector);
			};
		},
		ViewController: VC,
		AppController: AC,
		Binder: Binder,
		render: function( how, what) {
			return deep(deep.getAll([how, what]))
			.done(function  (results) {
				how = results.shift();
				what = results.shift();
				return how(what);
			});
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

	deep.ui.toDataPath = function (object, selector, schema) {
		var binder = new Binder();
		binder.init(selector, object, schema);
		return deep(binder);
	}

	deep.ui.fromDataPath = function (selector, schema) {
		var binder = new Binder();
		binder.init(selector, null, schema);
		return deep(binder.toDatas());
	}


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
	deep.protocoles.dom = {};
	deep.protocoles.dom.appendTo = {
		name:"dom.appendTo",
		get:function (selector, options) {
			//console.log("deep.protocoles.dom.appendTO : ", selector)
			return deep.ui.appendTo(selector);
		}
	};
	deep.protocoles.dom.prependTo = {
		name:"dom.prependTo",
		get:function (selector, options) {
			return deep.ui.prependTo(selector);
		}
	};
	deep.protocoles.dom.htmlOf = {
		name:"dom.htmlOf",
		get:function (selector, options) {
			return deep.ui.htmlOf(selector);
		}
	};
	deep.protocoles.dom.replace = {
		name:"dom.replace",
		get:function (selector, options) {
			return deep.ui.replace(selector);
		}
	};
	return deep;
});
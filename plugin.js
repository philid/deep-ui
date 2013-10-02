if (typeof define !== 'function') {
	var define = require('amdefine')(module);
	var swig = require("swig");
}

define(["require", "deep/deep", "./view-controller", "./app-controller", "./inputs-data-binder", "./stores/json", "./stores/ajax", "./stores/xml", "./stores/html", "./html-binder"],
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
					smart.app.internalChange(path, params);
				} else {
					smart.app.updateDeepLink(path, params);
				}
				return true;
			};
			deep.chain.addInChain.apply(this, [func]);
			return this;
		}
	};
	deep.utils.up(layer, deep.Chain.prototype);

	//__________________________________________________________________________ Additional API

	deep.ui = {
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
				section = section._nodes[0].value;
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




	//__________________________________________________
	deep.protocoles.dom = {};
	deep.protocoles.dom.appendTo = function (selector, options) {
		return deep.ui.appendTo(selector);
	}
	deep.protocoles.dom.prependTo = function (selector, options) {
		return deep.ui.prependTo(selector);
	}
	deep.protocoles.dom.htmlOf = function (selector, options) {
		return deep.ui.htmlOf(selector);
	}
	deep.protocoles.dom.replace = function (selector, options) {
		return deep.ui.replace(selector);
	}
    deep.Chain.addHandle("refresh", function()
	{
		var args= arguments;
		var self = this;
		var func = function(s,e)
		{
			var alls = [];
			deep.chain.each(self, function (v) {
				if(typeof v.refresh === "function")
					alls.push(v.refresh.apply(v,args));
				else
					alls.push(v);
			})
			return deep.all(alls)
			.done(function(alls){
				if(!self._queried)
					return alls.shift();
				return alls;
			});
		}
		func._isDone_ = true;
		deep.chain.addInChain.apply(self,[func]);
		return this;
	});
	require("./html-binder")(deep);
	return deep;
});





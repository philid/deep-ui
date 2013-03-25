if (typeof define !== 'function') {
	var define = require('amdefine')(module);
	var swig = require("swig");
}

define(["require", "deep/deep", "./view-controller", "./app-controller", "./inputs-data-binder"],
function(require, deep, VC, AC, Binder)
{
	//_____________________________________________________________ Custom Chain Handler

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
		}
	};
	deep.utils.up(layer.prototype, deep.Handler.prototype);

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
		}
	};

	var manageCache = function (response, uri) {
		console.log("manage cache : ", response, uri);
		if(deep.mediaCache.reloadablesUriDico[uri])
			return;
		var count = 0;
		reg = deep.mediaCache.reloadablesRegExpDico[count];
		while(reg && !(reg.test(uri)))
			reg = deep.mediaCache.reloadablesRegExpDico[++count];
		if(count == deep.mediaCache.reloadablesRegExpDico.length)
		{
			deep.mediaCache.cache[uri] = response;
			console.log("deep-ui : manageCache : retain !!!")
		}
	};

	var writeJQueryDefaultHeaders = function (req) {};

	//___________________________ JSON

	deep.stores.json = new deep.store.DeepStore();

	deep.stores.json.extensions = [
		/(\.json(\?.*)?)$/gi
	];
	deep.stores.json.get = function (id, options) {
		//console.log("json.get : ", id);
		var noCache = true;
		for (var i = 0; i < this.extensions.length; ++i) {
			if(this.extensions[i].test(id))
			{
				noCache = false;
				break;
			}
		};

		var d = null;
		if(!noCache && id !== "" && deep.mediaCache.cache[id])
		{
			d = deep(deep.mediaCache.cache[id]).store(this);
			if(deep.mediaCache.cache[id] instanceof Array)
				d.query("./*");
			return d;
		}
		var self = this;
		d = deep($.ajax({
			beforeSend :function(req) {
				writeJQueryDefaultHeaders(req);
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
			if(!noCache && (options && options.cache !== false)  || (self.options && self.options.cache !== false))
				manageCache(data, id);

			return data;
		})
		.fail(function(){
			console.log("deep.store.json error : ", arguments);
			return new Error("deep.store.json failed : "+id+" - \n\n"+JSON.stringify(arguments));
		}))
		.done(function (datas) {
			//console.log("json.get : result : ", datas);
			if(datas instanceof Array)
				d._entries = deep(datas).query("./*").nodes();
			else
				d._entries = [deep.Querier.createRootNode(datas)];
			return datas;
		})
		.store(this)
		.done(function (success) {
			//console.log("json.get : result 2 : ", success);
			d.range = deep.Handler.range;
		});
		if(!noCache && (options && options.cache !== false)  || (self.options && self.options.cache !== false))
			manageCache(d, id);

		//console.log("json.get : handler ? ", d instanceof deep.Handler);
		return d;
	};
	deep.stores.json.put = function (object, id) {
		var self = this;
		var d = null;
		return d = deep($.ajax({
			beforeSend :function(req) {
				writeJQueryDefaultHeaders(req);
				req.setRequestHeader("Accept", "application/json; charset=utf-8;");
			},
			type:"PUT",
			url:id,
			dataType:"application/json; charset=utf-8;",
			contentType:"application/json; charset=utf-8;",
			data:JSON.stringify(object)
		})
		.fail(function  (jqXHR, textStatus, errorThrown) {
			var test = $.parseJSON(jqXHR.responseText);
			if(jqXHR.status < 300)
			{
				//console.log("DeepRequest.post : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				if(typeof test === 'string')
					test = $.parseJSON(test);
				return test;
			}
			else
			{
				return new Error("deep.store.json.put failed : "+id+" - details : "+JSON.stringify(arguments));
			}
		}))
		.store(this)
		.done(function (argument) {
			d.range = deep.Handler.range;
		});
	};
	deep.stores.json.post = function (object, id) {
		var self = this;
		var d = null;
		return d = deep($.ajax({
			beforeSend :function(req) {
				writeJQueryDefaultHeaders(req);
				req.setRequestHeader("Accept", "application/json; charset=utf-8;");
			},
			type:"POST",
			url:id,
			dataType:"application/json; charset=utf-8;",
			contentType:"application/json; charset=utf-8;",
			data:JSON.stringify(object)
		})
		.fail(function  (jqXHR, textStatus, errorThrown) {
			var test = $.parseJSON(jqXHR.responseText);
			if(jqXHR.status < 300)
			{
				//console.log("DeepRequest.post : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				if(typeof test === 'string')
					test = $.parseJSON(test);
				return test;
			}
			else
			{
				return new Error("deep.store.json.post failed : "+id+" - details : "+JSON.stringify(arguments));
			}
		}))
		.store(this)
		.done(function (argument) {
			d.range = deep.Handler.range;
		});
	};
	deep.stores.json.del = function (id) {
		var self = this;
		var d = null;
		return d = deep($.ajax({
			beforeSend :function(req) {
				writeJQueryDefaultHeaders(req);
				req.setRequestHeader("Accept", "application/json; charset=utf-8;");
			},
			type:"DELETE",
			url:id
		})
		.fail(function  (jqXHR, textStatus, errorThrown) {
			var test = $.parseJSON(jqXHR.responseText);
			if(jqXHR.status < 300)
			{
				//console.log("DeepRequest.post : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				if(typeof test === 'string')
					test = $.parseJSON(test);
				return test;
			}
			else
			{
				return new Error("deep.store.json.del failed : "+id+" - details : "+JSON.stringify(arguments));
			}
		}))
		.store(this)
		.done(function (argument) {
			d.range = deep.Handler.range;
		});
	};
	deep.stores.json.patch = function (object, id) {
		var self = this;
		var d = null;
		return d = deep($.ajax({
			beforeSend :function(req) {
				writeJQueryDefaultHeaders(req);
				req.setRequestHeader("Accept", "application/json; charset=utf-8;");
			},
			type:"PATCH",
			url:id,
			dataType:"application/json; charset=utf-8;",
			contentType:"application/json; charset=utf-8;",
			data:JSON.stringify(object)
		})
		.fail(function  (jqXHR, textStatus, errorThrown)
		{
			var test = $.parseJSON(jqXHR.responseText);
			if(jqXHR.status < 300)
			{
				//console.log("DeepRequest.post : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				if(typeof test === 'string')
					test = $.parseJSON(test);
				return test;
			}
			else
				return new Error("deep.store.json.patch failed : "+id+" - details : "+JSON.stringify(arguments));
				//deferred.reject({msg:"DeepRequest.patch failed : "+info.request, status:jqXHR.status, details:arguments, uri:id});
		}))
		.store(this)
		.done(function (argument) {
			d.range = deep.Handler.range;
		});
	};
	deep.stores.json.bulk = function (arr, uri, options) {
		var self = this;
		var d = null;
		return d = deep($.ajax({
			beforeSend :function(req) {
				writeJQueryDefaultHeaders(req);
				req.setRequestHeader("Accept", "application/json; charset=utf-8;");
			},
			type:"POST",
			url:uri,
			dataType:"message/json; charset=utf-8;",
			contentType:"message/json; charset=utf-8;",
			data:JSON.stringify(arr)
		})
		.fail(function  (jqXHR, textStatus, errorThrown)
		{
			var test = $.parseJSON(jqXHR.responseText);
			if(jqXHR.status < 300)
			{
				if(typeof test === 'string')
					test = $.parseJSON(test);
				return test;
			}
			else
				return new Error("deep.store.json.bulk failed : "+uri+" - details : "+JSON.stringify(arguments));
		}))
		.store(this)
		.done(function () {
			d.range = deep.Handler.range;
		});
	};
	deep.stores.json.rpc = function (method, params, id) {
		var self = this;
		var callId = "call"+new Date().valueOf();
		var d = null;
		return d = deep($.ajax({
			beforeSend :function(req) {
				writeJQueryDefaultHeaders(req);
				req.setRequestHeader("Accept", "application/json; charset=utf-8;");
			},
			type:"PATCH",
			url:id,
			dataType:"application/json; charset=utf-8;",
			contentType:"application/json; charset=utf-8;",
			data:JSON.stringify({
				id:callId,
				method:method,
				params:params||[]
			})
		})
		.fail(function  (jqXHR, textStatus, errorThrown)
		{
			var test = $.parseJSON(jqXHR.responseText);
			if(jqXHR.status < 300)
			{
				//console.log("DeepRequest.post : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				if(typeof test === 'string')
					test = $.parseJSON(test);
				return test;
			}
			else
				return new Error("deep.store.json.patch failed : "+id+" - details : "+JSON.stringify(arguments));
				//deferred.reject({msg:"DeepRequest.patch failed : "+info.request, status:jqXHR.status, details:arguments, uri:id});
		}))
		.store(this)
		.done(function (argument) {
			d.range = deep.Handler.range;
		});
	};
	deep.stores.json.range = function (arg1, arg2, uri, options) {
		var self = this;
		var start = arg1, end = arg2;
		var def = deep.Deferred();
		if(typeof start === 'object')
		{
			start = start.step*start.width;
			end = ((start.step+1)*start.width)-1;
		}
		function success(jqXHR, data){
			//console.log("range succes : arguments : ", arguments);
			var rangePart = [];
			var rangeResult = {};
			var headers = jqXHR.getResponseHeader("content-range");
			headers = headers.substring(6);
			//console.log("browse ajax rrsult : headers " + JSON.stringify(headers))
			if(headers)
				rangePart = headers.split('/');

			if(headers && rangePart && rangePart.length > 0)
			{
				rangeResult.range = rangePart[0];
				if(rangeResult.range == "0--1")
				{
					rangeResult.totalCount = 0;
					rangeResult.start = 0;
					rangeResult.end = 0;
				}
				else
				{
					rangeResult.totalCount = parseInt(rangePart[1], 10);
					var spl = rangePart[0].split("-");
					rangeResult.start = parseInt(spl[0], 10);
					rangeResult.end = parseInt(spl[1], 10);
				}
			}
			else
				console.log("ERROR deep.stores.json.range : range header missing !! ");
			rangeResult = deep.utils.createStartEndRangeObject(rangeResult.start, rangeResult.end, rangeResult.totalCount);
			rangeResult.results = data;
			return rangeResult;
		}
		$.ajax({
			beforeSend :function(req) {
				req.setRequestHeader("Accept", "application/json; charset=utf-8");
				req.setRequestHeader("range", "items=" +start+"-"+end);
			},
			type:"GET",
			url:uri,
			dataType:"application/json",
			contentType:"application/json; charset=utf-8"

		}).then(function(data, text, jqXHR) {
			return def.resolve(success(jqXHR, data));
		}, function  (jqXHR, statusText, errorThrown) {
			//console.log("range failed : ", arguments);
			if(jqXHR.status == 200 || jqXHR.status == 206)
				def.resolve(success(jqXHR, JSON.parse(jqXHR.responseText)));
			else
				def.reject(new Error("deep.store.json.range failed : details : "+JSON.stringify(arguments)));
		});

		var d = deep(deep.promise(def))
		.fail(function (argument) {
			return error;
		})
		.done(function (rangeObject) {
			d._entries = deep(rangeObject.results).query("./*").nodes();
			//console.log("d._entries : ", d._entries)
			return rangeObject;
		})
		.store(this)
		.done(function (argument) {
			d.range = deep.Handler.range;
		});
		return d;
	};
	deep.stores.json.create = function (name, uri, options) {
		var store = deep.utils.bottom(deep.stores.json, {
			options:options,
			get:deep.compose.around(function (old) {
				return function (id, options) {
					if(id == "?" || !id)
						id = "";
					return old.apply(this,[uri+id, options]);
				};
			}),
			post:deep.compose.around(function (old) {
				return function (object, id, options) {
					return old.apply(this,[object, uri+id, options]);
				};
			}),
			put:deep.compose.around(function (old) {
				return function (object, id, options) {
					return old.apply(this,[object, uri+id, options]);
				};
			}),
			patch:deep.compose.around(function (old) {
				return function (object, id, options) {
					return old.apply(this,[object, uri+id, options]);
				};
			}),
			del:deep.compose.around(function (old) {
				return function (id, options) {
					return old.apply(this,[uri+id, options]);
				};
			}),
			rpc:deep.compose.around(function (old) {
				return function (method, params, id, options) {
					return old.apply(this,[method, params, uri+id, options]);
				};
			}),
			range:deep.compose.around(function (old) {
				return function (start, end, options) {
					return old.apply(this,[start, end, uri, options]);
				};
			}),
			create:deep.collider.remove()
		});
		deep.stores[name] = store;
		return store;
	};
	//__________________________________________________
	deep.stores.html = new deep.store.DeepStore();
	deep.stores.html.extensions = [
		/(\.(html|htm|xhtm|xhtml)(\?.*)?)$/gi
	];
	deep.stores.html.get = function (id, options) {
		options = options || {};
		if(options.cache !== false && deep.mediaCache.cache[id])
			return deep(deep.mediaCache.cache[id]).store(this);
		var self = this;
		var d = deep($.ajax({
			beforeSend :function(req) {
				writeJQueryDefaultHeaders(req);
				req.setRequestHeader("Accept", "text/plain; charset=utf-8");
			},
			contentType: "text/plain; charset=utf-8",
			url:id,
			method:"GET"
		})
		.done(function(data, msg, jqXHR){
			if(options.cache !== false || (self.options && self.options.cache !== false))
				manageCache(data, id);
			return data;
		})
		.fail(function(){
			console.log("deep.store.html error : ", arguments);
			return new Error("deep.store.html failed : "+id+" - \n\n"+JSON.stringify(arguments));
		})).store(this);
		if(options.cache !== false || (self.options && self.options.cache !== false))
			manageCache(d, id);
		return d;
	};
	//__________________________________________________
	deep.stores.swig = new deep.store.DeepStore();
	deep.stores.swig.extensions = [
		/(\.(swig)(\?.*)?)$/gi
	];
	deep.stores.swig.get = function (id, options) {
		options = options || {};
		if(options.cache !== false && deep.mediaCache.cache["swig::"+id])
			return deep(deep.mediaCache.cache["swig::"+id]).store(this);
		var self = this;
		var d = deep.stores.html.get(id, {cache:false})
		.done(function (data) {
			var resi = swig.compile(data, { filename:deep.utils.stripFirstSlash(id) });
			delete deep.mediaCache.cache["swig::"+id];
			if((options && options.cache !== false)  || (self.options && self.options.cache !== false))
				manageCache(resi, "swig::"+id);
			return resi;
		})
		.store(this);
		if((options && options.cache !== false)  || (self.options && self.options.cache !== false))
			manageCache(d, "swig::"+id);
		return d;
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
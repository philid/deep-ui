if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(function (require)
{

	var deep = require("deep/deep");
	var writeJQueryDefaultHeaders = function (req) {};

	//___________________________ JSON

	deep.stores.json = new deep.store.DeepStore();

	deep.stores.json.extensions = [
		/(\.json(\?.*)?)$/gi
	];
	deep.stores.json.get = function (id, options) {
		//console.log("deep.stores.json.get : ", id);
		var noCache = true;
		if(id !== "")
			for (var i = 0; i < this.extensions.length; ++i)
			{
				var res = id.match(this.extensions[i]);
				if(res && res.length > 0)
				{
					noCache = false;
					break;
				}
			}
		if(!noCache && id !== "" && deep.mediaCache.cache[id])
			return deep(deep.mediaCache.cache[id]).store(this);

		var self = this;
		var d = deep($.ajax({
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
				deep.mediaCache.manage(data, id);
		//	console.log("deep.stores.json.get results : ", data);
			return data;
		})
		.fail(function(){
			console.log("deep.store.json.get error : ",id," - ", arguments);
			return new Error("deep.store.json failed : "+id+" - \n\n"+JSON.stringify(arguments));
		}))
		.done(function (datas, handler) {
			//console.log("json.get : result : ", datas);
			return deep(datas).nodes(function (nodes) {
				handler._entries = nodes;
			});
		})
		.store(this)
		.done(function (success, handler) {
			//console.log("json.get : "+id+" : result : ", success);
			handler.range = deep.Chain.range;
			
		});
		if(!noCache && (options && options.cache !== false)  || (self.options && self.options.cache !== false))
			deep.mediaCache.manage(d, id);
		return d;
	};
	deep.stores.json.put = function (object, id) {
		var self = this;
		var def = deep.Deferred();
		$.ajax({
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
		.done(function (success) {
			def.resolve(success);
		})
		.fail(function  (jqXHR, textStatus, errorThrown) {
			if(jqXHR.status < 300)
			{
				var test = $.parseJSON(jqXHR.responseText);
				//console.log("DeepRequest.post : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				if(typeof test === 'string')
					test = $.parseJSON(test);
				def.resolve(test);
			}
			else
				def.reject(new Error("deep.store.json.put failed : "+id+" - details : "+JSON.stringify(arguments)));
		});
		return deep(deep.promise(def))
		.store(this)
		.done(function (success, handler) {
			handler.range = deep.Chain.range;
		});
	};
	deep.stores.json.post = function (object, id) {
		var self = this;
		var def = deep.Deferred();
		$.ajax({
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
		.done(function (success) {
			def.resolve(success);
		})
		.fail(function  (jqXHR, textStatus, errorThrown) {
			var test = $.parseJSON(jqXHR.responseText);
			if(jqXHR.status < 300)
			{
				//console.log("DeepRequest.post : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				if(typeof test === 'string')
					test = $.parseJSON(test);
				def.resolve(test);
			}
			else
			{
				def.reject(new Error("deep.store.json.post failed : "+id+" - details : "+JSON.stringify(arguments)));
			}
		});
		return deep(deep.promise(def))
		.store(this)
		.done(function (success, handler) {
			handler.range = deep.Chain.range;
		});
	};
	deep.stores.json.del = function (id) {
		var self = this;
		var def = deep.Deferred();
		$.ajax({
			beforeSend :function(req) {
				writeJQueryDefaultHeaders(req);
				req.setRequestHeader("Accept", "application/json; charset=utf-8;");
			},
			type:"DELETE",
			url:id
		})
		.done(function (success) {
			def.resolve(success);
		})
		.fail(function  (jqXHR, textStatus, errorThrown) {
			var test = $.parseJSON(jqXHR.responseText);
			if(jqXHR.status < 300)
			{
				//console.log("DeepRequest.post : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				if(typeof test === 'string')
					test = $.parseJSON(test);
				def.resolve(test);
			}
			else
			{
				def.reject(new Error("deep.store.json.del failed : "+id+" - details : "+JSON.stringify(arguments)));
			}
		});
		return deep(deep.promise(def))
		.store(this)
		.done(function (success, handler) {
			handler.range = deep.Chain.range;
		});
	};
	deep.stores.json.patch = function (object, id) {
		var self = this;
		var def = deep.Deferred();
		$.ajax({
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
		.done(function (success) {
			def.resolve(success);
		})
		.fail(function  (jqXHR, textStatus, errorThrown)
		{
			if(jqXHR.status < 300)
			{
				var test = $.parseJSON(jqXHR.responseText);
				//console.log("DeepRequest.post : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				if(typeof test === 'string')
					test = $.parseJSON(test);
				def.resolve(test);
			}
			else
				def.reject(new Error("deep.store.json.patch failed : "+id+" - details : "+JSON.stringify(arguments)));
				//deferred.reject({msg:"DeepRequest.patch failed : "+info.request, status:jqXHR.status, details:arguments, uri:id});
		});
		return deep(deep.promise(def))
		.store(this)
		.done(function (argument, handler) {
			handler.range = deep.Chain.range;
		});
	};
	deep.stores.json.bulk = function (arr, uri, options) {
		var self = this;
		var def = deep.Deferred();
		$.ajax({
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
		.done(function (success) {
			def.resolve(success);
		})
		.fail(function  (jqXHR, textStatus, errorThrown)
		{
			if(jqXHR.status < 300)
			{
				var test = $.parseJSON(jqXHR.responseText);
				if(typeof test === 'string')
					test = $.parseJSON(test);
				def.resolve(test);
			}
			else
				def.reject(new Error("deep.store.json.bulk failed : "+uri+" - details : "+JSON.stringify(arguments)));
		});
		return deep(deep.promise(def))
		.store(this)
		.done(function (success, handler) {
			handler.range = deep.Chain.range;
		});
	};
	deep.stores.json.rpc = function (method, params, id) {
		var self = this;
		var callId = "call"+new Date().valueOf();
		var def = deep.Deferred();
		$.ajax({
			beforeSend :function(req) {
				writeJQueryDefaultHeaders(req);
				req.setRequestHeader("Accept", "application/json; charset=utf-8;");
			},
			type:"POST",
			url:id,
			//dataType:"application/json-rpc; charset=utf-8;",
			contentType:"application/json-rpc; charset=utf-8;",
			data:JSON.stringify({
				id:callId,
				method:method,
				params:params||[]
			})
		})
		.done(function (success) {
			def.resolve(success);
		})
		.fail(function  (jqXHR, textStatus, errorThrown)
		{
			if(jqXHR.status < 300)
			{
				var test = $.parseJSON(jqXHR.responseText);
				if(typeof test === 'string')
					test = $.parseJSON(test);
				def.resolve(test);
			}
			else
				def.reject(new Error("deep.store.json.rpc failed : "+id+" - details : "+JSON.stringify(arguments)));
		});
		return deep(deep.promise(def))
		.store(this)
		.done(function (success, handler) {
			handler.range = deep.Chain.range;
		});
	};
	deep.stores.json.range = function (arg1, arg2, query, options)
	{
		var self = this;
		var start = arg1, end = arg2;
		var def = deep.Deferred();
		if(typeof start === 'object')
		{
			start = start.step*start.width;
			end = ((start.step+1)*start.width)-1;
		}
		function success(jqXHR, data){
			var rangePart = [];
			var rangeResult = {};
			var headers = jqXHR.getResponseHeader("content-range");
			headers = headers.substring(6);
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
			rangeResult = deep.utils.createRangeObject(rangeResult.start, rangeResult.end, rangeResult.totalCount);
			rangeResult.results = data;
			return rangeResult;
		}
		$.ajax({
			beforeSend :function(req) {
				req.setRequestHeader("Accept", "application/json; charset=utf-8");
				req.setRequestHeader("range", "items=" +start+"-"+end);
			},
			type:"GET",
			url:query,
			dataType:"application/json",
			contentType:"application/json; charset=utf-8"

		}).then(function(data, text, jqXHR) {
			return def.resolve(success(jqXHR, data));
		}, function  (jqXHR, statusText, errorThrown) {
			if(jqXHR.status == 200 || jqXHR.status == 206)
				def.resolve(success(jqXHR, JSON.parse(jqXHR.responseText)));
			else
				def.reject(new Error("deep.store.json.range failed : details : "+JSON.stringify(arguments)));
		});

		return deep(deep.promise(def))
		.done(function (rangeObject, handler) {
			handler._entries = deep(rangeObject.results).nodes();
			return rangeObject;
		})
		.store(this)
		.done(function (success, handler) {
			handler.range = deep.Chain.range;
		});
	};
	deep.stores.json.create = function (name, uri, options)
	{
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
					id = id || "";
					return old.apply(this,[object, uri+id, options]);
				};
			}),
			put:deep.compose.around(function (old) {
				return function (object, id, options) {
					id = id || "";
					return old.apply(this,[object, uri+id, options]);
				};
			}),
			patch:deep.compose.around(function (old) {
				return function (object, id, options) {
					id = id || "";
					return old.apply(this,[object, uri+id, options]);
				};
			}),
			del:deep.compose.around(function (old) {
				return function (id, options) {
					id = id || "";
					return old.apply(this,[uri+id, options]);
				};
			}),
			rpc:deep.compose.around(function (old) {
				return function (method, params, id, options) {
					id = id || "";
					return old.apply(this,[method, params, uri+id, options]);
				};
			}),
			bulk:deep.compose.around(function (old) {
				return function (arr, id, options) {
					id = id || "";
					return old.apply(this,[arr, uri+id, options]);
				};
			}),
			range:deep.compose.around(function (old) {
				return function (start, end, query, options) {
					query = query || "";
					return old.apply(this,[start, end, uri+query, options]);
				};
			}),
			create:deep.collider.remove()
		});
		deep.stores[name] = store;
		store.name = name;
		return store;
	};
	return deep.stores.json;

});
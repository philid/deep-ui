if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(["require","deep-ui/stores/ajax"],function (require)
{

	var deep = require("deep/deep");
	//___________________________ JSON
	deep.protocoles.json = new deep.Store();
	deep.utils.bottom(deep.protocoles.ajax, deep.protocoles.json);
	deep.protocoles.json.name = "json";
	deep.protocoles.json.extensions = [
		/(\.json(\?.*)?)$/gi
	];
	deep.extensions.push({
		store:deep.protocoles.json,
		extensions:deep.protocoles.json.extensions
	});
	return deep.protocoles.json;
	/*

	deep.protocoles.json.writeJQueryDefaultHeaders = function (req) {
		req.setRequestHeader("Accept", "application/json; charset=utf-8"); 
		req.setRequestHeader("Content-type", "application/json; charset=utf-8"); 
	};

	deep.protocoles.json.dataType = "json";
	deep.protocoles.json.extensions = [
		/(\.json(\?.*)?)$/gi
	];
	deep.protocoles.json.get = function (id, options) {
		//console.log("deep.protocoles.json.get : ", id);
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
				self.writeJQueryDefaultHeaders(req);
			},
			contentType: "application/json; charset=utf-8",
			url:id,
			method:"GET"
		})
		.done(function(data, msg, jqXHR){
			if(typeof data === 'string')
				data = JSON.parse(data);
			if(!noCache && (options && options.cache !== false)  || (self.options && self.options.cache !== false))
				deep.mediaCache.manage(data, id);
		//	console.log("deep.protocoles.json.get results : ", data);
			return data;
		})
		.fail(function(){
			console.log("deep.store.json.get error : ",id," - ", arguments);
			return new Error("deep.store.json failed : "+id+" - \n\n"+JSON.stringify(arguments));
		}))
		.done(function (datas) {
			//console.log("json.get : result : ", datas);
			var handler = this;
			return deep(datas).nodes(function (nodes) {
				handler._nodes = nodes;
			});
		})
		.store(this)
		.done(function (success) {
			//console.log("json.get : "+id+" : result : ", success);
			this.range = deep.Chain.range;
		});
		if(!noCache && (options && options.cache !== false)  || (self.options && self.options.cache !== false))
			deep.mediaCache.manage(d, id);
		return d;
	};
	deep.protocoles.json.put = function (object, options) {
		options = options || {};
		var id = object.id || options.id;
		if(options.uri)
			id = options.uri+id;
		var self = this;
		var def = deep.Deferred();
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
			},
			type:"PUT",
			url:id,
			dataType:self.dataType,
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
		.done(function (success) {
			this.range = deep.Chain.range;
		});
	};
	deep.protocoles.json.post = function (object, options) {
		//console.log("deep.store.ajax : post : ", object, options);
		options = options || {};
		var id = object.id || options.id;
		if(options.uri)
			id = options.uri+((id)?id:"");
		var self = this;
		var def = deep.Deferred();
		//console.log("post on : ", id);
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
			},
			type:"POST",
			url:id,
			//processData:false,
			//dataType:self.dataType,
			data:( typeof object === 'string')?object:JSON.stringify(object)
		})
		.done(function (success) {
			//console.log("deep.store.ajax.success : ", success);
			def.resolve(success);
		})
		.fail(function  (jqXHR, textStatus, errorThrown) {
			//console.log("deep.store.ajax.fail : ", textStatus);
			var test = $.parseJSON(jqXHR.responseText);
			if(jqXHR.status < 300 && textStatus !== 'error')
			{
				//console.log("DeepRequest.post : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				if(typeof test === 'string')
					test = $.parseJSON(test);
				def.resolve(test);
			}
			else
				def.reject(new Error("deep.store.json.post failed : "+id+" - details : "+JSON.stringify(arguments)));
		});
		return deep(deep.promise(def))
		.store(this)
		.done(function (success) {
			this.range = deep.Chain.range;
		});
	};
	deep.protocoles.json.del = function (id) {
		var self = this;
		var def = deep.Deferred();
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
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
		.done(function (success) {
			this.range = deep.Chain.range;
		});
	};
	deep.protocoles.json.patch = function (object, options) {
		options = options || {};
		var id = object.id || options.id;
		if(options.uri)
			id = options.uri+id;
		var self = this;
		var def = deep.Deferred();
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
			},
			type:"PATCH",
			url:id,
			dataType:self.dataType,
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
		.done(function (argument) {
			this.range = deep.Chain.range;
		});
	};
	deep.protocoles.json.bulk = function (arr, uri, options) {
		var self = this;
		var def = deep.Deferred();
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
			},
			type:"POST",
			url:uri,
			dataType:self.dataType,
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
		.done(function (success) {
			this.range = deep.Chain.range;
		});
	};
	deep.protocoles.json.rpc = function (method, params, id) {
		var self = this;
		var callId = "call"+new Date().valueOf();
		var def = deep.Deferred();
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
			},
			type:"POST",
			url:id,
			//dataType:"application/json-rpc; charset=utf-8;",
			//dataType:self.dataType,
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
		.done(function (success) {
			this.range = deep.Chain.range;
		});
	};
	deep.protocoles.json.range = function (arg1, arg2, query, options)
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
				console.log("ERROR deep.protocoles.json.range : range header missing !! ");
			rangeResult = deep.utils.createRangeObject(rangeResult.start, rangeResult.end, rangeResult.totalCount);
			rangeResult.results = data;
			return rangeResult;
		}
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
				req.setRequestHeader("range", "items=" +start+"-"+end);
			},
			type:"GET",
			url:query,
			dataType:self.dataType,

		}).then(function(data, text, jqXHR) {
			return def.resolve(success(jqXHR, data));
		}, function  (jqXHR, statusText, errorThrown) {
			if(jqXHR.status == 200 || jqXHR.status == 206)
				def.resolve(success(jqXHR, JSON.parse(jqXHR.responseText)));
			else
				def.reject(new Error("deep.store.json.range failed : details : "+JSON.stringify(arguments)));
		});

		return deep(deep.promise(def))
		.done(function (rangeObject) {
			this._nodes = deep(rangeObject.results).nodes();
			return rangeObject;
		})
		.store(this)
		.done(function (success) {
			this.range = deep.Chain.range;
		});
	};
	deep.protocoles.json.create = function (name, uri, options)
	{
		var store = deep.utils.bottom(deep.protocoles.json, {
			options:options,
			get:deep.compose.around(function (old) {
				return function (id, options) {
					if(id == "?" || !id)
						id = "";
					return old.apply(this,[uri+id, options]);
				};
			}),
			post:deep.compose.around(function (old) {
				return function (object, options) {
					options = options || {};
					options.uri = uri;
					return old.apply(this,[object, options]);
				};
			}),
			put:deep.compose.around(function (old) {
				return function (object, options) {
					options = options || {};
					options.uri = uri;
					return old.apply(this,[object,  options]);
				};
			}),
			patch:deep.compose.around(function (old) {
				return function (object, options) {
					options = options || {};
					options.uri = uri;
					return old.apply(this,[object, options]);
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
		deep.protocoles[name] = store;
		store.name = name;
		return store;
	};

	return deep.protocoles.json;
	*/

});
if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(["require","deep/deep", "deep/deep-stores"],function (require)
{

	var deep = require("deep/deep");


	deep.stores.ajax = new deep.store.Store();


	//________________________________________________________________________ Customisation API

	deep.stores.ajax.writeJQueryDefaultHeaders = function (req) {
		req.setRequestHeader("Accept", "application/json; charset=utf-8"); 
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8"); 
	};
	deep.stores.ajax.name = "ajax";
	deep.stores.ajax.dataType = "json";
	deep.stores.ajax.extensions = [
		/(\.json(\?.*)?)$/gi
	];

	deep.stores.ajax.bodyParser = function(data){
		try{
			if(typeof data !== 'string')
				data = JSON.stringify(data);
		}
		catch(e)
		{
			return e;
		}
		return data;
	}
	deep.stores.ajax.responseParser = function(data, msg, jqXHR){
		try{
			if(typeof data === 'string')
				data = JSON.parse(data);
		}
		catch(e)
		{
			return e;
		}
		return data;
	}
	//________________________________________________________________________ END CUSOTMISATION
	deep.stores.ajax.writeCustomHeaders = function (req, headers) {
		for(var i in headers)
			req.setRequestHeader(i, headers[i]); 
	};
	deep.stores.ajax.get = function (id, options) {
		//console.log("deep.stores.ajax.get : ", id);
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
				if(options && options.headers)
					self.writeCustomHeaders(req, options.headers);
			},
			//contentType: "application/json; charset=utf-8",
			url:id,
			method:"GET"
		})
		.done(function(data, msg, jqXHR){
			data = self.responseParser(data, msg, jqXHR);
			if(data instanceof Error)
				return data;
			if(!noCache && (options && options.cache !== false)  || (self.options && self.options.cache !== false))
				deep.mediaCache.manage(data, id);
		//	console.log("deep.stores.ajax.get results : ", data);
			return data;
		})
		.fail(function(){
			//console.log("deep.store.ajax.get error : ",id," - ", arguments);
			return new Error("deep.stores."+self.name+" failed : "+id+" - \n\n"+JSON.stringify(arguments));
		}))
		.done(function (datas) {
			//console.log("json.get : result : ", datas);
			var handler = this;
			return deep(datas).nodes(function (nodes) {
				handler._entries = nodes;
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
	deep.stores.ajax.put = function (object, options) {
		options = options || {};
		var id = object.id || options.id;
		if(options.uri)
			id = options.uri+id;
		var self = this;
		var def = deep.Deferred();

		var body = self.bodyParser(object);
		if(body instanceof Error)
			return deep(error);
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
				if(options && options.headers)
					self.writeCustomHeaders(req, options.headers);
			},
			type:"PUT",
			url:id,
			dataType:self.dataType,
			data:body
		})
		.done(function (data, msg, jqXHR) {
			data = self.responseParser(data, msg, jqXHR);
			def.resolve(data);
		})
		.fail(function  (jqXHR, textStatus, errorThrown) {
			if(jqXHR.status < 400)
			{
				var test = self.responseParser(jqXHR.responseText, msg, jqXHR);
				//console.log("DeepRequest.post : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				
				def.resolve(test);
			}
			else
				def.reject(new Error("deep.store."+self.name+".put failed : "+id+" - details : "+JSON.stringify(arguments)));
		});
		return deep(deep.promise(def))
		.store(this)
		.done(function (success) {
			this.range = deep.Chain.range;
		});
	};
	deep.stores.ajax.post = function (object, options) {
		options = options || {};
		var id = object.id || options.id;
		if(options.uri)
			id = options.uri+((id)?id:"");
		var self = this;
		console.log("deep.store."+self.name+" : post : ", object, options, id);
		var def = deep.Deferred();
		//console.log("post on : ", id);
		var body = self.bodyParser(object);
		if(body instanceof Error)
			return deep(error);
		console.log("will post : ", body)
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
				if(options && options.headers)
					self.writeCustomHeaders(req, options.headers);
			},
			type:"POST",
			url:id,
			//processData:false,
			dataType:self.dataType,
			data:body
		})
		.done(function (data, msg, jqXHR) {
			data = self.responseParser(data, msg, jqXHR);
			//console.log("deep.store."+self.name+".success : ", data);
			def.resolve(data);
		})
		.fail(function  (jqXHR, textStatus, errorThrown) {
			//console.log("deep.store."+self.name+".fail : jqXHR : ",jqXHR, " - textStatus : ", textStatus, " - erro : ",errorThrown);
			if(jqXHR.status < 400 && textStatus !== 'error')
			{
				var test = self.responseParser(jqXHR.responseText, textStatus, jqXHR);
				//console.log("deep.stores."+self.name+".post : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				def.resolve(test);
			}
			else
				def.reject(new Error("deep.store."+self.name+".post failed : "+id+" - details : "+JSON.stringify(arguments)));
		});
		return deep(deep.promise(def))
		.store(this)
		.done(function (success) {
			this.range = deep.Chain.range;
		});
	};
	deep.stores.ajax.del = function (id) {
		var self = this;
		var def = deep.Deferred();
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
				if(options && options.headers)
					self.writeCustomHeaders(req, options.headers);
			},
			type:"DELETE",
			url:id
		})
		.done(function (data, msg, jqXHR) {
			data = self.responseParser(data, msg, jqXHR);
			//console.log("deep.store.ajax.success : ", success);
			def.resolve(data);
		})
		.fail(function  (jqXHR, textStatus, errorThrown) {
			if(jqXHR.status < 400)
			{
				var test = self.responseParser(jqXHR.responseText, textStatus, jqXHR);
				//console.log("deep.stores."+self.name+".del : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				def.resolve(test);
			}
			else
			{
				def.reject(new Error("deep.store."+self.name+".del failed : "+id+" - details : "+JSON.stringify(arguments)));
			}
		});
		return deep(deep.promise(def))
		.store(this)
		.done(function (success) {
			this.range = deep.Chain.range;
		});
	};
	deep.stores.ajax.patch = function (object, options) {
		options = options || {};
		var id = object.id || options.id;
		if(options.uri)
			id = options.uri+id;
		var self = this;
		var def = deep.Deferred();
		var body = self.bodyParser(object);
		if(body instanceof Error)
			return deep(error);
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
				if(options && options.headers)
					self.writeCustomHeaders(req, options.headers);
			},
			type:"PATCH",
			url:id,
			dataType:self.dataType,
			data:body
		})
		.done(function (data, msg, jqXHR) {
			data = self.responseParser(data, msg, jqXHR);
			//console.log("deep.store.ajax.success : ", success);
			def.resolve(data);
		})
		.fail(function  (jqXHR, textStatus, errorThrown)
		{
			if(jqXHR.status < 400)
			{
				var test = self.responseParser(jqXHR.responseText, textStatus, jqXHR);
				//console.log("deep.stores."+self.name+".del : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				def.resolve(test);
			}
			else
				def.reject(new Error("deep.store."+self.name+".patch failed : "+id+" - details : "+JSON.stringify(arguments)));
				//deferred.reject({msg:"DeepRequest.patch failed : "+info.request, status:jqXHR.status, details:arguments, uri:id});
		});
		return deep(deep.promise(def))
		.store(this)
		.done(function (argument) {
			this.range = deep.Chain.range;
		});
	};
	deep.stores.ajax.bulk = function (arr, uri, options) {
		var self = this;
		var def = deep.Deferred();
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
				if(options && options.headers)
					self.writeCustomHeaders(req, options.headers);
			},
			type:"POST",
			url:uri,
			dataType:self.dataType,
			data:JSON.stringify(arr)
		})
		.done(function (data, msg, jqXHR) {
			data = self.responseParser(data, msg, jqXHR);
			//console.log("deep.store.ajax.success : ", success);
			def.resolve(data);
		})
		.fail(function  (jqXHR, textStatus, errorThrown)
		{
			if(jqXHR.status < 400)
			{
				var test = self.responseParser(jqXHR.responseText, textStatus, jqXHR);
				//console.log("deep.stores."+self.name+".del : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				def.resolve(test);
			}
			else
				def.reject(new Error("deep.store."+self.name+".bulk failed : "+uri+" - details : "+JSON.stringify(arguments)));
		});
		return deep(deep.promise(def))
		.store(this)
		.done(function (success) {
			this.range = deep.Chain.range;
		});
	};
	deep.stores.ajax.rpc = function (method, params, id) {
		var self = this;
		var callId = "call"+new Date().valueOf();
		var def = deep.Deferred();
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
				if(options && options.headers)
					self.writeCustomHeaders(req, options.headers);
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
		.done(function (data, msg, jqXHR) {
			data = self.responseParser(data, msg, jqXHR);
			//console.log("deep.store.ajax.success : ", success);
			def.resolve(data);
		})
		.fail(function  (jqXHR, textStatus, errorThrown)
		{
			if(jqXHR.status < 400)
			{
				var test = self.responseParser(jqXHR.responseText, textStatus, jqXHR);
				//console.log("deep.stores."+self.name+".del : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				def.resolve(test);
			}
			else
				def.reject(new Error("deep.store."+self.name+".rpc failed : "+id+" - details : "+JSON.stringify(arguments)));
		});
		return deep(deep.promise(def))
		.store(this)
		.done(function (success) {
			this.range = deep.Chain.range;
		});
	};
	deep.stores.ajax.range = function (arg1, arg2, query, options)
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
				console.log("ERROR deep.stores."+self.name+".range : range header missing !! ");
			rangeResult = deep.utils.createRangeObject(rangeResult.start, rangeResult.end, rangeResult.totalCount);
			rangeResult.results = data;
			return rangeResult;
		}
		$.ajax({
			beforeSend :function(req) {
				self.writeJQueryDefaultHeaders(req);
				req.setRequestHeader("range", "items=" +start+"-"+end);
				if(options && options.headers)
					self.writeCustomHeaders(req, options.headers);
			},
			type:"GET",
			url:query,
			dataType:self.dataType,

		}).then(function(data, text, jqXHR) {
			return def.resolve(success(jqXHR, data));
		}, function  (jqXHR, statusText, errorThrown) {
			if(jqXHR.status == 200 || jqXHR.status == 206)
			{
				var test = self.responseParser(jqXHR.responseText, textStatus, jqXHR);
				//console.log("deep.stores."+self.name+".del : error but status 2xx : ", test, " - status provided : "+jqXHR.status);
				def.resolve(success(jqXHR, test));
			}
			else
				def.reject(new Error("deep.store."+self.name+".range failed : details : "+JSON.stringify(arguments)));
		});

		return deep(deep.promise(def))
		.done(function (rangeObject) {
			this._entries = deep(rangeObject.results).nodes();
			return rangeObject;
		})
		.store(this)
		.done(function (success) {
			this.range = deep.Chain.range;
		});
	};

	deep.stores.ajax.extends = function (st, baseOptions)
	{
		var self = this;
		console.log("deep.stores."+self.name+".extends : ",baseOptions);

		deep(st)
		.bottom(this)
		.up({
			options:baseOptions,
			get:deep.compose.createIfNecessary().around(function (old) {
				return function (id, options) {
					if(id == "?" || !id)
						id = "";
					var uri = options.uri || baseOptions.uri;
					return old.apply(this,[uri+id, options]);
				};
			}),
			post:deep.compose.createIfNecessary().around(function (old) {
				return function (object, options) {
					options = options || {};
					var uri = options.uri || baseOptions.uri;
					options.uri = uri;
					console.log("depp.stores.ajax.post : options :  ", options)
					return old.apply(this,[object, options]);
				};
			}),
			put:deep.compose.createIfNecessary().around(function (old) {
				return function (object, options) {
					options = options || {};
					var uri = options.uri || baseOptions.uri;
					options.uri = uri;
					return old.apply(this,[object,  options]);
				};
			}),
			patch:deep.compose.createIfNecessary().around(function (old) {
				return function (object, options) {
					options = options || {};
					var uri = options.uri || baseOptions.uri;
					options.uri = uri;
					return old.apply(this,[object, options]);
				};
			}),
			del:deep.compose.createIfNecessary().around(function (old) {
				return function (id, options) {
					var uri = options.uri || baseOptions.uri;
					return old.apply(this,[uri+id, options]);
				};
			}),
			rpc:deep.compose.createIfNecessary().around(function (old) {
				return function (method, params, id, options) {
					var uri = options.uri || baseOptions.uri;
					return old.apply(this,[method, params, uri+id, options]);
				};
			}),
			bulk:deep.compose.createIfNecessary().around(function (old) {
				return function (arr, options) {
					var uri = options.uri || baseOptions.uri;
					return old.apply(this,[arr, uri+id, options]);
				};
			}),
			range:deep.compose.createIfNecessary().around(function (old) {
				return function (start, end, query, options) {
					var uri = options.uri || baseOptions.uri;
					query = query || "";
					return old.apply(this,[start, end, uri+query, options]);
				};
			}),
			create:deep.collider.remove()
		});
		return st;
	};
	return deep.stores.ajax;

});
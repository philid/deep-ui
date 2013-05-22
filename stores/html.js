if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(function (require)
{

	var deep = require("deep/deep");

	//__________________________________________________
	deep.stores.html = new deep.store.Store();
	var writeJQueryDefaultHeaders = function (req) {};
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
				deep.mediaCache.manage(data, id);
			return data;
		})
		.fail(function(){
			console.log("deep.store.html error : ", arguments);
			return new Error("deep.store.html failed : "+id+" - \n\n"+JSON.stringify(arguments));
		}))
		.store(this);
		if(options.cache !== false || (self.options && self.options.cache !== false))
			deep.mediaCache.manage(d, id);
		return d;
	};
	//__________________________________________________
	deep.stores.swig = new deep.store.Store();
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
				deep.mediaCache.manage(resi, "swig::"+id);
			return resi;
		})
		.store(this);
		if((options && options.cache !== false)  || (self.options && self.options.cache !== false))
			deep.mediaCache.manage(d, "swig::"+id);
		return d;
	};
	return deep.stores.html;

});
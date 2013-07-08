if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(["require", "deep-ui/stores/ajax"],function (require)
{

	var deep = require("deep/deep");

	//__________________________________________________
	deep.protocoles.html = new deep.Store();
	var writeJQueryDefaultHeaders = function (req) {};
	deep.extensions.push({
		extensions:[
			/(\.(html|htm|xhtm|xhtml)(\?.*)?)$/gi
		],
		store:deep.protocoles.html
	});
	deep.protocoles.html.get = function (id, options) {
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
	return deep.protocoles.html;

});
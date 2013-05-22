if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(function (require)
{

	var deep = require("deep/deep");

	//___________________________ JSON

	deep.stores.lsarray = new deep.store.Store();

	deep.stores.lsarray.extensions = [];
	deep.stores.lsarray.get = function (id, options) {

	};




	deep.stores.lsobject = new deep.store.Store();

	deep.stores.lsobject.extensions = [];
	deep.stores.lsobject.get = function (id, options) {

	};
})
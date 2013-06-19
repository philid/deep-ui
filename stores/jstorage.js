if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(["require", "deep-ui/stores/ajax"],function (require)
{

	var deep = require("deep/deep");

	//___________________________ JSON

	deep.protocoles.lsarray = new deep.Store();

	deep.protocoles.lsarray.extensions = [];
	deep.protocoles.lsarray.get = function (id, options) {

	};




	deep.protocoles.lsobject = new deep.Store();

	deep.protocoles.lsobject.extensions = [];
	deep.protocoles.lsobject.get = function (id, options) {

	};
})
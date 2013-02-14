/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */
define(function(require){
	console.flags = { 
		"none":false
		//, "layer-factory": true
		//, "request-factory":true
		, "form-controller":true
		//, "view-controller":true
		//,"list-controller":true
		//,"list-item-controller":true
	};

	require("deep-ui/plugin");
	var composer = require("deep/deep-compose");
	var utils = require("deep/utils");
	require("deep-ui/swig-init");
	var init = function()
	{	
		console.log("app intialised");
	}
	return init;
})

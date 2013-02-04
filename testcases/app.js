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
	var ListController = require("deep-ui/list-controller");
	var Compose = require("compose");
	var composer = require("deep/deep-compose");
	var deepCopy = require("deep/deep-copy");
	var TestController = require("test-controller.js");
	var utils = require("deep/utils");
	require("deep/swig-init");
	var init = function()
	{	
		console.log("app intialised");
	}
	return init;
})

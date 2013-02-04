/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */
 if(typeof define !== 'function')
	var define = require('amdefine')(module);
define(function(require){


	var Compose = require("compose");
	var ViewController = require("deep-ui/view-controller");
	var TestController = Compose(ViewController, function(){}, {});

	return TestController;

});
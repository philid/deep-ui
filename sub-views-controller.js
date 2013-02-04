if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(function AppControllerDefine(require){
	var ViewController = require("deep-ui/view-controller");
	var deep = require("deep/deep");	

	var SubViews = {
		init:deep.compose.createIfNecessary().after(function () {
			return deep(this).query("./subs/*").bottom(ViewController);
		})
	}
	return SubViews;
});
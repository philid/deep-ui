if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(function (require){
	var deep = require("deep/deep");	

	var SubViews = {
		init:deep.compose.createIfNecessary().after(function () {
			return deep(this).query("./subs/*").bottom(deep.ui.ViewController).run("init");
		})
	}
	return SubViews;
});
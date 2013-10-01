/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */

 /*
TO DO :
- create and add AlerterFacet : a message manager for the UI which knows how displaying alerts or loading

 */

if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(["require","./plugin"], function AppControllerDefine(require){

	var deep = require("deep/deep");

	var AppController =  {
		init:function () {
			// console.log(" APP-CTRL INIT ");	
		},
		load:function () {
			// console.log("APP-CTRL load");
			return deep(this)
			.query("./externals")
			.deepLoad(null, true);
		},
		currentView:null,
		updateDeepLink:function  (path) 
		{
			if(path == $.address.path())
				return;
			var parsed = path.split("/");
			var currentMapEntry = this.deeplinkingMap;
			if(typeof currentMapEntry === 'function')
				currentMapEntry = currentMapEntry();
			//console.log("App.updateDeepLink : ", path)
			// console.log("App.updateDeepLink : map : ", currentMapEntry)

			if(!currentMapEntry)
				return;
			var ok = true;
			var finalPath = [];
			while(parsed.length > 0)
			{
				var current = parsed.shift();
				if(current == "")
					continue;
				currentMapEntry = currentMapEntry[current];
				// console.log("App.updateDeepLink . current : ", current, currentMapEntry)
				if(!currentMapEntry)
				{
					console.warn("_App.updateDeepLink failed : no current map entry found with : ", current)
					ok = false;
					break;
				}
				if(currentMapEntry._output)
					finalPath.push(currentMapEntry._output.apply(this));
				else
					finalPath.push(current);
			}
			if(ok)
				$.address.path(finalPath.join("/"));
		},
		internalChange:function (path, params) 
		{
			//console.log("ADDRESS internalChange : path : ", path, " - params : ", params);
			var a  = path.split("/");
			if(a[0] == "")
				a.shift();
			var info = {
				pathNames:a,
				path:path,
				parameters:params
			}
			this.urlChanged(info);
		},
		urlChanged:function (urlParams)
		{
			//console.log("URL CHANGED params = ", urlParams);

			var map = this.deeplinkingMap;
			if(typeof map === 'function')
				map = map();
			var currentMapEntry = map;
			var ok = true;
			while(urlParams.pathNames.length > 0 && ok)
			{
				ok = false;
				var current = urlParams.pathNames.shift();
				//search in the map if we have a entry
				var roleOk = false;
				if(!currentMapEntry)
					return;
	
				if(currentMapEntry[current])
				{
					currentMapEntry = currentMapEntry[current]
					ok = true;
					//console.log("we have an entry : ",current);
				}
				else if(currentMapEntry._int_)
				{
					var parsed = parseInt(current);
					if(!isNaN(parsed))
					{
						currentMapEntry = currentMapEntry._int_;
						ok = true;
						//console.log("Got an integer", current);
					}
				}
				else if(currentMapEntry._id_)
				{
					currentMapEntry = currentMapEntry._id_
					ok = true;
				}
				/*else if(currentMapEntry._language_ && smart.allowedLanguages)
				{
					currentMapEntry = currentMapEntry._id_
					ok = true;
				*/
				else
				{
					//other possible cases
					console.log("Dont find what i want in the url, redirect to default view");
				}
			}
			//check if we have handler and execute it
			if(ok && currentMapEntry._handler)
			{
				urlParams.pathNames = urlParams.path.split("/");
				if(urlParams.pathNames[0] == "")
					urlParams.pathNames.shift();
				currentMapEntry._handler.apply(this,[urlParams]);
			}
			else
			{
				// console.log(" will open the default page");
				var defHandler = currentMapEntry.defaultHandler || map.defaultHandler;
				if(defHandler)
					defHandler.apply(this);
				else
					console.log("deep-link failed : nothing to do with : ", urlParams);
			}

		}
	};


	return AppController;
});
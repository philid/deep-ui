/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */

 /*
TO DO :




 */

if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(["require","./plugin"], function AppControllerDefine(require){

	var deep = require("deep/deep");


  //__________________________________________________________________________________ CREATION
    var app = {
        language:"fr",
        currentUser:null,
        views:deep.ocm("views"),
        gui:deep.ocm("gui"),
        route:deep.ocm("route"),
        init:function(initPath){
        	var self = this;
            // TODO : flatten ocm, load smart, try relog, + launch smart.app().load() + init() if relog fail (because public)
            console.log("smart.init() : ", initPath);
            var lang = this.language = $.jStorage.get("language");
            if(!lang) 
            {
            	// TODO : write script that do it for all language
            	lang = navigator.language || navigator.userLanguage;
		        if (lang.indexOf('en') > -1)
		          this.language = "en";
		        //else if (lang.indexOf('fr') > -1)
		        //  this.language = "fr";
		        else if (lang.indexOf('nl') > -1)
		          this.language = "nl";
		        else
		          this.language = "en";
			}
            $.jStorage.set("language", this.language);

            $.address.externalChange(function(event) {
                console.log(" $.address.externalChange : event : ", event);
                self.urlChanged(event);
            });
            $.address.internalChange(function (event) {
                console.log(" $.address.internalChange : event : ", event);
            });

            return deep.all([
                deep(this.externals).deepLoad(),
                this.views.flatten(),
                this.gui.flatten(),
                this.routes.flatten()
            ])
            .done(function(success){
                console.log("smart flattened")
                var passport = $.jStorage.get("passport");
                if(passport instanceof Array)
                {
                    $.jStorage.set("passport",null);
                    passport = null;
                }    
                if(passport && $.cookie("autobahn-session"))
                {
                    //console.log("try reload passport");
                    return deep.getAll(["user::"+passport.userId, "passport::"+passport.id])
                    .done(function(results){
                        var user = results.shift();
                        var passport = results.shift();
                        passport.user = user;
                        // console.log("passport from store : ", passport)
                        if(!passport)
                            return deep.errors.Internal();
                        smart.loggedIn(passport, initPath);
                    })
                    .fail(function (error) {
                        console.log("error while reloading passport : ", error);
                        deep.generalMode("public");
                        smart.app().init(initPath);
                    });
                }
                deep.generalMode("public");
                smart.app().init(initPath);
            })
        },
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
 

	var smart =  {
		backgrounds:[app],
		externals:{
        },
		userDatas:{ // need to copy it as it could logout and then relogging
        },
		loggedIn:deep.compose.before(function(passport, from)
		{
            var user = passport.user;
            this.currentUser = user;
            this.passport = passport;
            // console.log("logged in : ", user, " - from : ", from, " - : pass : ", passport);
            $.jStorage.set("passport", passport);
            deep.generalMode(passport.roles);
	
			var self = this;
            return deep(this)
            .query("/userDatas")
            .deepLoad(user)
            .done(function(){
                if(smart.userDatas.profile)
                    self.userDatas.profile = self.userDatas.profile.shift();
                return smart.init(from);
            })
            .fail(function (e) {
                deep.generalMode("public");
                smart.gui().error(e).loading(false).login();
            });
		})
	};
    deep.store.Selector("views", smart.views, "viewSelector"); // as root is a deep_ocm : will fire it before searching in it
   

	return AppController;
});
if(typeof define !== 'function')
	var define = require('amdefine')(module);
/*
	Render pattern : 
	extrnals:{
	
	},
	shrom :
	{
		what:"#../externals",
		how:"swig::./templates/simple.html",
		where:"dom.append::#id",
		condition:true,
		done:deep.compose.after(function(success){
			
		}),
		fail:deep.compose.after(function(error){
			
		})
	}


	reloadables : 
		deep.request.reloadables("uri"||Ereg, true||false);
		

	request :
		keep cache : 
			swig::./templates/simple.html should be cached
			dom.append::#id 		also cached
			json::/campaign/   should not be cached

		protocole 
			requestHeaders
			responseHeaders
			requestParser
			responseParser

		json|json.range :
			requestParser : 
				path #deep.query 

		html : 
			requestParser : 
				path

		dom.* :
			requestParser : 
				jquery.selector
*/
define(function (require)
{
	var deep = require("deep/deep");
	var ViewController = 
	{
		renderables:{

		},
		parentController:null,
		domSelectors:null,
		externals:null,
		reloadables:null,
		templates:null,
		translations:null,
		load:deep.compose.createIfNecessary().after(function(arg) 
		{
			this.reloadables = {};
			if(this._reloadables)
				deep.utils.up(this._reloadables, this.reloadables);
			if(this.loaded)
				return deep(this).query("./reloadables").deepInterpret(this).deepLoad();
			this.loaded = true;
			return  deep(this).query("./[externals,templates,translations,reloadables]").deepInterpret(this).deepLoad();
		}),
		render:deep.compose.createIfNecessary().after(function () 
		{
			if(!this.rendered)
				this.rendered = {};
			//console.log("will render "+this.name+" - context : ", ctx)
			if(!this.templates || !this.templates.self)
				this.rendered.self = "";
			else
				this.rendered.self = this.templates.self(this);
		}),
		placeInDOM:deep.compose.createIfNecessary().after(function () 
		{
			if((this.domSelectors.parent || this.domSelectors.self) && this.rendered.self)
				if(this.domSelectors.self && $(this.domSelectors.self).length > 0)
					$(this.domSelectors.self).replaceWith(this.rendered.self);
				else
				{
					$(this.domSelectors.parent).empty();
					$(this.rendered.self).appendTo(this.domSelectors.parent);
				}
		}),
		isInDOM:deep.compose.createIfNecessary().after(function () 
		{
			if(this.domSelectors.self)
				return ($(this.domSelectors.self).length() > 0);
			return null;
		}),
		setBehaviour:deep.compose.createIfNecessary().after(function () {}),
		refresh:deep.compose.createIfNecessary().after(function () 
		{
			var self = this;
			return deep(this)
			.run("render")
			.run("placeInDOM")
			.query("./renderables/*")
			.run(deep.ui.refreshRenderable)
			.root(self)
			.run(function () {
				if(self.deepLinkPath)
					_APP.updateDeepLink(self.deepLinkPath);
			})
			.run("setBehaviour");
			
		})
	}

	return ViewController;
})
if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(function ViewControllerDefine(require)
{
	var deep = require("deep/deep");
	//var plugin = require("deep-ui/deep-plugin");
	var ViewController = 
	{
		parentController:null,
		domSelectors:null,
		externals:null,
		reloadables:null,
		templates:null,
		translations:null,
		load:function(arg) 
		{
			this.reloadables = {};
			if(this._reloadables)
				deep.utils.up(this._reloadables, this.reloadables);
			if(this.loaded)
				return deep(this).query("./reloadables").deepInterpret(this).deepLoad();
			this.loaded = true;
			return  deep(this).query("./[externals,templates,translations,reloadables]").deepInterpret(this).deepLoad();
		},
		render:function () 
		{
			if(!this.rendered)
				this.rendered = {};
			//console.log("will render "+this.name+" - context : ", ctx)
			if(!this.templates || !this.templates.self)
				this.rendered.self = "";
			else
				this.rendered.self = this.templates.self(this);
		},
		placeInDOM:function () 
		{
			if((this.domSelectors.parent || this.domSelectors.self) && this.rendered.self)
				if(this.domSelectors.self && $(this.domSelectors.self).length > 0)
					$(this.domSelectors.self).replaceWith(this.rendered.self);
				else
				{
					$(this.domSelectors.parent).empty();
					$(this.rendered.self).appendTo(this.domSelectors.parent);
				}
		},
		isInDOM:function (argument) 
		{
			if(this.domSelectors.self)
				return ($(this.domSelectors.self).length() > 0);
			return null;
		},
		setBehaviour:function () {},
		refresh:function (argument) 
		{
			this.render();
			this.placeInDOM();
			//console.log("ViewController.refresh : deepLinkPath : ", this.deepLinkPath)
			if(this.deepLinkPath)
				_APP.updateDeepLink(this.deepLinkPath);
			this.setBehaviour();
		}
	}

	return ViewController;
})
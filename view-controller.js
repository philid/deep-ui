if(typeof define !== 'function')
	var define = require('amdefine')(module);
/*
	Render pattern : 
	externals:{
	
	},
	renderables :{
		myview:{
			what:"#./externals",
			how:"swig::./templates/simple.html",
			where:deep.ui.appendTo("#myid"),
			condition:true,
			done:deep.compose.after(function(success){
				
			}),
			fail:deep.compose.after(function(error){
				
			})
		}, 
		myotherview:....
	}
*/
define(function (require)
{
	var deep = require("deep/deep");
	var ViewController = 
	{
		renderables:{

		},
		parentController:null,
		//domSelectors:null,
		externals:null,
		reloadables:null,
		//templates:null,
		//translations:null,
		load:deep.compose.createIfNecessary().after(function(arg) 
		{
			this.reloadables = {};
			if(this._reloadables)
				deep.utils.up(this._reloadables, this.reloadables);
			if(this.loaded)	
				return deep(this).query("./reloadables").deepInterpret(this).deepLoad();
			this.loaded = true;
			return  deep(this).query("./[externals,reloadables]").deepInterpret(this).deepLoad();
		}),
		/*render:deep.compose.createIfNecessary().after(function () 
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
		}),*/
		setBehaviour:function () {
			//console.log("default setbehaviour")
		},
		refresh:deep.compose.createIfNecessary().after(function () 
		{
			var controller = this;
			var args = Array.prototype.slice.call(arguments).join(",");
			return deep(this)
			.position("controller")
			.query("./renderables/["+args+"]")
			.run(function() // load renderables
			{
				if(!this.how || this.condition === false)
					return false;
				if(this.condition)
					if(typeof this.condition === "function" && !this.condition.apply(controller))
						return false;
				var context = controller;
				var renderable = this;
				var objs = [];
				if(this.what)
				{
					if(typeof this.what === 'string')
						this.what = deep.interpret(this.what, context);
					objs.push(deep.request.retrieve(this.what, { callFunctions:true, root:context._deep_entry || context, acceptQueryThis:true }));
				}
				if(typeof this.how === "string")
				{
					this.how = deep.interpret(this.how, context);
					objs.push(deep.request.retrieve(this.how, { callFunctions:false, root:context._deep_entry || context, acceptQueryThis:true }));
				}	
				if(typeof this.where === "string")
				{
					this.where = deep.interpret(this.where, context);
					objs.push(deep.request.retrieve(this.where, { callFunctions:false, root:context._deep_entry || context, acceptQueryThis:true }));
				}	
				objs.unshift(renderable);
				return deep.all(objs)
				.fail(function(error){
					console.log("Renderable rendering failed : ", error);
					if(typeof renderable.fail === 'function')
						return renderable.fail.apply(context, [error]) || error;
					return [{}, function(){ return ""; }, function(){} ]
				})
			})
			.done(function (alls) // apply render and place in dom orderedly
			{ 
				alls.forEach(function( results )
				{
					var renderable = results.shift();
					var context = controller;
					var what = (renderable.what)?results.shift():context;
					if(what._isDQ_NODE_)
						what = what.value;
					var how = (typeof renderable.how === "string")?results.shift():renderable.how;
					var where = (typeof renderable.where === "string")?results.shift():renderable.where;
					var r = "";
					var nodes = renderable.nodes || null;
					try{
						r = how(what);
						if(where)
							nodes = where(r, nodes);
						// console.log("render success : ", nodes, r, what)
					}
					catch(e)
					{
						console.log("Error while rendering : ", e);
						if(typeof renderable.fail === 'function')
							return renderable.fail.apply(context, [e]) || e;
						return e;
					}
					renderable.nodes = nodes;
					if(typeof renderable.done === "function")
						return renderable.done.apply(context, [nodes, r, what]) || [nodes, r, what];
					return nodes || r; 
				})
			})
			.back("controller")
			.run(function () {
				if(this.deepLinkPath)
					_APP.updateDeepLink(this.deepLinkPath);
			})
			.log("____________________________________________________________________ refreshed")
			.run("setBehaviour");
		})
	}
	return ViewController;
})
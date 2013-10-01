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
		//templates:null,
		//translations:null,
		load:function(arg)
		{
			//console.log("ViewController.load : ", arg)
			var self = this;
			if(this._externals)
				this.externals = deep.utils.copy(this._externals);
			else if(this.externals)
				this._externals = deep.utils.copy(this.externals);
			return  deep(this).query("./externals").deepLoad(this, true).done(function(loaded){
				return self;
			});
			//.log("vc : load result ").log();
		},

		setBehaviour:function () {
			//console.log("default setbehaviour")
		},
		beforeRefresh:function () {
			//console.log("default setbehaviour")
		},
		refresh:deep.compose.after(function ()
		{
			//console.log("ViewController.refresh : ",arguments)
			var controller = this;
			var args = Array.prototype.slice.call(arguments);
			/*var loadRenderable = function () {
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
					//console.log("view controller . render : what : ", this.what)
					if(typeof this.what === 'string')
					{
						var what = deep.interpret(this.what, context);
						objs.push(deep.get(what, { root:context._deep_entry || context }));
					}
					else if(typeof this.what === 'function')
					{
						objs.push(this.what.apply(context));
					}
					else
						objs.push(this.what);
				}
				if(typeof this.how === "string")
				{
					var how = deep.interpret(this.how, context);
					objs.push(deep.get(how, { root:context._deep_entry || context }));
				}
				if(typeof this.where === "string")
				{
					var where = deep.interpret(this.where, context);
					objs.push(deep.get(where, { root:context._deep_entry || context }));
				}
				objs.unshift(renderable);
				//console.log("load renderable : ", objs)
				return deep.all(objs)
				// .done(function(success){
				// 	console.log("rendeables loaded : ", success);
				// })
				.fail(function(error){
					// console.log("Renderables load failed : ", error);
					if(typeof renderable.fail === 'function')
						return renderable.fail.apply(context, [error]) || error;
					return [{}, function(){ return ""; }, function(){} ];
				});
			};

			var applyRenderables = function (alls) // apply render and place in dom orderedly
			{
				// console.log("apply renderables: ", alls)
				var res = [];
				alls.forEach(function( results )
				{
					if(results === false)
						return;
					var renderable = results.shift();
					var context = controller;
					var what = (renderable.what)?results.shift():context;
					if(what._isDQ_NODE_)
						what = what.value;
					var how = (typeof renderable.how === "string")?results.shift():renderable.how;
					var where = (typeof renderable.where === "string")?results.shift():renderable.where;
					var r = "";
					var nodes = renderable.nodes || null;
					//console.log('renderables : ', renderable, ' - how : ', how)
					try{
						r = how.call(context,what);
						if(where)
							nodes = where.call(context, r, nodes && nodes());
						// console.log("render success : ", nodes,"r : ", r, "what : ", what)
					}
					catch(e)
					{
						//console.log("Error while rendering : ", e);
						if(typeof renderable.fail === 'function')
							return res.push(renderable.fail.apply(context, [e]) || e);
						return res.push(e);
					}
					renderable.nodes = function(){ return nodes; };
					if(typeof renderable.done === "function")
						return res.push(renderable.done.apply(context, [nodes, r, what]) || [nodes, r, what]);
					return res.push([nodes, r, what]);
				});
				return res;
			};*/

			return deep(this)
			.position("controller")
			.run("beforeRefresh")
			//.load()
			//.log("________________________________ controller to load")
			//.logValues()
			.query("./renderables/["+args.join(",")+"]")
			//.log("________________________________ renderables to load")
			//.logValues()
			.values(function(values){
				return deep.utils.loadTreatments(values, controller);
			})
			.done(function(treatments){
				return deep.utils.applyTreatments(treatments, controller, true);
			})
			//.run(loadRenderable)
			//.done(applyRenderables)
			.up({
				refresh:function () {
					var sended = this.sended();
					if(sended && sended.parents('html').length > 0)
						return deep(this)
						.values(function(values){
							return deep.utils.loadTreatments(values, controller);
						})
						.done(function(treatments){
							return deep.utils.applyTreatments(treatments, controller, true);
						});
				}
			})
			.back("controller")
			.run(function () {
				if(this.deepLinkPath)
					smart.app.updateDeepLink(this.deepLinkPath);
			})
			//.log("____________________________________________________________________ refreshed")
			.run(function () {
				var values  = deep(this.renderables).query("./*/sended").run().done();
				if(this.setBehaviour && args.length == 0)
					this.setBehaviour(values);
				if(this.hasRefresh && args.length == 0)
					this.hasRefresh(values);
			})
			.done(function () {
				return controller;
			});
		}),
		show:function () {
			var controller = this;
			var args = Array.prototype.slice.call(arguments).join(",");
			return deep(this)
			.position("controller")
			.query("./renderables/["+ args +"]")
			.run(function () {
				if(this.sended && this.sended())
					this.sended().show();
			})
			.done(function () {
				return controller;
			});
		},
		hide:function () {
			var controller = this;
			var args = Array.prototype.slice.call(arguments).join(",");
			return deep(this)
			.position("controller")
			.query("./renderables/["+ args +"]")
			.run(function () {
				if(this.sended && this.sended())
					this.sended().hide();
			}).done(function () {
				return controller;
			});
		},
		me:function (argument) {
            return this;
        }
	};
	return ViewController;
});
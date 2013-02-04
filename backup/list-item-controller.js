/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */
if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}

define(function(require){
	var Compose = require("compose");
	var deepCopy = require("deep/deep-copy").deepCopy;
	var ViewController = require("deep-ui/view-controller");
	
	var ListItemControllerAspect = function(){}
	ListItemControllerAspect.prototype.layerSchema = {
		uri:"deep-ui/list-item-controller",
		"inherits":[ViewController.prototype.layerSchema],
		properties:
		{
			// voir ListItemController
			macroName:{ type:"string", required:false },
			dataPath:{ type:"string", required:true },
			dependency:{ 
				required:false
				/*properties:{
					targetPath:{ type:"string", required:false }, 
					// condition : function || RegExp || Object({ min, max, enum, exact })
					condition:{ type:"any", required:false},   // function(targetValue){ if(targetValue == 2) return true; return false;  },
					unmatchedCSSClass:{type:"string"},
					matchedCSSClass:{type:"string"}
				}*/
			},
			actions:{
				required:false
			}
		}
	}
	ListItemControllerAspect.prototype.printMacro = function()
	{
		var res = "{{ "+this.macroName+"('"+this.name+"', items." + this.name+") }}\n";
		return res;
	}

	ListItemControllerAspect.prototype.render = Compose.around(function(oldRender)
	{
		return	function(){
			if(console.flags["list-item-controller"]) console.log("list-item-controller", "render")
			if(!this.rendered)
				this.rendered = {}
			if(this.macroName)
			{
				if(!this.parent.context)
					this.parent.context = {};
				if(!this.parent.context.items)
					this.parent.context.items = {};
				this.parent.context.items[this.name] = this;
				oldRender.apply(this, [this.parent.context]);
				this.rendered.root = this.printMacro();
			}
			else
				oldRender.apply(this, [this.context]);
			return this.rendered;
		}
	});

	ListItemControllerAspect.prototype.setBehaviour = Compose.after(function()
	{
		if(console.flags["list-item-controller"]) console.log("list-item-controller", "setBehaviour() : "+JSON.stringify(this.actions))
		var othis = this;
		var arr = [];
		for(var i in this.actions)
			arr.push({ key:i, action:this.actions[i] })
		//console.log("ffsdssssss")
		var parent = this.domSelectors.parent;
		this.domSelectors.me = parent +" ."+this.name;
		arr.forEach(function(e){
			if(console.flags["list-item-controller"]) console.log("list-item-controller", "setBehaviour : "+e.key + " - on : "+othis.domSelectors.me)

			if(typeof e.action === 'function')
				$(othis.domSelectors.me)[e.key](e.action);
			else if(typeof e.action === 'string')
			{	
				$(othis.domSelectors.me)[e.key](function(){
					if(console.flags["list-item-controller"]) console.log("list-item-controller","execute action on : "+e.key+" with call (string ref) : "+e.action)
					othis.parent[e.action](this);
				})
			}
		})
	});

	var ListItemController = Compose(ViewController, ListItemControllerAspect);
	ListItemController.aspect = ListItemControllerAspect;
	
	// COPY LAYER SCHEMA
	return ListItemController;
});
/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */
if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}

define(function(require){
	var Compose = require("compose");
	var deepCopy = require("deep/deep-copy").deepCopy;
	var ListItemController = require("deep-ui/list-item-controller");
	var promise = require("deep/promise");
	var ViewController = require("deep-ui/view-controller");
	var DeepFactory = require("deep/deep-factory");
	var RequestFactory = require("deep/deep-request");

	var layerSchema = {
		"inherits":[ViewController.prototype.layerSchema],
		uri:"deep-ui/list-controller",
    	properties:{
    		domSelectors:{
    			properties:{
    				"items-container":{ type:"string", required:false }
    			}
    		},
	    	"templates":{
				properties:{
					"macros": {
						required:false
					}
				}
			},
			"steps":{
				loadable:"none",
				"interpretation-deepness":"none",
				type:"array",
				required:false,
				items:{
					type:"array",
					required:false,
					items:{ type:"string" }
				}
			},
			"items":{
				subfactory:"object-group",
				defaultController:"instance::deep-ui/list-item-controller"
			}
		}
    }

	var ListControllerAspect = function(){
	}
	ListControllerAspect.prototype.layerSchema = layerSchema;
	ListControllerAspect.prototype.stepIndex = 0;

	ListControllerAspect.prototype.placeElementsInDOM = function placeElementsInDOM(){
		if(!this.domSelectors)
			return;

		if(this.domSelectors.parent && this.rendered.root )
			$(this.domSelectors.parent).html(this.rendered.root)

		var selector = this.domSelectors["items-container"] || this.domSelectors.parent;
		if(console.flags["list-controller"]) console.log("list-controller", "place Elements In DOm() in "+ selector + " - "+this.rendered.root);
		//if(console.flags["list-controller"]) console.log("list-controller", "layer : " + JSON.stringify(this.layer))
		if(selector && this.rendered.items)
			$(selector).html(this.rendered.items)
	}
	ListControllerAspect.prototype.placeInDOM = Compose.after(ListControllerAspect.prototype.placeElementsInDOM);

	ListControllerAspect.prototype.renderItems = function renderItems()
	{ 
		// output of html		
		//if(console.flags["list-controller"]) console.log("list-controller","render()");
		var othis = this;
	
		this.context = this.context || {};
		this.context.items = {};
		
		var renderedTemplate = "";
		if(this.layer.templates)
		{	
			var macros = this.layer.templates.macros;
			for (var i in macros)
			{
				var  m = macros[i];
				var prefix = "";
				var index = m.indexOf(":");
				if(index > -1)
				{	
					prefix = m.substring(0,index);
					m = m.substring(index+2);
				}
				renderedTemplate += "{% import '" + m + "' as "+i+" %}\n";
			}
		}
		if(this.steps)
		{
			var step = this.steps[this.stepIndex];
			if(!step)
				throw "Error while printing FormController steps : step not found with index : "+this.stepIndex;
			for(var j = 0; j< step.length; ++j) 
			{

				var i = step[j];
				//if(console.flags["list-controller"]) console.log("form-controller", "add step item : "+i)
				var item = othis.items[i];
				if(!item)
				{
					if(console.flags["list-controller"]) console.log("list-controller","Error when render step in ListController.renderElements() : item \""+i+"\" (from items.steps) not found in items.list");
					continue;
				}
				renderedTemplate += item.render().root;
			}
		}
		else
			for(var i in this.items) 
			{
				//if(console.flags["list-controller"]) console.log("form-controller", "add item : "+i)
				var item = this.items[i];
				renderedTemplate += item.render().root;
			}

	//	if(console.flags["list-controller"]) console.log("list-controller", "will render() " + renderedTemplate + " - with context : \n", this.context);
		var templ = swig.compile(renderedTemplate);
		//if(console.flags["list-controller"]) console.log("list-controller","template compiled : "+templ)

		this.rendered.items = templ(this.context);
		if(console.flags["list-controller"]) console.log("list-controller", "have render() " + this.rendered.items );
	}
	ListControllerAspect.prototype.render = Compose.after(ListControllerAspect.prototype.renderItems);

	ListControllerAspect.prototype.setItemsActions = function setItemsActions(){
		
		if(console.flags["list-controller"]) console.log( "list-controller","setItemsActions()")

		var othis = this;
		if(this.steps)
		{
			var step = this.steps[this.stepIndex];
			if(!step)
				throw "Error while printing FormController steps : step not found with index : "+this.stepIndex;
			for(var j = 0; j< step.length; ++j) 
			{
				var i = step[j];
				if(console.flags["list-controller"]) console.log("list-controller", "add step items behaviour : "+i)
				var item = othis.items[i];
				if(!item)
				{
					if(console.flags["list-controller"]) console.log("list-controller","Error when render step in ListController.renderElements() : item \""+i+"\" (from items.steps) not found in items.list");
					continue;
				}
				item.setBehaviour();
			}
		}
		else
			for(var i in this.items) 
			{
				if(console.flags["list-controller"]) console.log("list-controller", "add items behaviour : "+i)
				var item = this.items[i];
				item.setBehaviour();
			}

	}
	ListControllerAspect.prototype.setBehaviour = Compose.after(ListControllerAspect.prototype.setItemsActions);

	ListControllerAspect.prototype.refreshItems = function refreshItems(){
		this.renderElements();
		this.placeElementsInDOM()
			this.setItemsActions();
	}

	ListControllerAspect.prototype.next = function next()
	{
		if(!this.items || !this.steps || this.stepIndex >= this.steps.length-1)
		{
			if(console.flags["list-controller"]) console.log("list-controller", "try to go one step next : but your already at last step ! return. ")
			return false;
		}	
		this.stepIndex++;
		this.refreshItems();
		if(this.delegateNextSuccess)
			this.delegateNextSuccess(this);
		return true;
	}

	ListControllerAspect.prototype.back = function back()
	{
		if(this.stepIndex > 0)
		{
			this.stepIndex--;
			this.refreshItems();
		}	
		else
			if(console.flags["list-controller"]) console.log("list-controller", "try to go one step back : but your already at first step ! return. ")
	}

	var ListController = Compose(ViewController, ListControllerAspect);
	//ListController.prototype.layerSchema = deepCopy(layerSchema, );
	ListController.aspect = ListControllerAspect;
	return ListController;

});

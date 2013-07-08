if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}

define(["require","deep-ui/plugin"], function(require){

	return function(deep)
	{
		function editInPlaceBlur(clicked, prop)
		{
			var self = this;
			(function(){
				$(clicked)
				.html(self.createInputHtml(prop))
				.find(".property-input:first")
				.blur(function (argument) {
					//console.log("BLURR property value input : ", self)
					var oldValue = prop.value;
					prop.value = deep.Validator.convertStringTo($(this).val(), prop.type);
					$(clicked).text(prop.value);
					if(prop.value !== oldValue)
						self.hasChange(oldValue, prop);
				})
				.focus()
				.click(function (e) {
					e.stopPropagation();
				})
				.keydown(function(event){
					//console.log("keydown : code : ", event.keyCode);
					if (event.keyCode == 27) 
					{
						$(clicked).text(prop.value);
						return;
					}
					if (event.keyCode == 13) 
						$(this).blur();
				});
			})();
		}

		var JsonEditorController = function(){};

		JsonEditorController.prototype = {
			templates:{
				inputText:"swig::/js/deep-ui/templates/json-editor/input-text.html",
				node:"swig::/js/deep-ui/templates/json-editor/node.html",
				item:"swig::/js/deep-ui/templates/json-editor/item.html"
			},
			editKeyAcess:true,
			editValueInPlace:function(selector, prop){
				var othis = this;
				$(selector).click(function (e) {
					//console.log("Click on property value : ", $(this).text());
					e.preventDefault();
					editInPlaceBlur.apply(othis, [this, prop]);
				});
			},
			editKeyInPlace:function(selector, prop){
				var othis = this;
				$(selector).click(function (e) {
					//console.log("Click on property value : ", $(this).text());
					e.preventDefault();
					var prop2 = {
						path:prop.path,
						key:prop.key,
						value:prop.key,
						type:deep.Validator.getType(prop.key)
					}
					editInPlaceBlur.apply(othis, [this, prop2]);
				});
			},
			createInputHtml : function(prop){
				return this.templates.inputText(prop);
			},
			createPropertyHtml : function(prop){
				return this.templates.item(prop);
			},
			createObjectNodeHtml : function(prop){
				return this.templates.node(prop);
			},
			createArrayNodeHtml : function(prop){
				return this.templates.node(prop);
			},
			createHiddenPropertyHtml : function(prop){
				return this.templates.item(prop);
			},
			placeEntries : function(object, parentSelector, parentProp)
			{
				var othis = this;
				//console.log("placeEntries : object =", object, " parentSelector = ", parentSelector);
				var properties = [];
				for (var i in object) 
				{
					if(!object.hasOwnProperty(i)) 
						continue;
					properties.push({key:i,value:object[i]});
				}
				properties.forEach(function (prop)
				{
					othis.currentPath.push(prop.key);
					prop.path = othis.currentPath.join(".");
					prop.type = deep.Validator.getType(prop.value);
					prop.depth = othis.currentPath.length;
					if(prop.path != "id")
						switch(prop.type)
						{
							case 'array' :  
								// create node array
								var appended = $(othis.createArrayNodeHtml(prop)).appendTo(parentSelector);
								if(othis.editKeyAcess && (!parentProp || parentProp.type != 'array'))
									othis.editKeyInPlace($(appended).find(".property-key:first"), prop);
								othis.placeEntries(prop.value, $(appended).find(".property-childs:first"), prop);
								break;
							case 'object' :
								// create node object
								var appended = $(othis.createObjectNodeHtml(prop)).appendTo(parentSelector);
								if(othis.editKeyAcess && (!parentProp || parentProp.type != 'array'))
									othis.editKeyInPlace($(appended).find(".property-key:first"), prop);
								othis.placeEntries(prop.value, $(appended).find(".property-childs:first"), prop);
								break;
							default :
								// all other are editable datas
								var appended = $(othis.createPropertyHtml(prop)).appendTo(parentSelector);
								othis.editValueInPlace($(appended).find(".property-value:first"), prop);
								if(othis.editKeyAcess && (!parentProp || parentProp.type != 'array'))
									othis.editKeyInPlace($(appended).find(".property-key:first"), prop);
						}
					else
						var appended = $(othis.createHiddenPropertyHtml(prop)).appendTo(parentSelector).css("display", "none");
					othis.currentPath.pop();
				});
			},
			delegateHasChange:function(controller, oldValue, propertyInfo){
				console.log("DEFAULT DELEGATE NOT BINDED : json-editor.delegateHasChange : ", oldValue, " - ",propertyInfo);
			},
			hasChange:function(oldValue, propertyInfo){
				//this.createOutput();
				this.delegateHasChange(this, oldValue, propertyInfo);
			}
		};


		deep.ui.toEditableHTML= function(json, selector, schema, templates, editKey)
		{
			var alls = [];
			var editor = new JsonEditorController();
			alls.push(deep(templates || editor.templates)
			.query(".//*?_schema.type=string")
			.load());
			alls.push(deep.when(deep.get(json)));
			if(schema)
				alls.push(deep.when(deep.get(schema)));
			return deep(deep.all(alls)
			.done(function (loaded) {
				loaded.shift();
				editor.currentPath = [];
				editor.json = loaded.shift();
				if(schema)
					editor.schema = loaded.shift();
				if(templates)
					editor.templates = templates;
				editor.editKeyAccess = editKey;
				$(selector).empty();
				editor.placeEntries(editor.json, selector, null);
				return editor;
			}));
		};
		deep.ui.fromEditableHTML = function(selector, schema)
		{
			var output = {};
			var stack =  [output];
			//console.log("fromEditable html : try: ", selector + " *[property-type]");
			$(selector).find(" *[property-type]").each(function()
			{
				//console.log("fromEditable html : each proprty : ", this);
				var propType = $(this).attr("property-type");
				var depth = parseInt($(this).attr("property-depth"));
				var key = $(this).find(".property-key:first").text();
				while(stack.length > depth)
					stack.pop();
				var parent = stack[stack.length-1];
				var value = null;
				switch(propType)
				{
					case "array": 
						value = [];
						break;
					case "object":
						value = {};
						break;
					default :
						value = $(this).find(".property-value:first").text();
						value = deep.Validator.convertStringTo(value, propType);
				}
				if(parent instanceof Array)
					parent.push(value);
				else
					parent[key] = value;
				if(propType == 'array' || propType == 'object')
					stack.push(value);
			});
			//console.log("created output : ", output);
			//$(this.domSelectors.output).html(JSON.stringify(output,null , ' '));
			return deep(output);
		};
		return JsonEditorController;
	};
});













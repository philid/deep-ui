if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(function(require){

	var Compose = require("compose");
	var DeepFactory = require("deep/deep-factory");
		var count = 0;	
	var DeepLinker = Compose(DeepFactory, function(){
			var othis = this;
			
			$.address.change(function(event) {
				othis.change(event);
			});
			$.address.externalChange(function(event) {
				othis.externalChange(event);
			});
			$.address.internalChange(function(event) {
				othis.internalChange(event);
			});
	}, {
		setURL : function setURL (url) {
			$.address.value(url);
		},
		setURLParameter : function setURLParameter (paramName,paramValue) {
			$.address.parameter(paramName, paramValue);
		},
		delegateURLChanged : function URLChanged (params) {
			console.log("DEFAULT DELEGATE URLCHANGED NOT BINDED PARAMETERS GROUP = ", params);
		},
		change : function change (event) {
		//	console.log("adress change = ", event);
			var parametersGroups = {};
			//console.log("Address change : ", JSON.stringify(event), this.layer);
			
			//parcours les param et on cherche le matching dans le layer descriptif
			for(group in this.layer.groups)
			{
				//console.log("LAYER LOOP GROUPS , group = ", group);
			
				parametersGroups[group] = {};

				for (layerParam in this.layer.groups[group].parameters) {
					//console.log("LAYER LOOP GROUPS PARAM, layerParam = ", layerParam);
			
					if(event.parameters[layerParam])
					{
						//console.log("MATCHING -- param = ", layerParam, " -- value = ", event.parameters[layerParam]);
						//si on trouve un matching, on parse la var a l'aide de son parser (si pas, par defaut il prend la string qui suit
						// le =). Il la stock ensuite dans l'array des "groupes"
						var parameterValue = this.layer.groups[group].parameters[layerParam].parser(event.parameters[layerParam]);
						//break;
						parametersGroups[group][layerParam] = parameterValue;
					}
				}
			}
			//if(count < 5)
			//{
				this.delegateURLChanged(parametersGroups);
				count++;
			//}
			//else console.log("count arrive to end")
		},
		externalChange : function externalChange (event){
			console.log("Deep-linker : default external change : event : ", JSON.stringify(event, null, ' '))
		},
		internalChange:function internalChange(event){
			//console.log("Deep-linker : default internal change : event : ", JSON.stringify(event, null, ' '))

		},
		init:function init(){
			///console.log("INIT DEEP LINKER : ");
			
		}
	});

	return DeepLinker;
})


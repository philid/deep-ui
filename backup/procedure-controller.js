/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 * Manipulate a set of states, and manage sequence of them  
 * 

	Layer example :
	{
		"context":{
			// ...		
		},
		"start":"start",
		"states":{
			"start":{
				"inherits":[ "/Member/viewcontroller1.json", "/brol/state2.json"],
				"controller":"path/MyStateControllerClass"
				"lib-js":{
					
				},
				domSelectors:{
					parent:"...",
					me:"..."
				},
				"templates":{
					"root":"rootTemplatePath.html",
					"includes":[],
					macros:["..."]
				},
				"context":{},
				subControllers:{
					"menu":{
						"inherits":"/demo/mymenu.json",
						"domSelectors":{
							parent:"...."
						},
						"controller":"path/MyControllerClass.js",
						context:{}
					}
				},
				"schema":"/Member/schema",
				"inputs":{
					"list":{
						"submit":{
							action:"submit"
						}
					},
					"subgroups":{
						"address":{
							
						}
					},
					"split":{
						group1:[ "dataPath1", "da"]
					}
				},
				"send":{
					"url": "/Member",
					successHandler:function(sendResult){
						// do something
						// return nothing
					},
					failHandler:function(sendResult){
						// do something
						// return nothing
					}
				},
				
				//	@param procedureController the procedure controller which handle the state
				//	@param stateOutput the result object of the current state
				//	@param sendResult the result of the optional send defined above (e.g. {data:..., msg:..., jqXHR:...}). Will be null if no send is defined
				
				next:function(procedureController, stateOutput, sendResult){
					console.log("start.next() : currentState : "+JSON.stringify(procedureController.currentState));
					console.log("start.next() : output : "+JSON.stringify(stateOutput));
					console.log("start.next() : sendResult : "+JSON.stringify(sendResult));
					return "state2";
				}
			},
			"state2":{
				"schema":"/Profile/schema",
				"inputs":["/demo/local/befr/json/inputs-profiles.json"],
				"send":{
					"type":"POST",
					"url": "/Profile"
				}
			}
		}
	}





	member : {
		"schema":"/Member/schema",
		"inputsGroups":["/Member/inputs"],
	}
 */
if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}

define(function(require)
{
	var Compose = require("compose");
	var ContextLoader = require("leaf/loader/context-loader");
	var deepCopy = require("leaf/deep-copy").deepCopy;
	var LayerFactory = require("leaf/layer-factory");
	var RequestFactory = require("leaf/request-factory");
	var validateSchema = require('leaf/schema-validation').validate;
	var ProcedureStateLoader = require("leaf/loader/procedure-state-loader");
	var FormController = require("leaf/controller/form-controller");
	//____________________________________________________________________________ 
	var ProcedureController = Compose(LayerFactory,  
		function(){
			var stateLoaderFunc = function(loads, map, states){
				for(var i in states) 
					{
						var state = this.states[i];
						state.id = i;
						var stateLoader = new ProcedureStateLoader(this);
						stateLoader.applyLayer(state);
						loads.push(stateLoader.load());	
						map.push(i);
					}
			}
			this.setLayerLoadHandler("states", stateLoaderFunc )
		},
		{
			init : Compose.after(function()
			{
				this.stack = new Array();
				this.currentState = this.states[this.layer.start];
				if(this.currentState)
				{
					this.stack.push(this.currentState);
					this.stackIndex = 0;
				}
			})
		}
	);

	ProcedureController.prototype.layerSchema = {
		properties:{
			context:{ required:false },
			firstState:{ type:"string", required:true },
			states:{
				patternProperties:{
					"/./g":ProcedureStateLoader.layerSchema
				}
			},
			onCancel:{},
			onFinalise:{}
		}
	};

	ProcedureController.prototype.currentState = null;
	ProcedureController.prototype.stackIndex = null;
	ProcedureController.prototype.container = "";
	ProcedureController.prototype.stack = null;
	ProcedureController.prototype.trySend = true;
	ProcedureController.prototype.keepGoingWithError = false;
	ProcedureController.prototype.states = null;
	ProcedureController.prototype.context = null;


	/**
	* naviguate through stack by index (index start at 0)
	*/
	
	ProcedureController.prototype.jumpToStateByIndex = function(index)
	{
		if(index >= this.stack.length || index == this.stackIndex)
			return;
		//alert("gotoState : "+index + " - current : " + this.currentStateIndex);
		var newState = this.stack[index];
		this.currentState = newState;
		this.stackIndex = index;
	}
	/**
	*
	*/
	ProcedureController.prototype.cancel = function()
	{
		console.log("procedure cancel : doing nothing for the moment")
	}

	/**
	*
	*/
	ProcedureController.prototype.finalise = function()
	{
		console.log("procedure finalisation : doing nothing for the moment")
	}


	/**
	*
	*/
	ProcedureController.prototype.back = function()
	{
		//	alert("controler previous");
		this.jumpToStateByIndex(this.stackIndex-1);
	}
	/**
	* Is fired when current state is fully validated : applies transition to next state and posts current state if necessary
	*/
	ProcedureController.prototype.execute = function (output)
	{
		var othis = this;
		this.currentState.output = output;
		var deferred = $.Deferred();
		var report = null;
		var result = {
						report:null,
						error:null,
						state:null,
						controller:othis
					}
		if(this.currentState.schema)
			result.report = validateSchema(this.currentState.output, this.currentState.schema);
    	if(result.report && result.report.errors.length > 0)
    	{
    		result.error = "validation";
    		deferred.reject(this, result);
    		return promise.promise(deferred);
    	}	
    	//this.currentState.output = output;
		//console.log("Form is valide");
		var tryNext = function(object)
		{
			console.log("____________________ TRY NEXT : ")
			
			if(othis.currentState == null)
				return null;		

			if(typeof othis.currentState.next === 'function')
			{	
				//console.log("WILL CALL currentState.next()")
				var deferred = $.Deferred();
				$.when(othis.currentState.next(othis, object)).then(
				function(next){
					console.log("next function of state gives : "+JSON.stringify(next))
					if(typeof next === "string")
						othis.currentState = othis.states[next];
					else
						othis.currentState = next;
					result.state = othis.currentState;
					othis.stackIndex++;
					if(othis.stack.length > othis.stackIndex)
					{
						var n = othis.stack[othis.stackIndex];
						if(n.id != othis.currentState.id)
						{
							while(othis.stack.length>othis.stackIndex)
								othis.stack.shift();
							othis.stack.push(othis.currentState);
						}
					}
					else 
						othis.stack.push(othis.currentState);
					
					if(othis.currentState)
						deferred.resolve(result);
					else 
					{
						console.log("End Procedure : next state == null");
						deferred.resolve(result);
					}	
				}, function(res){
					result.error = "next-state"
					result.msg = res;
					console.log("Error : next function from state failed on call (promise rejected)");
					deferred.reject(result);
				});
				return promise.promise(deferred);
			}
			console.log("End procedure (no next function in state)");
			return null;
		}
		
    	return $.when(tryNext(object));                     
    }

	return ProcedureController;
});

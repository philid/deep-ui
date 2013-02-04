/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */
if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}

define(function(require)
{

	var deepCopy = require("deep/deep-copy").deepCopy;
	var FormController = require("deep-ui/form-controller");

//_______________________________

	var ProcedureStateLoader =  Compose(LayerFactory,
		function(procedure){
			this.procedure = procedure;
		},
	 {
		load : function(){
				var deferred = $.Deferred();
				var othis = this;
				
				this.next = this.layer.next;
				// if client
				this.controller = ProcedureStateLoader.create(this.layer);
				
				this.controller.delegateSubmitSuccess = function(report){
					othis.delegateSubmitSuccess(report);
				}
				this.controller.delegateSendError = function(report){
					othis.delegateSendError(report);
				}
				this.controller.delegateBack = function(controller){
					othis.delegateBack(othis);
				}
				this.controller.delegateCancel = function(controller){
					othis.delegateCancel(othis);
				}
				// if server : use this.controller = LayerFactory avec load FormController
				var loads = [this.controller.load()];

				return promise.all(loads).then(function(res)
				{
					//console.log("ProcedureStateLoader.load is done : "+JSON.stringify(this.layer))
					deferred.resolve(othis);
				}, function(msg){console.log("ProcedureState.load failed : "+msg); deferred.reject(othis); }) 
				return promise.promise(deferred);
			}
	});

	ProcedureStateLoader.create = function(layer)
	{
		var ctrler = null;
		if(layer.controller)
			ctrler = require(layer.controller);
		else 
			ctrler = new FormController();
		ctrler.applyLayer(layer);
		return ctrler;
	}
	ProcedureStateLoader.prototype.controller = null;
	ProcedureStateLoader.prototype.output = null;
	ProcedureStateLoader.prototype.layerSchema = {
		next:{
			type:"any",
			required:false
		}
	}

	ProcedureStateLoader.prototype.delegateSubmitSuccess = function(report)
	{
		console.log("Default delegate : ProcedureStateLoader.delegateSubmitSuccess()")
	};

	ProcedureStateLoader.prototype.delegateCancel = function(controller)
	{
		console.log("Default delegate : FormController.delegateCancel()")
	};

	ProcedureStateLoader.prototype.delegateBack = function(controller)
	{
		console.log("Default delegate : FormController.delegateCancel()")
	};

	ProcedureStateLoader.prototype.delegateSendError = function(report)
	{
		console.log("Default delegate : FormController.delegateSendError()")
	};
	
	deepCopy(FormController.prototype.layerSchema, ProcedureStateLoader.prototype.layerSchema, false)
	return ProcedureStateLoader;

});
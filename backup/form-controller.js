/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */
/**
 * FormController 

TODO :
 */
if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}
define(function defineFormController(require){

	var Validator = require("deep/deep-schema");
	var validator = new Validator();
	var RequestFactory = require('leaf/deep-request');
	var ListController = require("deep-ui/list-controller");
	var InputsDataBinder = require("deep-ui/inputs-data-binder");
	var utils = require("deep/utils");
	var deepCopy = require("deep/deep-copy").deepCopy;
    var Compose = require("compose");
    var promise = require("deep/promise");

	var layerSchema = {
    	properties:{
    		
			"ressource":{
				loadable:"none",
				"interpretation-deepness":"direct",
				required:false,
				properties:{
					"uri": { type:"string", required:true },
	    			"schema":{ type:"string", required:false, loadable:"direct", reloadable:false, "interpretation-deepness":"direct" },
					handlers:{
						properties:{
							post:{
								properties:{
									success:{type:"function"},
									failed:{type:"function"}
								}
							},
							put:{
								properties:{
									success:{type:"function"},
									failed:{type:"function"}
								}
							},
							get:{
								properties:{
									success:{type:"function"},
									failed:{type:"function"}
								}
							},
							"delete":{
								properties:{
									success:{type:"function"},
									failed:{type:"function"}
								}
							}
						}
					}
				}
			},
			"items":{
				loadable:"none",
				"interpretation-deepness":"none",
				required:false,
				type:"object",
				patternProperties:{
					"/.*/g":{
						properties:
						{
							dataPath:{ type:"string", required:true },
						}
					}
				}
			}
		}
    }

    var FormControllerAspect = Compose(function FormControllerAspectConstructor(){},{ });
    
    FormControllerAspect.prototype.layerSchema = layerSchema;
	FormControllerAspect.prototype.errors = null;
	FormControllerAspect.prototype.dataPath = null;
	
	FormControllerAspect.prototype.trySend = true;
	FormControllerAspect.prototype.dataBinder = null;

 	FormControllerAspect.prototype.delegateSubmitSuccess = function(report)
	{
		console.log("form-controller","Default delegate : FormControllerAspect.delegateSuccess()")
	}

	FormControllerAspect.prototype.delegateCancel = function(controller)
	{
		console.log("form-controller","Default delegate : FormControllerAspect.delegateCancel()")
	}

	FormControllerAspect.prototype.delegateBack = function(controller)
	{
		console.log("form-controller","Default delegate : FormControllerAspect.delegateBack()")
	}

	FormControllerAspect.prototype.delegateNextSuccess = function(controller)
	{
		console.log("form-controller","Default delegate : FormControllerAspect.delegateNextSuccess()")
	}

	FormControllerAspect.prototype.delegateSendError = function(report)
	{
		console.log("form-controller","Default delegate : FormControllerAspect.delegateSendError()")
	}

	/**
		@return a report composed of : {
			validation:null,			// the validation report (see JSV)
			output:output,				// the result of the form
			send:null,					// the send report
			error:null 					// the optional error
		}
	*/
	FormControllerAspect.prototype.submit = function submit()
	{	
		if(console.flags["form-controller"]) console.log("form-controller","submit");
		
		var othis = this;

		if(!this.dataBinder)
		{
			this.dataBinder = new InputsDataBinder();
			this.dataBinder.parentSelector = this.domSelectors["inputs-container"] ||  this.domSelectors.parent;
		}

		if(!this.output)
			this.output = {};

		var output = this.dataBinder.toDatas();
		deepCopy(output, this.output, true);
		//if(console.flags["form-controller"]) console.log("form-controller","datas : "+JSON.stringify(output))
		var report = {
			validation:null,
			output:output,
			send:null,
			error:null
		}

		this.beforeValidation();
		var deferred = promise.Deferred();

		var afterValidation = function afterValidation(report){
				if(report.validation  && !report.validation.valid)
				{
					if(console.flags["form-controller"]) console.log("form-controller", "errors on validation ")
					for(var i in report.validation.errorsMap)
					{
						var e = report.validation.errorsMap[i];
						e.itemsMap = othis.dataBinder.pathMap[i];
					}
					othis.manageErrors(report);
					report.ressource = null;
					report.error = "validation";
					deferred.resolve(report);
				}
				else 	//if(console.flags["form-controller"]) console.log("form-controller","will submit : " + JSON.stringify(this.output))
					if(!othis.ressource)
					{
						if(console.flags["form-controller"]) console.log("form-controller","will don't send");
							deferred.resolve(report);
					}
				else
					othis.send(report, deferred);
		}

		if(this.schema)
		{
			if(console.flags["form-controller"]) console.log("form-controller", " will validate : " +JSON.stringify(this.output) + " - with : " + JSON.stringify(this.schema))
			promise.when(validator.partialValidation(this.output, this.schema)).then(function validationDone(rep)
			{
				report.validation  = rep;
				if(console.flags["form-controller"]) console.log("form-controller", " have validate : " +JSON.stringify(report.validation))
				afterValidation(report);
			});

		}
		else
			afterValidation(report);
		return promise.promise(deferred);  
	}

	FormControllerAspect.prototype.send = function send(report, deferred){
		var handlers = null;
		var send = this.ressource;
		var othis = this;
		var done =  function sendDone(data, msg, jqXHR){
			if(console.flags["form-controller"]) console.log("form-controller", "submit success "+JSON.stringify(arguments));
			othis.output = othis.dataBinder.datas = data;
			report.ressource = {
				data:data,
				msg:msg,
				jqXHR:jqXHR
			};
			report.ressource.data = data;
			report.ressource.msg = msg;
			report.ressource.jqXHR = jqXHR;
			if(handlers && handlers.success)
				handlers.success(report);
			othis.delegateSubmitSuccess(report);
			deferred.resolve(report);
		}
		var fail = function sendFail(res, msg, jqXHR){
			if(console.flags["form-controller"]) console.log("form-controller", "error while connecting to service "+JSON.stringify(arguments));
			report.error = "send";
			report.ressource = {};
			report.ressource.data = res;
			report.ressource.msg = msg;
			report.ressource.jqXHR = jqXHR;
			if(handlers && handlers.failed)
				handlers.failed(report);
			othis.delegateSendError(report);
			deferred.reject(report);
		}
		if(!send || !this.trySend)
		{
			if(console.flags["form-controller"]) console.log("form-controller","will don't send");
			done();
			return promise.promise(deferred);
		}
		if(console.flags["form-controller"]) console.log("form-controller","will send : "+JSON.stringify(this.output));
		var sendType = send.type || (this.output.id)?"PUT":"POST";

		switch(sendType)
		{
			case "POST" : 
				handlers = send.post;
				promise.when(RequestFactory.post( send.url, this.output)).then(done,fail); 
				break;
			case "PUT" : 
				handlers = send.put;
				promise.when(RequestFactory.put( send.url, this.output)).then(done,fail); 
				break;
			default : throw "Error : while sending : unrecognised method (send.type)";
		}
    	
	}


	FormControllerAspect.prototype.next = Compose.around(function next(oldNext){ 
		return function next()
		{
			if(!this.steps || this.stepIndex >= this.steps.length-1)
			{
				if(console.flags["form-controller"]) console.log("form-controller", "try to go one step next : but your already at last step ! return. ")
				return this.submit();
			}	
			var othis = this;

			if(!this.dataBinder)
			{
				this.dataBinder = new InputsDataBinder();
				this.dataBinder.parentSelector = this.domSelectors["inputs-container"] || this.domSelectors.parent;
			}
			//if(!this.output)
				this.output = {};

			var output = this.dataBinder.toDatas();
			deepCopy(output, this.output, true);
			//if(console.flags["form-controller"]) console.log("form-controller","datas : "+JSON.stringify(output))
			var report = {
				controller:this,
				validation:null,
				output:output,
				send:null,
				error:null
			}

			var deferred = promise.Deferred();
			var afterValidation = function afterValidation(report){
				if(report.validation  && !report.validation.valid)
				{
					if(console.flags["form-controller"]) console.log("form-controller", "errors on validation : "+JSON.stringify(report.validation))
					for(var i in report.validation.errorsMap){
						var e = report.validation.errorsMap[i];
						e.itemsMap = othis.dataBinder.pathMap[e.path];
					}
					othis.manageErrors(report);
					report.ressource = null;
					report.error = "validation";
				}
				promise.when(oldNext.apply(othis)).then(function(rep){
					deferred.resolve(report)
				});
			}
		
			this.beforeValidation();
			if(this.schema)
			{
				if(console.flags["form-controller"]) console.log("form-controller", " will validate : " +JSON.stringify(this.output) + " - with : " + JSON.stringify(this.schema))
				promise.when(validator.partialValidation(this.output, this.schema)).then(function(rep){
					report.validation  = rep;
					afterValidation(report);
				});
			}
			else 
				afterValidation(report);
				
			return promise.promise(deferred);
		}
	});

	FormControllerAspect.prototype.beforeValidation = function beforeValidation()
	{
		
	}

	FormControllerAspect.prototype.beforeSend = function beforeSend()
	{
		
	}

	FormControllerAspect.prototype.clear = function clear()
	{
		if(!this.dataBinder)
		{
			this.dataBinder = new InputsDataBinder();
			this.dataBinder.parentSelector = this.domSelectors["inputs-container"] ||  this.domSelectors.parent;
		}
		this.output = this.dataBinder.datas = {};
		this.dataBinder.clear();
	}

	/**
	 * @param object optional; if provided the object will be used to fill. Otherwise, it use previous output.

	 */
	FormControllerAspect.prototype.fill = function fill(object)
	{
		if(!this.output)
			this.output = {};
		deepCopy(object, this.output, true);
		if(!this.dataBinder)
		{
			this.dataBinder = new InputsDataBinder();
			this.dataBinder.parentSelector = this.domSelectors["inputs-container"] ||  this.domSelectors.parent;
		}
		this.dataBinder.fillFields(this.output);
		//this.clear();
		//tinyMCESetup();
	}

	FormControllerAspect.prototype.applySchema = function applySchema(schema, overwrite)
	{
		if(overwrite == undefined)
			overwrite = true;
		if(this.schema == null)
			this.schema = {};
		deepCopy(schema, this.schema, overwrite);
	}

	FormControllerAspect.prototype.manageErrors = function manageErrors(report)
	{
		if(report.validation && !report.validation.valid)
		{
			for(var i in this.items)
			{
				if(report.validation.errorsMap[this.items[i].dataPath])
					report.validation.errorsMap[this.items[i].dataPath].controller = this.items[i];
			}
			for(var i in report.validation.errorsMap)
			{
				var e = report.validation.errorsMap[i]
				/*e.errors.forEach(function(err)
				{
					//if(console.flags["form-controller"]) console.log("form-controller","ERRORS  : "+JSON.stringify(err)+" - details : "+JSON.stringify(err.message))
				});*/
				this.setErrorState(i, e);	
			}
		}
	}

	FormControllerAspect.prototype.setErrorState = function(path, errorMap){
		//errorMap.controller.refresh();
		errorMap.itemsMap.forEach(function manageErrorOnItemsMap(inputMap){
					//if(console.flags["form-controller"]) console.log("form-controller","ERRORS  : "+JSON.stringify(err)+" - details : "+JSON.stringify(err.message))
			$(inputMap.input).css("background-color","#FF0000");
		})
	}

	FormControllerAspect.prototype.clearErrorState = function(path, errorMap){
		errorMap.itemsMap.forEach(function manageErrorOnItemsMap(inputMap){
					//if(console.flags["form-controller"]) console.log("form-controller","ERRORS  : "+JSON.stringify(err)+" - details : "+JSON.stringify(err.message))
			$(inputMap.input).css("background-color","#FFFFFF");
		})
	}

	var FormController = Compose( ListController, FormControllerAspect);
	FormController.aspect = FormControllerAspect;
    FormController.prototype.layerSchema = deepCopy(ListController.prototype.layerSchema, layerSchema, false);
	return FormController;
})
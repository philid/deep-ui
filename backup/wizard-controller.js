// WizardController
/*
* @author Gilles Coomans <gilles.coomans@gmail.com>
It's a view controller, (so a LayerFactory by inheritance), and a ProcedureController
*/


if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}
define(function(require){
	var Compose = require("compose");
	var deepCopy = require("deep/deep-copy").deepCopy;
	var ViewController = require("deep-ui/view-controller");
	var ProcedureController = require("deep-ui/procedure-controller");
	//________________________________________________________________________________________________
	var WizardController = Compose(ViewController, ProcedureController, function(){
		
	},{
		init:Compose.after(function(){
			this.buttonMap = {};
			for(var i in this.states)
			{
				//console.log("CHECK WIZARD STATE AFTER INIT : "+JSON.stringify(this.states[i]))	
			}
			if(this.currentState)
				this.prepareState(this.currentState);
		}),
		jumpToState:Compose.around(function(oldJump){
			return function(index){
				var curIndex = this.stackIndex;
				oldJump.apply(this, [index]);
				if(this.stackIndex != curIndex && this.currentState.view)
					this.currentState.view.refresh();
			}
		}),
		back:Compose.around(function(oldBack){
			return function(){
				var curIndex = this.stackIndex;
				oldBack.apply(this, [index]);
				if(this.stackIndex != curIndex && this.currentState.view)
					this.currentState.view.refresh();
			}
		}),
		cancel:Compose.after(function(){

		})
	});
	WizardController.prototype.buttonMap = {};
	WizardController.prototype.formManipulator = null;
	WizardController.prototype.prepareState = function(state){

		console.log("_______________________________ Prepare State : "+JSON.stringify(state));
		// apply inputs models
		var othis = this;
		// load inputs context and templates

		state.delegateSendSuccess = function(report){
            executeStep(report);
        }
		state.delegateSendError = function(report){
        	executeStep(report);
        }
        state.delegateCancel = function(state){
        	othis.cancel();
        }
        state.delegateBack = function(state){
        	othis.back();
        }

        var executeStep = function(report){
        	if(report.error == null)
        	{
        		$.when(othis.execute(report)).then(function(report){
            		if(report.state)
            			othis.prepareState(state);
            		else if(!report.error)
            		{
            			if(othis.onFinalise)
            				othis.onFinalise.apply(othis);
            			else
            				console.log("unmanaged finalisation of procedure : "+JSON.stringify(report));
            		}	
            		else
            			console.log("unmanaged error after procedure execution : "+JSON.stringify(report))
            	})
    		}
    		else
    			console.log("unmanaged error on submit current state : "+JSON.stringify(report));
        }

		console.log("_____________________________________________________ prepare state : "+JSON.stringify(this.domSelectors))
		state.controller.load().then(function(view){
			view.render();
			if(!view.placeInDOM())
				return;
			view.setBehaviour();
		})
	}

	return WizardController;
}) 
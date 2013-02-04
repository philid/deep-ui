/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */

if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(function RessourceControllerDefine(require){
	var Compose = require("compose");
	var deepCopy = require("deep/deep-copy").deepCopy;
	var DeepFactory = require("deep/deep-factory");
	var RequestFactory = require("deep/deep-request");
	var promise = require("deep/promise");
	var RessourceController = Compose(ViewController, function(){
		
	}, {
		show:function(id, options){

		},
		edit:function(id, options){

		},
		create:function( options ){

		},
		showList:function( options ){

		}
	});

	RessourceController.prototype.layerSchema = {
		"inherits":[DeepFactory.prototype.layerSchema],
		uri:"deep-ui/ressource-controller",
		properties:{
			ressource:{
				properties:{
					uri:{ type:"string", required:true }
				}
			},
			subs:{
				properties:{
					view:{
						subfactory:"simple",
						loadedWithParent:false,
						defaultController:"instance::deep-ui/view-controller"
					},
					form:{
						subfactory:"simple",
						loadedWithParent:false,
						defaultController:"instance::deep-ui/form-controller"
					},
					list:{
						subfactory:"simple",
						loadedWithParent:false,
						defaultController:"instance::deep-ui/list-controller"
					}
				}
			},
			init:Compose.after(function(){

			})
		}
	};

	return RessourceController;
});
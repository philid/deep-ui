if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}

define(function(require){
	var Compose = require("compose");
	var GenericStore = require("deep/store/generic-store");
	
	var cookiesStore = Compose.create(GenericStore,{

				createCollection : Compose.after(function createCollection (name, entry) {

					var collection = $.cookie(name);
					if(collection){
						//console.log("cookiesStore retrive cookies name : " + name + " = " + JSON.parse(collection));
						this.collections[name] = JSON.parse(collection);
					} 
					//$.cookie(name,JSON.stringify(this.collections[name]), {expires:365,path:"/"});
					//console.log("cookiesStore createCollection name : " + name + " - entry : " + JSON.stringify(entry));
				}),

				addItem : Compose.after(function addItem (name, data) {
					//console.log("AddItem cookies before" + JSON.stringify($.cookie(name)) + " - " + JSON.stringify(this.collections[name] ));
					$.cookie(name,JSON.stringify(this.collections[name]), {expires:365,path:"/"})
					//console.log("AddItem cookies after" + JSON.stringify($.cookie(name)) )
				}),
				removeItem : Compose.after(function removeItem (name, data) {
					//console.log("removeItem cookies before" + JSON.stringify($.cookie(name)) + " - " + JSON.stringify(this.collections[name] ));
					$.cookie(name,JSON.stringify(this.collections[name]), {expires:365,path:"/"})
					//console.log("removeItem cookies after" + JSON.stringify($.cookie(name)) + " - " + JSON.stringify(this.collections[name] ));
						
				}),
				clearCollection :  Compose.after(function clearCollection (collectionName) {
					if(this.layer.entries[collectionName].schema.type == "array")
					{
						$.cookie(collectionName,"[]", {expires:365,path:"/"});
					}
				})

			

	});
	/*cookiesStore.applyLayer(
		{
			
		}
	);
*/
	return cookiesStore;
})
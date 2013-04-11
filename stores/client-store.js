if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}

define(function(require){
	var Compose = require("compose");
	var LayerFactory = require("deep/deep-factory");
	var cookiesStore = require("deep/store/cookies-store")
	
	var ClientStore = Compose(LayerFactory,{

		createCollection : function createCollection (name,entry) {
			if(!this.collections){
				this.collections = {}
			}
			switch(entry.engine){
				case "cookies" :
					this.collections[name] = cookiesStore;
					cookiesStore.createCollection(name,entry);
					//console.log("coookies: "+this.collections[name]);
					break;
				default:
					console.log("Warning : entry engine not recognize");
			}

		},
		getCollection : function getCollection (name) {
			//console.log("collecitonname" + name);
				if(!this.collections){
					this.collections = {}
				}
			return this.collections[name].getCollection(name);
		},
		addItem : function addItem (name,data) {
			this.collections[name].addItem(name,data);
		},
		removeItem : function removeItem (name,data) {
			this.collections[name].removeItem(name,data);
		},
		toggleItem : function toggleItem (name,data) {
			this.collections[name].toggleItem(name,data);
		},
		init:Compose.after(function init () {
				if(!this.collections){
					this.collections = {}
				}
			//console.log("INIT CLIENT STORE : " , JSON.stringify(this.layer.entries));
			for (var i in this.entries) {

				this.createCollection(i,this.entries[i]);
			}
		}),

		clearCollection : function clearCollection (collectionName) {
			this.collections[collectionName].clearCollection(collectionName);
		}

	});
	
	return new ClientStore();
})
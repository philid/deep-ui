if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}

define(function(require){
	var Compose = require("compose");
	var LayerFactory = require("deep/deep-factory");
	var utils = require("deep/utils");
	
	var GenericStore = Compose(LayerFactory,{});
	GenericStore.prototype =
	{
		getCollection: function getCollection (name) {
			
				return this.collections[name];
		},

		createCollection : function createCollection (name, entry) {
			if(!this.collections){
				this.collections = {}
			}

			this.collections[name] = null;
			
			if(entry.schema.type == "array"){
				this.collections[name] = [];
			}

			if(!this.entries)
				this.entries = {};
				this.entries[name] = entry;

			///console.log("cookie-manager createCollection name : " + name + " - entry : " + JSON.stringify(entry));
		},
		addItem : function addItem (collectionName, data) {
			var entry = this.entries[collectionName] 
			if(entry.schema.type == "array")
			{
				if(entry.schema.uniqueItems)
				{
					//console.log("addItem before merge " + JSON.stringify(this.collections[collectionName]));
					this.collections[collectionName] = utils.arrayFusion(this.collections[collectionName], [data]);
					//console.log("addItem after merge " + JSON.stringify(this.collections[collectionName]));
				} else {
					this.collections[collectionName].push(data);
				}
			}	
		},
		removeItem : function removeItem (collectionName, data) {
			var entry = this.entries[collectionName];
			var collection = this.collections[collectionName];
			if(entry.schema.type == "array")
			{
				var i = 0; 
				for (; i < collection.length; i++)
					if(collection[i] == data)
						 break;
				
				collection.splice(i,1);
			}	
		},
		toggleItem : function toggleItem (collectionName, data) {
			var entry = this.entries[collectionName] 
			if(entry.schema.type == "array")
			{
				if(entry.schema.uniqueItems)
				{
					if(utils.inArray([data],this.collections[collectionName]))
					{
						this.removeItem(collectionName, data);
					} else 
					{
						this.addItem(collectionName, data);
					}
					
				} else {
					console.log("TYPE NOT TOGGLEABLE !!");
				}
			} else {
				console.log("TYPE NOT TOGGLEABLE !!");
			}	
		},
		clearCollection : function clearCollection (collectionName) {
			if(this.entries[collectionName].schema.type == "array")
			{
				this.collections[collectionName] = [];
			}
		}
	}

	return GenericStore;
})
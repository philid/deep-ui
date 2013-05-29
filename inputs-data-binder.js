/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */
/*
For client use only (need jquery)

	deep
	.store("store.rest::/Discipline/")
	.query("/brol")
	.render(...)
	.bind(...)
	
	ViewController.prototype.preload

binding type : 
	data-path
	html_to_json
	data-item

// case  :you have a bunch of item, identicaly renderable and bindable


	deep(...)
	.query("...")
	.render({
		how:"",
		where:"",
		bind:{
			type:"data-path",		// default
			errorHandler:function ($nodes, binder) {
				// manage entry error
			},
			done:function  (argument) {
				// body...
			}
		},
		done:function ($nodes, injected, binder) {
			// 'this' here mean the context from where the rendering is done (by default the same as injected)
			// add behaviour
		}
	})
	.done:function ($nodes) {
		// add submit behaviour : return promise of submition : so the post (next chaining) will be fired on submition
	}
	.post()

//_______________________________________________________

case : you have an already constructed form (or bunch of inputs) somewhere in DOM, and you want to bind it without rendering (it's already done)

	deep({ name:"ced" })
	.bind("#form-contact", {
		type:"data-path",		// default
		errorHandler:function ($nodes, binder) {
			// manage errors
		},
		done:function ($nodes, ) {
			// add behaviour
		}
	})
	.done(function (binder) {
		var def = deep.Deferred();
		var self = this;
		nodes.find("...").click(function (argument) {
			var report = binder.validate();
			if(report.valid)
				def.resolve(report.value);
		});
		return deep.promise(def);
	})
	.post(...)


	dans _deep_entry : stocker le binder
	

//_______________________________________


protocole : app::

si on a plusieurs app : on peut seter un truc genre :

deep.request.protocole("app2", {
	parse:function (request) {
		// body...
	},
	get:function (argument) {
		// body...
	}
})

ou

deep.request.protocole.app("app2", monApp)

//________________________________________________


d'ailleurs : 
deep(deep.request).up({
	protocoles:{
		json:{
			parse:function (protocoleInfos, request) {
				return deep.request.parser(request).uri(false).deeprql(false)
			},
			get:function (parsed) {
				return $.ajax(...)
			}
		},
		"json.range":{
			parse:function (protocoleInfos, request) {
				return deep.request.parser(request).uri(false).deeprql(false)
			},
			get:function (parsed) {
				return $.ajax(...)
			}
		}
	}
})

deep.request.protocole(["app2"], {
	parse:function (protocoleInfos, request) {
		return deep.request.parser.rql(request)
	},
	get:function (parsed) {
		
	}
});

deep.request.protocole(["app","rss"], {
	parse:function (protocoleInfos, request) {
		return deep.request.parser.rql(request)
	},
	get:function (parsed) {
		
	}

});

//____________________

pas de deep.request(...)
puisque :
deep(...).chain

et deep.request.all().chain
deep.request.json()
deep.request.range() ...





//____________________________________



deep.store("json::/campaign/").query("...").up(...).put()

deep
.store("json::/campaign/")
.query("...", { range:... })
.ui()
.render(...)
.bind(...)
...


// set dummies or custom store : 
deep.store("json::/campaign/", [...])


deep.store("json::/campaign/")
.range(...)
.done(function (range) {
	 // e.g. set pager
}) 
.render(...)
.bind(...)
.done(function (nodes) {
	
})

...

deep.ui("...").render().bind()

*/
if(typeof define !== 'function')
	var define = require('amdefine')(module);

define( function(require){
	var deep = require("deep/deep");

	var InputsDataBinder =  function (){
		//console.log("InputsDataBinder Constructor : ", this);
	};
	
	InputsDataBinder.prototype.datas = null;
	InputsDataBinder.prototype.pathMap = null;
	InputsDataBinder.prototype.output = null;
	InputsDataBinder.prototype.inputs = null;

	InputsDataBinder.prototype.parentSelector = null;
	InputsDataBinder.prototype.init = function init(parentSelector, input_datas, schema){
		this.output = {};
		this.inputs = [];
		this.schema = schema || {};
		this.parentSelector = parentSelector;
		if(input_datas){
			this.datas = input_datas;
			this.fillFields(input_datas);
		}
		else
			this.datas = {};
		return this;
	}


	InputsDataBinder.prototype.replaceInDataPaths = function replaceInDataPaths(what, by)
	{
		$(this.parentSelector + " input[data-path]").each(function replaceInputsDataPath(){
			var path = $(this).attr("data-path");
			// console.log("createPathMap : got "+path)
			$(this).attr("data-path", path.replace(what, by));
		});
		$(this.parentSelector + " select[data-path]").each(function replaceSelectDataPath(){
			var path = $(this).attr("data-path");
			$(this).attr("data-path", path.replace(what, by));
		});
		$(this.parentSelector + " textarea[data-path]").each(function replaceTextAreaDataPath(){
			var path = $(this).attr("data-path");
			$(this).attr("data-path", path.replace(what, by));
		});
		return this;
	} 


	InputsDataBinder.prototype.toDatas = function toDatas()
	{
		//console.log("InputsDataBinder.toDatas ")	
		this.output = {};
		this.createPathMap();

		//tinyMCE.triggerSave();
		//console.log("InputsDataBinder.toDatas : after createPathMap : this.output ? "+JSON.stringify(this.output))
		for(var f in this.pathMap)
		{
			//console.log("INputsDataBinder.toDatas() : analyse path map : key : ", f);
			for(var i = 0; i < this.pathMap[f].entries.length; ++i)
			{
				var field = this.pathMap[f].entries[i];
				var val = null;
				switch(field.type){
					case "checkbox" : 
						if($(field.input).prop("checked"))
							val = $(field.input).val();
						break;
						
					case "button" : break;
					case "submit" : break;

					case "radio" : 
						if($(field.input).prop("checked"))
							val = $(field.input).val();
						break;
					
					case "select" :
						val = new Array();
						$(field.input).find("option:selected").each(function(){
							val.push($(this).val());
						})
						if(!$(field.input).prop("multiple") && val.length == 1)
							val = val.shift();
						break;

					case "text" :
					case "hidden":
					case "password":
					case "textarea":
						if(  $(field.input).hasClass("html-text") )
						{
							val = $(field.input).data('liveEdit').getXHTMLBody();
							//console.log("HTML-TEXT databinded : ", val);
						} else
							val = $(field.input).val();
						break;
					default : // text, hidden, textarea
						null;
				}
				if(val == "null" || val == "undefined" || val == undefined)
					val = null;

				//console.log("INputsDataBinder.toDatas() : analyse field : ", field )
				//console.log("INputsDataBinder.toDatas() : field has schema: ", this.pathMap[f].schema )

				if(this.pathMap[f].schema)
				{
					//console.log("DATA BINDER : to datas : ", f, " - ", this.pathMap[f].schema )
					 if(val == null && this.pathMap[f].schema.type && this.pathMap[f].schema.type instanceof  Array && deep.utils.inArray("null", this.pathMap[f].schema.type || []))
					 	;
					 else
						switch(this.pathMap[f].schema.type)
						{
							case "array" : 
								if(field.lastNodeRef[field.lastPathPart] == null)
									field.lastNodeRef[field.lastPathPart] = new Array();
								break;
							case "number" : val = parseFloat(val); break;	
							case "float" : val = parseFloat(val); break;	
							case "integer" : val = parseInt(val); break;
							case "boolean" :
								//console.log("VERIFY A BOOLEAN VALUE - value = ", val )
								val = (val == 'true' || val == "1")?true:false;
								break;	
							default : ;
						}
	
				}

				if(field.lastNodeRef[field.lastPathPart] && field.lastNodeRef[field.lastPathPart].push)
				{	
					if(val != null)
					{
						field.lastNodeRef[field.lastPathPart].push(val);
						this.pathMap[f].entries[i].val = field.lastNodeRef[field.lastPathPart];
					}	
				}
				else 
				{	
					if(val != null && (field.type != "radio" ||  !this.pathMap[f].radioValue))
					{
						field.lastNodeRef[field.lastPathPart] = val;
						this.pathMap[f].entries[i].val = field.lastNodeRef[field.lastPathPart];
						if(field.type == 'radio')
							this.pathMap[f].radioValue = val;
					}		
				
					//if(val == "")
					//	delete field.lastNodeRef[field.lastPathPart];
				}
			}	
		}
		//console.log("inputs-data-binder", "toDatas() give (before copy old datas): " , JSON.stringify(this.output), " - datas ? ",  JSON.stringify(this.datas))
		//if(this.editMode)
		//if(this.datas)
			//deep.utils.bottom(this.datas, this.output);
		//if(console.flags["inputs-data-binder"]) 
			//console.log("inputs-data-binder", "toDatas() give : " + JSON.stringify(this.output))
		return this.output;
		//
	}

	InputsDataBinder.prototype.fillFields = function fillFields(datas)
	{
		this.createPathMap();
		if(datas)
			this.datas = datas;
		//console.log("Fill Fields : pathMap : "+JSON.stringify(this.pathMap))
			//console.log("inputs-data-binder", "fillFields() with : " + JSON.stringify(this.datas))

		for(var i in this.pathMap)
		{
			//console.log("whats context before retrieve by path : " + JSON.stringify(this.context))

			var value = deep.utils.retrieveValueByPath(this.datas, i);
			var valueIndex = 0;
			for(var j = 0; j < this.pathMap[i].entries.length; ++j)
			{
				var field = this.pathMap[i].entries[j];
				var val = value;
				//console.log("Value obtained : " + value)
				
				if(value && value.push && value.forEach && value.length)
				{
					///console.log("fill fields : got array "+JSON.stringify(value))
					val = value[valueIndex];
					valueIndex++;
				}
				switch (field.type)
				{
					case "checkbox":
						if(val == null)
							break;
						if($(field.input).val() == val || (val instanceof Array && deep.utils.inArray($(field.input).val(),val)))			// ________________________  TODO : inArray !!!!!
							$(field.input).prop("checked", true);
						//	console.log("fill fields : checkbox case : value assigned : "+$(field.input).val() + " - for "+i);

						break;
					case "radio":
						if(val == null)
							break;
						if($(field.input).val() == val){
							$(field.input).prop("checked", true);
							//console.log("fill fields : radio case : value assigned : "+$(field.input).val() + " - for "+i);
						}
						//code
						break;
					case "select":
						if(val == null)
							break;
						$(field.input).find(" option[value='"+val+"']").prop("selected", true);
					//	console.log("fill fields : select case : select : value assigned : "+$(field.input).val() + " - for "+i);
						//code
						break;
					
					default:
						if(val == null)
						{
							$(field.input).val("");
							break;
						}
						$(field.input).val(val);
					//	console.log("fill fields : default case : input text : value assigned : "+$(field.input).val() + " - for "+i);
						break;
				}	
			}
		}
		return this;
	}

	InputsDataBinder.prototype.createPathMap = function createPathMap(){
		var pathMap = this.pathMap = new Object();
		var othis = this;
		var obj = this.output = {};
		$(this.parentSelector + " input[data-path]").each(function createInputPathMap(){
			var path = $(this).attr("data-path");
			var schem = {};
			if(othis.schema)
				schem = deep.utils.retrieveFullSchemaByPath(othis.schema, path);
			othis.inputs.push(this);
		//	console.log("createPathMap : got "+path)
			var parts = path.split(".");
			var tmp = obj;
			while(parts.length > 1)
			{
				var curPart = parts.shift();
				if(typeof tmp[curPart] === "undefined")
					tmp[curPart] = {};
				tmp = tmp[curPart];
			}	
			var lastPart = parts.shift();
			if(tmp[lastPart] == undefined)
				tmp[lastPart] = null;	
			if(!pathMap[path])
				pathMap[path] = {};
			pathMap[path].schema = schem;
			if(!pathMap[path].entries)
				pathMap[path].entries = new Array();
			
			pathMap[path].entries.push({input:this, schema:schem, type:$(this).attr("type"), val:null, lastPathPart:lastPart, lastNodeRef:tmp });
		});
		$(this.parentSelector + " select[data-path]").each(function createSelectPathMap(){
			
			var path = $(this).attr("data-path");
			//console.log("createPathMap : got "+path)
			var parts = path.split(".");
			var schem = {};
			if(othis.schema)
				schem = deep.utils.retrieveFullSchemaByPath(othis.schema, path);
			othis.inputs.push(this);
			var tmp = obj;
			while(parts.length > 1)
			{
				var curPart = parts.shift();
				if(typeof tmp[curPart] === "undefined")
					tmp[curPart] = new Object();
				tmp = tmp[curPart];
			}	
			var lastPart = parts.shift();
			if(tmp[lastPart] == undefined)
				tmp[lastPart] = null;
			if(!pathMap[path])
				pathMap[path] = {};
			pathMap[path].schema = schem;
			if(!pathMap[path].entries)
				pathMap[path].entries = new Array();
			pathMap[path].entries.push( {input:this, val:null,  schema:schem, type:"select", lastPathPart:lastPart, lastNodeRef:tmp });
		});
		$(this.parentSelector + " textarea[data-path]").each(function createTextAreaPathMap(){
			var path = $(this).attr("data-path");
			if(othis.schema)
				schem = deep.utils.retrieveFullSchemaByPath(othis.schema, path);
			othis.inputs.push(this);
			var parts = path.split(".");
			var tmp = obj;
			while(parts.length > 1)
			{
				var curPart = parts.shift();
				if(typeof tmp[curPart] === "undefined")
					tmp[curPart] = new Object();
				tmp = tmp[curPart];
			}	
			var lastPart = parts.shift();
			if(!pathMap[path])
				pathMap[path] = {};
			pathMap[path].schema = schem;
			if(!pathMap[path].entries)
				pathMap[path].entries = new Array();
			pathMap[path].entries.push({input:this, val:null, type:"textarea",   schema:schem, lastPathPart:lastPart, lastNodeRef:tmp });
		});
		//console.log("end path map");
		return this;
	}

	InputsDataBinder.prototype.clear = function()
	{
		//this.context.datas = {};
		this.output = {};
		$(this.parentSelector + " input").each(function clearInputs(){
			var type = $(this).attr("type");
			if(type == "text" || type == "hidden" )
				$(this).val("");
			if(type == "checkbox" || type == "radio")
				$(this).prop("checked", false);
		})
		$(this.parentSelector + " select").find("option:selected").prop("selected", false);
		$(this.parentSelector + " select").find("option:first").prop("selected", true);
		$(this.parentSelector + " textarea").val("");
		$(this.parentSelector + " input.error").removeClass("error");
		$(this.parentSelector + " textarea.error").removeClass("error");
		$(this.parentSelector + " select.error").removeClass("error");
		return this;
	}

	InputsDataBinder.prototype.partialValidation = function(fields)
	{
		console.log("partial validation");

		this.toDatas();
		var othis = this;
		var report = deep.partialValidation(this.output, this.schema, {fieldsToCheck:fields});
		if( !report.valid)
		{
			for(var i in report.errorsMap)
			{
				var e = report.errorsMap[i];
				if(othis.pathMap[i])
					e.itemsMap = othis.pathMap[i].entries;
				else
					e.itemsMap = [];
			}
		}
		return report;
	}

	InputsDataBinder.prototype.validate = function()
	{
		this.toDatas();
	//	console.log("VAlidate output : ", this.output, " - ",this.schema);
		var othis = this;
		var report = deep.validate(this.output, this.schema)
		if( !report.valid)
		{
			for(var i in report.errorsMap)
			{
				var e = report.errorsMap[i];
				if(othis.pathMap[i.substring(1)])
					e.itemsMap = othis.pathMap[i.substring(1)].entries;
				else
					e.itemsMap = [];
			}
		}
		return report;
	}


	//____________________  EXAMPLE OF ERROR MANAGEMENT 


	/*

	function manageErrors(report)
	{
		if(!report.valid)
		{
			for(var i in report.errorsMap)
			{
				var e = report.errorsMap[i]
				e.errors.forEach(function(err)
				{
					//if(console.flags["form-controller"]) console.log("form-controller","ERRORS  : "+JSON.stringify(err)+" - details : "+JSON.stringify(err.message))
				});
				e.itemsMap.forEach(function (inputMap){
					//if(console.flags["form-controller"]) console.log("form-controller","ERRORS  : "+JSON.stringify(err)+" - details : "+JSON.stringify(err.message))
					$(inputMap.input).css("background-color","#FF0000");
				});
			}
		}
	}


	*/



	return InputsDataBinder;

});

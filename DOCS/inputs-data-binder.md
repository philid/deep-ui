inputs-data-binder : tools to bind datas to input fields with schema validation. 
==========================

You will need this tool to bind JSON datas to the fields of your form

The binding with the html field is done with the data-path attribute :

for example : 

<div id="article-form">
	<input type="text" data-path="title"></input>
	<textarea data-path="description"></textarea>
</div>


## Methods

### instantiation

var InputsDataBinder = require("deep/controller/inputs-data-binder");
var binder = new InputsDataBinder();

### init(parentSelector, input_datas, schema)  

Definition : function used to init the databinder

Arguments :

parentSelector : the JQUERY selector of the DOM element that contains your fields
input_datas : a JSON object containing the data used to prefill the fields (optional, could be null)
	remark : if they is data in that JSON that are not binded to an HTML field, these will be added to the final output.
schema : the JSON schema used for validation of the fields datas 

### validate()

Definition : function used to validate the fields datas with the JSON schema and build the output JSON object

Returns : a report object 

report = {
	errorsMap : an Array containing the errors and the mapping to the html elements
	schema : the JSON schema used to validate the datas
	date : the date of the validation process
	valid : true - or false if the datas are valid or not
}

to have access to the output, you simply can access it at the "output" variable of your inputs-data-binder object after the validation is done (ex : binder.output)

example of a validation : 

when(binder.validate()).then(function  (report) {
	//console.log("binder.output : ", binder.output);
	//console.log("validation report : ", report)
	
	if(!report.valid)
	{
		//do stuff with the errors (ouput to console and changing background of the field)
		for(var i in report.errorsMap)
		{
			var e = report.errorsMap[i]
			e.errors.forEach(function(err)
			{
				console.log("ERRORS  : "+JSON.stringify(err)+" - details : "+JSON.stringify(err.message))
			});
			if(e.itemsMap)
				e.itemsMap.forEach(function (inputMap){
					$(inputMap.input).css("background-color","#FF0000");
				});
		} 
	}
	else
	{
		//Do your post or whatever you want to do with the datas
		console.log('valid : ',binder.output);
	}
})


### toDatas() : 

Definition : function used to return the datas contained in the fields (no Validation !)

Returns : a JSON object containing all the datas.


### fillFields(datas)

Definition : function used to fill the HTML fields with data

Arguments :

datas : the JSON object containing the data used to fill the fields

### clear()

Definition : function used to clear/reset the HTML fields to "empty" state


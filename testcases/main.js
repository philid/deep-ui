// main.js : load all first dependencies


console.flags = {}
console.flog = function(flag, message)
{
	if(console.flags[flag])
		console.log(flag+" : "+message);
}

require.config({
	 baseUrl: "/js"
   // ,paths:[{"deep":"deep"}]
   
});
require([ "app.js", "deep-ui/plugin", "/js/swig/swig.pack.min.js"], function( app ) {
  	 //console.log("requirejs main end callback 1 ");
  
  //	if(node)
  //	 app().then(function(){responseReady()});
  	//else
    
  		app();
});
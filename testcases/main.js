// main.js : load all first dependencies


console.flags = {}
console.flog = function(flag, message)
{
	if(console.flags[flag])
		console.log(flag+" : "+message);
}

require.config({
	 baseUrl: "/common/js-lib"
    ,paths:[{"deep":"deep"}]
   
});
require([ "app.js", "/common/js-lib/swig/swig.pack.min.js", "deep-ui/view-controller"], function( app ) {
  	 //console.log("requirejs main end callback 1 ");
  
  //	if(node)
  //	 app().then(function(){responseReady()});
  	//else
    
  		app();
});
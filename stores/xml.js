if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(["require", "deep-ui/stores/ajax"],
function(require)
{
    var deep = require("deep/deep");

    deep.protocoles.xml = new deep.Store();

    deep(deep.protocoles.xml)
    .bottom(deep.protocoles.ajax);

    deep.protocoles.xml.name = "xml";

    deep.extensions.push({
        store:deep.protocoles.xml,
        extensions:[
            /(\.xml(\?.*)?)$/gi
         ]
    });
    
    deep.protocoles.xml.dataType = "xml";
    
    deep.protocoles.xml.writeJQueryDefaultHeaders = function (req) {
        req.setRequestHeader("Accept", "application/xml; charset=utf-8"); 
        req.setRequestHeader("Content-Type", "application/xml; charset=utf-8"); 
    };
    deep.protocoles.xml.bodyParser = function(data){
        if(typeof data === 'string')
            return data;
        if(data.toString())
            return data.toString();
        return String(data);
    }
    deep.protocoles.xml.responseParser = function(data, msg, jqXHR){
       return jQuery.parseXML( data );
    }
    return deep.protocoles.xml;
 })
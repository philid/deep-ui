if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(["require", "deep-ui/stores/ajax"],
function(require)
{
    var deep = require("deep/deep");

    deep.stores.xml = new deep.store.Store();

    deep(deep.stores.xml)
    .bottom(deep.stores.ajax);

    deep.stores.xml.name = "xml";

    deep.stores.xml.extensions = [
        /(\.xml(\?.*)?)$/gi
    ];
    
    deep.stores.xml.dataType = "xml";
    
    deep.stores.xml.writeJQueryDefaultHeaders = function (req) {
        req.setRequestHeader("Accept", "application/xml; charset=utf-8"); 
        req.setRequestHeader("Content-Type", "application/xml; charset=utf-8"); 
    };
    deep.stores.xml.bodyParser = function(data){
        if(typeof data === 'string')
            return data;
        if(data.toString())
            return data.toString();
        return String(data);
    }
    deep.stores.xml.responseParser = function(data, msg, jqXHR){
       return jQuery.parseXML( data );
    }
    return deep.stores.xml;
 })
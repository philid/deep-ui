

deep.store("bug", [])
/*.post({
    date:new Date().valueOf(),
    url:null,
    title:null,
    description:null,
    browser:{
        agent:null,
        version:"fzezeezze"
    },
    plateform:{
        os:null,
        version:null
    },
    app:{
        user:null,
        session:null
    }
})
.log()
*/


deep({
    date:new Date().valueOf(),
    url:null,
    title:"hello",
    description:"desc",
    browser:{
        agent:null,
        version:""
    },
    plateform:{
        os:null,
        version:null
    },
    app:{
        user:null,
        session:null
    }

})
.val("swig::../templates/bugger/bug-panel.html")
.done(function(rendered){

    $("#content-container")
    .html(rendered)
    .find("#save-bug-button")
    .click(function(e){
        deep.ui.fromDataPath("#content-container")
        .log()
    });
})

if(typeof define !== 'function')
	var define = require('amdefine')(module);

/*
	Need :
	domSelectors:{
		"message-box":" ... "
	}
	templates:{
		macros:{
			messages:"swig:: ...."   // which contains : warning, info, error and success....   each macros could contains a ".close-button"
		}
	},
	messageTTL:2000 (ms - default)

*/


define(function ViewControllerDefine(require){

	var utils = require("deep/utils");
	var Compose = require("compose");
	var ViewController = require("deep-ui/view-controller");
	var StatusBarAspect = {
		messageTTL:2000,
		message:function(html, TTL){
			TTL = TTL || this.messageTTL;
			var appended = $(html).appendTo(this.domSelectors["message-box"])
			.hide()
			.fadeIn()
			.delay(TTL)
			.fadeOut(function() { $(this).remove(); });
			
			appended.find(".close-button").click(function(e){
				e.preventDefault();
				appended.stop();
				appended.fadeOut('fast', function() { $(this).remove(); });
			});
		},
		warning:function(title, detail, TTL){
			var inputSwig = utils.getMacroImport(this, ["messages"]);
		    inputSwig += '{{ messages.warning(options) }}';
		    var res = swig.compile(inputSwig)({options:{title:title, detail:detail}});
			this.message(res, TTL);
		},
		info:function(title, detail, TTL){
			var inputSwig = utils.getMacroImport(this, ["messages"]);
		    inputSwig += '{{ messages.info(options) }}';
		    var res = swig.compile(inputSwig)({options:{title:title, detail:detail}});
			this.message(res, TTL);
		},
		error:function(title, detail, TTL){
			var inputSwig = utils.getMacroImport(this, ["messages"]);
		    inputSwig += '{{ messages.error(options) }}';
		    var res = swig.compile(inputSwig)({options:{title:title, detail:detail}});
			this.message(res, TTL);
		},
		success:function(title, detail, TTL){
			var inputSwig = utils.getMacroImport(this, ["messages"]);
		    inputSwig += '{{ messages.success(options) }}';
		    var res = swig.compile(inputSwig)({options:{title:title, detail:detail}});
			this.message(res, TTL);
		}
	};
	var StatusBar = Compose(ViewController, StatusBarAspect);
	StatusBar.aspect = StatusBarAspect;
	return StatusBar;
});
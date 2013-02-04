/**
 * ListController
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */


layer : {
	composition:["leaf/view-controller","leaf/list-controller:Aspects", "leaf/form-controller:Aspects" ]
	domSelectors:{
		"list-container":"#mySelectorJQuery",
		"list-head":"",
		"list-action":"",
		"list-items":"",
	},
	templates:{
		"list-macros":["/www/common/templates/list-macros.html"]
	},
	list:{
		ressource:"/Member/",
		projection:[],
		sort:[],
		filters:{
			
		},
		action:{
			permitted:["delete", "select"],
			macrosName:"list.action"
		},
		head:{
			macrosName:"list.action"
		}
	}

}

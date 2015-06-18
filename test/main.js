var mitrilied = require('./m/Mithrilied');

var modelName = 'Person';
var Model = require('./m/Person');
var elements = document.querySelectorAll('[data-mount=\"' + modelName + '\"]');

var self = {};
if( elements.length === 1 ){
	var ViewModel = mitrilied.mount( Model, self, modelName, elements[0] );
	self.Person.controller.cleanAddresses();
	self.Person.controller.addToAddresses();
	self.Person.controller.addToAddresses();
	self[ 'get' + modelName] = function(){
		return self[ modelName ].controller.toJS();
	};
}

window.Demo = self;

var mitrilied = require('./m/Mithrilied');

var modelName = 'Person';
var Model = require('./m/Person');
var Vanilla = require('./m/Vanilla');
var elements = document.querySelectorAll('[data-mount=\"' + modelName + '\"]');

var self = {};
if( elements.length === 1 ){
	self.clearElement = function( element ){
		Vanilla.removeClass(element, 'validation-error');
		Vanilla.removeClass(element, 'validation-success');
	};
	self.invalidElement = function( element, errors ){
		Vanilla.addClass(element, 'validation-error');
	};
	self.validElement = function( element ){
		Vanilla.addClass(element, 'validation-success');
	};

	self.emailSelected = function(){
		console.log('?????', arguments);
	}

	var ViewModel = mitrilied.mount( Model, self, modelName, elements[0] );
	self.Person.controller.cleanAddresses();
	self.Person.controller.addToAddresses();
	self.Person.controller.addToAddresses( { city: 'Vicity', street: 'Valahol' } );
	self.Person.controller.addToEmails( 'imre@be.hu' );
	self.Person.controller.addToEmails( 'peter@be.fr' );
	self.Person.controller.addToEmails( 'steve@be.uk' );
	self[ 'get' + modelName] = function(){
		return self[ modelName ].controller.toJS();
	};
}

window.Demo = self;

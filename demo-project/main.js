var Vanilla = require('./Vanilla');
var EventEmitter = require('events').EventEmitter;
var m = require('mithril');

var updateModel = require('jade-mithrilier').updateModel;


function ViewModel(){
	EventEmitter.call( this );
}
ViewModel.prototype = new EventEmitter();

var viewModel = ViewModel.prototype;
viewModel.clearElement = function( element ){
	Vanilla.removeClass(element, 'validation-error');
	Vanilla.removeClass(element, 'validation-success');
};
viewModel.invalidElement = function( element, errors ){
	Vanilla.addClass(element, 'validation-error');
};
viewModel.validElement = function( element ){
	Vanilla.addClass(element, 'validation-success');
};
viewModel.emailSelected = function(){
	console.log('?????', arguments);
};

var self = new ViewModel();

function createModelContext( context, modelName ){
	if( !context[ modelName ] ){
		context[ modelName ] = {
			model: require( './models/' + modelName ),
			vcs: []
		};
		self.emit('init' + modelName + 'Model', context[ modelName ].model);
		context[ 'get' + modelName] = function(){
			if( context[ modelName ].vcs.length === 0 ) throw new Error('No view has been initiated.');
			return context[ modelName ].vcs[0].controller.toJS();
		};
	}
}

self.on('initPersonModel', function( model ){
	console.log('Person model read.');
});
self.on('initContentViewModel', function( model ){
	console.log('Person model used for Content.');
});
var first = true;
self.on('initContentController', function( controller ){
	if( !first ) return;

	console.log('Controller for model Person made.');
	//m.stopComputation();
	controller.cleanAddresses();
	controller.addToAddresses();
	controller.addToAddresses( { city: 'Vicity', street: 'Valahol' } );
	controller.addToEmails( 'imre@be.hu' );
	controller.addToEmails( 'peter@be.fr' );
	controller.addToEmails( 'steve@be.uk' );
	//m.startComputation();

	first = false;
});

var extContext = require.context( './m/', true, /.(js)$/);
extContext.keys().forEach( function(key){
	var modelLoader = extContext(key);
	var viewName = key.match(/\w+/)[0];
	var mounters = document.querySelectorAll('[data-mount=\"' + viewName + '\"]');
	Array.prototype.forEach.call(mounters, function(element, i){
		var modelName = element.getAttribute('data-model') || viewName;

		createModelContext( self, modelName );

		modelLoader.mount( self[ modelName ].model, self, viewName, modelName, element );
	} );
} );

window.Demo = self;

/*
		self.Person.controller.cleanAddresses();
		self.Person.controller.addToAddresses();
		self.Person.controller.addToAddresses( { city: 'Vicity', street: 'Valahol' } );
		self.Person.controller.addToEmails( 'imre@be.hu' );
		self.Person.controller.addToEmails( 'peter@be.fr' );
		self.Person.controller.addToEmails( 'steve@be.uk' );
		*/

/*
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
	};

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

*/

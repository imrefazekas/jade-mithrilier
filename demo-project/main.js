/*
var m = require('mithril');

var mapObject = require('jade-mithrilier').mapObject();
var Person = require('./models/Person');

var _ = require('lodash');

var modelName = 'Person';
var context = {
	emailSelected: function(){}
};
var mvc = {
	model: Person.dataModel,
	controller: mapObject( modelName, Person.validation ),
	view: function(ctrl) {
		return m("div", {
			"className": "section"
		}, [m("text", {
			"className": "h6"
		}, ["Sign up"]), m("br", {
			"className": ""
		}, []), m("input", {
			value: ctrl[modelName].name(),
			oninput: m.withAttr('value', ctrl[modelName].name),
			"type": "text",
			"id": "join_name",
			"placeholder": "Your name",
			"data-bind": "name",
			"className": "c_ds_blue hN text-center"
		}, []), m("br", {
			"className": ""
		}, []), m("input", {
			value: ctrl[modelName].email(),
			oninput: m.withAttr('value', ctrl[modelName].email),
			"type": "text",
			"id": "join_email",
			"placeholder": "Your email address",
			"data-bind": "email",
			"className": "c_ds_blue hN text-center"
		}, []), m("br", {
			"className": ""
		}, []), m("text", {
			"className": ""
		}, ["Accept?"]), m("input", {
			value: ctrl[modelName].terms(),
			onclick: m.withAttr('checked', ctrl[modelName].terms),
			checked: ctrl[modelName].terms(),
			"type": "checkbox",
			"data-bind": "terms",
			"className": "checkbox"
		}, []), m("br", {
			"className": ""
		}, []), m("br", {
			"className": ""
		}, []), m("br", {
			"className": ""
		}, []), m("text", {
			textContent: ctrl[modelName].name(),
			"data-value": "name",
			"className": ""
		}, ["Addresses:"]), m("br", {
			"className": ""
		}, []), m("select", {
			"data-each": "emails",
			"data-event-change": "emailSelected",
			"className": ""
		}, ctrl[modelName].emails.map(function(item, index, array) {
			return [m("option", {
				textContent: item(),
				"data-value": "$item",
				"data-attr": "{ value: $item() }",
				"className": ""
			}, [])];
		})), m("div", {
			"data-each": "addresses",
			"className": "row-section"
		}, ctrl[modelName].addresses.map(function(item, index, array) {
			return [m("div", {
				"className": "row"
			}, [m("input", {
				value: item.city(),
				oninput: m.withAttr('value', item.city),
				"type": "text",
				"placeholder": "Your city",
				"data-bind": "city",
				"className": "c_ds_blue hN text-center"
			}, []), m("br", {
				"className": ""
			}, []), m("input", {
				value: item.street(),
				oninput: m.withAttr('value', item.street),
				"type": "text",
				"placeholder": "Your street",
				"data-bind": "street",
				"className": "c_ds_blue hN text-center"
			}, []), m("br", {
				"className": ""
			}, []), m("input", {
				value: item.active(),
				onclick: m.withAttr('checked', item.active),
				checked: item.active(),
				"type": "checkbox",
				"data-bind": "active",
				"className": "checkbox"
			}, []), m("br", {
				"className": ""
			}, []) ])];
		}))]);
	}
};

m.mount( document.getElementsByClassName('half1')[0], m.component(mvc, Person.dataModel) );
m.mount( document.getElementsByClassName('half2')[0], m.component(mvc, Person.dataModel) );
*/




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
viewModel.clicked = function(){
	console.log('Clicked!');
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

self.on('emailSelected', function( event, viewName, modelName, element, ctrl, model, path, milieu ){
	console.log('?????', arguments);
});
self.on( 'clicked', function( event, viewName, modelName, element, ctrl, model, path, milieu ){
	console.log('Clicked!');
});
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

var context = require.context( './m/', true, /.(js)$/);
context.keys().forEach( function(key){
	var modelLoader = context(key);
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

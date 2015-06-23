JADE-MITHRILIER - A design-focused abstraction layer over [Mithril](https://lhorie.github.io/mithril/).

[![NPM](https://nodei.co/npm/jade-mithrilier.png)](https://nodei.co/npm/jade-mithrilier/)


========

[![Join the chat at https://gitter.im/imrefazekas/jade-mithrilier](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/imrefazekas/jade-mithrilier?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


[jade-mithrilier](https://github.com/imrefazekas/jade-mithrilier) is a small utility library to allow you to better harmonise your MVC strategy with server-side models and rendering processes by using

- [JADE](http://jade-lang.com) as template engine
- plain JS object as data models
- and optionally plain JS object as validation rules via [vindication.js](https://github.com/imrefazekas/vindication.js/tree/master)

[jade-mithrilier](https://github.com/imrefazekas/jade-mithrilier) will generate the necessary  [Mithril](https://lhorie.github.io/mithril/) components you can mount to your SPAs.

# Installation

	$ npm install jade-mithrilier --save

## Concept

To have a real full-stack solution, common coding style and module formats have to be introduced, data models and validation rules used by server-side and clien-side must be shared.
The simplest way is to use plain and pure JS object as a CommonJS module requirable by any code you write.
In EE-world, applications are not created in a vacuum, teams are working on it and design and code are evolving continuously urging the development team to handle representation freely. In other words, you should be encouraged to choose the template engine and the orchestration structure of yours, fitting the best your project.

[jade-mithrilier](https://github.com/imrefazekas/jade-mithrilier) is a solution providing [JADE](http://jade-lang.com) template engine and markup-based mapping and CommonJS object as Models and validation at your service.


## Quick install

```javascript
var mithrilier = require('jade-mithrilier');
...
var jadeContent = fs.readFileSync( [path], { encoding: 'utf8' });
var mithrilView = mithrilier.generateMithrilJS( jadeContent );
fs.writeFileSync( [path], mithrilView, { encoding: 'utf8' } );
...
```

## The example project

The following code which source can be found in folder _'demo-project'_,  demonstrates how to build up a very simple page including real-time validation. Validation is valuated real-time and some callback functions defined by you are called to make the necessary changes in style or execute some JS functions.

#### Person data model with validation:
```javascript
module.exports = {
	dataModel: {
		name: 'John Doe',
		email: 'a@b.hu',
		terms: true,
		addresses: [
			{
				city: 'Debrecen',
				street: 'Vrndavana',
				active: true
			}
		],
		template: function(){
			return '<text> AbrakaDabra </text>';
		}
	},
	validation: {
		name: { minlength: 6, element: ["John Doe"] },
		email: { type: 'email' }
	}
};
```

#### The view in JADE (example to all kind of bindings supported):
```jade
.section
	text.h6 Sign up
	br
	input.c_ds_blue.hN.text-center(type="text", id="join_name", placeholder="Your name", data-bind="name")
	br
	input.c_ds_blue.hN.text-center(type="text", id="join_email", placeholder="Your email address", data-bind="email")
	br
	text Accept?
	input(type="checkbox", data-bind="terms").checkbox
	br
	text(data-visible="$item.terms()") Accept check
	br
	br
	text(data-value="name") Addresses:
	br
	select(data-each="emails", data-event-change="emailSelected")
		option(data-value="$item", data-attr="{ value: $item() }")
	.row-section(data-each="addresses")
		.row
			input.c_ds_blue.hN.text-center(type="text", placeholder="Your city", data-bind="city")
			br
			input.c_ds_blue.hN.text-center(type="text", placeholder="Your street", data-bind="street")
			br
			input(type="checkbox", data-bind="active").checkbox
			br
			text(data-visible="$item.active()") Visibility check
			br
			text(data-attr="{ id: ($item.active() ? 'kortefa' : 'almafa') }") Gyümölcsös
			br
			text(data-style="{ color: ($item.active() ? 'green' : 'red') }") Colored
			br
			div(data-html="$root.template()")
```

#### The Gulp build task:
```javascript
var fs = require('fs');
var gulp = require('gulp'),
	webpack = require("webpack"),
	gutil = require('gulp-util');

var mithrilier = require('jade-mithrilier');

gulp.task('mithril', function( cb ){
	var folder = './m/';

	var jadeContent = fs.readFileSync( folder + 'content.jade', { encoding: 'utf8' });
	var mithrilView = mithrilier.generateMithrilJS( jadeContent );
	fs.writeFileSync( folder + 'Mithrilied.js', mithrilView + '\n', { encoding: 'utf8' } );

	cb();
});

var config = {
	...
};
gulp.task('webpack', function( callback ) {
	webpack( config, function(err, stats) {
		if(err)
			throw new global.gutil.PluginError("webpack", err);
		gutil.log("[webpack]", stats.toString({ }));
		callback();
	});
});
gulp.task( 'default', [ 'mithril', 'webpack' ] );
```

#### HTML code:

```html
<!DOCTYPE html>
<html>

<head>
	<meta name="description" content="simple person model?">
	<meta charset="utf-8">
	<style>
		.row-section {
			margin-left: 1rem;
		}
		.row:not(:first-child) {
			margin-top: 2rem;
		}
	</style>
</head>

<body>
	<div data-mount="Person"></div>

	<script src="main.js"></script>
</body>

</html>
```

#### Main.js

```javascript
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
	self.Person.controller.addToAddresses();
	self[ 'get' + modelName] = function(){
		return self[ modelName ].controller.toJS();
	};
}
```

Done. It is that simple.
A Model and a view definition and some markup to connect them.

Below, you can find the generated [Mithril](https://lhorie.github.io/mithril/) component which __YOU NEVER WANTED TO WRITE AND ESPECIALLY MAINTAIN__ by yourself. ;)


#### The generated [Mithril](https://lhorie.github.io/mithril/) component

```javascript
var m = require('mithril');

var mapObject = require('jade-mithrilier').mapObject();

var _ = require('lodash');

var v = require('vindication.js');

function addClass( el, className ){
	if (el.classList)
		el.classList.add(className);
	else
		el.className += ' ' + className;
	return this;
}
function valuateContent(element, model, path, milieu, key) {
	if (!milieu[key]) return null;
	var f = new Function('$root', '$item', '$index', 'return ' + milieu[key] + ';');
	try {
		return {
			value: f(model, milieu.item || model, milieu.index)
		};
	} catch (err) {
		err.message = 'While evaluating: ' + milieu[key] + ' ' + err.message;
		console.error(err);
	}
	return null;
}

function valuateVisibility(element, model, path, milieu) {
	var res = valuateContent(element, model, path, milieu, 'data-visible');
	if (res) {
		element.style.visibility = res.value ? 'visible' : 'hidden';
	}
}

function valuateHTML(element, model, path, milieu) {
	var res = valuateContent(element, model, path, milieu, 'data-html');
	if (res) {
		while (element.firstChild)
			element.removeChild(element.firstChild);
		try {
			element.insertAdjacentHTML('afterbegin', res.value);
		} catch (err) {
			err.message = 'While parsing html text: ' + res.value + ' ' + err.message;
			console.error(err);
		}
	}
}

function valuateStyle(element, model, path, milieu) {
	var res = valuateContent(element, model, path, milieu, 'data-style');
	if (res) {
		var styles = res.value;
		for (var key in styles) {
			if (key) {
				if (styles[key])
					element.style[key] = styles[key];
				else
					delete element.style[key];
			}
		}
	}
}

function valuateAttribute(element, model, path, milieu) {
	var res = valuateContent(element, model, path, milieu, 'data-attr');
	if (res) {
		var attributes = res.value;
		for (var key in attributes) {
			if (key) {
				if (key === 'class')
					addClass(element, attributes[key]);
				else
					element[key] = attributes[key];
			}
		}
	}
}

function validation(model, path, V) {
	var qualifiers = path.split('.');
	var value = model,
		contraint = V;
	for (var i = 0; i < qualifiers.length && value[qualifiers[i]] && contraint[qualifiers[i]]; ++i) {
		value = value[qualifiers[i]];
		contraint = contraint[qualifiers[i]];
	}
	return !value || !_.isFunction(value) || !contraint || v.validate(value(), contraint);
}

function createConfig(model, path, milieu) {
	return function(element, isInit, context) {
		valuateVisibility(element, model, path, milieu);
		valuateAttribute(element, model, path, milieu);
		valuateStyle(element, model, path, milieu);
		valuateHTML(element, model, path, milieu);
	};
}

module.exports = {
	mount: function(model, context, name, element) {
		var Controller = MithrilMapper.mapObject(name, model.validation);
		var Component = {
			controller: Controller,
			view: function(ctrl, mdl) {
				context[name] = {
					model: ctrl[name],
					controller: ctrl
				};
				return m("div", {
					"className": "section"
				}, [m("text", {
					"className": "h6"
				}, ["Sign up"]), m("br", {
					"className": ""
				}, []), m("input", {
					value: ctrl[name].name(),
					oninput: m.withAttr('value', ctrl[name].name),
					config: createConfig(ctrl[name], 'name', {
						V: ctrl._validation
					}),
					"type": "text",
					"id": "join_name",
					"placeholder": "Your name",
					"data-bind": "name",
					"className": "c_ds_blue hN text-center"
				}, []), m("br", {
					"className": ""
				}, []), m("input", {
					value: ctrl[name].email(),
					oninput: m.withAttr('value', ctrl[name].email),
					config: createConfig(ctrl[name], 'email', {
						V: ctrl._validation
					}),
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
					value: ctrl[name].terms(),
					onclick: m.withAttr('checked', ctrl[name].terms),
					checked: ctrl[name].terms(),
					config: createConfig(ctrl[name], 'terms', {
						V: ctrl._validation
					}),
					"type": "checkbox",
					"data-bind": "terms",
					"className": "checkbox"
				}, []), m("br", {
					"className": ""
				}, []), m("text", {
					config: createConfig(ctrl[name], '', {
						'data-visible': "$item.terms()",
						V: ctrl._validation
					}),
					"data-visible": "$item.terms()",
					"className": ""
				}, ["Accept check"]), m("br", {
					"className": ""
				}, []), m("br", {
					"className": ""
				}, []), m("text", {
					textContent: ctrl[name].name(),
					config: createConfig(ctrl[name], 'null', {
						V: ctrl._validation
					}),
					"data-value": "name",
					"className": ""
				}, ["Addresses:"]), m("br", {
					"className": ""
				}, []), m("div", {
					config: createConfig(ctrl[name], 'addresses', {
						V: ctrl._validation
					}),
					"data-each": "addresses",
					"className": "row-section"
				}, ctrl[name].addresses.map(function(item, index, array) {
					return [m("div", {
						"className": "row"
					}, [m("input", {
						value: item.city(),
						oninput: m.withAttr('value', item.city),
						config: createConfig(ctrl[name], 'addresses.city', {
							item: item,
							index: index,
							V: ctrl._validation
						}),
						"type": "text",
						"placeholder": "Your city",
						"data-bind": "city",
						"className": "c_ds_blue hN text-center"
					}, []), m("br", {
						"className": ""
					}, []), m("input", {
						value: item.street(),
						oninput: m.withAttr('value', item.street),
						config: createConfig(ctrl[name], 'addresses.street', {
							item: item,
							index: index,
							V: ctrl._validation
						}),
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
						config: createConfig(ctrl[name], 'addresses.active', {
							item: item,
							index: index,
							V: ctrl._validation
						}),
						"type": "checkbox",
						"data-bind": "active",
						"className": "checkbox"
					}, []), m("br", {
						"className": ""
					}, []), m("text", {
						config: createConfig(ctrl[name], 'addresses', {
							item: item,
							index: index,
							'data-visible': "$item.active()",
							V: ctrl._validation
						}),
						"data-visible": "$item.active()",
						"className": ""
					}, ["Visibility check"]), m("br", {
						"className": ""
					}, []), m("text", {
						config: createConfig(ctrl[name], 'addresses', {
							item: item,
							index: index,
							'data-attr': "{ id: ($item.active() ? 'kortefa' : 'almafa') }",
							V: ctrl._validation
						}),
						"data-attr": "{ id: ($item.active() ? 'kortefa' : 'almafa') }",
						"className": ""
					}, ["Gyümölcsös"]), m("br", {
						"className": ""
					}, []), m("text", {
						config: createConfig(ctrl[name], 'addresses', {
							item: item,
							index: index,
							'data-style': "{ color: ($item.active() ? 'green' : 'red') }",
							V: ctrl._validation
						}),
						"data-style": "{ color: ($item.active() ? 'green' : 'red') }",
						"className": ""
					}, ["Colored"]), m("br", {
						"className": ""
					}, []), m("div", {
						config: createConfig(ctrl[name], 'addresses', {
							item: item,
							index: index,
							'data-html': "$root.template()",
							V: ctrl._validation
						}),
						"data-html": "$root.template()",
						"className": ""
					}, [])])];
				}))]);
			}

		};

		m.mount(element, m.component(Component, model.dataModel));
	}
};
```


## Binding markup

It handles the following binding markup:

- data-bind: two-way binding for a given attribute of the model
- data-value: read-only binding for a given attribute of the model
- data-each: maps array-typed attribute from the model
- data-attr: attributes of a given DOM element are set dynamically by the expression defined by 'data-visible'
- data-visible: visibility of a given DOM element is determined dynamically by the expression defined by 'data-visible'
- data-style: style properties of a given DOM element are determined dynamically by the expression defined by 'data-style'
- data-html: the content of a given DOM element is determined dynamically by the expression defined by 'data-html'

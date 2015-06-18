JADE-MITHRILIER - A design-focused adaptation layer over Mithril

[![NPM](https://nodei.co/npm/jade-mithrilier.png)](https://nodei.co/npm/jade-mithrilier/)


========


[jade-mithrilier](https://github.com/imrefazekas/jade-mithrilier) is a small utility library to allow you to use [JADE](http://jade-lang.com) template engine and plain JS object as data models to define your [Mithril](https://lhorie.github.io/mithril/) components.

# Installation

	$ npm install jade-mithrilier --save

## Concept

[KnockoutJS](http://knockoutjs.com)' markup syntax has been proven great to give one freedom over design, styling and modelling.
No JS-based HTML representation is present which could be proven a pain in EE-world where big forms, complex workflows and UI/UX changes have to be respected.

[jade-mithrilier](https://github.com/imrefazekas/jade-mithrilier) allows you to define your model as plain JS object and describe your view with [JADE](http://jade-lang.com) using markup sytanx to define a wide set of bindings. As the _test_ folder demonstrates, your model and template will be compiled in a CommonJS module defining the ready-to-use Mithril component.


## Quick setup to compile Jade to Mithril's JS-based view format:
```javascript
var mithrilier = require('jade-mithrilier');

var jadeContent = require('fs').readFileSync( 'test/content.jade', { encoding: 'utf8' });
var mithrilView = mithrilier( jadeContent, { pretty: true, indent_size: 1, indent_char: '\t' } );

```

Variable _'mithrilView'_ contains the view definition following the syntax of [Mithril](https://lhorie.github.io/mithril/).

It handles the following binding markup:

- data-bind: two-way binding for a given attribute of the model
- data-value: read-only binding for a given attribute of the model
- data-each: maps array-typed attribute from the model
- data-attr: given DOM element's attributes are set dynamically by the expression defined by 'data-visible'
- data-visible: given DOM element's visibility is determined dynamically by the expression defined by 'data-visible'
- data-style: given DOM element's style properties are determined dynamically by the expression defined by 'data-style'
- data-html: given DOM element's content is determined dynamically by the expression defined by 'data-html'


#### Example JADE

The following JADE:

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

will be compiled to controller function as below:

```javascript
function(ctrl) {
	return m("div", {
		"className": "section"
	}, [m("text", {
		"className": "h6"
	}, ["Sign up"]), m("br", {
		"className": ""
	}, []), m("input", {
		value: ctrl[name].name(),
		oninput: m.withAttr('value', ctrl[name].name),
		"type": "text",
		"id": "join_name",
		"placeholder": "Your name",
		"data-bind": "name",
		"className": "c_ds_blue hN text-center"
	}, []), m("input", {
		value: ctrl[name].email(),
		oninput: m.withAttr('value', ctrl[name].email),
		"type": "text",
		"id": "join_email",
		"placeholder": "Your email address",
		"data-bind": "email",
		"className": "c_ds_blue hN text-center"
	}, []), m("input", {
		value: ctrl[name].termsAccepted(),
		onclick: m.withAttr('checked', ctrl[name].termsAccepted),
		checked: ctrl[name].termsAccepted(),
		"type": "checkbox",
		"data-bind": "termsAccepted",
		"className": "checkbox"
	}, []), m("div", {
		"data-each": "addresses",
		"className": "section"
	}, item.addresses.map(function(item, index, array) {
		return [m("div", {
			"className": "row"
		}, [m("input", {
			value: item.city(),
			oninput: m.withAttr('value', item.city),
			"type": "text",
			"placeholder": "Your city",
			"data-bind": "city",
			"className": "c_ds_blue hN text-center"
		}, []), m("br"), m("input", {
			value: item.street(),
			oninput: m.withAttr('value', item.street),
			"type": "text",
			"placeholder": "Your street",
			"data-bind": "street",
			"className": "c_ds_blue hN text-center"
		}, []), m("br"), m("text") ])];
	}))]);
}
```



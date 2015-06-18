JADE-MITHRILIER - A customizable Jade compiler into Mithril view JS definition

[![NPM](https://nodei.co/npm/jade-mithrilier.png)](https://nodei.co/npm/jade-mithrilier/)


========


[jade-mithrilier](https://github.com/imrefazekas/jade-mithrilier) is a small utility library to allow you to use Jade template engine to define your view definitions mounted by [Mithril](https://lhorie.github.io/mithril/).

# Installation

	$ npm install jade-mithrilier --save

## Quick setup
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
- data-attr: given DOM element's attributes are set by the expression defined by 'data-visible'
- data-visible: given DOM element's visibility is determined by the expression defined by 'data-visible'


## Example JADE

The following JADE:

```jade
.section
	text.h6 Sign up
	br
	input.c_ds_blue.hN.text-center(type="text", id="join_name", placeholder="Your name", data-bind="name")
	input.c_ds_blue.hN.text-center(type="text", id="join_email", placeholder="Your email address", data-bind="email")
	input(type="checkbox", data-bind="termsAccepted").checkbox
	.section(data-each="addresses")
		.row
			input.c_ds_blue.hN.text-center(type="text", placeholder="Your city", data-bind="city")
			input.c_ds_blue.hN.text-center(type="text", placeholder="Your street", data-bind="street")

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
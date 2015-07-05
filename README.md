JADE-MITHRILIER - A design-focused abstraction layer over [Mithril](https://lhorie.github.io/mithril/).

[![NPM](https://nodei.co/npm/jade-mithrilier.png)](https://nodei.co/npm/jade-mithrilier/)


========

[![Join the chat at https://gitter.im/imrefazekas/jade-mithrilier](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/imrefazekas/jade-mithrilier?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


[jade-mithrilier](https://github.com/imrefazekas/jade-mithrilier) is a small utility library to allow you to better harmonise your MVC strategy with server-side models and rendering processes by using

- [JADE](http://jade-lang.com) as template engine
- plain JS object as data models
- and optionally plain JS object as validation rules via [vindication.js](https://github.com/imrefazekas/vindication.js/tree/master)

[jade-mithrilier](https://github.com/imrefazekas/jade-mithrilier) will generate the necessary  [Mithril](https://lhorie.github.io/mithril/) components you can mount to your SPAs.
To support the "multi-island scenario", you can assiciate multiple views to the same model or mount the same templates to different DOM parent as your needs encourage you to orchestrate.

# Installation

	$ npm install jade-mithrilier --save

## Concept

To have a real full-stack solution, common coding style and module formats have to be introduced, data models and validation rules used by server-side and clien-side must be shared.
The simplest way is to use plain and pure JS object as a CommonJS module requirable by any code you write.
In EE-world, applications are not created in a vacuum, teams are working on it and design and code are evolving continuously urging the development team to handle representation freely. In other words, you should be encouraged to choose the template engine and the orchestration structure of yours, fitting the best your project.

[jade-mithrilier](https://github.com/imrefazekas/jade-mithrilier) is a solution providing [JADE](http://jade-lang.com) template engine and markup-based mapping and CommonJS object as Models and validation at your service.

For a complete demo about features and services, see the folder [demo-project](https://github.com/imrefazekas/jade-mithrilier/tree/master/demo-project). It uses [Webpack](http://webpack.github.io). CommonJS and require on the client side, yes.


## Quick install

```javascript
var mithrilier = require('jade-mithrilier');
...
var jadeContent = fs.readFileSync( [path], { encoding: 'utf8' });
var mithrilView = mithrilier.generateMithrilJS( jadeContent );
fs.writeFileSync( [path], mithrilView, { encoding: 'utf8' } );
...
```

Note: To convert Jade to [Mithril](https://lhorie.github.io/mithril/) JS view code, a build-time process should be defined.


## A simple example project

This is a reduced version of the example located in folder [demo-project](https://github.com/imrefazekas/jade-mithrilier/tree/master/demo-project),  demonstrating how to build up a very simple page

#### Person.js data model with validation:
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
	}
};
```

#### The Person.jade view in JADE (example to all kind of bindings supported):
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

You can see here

- 2-way binding (_data-bind_)
- 1-way binding (_data-value_)
- event listeners
- manupulations around attributes (_data-attr_), css (_data-style_) and visibility (_data-visible_)
- html injections (_data-html_)

#### The Gulp build task:
```javascript
var fs = require('fs');
var gulp = require('gulp'),
	webpack = require("webpack"),
	gutil = require('gulp-util');

var mithrilier = require('jade-mithrilier');

gulp.task('mithril', function( cb ){
	var folder = './m/';

	var jadeContent = fs.readFileSync( folder + 'Person.jade', { encoding: 'utf8' });
	var mithrilView = mithrilier.generateMithrilJS( jadeContent );
	fs.writeFileSync( folder + 'Person.js', mithrilView + '\n', { encoding: 'utf8' } );

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

Note: Of course, having multiple JADE files would require to have a "filelist reading - generating" modification in the task above...

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
var Vanilla = require('./Vanilla');
var m = require('mithril');

// The JS context of the example
function ViewModel(){ }
var viewModel = ViewModel.prototype;
viewModel.emailSelected = function(){
	console.log('?????', arguments);
};
var self = new ViewModel();

// To load Datamodel files
function createModelContext( context, modelName ){
	if( !context[ modelName ] ){
		context[ modelName ] = {
			model: require( './models/' + modelName ),
			vcs: []
		};
	}
}

// to read all Mithril view JS files converted from JADE templates.
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
```

Done. It is that simple.
The code of Main will be executed and walk through the HTML and finds all mounting points and matches to templates and models.
Creates the required controllers and viewmodels in Mithril and performs the mounting action.

In file m/Person.js, you can find the generated [Mithril](https://lhorie.github.io/mithril/) component which __YOU NEVER WANTED TO WRITE AND ESPECIALLY MAINTAIN__ by yourself. ;)



## Binding markup

It handles the following binding markup:

At mounting points:

- data-bind: identifies the mithril template / view to bind with
- data-model: when you share templates and models across DOM elements, this attributes helps to match the participants

In template JADE:

- data-value: read-only binding for a given attribute of the model
- data-each: maps array-typed attribute from the model
- data-attr: attributes of a given DOM element are set dynamically by the expression defined by 'data-visible'
- data-visible: visibility of a given DOM element is determined dynamically by the expression defined by 'data-visible'
- data-style: style properties of a given DOM element are determined dynamically by the expression defined by 'data-style'
- data-html: the content of a given DOM element is determined dynamically by the expression defined by 'data-html'

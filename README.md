JADE-MITHRILIER - A design-focused abstraction layer over [Mithril](https://lhorie.github.io/mithril/) and [JADE](http://jade-lang.com).

[![NPM](https://nodei.co/npm/jade-mithrilier.png)](https://nodei.co/npm/jade-mithrilier/)

========

[![Join the chat at https://gitter.im/imrefazekas/jade-mithrilier](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/imrefazekas/jade-mithrilier?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[jade-mithrilier](https://github.com/imrefazekas/jade-mithrilier) is a small utility library allowing you define your views in [JADE](http://jade-lang.com) templating engine.

The aim is to have a toolset facilitating a design-focused orchestration levelling a very simple way to manage the MVC part of a webapp. You can define your

- views using [JADE](http://jade-lang.com) as template engine
- models and validation rules with plain JS object

and [jade-mithrilier](https://github.com/imrefazekas/jade-mithrilier) will generate the necessary  [Mithril](https://lhorie.github.io/mithril/) components you can mount to your app.
To support the "multi-island scenario", you can associate multiple views to the same model or mount the same templates to different DOM parent as your needs encourage you to orchestrate.

Applications are not created in a vacuum, teams are working on it and design and code are evolving continuously urging the development team to handle representation freely.
In other words, you should be encouraged to choose the template engine and the orchestration structure of yours, fitting the best your project. This solution wants to show a proven way.


## Concept of JADE

Some environment involving multiple teams urges the need of an independent view layer, where the functional and the presentation layer can be distinguished.
The view layer must be freed from unnecessary technical decoration within the reach of everyone during the whole lifecycle of the app.
Styles, layouts, UI components could be refined over the time not inducing any process on service-level.

[JADE](http://jade-lang.com) is a very simple, yet power templating engine to be used.


## Concept of plain JS models

To have a real JS-based full-stack solution, the need of shared data models and validation comes naturally. You execute the same validation rules on the UI and in the REST services; you use the same models in the MVC mapping code and DB services.

We should resist the temptation of rogue paths. No philosophical essays can be considered as apology for breaking the most important design pattern of JS: developers must respect the standards (and the code culture of the company).
You can have one (versioned) model repository used by all tiers of your app.

__The first step on this road is common coding style and module format.__

The simplest way is to use plain and pure JS object as a CommonJS module requirable by any code you write.
Require function is provided on the client-side by [webpack](https://webpack.github.io) or [browserify](http://browserify.org).


## Straight in into an example

The following JADE file (Content.jade) defines a view of a Person:

```jade
.section
	text.h6 Sign up
	br
	input.c_ds_blue.hN.text-center(type="text", id="join_name", placeholder="Your name", data-bind="name")
	br
	input.c_ds_blue.hN.text-center(type="text", id="join_email", placeholder="Your email address", data-bind="email")
```

Let's reference it from an index.html file:

```html
<html>
<body>
	<div>
		<div id="Content" data-mount="Content" data-model="Person"></div>
	</div>
	<script src="main.js"></script>
</body>
</html>
```

A 'div' tag has been defined embedding the Person view defined earlier.
The main.js serves as the functional entry point.

Let's compile the JADE onto Mithril using gulp:

```javascript
var mithrilier = require('jade-mithrilier');

gulp.task('mithril', function( cb ){
	var folder = './m/';

	var jadeContent = fs.readFileSync( 'Content.jade', { encoding: 'utf8' });
	var mithrilView = mithrilier.generateMithrilJS( jadeContent );
	fs.writeFileSync( 'Content.js', mithrilView.trim() + '\n', { encoding: 'utf8' } );

	cb();
});
```

Let's have a Person model:

```javascript
module.exports = {
	dataModel: {
		name: 'John Doe',
		email: 'a@b.hu'
	},
	validation: {
		name: { minlength: 6, element: ["John Doe"] },
		email: { type: 'email' }
	}
};
```

This CommonJS code defines the 'name' and 'email' attributes with validation rules attached.

Let's connect it with the main.js:

```javascript
var m = require('mithril');
var model = require( './models/Person' );
var element = document.getElementById('Content');
var viewName = element.getAttribute('data-mount');
var modelName = element.getAttribute('data-model');
modelLoader.mount( model, self, viewName, modelName, element );
```

And you are done.
Of course, you can orchestrate your project as you desire. You can
- have tons of models and views
- use same models for different views
- use same view at multiple points in the page

For a complete demo about features and services, see the folder [demo-project](https://github.com/imrefazekas/jade-mithrilier/tree/master/demo-project). It uses
- [Webpack](http://webpack.github.io) to have CommonJS and require function on the client-side
- [gulp](http://gulpjs.com) delivering task execution

Note: That demo reads uses automation to ready all views you define and all referred models. You might find this as overdramatisation, but it is actually closer to a live project.

Note: Please keep in mind, that JS and JADE(HTML) bridge we are dealing with, so try to define your embedded JS expressions escaped properly as the example below shows:

	text(data-value="terms() ? \"Haloho\" : \"Hehehehe\"!")


## Binding markup

[jade-mithrilier](https://github.com/imrefazekas/jade-mithrilier) handles the following binding markup:

At mounting points:

- data-bind: identifies the mithril template / view to bind with
- data-model: when you share templates and models across DOM elements, this attributes helps to match the participants
- data-opts: when the binding is depending on specific unique context. Some part of the view can be seen only on the 'control' page but cannot be seen on the 'view' page. So one view reused on different places and behaving accordingly. This environment can be reached by using the '$opts' variable in an expression of the tags listed below.

In template JADE:

- data-bind: 2-way binding for a given attribute of the model
- data-value: read-only binding for a given attribute of the model
- data-valuate: dynamic binding for a given attribute of the model. Expression is evaluated and set to the 'value' attribute of the DOM element
- data-each: maps array-typed attribute from the model
- data-attr: attributes of a given DOM element are set dynamically by the expression defined by 'data-attr'
- data-class-enable: the given class names are added or removed to/from the DOM element
- data-attr-enable: the given attributes are added or removed to/from the DOM element
- data-visible: visibility of a given DOM element is determined dynamically by the expression defined by 'data-visible'
- data-enable: the attached expression will determine if 'enabled' or 'disabled' class will be added to the DOM element
- data-select: the attached expression will determine if 'selected' class will be added or removed to/from the DOM element
- data-display: the boolean value of the expression attached determines if the given DOM element can be displayed (set in CSS rules) or not
- data-style: style properties of a given DOM element are determined dynamically by the expression defined by 'data-style'
- data-html: the content of a given DOM element is determined dynamically by the expression defined by 'data-html'
- data-tap: tap handler. The element will catch tap events (via [HammerJS](http://hammerjs.github.io)) and generate 'tapped' events through the context


## License

(The MIT License)

Copyright (c) 2015 Imre Fazekas

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


## Bugs

See <https://github.com/imrefazekas/jade-mithrilier/issues>.

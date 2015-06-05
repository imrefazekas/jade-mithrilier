JADE-MITHRILIER - A customizable Jade compiler into Mithril view JS definition

[![NPM](https://nodei.co/npm/jade-mithrilier.png)](https://nodei.co/npm/jade-mithrilier/)


========


[jade-mithrilier](https://github.com/imrefazekas/jade-mithrilier) is a small utility library to allow you to use Jade template engine to define your views mounted by [Mithril](https://lhorie.github.io/mithril/).

# Installation

	$ npm install jade-mithrilier --save

## Quick setup
```javascript
var mithrilier = require('jade-mithrilier');

var jadeContent = require('fs').readFileSync( 'test/content.jade', { encoding: 'utf8' });
var mithrilView = mithrilier( jadeContent, { pretty: true, indent_size: 1, indent_char: '\t' } );

```

Variable _'mithrilView'_ contains the view definition following the syntax of [Mithril](https://lhorie.github.io/mithril/).

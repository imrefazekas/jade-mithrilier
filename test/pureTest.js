var Main = require('../lib/Main');

var fs = require('fs');

var jadeContent = fs.readFileSync( 'test/content.jade', { encoding: 'utf8' });
console.log( Main( jadeContent, { pretty: true, indent_size: 1, indent_char: '\t' } ) );

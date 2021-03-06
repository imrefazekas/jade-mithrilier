'use strict'

let compiler = require('./MithrilCompiler'),
	pug = require('jade'),
	esformatter = require('esformatter'),
	format = require( './formatter.js' ),
	fs = require('fs'),
	path = require('path')

function copyObject (source, props, object, respect) {
	object = object || { }

	var index = -1,
		length = props.length

	while (++index < length) {
		var key = props[index]
		if ( !respect || !object[key] )
			object[key] = source[key]
	}
	return object
}
function assign ( ) {
	var obj = arguments[0]
	var args = Array.prototype.slice.call(arguments, 1)
	args.forEach(function ( element ) {
		copyObject( element, Object.keys(element), obj )
	})
	return obj
}

module.exports = {
	compilePUG: function (markup, options, callback) {
		options = options || {}
		options.compiler = compiler

		options.compileDebug = true
		pug.render(markup, options, function (err, res) {
			if ( err ) return callback( err )
			try {
				var code = esformatter.format(
					(options.prefix || '') + res + (options.postfix || ''),
					format // , { indent: { value: '\t' } }
				)
				callback( null, code )
			} catch ( err ) {
				callback( err )
			}
		})
	},
	beautify: function ( code ) {
		return code
	},
	generateMithrilJS: function ( contentPath, pugContent, jsTemplate, options, callback ) {
		options = options || {}

		jsTemplate = jsTemplate || fs.readFileSync( path.join( __dirname, 'Mithril.template' ), { encoding: 'utf8' })
		var jsParts = jsTemplate.split( options.token || '$$$$' )

		options = assign( { filename: contentPath, pretty: true, context: true, prefix: jsParts[0], postfix: jsParts[1], indent_size: 1, indent_char: '\t' }, options )

		this.compilePUG( pugContent, options, callback )
	}
}

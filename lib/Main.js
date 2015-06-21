var compiler = require('./MithrilCompiler'),
	MithrilMapper = require('./MithrilMapper'),
	jade = require('jade'),
	beautify = require('js-beautify').js_beautify,
	_ = require('lodash'),
	fs = require('fs'),
	path = require('path');

module.exports = {
	compileJADE: function (markup, options) {
		options = options || {};
		options.compiler = compiler;

		var res = (options.prefix || '') + jade.render(markup, options) + (options.postfix || '');
		return options.pretty ? beautify( res, { indent_size: options.indent_size || 4, indent_char: options.indent_char || ' ' } ): res;
	},
	mapObject: function(){
		return MithrilMapper.mapObject;
	},
	generateMithrilJS: function( jadeContent, jsTemplate, options ){
		options = options || {};

		jsTemplate = jsTemplate || fs.readFileSync( path.join( __dirname, 'Mithril.template' ), { encoding: 'utf8' });
		var jsParts = jsTemplate.split( options.token || '$$$$' );

		options = _.assign( { pretty: true, context: true, prefix: jsParts[0], postfix: jsParts[1], indent_size: 1, indent_char: '\t' }, options );

		var mithrilView = this.compileJADE( jadeContent, options );
		return mithrilView + '\n';
	}
};

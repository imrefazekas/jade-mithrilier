var compiler = require('./MithrilCompiler'),
	MithrilMapper = require('./MithrilMapper'),
	jade = require('jade'),
	beautify = require('js-beautify').js_beautify,
	fs = require('fs'),
	path = require('path');

function copyObject(source, props, object, respect) {
	object = object || { };

	var index = -1,
	length = props.length;

	while (++index < length) {
		var key = props[index];
		if( !respect || !object[key] )
			object[key] = source[key];
	}
	return object;
}
function assign( ){
	var obj = arguments[0];
	var args = Array.prototype.slice.call(arguments, 1);
	args.forEach(function( element ){
		copyObject( element, Object.keys(element), obj );
	});
	return obj;
}

module.exports = {
	compileJADE: function (markup, options) {
		options = options || {};
		options.compiler = compiler;

		var res = (options.prefix || '') + jade.render(markup, options) + (options.postfix || '');
		return options.pretty ? beautify( res, { indent_size: options.indent_size || 4, indent_char: options.indent_char || ' ' } ): res;
	},
	toJS: function(){
		return MithrilMapper.toJS.bind( MithrilMapper );
	},
	resetModel: function(){
		return MithrilMapper.resetModel.bind( MithrilMapper );
	},
	updateModel: function(){
		return MithrilMapper.updateModel.bind( MithrilMapper );
	},
	mapObject: function(){
		return MithrilMapper.mapObject.bind( MithrilMapper );
	},
	generateMithrilJS: function( jadeContent, jsTemplate, options ){
		options = options || {};

		jsTemplate = jsTemplate || fs.readFileSync( path.join( __dirname, 'Mithril.template' ), { encoding: 'utf8' });
		var jsParts = jsTemplate.split( options.token || '$$$$' );

		options = assign( { pretty: true, context: true, prefix: jsParts[0], postfix: jsParts[1], indent_size: 1, indent_char: '\t' }, options );

		var mithrilView = this.compileJADE( jadeContent, options );
		return mithrilView + '\n';
	}
};

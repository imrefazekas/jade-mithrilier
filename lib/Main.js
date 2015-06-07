var compiler = require('./MithrilCompiler'),
	jade = require('jade'),
	beautify = require('js-beautify').js_beautify;;

module.exports = function (markup, options) {
	options = options || {};
	options.compiler = compiler;

	var res = (options.prefix || '') + jade.render(markup, options) + (options.postfix || '');
	return options.pretty ? beautify( res, { indent_size: options.indent_size || 4, indent_char: options.indent_char || ' ' } ): res;
};

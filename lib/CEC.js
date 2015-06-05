var UglifyJS, compressor;

UglifyJS = require('uglify-js');

compressor = UglifyJS.Compressor({
	side_effects: false
});

module.exports = function (expressionOrAst) {
	var ast, expression;
	if (expressionOrAst instanceof UglifyJS.AST_Node) {
		ast = expressionOrAst;
	} else {
		ast = UglifyJS.parse(expressionOrAst);
	}
	ast.figure_out_scope();
	ast = ast.transform(compressor);
	expression = ast.print_to_string();
	return expression.slice(0, expression.length - 1);
};

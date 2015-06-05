var UglifyJS, expressionCompiler, mingleSpaces, uglifyArrayToStringConcatTransform;

UglifyJS = require('uglify-js');

expressionCompiler = require('./CEC');

mingleSpaces = function (previous, element, index) {
	if (previous.length) {
		previous.push(new UglifyJS.AST_String({
			value: ' '
		}));
	}
	previous.push(element);
	return previous;
};

uglifyArrayToStringConcatTransform = (function () {
	var before, constructBinaryAdditions, newBody;
	newBody = void 0;
	constructBinaryAdditions = function (elements) {
		var left, right;
		right = elements[elements.length - 1];
		if (elements.length > 2) {
			left = constructBinaryAdditions(elements.slice(0, elements.length - 1));
		} else {
			left = elements[0];
		}
		return new UglifyJS.AST_Binary({
			left: left,
			operator: '+',
			right: right
		});
	};
	before = function (node, descend) {
		var elements;
		if (node instanceof UglifyJS.AST_Array) {
			elements = node.elements.reduce(mingleSpaces, []);
			newBody = constructBinaryAdditions(elements);
			return newBody;
		}
		descend(node, this);
		return node;
	};
	return new UglifyJS.TreeTransformer(before);
})();

module.exports = function (expression) {
	var ast;
	ast = UglifyJS.parse(expression);
	ast = ast.transform(uglifyArrayToStringConcatTransform);
	return expressionCompiler(ast);
};

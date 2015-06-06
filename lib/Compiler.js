var Compiler, arrayCompiler, expressionCompiler, isArrayExpression, isString, joinArrays, pairSort, partition, prettyMap, terseMap, toString,
	slice = [].slice;

isString = function (s) {
	return s[0] === '\'' || s[0] === '"';
};

toString = function (s) {
	return s.slice(1, s.length - 1);
};

arrayCompiler = require('./CAE');

expressionCompiler = require('./CEC');

prettyMap = '  ' + "function map (obj, fn) {\n  if ('number' === typeof obj.length) return obj.map(fn);\n  var result = [], key, hasProp = {}.hasOwnProperty;\n  for (key in obj) hasProp.call(obj, key) && result.push(fn(key, obj[key]));\n  return result;\n}".split('\n').join('\n  ') + '\n\n';

terseMap = "function map(o,f){if('number'===typeof o.length)return o.map(f);var r=[],k,h={}.hasOwnProperty;for(k in o)h.call(o,k)&&r.push(f(k,o[k]));return r;}";

pairSort = function (a, b) {
	if (a[0] < b[0]) {
		return -1;
	} else if (a[0] > b[0]) {
		return 1;
	} else {
		return 0;
	}
};

partition = function (collection, fn) {
	var item, j, left, len1, right;
	left = [];
	right = [];
	for (j = 0, len1 = collection.length; j < len1; j++) {
		item = collection[j];
		if (fn(item)) {
			left.push(item);
		} else {
			right.push(item);
		}
	}
	return [left, right];
};

isArrayExpression = function (expression) {
	return expression[0] === '[' && expression[expression.length - 1] === ']';
};

joinArrays = function (expression) {
	if (isArrayExpression(expression)) {
		return expression + '.join(" ")';
	} else {
		return expression;
	}
};

Compiler = function (node, options) {
	return {
		compile: function () {
			var bufferExpression, depth, needsMap, controllerExtension, normalizeAttributes, normalizeClassExpressions, parts, pretty, seenDepth0, toPush, visit, visitArgs, visitAttributes, visitBlock, visitCode, visitEach, visitNodes, visitTag, visitText;
			pretty = options.pretty;
			depth = options.depth || -1;
			seenDepth0 = false;
			parts = [];
			seenDepth0 = false;
			controllerExtension = options.controllerExtension;
			needsMap = false;
			visitTag = function (tag) {
				var anyArgs;

				bufferExpression('m("', tag.name, '",');
				visitAttributes(tag, tag.attrs, tag.attributeBlocks);
				depth += 1;
				if (depth === 0 && seenDepth0) {
					throw new Error('Component may have no more than one root node');
				}
				seenDepth0 = true;
				anyArgs = visitArgs(tag);
				depth -= 1;
				return bufferExpression(')');
			};
			visitArgs = function (node) {
				var anyArgs, i, j, len, len1, ref;
				len = node.block.nodes.length;
				anyArgs = node.code || len;
				if (anyArgs) {
					bufferExpression(',');
				}
				if (node.code) {
					visitCode(node.code);
				}
				ref = node.block.nodes;
				for (i = j = 0, len1 = ref.length; j < len1; i = ++j) {
					node = ref[i];
					visit(node);
					if (i + 1 < len) {
						bufferExpression(',');
					}
				}
				return anyArgs;
			};
			visitBlock = function (block) {
				var i, j, len, len1, ref, results;
				len = block.nodes.length;
				ref = block.nodes;
				results = [];
				for (i = j = 0, len1 = ref.length; j < len1; i = ++j) {
					node = ref[i];
					visit(node);
					if (i + 1 < len) {
						results.push(bufferExpression(' + \n'));
					} else {
						results.push(void 0);
					}
				}
				return results;
			};
			normalizeClassExpressions = function (expressions) {
				var arrayExpressions, expression, j, len1, ref, ref1, stringClassNames, stringClassNamesExpression, stringExpressions;
				ref = partition(expressions, isArrayExpression); arrayExpressions = ref[0]; expressions = ref[1];
				ref1 = partition(expressions, isString); stringExpressions = ref1[0]; expressions = ref1[1];
				stringClassNames = stringExpressions.map(toString);
				stringClassNamesExpression = JSON.stringify(stringClassNames.join(' '));
				if (stringClassNames.length) {
					expressions.unshift(stringClassNamesExpression);
				}
				if (arrayExpressions.length) {
					for (j = 0, len1 = arrayExpressions.length; j < len1; j++) {
						expression = arrayExpressions[j];
						expressions.push(arrayCompiler(expression));
					}
				}
				if (expressions.length === 1) {
					expression = expressions[0];
				} else {
					expression = expressionCompiler(expressions.join('+" "+'));
				}
				return expression;
			};
			normalizeAttributes = function (attrs) {
				var attr, classExpressions, j, len1, name, normalized, val, visited;
				visited = {};
				classExpressions = [];
				normalized = {};
				for (j = 0, len1 = attrs.length; j < len1; j++) {
					attr = attrs[j];
					name = attr.name;
					val = attr.val;
					if (name === 'class') {
						name = 'className';
					}
					if (name  !== 'className' && visited[name]) {
						throw new Error('Duplicate key ' + JSON.stringify(name) + ' is not allowed.');
					}
					visited[name] = true;
					if (name === 'className') {
						classExpressions.push(val);
					} else {
						normalized[name] = val;
					}
				}
				if (visited['className']) {
					normalized['className'] = normalizeClassExpressions(classExpressions);
				}
				return normalized;
			};
			var visitBindings = function( node, normalized, bufferExpression ){
				var bindings = [];
				if( normalized['data-bind'] || normalized['data-value'] ){
					var bindName = JSON.parse(normalized['data-bind']);
					bindings.push( 'config: createConfig( ctrl[ name ], \''+ bindName +'\', ctrl._validation )' );
					bindings.push( 'value: ctrl[ name ].' + bindName + '()' );

					if( normalized['data-bind'] )
						bindings.push( 'oninput: m.withAttr(\'value\', ctrl[ name ].' + bindName + ' )' );
				}
				return bindings;
			};
			visitAttributes = function ( node, attrs, attributeBlocks) {
				var name, normalized, pairs, sep, val;
				if (!(attrs && attrs.length)) {
					bufferExpression('null');
					return;
				}
				normalized = normalizeAttributes(attrs);
				pairs = [];
				for (name in normalized) {
					val = normalized[name];
					pairs.push([name, val]);
				}
				pairs.sort(pairSort);
				sep = ':';
				pairs = pairs.map(function (pair) {
					name = pair[0]; val = pair[1];
					return JSON.stringify(name) + sep + val;
				});

				var bindings = visitBindings( node, normalized, bufferExpression );

				bufferExpression('{');
				bindings.forEach(function(binding){
					bufferExpression( binding + ',' );
				});
				bufferExpression(pairs.join(','));
				return bufferExpression('}');
			};
			visitCode = function (code) {
				if (!code) {
					return;
				}
				return bufferExpression( code.val );
			};
			visitText = function (node) {
				return bufferExpression( JSON.stringify(node.val) );
			};
			visitEach = function (node) {
				var j, len1, ref;
				needsMap = true;
				depth += 1;
				bufferExpression( 'map(', node.obj);
				bufferExpression(',function(');

				bufferExpression(node.val);

				bufferExpression(',');

				bufferExpression(node.key, ')');

				bufferExpression('{');

				depth += 1;
				bufferExpression( 'return ' );
				ref = node.block.nodes;
				for (j = 0, len1 = ref.length; j < len1; j++) {
					node = ref[j];
					visit(node);
				}

				bufferExpression( ';' );

				depth -= 1;

				bufferExpression( '}' );

				depth -= 1;
				return bufferExpression( ')' );
			};
			visitNodes = {
				Text: visitText,
				Tag: visitTag,
				Block: visitBlock,
				Each: visitEach,
				Code: visitCode,
				Doctype: function () {
					throw new Error('Component may not have doctype tag');
				}
			};

			bufferExpression = function () {
				var strs;
				strs = (1 <= arguments.length) ? slice.call(arguments, 0) : [];
				return parts = parts.concat(strs);
			};
			visit = function (node) {
				return visitNodes[node.type](node);
			};
			visit(node);
			parts.unshift( 'return ');
			if (needsMap) {
				parts.unshift(terseMap);
			}
			parts.unshift( 'function(ctrl){ ' + controllerExtension );
			bufferExpression( ';}');

			toPush = function (part) {
				return 'buf.push(' + JSON.stringify(part) + ');';
			};

			return parts.map(toPush).join('\n');
		}
	};
};

module.exports = Compiler;

var _ = require('lodash');

var toPush = function (elements) {
	elements = Array.isArray( elements ) ? elements : [ elements ];
	return elements.map(function(element){
		return 'buf.push(' + JSON.stringify(element) + ');';
	}).join('\n');
};

var cleanString = function(string){
	return string && (string.charAt(0) === '\'' || string.charAt(0) === '\"') ? string.substring(1, string.length-1) : string;
};

var quote = function(string){
	return string.replace(/\"/g, '\\\"').replace(/\'/g, '\\\'');
};

var nodeType = function(node){
	var types = _.map( _.filter( node.attrs, function(att){
		return att.name === 'type';
	} ), function( attr ){
		return attr.val;
	});
	return types.length > 0 ? JSON.parse(types[0]) : null;
};

var getBindingAttribute = function( node, bindingName ){
	var types = _.map( _.filter( node.attrs, function(att){
		return att.name === bindingName;
	} ), function( attr ){
		return attr.val;
	});
	return types.length > 0 ? JSON.parse( types[0] ) : null;
};

var referToRoot = '$';
var itemReferer = 'item';
var rootReferer = 'ctrl[ name ]';
var Compiler = function (node, options) {
	return {
		code: [ ],

		visitBlock: function( node, bindingPath, inArray ){
			var self = this;
			(node.nodes || []).forEach( function(subnode){
				self.visit( subnode, bindingPath, inArray );
			} );
		},
		visitFieldBinding: function(node, bindingPath, inArray, bindName){
			var self = this;

			var isReferringToRoot = bindName.charAt(0) === referToRoot;
			var binder = isReferringToRoot ? bindName.substring(1) : bindName;
			var reference = !inArray || isReferringToRoot ? rootReferer : itemReferer;

			self.code.push( 'config: createConfig( ' + rootReferer + ', \''+ bindingPath +'\', ctrl._validation ),' );
			self.code.push( 'value: ' + reference + '.' + binder + '(),' );

			var type = nodeType(node);
			if( (node.name === 'input') && (type==='checkbox') ){
				self.code.push( 'onclick: m.withAttr(\'checked\', ' + reference + '.' + binder + ' ), checked: ' + reference + '.' + binder + '(),' );
			}
			else if( (node.name === 'input') || (node.name === 'textarea') ){
				self.code.push( 'oninput: m.withAttr(\'value\', ' + reference + '.' + binder + ' ),' );
			}
		},
		visitValueBinding: function(node, bindingPath, inArray, bindName){
			var self = this;

			var isReferringToRoot = bindName.charAt(0) === referToRoot;
			var binder = isReferringToRoot ? bindName.substring(1) : bindName;
			var reference = !inArray || isReferringToRoot ? rootReferer : itemReferer;

			self.code.push( 'config: createConfig( ' + rootReferer + ', \''+ bindingPath +'\', ctrl._validation ),' );
			self.code.push( 'value: ' + reference + '.' + binder + '(),' );
		},
		visitAttributes: function( node, bindingPath, inArray, arrayBinding ){
			var self = this;

			self.code.push( ' { ');

			if( arrayBinding )
				self.code.push( 'config: createConfig( ' + rootReferer + ', \''+ bindingPath +'\', ctrl._validation ),' );

			var fieldBinding = cleanString( getBindingAttribute( node, 'data-bind' ) );
			if( fieldBinding ) self.visitFieldBinding( node, bindingPath, inArray, fieldBinding );

			var valueBinding = cleanString( getBindingAttribute( node, 'data-value' ) );
			if( valueBinding ) self.visitValueBinding( node, bindingPath, inArray, valueBinding );

			var classes = [], value;
			node.attrs.forEach(function(attribute){
				if( attribute.name === 'class' ){
					value = cleanString( attribute.val );
					classes.push( value );
				}
				else{
					value = cleanString( attribute.val );
					self.code.push( '\"' + attribute.name + '\"' + ': \"' + value + '\",' );
				}
			});
			self.code.push( '\"className\": ' + '\"' + classes.join(' ') + '\"' );
			self.code.push( ' }, ');
		},
		visitArrayBinding: function(node, bindingPath, inArray, bindName){
			var self = this;

			var isReferringToRoot = bindName.charAt(0) === referToRoot;
			var binder = isReferringToRoot ? bindName.substring(1) : bindName;
			var reference = !inArray || isReferringToRoot ? rootReferer : itemReferer;

			self.code.push(' ' + reference + '.' + binder + '.map( function(item, index, array ) { return ');
		},
		visitTag: function( node, bindingPath, inArray ){
			var self = this;

			self.code.push( 'm ("', node.name, '",');

			var arrayBinding = cleanString( getBindingAttribute( node, 'data-each' ) );
			bindingPath = (bindingPath ? bindingPath + '.' : '') + arrayBinding;
			inArray = true;

			self.visitAttributes( node, bindingPath, inArray, arrayBinding );

			if( arrayBinding )
				self.visitArrayBinding( node, bindingPath, inArray, arrayBinding );

			var array = node.block.nodes || [];
			self.code.push( ' [ ');
			array.forEach( function(subnode){
				self.visit( subnode, bindingPath, inArray );
				if( subnode !== node.block.nodes[ node.block.nodes.length-1 ] )
					self.code.push( ' , ');
			} );
			self.code.push( ' ] ');

			if( arrayBinding )
				self.code.push('; }) ');

			self.code.push( ')' );
		},
		visitText: function( node, bindingPath, inArray ){
			var self = this;

			self.code.push( '\"' + quote(node.val) + '\"' );
		},
		visit: function( node, bindingPath, inArray ){
			var self = this;
			if( !node.type ){
				if( !Array.isArray( node ) ) throw new Error( 'Unknown node', node );
				node.forEach( function(subnode){
					self['visit' + subnode.type]( subnode, bindingPath, inArray );
				} );
			}
			else
				self['visit' + node.type]( node, bindingPath, inArray );
		},
		compile: function () {
			var self = this;

			self.code.push( 'function(ctrl){ ' );
			self.code.push( 'context[name] = { model: ctrl[name], controller: ctrl };' );
			self.code.push( 'return ' );

			self.visit( node, '', false );

			self.code.push( '; }\n' );

			return toPush( self.code );
		}
	};
};

module.exports = Compiler;

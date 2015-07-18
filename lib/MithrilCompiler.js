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

var getEventBindings = function( node ){
	var types = _.filter( node.attrs, function(att){
		return att.name.startsWith('data-event-');
	} );
	return types;
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
var rootReferer = 'ctrl[ modelName ]';
var referencePatter = /^[\w\.]+/g;
var textElements = ['p', 'text', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'option'];

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
			var reference = isReferringToRoot ? '' : (!inArray ? rootReferer : itemReferer) + '.';

			var bindOperator = textElements.indexOf( node.name ) >= 0 ? 'textContent' : 'value';
			self.code.push( bindOperator + ': ' + reference + binder + '(),' );

			var type = nodeType(node);
			if( (node.name === 'input') && (type==='checkbox') ){
				self.code.push( 'onclick: m.withAttr(\'checked\', ' + reference + binder + ' ), checked: ' + reference + binder + '(),' );
			}
			else if( (node.name === 'input') || (node.name === 'textarea') ){
				self.code.push( 'oninput: m.withAttr(\'value\', ' + reference + binder + ' ),' );
			}
		},
		visitValueBinding: function(node, bindingPath, inArray, bindName){
			var self = this;

			var isReferringToRoot = bindName.charAt(0) === referToRoot;
			var binder = isReferringToRoot ? bindName.substring(1) : bindName;
			var reference = isReferringToRoot ? '' : (!inArray ? rootReferer : itemReferer) + '.';

			var bindOperator = textElements.indexOf( node.name ) >= 0 ? 'textContent' : 'value';
			self.code.push( bindOperator + ': ' + reference + binder + '(),' );
		},
		visitAttributes: function( node, bindingPath, wasArray, inArray, arrayBinding ){
			var self = this;

			self.code.push( ' { ');

			var fieldBinding = cleanString( getBindingAttribute( node, 'data-bind' ) );
			var valueBinding = cleanString( getBindingAttribute( node, 'data-value' ) );
			var binding = arrayBinding || fieldBinding || valueBinding;
			switch( binding ){
				case arrayBinding: break;
				case fieldBinding:
					bindingPath = (bindingPath ? bindingPath + '.' : '') + fieldBinding;
					self.visitFieldBinding( node, bindingPath, inArray, fieldBinding );
					break;
				case valueBinding:
					bindingPath = (bindingPath ? bindingPath + '.' : '') + valueBinding;
					self.visitValueBinding( node, bindingPath, inArray, valueBinding );
					break;
			}

			var tapBinding = cleanString( getBindingAttribute( node, 'data-tap' ) );
			var visibilityBinding = cleanString( getBindingAttribute( node, 'data-visible' ) );
			var displayBinding = cleanString( getBindingAttribute( node, 'data-display' ) );
			var attributeBinding = cleanString( getBindingAttribute( node, 'data-attr' ) );
			var styleBinding = cleanString( getBindingAttribute( node, 'data-style' ) );
			var htmlBinding = cleanString( getBindingAttribute( node, 'data-html' ) );
			var eventBindings = getEventBindings( node );

			if( options.context && (arrayBinding || valueBinding || fieldBinding  || tapBinding || visibilityBinding || displayBinding || attributeBinding || styleBinding || htmlBinding || eventBindings.length>0 ) ){
				var itemSpec = (inArray && !arrayBinding) || wasArray ? 'item: item, index: index,' : ' ';
				var visiSpec = visibilityBinding ? "\'data-visible\': "+ JSON.stringify( visibilityBinding ) +"," : '';
				var displaySpec = displayBinding ? "\'data-display\': "+ JSON.stringify( displayBinding ) +"," : '';
				var attSpec = attributeBinding ? "\'data-attr\': "+ JSON.stringify( attributeBinding ) +"," : '';
				var styleSpec = styleBinding ? "\'data-style\': "+ JSON.stringify( styleBinding ) +"," : '';
				var htmlSpec = htmlBinding ? "\'data-html\': "+ JSON.stringify( htmlBinding ) +"," : '';
				var tapSpec = tapBinding ? "data-tap," : '';
				var eventBindingCode = '';
				eventBindings.forEach( function(eventBinding){
					eventBindingCode = eventBindingCode.concat( "\'" + eventBinding.name + "\': " + eventBinding.val + "," );
				} );
				self.code.push( 'config: createConfig( context, ' + rootReferer + ', \''+ bindingPath +'\', { ' + itemSpec + visiSpec + displaySpec +  attSpec + styleSpec + htmlSpec + tapSpec + eventBindingCode + ' V: ctrl._validation, clearElement: context.clearElement, invalidElement: context.invalidElement, validElement: context.validElement } ),' );
			}

			var classes = [], value;
			node.attrs.forEach(function(attribute){
				if( attribute.name === 'class' ){
					value = cleanString( attribute.val );
					classes.push( value );
				}
				else{
					value = _.isString( attribute.val ) ? cleanString( attribute.val ) : attribute.val;
					self.code.push( '\"' + attribute.name + '\"' + ': \"' + value + '\",' );
				}
			});
			self.code.push( '\"className\": ' + '\"' + classes.join(' ') + '\"' );
			self.code.push( ' }, ');
		},
		visitArrayBinding: function(node, bindingPath, wasArray, inArray, bindName){
			var self = this;

			var isReferringToRoot = bindName.charAt(0) === referToRoot;
			var binder = isReferringToRoot ? bindName.substring(1) : bindName;
			var reference = !wasArray || isReferringToRoot ? rootReferer : itemReferer;

			self.code.push(' ' + reference + '.' + binder + '.map( function(item, index, array ) { return ');
		},
		visitTag: function( node, bindingPath, inArray ){
			var self = this;

			var wasArray = inArray;

			self.code.push( 'm ("', node.name, '",');

			var arrayBinding = cleanString( getBindingAttribute( node, 'data-each' ) );
			if( arrayBinding ){
				bindingPath = (bindingPath ? bindingPath + '.' : '') + arrayBinding;
				inArray = true;
			}

			self.visitAttributes( node, bindingPath, wasArray, inArray, arrayBinding );

			if( arrayBinding )
				self.visitArrayBinding( node, bindingPath, wasArray, inArray, arrayBinding );

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
		visitComment: function( node, bindingPath, inArray ){
			var self = this;
		},
		visit: function( node, bindingPath, inArray ){
			var self = this;
			//console.log( node.type  );
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

			self.code.push( 'function(ctrl, mdl){ ' );

			if( options.context ){
				self.code.push( 'if ( firstRun ){' );
				self.code.push( 'context[modelName].vcs.push( { model: ctrl[modelName], controller: ctrl } );' );
				//self.code.push( 'context[name] = { model: ctrl[name], controller: ctrl };' );
				self.code.push( 'if (context && context.emit)' );
				self.code.push( 'context.emit( \'init\' + viewName + \'Controller\', ctrl, mdl );' );
				self.code.push( ' firstRun = false; }' );
			}

			self.code.push( 'return ' );

			self.visit( node, '', false );

			self.code.push( '; }\n' );

			return toPush( self.code );
		}
	};
};

module.exports = Compiler;

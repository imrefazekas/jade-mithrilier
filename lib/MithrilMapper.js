var _ = require('isa.js');
var m = require('mithril');

var moment = require('moment');
var defaultFormat = "YYYY-MM-DD HH:mm";

function walk( res, model ){
	for(var key in model){
		if(!key || !model[key] ) continue;
		var n = model[key];
		if( _.isFunction( n ) )
			res[ key ] = n.purify ? n.purify() : n();
		else if( _.isArray( n ) ){
			res[ key ] = [];
			n.forEach( function(item){
				res[ key ].push( walk( {}, item ) );
			} );
		}
		else if( _.isObject( n ) )
			res[ key ] = walk( {}, n );
	}
	return res;
}

function createDate( ctrl, model, value, parseFn, formatFn ){
	var embeddedProp = m.prop( model );
	var prop = function(){
		if (arguments.length){
			if( parseFn ) embeddedProp( parseFn( arguments[0] ) );
			else if( _.isNumber( arguments[0] ) ){
				embeddedProp( arguments[0] );
			}
			else{
				var mDate = moment( arguments[0], ctrl.dateFormat || defaultFormat );
				if( mDate.isValid() )
					embeddedProp( mDate.valueOf() );
			}
		}
		var value = embeddedProp();
		return formatFn ? formatFn( value ) : (value > 0 ? moment( embeddedProp() ).format( ctrl.dateFormat || defaultFormat ) : '');
	};
	prop.purify = function() {
		return embeddedProp();
	};
	prop.toJSON = function() {
		return embeddedProp();
	};
	if( value )
		prop( value );
	return prop;
}

function createProp( model, value ){
	var prop = m.prop( model );
	if( value )
		prop( value );
	return prop;
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
function mapToController( controller, root, object, model, value, arrayCreation ){
	if( !_.isObject( model ) )
		return createProp( model, value );

	for(var key in model){
		if(!key || !model[key] ) continue;
		var n = model[key];
		if( _.isString( n ) ){
			object[ key ] = createProp( n, value ? value[key] : null );
		}
		else if( _.isBoolean( n ) ){
			object[ key ] = createProp( n, value ? value[key] : null );
		}
		else if( _.isNumber( n ) ){
			object[ key ] = createProp( n, value ? value[key] : null );
		}
		else if( _.isFunction( n ) ){
			object[ key ] = n.bind( root );
		}
		else if( _.isArray( n ) ){
			object[ key ] = n.map(function( item ) {
				return mapToController( controller, root, {}, item, value, arrayCreation );
			});
			var capName = capitalizeFirstLetter( key );
			controller['fill' + capName ] = function( _as, keepContent ) {
				m.startComputation();
				if( !keepContent )
					object[ key ].splice( 0, object[ key ].length );
				_as.forEach( function( _v ){
					if( _v )
						object[ key ].push( mapToController( controller, root, {}, n[0], _v, arrayCreation ) );
				} );
				m.endComputation();
			};
			controller['addTo' + capName ] = function( _v ) {
				m.startComputation();
				if( _v )
					object[ key ].push( mapToController( controller, root, {}, n[0], _v, arrayCreation ) );
				m.endComputation();
			};
			controller['removeFrom' + capName ] = function( index ) {
				m.startComputation();
				object[ key ].splice( index, 1);
				m.endComputation();
			};
			controller['clean' + capName ] = function( index ) {
				m.startComputation();
				object[ key ].splice( 0, object[ key ].length );
				m.endComputation();
			};
		}
		else if( _.isObject( n ) && n._date ){
			object[ key ] = createDate( controller, n.value || new Date().getTime(), value ? value[key] : null, n._parse, n._format );
		}
		else if( _.isObject( n ) ){
			object[ key ] = mapToController( controller, root, {}, n, value ? value[key] : null, arrayCreation );
		}
	}
	return object;
}

module.exports = {
	_models: {},
	_viewModels: {},
	toJS: function( M ){
		var self = this;
		var toJSFn = function( model ){
			if( _.isFunction( model ) ){
				return model( );
			}
			else if( _.isArray( model ) ){
				var res = [];
				model.forEach( function( item ){
					res.push( toJSFn( item ) );
				} );
				return res;
			}
			else if( _.isObject( model ) ){
				var obj = { };
				for(var key in model){
					if(!key || !model[key] ) continue;
					var n = model[key];
					obj[key] = toJSFn( n );
				}
				return obj;
			}
		};
		return toJSFn( M );
	},
	resetModel: function(name, C, M){
		var self = this;
		function resetFn( origin, model ){
			if( (origin === undefined) || (model === undefined) ) return;
			if( _.isFunction( model ) ){
				model( origin._date ? (origin.value || Date.now()) : origin );
			}
			else if( _.isArray( model ) ){
				model.splice( 0, model.length );
			}
			else if( _.isObject( model ) ){
				for(var key in model){
					if(!key || !model[key] ) continue;
					var n = model[key];
					resetFn( origin[key], n );
				}
			}
		}
		resetFn( self._models[name], M );
	},
	updateModel: function(name, C, M, O){
		var self = this;
		function updateFn( origin, model, object ){
			if( (origin === undefined) || (object === undefined) || (model === undefined) ) return;
			if( _.isFunction( model ) ){
				model( object );
			}
			else if( _.isArray( model ) ){
				var originalItem = origin[0];
				model.splice( 0, model.length );
				object.forEach( function( item ){
					var viewObject = mapToController( C, M, {}, originalItem || item, null, false );
					model.push( viewObject );
					updateFn( originalItem, viewObject, item );
				} );
			}
			else if( _.isObject( model ) ){
				for(var key in model){
					if(!key || !model[key] ) continue;
					var n = model[key];
					updateFn( origin[key], n, object[key] );
				}
			}
		}
		updateFn( self._models[name], M, O );
	},
	mapObject: function(name, V){
		var self = this;
		return function( model ) {
			var ctrl = this;
			ctrl.toJS = function(){
				var res = {};
				walk( res, ctrl[ name ] );
				return res;
			};
			Object.defineProperty(ctrl, '_validation', {
				enumerable: false,
				configurable: false,
				writable: true,
				value: V || { }
			} );
			var object = {};
			if( !self._models[ name ] ){
				self._models[ name ] = model;
				self._viewModels[ name ] = mapToController( ctrl, object, object, model, null, true );
			}
			ctrl[ name ] = self._viewModels[ name ];
		};
	}
};

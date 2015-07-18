var _ = require('lodash');
var m = require('mithril');

var moment = require('moment');
var defaultFormat = "YYYY-MM-DD HH:mm";

function walk( res, model ){
	_.forEach( model, function(n, key){
		if( _.isFunction( n ) )
			res[ key ] = n();
		else if( _.isArray( n ) ){
			res[ key ] = [];
			n.forEach( function(item){
				res[ key ].push( walk( {}, item ) );
			} );
		}
		else if( _.isObject( n ) )
			res[ key ] = walk( {}, n );
	} );
	return res;
}

function createDate( ctrl, model, value, parseFn, formatFn ){
	var embeddedProp = m.prop( model );
	var prop = function(){
		if (arguments.length){
			if( parseFn ) embeddedProp( parseFn( arguments[0] ) );
			else{
				var mDate = moment( arguments[0], ctrl.dateFormat || defaultFormat );
				if( mDate.isValid() )
					embeddedProp( mDate.valueOf() );
			}
		}
		return formatFn ? formatFn( embeddedProp() ) : moment( embeddedProp() ).format( ctrl.dateFormat || defaultFormat );
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

	_.forEach( model, function(n, key){
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
			controller['fill' + capitalizeFirstLetter( key ) ] = function( _as, keepContent ) {
				m.startComputation();
				if( !keepContent )
					object[ key ].splice( 0, object[ key ].length );
				_as.forEach( function( _v ){
					object[ key ].push( mapToController( controller, root, {}, n[0], _v, arrayCreation ) );
				} );
				m.endComputation();
			};
			controller['addTo' + capitalizeFirstLetter( key ) ] = function( _v ) {
				m.startComputation();
				object[ key ].push( mapToController( controller, root, {}, n[0], _v, arrayCreation ) );
				m.endComputation();
			};
			controller['removeFrom' + capitalizeFirstLetter( key ) ] = function( index ) {
				m.startComputation();
				object[ key ].splice( index, 1);
				m.endComputation();
			};
			controller['clean' + capitalizeFirstLetter( key ) ] = function( index ) {
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
	} );
	return object;
}

var models = {};
module.exports = {
	updateModel: function(C, M, O){
		function updateFn( model, object ){
			if( !object || !model ) return;
			if( _.isFunction( model ) ){
				model( object );
			}
			else if( _.isArray( model ) ){
				model.splice( 0, model.length );
				object.forEach( function( item ){
					model.push( mapToController( C, M, {}, item, null, false ) );
				} );
			}
			else if( _.isObject( model ) ){
				_.forEach( model, function(n, key){
					updateFn( n, object[key] );
				});
			}
		}
		updateFn( M, O );
	},
	mapObject: function(name, V){
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
			ctrl[ name ] = models[ name ] || ( models[ name ] = mapToController( ctrl, object, object, model, null, true ) );
		};
	}
};

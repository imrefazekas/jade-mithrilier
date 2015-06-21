var _ = require('lodash');
var m = require('mithril');

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

module.exports = {
	mapObject: function(name, V){
		function capitalizeFirstLetter(string) {
			return string.charAt(0).toUpperCase() + string.slice(1);
		}
		function mapToController( controller, root, object, model ){
			if( !_.isObject( model ) ) return m.prop( model );

			_.forEach( model, function(n, key){
				if( _.isString( n ) ){
					object[ key ] = m.prop( n );
				}
				else if( _.isBoolean( n ) ){
					object[ key ] = m.prop( n );
				}
				else if( _.isNumber( n ) ){
					object[ key ] = m.prop( n );
				}
				else if( _.isFunction( n ) ){
					object[ key ] = n.bind( root );
				}
				else if( _.isArray( n ) ){
					object[ key ] = n.map(function( item ) {
						return mapToController( controller, root, {}, item );
					});
					controller['addTo' + capitalizeFirstLetter( key ) ] = function() {
						m.startComputation();
						object[ key ].push( mapToController( controller, root, {}, n[0] ) );
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
				else if( _.isObject( n ) ){
					object[ key ] = mapToController( controller, root, {}, n );
				}
			} );
			return object;
		}
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
			ctrl[ name ] = mapToController( ctrl, object, object, model );
		};
	}
};

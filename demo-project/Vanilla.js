var index = 0;
module.exports = {
	addClass: function( el, className ){
		if (el.classList)
			el.classList.add(className);
		else
			el.className += ' ' + className;
		return this;
	},
	removeClass: function( el, className ){
		if (el.classList)
			el.classList.remove(className);
		else
			el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
		return this;
	}
};

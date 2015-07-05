module.exports = {
	dataModel: {
		name: 'John Doe',
		email: 'a@b.hu',
		terms: true,
		emails: [ 'test@be.org' ],
		addresses: [
			{
				city: 'Debrecen',
				street: 'Vrndavana',
				active: true
			}
		],
		template: function(){
			return '<text> AbrakaDabra </text>';
		}
	},
	validation: {
		name: { minlength: 6, element: ["John Doe"] },
		email: { type: 'email' }
	}
};

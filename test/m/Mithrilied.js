var m = require('mithril');

var Vanilla = require('./Vanilla');
var MithrilMapper = require('./MithrilMapper');

function valuateVisibility(element, model, path, milieu) {
	if (!milieu['data-visible']) return;
	var f = new Function('$root', '$item', '$index', 'return ' + milieu['data-visible'] + ';');
	try {
		var visible = f(model, milieu.item || model, milieu.index);
		element.style.visibility = visible ? 'visible' : 'hidden';
	} catch (err) {
		err.message = 'While evaluating: ' + milieu['data-attr'] + ' ' + err.message;
		console.error(err);
	}
}

function valuateAttribute(element, model, path, milieu) {
	if (!milieu['data-attr']) return;
	var f = new Function('$root', '$item', '$index', 'return ' + milieu['data-attr']);
	try {
		var attributes = f(model, milieu.item || model, milieu.index);
		for (var key in attributes)
			element[key] = attributes[key];
	} catch (err) {
		err.message = 'While evaluating: ' + milieu['data-attr'] + ' ' + err.message;
		console.error(err);
	}
}

function createConfig(model, path, milieu) {
	return function(element, isInit, context) {
		valuateVisibility(element, model, path, milieu);
		valuateAttribute(element, model, path, milieu);
	};
}

module.exports = {
	mount: function(model, context, name, element) {
		var Controller = MithrilMapper.mapObject(name, model.validation);
		var Component = {
			controller: Controller,
			view: function(ctrl, mdl) {
				context[name] = {
					model: ctrl[name],
					controller: ctrl
				};
				return m("div", {
					"className": "section"
				}, [m("text", {
					"className": "h6"
				}, ["Sign up"]), m("br", {
					"className": ""
				}, []), m("input", {
					value: ctrl[name].name(),
					oninput: m.withAttr('value', ctrl[name].name),
					config: createConfig(ctrl[name], 'name', {
						V: ctrl._validation
					}),
					"type": "text",
					"id": "join_name",
					"placeholder": "Your name",
					"data-bind": "name",
					"className": "c_ds_blue hN text-center"
				}, []), m("br", {
					"className": ""
				}, []), m("input", {
					value: ctrl[name].email(),
					oninput: m.withAttr('value', ctrl[name].email),
					config: createConfig(ctrl[name], 'email', {
						V: ctrl._validation
					}),
					"type": "text",
					"id": "join_email",
					"placeholder": "Your email address",
					"data-bind": "email",
					"className": "c_ds_blue hN text-center"
				}, []), m("br", {
					"className": ""
				}, []), m("text", {
					"className": ""
				}, ["Accept?"]), m("input", {
					value: ctrl[name].terms(),
					onclick: m.withAttr('checked', ctrl[name].terms),
					checked: ctrl[name].terms(),
					config: createConfig(ctrl[name], 'terms', {
						V: ctrl._validation
					}),
					"type": "checkbox",
					"data-bind": "terms",
					"className": "checkbox"
				}, []), m("br", {
					"className": ""
				}, []), m("text", {
					config: createConfig(ctrl[name], '', {
						'data-visible': "$item.terms()",
						V: ctrl._validation
					}),
					"data-visible": "$item.terms()",
					"className": ""
				}, ["Accept check"]), m("br", {
					"className": ""
				}, []), m("br", {
					"className": ""
				}, []), m("text", {
					textContent: ctrl[name].name(),
					config: createConfig(ctrl[name], 'null', {
						V: ctrl._validation
					}),
					"data-value": "name",
					"className": ""
				}, ["Addresses:"]), m("br", {
					"className": ""
				}, []), m("div", {
					config: createConfig(ctrl[name], 'addresses', {
						V: ctrl._validation
					}),
					"data-each": "addresses",
					"className": "row-section"
				}, ctrl[name].addresses.map(function(item, index, array) {
					return [m("div", {
						"className": "row"
					}, [m("input", {
						value: item.city(),
						oninput: m.withAttr('value', item.city),
						config: createConfig(ctrl[name], 'addresses.city', {
							item: item,
							index: index,
							V: ctrl._validation
						}),
						"type": "text",
						"placeholder": "Your city",
						"data-bind": "city",
						"className": "c_ds_blue hN text-center"
					}, []), m("br", {
						"className": ""
					}, []), m("input", {
						value: item.street(),
						oninput: m.withAttr('value', item.street),
						config: createConfig(ctrl[name], 'addresses.street', {
							item: item,
							index: index,
							V: ctrl._validation
						}),
						"type": "text",
						"placeholder": "Your street",
						"data-bind": "street",
						"className": "c_ds_blue hN text-center"
					}, []), m("br", {
						"className": ""
					}, []), m("input", {
						value: item.active(),
						onclick: m.withAttr('checked', item.active),
						checked: item.active(),
						config: createConfig(ctrl[name], 'addresses.active', {
							item: item,
							index: index,
							V: ctrl._validation
						}),
						"type": "checkbox",
						"data-bind": "active",
						"className": "checkbox"
					}, []), m("br", {
						"className": ""
					}, []), m("text", {
						config: createConfig(ctrl[name], 'addresses', {
							item: item,
							index: index,
							'data-visible': "$item.active()",
							V: ctrl._validation
						}),
						"data-visible": "$item.active()",
						"className": ""
					}, ["Visibility check"]), m("br", {
						"className": ""
					}, []), m("text", {
						config: createConfig(ctrl[name], 'addresses', {
							item: item,
							index: index,
							'data-attr': "{ id: ($item.active() ? 'kortefa' : 'almafa') }",
							V: ctrl._validation
						}),
						"data-attr": "{ id: ($item.active() ? 'kortefa' : 'almafa') }",
						"className": ""
					}, ["Gyümölcsös"])])];
				}))]);
			}

		};

		m.mount(element, m.component(Component, model.dataModel));
	}
};

var m = require('mithril');

var mapObject = require('jade-mithrilier').mapObject();

var _ = require('lodash');

var v = require('vindication.js');

function addClass(el, className) {
	if (el.classList)
		el.classList.add(className);
	else
		el.className += ' ' + className;
	return this;
}

function valuateEventBinders(context, element, model, path, milieu) {
	for (var key in milieu) {
		if (key && key.indexOf('data-event-') === 0) {
			var eventName = key.substring('data-event-'.length);
			var fnName = milieu[key];
			if (!context[fnName] || !_.isFunction(context[fnName]))
				throw new Error('Missing event handler for: ' + eventName + ' by name of: ' + milieu[key]);
			element.addEventListener(eventName, function() {
				m.startComputation();
				context[fnName].apply(context, arguments);
				m.endComputation();
			});
		}
	}
}

function valuateContent(element, model, path, milieu, key) {
	if (!milieu[key]) return null;
	var f = new Function('$root', '$item', '$index', 'return ' + milieu[key] + ';');
	try {
		return {
			value: f(model, milieu.item || model, milieu.index)
		};
	} catch (err) {
		err.message = 'While evaluating: ' + milieu[key] + ' ' + err.message;
		console.error(err);
	}
	return null;
}

function valuateVisibility(element, model, path, milieu) {
	var res = valuateContent(element, model, path, milieu, 'data-visible');
	if (res) {
		element.style.visibility = res.value ? 'visible' : 'hidden';
	}
}

function valuateDisplay(element, model, path, milieu) {
	var res = valuateContent(element, model, path, milieu, 'data-display');
	if (res) {
		element.style.display = res.value ? 'inline' : 'none';
	}
}

function valuateHTML(element, model, path, milieu) {
	var res = valuateContent(element, model, path, milieu, 'data-html');
	if (res) {
		while (element.firstChild)
			element.removeChild(element.firstChild);
		try {
			element.insertAdjacentHTML('afterbegin', res.value);
		} catch (err) {
			err.message = 'While parsing html text: ' + res.value + ' ' + err.message;
			console.error(err);
		}
	}
}

function valuateStyle(element, model, path, milieu) {
	var res = valuateContent(element, model, path, milieu, 'data-style');
	if (res) {
		var styles = res.value;
		for (var key in styles) {
			if (key) {
				if (styles[key])
					element.style[key] = styles[key];
				else
					delete element.style[key];
			}
		}
	}
}

function valuateAttribute(element, model, path, milieu) {
	var res = valuateContent(element, model, path, milieu, 'data-attr');
	if (res) {
		var attributes = res.value;
		for (var key in attributes) {
			if (key) {
				if (key === 'class')
					addClass(element, attributes[key]);
				else
					element[key] = attributes[key];
			}
		}
	}
}

function readValidationRule(model, path, V) {
	var qualifiers = path.split('.');
	var value = model,
		contraint = V;
	for (var i = 0; i < qualifiers.length && value[qualifiers[i]] && contraint[qualifiers[i]]; ++i) {
		value = value[qualifiers[i]];
		contraint = contraint[qualifiers[i]];
	}
	return {
		value: value,
		contraint: contraint
	};
}

function createConfig(appContext, model, path, milieu) {
	return function(element, isInit, context) {
		valuateVisibility(element, model, path, milieu);
		valuateDisplay(element, model, path, milieu);
		valuateAttribute(element, model, path, milieu);
		valuateStyle(element, model, path, milieu);
		valuateHTML(element, model, path, milieu);
		valuateEventBinders(appContext, element, model, path, milieu);
		if (isInit && milieu.clearElement && milieu.invalidElement && milieu.validElement) {
			var vRule = readValidationRule(model, path, milieu.V);
			if (vRule.value && _.isFunction(vRule.value) && vRule.contraint) {
				var inValid = v.validate(vRule.value(), vRule.contraint);
				milieu.clearElement(element);
				if (inValid)
					milieu.invalidElement(element, inValid);
				else
					milieu.validElement(element);
			}
		}
	};
}

module.exports = {
	mount: function(model, context, viewName, modelName, element) {
		var Controller = mapObject(modelName, model.validation);
		var Component = {
			controller: Controller,
			view: function(ctrl, mdl) {
				context[modelName].vcs.push({
					model: ctrl[modelName],
					controller: ctrl
				});
				if (context && context.emit) context.emit('init' + viewName + 'Controller', ctrl);
				return m("div", {
					"className": "section"
				}, [m("text", {
					"className": "h6"
				}, ["Sign up"]), m("br", {
					"className": ""
				}, []), m("input", {
					value: ctrl[modelName].name(),
					oninput: m.withAttr('value', ctrl[modelName].name),
					config: createConfig(context, ctrl[modelName], 'name', {
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					"type": "text",
					"id": "join_name",
					"placeholder": "Your name",
					"data-bind": "name",
					"className": "c_ds_blue hN text-center"
				}, []), m("br", {
					"className": ""
				}, []), m("input", {
					value: ctrl[modelName].email(),
					oninput: m.withAttr('value', ctrl[modelName].email),
					config: createConfig(context, ctrl[modelName], 'email', {
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
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
					value: ctrl[modelName].terms(),
					onclick: m.withAttr('checked', ctrl[modelName].terms),
					checked: ctrl[modelName].terms(),
					config: createConfig(context, ctrl[modelName], 'terms', {
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					"type": "checkbox",
					"data-bind": "terms",
					"className": "checkbox"
				}, []), m("br", {
					"className": ""
				}, []), m("text", {
					config: createConfig(context, ctrl[modelName], '', {
						'data-visible': "$item.terms()",
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					"data-visible": "$item.terms()",
					"className": ""
				}, ["Accept check"]), m("br", {
					"className": ""
				}, []), m("br", {
					"className": ""
				}, []), m("text", {
					textContent: ctrl[modelName].name(),
					config: createConfig(context, ctrl[modelName], 'name', {
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					"data-value": "name",
					"className": ""
				}, ["Addresses:"]), m("br", {
					"className": ""
				}, []), m("select", {
					config: createConfig(context, ctrl[modelName], 'emails', {
						'data-event-change': "emailSelected",
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					"data-each": "emails",
					"data-event-change": "emailSelected",
					"className": ""
				}, ctrl[modelName].emails.map(function(item, index, array) {
					return [m("option", {
						textContent: item(),
						config: createConfig(context, ctrl[modelName], 'emails.$item', {
							item: item,
							index: index,
							'data-attr': "{ value: $item() }",
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						"data-value": "$item",
						"data-attr": "{ value: $item() }",
						"className": ""
					}, [])];
				})), m("div", {
					config: createConfig(context, ctrl[modelName], 'addresses', {
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					"data-each": "addresses",
					"className": "row-section"
				}, ctrl[modelName].addresses.map(function(item, index, array) {
					return [m("div", {
						"className": "row"
					}, [m("input", {
						value: item.city(),
						oninput: m.withAttr('value', item.city),
						config: createConfig(context, ctrl[modelName], 'addresses.city', {
							item: item,
							index: index,
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
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
						config: createConfig(context, ctrl[modelName], 'addresses.street', {
							item: item,
							index: index,
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
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
						config: createConfig(context, ctrl[modelName], 'addresses.active', {
							item: item,
							index: index,
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						"type": "checkbox",
						"data-bind": "active",
						"className": "checkbox"
					}, []), m("br", {
						"className": ""
					}, []), m("text", {
						config: createConfig(context, ctrl[modelName], 'addresses', {
							item: item,
							index: index,
							'data-visible': "$item.active()",
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						"data-visible": "$item.active()",
						"className": ""
					}, ["Visibility check"]), m("br", {
						"className": ""
					}, []), m("text", {
						config: createConfig(context, ctrl[modelName], 'addresses', {
							item: item,
							index: index,
							'data-attr': "{ id: ($item.active() ? 'kortefa' : 'almafa') }",
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						"data-attr": "{ id: ($item.active() ? 'kortefa' : 'almafa') }",
						"className": ""
					}, ["Gyümölcsös"]), m("br", {
						"className": ""
					}, []), m("text", {
						config: createConfig(context, ctrl[modelName], 'addresses', {
							item: item,
							index: index,
							'data-style': "{ color: ($item.active() ? 'green' : 'red') }",
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						"data-style": "{ color: ($item.active() ? 'green' : 'red') }",
						"className": ""
					}, ["Colored"]), m("br", {
						"className": ""
					}, []), m("div", {
						config: createConfig(context, ctrl[modelName], 'addresses', {
							item: item,
							index: index,
							'data-html': "$root.template()",
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						"data-html": "$root.template()",
						"className": ""
					}, [])])];
				}))]);
			}

		};

		if (context && context.emit)
			context.emit('init' + viewName + 'ViewModel', model.dataModel);

		//m.mount( element, { controller: controller, view: Component.view} );
		m.mount(element, m.component(Component, model.dataModel));
	}
};

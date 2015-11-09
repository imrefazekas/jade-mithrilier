var m = require('mithril');

var mapper = require('mithril-mapper');
var mapObject = mapper.mapObject.bind(mapper);

var _ = require('isa.js');

var v = require('vindication.js');

var Hammer = require('hammerjs');
delete Hammer.defaults.cssProps.userSelect;

function addClass(el, className) {
	if (el.classList)
		el.classList.add(className);
	else
		el.className += ' ' + className;
	return this;
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function valuateEventBinders(viewName, context, element, model, path, milieu) {
	var compute = context.stopComputationForEvents || !!milieu['data-compute'];
	for (var key in milieu) {
		if (key && key.indexOf('data-event-') === 0) {
			var eventName = key.substring('data-event-'.length);
			var fnName = milieu[key];
			if (!element.id) {
				console.error('ID is required for event binding', element);
				throw new Error('ID is required for event binding');
			}
			var refName = eventName + 'For' + element.id; // viewName + (element.id||'') + 'At' + path;
			if (!context[refName]) {
				if (!context[fnName] || !_.isFunction(context[fnName]))
					throw new Error('Missing event handler for: ' + eventName + ' by name of: ' + milieu[key]);
				context[refName] = function() {
					var args = arguments;
					setTimeout(function() {
						if (compute)
							m.startComputation();
						context[fnName].apply(context, args);
						if (compute)
							m.endComputation();
					}, 0);
				};
			}
			element.removeEventListener(eventName, context[refName]);
			element.addEventListener(eventName, context[refName]);
		}
	}
}

function checkContent(milieu, key) {
	return milieu[key];
}

function valuateContent(controlOptions, context, element, model, path, milieu, key) {
	if (!milieu[key]) return null;
	var f = new Function('$opts', '$context', '$root', '$item', '$index', 'return ' + milieu[key] + ';');
	try {
		return {
			value: f(controlOptions, context, model, milieu.item || model, milieu.index)
		};
	} catch (err) {
		err.message = 'While evaluating: ' + milieu[key] + ' ' + err.message;
		console.error(err);
	}
	return null;
}

function valuateVisibility(controlOptions, context, element, model, path, milieu) {
	var res = valuateContent(controlOptions, context, element, model, path, milieu, 'data-visible');
	if (res) {
		element.style.visibility = res.value ? 'visible' : 'hidden';
	}
}

function valuateDisplay(controlOptions, context, element, model, path, milieu) {
	var res = valuateContent(controlOptions, context, element, model, path, milieu, 'data-display');
	if (res) {
		element.style.display = res.value ? 'inline' : 'none';
	}
}

function valuateHTML(controlOptions, context, element, model, path, milieu) {
	var res = valuateContent(controlOptions, context, element, model, path, milieu, 'data-html');
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

function valuateStyle(controlOptions, context, element, model, path, milieu) {
	var res = valuateContent(controlOptions, context, element, model, path, milieu, 'data-style');
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

function valuateAttribute(controlOptions, context, element, model, path, milieu) {
	var res = valuateContent(controlOptions, context, element, model, path, milieu, 'data-attr');
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

function valuateMember(ctrl, element, milieu) {
	if (checkContent(milieu, 'data-member')) {
		var capName = capitalizeFirstLetter(milieu['data-member']);
		element.checked = ctrl['hasIn' + capName](element.value || element.name);
	}
}

function valuateTap(viewName, modelName, context, element, model, path, milieu) {
	if (checkContent(milieu, 'data-tap')) {
		if (milieu['data-tap'] === 'false') return;

		var eventName = (milieu['data-tap'] === 'true') ? ('tapedOn' + viewName) : milieu['data-tap'];
		new Hammer(element, {}).on("tap", function(ev) {
			if (context && context.emit) {
				context.emit(eventName, viewName, modelName, element, model, path, milieu);
			}
		});
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

function createConfig(ctrl, controlOptions, viewName, modelName, appContext, model, path, milieu) {
	return function(element, isInitialized, context) {
		valuateMember(ctrl, element, milieu);
		valuateVisibility(controlOptions, appContext, element, model, path, milieu);
		valuateDisplay(controlOptions, appContext, element, model, path, milieu);
		valuateHTML(controlOptions, appContext, element, model, path, milieu);
		valuateStyle(controlOptions, appContext, element, model, path, milieu);
		valuateAttribute(controlOptions, appContext, element, model, path, milieu);
		if (!isInitialized) {
			valuateEventBinders(viewName, appContext, element, model, path, milieu);
			valuateTap(viewName, modelName, appContext, element, model, path, milieu);
		} else if (milieu.clearElement && milieu.invalidElement && milieu.validElement) {
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
	mount: function(model, context, viewName, modelName, element, envOptions, controlOptions) {
		var Controller = mapObject(modelName, model.validation);
		var firstRun = true;

		if (controlOptions)
			Array.prototype.forEach.call(Object.keys(controlOptions), function(key, i) {
				if (!Controller[key])
					Controller[key] = controlOptions[key];
			});

		var Component = {
			controller: Controller,
			view: function(ctrl, mdl) {
				ctrl.dateFormat = envOptions ? envOptions.dateFormat : 'DD.MM.YYYY';
				if (firstRun) {
					context[modelName].vcs.push({
						model: ctrl[modelName],
						controller: ctrl
					});
					if (context && context.emit) context.emit('init' + viewName + 'Controller', ctrl, mdl);
					firstRun = false;
				}
				return m("div", {
					"className": "section"
				}, [m("text", {
					"className": "h6"
				}, ["Sign up"]), m("br", {
					"className": ""
				}, []), m("input", {
					value: ctrl[modelName].name(),
					oninput: m.withAttr('value', ctrl[modelName].name),
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'name', {
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
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'email', {
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
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'terms', {
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
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], '', {
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
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'name', {
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
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'emails', {
						'data-event-change': "emailSelected",
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					"id": "emails",
					"data-each": "emails",
					"data-event-change": "emailSelected",
					"className": ""
				}, ctrl[modelName].emails.map(function(item, index, array) {
					return [m("option", {
						textContent: item(),
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'emails.$item', {
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
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses', {
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
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses.city', {
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
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses.street', {
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
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses.active', {
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
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses', {
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
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses', {
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
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses', {
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
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses', {
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

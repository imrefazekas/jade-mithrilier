'use strict'

var m = require('mithril')

var mapper = require('mithril-mapper')
var mapObject = mapper.mapObject.bind(mapper)

var _ = require('isa.js')

var v = require('vindication.js')

var Hammer = require('hammerjs')
delete Hammer.defaults.cssProps.userSelect

function addClass(el, className) {
	if (el.classList)
		el.classList.add(className)
	else
		el.className += ' ' + className
	return this
}
function removeClass(el, className) {
	if (el.classList)
		el.classList.remove(className)
	else
		el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ')
	return this
}

function capitalizeFirstvarter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1)
}

function valuateEventBinders(ctrl, viewName, modelName, context, element, model, path, milieu) {
	var compute = context.stopComputationForEvents || !!milieu['data-compute']
	for (var key in milieu) {
		if (key && key.indexOf('data-event-') === 0) {
			if (!element.id) {
				console.error('ID is required for event binding', element)
				throw new Error('ID is required for event binding')
			}
			var eventName = key.substring('data-event-'.length)
			var fnName = milieu[key] || (eventName + 'On' + element.id)
			var refName = eventName + 'For' + element.id // viewName + (element.id||'') + 'At' + path
			if (!context[refName]) {
				context[refName] = function() {
					// setTimeout( function(){
					if (compute)
						m.startComputation()
					context.emit(fnName, arguments[0], viewName, modelName, element, ctrl, model, path, milieu)
					if (compute)
						m.endComputation()
				// }, 0 )
				}
			}
			element.removeEventListener(eventName, context[refName])
			element.addEventListener(eventName, context[refName])
		}
	}
}
function checkContent(milieu, key) {
	return milieu[key]
}
function valuateContent(ctrl, controlOptions, context, element, model, path, milieu, value) {
	if (!value) return null
	var f = new Function('$ctrl', '$opts', '$context', '$root', '$array', '$item', '$index', 'return ' + value + '')
	try {
		return {
			value: f(ctrl, controlOptions, context, model, milieu.array, milieu.item || model, milieu.index)
		}
	} catch (err) {
		err.message = 'While evaluating: ' + value + ' ' + err.message
		console.error(err)
	}
	return null
}
function valuateVisibility(ctrl, controlOptions, context, element, model, path, milieu) {
	var res = valuateContent(ctrl, controlOptions, context, element, model, path, milieu, milieu['data-visible'])
	if (res) {
		element.style.visibility = res.value ? 'visible' : 'hidden'
	}
}
function valuateDisplay(ctrl, controlOptions, context, element, model, path, milieu) {
	var res = valuateContent(ctrl, controlOptions, context, element, model, path, milieu, milieu['data-display'])
	if (res) {
		element.style.display = res.value ? 'inline' : 'none'
	}
}
function valuateHTML(ctrl, controlOptions, context, element, model, path, milieu) {
	var res = valuateContent(ctrl, controlOptions, context, element, model, path, milieu, milieu['data-html'])
	if (res) {
		while (element.firstChild)
		element.removeChild(element.firstChild)
		try {
			element.insertAdjacentHTML('afterbegin', res.value)
		} catch (err) {
			err.message = 'While parsing html text: ' + res.value + ' ' + err.message
			console.error(err)
		}
	}
}
function valuateStyle(ctrl, controlOptions, context, element, model, path, milieu) {
	var res = valuateContent(ctrl, controlOptions, context, element, model, path, milieu, milieu['data-style'])
	if (res) {
		var styles = res.value
		for (var key in styles) {
			if (key) {
				if (styles[key])
					element.style[key] = styles[key]
				else
					delete element.style[key]
			}
		}
	}
}
function valuateEnable(ctrl, controlOptions, context, element, model, path, milieu) {
	var res = valuateContent(ctrl, controlOptions, context, element, model, path, milieu, milieu['data-enable'])
	if (res) {
		var enabling = res.value
		if (enabling) {
			removeClass(element, 'disabled')
			addClass(element, 'enabled')
		} else {
			removeClass(element, 'enabled')
			addClass(element, 'disabled')
		}
	}
}
function valuateSelect(ctrl, controlOptions, context, element, model, path, milieu) {
	var res = valuateContent(ctrl, controlOptions, context, element, model, path, milieu, milieu['data-select'])
	if (res) {
		var selection = res.value
		if (selection)
			addClass(element, 'selected')
		else
			removeClass(element, 'selected')
	}
}
function valuateAttributeEnable(ctrl, controlOptions, context, element, model, path, milieu) {
	var res = valuateContent(ctrl, controlOptions, context, element, model, path, milieu, milieu['data-attr-enable'])
	if (res) {
		var attributes = res.value
		for (var key in attributes) {
			if (key) {
				if (attributes[key])
					element.setAttribute(key, attributes[key])
				else
					element.removeAttribute(key)
			}
		}
	}
}
function valuateAttribute(ctrl, controlOptions, context, element, model, path, milieu) {
	var res = valuateContent(ctrl, controlOptions, context, element, model, path, milieu, milieu['data-attr'])
	if (res) {
		var attributes = res.value
		for (var key in attributes) {
			if (key) {
				if (key === 'class')
					addClass(element, attributes[key])
				else
					element.setAttribute(key, attributes[key])
			}
		}
	}
}
function valuateMember(ctrl, element, milieu) {
	if (checkContent(milieu, 'data-member')) {
		var capName = capitalizeFirstvarter(milieu['data-member'])
		element.checked = ctrl['hasIn' + capName](element.value || element.name)
	}
}
function valuateTap(ctrl, viewName, modelName, controlOptions, context, element, model, path, milieu) {
	if (context && checkContent(milieu, 'data-tap')) {
		if (!milieu['data-tap'] || (milieu['data-tap'] === 'false')) return

		var compute = context.stopComputationForEvents || !!milieu['data-compute']
		new Hammer(element, {}).on('tap', function(ev) {
			var eventName = (milieu['data-tap'] === 'true') ? ('tapedOn' + viewName) : milieu['data-tap']
			if (eventName.charAt(0) === '$')
				eventName = valuateContent(ctrl, controlOptions, context, element, model, path, milieu, eventName).value
			if (context.emit) {
				if (compute)
					m.startComputation()
				context.emit(eventName, ev, viewName, modelName, element, ctrl, model, path, milieu)
				if (compute)
					m.endComputation()
			}
		})
	}
}
function readValidationRule(model, path, V) {
	var qualifiers = path.split('.')
	var value = model,
		contraint = V
	for (var i = 0; i < qualifiers.length && value[qualifiers[i]] && contraint[qualifiers[i]]; ++i) {
		value = value[qualifiers[i]]
		contraint = contraint[qualifiers[i]]
	}
	return {
		value: value,
		contraint: contraint
	}
}
function createConfig(ctrl, controlOptions, viewName, modelName, appContext, model, path, milieu) {
	return function(element, isInitialized, context) {
		valuateMember(ctrl, element, milieu)
		valuateVisibility(ctrl, controlOptions, appContext, element, model, path, milieu)
		valuateDisplay(ctrl, controlOptions, appContext, element, model, path, milieu)
		valuateHTML(ctrl, controlOptions, appContext, element, model, path, milieu)
		valuateStyle(ctrl, controlOptions, appContext, element, model, path, milieu)
		valuateSelect(ctrl, controlOptions, appContext, element, model, path, milieu)
		valuateEnable(ctrl, controlOptions, appContext, element, model, path, milieu)
		valuateAttribute(ctrl, controlOptions, appContext, element, model, path, milieu)
		valuateAttributeEnable(ctrl, controlOptions, appContext, element, model, path, milieu)
		if (!isInitialized) {
			valuateEventBinders(ctrl, viewName, modelName, appContext, element, model, path, milieu)
			valuateTap(ctrl, viewName, modelName, controlOptions, appContext, element, model, path, milieu)
		} else if (milieu.clearElement && milieu.invalidElement && milieu.validElement) {
			var vRule = readValidationRule(model, path, milieu.V)
			if (vRule.value && _.isFunction(vRule.value) && vRule.contraint) {
				var inValid = v.validate(vRule.value(), vRule.contraint, model)
				milieu.clearElement(element)
				if (inValid)
					milieu.invalidElement(element, inValid)
				else
					milieu.validElement(element)
			}
		}
	}
}

module.exports = {
	mount: function(model, context, viewName, modelName, element, envOptions, controlOptions) {
		var Controller = mapObject(modelName, model.validation)
		var firstRun = true

		if (controlOptions)
			Array.prototype.forEach.call(Object.keys(controlOptions), function(key, i) {
				if (!Controller[key])
					Controller[key] = controlOptions[key]
			})

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
				return m('div', {
					'className': 'section'
				}, [m('text', {
					'className': 'h6'
				}, ['Sign up']), m('br', {
					'className': ''
				}, []), m('input', {
					value: ctrl[modelName].name(),
					oninput: m.withAttr('value', ctrl[modelName].name),
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'name', {
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					'type': 'text',
					'id': 'join_name',
					'placeholder': 'Your name',
					'data-bind': 'name',
					'className': 'c_ds_blue hN text-center'
				}, []), m('br', {
					'className': ''
				}, []), m('input', {
					value: ctrl[modelName].email(),
					oninput: m.withAttr('value', ctrl[modelName].email),
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'email', {
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					'type': 'text',
					'id': 'join_email',
					'placeholder': 'Your email address',
					'data-bind': 'email',
					'className': 'c_ds_blue hN text-center'
				}, []), m('br', {
					'className': ''
				}, []), m('text', {
					'className': ''
				}, ['Accept?']), m('input', {
					value: ctrl[modelName].terms(),
					onclick: m.withAttr('checked', ctrl[modelName].terms),
					checked: ctrl[modelName].terms(),
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'terms', {
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					'type': 'checkbox',
					'data-bind': 'terms',
					'className': 'checkbox'
				}, []), m('br', {
					'className': ''
				}, []), m('text', {
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], '', {
						'data-visible': "$item.terms()",
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					'data-visible': '$item.terms()',
					'className': ''
				}, ['Accept check']), m('br', {
					'className': ''
				}, []), m('text', {
					textContent: ctrl[modelName].terms() ? "Haloho" : "Hehehehe",
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'terms() ? "Haloho" : "Hehehehe"!', {
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					'data-value': 'terms() ? \"Haloho\" : \"Hehehehe\"!',
					'className': ''
				}, []), m('br', {
					'className': ''
				}, []), m('text', {
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], '', {
						'data-enable': "$item.terms()",
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					'data-enable': '$item.terms()',
					'className': ''
				}, ['Color change by class']), m('br', {
					'className': ''
				}, []), m('input', {
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], '', {
						'data-attr-enable': "{ readonly: !$item.terms(), disabled: !$item.terms() }",
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					'type': 'text',
					'placeholder': 'Enabled only if you accept terms',
					'data-attr-enable': '{ readonly: !$item.terms(), disabled: !$item.terms() }',
					'className': 'c_ds_blue hN text-center'
				}, []), m('br', {
					'className': ''
				}, []), m('br', {
					'className': ''
				}, []), m('text', {
					textContent: ctrl[modelName].name(),
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'name', {
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					'data-value': 'name',
					'className': ''
				}, ['Addresses:']), m('br', {
					'className': ''
				}, []), m('select', {
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'emails', {
						'data-event-change': "emailSelected",
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					'id': 'emails',
					'data-each': 'emails',
					'data-event-change': 'emailSelected',
					'className': ''
				}, ctrl[modelName].emails.map(function(item, index, array) {
					return [m('option', {
						textContent: item(),
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'emails.$item', {
							array: array,
							item: item,
							index: index,
							'data-attr': "{ value: $item() }",
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						'data-value': '$item',
						'data-attr': '{ value: $item() }',
						'className': ''
					}, [])];
				})), m('div', {
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses', {
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					'data-each': 'addresses',
					'className': 'row-section'
				}, ctrl[modelName].addresses.map(function(item, index, array) {
					return [m('div', {
						'className': 'row'
					}, [m('input', {
						value: item.city(),
						oninput: m.withAttr('value', item.city),
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses.city', {
							array: array,
							item: item,
							index: index,
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						'type': 'text',
						'placeholder': 'Your city',
						'data-bind': 'city',
						'className': 'c_ds_blue hN text-center'
					}, []), m('br', {
						'className': ''
					}, []), m('input', {
						value: item.street(),
						oninput: m.withAttr('value', item.street),
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses.street', {
							array: array,
							item: item,
							index: index,
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						'type': 'text',
						'placeholder': 'Your street',
						'data-bind': 'street',
						'className': 'c_ds_blue hN text-center'
					}, []), m('br', {
						'className': ''
					}, []), m('input', {
						value: item.active(),
						onclick: m.withAttr('checked', item.active),
						checked: item.active(),
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses.active', {
							array: array,
							item: item,
							index: index,
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						'type': 'checkbox',
						'data-bind': 'active',
						'className': 'checkbox'
					}, []), m('br', {
						'className': ''
					}, []), m('text', {
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses', {
							array: array,
							item: item,
							index: index,
							'data-visible': "$item.active()",
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						'data-visible': '$item.active()',
						'className': ''
					}, ['Visibility check']), m('br', {
						'className': ''
					}, []), m('text', {
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses', {
							array: array,
							item: item,
							index: index,
							'data-attr': "{ id: ($item.active() ? \"kortefa\" : \"almafa\") }",
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						'data-attr': '{ id: ($item.active() ? \"kortefa\" : \"almafa\") }',
						'className': ''
					}, ['Gyümölcsös']), m('br', {
						'className': ''
					}, []), m('text', {
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses', {
							array: array,
							item: item,
							index: index,
							'data-style': "{ color: ($item.active() ? \"green\" : \"red\") }",
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						'data-style': '{ color: ($item.active() ? \"green\" : \"red\") }',
						'className': ''
					}, ['Colored']), m('br', {
						'className': ''
					}, []), m('div', {
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses', {
							array: array,
							item: item,
							index: index,
							'data-html': "$root.template()",
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						'data-html': '$root.template()',
						'className': ''
					}, []), m('br', {
						'className': ''
					}, []), m('div', {
						config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], 'addresses', {
							array: array,
							item: item,
							index: index,
							'data-tap': "$item.city()",
							V: ctrl._validation,
							clearElement: context.clearElement,
							invalidElement: context.invalidElement,
							validElement: context.validElement
						}),
						'id': 'city-clicker',
						'data-tap': '$item.city()',
						'className': ''
					}, [m('text', {
						'className': ''
					}, ['Event by city'])])])];
				})), m('br', {
					'className': ''
				}, []), m('div', {
					config: createConfig(ctrl, controlOptions, viewName, modelName, context, ctrl[modelName], '', {
						'data-tap': "clicked",
						V: ctrl._validation,
						clearElement: context.clearElement,
						invalidElement: context.invalidElement,
						validElement: context.validElement
					}),
					'id': 'clicker',
					'data-tap': 'clicked',
					'className': ''
				}, [m('text', {
					'className': ''
				}, ['Click me!'])])]);
			}

		}

		if (context && context.emit)
			context.emit('init' + viewName + 'ViewModel', model.dataModel)

		// m.mount( element, { controller: controller, view: Component.view} )
		m.mount(element, m.component(Component, model.dataModel))
	}
}

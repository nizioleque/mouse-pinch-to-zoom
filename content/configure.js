// sets proper CSS for body and html elements
// fixed for position: fixed and sticky elements
// mainly navigation bars, menus etc

'use strict';

let originalPropertyValues, originalPropertyPriorities;
let sticky, fixed, willChange;
let stickyObservers, fixedObservers;
let absoluteLayoutFix, absoluteFixHeights;
let rtl = false;

const body = document.body;
const html = document.documentElement;

// this function runs when you're at original zoom and start zooming in
// it saves the CSS properties modified by the extension so that they can be restored
function configure(event) {
	// update triggers number
	chrome.runtime.sendMessage({
		incrementTriggers: true
	});

	// check if checks for full-screen absolute layouts are necessary
	const isAbsolute = body.scrollHeight < html.clientHeight;
	absoluteLayoutFix = false;

	// set RTL flag
	if (html.dir === 'rtl' || getComputedStyle(html).direction === 'rtl' || body.dir === 'rtl' || getComputedStyle(body).direction === 'rtl') rtl = true;

	// fixes for elements causing issues
	sticky = [];
	fixed = [];
	willChange = [];
	stickyObservers = [];
	fixedObservers = [];
	absoluteFixHeights = [];
	let sBody;

	document.querySelectorAll('*').forEach(e => {
		if (e === body) return;
		// necessary for further calculations
		const s = getComputedStyle(e);
		const r = e.getBoundingClientRect();

		// fixes for full-screen absolute layouts
		if (isAbsolute && !absoluteLayoutFix) {
			if (r.bottom > html.getBoundingClientRect().bottom) {
				absoluteLayoutFix = true;

				absoluteFixHeights = [
					html.style.getPropertyValue('height'),
					html.style.getPropertyPriority('height'),
					body.style.getPropertyValue('height'),
					body.style.getPropertyPriority('height')
				];

				html.style.setProperty('height', '100%', 'important');
				body.style.setProperty('height', '100%', 'important');
			}
		}

		// will-change: transform - causes blur
		if (s.willChange.indexOf('transform') !== -1) {
			willChange.push([e, e.style.getPropertyValue('will-change'), e.style.getPropertyPriority('will-change')]);
			e.style.setProperty('will-change', 'auto', 'important');
		}

		if (!fixFixed) return;

		// position: fixed 
		// OR (position: sticky 
		// AND (only when stuck vertically OR horizontally) )
		if (s.position === 'fixed' || s.position === 'sticky' &&
			(Math.round(parseFloat(s.top)) >= Math.round(r.top) || Math.round(parseFloat(s.left)) >= Math.round(r.left))) {

			const isSticky = s.position === 'sticky';

			// save the element and its original properties so that they can be restored
			fixed.push([
				e,

				e.style.getPropertyValue('position'),
				e.style.getPropertyPriority('position'),

				e.style.getPropertyValue('top'),
				e.style.getPropertyPriority('top'),

				e.style.getPropertyValue('left'),
				e.style.getPropertyPriority('left'),

				e.style.getPropertyValue('bottom'),
				e.style.getPropertyPriority('bottom'),

				e.style.getPropertyValue('right'),
				e.style.getPropertyPriority('right'),

				e.style.getPropertyValue('transition'),
				e.style.getPropertyPriority('transition'),

				e.style.getPropertyValue('transform'),
				e.style.getPropertyPriority('transform')
			]);

			// necessary for further calculations
			if (!sBody) sBody = getComputedStyle(body);

			// necessary for further calculations - position:fixed works differently when any ancestor has transform
			let p = e.parentElement;
			let topMod, leftMod;
			let pFlag = false;
			while (p && p !== body) {
				const ps = getComputedStyle(p);
				if (ps.transform !== 'none') {
					pFlag = true;

					const pp = p.getBoundingClientRect();
					topMod = - parseFloat(pp.top) - parseFloat(ps.borderTopWidth);
					leftMod = - parseFloat(pp.left) - parseFloat(ps.borderLeftWidth);

					break;
				}
				p = p.parentElement;
			}

			if (!pFlag) {
				topMod = window.scrollY - parseFloat(sBody.marginTop) - parseFloat(sBody.borderTopWidth);
				leftMod = window.scrollX - parseFloat(sBody.marginLeft) - parseFloat(sBody.borderLeftWidth);
			}

			// CSS modifications to preserve position and size
			// prop - array of properties that need to be adjusted
			const prop = [
				['position', 'fixed'],
				['transition', 'opacity 0.1s cubic-bezier(0.55, 0.06, 0.68, 0.19)'],
				['transform', 'none'],
				['right', 'auto'],
				['bottom', 'auto']
			];
			prop.push(
				['top', r.top + topMod + 'px'],
				['left', r.left + leftMod + 'px'],
			);

			// special cases that require additional CSS modifications
			// set display:none to get correct CSS values (% or auto instead of px)
			const displayValue = e.style.getPropertyValue('display');
			const displayPriority = e.style.getPropertyPriority('display');
			e.style.setProperty('display', 'none', 'important');

			const checkWidth = s.getPropertyValue('width');
			const checkHeight = s.getPropertyValue('height');
			const checkTop = s.getPropertyValue('top');
			const checkBottom = s.getPropertyValue('bottom');
			const checkLeft = s.getPropertyValue('left');
			const checkRight = s.getPropertyValue('right');

			e.style.setProperty('display', displayValue, displayPriority);

			// SPECIAL CASES - both need to be applied with position:sticky
			// SPECIAL CASE 1: width is set as percentage OR left and right are set
			if (isSticky || checkLeft !== 'auto' && checkRight !== 'auto' || checkWidth.indexOf('%') !== -1) {
				// set width to preserve the size
				prop.push(
					['width', s.width]
				);

				// save original width (from style attribute, not computed style!!) to restore
				let widthValue = e.style.getPropertyValue('width');
				if (!widthValue) widthValue = '';
				let widthPriority = e.style.getPropertyPriority('width');
				if (!widthPriority) widthPriority = '';

				e.setAttribute('data-' + ID + '-original-width-value', widthValue);
				e.setAttribute('data-' + ID + '-original-width-priority', widthPriority);
			}

			// special case 2: height is set as percentage OR top and bottom are set
			if (isSticky || checkTop !== 'auto' && checkBottom !== 'auto' || checkHeight.indexOf('%') !== -1) {
				// set height to preserve the size
				prop.push(
					['height', s.height]
				);

				// save original height (from style attribute, not computed style!!) to restore
				let heightValue = e.style.getPropertyValue('height');
				if (!heightValue) heightValue = '';
				let heightPriority = e.style.getPropertyPriority('height');
				if (!heightPriority) heightPriority = '';

				e.setAttribute('data-' + ID + '-original-height-value', heightValue);
				e.setAttribute('data-' + ID + '-original-height-priority', heightPriority);
			}

			// apply CSS modifications and store the calculated values in HTML data-attributes for the observer
			prop.forEach(element => {
				e.style.setProperty(element[0], element[1], 'important');
				e.setAttribute('data-' + ID + '-' + element[0], element[1]);
			});

			// opacity - make the element semi-transparent when the mouse cursor is not over it
			if (fixFixedTransparency && r.width > 0 && r.height > 0) {
				e.setAttribute('data-' + ID + '-opacity-computed', s.getPropertyValue('opacity'));
				// check if mouse is inside div at the moment
				if (!(event.clientX >= r.left
					&& event.clientX <= r.right
					&& event.clientY >= r.top
					&& event.clientY <= r.bottom)) {
					transparentSet({ target: e });
				}
				// event listeners for changing opacity
				e.addEventListener('mouseenter', transparentUnset);
				e.addEventListener('mouseleave', transparentSet);
			}
			// observer - prevents the page's JS from reverting our modified CSS
			const observer = new MutationObserver(mutations => {
				mutations.forEach(mutationRecord => {
					// if the style attribute is changed, pause observing, reapply the modifications and start observing again
					observer.disconnect();
					prop.forEach(element => {
						mutationRecord.target.style.setProperty(element[0], mutationRecord.target.getAttribute('data-' + ID + '-' + element[0]), 'important');
					});
					observer.observe(e, { attributeFilter: ['style'] });
				});
			});
			// start the observer
			observer.observe(e, { attributeFilter: ['style'] });
			// save the observer to disconnect when restoring
			fixedObservers.push(observer);
		}

		// position: sticky but not stuck (acts as relative/static) - set static and observe
		else if (s.position === 'sticky') {
			sticky.push([
				e,

				e.style.getPropertyValue('position'),
				e.style.getPropertyPriority('position')
			]);

			e.style.setProperty('position', 'static', 'important');

			const observer = new MutationObserver(mutations => {
				mutations.forEach(mutationRecord => {
					observer.disconnect();
					e.style.setProperty('position', 'static', 'important');
					observer.observe(e, { attributeFilter: ['style'] });
				});
			});
			observer.observe(e, { attributeFilter: ['style'] });
			stickyObservers.push(observer);
		}
	});

	// save the original values for <html> and <body> CSS properties in configProperties
	originalPropertyValues = [
		// prevent unscrollable body
		html.style.getPropertyValue('overflow-x'),
		html.style.getPropertyValue('overflow-y'),
		body.style.getPropertyValue('overflow-x'),
		body.style.getPropertyValue('overflow-y'),

		// prepare for scaling
		body.style.getPropertyValue('transform-origin'),
		body.style.getPropertyValue('transform'),

		// remove transitions for transform and transform-origin and smooth-scrolling to avoid the jumping effect
		body.style.getPropertyValue('transition'),
		html.style.getPropertyValue('scroll-behavior')
	];
	originalPropertyPriorities = [
		html.style.getPropertyPriority('overflow-x'),
		html.style.getPropertyPriority('overflow-y'),
		body.style.getPropertyPriority('overflow-x'),
		body.style.getPropertyPriority('overflow-y'),
		body.style.getPropertyPriority('transform-origin'),
		body.style.getPropertyPriority('transform'),
		body.style.getPropertyPriority('transition'),
		html.style.getPropertyPriority('scroll-behavior')
	];
	html.style.setProperty('overflow-x', 'scroll', 'important');
	html.style.setProperty('overflow-y', 'scroll', 'important');
	body.style.setProperty('overflow-x', 'visible', 'important');
	body.style.setProperty('overflow-y', 'visible', 'important');
	if (!rtl) body.style.setProperty('transform-origin', 'left top', 'important');
	else body.style.setProperty('transform-origin', 'right top', 'important');
	body.style.setProperty('transform', 'scale(1)', 'important');
	body.style.setProperty('transition', 'transform 0s linear, transform-origin 0s linear', 'important');
	html.style.setProperty('scroll-behavior', 'initial', 'important');

	// run the fix for elements with position:absolute (eg. context menus, popups) - absolute.js
	if (fixAbsolute) runAbsoluteObserver();

	// set the flag
	configured = true;

	// console.log('RTL: ', rtl); //DEBUG
	// alert(rtl) 
}

// this function runs when you zoom out and reach zoom==1
// it restores the original CSS values saved by configure()
function restore() {
	// send restore message to all iframes
	document.querySelectorAll('iframe').forEach(frame => {
		frame.contentWindow.postMessage({ from: ID, type: 'restore' }, '*');
	});

	// absoluteLayoutFix - restore html and body height
	if (absoluteLayoutFix) {
		html.style.setProperty('height', absoluteFixHeights[0], absoluteFixHeights[1]);
		body.style.setProperty('height', absoluteFixHeights[2], absoluteFixHeights[3]);
	}

	if (fixFixed) {
		// stop the observers
		fixedObservers.forEach(e => {
			e.disconnect();
		});
		stickyObservers.forEach(e => {
			e.disconnect();
		});
	}

	// restore original values for <html> and <body>
	html.style.setProperty('overflow-x', originalPropertyValues[0], originalPropertyPriorities[0]);
	html.style.setProperty('overflow-y', originalPropertyValues[1], originalPropertyPriorities[1]);
	body.style.setProperty('overflow-x', originalPropertyValues[2], originalPropertyPriorities[2]);
	body.style.setProperty('overflow-y', originalPropertyValues[3], originalPropertyPriorities[3]);
	body.style.setProperty('transform-origin', originalPropertyValues[4], originalPropertyPriorities[4]);
	body.style.setProperty('transform', originalPropertyValues[5], originalPropertyPriorities[5]);
	body.style.setProperty('transition', originalPropertyValues[6], originalPropertyPriorities[6]);
	html.style.setProperty('scroll-behavior', originalPropertyValues[7], originalPropertyPriorities[7]);

	// restore html height (only if changed)
	const htmlOriginalHeight = html.getAttribute('data-' + ID + '-original-height-value');
	if (htmlOriginalHeight != null) {
		html.style.setProperty('height', htmlOriginalHeight, html.getAttribute('data-' + ID + '-original-height-priority'));
	}

	// restore position:fixed/sticky (when stuck) elements
	if (fixFixed) fixed.forEach(e => {
		// always restore
		e[0].style.setProperty('top', e[3], e[4]);
		e[0].style.setProperty('left', e[5], e[6]);
		e[0].style.setProperty('bottom', e[7], e[8]);
		e[0].style.setProperty('right', e[9], e[10]);
		e[0].style.setProperty('position', e[1], e[2]);
		e[0].style.setProperty('transform', e[13], e[14]);

		setTimeout(() => {
			e[0].style.setProperty('transition', e[11], e[12]);
		}, 50);

		// opacity
		if (fixFixedTransparency) {
			const transparencySet = e[0].getAttribute('data-' + ID + '-opacity-computed');
			if (transparencySet !== null) {
				e[0].removeEventListener('mouseenter', transparentUnset);
				e[0].removeEventListener('mouseleave', transparentSet);
				transparentUnset({ target: e[0] });
			}
		}

		['top', 'left', 'bottom', 'right', 'position', 'transition', 'transform', 'opacity-value', 'opacity-priority', 'opacity-computed'].forEach(property => {
			e[0].removeAttribute('data-' + ID + '-' + property)
		});


		// restore only if changed (special cases)
		const originalHeight = e[0].getAttribute('data-' + ID + '-original-height-value');
		if (originalHeight != null) {
			e[0].style.setProperty('height', originalHeight, e[0].getAttribute('data-' + ID + '-original-height-priority'));
			e[0].removeAttribute('data-' + ID + '-original-height-value');
			e[0].removeAttribute('data-' + ID + '-original-height-priority');
			e[0].removeAttribute('data-' + ID + '-height');
		}
		const originalWidth = e[0].getAttribute('data-' + ID + '-original-width-value');
		if (originalWidth != null) {
			e[0].style.setProperty('width', originalWidth, e[0].getAttribute('data-' + ID + '-original-width-priority'));
			e[0].removeAttribute('data-' + ID + '-original-width-value');
			e[0].removeAttribute('data-' + ID + '-original-width-priority');
			e[0].removeAttribute('data-' + ID + '-width');

		}
	});

	// restore position: sticky (not stuck) elements
	if (fixFixed) sticky.forEach(e => {
		e[0].style.setProperty('position', e[1], e[2]);
	});

	// restore will-change: transform
	willChange.forEach(e => {
		e[0].style.setProperty('will-change', e[1], e[2]);
	});

	// stop the observer from absolute.js
	if (fixAbsolute) absoluteObserver.disconnect();

	// reset the flag
	configured = false;
}

// helper functions for opacity
const opacityDiff = 0.5;
// make semi-transparent
function transparentSet(event) {
	// console.log('transparentSet', event.target);
	const oldOpacity = event.target.getAttribute('data-' + ID + '-opacity-computed');
	const newOpacity = oldOpacity >= opacityDiff + 0.1 ? parseFloat(oldOpacity) - opacityDiff : 0.1;
	event.target.setAttribute('data-' + ID + '-opacity-value', event.target.style.getPropertyValue('opacity'));
	event.target.setAttribute('data-' + ID + '-opacity-priority', event.target.style.getPropertyPriority('opacity'));
	event.target.style.setProperty('opacity', newOpacity, 'important');
}
// make opaque
function transparentUnset(event) {
	// console.log('transparentUnset', event.target);
	const val = event.target.getAttribute('data-' + ID + '-opacity-value');
	if (val !== null) {
		event.target.style.setProperty(
			'opacity',
			val,
			event.target.getAttribute('data-' + ID + '-opacity-priority')
		);

	}
}
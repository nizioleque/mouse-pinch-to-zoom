// this script runs at document_start (earlier than content.js, before the page is loaded)
// listeners for mouse events

'use strict';

let zoom = 1;
let triggered = false;
let lastEvent, nextEvent;
let configured = false;
const ID = chrome.runtime.id;

// default settings values
let mode = 0, mult = 0.4, steps = 5;
let fixFixed = true;
let fixFixedTransparency = true;
let fixAbsolute = true;
let fixAbsoluteBorder = false;
let fixTouchpadScroll = true;
let fixTouchpadScrollThreshold = 30;

// read settings from storage
chrome.storage.sync.get(['mode', 'mult', 'steps', 'fixFixed', 'fixFixedTransparency', 'fixAbsolute', 'fixAbsoluteBorder', 'fixTouchpadScroll', 'fixTouchpadScrollThreshold'], items => {
	if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
	else {
		if (items.mult) mult = items.mult;
		if (items.steps) steps = items.steps;
		if (items.mode) mode = items.mode;

		if (items.fixFixed !== undefined) fixFixed = items.fixFixed;
		if (items.fixFixedTransparency !== undefined) fixFixedTransparency = items.fixFixedTransparency;
		if (items.fixAbsolute !== undefined) fixAbsolute = items.fixAbsolute;
		if (items.fixAbsoluteBorder !== undefined) fixAbsoluteBorder = items.fixAbsoluteBorder;
		if (items.fixTouchpadScroll !== undefined) fixTouchpadScroll = items.fixTouchpadScroll;
		if (items.fixTouchpadScrollThreshold !== undefined) fixTouchpadScrollThreshold = items.fixTouchpadScrollThreshold;

		modeSet(mode);
	}
});

// update settings if the user changes them
chrome.storage.onChanged.addListener((changes, areaName) => {
	if (areaName == 'sync') {
		if (changes.mode) {
			modeUnset(changes.mode.oldValue);
			modeSet(changes.mode.newValue);
		}
		if (changes.mult) mult = changes.mult.newValue;
		if (changes.steps) steps = changes.steps.newValue;
	}
});

// event listeners dictionary
const modeListeners = [
	[
		// mode 0 - ALT
		['wheel', mode0Wheel, { passive: false }],
		['mousedown', mode0MouseDown, { passive: false }],
		['keydown', mode0KeyDown, { passive: false }]
	],
	[
		// mode 1 - RMB
		['mousedown', mode1MouseDownR, {}],
		['mouseup', mode1MouseUpR, {}],
		['contextmenu', mode1ContextMenu, { passive: false }],
		['wheel', mode1Wheel, { passive: false }],
		['mousedown', mode1MouseDownM, { passive: false }]
	],
	[
		// mode 2 - LMB
		['mousedown', mode2MouseDownL, {}],
		['mouseup', mode2MouseUpL, {}],
		['wheel', mode2Wheel, { passive: false }],
		['mousedown', mode2MouseDownM, { passive: false }]
	],
	[
		// mode 3 - CTRL
		['wheel', mode3Wheel, { passive: false }],
		['mousedown', mode3MouseDown, { passive: false }],
		['keydown', mode3KeyDown, { passive: false }]
	],
];

// mode set/unset
// those functions set/unset all the listeners
function modeSet(m) {
	rightButtonPressed = false;
	leftButtonPressed = false;
	blockContextMenu = false;
	modeListeners[m].forEach(e => {
		document.addEventListener(e[0], e[1], e[2]);
	})
}
function modeUnset(m) {
	modeListeners[m].forEach(e => {
		document.removeEventListener(e[0], e[1], e[2]);
	})
}

// mode 0 listeners
function mode0Wheel(e) {
	if (e.altKey) {
		e.preventDefault(); // prevents the page from scrolling when the user turns the wheel
		e.stopImmediatePropagation(); // prevents other listeners from triggering (i'm not sure if it's necessary with preventDefault)
		scrollEvent(e);
		mouseEventHandler(e);
	}
}
function mode0MouseDown(e) {
	if (e.button == 1 && e.altKey && configured) { // button1 is the mouse wheel click (middle mouse button)
		e.preventDefault();
		e.stopImmediatePropagation();
		clickEvent();
	}
}

function mode0KeyDown(e) {
	if (e.code === 'AltLeft') {
		e.preventDefault();
	}
}

// mode 1 listeners
let rightButtonPressed, blockContextMenu;
function mode1MouseDownR(e) {
	if (e.button === 2) rightButtonPressed = true; // button2 is the right mouse button
}
function mode1MouseUpR(e) {
	if (e.button === 2) rightButtonPressed = false;
}
function mode1ContextMenu(e) {
	if (blockContextMenu) {
		e.preventDefault();
		e.stopImmediatePropagation();
		blockContextMenu = false;
	}
}
function mode1Wheel(e) {
	if (rightButtonPressed) {
		e.preventDefault();
		e.stopImmediatePropagation();
		blockContextMenu = true;
		scrollEvent(e);
		mouseEventHandler(e);
	}
}
function mode1MouseDownM(e) {
	if (e.button == 1 && rightButtonPressed && configured) {
		e.preventDefault();
		e.stopImmediatePropagation();
		blockContextMenu = true;
		clickEvent();
	}
}

// mode 2 listeners
let leftButtonPressed;
function mode2MouseDownL(e) {
	if (e.button === 0) leftButtonPressed = true; // button0 is the left mouse button
}
function mode2MouseUpL(e) {
	if (e.button === 0) leftButtonPressed = false;
}
function mode2Wheel(e) {
	if (leftButtonPressed) {
		e.preventDefault();
		e.stopImmediatePropagation();
		scrollEvent(e);
		mouseEventHandler(e);
	}
}
function mode2MouseDownM(e) {
	if (e.button == 1 && leftButtonPressed && configured) {
		e.preventDefault();
		e.stopImmediatePropagation();
		clickEvent();
	}
}

// mode 3 listeners
function mode3Wheel(e) {
	if (e.ctrlKey) {
		e.preventDefault(); // prevents the page from scrolling when the user turns the wheel
		e.stopImmediatePropagation(); // prevents other listeners from triggering (i'm not sure if it's necessary with preventDefault)
		scrollEvent(e);
		mouseEventHandler(e);
	}
}
function mode3MouseDown(e) {
	if (e.button == 1 && e.ctrlKey && configured) { // button1 is the mouse wheel click (middle mouse button)
		e.preventDefault();
		e.stopImmediatePropagation();
		clickEvent();
	}
}

function mode3KeyDown(e) {
	if (e.code === 'CtrlLeft') {
		e.preventDefault();
	}
}

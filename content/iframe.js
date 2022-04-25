'use strict';

// iframe or top
function checkTop() {
	try {
		return window.self === window.top;
	} catch (e) {
		return false;
	}
}
const isTop = checkTop();

// iframe->top message listener
if (isTop) window.addEventListener('message', e => {
	if (!e.data) return;
	if (e.data.from !== ID) return;

	switch (e.data.type) {
		case 'scroll':
			let breakFlag = false;
			document.querySelectorAll('iframe').forEach(frame => {
				if (breakFlag) return;
				if (frame.contentWindow === e.source) {
					breakFlag = true;
					const iframeBorderWidth = parseFloat(getComputedStyle(frame).borderWidth);
					e.data.clientY = e.data.clientY * zoom + frame.getBoundingClientRect().top + iframeBorderWidth;
					e.data.clientX = e.data.clientX * zoom + frame.getBoundingClientRect().left + iframeBorderWidth;
					scrollEvent(e.data);
				}
			});
			break;
		case 'click':
			clickEvent();
			break;
	}

}, false);
// top->iframe message listener
else window.addEventListener('message', e => {
	if (e.data.from !== ID) return;

	switch (e.data.type) {
		case 'restore':
			iframeRestore();
			break;
	}
});

// simplified configuration for iframes
function iframeConfigure() {
	willChange = [];

	document.querySelectorAll('*').forEach(e => {
		if (getComputedStyle(e).willChange.indexOf('transform') !== -1) {
			willChange.push([e, e.style.getPropertyValue('will-change'), e.style.getPropertyPriority('will-change')]);
			e.style.setProperty('will-change', 'auto', 'important');
		}
	});

	configured = true;
}

function iframeRestore() {
	if (!configured) return;

	willChange.forEach(e => {
		e[0].style.setProperty('will-change', e[1], e[2]);
	});

	configured = false;
}

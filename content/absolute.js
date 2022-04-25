// fix for the positioning of elements with position: absolute
// mainly right-click context menus, tooltips etc

'use strict';

const absoluteObserver = new MutationObserver(absoluteCallback);
let lastPageX = 0, lastPageY = 0;
let lastScrollX = 0, lastScrollY = 0;

// keep mouse page and scroll position to move the element to the correct position
document.addEventListener('mousemove', mouseEventHandler);
document.addEventListener('wheel', mouseEventHandler);
// mouseEventHandler is also run in prep.js in wheel event handlers

function mouseEventHandler(event) {
    lastPageX = event.pageX;
    lastPageY = event.pageY;

    // those values are also updated in scale()
    lastScrollX = window.scrollX;
    lastScrollY = window.scrollY;
}

// runs the observer
function runAbsoluteObserver() {
    absoluteObserver.observe(body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['style'],
        attributeOldValue: true,
        characterData: false
    });
}

// observer handler
function absoluteCallback(mutationList, observer) {
    mutationList.forEach((mutation) => {
        switch (mutation.type) {
            case 'childList':
                mutation.addedNodes.forEach(element => {
                    try {
                        // nodeType 1 !!! ???
                        if (getComputedStyle(element).position === 'absolute') {
                            absoluteFix(element, mutation);
                        }
                    } catch (error) {
                        if (error.message !== "Failed to execute 'getComputedStyle' on 'Window': parameter 1 is not of type 'Element'.")
                            console.error(error)
                    }
                })
                break;

            case 'attributes':
                try {
                    if (getComputedStyle(mutation.target).position === 'absolute') {
                        absoluteFix(mutation.target, mutation);
                    }
                } catch (error) {
                    if (error.message !== "Failed to execute 'getComputedStyle' on 'Window': parameter 1 is not of type 'Element'.")
                        console.error(error)
                }
                break;
        }
    });
}

// modifications to the element
function absoluteFix(e, mutation) {
    const s = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    const sBody = getComputedStyle(body);

    if (window.scrollX !== lastScrollX || window.scrollY !== lastScrollY) {
        window.scrollTo(lastScrollX, lastScrollY);
    }

    // if it's visible in the viewport, do nothing
    if (!(
        r.left > html.clientWidth
        || r.top > html.clientHeight
        || r.right < 0
        || r.bottom < 0
    )) {
        return;
    }

    // check if there is a positioned ancestor and set the modifiers
    let p = e.parentElement;
    let topMod = 0, leftMod = 0;
    let pFlag = false;
    while (p !== body) {
        const ps = getComputedStyle(p);
        // if the ancestor has position fixed or sticky, do nothing
        if (['fixed', 'sticky'].includes(ps.position)) {
            return;
        }
        if (['relative', 'absolute'].includes(ps.position)) {
            pFlag = true;

            const pp = p.getBoundingClientRect();
            topMod = - parseFloat(pp.top) / zoom - window.scrollY / zoom - parseFloat(ps.marginTop) - parseFloat(ps.borderTopWidth);
            leftMod = - parseFloat(pp.left) / zoom - window.scrollX / zoom - parseFloat(ps.marginLeft) - parseFloat(ps.borderLeftWidth);

            break;
        }
        p = p.parentElement;
    }

    // modifiers for elements positioned relatively to body
    if (!pFlag) {
        const sBody = getComputedStyle(body)
        topMod = - parseFloat(sBody.borderTopWidth);
        leftMod = - parseFloat(sBody.borderLeftWidth);
    }

    // temporarily disconnect the observer to prevent infinite loops
    absoluteObserver.disconnect();

    // set position
    e.style.setProperty('top', (lastPageY - parseFloat(sBody.marginTop) + 10) / zoom + topMod + 'px', 'important');
    e.style.setProperty('bottom', 'auto', 'important');
    e.style.setProperty('right', 'auto', 'important');

    // prevent transform:translate from moving the element
    if (s.transform.indexOf('translate') !== -1) e.style.setProperty('transform', 'unset', 'important');

    // set left
    e.style.setProperty('left', (lastPageX - parseFloat(sBody.marginLeft) + 10) / zoom + leftMod + 'px', 'important');

    // if the element is cut off, move it to the left
    if (e.getBoundingClientRect().right > html.clientWidth) {
        leftMod -= e.getBoundingClientRect().width / zoom;
        e.style.setProperty('left', (lastPageX - parseFloat(sBody.marginLeft)) / zoom + leftMod + 'px', 'important');
    }

    // if the element is cut off again, set left to 0
    if (e.getBoundingClientRect().left < 0) {
        e.style.setProperty('left', window.scrollX / zoom + 'px', 'important');
    }

    // debug
    if (fixAbsoluteBorder) e.style.setProperty('border', '5px red solid', 'important');

    runAbsoluteObserver();
}

function checkStyleChange(mutation, properties) {
    // returns true if any of the properties has changed
    properties.forEach(prop => {
        if (extractProperty(mutation.oldValue, prop) != mutation.target.style.getPropertyValue(prop)) return true;
    })
    return false;
}

function extractProperty(cssText, property) {
    // extract a property value from CSS text
    if (!cssText || !property) return undefined;
    if (Array.isArray(property)) {
        const ret = [];
        property.forEach(prop => {
            ret.push(extractProperty(cssText, prop));
        });
        return ret;
    }
    const i = cssText.indexOf(property);
    if (i === -1) return '';
    const j = cssText.indexOf(':', i + 1);
    const k = cssText.indexOf(';', i + 1);
    let l = cssText.indexOf('!important', i + 1);
    if (l === -1) l = Infinity;
    return cssText.substring(j + 2, Math.min(k, l));
}
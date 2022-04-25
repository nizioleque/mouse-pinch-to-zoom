    // main scaling function

'use strict';

// this is the main function which does the scaling (see scrollEvent() first)
function scale(e, setZoom, scrollX = window.scrollX, scrollY = window.scrollY) {
    // save for calculations
    const oldZoom = zoom;
    const oldClientWidth = html.clientWidth;
    const oldClientHeight = html.clientHeight;
    const bodyMarginLeft = parseFloat(getComputedStyle(body).marginLeft);
    const bodyMarginTop = parseFloat(getComputedStyle(body).marginTop);

    zoom = setZoom;

    // scale before calculations if zooming in
    if (zoom > oldZoom) body.style.setProperty('transform', 'scale(' + zoom + ')', 'important');

    // scroll calculations - width
    const newClientWidth = html.clientWidth;
    let mouseMultX;
    if (!rtl) mouseMultX = e ? e.clientX / newClientWidth : 0.5;
    else mouseMultX = e ? -(1-(e.clientX / newClientWidth)) : 0.5;
    const oldWidth = newClientWidth / oldZoom;
    const newWidth = newClientWidth / zoom;

    const startWidth = (scrollX - bodyMarginLeft) * zoom / oldZoom + bodyMarginLeft;
    const offsetWidth = (oldWidth - newWidth) * zoom * mouseMultX + (oldClientWidth - newClientWidth);

    // scroll calculations - height
    const newClientHeight = html.clientHeight;
    const mouseMultY = e ? e.clientY / newClientHeight : 0.5;
    const oldHeight = newClientHeight / oldZoom;
    const newHeight = newClientHeight / zoom;

    const startHeight = (scrollY - bodyMarginTop) * zoom / oldZoom + bodyMarginTop;
    const offsetHeight = (oldHeight - newHeight) * zoom * mouseMultY + (oldClientHeight - newClientHeight);

    // scale after calculations if zooming out
    if (zoom < oldZoom) body.style.setProperty('transform', 'scale(' + zoom + ')', 'important');

    // scroll action
    window.scroll(startWidth + offsetWidth, startHeight + offsetHeight); // try deleting/commenting that line to see what happens without scrolling
    // console.log(startWidth, offsetWidth, e.clientX)

    // update variables for absolute.js
    lastScrollX = window.scrollX;
    lastScrollY = window.scrollY;

    // restore if needed (if the user is zooming out and reaches zoom==0)
    if (zoom == 1) restore();
}
/* global Sketchpad, socket, animateCSS */
const canvas = document.getElementById('sketchpad');
const smBrush = document.getElementById('sm-brush');
const mdBrush = document.getElementById('md-brush');
const lgBrush = document.getElementById('lg-brush');
const xlBrush = document.getElementById('xl-brush');
const eraserBtn = document.getElementById('eraser');
const clearCanvas = document.getElementById('clearCanvas');
const brushButtons = Array.from(document.getElementsByClassName('brush-btn'));
const colors = Array.from(document.getElementsByClassName('color'));

let pad = null;
if (canvas && typeof Sketchpad !== 'undefined') {
    pad = new Sketchpad(canvas, {
        line: {
            size: 5,
        },
        aspectRatio: 5 / 8,
    });
    pad.setReadOnly(true);
}

const current = {
    lineColor: '#000',
    lineSize: 5,
};

function setLineSize() {
    if (!pad || pad.readOnly) return;
    const size = Number(this.dataset.linesize) || 5;
    current.lineSize = size;
    pad.setLineSize(size);

    brushButtons.forEach((btn) => btn.classList.remove('active'));
    this.classList.add('active');
}

function getEventCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const { width: w, height: h } = pad.getCanvasSize();
    const touch = e.touches && e.touches.length > 0 ? e.touches[0] : (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : e);
    return {
        x: (touch.clientX - rect.left) / w,
        y: (touch.clientY - rect.top) / h,
    };
}

function onDrawStart(e) {
    if (!pad || !pad.sketching) return;
    const coords = getEventCoords(e);
    current.x = coords.x;
    current.y = coords.y;
}

function onDrawEnd(e) {
    if (!pad || pad.readOnly) return;
    const coords = getEventCoords(e);
    if (typeof socket !== 'undefined') {
        socket.emit('drawing', {
            start: {
                x: current.x,
                y: current.y,
            },
            end: {
                x: coords.x,
                y: coords.y,
            },
            lineColor: current.lineColor,
            lineSize: current.lineSize,
        });
    }
}

function onDrawMove(e) {
    if (!pad || !pad.sketching) return;
    if (e.cancelable) e.preventDefault();
    const coords = getEventCoords(e);
    if (typeof socket !== 'undefined') {
        socket.emit('drawing', {
            start: {
                x: current.x,
                y: current.y,
            },
            end: {
                x: coords.x,
                y: coords.y,
            },
            lineColor: current.lineColor,
            lineSize: current.lineSize,
        });
    }
    current.x = coords.x;
    current.y = coords.y;
}

function throttle(callback, delay) {
    let previousCall = new Date().getTime();
    return (...args) => {
        const time = new Date().getTime();
        if ((time - previousCall) >= delay) {
            previousCall = time;
            callback(...args);
        }
    };
}

colors.forEach((color) => {
    color.addEventListener('click', function () {
        if (!pad || pad.readOnly) return;
        current.lineColor = getComputedStyle(this).backgroundColor;
        pad.setLineColor(current.lineColor);
        const selectedColorEl = document.querySelector('.selected-color');
        if (selectedColorEl) selectedColorEl.style.backgroundColor = current.lineColor;
        if (eraserBtn) eraserBtn.classList.remove('active');
    }, false);
});

if (smBrush) smBrush.addEventListener('click', setLineSize);
if (mdBrush) mdBrush.addEventListener('click', setLineSize);
if (lgBrush) lgBrush.addEventListener('click', setLineSize);
if (xlBrush) xlBrush.addEventListener('click', setLineSize);

if (eraserBtn) {
    eraserBtn.addEventListener('click', () => {
        if (!pad || pad.readOnly) return;
        current.lineColor = '#ffffff';
        pad.setLineColor('#ffffff');
        const selectedColorEl = document.querySelector('.selected-color');
        if (selectedColorEl) selectedColorEl.style.backgroundColor = '#ffffff';
        eraserBtn.classList.add('active');
    });
}

if (clearCanvas) {
    clearCanvas.addEventListener('click', () => {
        if (!pad || pad.readOnly) return;
        if (typeof socket !== 'undefined') socket.emit('clearCanvas');
        pad.clear();
    });
}

window.addEventListener('resize', () => {
    if (pad && canvas && canvas.offsetWidth > 0) {
        pad.resize(canvas.offsetWidth);
    }
});

if (canvas) {
    canvas.addEventListener('mousedown', onDrawStart);
    canvas.addEventListener('mouseup', throttle(onDrawEnd, 10));
    canvas.addEventListener('mousemove', throttle(onDrawMove, 10));

    // Touch Support for Mobile & Tablets
    canvas.addEventListener('touchstart', onDrawStart, { passive: false });
    canvas.addEventListener('touchend', throttle(onDrawEnd, 10), { passive: false });
    canvas.addEventListener('touchmove', throttle(onDrawMove, 10), { passive: false });
}

if (typeof socket !== 'undefined') {
    socket.on('clearCanvas', () => { if (pad) pad.clear(); });
    socket.on('drawing', ({
        start,
        end,
        lineColor,
        lineSize,
    }) => {
        if (!pad) return;
        const { width: w, height: h } = pad.getCanvasSize();
        start.x *= w;
        start.y *= h;
        end.x *= w;
        end.y *= h;
        pad.setLineColor(lineColor);
        pad.setLineSize(lineSize);
        pad.drawLine(start, end);
        pad.setLineColor(current.lineColor);
        pad.setLineSize(current.lineSize);
    });

    socket.on('disableCanvas', async () => {
        if (pad) pad.setReadOnly(true);
        const tools = document.querySelector('#tools');
        if (tools) {
            await animateCSS('#tools', 'fadeOutDown');
            tools.classList.add('d-none');
        }
    });
}

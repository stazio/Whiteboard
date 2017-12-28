var canvas, ctx,
    penDown = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0;

var color = "black",
    width = 2;

var widthInput, heightInput;
var lineWidthInput;

function setDimensions(width, height) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.width = width;
    ctx.height = height;

    widthInput.value = width;
    heightInput.value = height;
}

function initWhiteboard() {
    canvas = document.getElementById('whiteboard');

    //var computed = window.getComputedStyle(canvas);
    //canvas.width = parseInt(computed.width.substr(0, computed.width.length - 2));
    //canvas.height = parseInt(computed.height.substr(0, computed.height.length - 2));

    ctx = canvas.getContext("2d");

    canvas.addEventListener("mousemove", function (e) {
        findxy('move', e)
    }, false);
    canvas.addEventListener("mousedown", function (e) {
        findxy('down', e)
    }, false);
    canvas.addEventListener("mouseup", function (e) {
        findxy('up', e)
    }, false);
    canvas.addEventListener("mouseout", function (e) {
        findxy('out', e)
    }, false);
    canvas.addEventListener("mouseover", function (e) {
        findxy('in', e)
    }, false);

    var children = document.getElementById("buttons").children;

    for (var button in children) {
        children[button].onclick = function (ev) {
            var buttonVal = ev.target.name;
            switch (buttonVal) {
                case "clear":
                    clear();
                    break;
                default:
                    color = buttonVal;
                    break;
            }
        };

        if (children[button].name === "width")
            widthInput = children[button];

        if (children[button].name === "height")
            heightInput = children[button];

        if (children[button].name === "linewidth")
            lineWidthInput = children[button];
    }
    // widthInput.addEventListener("change", function (e) {
    //     var val = parseInt(widthInput.value.trim());
    //     if (!isNaN(val))
    //         newSize(val, heightInput.value);
    //     widthInput.value = val;
    // });
    // heightInput.addEventListener("change", function (e) {
    //     var val = parseInt(heightInput.value.trim());
    //     if (!isNaN(val))
    //         newSize(widthInput.value, val);
    //     heightInput.value = val;
    // });

    lineWidthInput.addEventListener("change", function(e) {
        width = e.target.value;
    });
    lineWidthInput.value = width;
}

function draw() {
    line(prevX, prevY, currX, currY, color);
}

function clearScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawLine(startX, startY, endX, endY, color) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = ctx.lineCap = "round";
    ctx.stroke();
    ctx.closePath();
}

function findxy(res, e) {
    if (res == 'down') {
        prevX = currX;
        prevY = currY;
        currX = e.clientX + window.pageXOffset;
        currY = e.clientY + window.pageYOffset;

        penDown = true;
    } else if (res == 'up' || res == "out") {
        penDown = false;
    } else if (res == "in") {
        prevX = currX;
        prevY = currY;
        currX = e.clientX + window.pageXOffset;
        currY = e.clientY + window.pageYOffset;
        penDown = e.buttons === 1;
    } else if (res == 'move') {
        if (penDown) {
            prevX = currX;
            prevY = currY;
            currX = e.clientX + window.pageXOffset;
            currY = e.clientY + window.pageYOffset;
            draw();
        }
    }
}

initWhiteboard();
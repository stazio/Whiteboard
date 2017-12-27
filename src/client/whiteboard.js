var canvas, ctx,
    penDown = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0;

var color = "black",
    width = 2;

function initWhiteboard() {
    canvas = document.getElementById('whiteboard');

    var computed = window.getComputedStyle(canvas);
    canvas.width = parseInt(computed.width.substr(0, computed.width.length - 2));
    canvas.height = parseInt(computed.height.substr(0, computed.height.length - 2));
    console.log(canvas.width, canvas.height);

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
            console.log(buttonVal);
            switch (buttonVal) {
                case "clear":
                    clear();
                    break;
                default:
                    color = buttonVal;
                    break;
            }
        };
    }
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
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

function findxy(res, e) {
    if (res == 'down') {
        prevX = currX;
        prevY = currY;
        currX = e.clientX - canvas.offsetLeft;
        currY = e.clientY - canvas.offsetTop;

        penDown = true;
    } else if (res == 'up' || res == "out") {
        penDown = false;
    } else if (res == "in") {
        prevX = currX;
        prevY = currY;
        currX = e.clientX - canvas.offsetLeft;
        currY = e.clientY - canvas.offsetTop;
        penDown = e.buttons === 1;
    } else if (res == 'move') {
        if (penDown) {
            prevX = currX;
            prevY = currY;
            currX = e.clientX - canvas.offsetLeft;
            currY = e.clientY - canvas.offsetTop;
            draw();
        }
    }
}

initWhiteboard();
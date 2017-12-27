var canvas, ctx, penDown = false, beforeOutPenState = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0;

var color = "black",
    width = 2;

function initWhiteboard() {
    canvas = document.getElementById('whiteboard');

    var computed = window.getComputedStyle(canvas);
    canvas.width = parseInt(computed.width.substr(0, computed.width.length-2));
    canvas.height = parseInt(computed.height.substr(0, computed.height.length-2));
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
        children[button].onclick = function(ev){
            var buttonVal = ev.target.value;
            switch (buttonVal) {
                case "clear":
                    clear();
                    break;
                default:
                    color = buttonVal;
            }

        }
    }
}

function draw() {
    // ctx.beginPath();
    // ctx.moveTo(prevX, prevY);
    // ctx.lineTo(currX, currY);
    // ctx.strokeStyle = color;
    // ctx.lineWidth = width;
    // ctx.stroke();
    // ctx.closePath();

    line(prevX, prevY, currX, currY, color, width);
}

function clearScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawLine(startX, startY, endX, endY, color, width) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
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
    }else if (res == 'up' || res == "out") {
        if (res == "out")
            beforeOutPenState = penDown;
        penDown = false;
    }else if (res == "in") {
        penDown = beforeOutPenState;
    }else if (res == 'move') {
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
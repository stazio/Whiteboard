var canvas, ctx, numOfPeople;
var isDrawing = null;
var width = 9, fill = "red";

// Initialization
canvas = setup_canvas();
ctx = setup_context();
setup_paths_array();
setup_mouse_touch();
setup_buttons();

// Functions to set stuff up. It's nicer to have them be functions
function setup_canvas() {
    var canvas = document.getElementById("whiteboard");

    // Let's use the precomputed CSS styles for the canvas, to figure out what the size should be.
    // FOR SOME REASON it can't make the assumption itself.
    var computed = window.getComputedStyle(canvas);
    // getComputedStyle.width returns "0px" which needs to be turned into a number.
    var width = parseInt(computed.width.substr(0, computed.width.length - 2));
    var height = parseInt(computed.height.substr(0, computed.height.length - 2));

    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function setup_context() {
    var context = canvas.getContext("2d");

    // This needs to exist because (FOR SOME REASON) the canvas doesn't tell the context what the bounds are.
    // However getComputedStyle.width returns "0px" which needs to be turned into a number.
    context.width = parseInt(window.getComputedStyle(canvas).width.substr(-2));
    context.height = parseInt(window.getComputedStyle(canvas).height.substr(-2));

    return context;
}

function setup_paths_array() {
    ctx.paths = [[]];
}

function setup_buttons() {
    for (var i in document.getElementById("buttons").children) {
        if (document.getElementById("buttons").children[i].name === "color") {
            document.getElementById("buttons").children[i].onclick = function (e) {
                fill = e.target.value;
            }
        }
    }
    numOfPeople = document.getElementById("numOfPeople");

    document.getElementsByName("width")[0].onclick = function (e) {
        width = e.target.value;
    };
    document.getElementsByName("width")[0].value = width;

    document.getElementsByName("clear")[0].onclick = function () {
        message({type: "clear"})
    };
}

function setup_mouse_touch() {

    function onMouseDown(e) {
        var pos = get_mouse_pos(e);

        isDrawing = true;
        ctx.paths[0].push(width + ";" + fill);
        ctx.paths[0].push(pos);
        message({
            "type": "path",
            "paths": [
                width + ";" + fill,
                pos
            ]
        });
    }


    function onMouseUp(e) {
        ctx.paths[0].push("END");
        message({
            "type": "path",
            "path": "END"
        });
        isDrawing = false;
        render();
    }


    function onMouseMove(e) {
        if (isDrawing) {
            var pos = get_mouse_pos(e);
            ctx.paths[0].push(pos);
            message({
                "type": "path",
                "path": pos
            });
            render();
        }
    }

    function onMouseEnter(e) {
        if (e.buttons === 1)
            onMouseDown(e);
    }

    canvas.onmousedown = onMouseDown;
    canvas.onmouseup = onMouseUp;
    canvas.onmousemove = onMouseMove;
    canvas.onmouseleave = onMouseUp;
    canvas.onmouseenter = onMouseEnter;


    canvas.addEventListener('touchstart', function (e) {
        if (isDrawing && e.touches.length !== 1)
            onMouseUp(e);
        else if (e.touches.length === 1)
            onMouseDown(e.touches[0]);
    });


    canvas.addEventListener('touchend', function (e) {
        if (isDrawing && e.touches.length !== 1)
            onMouseUp(e);
        else if (e.touches.length === 1)
            onMouseDown(e.touches[0]);
    });


    canvas.addEventListener('touchmove', function (e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            onMouseMove(e.touches[0]);
        }
    });
}

/** This function takes an event (which contains clientX/clientY) and turns it into accurate x,y poisitons for the mouse*/
function get_mouse_pos(e) {
    return [
        e.clientX + window.pageXOffset,
        e.clientY + window.pageYOffset - canvas.offsetTop
    ];
}

/**This makes the screen empty. IT DOES NOT alert the server to clearing the screen.*/
function clear_screen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setup_paths_array();
}

function render() {
    var paths = ctx.paths;
    var deletes = [];

    var i;
    for (i in paths) {
        if (paths.hasOwnProperty(i)) {
            var group = paths[i];

            // TODO why do I need this?
            ctx.beginPath();
            for (var ii = 0, len = group.length; ii <= len; ii++) {
                var pointA = group[ii], pointB = group[ii + 1];

                if (Array.isArray(pointA) && Array.isArray(pointB)) {
                    // I wrote this a while ago and forgot why it is how it is.
                    // Somewhere in the history of this git, there is a link to the code I based this on.
                    // TODO proper credits!
                    var mid = [
                        pointA[0] + (pointB[0] - pointA[0]) / 2,
                        pointA[1] + (pointB[1] - pointA[1]) / 2
                    ];


                    ctx.quadraticCurveTo(pointB[0], pointB[1], mid[0], mid[1]);
                }

                // There should be no point in time where there is more info after an END.
                // Therefore we can delete the entire path if we see it.
                else if (pointA === "END" || pointB === "END")
                    deletes.push(i);

                // From this point on, the code is awful, I know.
                // However, this code deals with the beginning of a point.
                // But this is the end of the loop you say? Yes, because fuck legibility, also else if's are nice.
                else if ((pointB && pointB.split) || (pointA && pointA.split)) {
                    // If we can split the string using pointB, then do it.
                    var split = (pointB && pointB.split) ? pointB.split(";") : null;
                    // Where we able to do the previous? And is it the proper splitting?
                    if (split === null || split.length !== 2)
                    // No you say? Well then we need to split with A.
                        split = (pointA && pointA.split) ? pointA.split(";") : null;

                    // Try the previous, again.
                    if (split && split.length == 2) {
                        // Ah yes! This is the beginning of a new path!!!
                        // So let's close the path's. This is because there may be an unfinished path someone is drawing.
                        ctx.stroke();
                        ctx.closePath(); // Not necessary, however pretty.

                        ctx.beginPath();

                        ctx.lineJoin = ctx.lineCap = 'round'; // This ensures that are lines are connected... and have a nice tip....

                        ctx.lineWidth = split[0];
                        ctx.strokeStyle = split[1];
                    }// TODO Maybe there should be something here? Who knows how this code even works...
                }
            }

            // Just in case
            ctx.stroke();
            ctx.closePath();
        }
    }

    // We know there are certain paths we do not need.
    // Let's keep ourselves from re-drawing unnecessary lines
    // Also memory management!
    for (i in deletes) {
        if (deletes[i] != 0 && ctx.paths[deletes[i]])
            delete ctx.paths[deletes[i]];
        // if (!ctx.paths[0])
        //     ctx.paths[0] = [];
    }
}
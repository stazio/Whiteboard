function setup_canvas() {
    var canvas = document.getElementById("whiteboard");
    var computed = window.getComputedStyle(canvas);

    var width = parseInt(computed.width.substr(0, computed.width.length - 2));
    var height = parseInt(computed.height.substr(0, computed.height.length - 2));

    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function setup_context() {
    var context = canvas.getContext("2d");
    context.paths = [[]];
    context.width = parseInt(window.getComputedStyle(canvas).width.substr(-2));
    context.height = parseInt(window.getComputedStyle(canvas).height.substr(-2));
    return context;
}

function clear_screen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.paths = [
        []
    ];
}

function setup_mouse() {
    canvas.onmousedown = function(e) {
        var currX = e.clientX + window.pageXOffset,
        currY = e.clientY + window.pageYOffset - canvas.offsetTop;
        //new_path(currX, currY);
        activePath = true;
        ctx.paths[0].push(width+";"+fill);
        ctx.paths[0].push([currX, currY]);
        message({
            "type" : "path",
            "paths" : [
                width+";"+fill,
                [currX, currY]
            ]
        });
    };

    canvas.onmouseup = function(e) {
        ctx.paths[0].push("END");
        message({
            "type" : "path",
            "path" : "END"
        });
        activePath = false;
        render();
    };

    canvas.onmousemove = function(e) {
        if (activePath) {
            var currX = e.clientX + window.pageXOffset,
                currY = e.clientY + window.pageYOffset - canvas.offsetTop;
            ctx.paths[0].push([currX, currY]);
            message({
                "type": "path",
                "path" : [currX, currY]
            });
            render();
        }
        //append_path(currX, currY);
    }
}

// function new_path(x, y) {
//     activePath = randomUUID();
//     send(Messages.NEW_PATH(new Path(activePath, 20, "black", [[x, y]])));
// }
//
// function end_path() {
//     send(Messages.END_PATH(activePath));
//     activePath = null;
// }
//
// function append_path(x, y) {
//     if (activePath) {
//         send(Messages.APPEND_PATH(activePath, [x,y]));
//     }
// }

var canvas = setup_canvas();
var ctx = setup_context();
var activePath = null;
var image = null;

var width = 9, fill = "red";

for (var i in document.getElementById("buttons").children) {
    if (document.getElementById("buttons").children[i].name === "color") {
        document.getElementById("buttons").children[i].onclick = function(e) {
            fill = e.target.value;
        }
    }
}
document.getElementsByName("width")[0].onclick = function(e) {
    width = e.target.value;
};
document.getElementsByName("width")[0].value = width;

document.getElementsByName("clear")[0].onclick = function(){message({type: "clear"})};


setup_mouse();

function render() {
    //ctx.clearRect(0, 0, canvas.width, canvas.height);
    // if (image)
    //     ctx.putImageData(image,0,0, 0, 0, canvas.width, canvas.height);

    var paths = ctx.paths;

    var deletes = [];

    for (var i in paths) {
        var group = paths[i];

        // var split = group[0].split(";");
        // ctx.beginPath();
        // ctx.lineWidth = split[0];
        // ctx.fillStyle = split[1];

        ctx.beginPath();
        for (var ii = 0, len = group.length; ii <= len; ii++) {
            var pointA = group[ii], pointB = group[ii+1];

                if (Array.isArray(pointA) && Array.isArray(pointB)) {
                    var mid = [
                        pointA[0] + (pointB[0] - pointA[0]) / 2,
                        pointA[1] + (pointB[1] - pointA[1]) / 2
                    ];

                    //this.ctx.quadraticCurveTo(pointB[0], pointB[1], mid[0], mid[1]);
                    ctx.quadraticCurveTo(pointB[0], pointB[1], mid[0], mid[1]);
                }else if (pointA === "END" || pointB === "END")
                    deletes.push(i);
                else if ((pointB && pointB.split) || (pointA && pointA.split)) {
                    var split = (pointB && pointB.split) ? pointB.split(";") : null;
                    if (split === null || split.length !== 2)
                        split = (pointA && pointA.split) ? pointA.split(";") : null;
                    if (split && split.length == 2) {

                    ctx.stroke();
                    ctx.closePath();
                    ctx.beginPath();

                    ctx.lineJoin = ctx.lineCap = 'round';
                    ctx.lineWidth = split[0];
                    ctx.strokeStyle = split[1];
                    }
                }
        }

        ctx.stroke();
        ctx.closePath();
    }
    for (var i in deletes) {
        console.log("Deleting " + deletes[i]);
        if (ctx.paths[deletes[i]])
            delete ctx.paths[deletes[i]];
        if (!ctx.paths[0])
            ctx.paths[0] = [];
    }
}


function make_it_an_image(exclude) {
    var canv = document.createElement("canvas");

    canv.width = canvas.width;
    canv.height = canvas.height;
    var ctx = canv.getContext("2d");

    if (image)
        ctx.putImageData(image, 0, 0);

    for (var id in room.paths) {
        if (room.paths.hasOwnProperty(id) && exclude != id) {
            var path = room.paths[id];
            var points = path.points;

            if (points && points.length > 1) {
                var pointA = points[0], pointB = points[1];
                ctx.moveTo(pointA[0], pointA[1]);

                ctx.beginPath();
                for (var i = 0, len = points.length; i < len; i++) {
                    var mid = [
                        pointA[0] + (pointB[0] - pointA[0]) / 2,
                        pointA[1] + (pointB[1] - pointA[1]) / 2
                    ];

                    // Two of these because some things are actually incompetent that's why...
                    ctx.quadraticCurveTo(pointB[0], pointB[1], mid[0], mid[1]);
                    ctx.quadraticCurveTo(pointB[0], pointB[1], mid[0], mid[1]);

                    pointA = points[i];
                    pointB = points[i + 1];
                    if (!pointA || !pointB)
                        break;
                }
            }

            ctx.lineJoin = this.ctx.lineCap = 'round';
            ctx.lineWidth = path.width;
            ctx.fillStyle = path.fill;
            ctx.stroke();
            ctx.closePath();


            // Because of some strange ass shit, when rendering the ends, stuff can happen.
            // I need to have this here... Hopefully?
        }
    }
    image = ctx.getImageData(0, 0, canv.width, canv.height);
}


function new_dims() {
    var width = ctx.width;
    var height = ctx.height;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    // ctx.width = width;
    // ctx.height = height;

}
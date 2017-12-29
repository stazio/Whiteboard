function setup_canvas() {
    var canvas = document.getElementById("whiteboard");
    canvas.wdith = 1000;
    canvas.height = 1000;
    return canvas;
}

function setup_mouse() {
    canvas.onmousedown = function(e) {
        var currX = e.clientX + window.pageXOffset,
        currY = e.clientY + window.pageYOffset - canvas.offsetTop;
        new_path(currX, currY);
    };

    canvas.onmouseup = function(e) {
        end_path();
    };

    canvas.onmousemove = function(e) {
        var currX = e.clientX + window.pageXOffset,
            currY = e.clientY + window.pageYOffset - canvas.offsetTop;
        append_path(currX, currY);
    }
}

function new_path(x, y) {
    activePath = randomUUID();
    send(Messages.NEW_PATH(new Path(activePath, 20, "black", [[x, y]])));
}

function end_path() {
    activePath = null;
}

function append_path(x, y) {
    if (activePath) {
        send(Messages.APPEND_PATH(activePath, [x,y]));
    }
}


var canvas = setup_canvas();
var ctx = canvas.getContext("2d");
var activePath = null;

setup_mouse();


function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var paths = room.paths;
    for (var id in paths) {
        if (paths.hasOwnProperty(id)) {
            var path = paths[id];
            var points = path.points;
            this.ctx.beginPath();

            if (points && points.length > 1) {
                var pointA = points[0], pointB = points[1];
                for (var i = 0, len = points.length; i < len; i++) {
                    var mid = [
                        pointA[0] + (pointB[0] - pointA[0]) / 2,
                        pointA[1] + (pointB[1] - pointA[1]) / 2
                    ];

                    this.ctx.quadraticCurveTo(pointB[0], pointB[1], mid[0], mid[1]);

                    pointA = points[i];
                    pointB = points[i + 1];
                    if (!pointA || !pointB)
                        break;
                }
            }

            this.ctx.lineJoin = this.ctx.lineCap = 'round';
            this.ctx.lineWidth = path.width;
            this.ctx.fillStyle = path.fill;
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }
}

function new_dims() {
    var width = room.width;
    var height = room.height;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.width = width;
    ctx.height = height;

}

function Whiteboard_OLD(){
    // This function is based on Perfectionkills.com's exploring canvas drawing techniques tutorial!
    this.renderPage = function() {

        // Start by clearing the page
        // TODO do we need double buffering? I haven't noticed, however doesn't mean it doesn't exist...
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (var actionI in this.actions) {
            var action = this.actions[actionI];
            switch (action.action) {
                case "path":
                    var width = action.width;
                    var fill = action.fill;
                    var points = action.points;

                    this.ctx.beginPath();

                    var pointA = points[0], pointB = points[1];
                    for (var i = 0, len = points.length; i < len; i++) {
                        var mid = [
                            pointA[0] + (pointB[0] - pointA[0]) / 2,
                            pointA[1] + (pointB[1] - pointA[1]) / 2
                        ];

                        this.ctx.quadraticCurveTo(pointB[0], pointB[1], mid[0], mid[1]);

                        pointA = points[i];
                        pointB = points[i+1];
                    }

                    this.ctx.lineJoin = this.ctx.lineCap = 'round';
                    this.ctx.lineWidth = width;
                    this.ctx.fillStyle = fill;
                    this.ctx.stroke();
                    this.ctx.closePath();

                    break;

                case "clear":
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    break;
            }
        }
    };

    /**
     *
     * @param onNewPoint an object with the following functions: startPath(color, width), newPoint(pos), endPath
     */
    this.init = function(onNewPoint) {
        var instance = this;

        this.canvas = document.getElementById("whiteboard");


        var computed = window.getComputedStyle(this.canvas);

        var width = parseInt(computed.width.substr(0, computed.width.length - 2));
        var height = parseInt(computed.height.substr(0, computed.height.length - 2));

        this.canvas.width = width;
        this.canvas.height = height;

        // Initialize Context
        this.ctx = this.canvas.getContext("2d");

        // Intialize stuff for drawing
        this.actions = [];
        this.pointFunctions = onNewPoint;

        // Initialize Mouse Events

        this.canvas.onmousedown = function(e){
            instance.onMouseStateChange("down", instance.transformMouse(e.clientX,  e.clientY));
        };

        this.canvas.onmouseup = function(e){
            instance.onMouseStateChange("up", instance.transformMouse(e.clientX,  e.clientY));
        };

        this.canvas.onmouseleave = function(e){
            instance.onMouseStateChange("leave", instance.transformMouse(e.clientX,  e.clientY));
        };

        this.canvas.onmouseenter = function(e){
            instance.onMouseStateChange("enter", instance.transformMouse(e.clientX,  e.clientY));
        };

        this.canvas.onmousemove = function(e){
            instance.onMouseStateChange("move", instance.transformMouse(e.clientX,  e.clientY));
        };
    };

    this.onAction = function(action) {
        switch (action.action) {
            case "path":
                this.actions.push({
                    action: "path",
                    fill: action.fill,
                    width: action.width,
                    points: action.points
                });
                break;

            case "clear":
                this.actions = [];
                break;
        }
    };

    /**
     * Any state change
     * @param state string one of the following: up, down, leave, enter, move
     * @param pos Array the new position of [mouseX, mouseY] relative to canvas
     */
    this.onMouseState = function(state, pos) {
        switch (state) {
            case "up":
                this.pointFunctions.endPath();
                break;

            case "down":
                this.pointFunctions.startPath("black", 10);
                this.pointFunctions.newPoint(pos);
                break;

            case "move":
                if (this.latestAction) {
                    this.pointFunctions.newPoint(pos);
                }
                break;
        }
    };

    this.transformMouse = function(pageX, pageY) {
        var rect = this.canvas.getBoundingClientRect();
        return [pageX - rect.x , pageY - rect.y ];
    };
}
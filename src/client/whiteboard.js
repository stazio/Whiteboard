var paths = {};
var queued = {};
var activePath = null;

function Whiteboard() {
    this.init = function() {
        this.canvas = document.getElementById("canvas");
        this.setup_canvas();
        this.ctx = this.canvas.getContext("2d");
        this.isMouseDown = false;
        this.activePath = null;

        this.setup_mouse();
    };

    this.setup_canvas = function() {
        var computed = window.getComputedStyle(this.canvas);

        var width = parseInt(computed.width.substr(0, computed.width.length - 2));
        var height = parseInt(computed.height.substr(0, computed.height.length - 2));

        this.canvas.width = width;
        this.canvas.height = height;
    };

    this.setup_touch = function(){};//TODO
    this.setup_mouse = function(){
        var canvas = this.canvas;
        var instance = this;

        function onMouseStartPath(ev) {
            instance.isMouseDown = true;
            instance.createActivePath();
            instance.appendActivePath(instance.getMousePos(ev.clientX, ev.clientY));
        }
        canvas.onmousedown = onMouseStartPath;
        canvas.onmouseenter = function(ev) {
            if (ev.button === 0)
                onMouseStartPath(ev);
        };

        function onMouseEndPath(ev) {
            instance.isMouseDown = false;
            instance.endActivePath();
        }
        canvas.onmouseup = onMouseEndPath;
        canvas.onmouseleave = onMouseEndPath;

        canvas.onmousemove = function(ev) {
            if (this.isMouseDown)
                instance.appendActivePath(instance.getMousePos(ev.clientX, ev.clientY));
        };
    };

    this.getMousePos = function(x, y) {
        var rect = this.canvas.getBoundingClientRect();
        return [x - rect.x , y - rect.y ];
    };

    this.createActivePath = function() {
        this.activePath = {
            id: null,
            width: 10,
            color: "black",
            points: []
        };
    };

    this.appendActivePath = function(pos) {
        this.activePath.points.push(pos);
    };

    this.endActivePath = function() {
        this.alertSocketChanges();
        this.activePath = null;
    };

    this.updateOrCreatePath = function(id, fill, width, points) {
        this.paths[id] = {
            id: id,
            fill: fill,
            width: width,
            points: points
        }
    };

    this.appendPoints = function(id, points) {
        this.paths[id].points = Array.concat(this.paths[id].points, points);
    };

    // This function is based on Perfectionkills.com's exploring canvas drawing techniques tutorial!
    this.renderPaths = function(){
        var ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (var pathUUID in this.paths) {
            if (this.paths.hasOwnProperty(pathUUID)) {
                var path = this.paths[pathUUID];

                var points = path.points;

                this.ctx.beginPath();
                var pointA = points[0], pointB = points[1];
                for (var pointI = 0, len = points.length; pointI < len; pointI++) {
                    // Anti-Aliasing I think?
                    var mid = [
                        pointA[0] + (pointB[0] - pointA[0]) / 2,
                        pointA[1] + (pointB[1] - pointA[1]) / 2
                    ];

                    this.ctx.quadraticCurveTo(pointB[0], pointB[1], mid[0], mid[1]);

                    pointA = points[pointI];
                    pointB = points[pointI+1];
                }

                // Make sure that the lines are round and joined; not whatever the hell the other things were
                this.ctx.lineJoin = this.ctx.lineCap = 'round';
                this.ctx.lineWidth = path.width;
                this.ctx.fillStyle = path.fill;
                this.ctx.stroke();
                this.ctx.closePath();
            }
        }
    };
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
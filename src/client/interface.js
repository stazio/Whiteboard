
var controller = new (function() {
    this.init = function() {
        this.whiteboard = new Whiteboard();
        //  startPath(color, width), newPoint(x,y), endPath
        this.whiteboard.init({
            startPath: this.onStartPath,
            newPoint: this.onNewPoint,
            endPath: this.onEndPath
        });

        this.socket = new Socket();
        this.socket.init();
    };

    // Point Functions
    this.onStartPath = function(color, width) {
        this.latestPath = {
            color: color,
            width: width,
            points: []
        };
        this.socket.newPath(this.latestPath);
    };

    this.onNewPoint = function(pos) {
        if (this.latestPath) {
            this.latestPath.points.push(pos);
            this.socket.newPoint(this.latestPath, pos);
        }
    };

    this.onEndPath = function() {
        this.latestPath = null;
    };

    this.onjoin = function() {};

    this.onsocketdata = function() {};

    this.onleave = function() {};

    // Mouse Events

    /**
     * Any state change
     * @param state string one of the following: up, down, leave, enter, move
     * @param pos Array the new position of [mouseX, mouseY] relative to canvas
     */
    this.onMouseState = function(state, pos) {
        switch (state) {
            case "up":
                this.latestAction = null;
                break;

            case "down":
                this.latestAction = {
                    action: "path",
                    width: 10,
                    fill: "black",
                    points: [pos]
                };
                this.actions.push(this.latestAction);
                break;

            case "move":
                if (this.latestAction) {
                    this.latestAction.points.push(pos);
                    this.renderPage();
                }
                break;
        }
    };




});
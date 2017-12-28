
var controller = new (function() {
    this.init = function() {
        this.whiteboard = new Whiteboard();
        //  startPath(color, width), newPoint(x,y), endPath
        this.whiteboard.init({
            startPath: this.onStartPath,
            newPoint: this.onNewPoint,
            endPath: this.onEndPath
        });

        this.socket = new Socket({
            onDraw: this.onIncomingPath
        });
        this.socket.init();
    };

    this.onIncomingPath = function(data) {
        this.whiteboard.onAction(data);
    };

    // Point Functions
    this.onStartPath = function(fill, width) {
        this.latestPath = this.socket.newDrawAction({
            fill: fill,
            width: width
        });
    };

    this.onNewPoint = function(pos) {
        if (this.latestPath) {
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

var whiteboard = new (function() {

    /**
     * Any state change
     * @param state string one of the following: up, down, leave, enter, move
     * @param newPos Array the new position of [mouseX, mouseY] relative to canvas
     */
    this.onMouseStateChange = function(state, newPos) {
        console.log(state);
        console.log(newPos);

        switch (state) {
            case "up":
                this.ctx.stroke();
                this.ctx.closePath();
                this.isPathBeingDrawn = false;
                break;
            case "down":
                this.isPathBeingDrawn = true;
                this.ctx.lineWidth = 25;
                this.lastMouseX = newPos[0];
                this.lastMouseY = newPos[1];
                this.ctx.beginPath();
                break;
            case "move":
                if (this.isPathBeingDrawn) {
                    this.ctx.lineTo(newPos[0], newPos[1]);
                    this.ctx.stroke();
                }
                break;
        }
    };

    this.transformMouse = function(pageX, pageY) {
        var rect = this.canvas.getBoundingClientRect();
        return [pageX - rect.x, pageY - rect.y];
    };

    this.init = function() {
        var instance = this;

        this.canvas = document.getElementById("whiteboard");
        // TODO Do a real implementation
        this.canvas.width = this.canvas.().width;
        this.canvas.height = this.canvas.getBoundingClientRect().height;

        // Initialize Context
        this.ctx = this.canvas.getContext("2d");

        // Intialize stuff for transformations
        this.pathBeingDrawn = [];
        this.isPathBeingDrawn = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Initialize Mouse Events

        this.canvas.onmousedown = function(e){
            instance.onMouseStateChange("down", instance.transformMouse(e.pageX,  e.pageY));
        };

        this.canvas.onmouseup = function(e){
            instance.onMouseStateChange("up", instance.transformMouse(e.pageX, e.pageY));
        };

        this.canvas.onmouseleave = function(e){
            instance.onMouseStateChange("leave", instance.transformMouse(e.pageX, e.pageY));
        };

        this.canvas.onmouseenter = function(e){
            instance.onMouseStateChange("enter", instance.transformMouse(e.pageX, e.pageY));
        };

        this.canvas.onmousemove = function(e){
            instance.onMouseStateChange("move", instance.transformMouse(e.pageX, e.pageY));
        };
    }
});

whiteboard.init();
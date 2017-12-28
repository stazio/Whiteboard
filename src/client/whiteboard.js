
var whiteboard = new (function() {

    /**
     * Any state change
     * @param state string one of the following: up, down, leave, enter, move
     * @param newPos Array the new position of [mouseX, mouseY] relative to canvas
     */
    this.onMouseStateChange = function(state, newPos) {

        switch (state) {
            case "up":
                this.ctx.stroke();
                this.ctx.closePath();
                this.isPathBeingDrawn = false;
                break;
            case "down":
                this.isPathBeingDrawn = true;
                this.ctx.lineWidth = 2;
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
        return [pageX - rect.x , pageY - rect.y ];
    };

    this.init = function() {
        var instance = this;

        this.canvas = document.getElementById("whiteboard");

        var computed = window.getComputedStyle(this.canvas);

        var width = parseInt(computed.width.substr(0, computed.width.length - 2));
        var height = parseInt(computed.height.substr(0, computed.height.length - 2));

        this.canvas.width = width;
        this.canvas.height = height;

        // Initialize Context
        this.ctx = this.canvas.getContext("2d");

        // Intialize stuff for transformations
        this.pathBeingDrawn = [];
        this.isPathBeingDrawn = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

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
    }
});

whiteboard.init();
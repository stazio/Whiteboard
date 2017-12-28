function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
var Socket = function() {

    this.process = function(data) {
        if (data.action === "draw")
            this.eventDict.draw(data.drawData);
    };

    this.newPath = function(path) {
        this.enqueue({
            action : "path",
            path : path,
            pathUUID: this.pathUUID = uuidv4()
        });
    };

    this.newPoint = function(path, newPoint) {
        this.enqueue({
            action: "point",
            pathID: path,
            point: newPoint
        });
    };

    /**
     *
     * @param eventDict dict of the following functions onDraw({action, color, fill, points});
     */
    this.init = function(eventDict) {

        var instance  = this;
        this.eventDict = eventDict;
        this.pathUUID = null;

        // Find host
            var ssl = location.protocol === "http:" ? "ws" : "wss";
            var host = location.hostname;
            var port = 1234;

            // create socket
            var ws = this.ws = new WebSocket(ssl + "://" + host + ":" + port);

            ws.onmessage = function (data) {
                if (instance.isWSReady = false && ws.readyState === ws.OPEN){instance.wsReadyState = true;}
                console.log(data);
                var val = JSON.parse(data.data);
                if (Array.isArray(val)) {
                    for (var i in val) {
                        instance.process(val[i]);
                    }
                } else
                    instance.process(val);
            };

            ws.onopen = function () {
                if (ws.readyState === ws.OPEN){
                instance.wsReadyState = true;}
            };
            ws.onclose = function () {
                instance.wsReadyState = false;
            };
            ws.onerror = function () {
                console.log("error!");
                console.log(arguments);
                if (ws.readyState === ws.CLOSING || ws.readyState === ws.CLOSED)instance.wsReadyState = false;
            };

            setInterval(function () {
                if (instance.queue.length > 0) {
                    instance.ws.send(JSON.stringify(instance.queue));
                    instance.queue = [];
                }
            }, 50);
        };
    };
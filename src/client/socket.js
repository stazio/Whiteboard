var ws = create_socket();
var room = new Room(0, 0);

var queue = [];
function send(data) {
    if (Array.isArray(data))
        queue = Array.concat(queue, data);
    else {
        queue.push(data);
    }
}

ws.onmessage = function(e) {
    var str = e.data;
    var data = JSON.parse(str);
    for (var i in data) {
        if (data.hasOwnProperty(i)) {
            var json = data[i];
            switch (json.action) {
                case "append_path_points":
                    room.append_path_points(json.id, json.points);
                    render();
                    break;
                case "new_path":
                    room.add(parse_path(json.path));
                    render();
                    break;
                case "new_dimensions":
                    room.new_dimensions(json.width, json.height);
                    new_dims();
                    render();
                    break;
                case "clear":
                    room.clear();
                    render();
                    break;
            }
        }
    }
};

function create_socket() {
// Find host
    var ssl = location.protocol === "http:" ? "ws" : "wss";
    var host = location.hostname;
    var port = 1234;
// create socket
  var ws= new WebSocket(ssl + "://" + host + ":" + port);

setInterval(function() {
    if (queue && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(queue));
        queue = [];
    }
}, 50); // every 50 mills send an update to the server with a new queue

return ws;
}

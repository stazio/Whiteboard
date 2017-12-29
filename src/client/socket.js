var ws = create_socket();

var queue = [];
function message(data) {
    if (Array.isArray(data))
        queue = Array.concat(queue, data);
    else {
        queue.push(data);
    }
}

ws.onmessage = function(e) {
    var str = e.data;
    var json = JSON.parse(str);
    switch (json.type) {
        case "path":
            var id = json.id;
            var path = json.path;
            if (ctx.paths[id])
                ctx.paths[id].push(path);
            else
                ctx.paths[id] = [path];
            render();
            break;
        case "clear":
            clear_screen();
            break;
        case "room":
            ctx.paths = json.paths;
            if (ctx.paths[0] === undefined)
                ctx.paths[0] = [];
            render();
            break;
    }
};

ws.onerror = function(e){
    alert("An error has occurred!");

};

ws.onclose = function(e) {
    alert("Disconnected.");
    canvas.onmousedown = canvas.onmousemove = canvas.onmouseup = undefined;
    document.getElementsByName("clear")[0].onclick = undefined;
};

function create_socket() {
// Find host
    var ssl = location.protocol === "http:" ? "ws" : "wss";
    var host = location.hostname;
    var port = 1234;
// create socket
  var ws= new WebSocket(ssl + "://" + host + ":" + port);

setInterval(function() {
    if (queue && queue.length > 0 && ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(queue));
        queue = [];
    }
}, 50); // every 50 mills send an update to the server with a new queue

return ws;
}

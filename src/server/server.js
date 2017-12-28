const WebSocket = require('ws');
const fs = require('fs');
const config = require('config');

var server;
if (config.get("ssl.enabled")) {
    server = require('https').createServer({
        key: fs.readFileSync(config.get('ssl.privkey')),
        cert: fs.readFileSync(config.get('ssl.certificate'))
    });
    server.listen(1234);
} else {
    server = require('http').createServer();
    server.listen(1234);
}

const wss = new WebSocket.Server({server: server});

wss.on('connection', function connection(ws, request) {
    ws.on('message', function (msg) {
        onMessage(msg, ws)
    });

    // Ping-Pong Heartbeat
    ws.isAlive = false;
    ws.on('pong', function () {
        ws.isAlive = true;
    });
    ws.ping('', false, true);

    ws.on('error', function () {
        console.log("error!");
        console.log(arguments);
    });
    ws.on('close', function () {
        console.log("Connection lost!");
    });

    onConnect(ws, request);
});

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

function onConnect(client, request) {
    console.log("New connection! IP: " + request.socket.address().address + ":" + request.socket.address().port);
    client.send(JSON.stringify(current_board));
}

var current_board = [{"action": "dimensions", "width": 1366, "height": 768}];

function onMessage(msg, ws) {
    var json = JSON.parse(msg);

    if (Array.isArray(json)) {
        var res = [];
        var changeDims = false;
        for (var i in json) {
            var val = json[i];
            if (val.action === "clear") {
                res.push({"action": "clear"});
                current_board.splice(1);
            } else if (val.action === "line") {
                if (isNaN(val.fromX) || isNaN(val.fromY) || isNaN(val.toX) || isNaN(val.toY) || typeof val.color !== "string")
                    break;

                var map = {
                    "action": "line",
                    "fromX": val.fromX,
                    "fromY": val.fromY,
                    "toX": val.toX,
                    "toY": val.toY,
                    "color": val.color
                };

                res.push(map);
                current_board.push(map);
            } else if (val.action === "dimensions") {
                if (isNaN(val.width) || isNaN(val.height))
                    break;

                changeDims = true;
                var map = {
                    "action": "dimensions",
                    "width": val.width,
                    "height": val.height
                };

                res.push(map);
                current_board[0] = map;
            }
        }
        if (changeDims)
            wss.broadcast(JSON.stringify(current_board));
        else
            wss.broadcast(JSON.stringify(res));
    }
}


// Ping-Pong Heartbeat
const interval = setInterval(function () {
    wss.clients.forEach(function (ws) {
        if (ws.isAlive === false) {
            ws.terminate();
            console.log("Connection lost...");
        }

        ws.isAlive = false;
        ws.ping('', false, true);
    });
}, 1000 * 30); // 30 seconds
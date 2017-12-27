const WebSocket = require('ws');
const fs = require('fs');
const config = require('config');

var server = require('https').createServer({
    key: fs.readFileSync(config.get('ssl.privkey')),
    cert: fs.readFileSync(config.get('ssl.certificate'))});
server.listen(1234);

const wss = new WebSocket.Server({ server: server });

wss.on('connection', function connection(ws, request) {
    ws.on('message', onMessage);

    // Ping-Pong Heartbeat
    ws.isAlive = false;
    ws.on('pong', function(){ws.isAlive = true;});
    ws.ping('', false, true);

    ws.on('error', function(){console.log("error!"); console.log(arguments);});
    ws.on('close', function(){
        console.log("Connection lost!");});

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
}

function onMessage(msg) {
    var json = JSON.parse(msg);

    if (Array.isArray(json)) {
        var res = [];
        for (var i in json) {
            var val = json[i];
            if (isNaN(val.fromX) || isNaN(val.fromY) || isNaN(val.toX) || isNaN(val.toY) || isNaN(val.width) || typeof val.color !== "string")
                break;

            res.push({
                "action": "line",
                "fromX": val.fromX,
                "fromY": val.fromY,
                "toX": val.toX,
                "toY": val.toY,
                "width": val.width,
                "color": val.color
            });
        }
        wss.broadcast(JSON.stringify(res));

    }else {
        if (json.action === "clear")
            wss.broadcast({"action": clear});
        else if (json.action === "line") {
            if (isNaN(json.fromX) || isNaN(json.fromY) || isNaN(json.toX) || isNaN(json.toY) || isNaN(json.width) || typeof json.color !== "string")
                return;

            wss.broadcast(JSON.stringify({
                "action": "line",
                "fromX": json.fromX,
                "fromY": json.fromY,
                "toX": json.toX,
                "toY": json.toY,
                "width": json.width,
                "color": json.color
            }));
        }
    }
}


// Ping-Pong Heartbeat
const interval = setInterval(function() {
    wss.clients.forEach(function(ws) {
        if (ws.isAlive === false) {
            ws.terminate();
            console.log("Connection lost...");
        }

        ws.isAlive = false;
        ws.ping('', false, true);
    });
}, 1000 * 30); // 30 seconds
eval(require('fs').readFileSync('../common/Messages.js', "utf8"));
var ws = create_server(1234, false);
var room = new Room(1000, 1000);

ws.on('connection', function(client, request){
    console.log("NEW CLIENT!");
    client.send(JSON.stringify(room.turn_to_messages()));

    client.on('message', function (text) {
        var data = JSON.parse(text);
        switch (data.action) {
            case "append_path_points":
                var id = data.id;
                room.append_path_points(id, data.points);
                break;

            case "new_path":
                room.add(parse_path(data.path));
            break;

            case "new_dimensions": break;

            case "clear":
                room.clear();
                break;
        }
    });
});

function Room(width, height) {
    this.width = width;
    this.height = height;
    /**
     *
     * @type {Path}
     */
    this.paths = {};

    this.append_path_points = function(id, points) {
        if (this.paths.hasOwnProperty(id))
            this.paths[id].append(points);
        broadcast(Messages.APPEND_PATH(id, points));
    };

    this.turn_to_messages = function() {
        var messages = [
            Messages.NEW_DIMENSIONS(this.width, this.height)
        ];
        for (var id in this.paths) {
            if (this.paths.hasOwnProperty(id))
                messages.push(Messages.NEW_PATH(this.paths[id]));
        }
        return messages;
    };

    this.add = function(path) {
        this.paths[path.id] = path;
        broadcast(Messages.NEW_PATH(path));
    };

    this.clear = function() {
        this.paths = {};
        broadcast(Messages.CLEAR());
    }
}

function Path(id, width, fill, points) {
    this.id = id;
    this.width = width;
    this.fill = fill;
    this.points = points;

    this.to_dictionary = function() {
        return {
            id: this.id,
            width: this.width,
            fill: this.fill,
            points: this.points
        };
    };

    this.append = function(points) {
        this.points = this.points.concat(points);
    };
}

/**
 *
 * @param json object
 * @returns Path|boolean
 */
function parse_path(json) {

    // Make sure everything is real!
    if (!json.hasOwnProperty("id") || isNaN(json.width) || !json.hasOwnProperty("fill") || !Array.isArray(json.points)) {
        console.log("first");
        return false;
    }

    // Make sure each point is real!
    for (var i in json.points) {
        if (json.points.hasOwnProperty(i)) {
            if (!Array.isArray(json.points[i]) || isNaN(json.points[i][0]) || isNaN(json.points[i][1])) {

                console.log(i + " second");
                return false;
            }
        }
    }

    return new Path(json.id, json.width, json.fill, json.points);
}

// Important stuff
/**
 * @param port int
 * @param ssl int
 * @param privkey string path to privkey
 * @param certificate string path to certificate
 * @returns ws.Server
 */
function create_server(port, ssl, privkey, certificate) {
    var server;
    var fs = require('fs');
    if (ssl) {
        server = require('https').createServer({
            key: fs.readFileSync(privkey),
            certificate: fs.readFileSync(certificate)
        });
        server.listen(port);
    }else {
        server = require('http').createServer();
        server.listen(port);
    }

    var ws = require('ws');
    return new ws.Server({server: server});
}

function broadcast(data) {
    if (typeof data !== "string") {
        if (Array.isArray(data))
            data = JSON.stringify(data);
        else
            data = JSON.stringify([data]);
    }

    ws.clients.forEach(function each(client) {
        if (true || client.readyState === ws.OPEN) {//TODO
            client.send(data);
        }
    });
}

/*
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

var current_board = [{"action": "dimensions", "width": 1000, "height": 1000}];

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
*/
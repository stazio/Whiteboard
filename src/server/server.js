var fs = require('fs');
var WebSocket = require('ws');
var config = require('config');

var ws = create_server(1234, config.get('ssl.enabled'), config.get('ssl.privkey'), config.get('ssl.certificate'));

if (fs.existsSync("config/storage.json"))
    var room = JSON.parse(fs.readFileSync("config/storage.json"));
else
    room = {};

var nextPathID = 1;

ws.on('connection', function (client, request) {
    client.request = request;

    client.send(JSON.stringify({
        paths: room,
        type: "room"
    }));

    console.log("[" + client.request.connection.remoteAddress + "]: joined");

    client.on('message', function (text) {
        var json = JSON.parse(text);
        for (var i in json) {
            if (json.hasOwnProperty(i)) {
                var data = json[i];
                switch (data.type) {
                    case "path":
                        if (data.path)
                            process_path(client, data.path);
                        if (data.paths) {
                            for (var ii in data.paths) {
                                if (data.paths.hasOwnProperty(ii))
                                    process_path(client, data.paths[ii]);
                            }
                        }
                        break;
                    case "clear":
                        broadcast({"type": "clear"});
                        room = {};
                        break;
                }
            }
        }
    });

    client.on('close', function () {
        console.log("[" + client.request.connection.remoteAddress + "]: left");
    });

    client.on('error', function (errno, code) {
        console.log("[" + client.request.connection.remoteAddress + "]: has had an error. " + "Error Code: " + code);
    });

    client.on('pong', function () {
        client.isAlive = true
    });
});

function clientErr(client, error) {
    if (error)
        console.log("[" + client.request.connection.remoteAddress + "]: had an error while sending a message! Error: " + error);
}

function process_path(client, path) {
    if (path === "END") {
        if (room[client.activePathID]) {
            room[client.activePathID].push(path);
            sendExcept(client, client.activePathID, path);
        }
        client.activePathID = null;
    } else if (typeof path === "string") {
        client.activePathID = nextPathID++;
        room[client.activePathID] = [path];
        sendExcept(client, client.activePathID, path);
    } else {
        if (room[client.activePathID]) {
            room[client.activePathID].push(path);
            sendExcept(client, client.activePathID, path);
        }
    }
}

function sendExcept(clientt, pathID, path) {
    ws.clients.forEach(function each(client) {
        if (client !== clientt && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                "type": "path",
                "id": pathID,
                "path": path
            }), function (err) {
                clientErr(client, err);
            });
        }
    });
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
    if (ssl) {
        console.log("Starting the server using SSL!");
        console.log("Privilege Key Path" + privkey);
        console.log("Certificate Key Path" + certificate);
        server = require('https').createServer({
            key: fs.readFileSync(privkey),
            cert: fs.readFileSync(certificate)
        });
        server.listen(port);
    } else {
        console.log("Starting the server without SSL! You might wanna fix that maybe?");
        server = require('http').createServer();
        server.listen(port);
    }

    return new WebSocket.Server({server: server});
}

function broadcast(data) {
    ws.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data), function (err) {
                clientErr(client, err);
            });
        }
    });
}

setInterval(function () {
    ws.clients.forEach(function (conn) {
        if (conn.isAlive === false) {
            console.log("[" + conn.request.connection.remoteAddress + "]: timed out");
            conn.terminate();
        }

        conn.isAlive = false;
        conn.ping('', false, true);
    });
}, 10 * 1000); // 10 seconds

setInterval(function () {
    fs.writeFile("config/storage.json", JSON.stringify(room), function (err) {
        if (err)
            console.log("Failed to save room state! Error: " + err);
    });
}, 10 * 1000);
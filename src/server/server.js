let fs = require('fs');
let WebSocket = require('ws');
let config = require('config');
let winston = require('winston');

let ws, room, webserver;
let nextPathID = 1;

if (require.main === module) {
    winston.info("I see you are running me directly! I guess I better turn on eh?");
    initialize();
}else {
    module.exports = {
        containerId: "server",
        initialize: initialize
    }
}


function clientErr(client, error) {
    if (error)
        winston.info("[" + client.request.connection.remoteAddress + "]: had an error while sending a message! Error: " + error);
}

function process_path(client, path) {
    if (path === "END") {
        if (room[client.activePathID]) {
            room[client.activePathID].push(path);
            sendExcept(client, client.activePathID, path);
            client.send(JSON.stringify({'type' : 'path_response'}));
        }
        client.activePathID = null;
    } else if (typeof path === "string") {
        client.activePathID = nextPathID++;
        room[client.activePathID] = [path];
        sendExcept(client, client.activePathID, path);
        client.send(JSON.stringify({'type' : 'path_response', 'path_id' : client.activePathID}));
    } else {
        if (room[client.activePathID]) {
            room[client.activePathID].push(path);
            sendExcept(client, client.activePathID, path);
            client.send(JSON.stringify({'type' : 'path_response', 'path_id' : client.activePathID}));
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
    if (ssl) {
        winston.info("Starting the server using SSL!");
        winston.info("Privilege Key Path" + privkey);
        winston.info("Certificate Key Path" + certificate);
        webserver = require('https').createServer({
            key: fs.readFileSync(privkey),
            cert: fs.readFileSync(certificate)
        });
        webserver = require('http-shutdown')(webserver);
        webserver.listen(port);
    } else {
        winston.info("Starting the server without SSL! You might wanna fix that maybe?");
        webserver = require('http').createServer();
        webserver = require('http-shutdown')(webserver);
        webserver.listen(port);
    }

    return new WebSocket.Server({server: webserver});
}

var numberOfPeople = 0;
function initialize(port, logLevel) {
    if (logLevel !== undefined)
    winston.level = logLevel;
    ws = create_server(port ? port : 1234, config.get('ssl.enabled'), config.get('ssl.privkey'), config.get('ssl.certificate'));

    if (fs.existsSync("config/storage.json"))
        room = JSON.parse(fs.readFileSync("config/storage.json"));
    else
        room = {};

    ws.on('connection', function (client, request) {
        client.request = request;

        client.send(JSON.stringify({
            paths: room,
            type: "room",
            numberOfPeople: ++numberOfPeople
        }));
        broadcast({
            type: 'number_of_people',
            number: numberOfPeople
        });

        winston.info("[" + client.request.connection.remoteAddress + "]: joined");

        client.on('message', function (text) {
            var json = JSON.parse(text);
            if (!Array.isArray(json))
                json = [json];
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

                        case "request_room":
                            winston.info("Sending!");
                            client.send(JSON.stringify({
                                "type" : "room",
                            paths: room}));
                            break;
                    }
                }
            }
        });

        client.on('close', function () {
            winston.info("[" + client.request.connection.remoteAddress + "]: left");
            numberOfPeople--;
            broadcast({
                type: 'number_of_people',
                number: numberOfPeople
            });
        });

        client.on('error', function (errno, code) {
            winston.info("[" + client.request.connection.remoteAddress + "]: has had an error. " + "Error Code: " + code);
        });

        client.on('pong', function () {
            client.isAlive = true
        });
    });

    return config.get('ssl.enabled');
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
            winston.info("[" + conn.request.connection.remoteAddress + "]: timed out");
            conn.terminate();
        }

        conn.isAlive = false;
        conn.ping('', false, true);
    });
}, 10 * 1000); // 10 seconds

setInterval(function () {
    fs.writeFile("config/storage.json", JSON.stringify(room), function (err) {
        if (err)
            winston.info("Failed to save room state! Error: " + err);
    });
}, 10 * 1000);
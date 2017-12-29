var ws = create_server(1234, false);
var room = {};
var nextPathID = 1;

ws.on('connection', function(client, request){
    console.log("NEW CLIENT!");

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
                        broadcast( {"type": "clear"});
                        room = {};
                        break;
                }
            }
        }
    });
});

function process_path(client, path) {
    if (path === "END") {
        if (room[client.activePathID]) {
            room[client.activePathID].push(path);
            sendExcept(client, client.activePathID, path);
        }
        client.activePathID = null;
    }else if (typeof path === "string") {
        client.activePathID = nextPathID++;
        room[client.activePathID] = [path];
        sendExcept(client, client.activePathID, path);
    }else {
        if (room[client.activePathID]) {
            room[client.activePathID].push(path);
            sendExcept(client, client.activePathID, path);
        }
    }
}

function sendExcept(clientt, pathID, path) {
    ws.clients.forEach(function each(client) {
        if (client !== clientt) {//TODO
            client.send(JSON.stringify({
                "type" : "path",
                "id" : pathID,
                "path" : path
            }));
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
    ws.clients.forEach(function each(client) {
        if (true || client.readyState === ws.OPEN) {//TODO
            client.send(JSON.stringify(data));
        }
    });
}

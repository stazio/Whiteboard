eval(require('fs').readFileSync('../common/Messages.js', "utf8"));
var ws = create_server(1234, false);
var room = new Room(1000, 1000, broadcast);


ws.on('connection', function(client, request){
    console.log("NEW CLIENT!");
    client.send(JSON.stringify(room.turn_to_messages()));

    client.on('message', function (text) {
        var json = JSON.parse(text);
        for (var i in json) {
            if (json.hasOwnProperty(i)) {
                var data = json[i];
                switch (data.action) {
                    case "append_path_points":
                        var id = data.id;
                        room.append_path_points(id, data.points);
                        break;

                    case "new_path":
                        room.add(parse_path(data.path));
                        break;

                    case "new_dimensions":
                        break;

                    case "clear":
                        room.clear();
                        break;
                }
            }
        }
    });
});

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

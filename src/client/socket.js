
var ws, wsReadyState = false;

var queu = [];
function queue(val) {
    queu.push(val);
}

function clear() {
    queue({"action" : "clear"});
}

function line(fromX, fromY, toX, toY, color, width) {
    queue({
        "action" : "line",
        "fromX": fromX,
        "fromY": fromY,
        "toX": toX,
        "toY": toY,
        "width" : width,
        "color": color
    });
}

function process(val) {
    if (val.action === "line")
        drawLine(val.fromX, val.fromY, val.toX, val.toY, val.color, val.width);
    else if (val.action === "clear")
        clearScreen();
}

function initWebsockets() {

    var ssl = location.protocol === "http:" ? "ws" : "wss";
    var host = location.hostname;
    var port = 1234;
    ws = new WebSocket(ssl + "://" + host + ":" + port);
    ws.onmessage = function(data) {
        console.log(data);
        var val = JSON.parse(data.data);
        if (Array.isArray(val)) {
            for (var i in val) {
                process(val[i]);
            }
        }else
        process(val);
    };

    ws.onopen = function(){wsReadyState = true;};
    ws.onclose = function(){wsReadyState = false;};
    ws.onerror = function(){console.log("error!"); console.log(arguments);};

    setInterval(function() {
        if (queu.length > 0) {
            ws.send(JSON.stringify(queu));
            queu = [];
        }
    }, 50);
}

initWebsockets();
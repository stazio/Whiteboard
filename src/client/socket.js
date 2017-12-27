var ws, wsReadyState = false;

var queu = [];

function queue(val) {
    queu.push(val);
}

function clear() {
    queue({"action": "clear"});
}

function line(fromX, fromY, toX, toY, color) {
    queue({
        "action": "line",
        "fromX": fromX,
        "fromY": fromY,
        "toX": toX,
        "toY": toY,
        "color": color
    });
}

function newSize(width, height) {
    queue({
        "action": "dimensions",
        "width": width,
        "height": height
    });
}

function process(val) {
    if (val.action === "line")
        drawLine(val.fromX, val.fromY, val.toX, val.toY, val.color);
    else if (val.action === "clear")
        clearScreen();
    else if (val.action === "dimensions")
        setDimensions(val.width, val.height);
}

function initWebsockets() {

    var ssl = location.protocol === "http:" ? "ws" : "wss";
    var host = location.hostname;
    var port = 1234;
    ws = new WebSocket(ssl + "://" + host + ":" + port);
    ws.onmessage = function (data) {
        if (wsReadyState = false && ws.readyState === ws.OPEN){wsReadyState = true; domConnected();}
        console.log(data);
        var val = JSON.parse(data.data);
        if (Array.isArray(val)) {
            for (var i in val) {
                process(val[i]);
            }
        } else
            process(val);
    };

    ws.onopen = function () {
        if (ws.readyState === ws.OPEN){domConnected();}
            wsReadyState = true;
    };
    ws.onclose = function () {
        wsReadyState = false;
    };
    ws.onerror = function () {
        console.log("error!");
        console.log(arguments);
        checkState();
    };

    function checkState() {
        if (ws.readyState === ws.CLOSING || ws.readyState === ws.CLOSED)
            domDisconnect();
    }

    setInterval(function () {
        if (queu.length > 0) {
            ws.send(JSON.stringify(queu));
            checkState();
            queu = [];
        }
    }, 50);
}

function domDisconnect(err) {
    document.getElementById("loading").style.display = "none";

    document.getElementById("error").style.display = "inherit";
    if (err)
        document.getElementById("error").innerHTML = err;
    document.getElementById("buttons").style.display = "none";
}
function domConnected() {
    document.getElementById("loading").style.display = "none";
}

initWebsockets();



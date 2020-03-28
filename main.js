console.log('hello main');
(function() {
    let sf;
    let _wsInstance;
    let isWhite = true;
    let sentMove;
    let movesCounter = 0;
    const move = { t: 'move', d: { u: '', a: 1 } };

    sf = new Worker('assets/_nqpAj6/vendor/stockfish.js/stockfish.wasm.js');
    sf.onmessage = function onmessage({ data }) {
        if (data.indexOf('bestmove') > -1) {
            move.d.u = data.split(' ')[1];
            _wsInstance.send(JSON.stringify(move));
            console.log('move ===> ', JSON.stringify(move));
        }
    };

    function calculate(fen) {
        if (sf !== undefined) {
            const color = isWhite ? 'w' : 'b';
            sf.postMessage(`position fen ${fen} ${color}`);
            sf.postMessage('go ponder');

            setTimeout(function() {
                sf.postMessage('stop');
            }, 500);
        }
    }
    // ========================================================== //

    var OrigWebSocket = window.WebSocket;
    var callWebSocket = OrigWebSocket.apply.bind(OrigWebSocket);
    var wsAddListener = OrigWebSocket.prototype.addEventListener;
    wsAddListener = wsAddListener.call.bind(wsAddListener);
    window.WebSocket = function WebSocket(url, protocols) {
        var ws;
        if (!(this instanceof WebSocket)) {
            // Called without 'new' (browsers will throw an error).
            ws = callWebSocket(this, arguments);
        } else if (arguments.length === 1) {
            ws = new OrigWebSocket(url);
        } else if (arguments.length >= 2) {
            ws = new OrigWebSocket(url, protocols);
        } else {
            // No arguments (browsers will throw an error)
            ws = new OrigWebSocket();
        }

        wsAddListener(ws, 'message', function(event) {
            // TODO: Do something with event.data (received data) if you wish.
            const dataObj = JSON.parse(event.data);
            if (dataObj && dataObj.t === 'move') {
                if (sentMove === undefined) {
                    isWhite = false;
                }
                if (dataObj.d.uci !== sentMove) {
                    calculate(dataObj.d.fen);
                }
                movesCounter++;
                if (movesCounter % 2 === 0) {
                    move.d.a++;
                }
            }
        });
        return ws;
    }.bind();
    window.WebSocket.prototype = OrigWebSocket.prototype;
    window.WebSocket.prototype.constructor = window.WebSocket;

    var wsSend = OrigWebSocket.prototype.send;
    wsSend = wsSend.apply.bind(wsSend);
    OrigWebSocket.prototype.send = function(data) {
        // TODO: Do something with the sent data if you wish.
        const dataObj = JSON.parse(data);
        if (dataObj && dataObj.t === 'move') {
            sentMove = dataObj.d.u;
        }
        _wsInstance = this;
        return wsSend(this, arguments);
    };

    exportFunction(window.WebSocket, window, { defineAs: 'WebSocket' });
    exportFunction(window.WebSocket.prototype.send, window.WebSocket.prototype, { defineAs: 'send' });
})();

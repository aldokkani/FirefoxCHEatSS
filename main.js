console.log('CHEatSS is on!');
(function () {
    let sf;
    let _wsInstance;
    let playerColor = 'w';
    let sentMove;
    let castlingFen = 'KQkq';
    const wCastlingMovies = ['e1h1', 'e1a1'];
    const bCastlingMovies = ['e8h8', 'e8a8'];
    let movesCounter = 1;
    const move = { t: 'move', d: { u: '', a: 0 } };

    sf = new Worker('assets/_nqpAj6/vendor/stockfish.js/stockfish.wasm.js');
    sf.onmessage = function onmessage({ data }) {
        if (data.indexOf('bestmove') > -1) {
            move.d.u = data.split(' ')[1];
            move.d.a = Math.ceil(movesCounter / 2);
            _wsInstance.send(JSON.stringify(move));
            console.log('move ===> ', JSON.stringify(move));
        }
    };

    function calculate({ fen, clock }) {
        if (sf !== undefined) {
            sf.postMessage(`position fen ${fen} ${playerColor} ${castlingFen}`);
            sf.postMessage(`go wtime ${clock.white * 1000} btime ${clock.black * 1000}`);
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

        wsAddListener(ws, 'message', function ({ data }) {
            // TODO: Do something with event.data (received data) if you wish.
            const { t, d } = JSON.parse(data);
            if (t === 'move') {
                if (sentMove === undefined) {
                    playerColor = 'b';
                }
                if (castlingFen.length > 0) {
                    if (wCastlingMovies.includes(d.uci)) {
                        castlingFen = castlingFen.replace('KQ', '');
                    } else if (bCastlingMovies.includes(d.uci)) {
                        castlingFen = castlingFen.replace('kq', '');
                    }
                }
                if (d.uci !== sentMove) {
                    calculate(d);
                }
                movesCounter++;
            }
        });
        return ws;
    }.bind();
    window.WebSocket.prototype = OrigWebSocket.prototype;
    window.WebSocket.prototype.constructor = window.WebSocket;

    var wsSend = OrigWebSocket.prototype.send;
    wsSend = wsSend.apply.bind(wsSend);
    OrigWebSocket.prototype.send = function (data) {
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

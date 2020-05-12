console.log('CHEatSS is on!');
(function () {
    let sf;
    let _wsInstance;
    const PAWNS = ['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', 'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7'];
    const move = { t: 'move', d: { u: '', a: 0 } };
    const variant = ['chess', 'giveaway', 'horde', 'atomic', 'kingofthehill', 'racingkings', '3check', 'crazyhouse'][0];
    let sentMove;
    let enPassant = '-';
    let playerColor = 'w';
    let castlingFen = 'KQkq';
    let movesCounter = 1;

    sf = new Worker('assets/_nqpAj6/vendor/stockfish.js/stockfish.wasm.js');
    sf.postMessage(`setoption name UCI_Variant value ${variant}`);

    sf.onmessage = function onmessage({ data }) {
        if (data.startsWith('info string variant')) console.log(data);
        if (data.indexOf('bestmove') > -1) {
            move.d.u = data.split(' ')[1];
            move.d.a = Math.ceil(movesCounter / 2);
            _wsInstance.send(JSON.stringify(move));
            console.log('move ===> ', JSON.stringify(move));
        }
    };

    function calculate({ fen, clock }) {
        if (sf !== undefined) {
            if (movesCounter < 3) {
                clock.white = clock.black = 15;
            }
            sf.postMessage(`position fen ${fen} ${playerColor} ${castlingFen} ${enPassant}`);
            sf.postMessage(`go wtime ${clock.white * 1000} btime ${clock.black * 1000}`);
        }
    }

    function setEnPassant(move) {
        const index = PAWNS.indexOf(move.slice(0, 2));
        enPassant = '-';
        if (index > -1) {
            PAWNS.splice(index, 1);
            if (Math.abs(move[1] - move[3]) === 2) {
                enPassant = move[0];
                enPassant += move[1] === '2' ? '3' : '6';
            }
        }
    }

    function play(data) {
        const { t, d } = JSON.parse(data);
        if (t === 'move') {
            if (sentMove === undefined) {
                playerColor = 'b';
            }
            setEnPassant(d.uci);
            if (castlingFen.length > 0) {
                if (d.uci.includes('e1')) {
                    castlingFen = castlingFen.replace('KQ', '');
                } else if (d.uci.includes('e8')) {
                    castlingFen = castlingFen.replace('kq', '');
                }
            }
            if (d.uci !== sentMove) {
                calculate(d);
            }
            movesCounter++;
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
            play(data);
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

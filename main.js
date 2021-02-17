console.log('CHEatSS is ' + (sessionStorage.getItem('cheatOff') ? 'off' : 'on'));
(function () {
    const PAWNS = [
        'a2',
        'b2',
        'c2',
        'd2',
        'e2',
        'f2',
        'g2',
        'h2',
        'a7',
        'b7',
        'c7',
        'd7',
        'e7',
        'f7',
        'g7',
        'h7',
    ];
    const PIECES = {
        q: 'queen',
        r: 'rook',
        b: 'bishop',
        n: 'knight',
        p: 'pawn',
    };
    const PIECES_KEYS = {
        queen: 'q',
        rook: 'r',
        bishop: 'b',
        knight: 'n',
        pawn: 'p',
    };
    let sf;
    let _wsInstance;
    let sentMove;
    let playerColor = 'w';
    let movesCounter = 1;

    let pocketFen = '';
    let enPassantFen = '-';
    let castlingFen = 'KQkq';

    let mateOnlyMode = sessionStorage.getItem('mateOnlyMode');
    let foundMate = false;
    let prevMate = '';

    sf = new Worker('assets/_nqpAj6/vendor/stockfish.js/stockfish.wasm.js');
    const variant = sessionStorage.getItem('variant') || 'chess';
    sf.postMessage(`setoption name UCI_Variant value ${variant}`);

    sf.onmessage = function onmessage({ data }) {
        const mateIndex = data.indexOf('mate');
        if (mateIndex !== -1) {
            foundMate = true;
            // let the player knows you found mate..
            const mateIn = data.slice(mateIndex, mateIndex + 7);
            if (prevMate !== mateIn) {
                prevMate = mateIn;
                console.log('Hey!!! found ' + mateIn);
            }
        }
        if (data.startsWith('info string variant')) console.log(data);
        if (data.indexOf('bestmove') !== -1) {
            const move = { t: 'move', d: {} };
            const recommendedMove = data.split(' ')[1];
            if (
                variant === 'crazyhouse' &&
                recommendedMove.indexOf('@') !== -1
            ) {
                const [role, pos] = recommendedMove.split('@');
                move.t = 'drop';
                move.d.role = PIECES[role.toLowerCase()];
                move.d.pos = pos;
            }
            move.d.u = recommendedMove;
            move.d.a = Math.ceil(movesCounter / 2);

            const cheatOff = sessionStorage.getItem('cheatOff');
            if (!cheatOff) {
                if (mateOnlyMode && foundMate) {
                    _wsInstance.send(JSON.stringify(move));
                    console.log('move ===> ', JSON.stringify(move));
                } else if (!mateOnlyMode) {
                    _wsInstance.send(JSON.stringify(move));
                    console.log('move ===> ', JSON.stringify(move));
                }
            }
            console.log('engine status', cheatOff, mateOnlyMode);
        }
    };

    function calculate({ fen, clock }) {
        if (sf !== undefined) {
            if (movesCounter < 3) {
                clock.white = clock.black = 15;
            }
            sf.postMessage(
                `position fen ${fen}${pocketFen} ${playerColor} ${castlingFen} ${enPassantFen}`
            );
            sf.postMessage(
                `go wtime ${clock.white * 1000} btime ${clock.black * 1000}`
            );
        }
    }

    function setEnPassant(move) {
        const index = PAWNS.indexOf(move.slice(0, 2));
        enPassantFen = '-';
        if (index !== -1) {
            PAWNS.splice(index, 1);
            if (Math.abs(move[1] - move[3]) === 2) {
                enPassantFen = move[0];
                enPassantFen += move[1] === '2' ? '3' : '6';
            }
        }
    }

    function createPocket(whitePocket, blackPocket) {
        let tempPocket = '[';
        for (const key in whitePocket) {
            tempPocket += PIECES_KEYS[key]
                .repeat(whitePocket[key])
                .toUpperCase();
        }
        for (const key in blackPocket) {
            tempPocket += PIECES_KEYS[key]
                .repeat(blackPocket[key])
                .toLowerCase();
        }
        tempPocket += ']';
        return tempPocket;
    }

    function play(data) {
        const { t, d } = JSON.parse(data);
        if (t === 'move' || t === 'drop') {
            if (sentMove === undefined) {
                playerColor = 'b';
            }
            if (variant === 'crazyhouse') {
                pocketFen = createPocket(...d.crazyhouse.pockets);
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
        if (dataObj && (dataObj.t === 'move' || dataObj.t === 'drop')) {
            sentMove = dataObj.d.u;
        }
        _wsInstance = this;
        return wsSend(this, arguments);
    };

    exportFunction(window.WebSocket, window, { defineAs: 'WebSocket' });
    exportFunction(
        window.WebSocket.prototype.send,
        window.WebSocket.prototype,
        { defineAs: 'send' }
    );
})();

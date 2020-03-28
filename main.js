console.log('hello main');
(function() {
    let sf;
    
    fetch('https://nmrugg.github.io/kingdom/js/stockfish6.js').then(res => {
        console.log('status ===> ', res.status);
        res.text().then(data => {
            console.log('data ===> ', data.length);
            sf = new Worker(URL.createObjectURL(new Blob([data], { type: 'application/javascript' })));
            sf.onmessage = function onmessage({ data }) {
                if (data.indexOf('bestmove') > -1) {
                    console.log(data);
                }
            };
        });
    });
    function calculate(fen) {
        if (sf !== undefined) {
            sf.postMessage('position fen ' + fen);
            sf.postMessage('go ponder');

            setTimeout(function() {
                sf.postMessage('stop');
            }, 1000);
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
                // console.log('received ====>', dataObj.d);
                calculate(dataObj.d.fen);
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
            // console.log('sent ====>', dataObj);
        }
        return wsSend(this, arguments);
    };

    exportFunction(window.WebSocket, window, { defineAs: 'WebSocket' });
    exportFunction(window.WebSocket.prototype.send, window.WebSocket.prototype, { defineAs: 'send' });
})();

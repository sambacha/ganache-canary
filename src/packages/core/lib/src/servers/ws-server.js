"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _connections;
Object.defineProperty(exports, "__esModule", { value: true });
const websocket_close_codes_1 = __importDefault(require("./utils/websocket-close-codes"));
class WebsocketServer {
    constructor(app, connector, options) {
        _connections.set(this, new Map());
        const connections = __classPrivateFieldGet(this, _connections);
        const wsBinary = options.wsBinary;
        const autoBinary = wsBinary === "auto";
        app.ws(options.rpcEndpoint, {
            /* WS Options */
            maxPayloadLength: 16 * 1024,
            idleTimeout: 120,
            // Note that compression is disabled (the default option)
            // due to not being able to link against electron@12
            // with compression included
            /* Handlers */
            open: (ws) => {
                ws.closed = false;
                connections.set(ws, new Set());
            },
            message: async (ws, message, isBinary) => {
                // We have to use type any instead of ReturnType<typeof connector.parse>
                // on `payload` because Typescript isn't smart enough to understand the
                // ambiguity doesn't actually exist
                let payload;
                const useBinary = autoBinary ? isBinary : wsBinary;
                try {
                    payload = connector.parse(Buffer.from(message));
                }
                catch (err) {
                    const response = connector.formatError(err, payload);
                    ws.send(response, useBinary);
                    return;
                }
                let response;
                try {
                    const { value } = await connector.handle(payload, ws);
                    // The socket may have closed while we were waiting for the response
                    // Don't bother trying to send to it if it was.
                    if (ws.closed)
                        return;
                    const resultEmitter = value;
                    const result = await resultEmitter;
                    if (ws.closed)
                        return;
                    response = connector.format(result, payload);
                    // if the result is an emitter listen to its `"message"` event
                    // We check if `on` is a function rather than check if
                    // `resultEmitter instanceof PromiEvent` because `@ganache/filecoin`
                    // and `ganache` webpack `@ganache/utils` separately. This causes
                    // instanceof to fail here. Since we know `resultEmitter` is MergePromiseT
                    // we can safely assume that if `on` is a function, then we have a PromiEvent
                    if (typeof resultEmitter["on"] === "function") {
                        const resultEmitterPromiEvent = resultEmitter;
                        resultEmitterPromiEvent.on("message", (result) => {
                            // note: we _don't_ need to check if `ws.closed` here because when
                            // `ws.closed` is set we remove this event handler anyway.
                            const message = JSON.stringify({
                                jsonrpc: "2.0",
                                method: result.type,
                                params: result.data
                            });
                            ws.send(message, isBinary);
                        });
                        // keep track of listeners to dispose off when the ws disconnects
                        connections.get(ws).add(resultEmitterPromiEvent.dispose);
                    }
                }
                catch (err) {
                    // ensure the connector's `handle` fn doesn't throw outside of a Promise
                    if (ws.closed)
                        return;
                    response = connector.formatError(err, payload);
                }
                ws.send(response, useBinary);
            },
            drain: (ws) => {
                // This is there so tests can detect if a small amount of backpressure
                // is happening and that things will still work if it does. We actually
                // don't do anything to manage excessive backpressure.
                // TODO: handle back pressure for real!
                // options.logger.log("WebSocket backpressure: " + ws.getBufferedAmount());
            },
            close: (ws) => {
                ws.closed = true;
                connections.get(ws).forEach(dispose => dispose());
                connections.delete(ws);
            }
        });
    }
    close() {
        __classPrivateFieldGet(this, _connections).forEach((_, ws) => ws.end(websocket_close_codes_1.default.CLOSE_NORMAL, "Server closed by client"));
    }
}
exports.default = WebsocketServer;
_connections = new WeakMap();
//# sourceMappingURL=ws-server.js.map
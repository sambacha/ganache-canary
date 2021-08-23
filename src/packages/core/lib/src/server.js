"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _options, _providerOptions, _status, _app_1, _httpServer, _listenSocket_1, _connector, _websocketServer, _initializer;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = exports._DefaultServerOptions = exports.ServerStatus = void 0;
const options_1 = require("./options");
const promise_allsettled_1 = __importDefault(require("promise.allsettled"));
const aggregate_error_1 = __importDefault(require("aggregate-error"));
const uws_js_unofficial_1 = require("@trufflesuite/uws-js-unofficial");
const flavors_1 = require("@ganache/flavors");
const connector_loader_1 = __importDefault(require("./connector-loader"));
const ws_server_1 = __importDefault(require("./servers/ws-server"));
const http_server_1 = __importDefault(require("./servers/http-server"));
const emittery_1 = __importDefault(require("emittery"));
const DEFAULT_HOST = "127.0.0.1";
/**
 * Server ready state constants.
 *
 * These are bit flags. This means that you can check if the status is:
 *  * ready: `status === Status.ready` or `status & Status.ready !== 0`
 *  * opening: `status === Status.opening` or `status & Status.opening !== 0`
 *  * open: `status === Status.open` or `status & Status.open !== 0`
 *  * opening || open: `status & Status.openingOrOpen !== 0` or `status & (Status.opening | Status.open) !== 0`
 *  * closing: `status === Status.closing` or `status & Status.closing !== 0`
 *  * closed: `status === Status.closed` or `status & Status.closed !== 0`
 *  * closing || closed: `status & Status.closingOrClosed !== 0` or `status & (Status.closing | Status.closed) !== 0`
 */
var ServerStatus;
(function (ServerStatus) {
    /**
     * The Server is in an unknown state; perhaps construction didn't succeed
     */
    ServerStatus[ServerStatus["unknown"] = 0] = "unknown";
    /**
     * The Server has been constructed and is ready to be opened.
     */
    ServerStatus[ServerStatus["ready"] = 1] = "ready";
    /**
     * The Server has started to open, but has not yet finished initialization.
     */
    ServerStatus[ServerStatus["opening"] = 2] = "opening";
    /**
     * The Server is open and ready for connection.
     */
    ServerStatus[ServerStatus["open"] = 4] = "open";
    /**
     * The Server is either opening or is already open
     */
    ServerStatus[ServerStatus["openingOrOpen"] = 6] = "openingOrOpen";
    /**
     * The Server is in the process of closing.
     */
    ServerStatus[ServerStatus["closing"] = 8] = "closing";
    /**
     * The Server is closed and not accepting new connections.
     */
    ServerStatus[ServerStatus["closed"] = 16] = "closed";
    /**
     * The Server is either opening or is already open
     */
    ServerStatus[ServerStatus["closingOrClosed"] = 24] = "closingOrClosed";
})(ServerStatus = exports.ServerStatus || (exports.ServerStatus = {}));
/**
 * For private use. May change in the future.
 * I don't don't think these options should be held in this `core` package.
 * @ignore
 */
exports._DefaultServerOptions = options_1.serverDefaults;
/**
 * @public
 */
class Server extends emittery_1.default {
    constructor(providerAndServerOptions = {
        flavor: flavors_1.DefaultFlavor
    }) {
        super();
        _options.set(this, void 0);
        _providerOptions.set(this, void 0);
        _status.set(this, ServerStatus.unknown);
        _app_1.set(this, null);
        _httpServer.set(this, null);
        _listenSocket_1.set(this, null);
        _connector.set(this, void 0);
        _websocketServer.set(this, null);
        _initializer.set(this, void 0);
        __classPrivateFieldSet(this, _options, options_1.serverOptionsConfig.normalize(providerAndServerOptions));
        __classPrivateFieldSet(this, _providerOptions, providerAndServerOptions);
        __classPrivateFieldSet(this, _status, ServerStatus.ready);
        // we need to start initializing now because `initialize` sets the
        // `provider` property... and someone might want to do:
        //   const server = Ganache.server();
        //   const provider = server.provider;
        //   await server.listen(8545)
        const connector = (__classPrivateFieldSet(this, _connector, connector_loader_1.default.initialize(__classPrivateFieldGet(this, _providerOptions))));
        __classPrivateFieldSet(this, _initializer, this.initialize(connector));
    }
    get provider() {
        return __classPrivateFieldGet(this, _connector).provider;
    }
    get status() {
        return __classPrivateFieldGet(this, _status);
    }
    async initialize(connector) {
        const _app = (__classPrivateFieldSet(this, _app_1, uws_js_unofficial_1.App()));
        if (__classPrivateFieldGet(this, _options).server.ws) {
            __classPrivateFieldSet(this, _websocketServer, new ws_server_1.default(_app, connector, __classPrivateFieldGet(this, _options).server));
        }
        __classPrivateFieldSet(this, _httpServer, new http_server_1.default(_app, connector, __classPrivateFieldGet(this, _options).server));
        await connector.once("ready");
    }
    listen(port, host, callback) {
        let hostname = null;
        if (typeof host === "function") {
            callback = host;
            hostname = null;
        }
        const callbackIsFunction = typeof callback === "function";
        const status = __classPrivateFieldGet(this, _status);
        if (status === ServerStatus.closing) {
            // if closing
            const err = new Error(`Cannot start server while it is closing.`);
            return callbackIsFunction
                ? process.nextTick(callback, err)
                : Promise.reject(err);
        }
        else if ((status & ServerStatus.openingOrOpen) !== 0) {
            // if opening or open
            const err = new Error(`Server is already open, or is opening, on port: ${port}.`);
            return callbackIsFunction
                ? process.nextTick(callback, err)
                : Promise.reject(err);
        }
        __classPrivateFieldSet(this, _status, ServerStatus.opening);
        const initializePromise = __classPrivateFieldGet(this, _initializer);
        // This `shim()` is necessary for `Promise.allSettled` to be shimmed
        // in `node@10`. We cannot use `allSettled([...])` directly due to
        // https://github.com/es-shims/Promise.allSettled/issues/5 without
        // upgrading Typescript. TODO: if Typescript is upgraded to 4.2.3+
        // then this line could be removed and `Promise.allSettled` below
        // could replaced with `allSettled`.
        promise_allsettled_1.default.shim();
        const promise = Promise.allSettled([
            initializePromise,
            new Promise((resolve) => {
                // Make sure we have *exclusive* use of this port.
                // https://github.com/uNetworking/uSockets/commit/04295b9730a4d413895fa3b151a7337797dcb91f#diff-79a34a07b0945668e00f805838601c11R51
                const LIBUS_LISTEN_EXCLUSIVE_PORT = 1;
                hostname
                    ? __classPrivateFieldGet(this, _app_1).listen(hostname, port, LIBUS_LISTEN_EXCLUSIVE_PORT, resolve)
                    : __classPrivateFieldGet(this, _app_1).listen(port, LIBUS_LISTEN_EXCLUSIVE_PORT, resolve);
            }).then(listenSocket => {
                if (listenSocket) {
                    __classPrivateFieldSet(this, _status, ServerStatus.open);
                    __classPrivateFieldSet(this, _listenSocket_1, listenSocket);
                }
                else {
                    __classPrivateFieldSet(this, _status, ServerStatus.closed);
                    const err = new Error(`listen EADDRINUSE: address already in use ${hostname || DEFAULT_HOST}:${port}.`);
                    throw err;
                }
            })
        ]).then(async (promiseResults) => {
            const errors = [];
            if (promiseResults[0].status === "rejected") {
                errors.push(promiseResults[0].reason);
            }
            if (promiseResults[1].status === "rejected") {
                errors.push(promiseResults[1].reason);
            }
            if (errors.length === 0) {
                this.emit("open");
            }
            else {
                __classPrivateFieldSet(this, _status, ServerStatus.unknown);
                try {
                    await this.close();
                }
                catch (e) {
                    errors.push(e);
                }
                if (errors.length > 1) {
                    throw new aggregate_error_1.default(errors);
                }
                else {
                    throw errors[0];
                }
            }
        });
        if (callbackIsFunction) {
            promise.then(() => callback(null)).catch(callback);
        }
        else {
            return promise;
        }
    }
    async close() {
        if (__classPrivateFieldGet(this, _status) === ServerStatus.opening) {
            // if opening
            throw new Error(`Cannot close server while it is opening.`);
        }
        else if ((__classPrivateFieldGet(this, _status) & ServerStatus.closingOrClosed) !== 0) {
            // if closing or closed
            throw new Error(`Server is already closing or closed.`);
        }
        __classPrivateFieldSet(this, _status, ServerStatus.closing);
        // clean up the websocket objects
        const _listenSocket = __classPrivateFieldGet(this, _listenSocket_1);
        __classPrivateFieldSet(this, _listenSocket_1, null);
        // close the socket to prevent any more connections
        if (_listenSocket !== null) {
            uws_js_unofficial_1.us_listen_socket_close(_listenSocket);
        }
        // close all the connected websockets:
        if (__classPrivateFieldGet(this, _websocketServer) !== null) {
            __classPrivateFieldGet(this, _websocketServer).close();
        }
        // and do all http cleanup, if any
        if (__classPrivateFieldGet(this, _httpServer) !== null) {
            __classPrivateFieldGet(this, _httpServer).close();
        }
        // cleanup the connector, provider, etc.
        if (__classPrivateFieldGet(this, _connector) !== null) {
            await __classPrivateFieldGet(this, _connector).close();
        }
        __classPrivateFieldSet(this, _status, ServerStatus.closed);
        __classPrivateFieldSet(this, _app_1, null);
        await this.emit("close");
    }
}
exports.Server = Server;
_options = new WeakMap(), _providerOptions = new WeakMap(), _status = new WeakMap(), _app_1 = new WeakMap(), _httpServer = new WeakMap(), _listenSocket_1 = new WeakMap(), _connector = new WeakMap(), _websocketServer = new WeakMap(), _initializer = new WeakMap();
exports.default = Server;
//# sourceMappingURL=server.js.map
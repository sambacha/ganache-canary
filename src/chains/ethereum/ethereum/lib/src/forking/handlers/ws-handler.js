"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsHandler = void 0;
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const ws_1 = __importDefault(require("ws"));
const base_handler_1 = require("./base-handler");
const deferred_1 = __importDefault(require("../deferred"));
class WsHandler extends base_handler_1.BaseHandler {
    constructor(options, abortSignal) {
        super(options, abortSignal);
        this.inFlightRequests = new Map();
        const { url, origin } = options.fork;
        this.connection = new ws_1.default(url.toString(), {
            origin,
            headers: this.headers
        });
        this.open = this.connect(this.connection);
        this.connection.onclose = () => {
            // try to connect again...
            // TODO: backoff and eventually fail
            this.open = this.connect(this.connection);
        };
        this.abortSignal.addEventListener("abort", () => {
            this.connection.onclose = null;
            this.connection.close(1000);
        });
        this.connection.onmessage = this.onMessage.bind(this);
    }
    async request(method, params) {
        await this.open;
        if (this.abortSignal.aborted)
            return Promise.reject(new ethereum_utils_1.AbortError());
        const data = JSON.stringify({ method, params });
        if (this.requestCache.has(data)) {
            //console.log("cache hit: " + data);
            return this.requestCache.get(data);
        }
        const send = () => {
            if (this.abortSignal.aborted)
                return Promise.reject(new ethereum_utils_1.AbortError());
            //console.log("sending request: " + data);
            const messageId = this.id++;
            const deferred = deferred_1.default();
            // TODO: timeout an in-flight request after some amount of time
            this.inFlightRequests.set(messageId, deferred);
            this.connection.send(base_handler_1.BaseHandler.JSONRPC_PREFIX + messageId + `,${data.slice(1)}`);
            return deferred.promise.finally(() => this.requestCache.delete(data));
        };
        const promise = this.limiter.handle(send).then(result => {
            if (this.abortSignal.aborted)
                return Promise.reject(new ethereum_utils_1.AbortError());
            if ("result" in result) {
                return result.result;
            }
            else if ("error" in result) {
                throw result.error;
            }
        });
        this.requestCache.set(data, promise);
        return promise;
    }
    onMessage(event) {
        if (event.type !== "message")
            return;
        // TODO: handle invalid JSON (throws on parse)?
        const result = JSON.parse(event.data);
        const id = result.id;
        const prom = this.inFlightRequests.get(id);
        if (prom) {
            this.inFlightRequests.delete(id);
            prom.resolve(result);
        }
    }
    connect(connection) {
        let open = new Promise((resolve, reject) => {
            connection.onopen = resolve;
            connection.onerror = reject;
        });
        open.then(() => {
            connection.onopen = null;
            connection.onerror = null;
        }, err => {
            console.log(err);
        });
        return open;
    }
    close() {
        this.connection.close();
        return Promise.resolve();
    }
}
exports.WsHandler = WsHandler;
//# sourceMappingURL=ws-handler.js.map
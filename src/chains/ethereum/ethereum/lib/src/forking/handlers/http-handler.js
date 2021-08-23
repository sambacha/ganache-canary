"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpHandler = void 0;
const ethereum_utils_1 = require("@ganache/ethereum-utils");
// TODO: support http2
const http_1 = __importStar(require("http"));
const https_1 = __importStar(require("https"));
const base_handler_1 = require("./base-handler");
const deferred_1 = __importDefault(require("../deferred"));
const { JSONRPC_PREFIX } = base_handler_1.BaseHandler;
class HttpHandler extends base_handler_1.BaseHandler {
    constructor(options, abortSignal) {
        super(options, abortSignal);
        this.url = options.fork.url;
        this.headers.accept = this.headers["content-type"] = "application/json";
        if (this.url.protocol === "http:") {
            this._request = http_1.default.request;
            this.agent = new http_1.Agent({
                keepAlive: true,
                scheduling: "fifo"
            });
        }
        else {
            this._request = https_1.default.request;
            this.agent = new https_1.Agent({
                keepAlive: true,
                scheduling: "fifo"
            });
        }
    }
    handleLengthedResponse(res, length) {
        let buffer = Buffer.allocUnsafe(length);
        let offset = 0;
        return new Promise((resolve, reject) => {
            function data(message) {
                const messageLength = message.length;
                // note: Node will NOT send us more data than the content-length header
                // denotes, so we don't have to worry about it.
                message.copy(buffer, offset, 0, messageLength);
                offset += messageLength;
            }
            function end() {
                // note: Node doesn't check if the content-length matches, so we do that
                // here
                if (offset !== buffer.length) {
                    // if we didn't receive enough data, throw
                    reject(new Error("content-length mismatch"));
                }
                else {
                    resolve(buffer);
                }
            }
            res.on("data", data);
            res.on("end", end);
        });
    }
    handleChunkedResponse(res) {
        let buffer;
        return new Promise(resolve => {
            res.on("data", (message) => {
                const chunk = message;
                if (buffer) {
                    buffer = Buffer.concat([buffer, chunk], buffer.length + chunk.length);
                }
                else {
                    buffer = Buffer.concat([chunk], chunk.length);
                }
            });
            res.on("end", () => {
                resolve(buffer);
            });
        });
    }
    async request(method, params) {
        const data = JSON.stringify({ method, params });
        if (this.requestCache.has(data)) {
            //console.log("cache hit: " + data);
            return this.requestCache.get(data);
        }
        const { protocol, hostname: host, port, pathname, search } = this.url;
        const requestOptions = {
            protocol,
            host,
            port,
            path: pathname + search,
            headers: this.headers,
            method: "POST",
            agent: this.agent,
            // Node v15 supports AbortSignals directly
            signal: this.abortSignal
        };
        const send = () => {
            if (this.abortSignal.aborted)
                return Promise.reject(new ethereum_utils_1.AbortError());
            //console.log("sending request: " + data);
            const deferred = deferred_1.default();
            const postData = `${JSONRPC_PREFIX}${this.id++},${data.slice(1)}`;
            this.headers["content-length"] = postData.length;
            const req = this._request(requestOptions);
            req.on("response", res => {
                const { headers } = res;
                let buffer;
                // if we have a transfer-encoding we don't care about "content-length"
                // (per HTTP spec). We also don't care about invalid lengths
                if ("transfer-encoding" in headers) {
                    buffer = this.handleChunkedResponse(res);
                }
                else {
                    const length = headers["content-length"] / 1;
                    if (isNaN(length) || length <= 0) {
                        buffer = this.handleChunkedResponse(res);
                    }
                    else {
                        // we have a content-length; use it to pre-allocate the required memory
                        buffer = this.handleLengthedResponse(res, length);
                    }
                }
                // TODO: handle invalid JSON (throws on parse)?
                buffer.then(buffer => {
                    try {
                        deferred.resolve(JSON.parse(buffer));
                    }
                    catch {
                        const resStr = buffer.toString();
                        let shortStr;
                        if (resStr.length > 340) {
                            // truncate long errors so we don't blow up the user's logs
                            shortStr = resStr.slice(0, 320) + "…";
                        }
                        else {
                            shortStr = resStr;
                        }
                        let msg = `Invalid JSON response from fork provider:\n\n ${shortStr}`;
                        if ((resStr.startsWith("invalid project id") ||
                            resStr.startsWith("project id required in the url")) &&
                            this.url.host.endsWith("infura.io")) {
                            msg += `\n\nThe provided fork url, ${this.url}, may be an invalid or incorrect Infura endpoint.`;
                            msg += `\nVisit https://infura.io/docs/ethereum for Infura documentation.`;
                        }
                        deferred.reject(new Error(msg));
                    }
                });
            });
            // after 5 seconds of idle abort the request
            req.setTimeout(5000, req.abort.bind(req, null));
            req.on("error", deferred.reject);
            req.write(postData);
            req.end();
            return deferred.promise.finally(() => this.requestCache.delete(data));
        };
        const promise = this.limiter.handle(send).then(result => {
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
    close() {
        // no op
        return Promise.resolve();
    }
}
exports.HttpHandler = HttpHandler;
//# sourceMappingURL=http-handler.js.map
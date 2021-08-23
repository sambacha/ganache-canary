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
var _connector, _handlePost, _handleOptions;
Object.defineProperty(exports, "__esModule", { value: true });
const content_types_1 = __importDefault(require("./utils/content-types"));
const http_response_codes_1 = __importDefault(require("./utils/http-response-codes"));
const noop = () => { };
/**
 * uWS doesn't let us use the request after the request method has completed.
 * But we can't set headers until after the statusCode is set. But we don't
 * know the status code until the provider returns asynchronously.
 * So this does request-related work immediately and returns a function to do the
 * rest of the work later.
 * @param method
 * @param request
 */
function prepareCORSResponseHeaders(method, request) {
    // https://fetch.spec.whatwg.org/#http-requests
    const origin = request.getHeader("origin");
    const acrh = request.getHeader("access-control-request-headers");
    return (response) => {
        const isCORSRequest = origin !== "";
        if (isCORSRequest) {
            // OPTIONS preflight requests need a little extra treatment
            if (method === "OPTIONS") {
                // we only allow POST requests, so it doesn't matter which method the request is asking for
                response.writeHeader("Access-Control-Allow-Methods", "POST");
                // echo all requested access-control-request-headers back to the response
                if (acrh !== "") {
                    response.writeHeader("Access-Control-Allow-Headers", acrh);
                }
                // Make browsers and compliant clients cache the OPTIONS preflight response for 10
                // minutes (this is the maximum time Chromium allows)
                response.writeHeader("Access-Control-Max-Age", "600"); // seconds
            }
            // From the spec: https://fetch.spec.whatwg.org/#http-responses
            // "For a CORS-preflight request, request’s credentials mode is always "omit",
            // but for any subsequent CORS requests it might not be. Support therefore
            // needs to be indicated as part of the HTTP response to the CORS-preflight request as well.", so this
            // header is added to all requests.
            // Additionally, https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials,
            // states that there aren't any HTTP Request headers that indicate you whether or not Request.withCredentials
            // is set. Because web3@1.0.0-beta.35-? always sets `request.withCredentials = true` while Safari requires it be
            // returned even when no credentials are set in the browser this header must always be return on all requests.
            // (I've found that Chrome and Firefox don't actually require the header when credentials aren't set)
            //  Regression Commit: https://github.com/ethereum/web3.js/pull/1722
            //  Open Web3 Issue: https://github.com/ethereum/web3.js/issues/1802
            response.writeHeader("Access-Control-Allow-Credentials", "true");
            // From the spec: "It cannot be reliably identified as participating in the CORS protocol
            // as the `Origin` header is also included for all requests whose method is neither
            // `GET` nor `HEAD`."
            // Explicitly set the origin instead of using *, since credentials
            // can't be used in conjunction with *. This will always be set
            /// for valid preflight requests.
            response.writeHeader("Access-Control-Allow-Origin", origin);
        }
    };
}
function sendResponse(response, statusCode, contentType, data, writeHeaders = noop) {
    response.cork(() => {
        response.writeStatus(statusCode);
        writeHeaders(response);
        if (contentType) {
            response.writeHeader("Content-Type", contentType);
        }
        response.end(data);
    });
}
class HttpServer {
    constructor(app, connector, options) {
        _connector.set(this, void 0);
        _handlePost.set(this, (response, request) => {
            // handle JSONRPC post requests...
            const writeHeaders = prepareCORSResponseHeaders("POST", request);
            // TODO(perf): pre-allocate the buffer if we know the Content-Length
            let buffer;
            let aborted = false;
            response.onAborted(() => {
                aborted = true;
            });
            response.onData((message, isLast) => {
                const chunk = Buffer.from(message);
                if (isLast) {
                    // we have to use any here because typescript isn't smart enough
                    // to understand the ambiguity of RequestFormat and ReturnType
                    // on the Connector interface must match up appropriately
                    const connector = __classPrivateFieldGet(this, _connector);
                    let payload;
                    try {
                        const message = buffer
                            ? Buffer.concat([buffer, chunk], buffer.length + chunk.length)
                            : chunk;
                        payload = connector.parse(message);
                    }
                    catch (e) {
                        sendResponse(response, http_response_codes_1.default.BAD_REQUEST, content_types_1.default.PLAIN, "400 Bad Request: " + e.message, writeHeaders);
                        return;
                    }
                    connector
                        .handle(payload, request)
                        .then(({ value }) => value)
                        .then(result => {
                        if (aborted) {
                            // if the request has been aborted don't try sending (it'll
                            // cause an `Unhandled promise rejection` if we try)
                            return;
                        }
                        const data = connector.format(result, payload);
                        sendResponse(response, http_response_codes_1.default.OK, content_types_1.default.JSON, data, writeHeaders);
                    })
                        .catch(error => {
                        if (aborted) {
                            // if the request has been aborted don't try sending (it'll
                            // cause an `Unhandled promise rejection` if we try)
                            return;
                        }
                        const data = connector.formatError(error, payload);
                        sendResponse(response, http_response_codes_1.default.OK, content_types_1.default.JSON, data, writeHeaders);
                    });
                }
                else {
                    if (buffer) {
                        buffer = Buffer.concat([buffer, chunk], buffer.length + chunk.length);
                    }
                    else {
                        buffer = Buffer.concat([chunk], chunk.length);
                    }
                }
            });
        });
        _handleOptions.set(this, (response, request) => {
            // handle CORS preflight requests...
            const writeHeaders = prepareCORSResponseHeaders("OPTIONS", request);
            // OPTIONS responses don't have a body, so respond with `204 No Content`...
            sendResponse(response, http_response_codes_1.default.NO_CONTENT, void 0, "", writeHeaders);
        });
        __classPrivateFieldSet(this, _connector, connector);
        // JSON-RPC routes...
        app
            .post(options.rpcEndpoint, __classPrivateFieldGet(this, _handlePost))
            .options(options.rpcEndpoint, __classPrivateFieldGet(this, _handleOptions));
        // because Easter Eggs are fun...
        app.get("/418", response => {
            sendResponse(response, http_response_codes_1.default.IM_A_TEAPOT, content_types_1.default.PLAIN, "418 I'm a teapot");
        });
        // fallback routes...
        app.any("/*", (response, request) => {
            const connectionHeader = request.getHeader("connection");
            if (connectionHeader && connectionHeader.toLowerCase() === "upgrade") {
                // if we got here it means the websocket server wasn't enabled but
                // a client tried to connect via websocket. This is a Bad Request.
                sendResponse(response, http_response_codes_1.default.BAD_REQUEST, content_types_1.default.PLAIN, "400 Bad Request");
            }
            else {
                // all other requests don't mean anything to us, so respond with `404 NOT FOUND`...
                sendResponse(response, http_response_codes_1.default.NOT_FOUND, content_types_1.default.PLAIN, "404 Not Found");
            }
        });
    }
    close() {
        // currently a no op.
    }
}
exports.default = HttpServer;
_connector = new WeakMap(), _handlePost = new WeakMap(), _handleOptions = new WeakMap();
//# sourceMappingURL=http-server.js.map
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
var _provider, _handle;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connector = exports.Provider = void 0;
const emittery_1 = __importDefault(require("emittery"));
const utils_1 = require("@ganache/utils");
const provider_1 = __importDefault(require("./provider"));
const ethereum_utils_1 = require("@ganache/ethereum-utils");
exports.Provider = provider_1.default;
function isHttp(connection) {
    return (connection.constructor.name === "uWS.HttpRequest" ||
        connection.constructor.name === "HttpRequest");
}
class Connector extends emittery_1.default.Typed {
    constructor(providerOptions = null, executor) {
        super();
        _provider.set(this, void 0);
        _handle.set(this, (payload, connection) => {
            const method = payload.method;
            if (method === "eth_subscribe") {
                if (isHttp(connection)) {
                    return Promise.reject(new ethereum_utils_1.CodedError("notifications not supported", utils_1.JsonRpcErrorCode.METHOD_NOT_SUPPORTED));
                }
            }
            const params = payload.params;
            return __classPrivateFieldGet(this, _provider)._requestRaw({ method, params });
        });
        __classPrivateFieldSet(this, _provider, new provider_1.default(providerOptions, executor));
    }
    get provider() {
        return __classPrivateFieldGet(this, _provider);
    }
    async connect() {
        await __classPrivateFieldGet(this, _provider).initialize();
        // no need to wait for #provider.once("connect") as the initialize()
        // promise has already accounted for that after the promise is resolved
        await this.emit("ready");
    }
    parse(message) {
        try {
            return JSON.parse(message);
        }
        catch (e) {
            throw new ethereum_utils_1.CodedError(e.message, utils_1.JsonRpcErrorCode.PARSE_ERROR);
        }
    }
    handle(payload, connection) {
        if (Array.isArray(payload)) {
            // handle batch transactions
            const promises = payload.map(payload => __classPrivateFieldGet(this, _handle).call(this, payload, connection)
                .then(({ value }) => value)
                .catch(e => e));
            return Promise.resolve({ value: Promise.all(promises) });
        }
        else {
            return __classPrivateFieldGet(this, _handle).call(this, payload, connection);
        }
    }
    format(results, payload) {
        if (Array.isArray(payload)) {
            return JSON.stringify(payload.map((payload, i) => {
                const result = results[i];
                if (result instanceof Error) {
                    return utils_1.makeError(payload.id, result);
                }
                else {
                    return utils_1.makeResponse(payload.id, result);
                }
            }));
        }
        else {
            const json = utils_1.makeResponse(payload.id, results);
            return JSON.stringify(json);
        }
    }
    formatError(error, payload) {
        const json = utils_1.makeError(payload && payload.id ? payload.id : null, error);
        return JSON.stringify(json);
    }
    close() {
        return __classPrivateFieldGet(this, _provider).disconnect();
    }
}
exports.Connector = Connector;
_provider = new WeakMap(), _handle = new WeakMap();
//# sourceMappingURL=connector.js.map
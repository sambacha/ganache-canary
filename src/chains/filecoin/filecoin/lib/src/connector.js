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
var _provider;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connector = exports.Provider = exports.StorageDealStatus = void 0;
const emittery_1 = __importDefault(require("emittery"));
const utils_1 = require("@ganache/utils");
const provider_1 = __importDefault(require("./provider"));
var storage_deal_status_1 = require("./types/storage-deal-status");
Object.defineProperty(exports, "StorageDealStatus", { enumerable: true, get: function () { return storage_deal_status_1.StorageDealStatus; } });
exports.Provider = provider_1.default;
class Connector extends emittery_1.default.Typed {
    constructor(providerOptions = {}, executor) {
        super();
        _provider.set(this, void 0);
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
        return JSON.parse(message);
    }
    handle(payload, _connection) {
        return __classPrivateFieldGet(this, _provider)._requestRaw(payload);
    }
    format(result, payload) {
        const json = utils_1.makeResponse(payload.id, result);
        return JSON.stringify(json);
    }
    formatError(error, payload) {
        const json = utils_1.makeError(payload && payload.id ? payload.id : undefined, error);
        return JSON.stringify(json);
    }
    async close() {
        return await __classPrivateFieldGet(this, _provider).stop();
    }
}
exports.Connector = Connector;
_provider = new WeakMap();
//# sourceMappingURL=connector.js.map
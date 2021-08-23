"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _api;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TezosConnector = exports.TezosProvider = void 0;
const emittery_1 = __importDefault(require("emittery"));
const provider_1 = __importDefault(require("./src/provider"));
const api_1 = __importDefault(require("./src/api"));
exports.TezosProvider = provider_1.default;
class TezosConnector extends emittery_1.default.Typed {
    constructor(providerOptions, requestCoordinator) {
        super();
        _api.set(this, void 0);
        const api = (__classPrivateFieldSet(this, _api, new api_1.default()));
        this.provider = new provider_1.default(providerOptions);
    }
    async connect() { }
    format(result) {
        return JSON.stringify(result);
    }
    formatError(error) {
        return JSON.stringify(error);
    }
    parse(message) {
        return JSON.parse(message);
    }
    handle(payload, _connection) {
        return Promise.resolve(123);
    }
    close() {
        return {};
    }
}
exports.TezosConnector = TezosConnector;
_api = new WeakMap();
//# sourceMappingURL=index.js.map
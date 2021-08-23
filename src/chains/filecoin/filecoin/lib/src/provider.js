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
var _options, _api, _executor;
Object.defineProperty(exports, "__esModule", { value: true });
const emittery_1 = __importDefault(require("emittery"));
const utils_1 = require("@ganache/utils");
const api_1 = __importDefault(require("./api"));
const schema_1 = __importDefault(require("./schema"));
const blockchain_1 = __importDefault(require("./blockchain"));
const filecoin_options_1 = require("@ganache/filecoin-options");
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
// Meant to mimic this provider:
// https://github.com/filecoin-shipyard/js-lotus-client-provider-browser
class FilecoinProvider extends emittery_1.default.Typed {
    constructor(options = {}, executor) {
        super();
        _options.set(this, void 0);
        _api.set(this, void 0);
        _executor.set(this, void 0);
        const providerOptions = (__classPrivateFieldSet(this, _options, filecoin_options_1.FilecoinOptionsConfig.normalize(options)));
        __classPrivateFieldSet(this, _executor, executor);
        this.blockchain = new blockchain_1.default(providerOptions);
        __classPrivateFieldSet(this, _api, new api_1.default(this.blockchain));
    }
    async initialize() {
        await __classPrivateFieldGet(this, _api).initialize();
        await this.emit("connect");
    }
    /**
     * Returns the options, including defaults and generated, used to start Ganache.
     */
    getOptions() {
        return lodash_clonedeep_1.default(__classPrivateFieldGet(this, _options));
    }
    /**
     * Returns the unlocked accounts
     */
    async getInitialAccounts() {
        await this.blockchain.waitForReady();
        const accounts = {};
        const controllableAccounts = await this.blockchain.accountManager.getControllableAccounts();
        for (const account of controllableAccounts) {
            accounts[account.address.serialize()] = {
                unlocked: true,
                secretKey: account.address.privateKey,
                balance: account.balance.value
            };
        }
        return accounts;
    }
    async connect() {
        await this.blockchain.waitForReady();
    }
    async send(payload) {
        const result = await this._requestRaw(payload);
        return result.value;
    }
    async _requestRaw(payload) {
        // The `as any` is needed here because of this hackery of appending the
        // JSON `id` no longer fits within the strictly typed `execute` `params`
        // argument
        const result = await __classPrivateFieldGet(this, _executor).execute(__classPrivateFieldGet(this, _api), payload.method, [
            ...(payload.params || []),
            payload.id
        ]);
        const promise = result.value;
        if (promise instanceof utils_1.PromiEvent) {
            promise.on("message", data => {
                this.emit("message", data);
            });
            const value = await promise;
            if (typeof value === "object" &&
                typeof value.unsubscribe === "function") {
                // since the class instance gets ripped away,
                // we can't use instanceof Subscription, so we
                // just use an interface and check for the unsubscribe
                // function 🤷
                const newPromiEvent = utils_1.PromiEvent.resolve(value.id);
                promise.on("message", data => {
                    newPromiEvent.emit("message", data);
                });
                return { value: newPromiEvent };
            }
        }
        return { value: promise };
    }
    async sendHttp() {
        throw new Error("Method not supported (sendHttp)");
    }
    async sendWs() {
        throw new Error("Method not supported (sendWs)");
    }
    // Reference implementation: https://git.io/JtO3H
    async sendSubscription(payload, schemaMethod, subscriptionCallback) {
        // I'm not entirely sure why I need the `as [string]`... but it seems to work.
        const result = await __classPrivateFieldGet(this, _executor).execute(__classPrivateFieldGet(this, _api), payload.method, [
            ...(payload.params || []),
            payload.id
        ]);
        const promiEvent = result.value;
        if (promiEvent instanceof utils_1.PromiEvent) {
            promiEvent.on("message", data => {
                subscriptionCallback(data);
            });
        }
        const value = await promiEvent;
        return [value.unsubscribe, Promise.resolve(value.id.toString())];
    }
    async receive() {
        throw new Error("Method not supported (receive)");
    }
    async import() {
        throw new Error("Method not supported (import)");
    }
    async destroy() {
        throw new Error("Method not supported (destroy)");
    }
    async stop() {
        await __classPrivateFieldGet(this, _api).stop();
    }
}
exports.default = FilecoinProvider;
_options = new WeakMap(), _api = new WeakMap(), _executor = new WeakMap();
FilecoinProvider.Schema = schema_1.default;
//# sourceMappingURL=provider.js.map
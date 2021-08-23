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
var _options, _api, _executor, _wallet, _blockchain, _send, _logRequest, _legacySendPayloads, _legacySendPayload;
Object.defineProperty(exports, "__esModule", { value: true });
const emittery_1 = __importDefault(require("emittery"));
const api_1 = __importDefault(require("./api"));
const utils_1 = require("@ganache/utils");
const ethereum_options_1 = require("@ganache/ethereum-options");
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
const wallet_1 = __importDefault(require("./wallet"));
const blockchain_1 = __importDefault(require("./blockchain"));
const fork_1 = require("./forking/fork");
const ethereum_address_1 = require("@ganache/ethereum-address");
function parseCoinbase(coinbase, initialAccounts) {
    switch (typeof coinbase) {
        case "object":
            return coinbase;
        case "number":
            const account = initialAccounts[coinbase];
            if (account) {
                return account.address;
            }
            else {
                throw new Error(`invalid coinbase address index: ${coinbase}`);
            }
        case "string":
            return ethereum_address_1.Address.from(coinbase);
        default: {
            throw new Error(`coinbase address must be string or number, received: ${coinbase}`);
        }
    }
}
class EthereumProvider extends emittery_1.default.Typed {
    constructor(options = {}, executor) {
        super();
        _options.set(this, void 0);
        _api.set(this, void 0);
        _executor.set(this, void 0);
        _wallet.set(this, void 0);
        _blockchain.set(this, void 0);
        /**
         * Remove an event subscription
         */
        this.removeListener = this.off;
        _send.set(this, (arg1, arg2) => {
            let method;
            let params;
            let response;
            if (typeof arg1 === "string") {
                // this signature is (not) non-standard and is only a ganache thing!!!
                // we should probably remove it, but I really like it so I haven't yet.
                method = arg1;
                params = arg2;
                response = this.request({ method, params });
            }
            else if (typeof arg2 === "function") {
                // handle backward compatibility with callback-style ganache-core
                if (Array.isArray(arg1)) {
                    const callback = arg2;
                    __classPrivateFieldGet(this, _legacySendPayloads).call(this, arg1).then(({ error, result }) => {
                        callback(error, result);
                    });
                }
                else {
                    const callback = arg2;
                    __classPrivateFieldGet(this, _legacySendPayload).call(this, arg1).then(({ error, result }) => {
                        callback(error, result);
                    });
                }
            }
            else {
                throw new Error("No callback provided to provider's send function. As of web3 1.0, provider.send " +
                    "is no longer synchronous and must be passed a callback as its final argument.");
            }
            return response;
        });
        _logRequest.set(this, (method, params) => {
            const options = __classPrivateFieldGet(this, _options);
            if (options.logging.verbose) {
                options.logging.logger.log(`   >  ${method}: ${params == null
                    ? params
                    : JSON.stringify(params, null, 2).split("\n").join("\n   > ")}`);
            }
            else {
                options.logging.logger.log(method);
            }
        });
        this.disconnect = async () => {
            await __classPrivateFieldGet(this, _blockchain).stop();
            this.emit("disconnect");
            return;
        };
        //#region legacy
        _legacySendPayloads.set(this, (payloads) => {
            return Promise.all(payloads.map(__classPrivateFieldGet(this, _legacySendPayload))).then(results => {
                let mainError = null;
                const responses = [];
                results.forEach(({ error, result }, i) => {
                    responses.push(result);
                    if (error) {
                        if (mainError == null) {
                            mainError = new Error("Batch error:");
                        }
                        mainError.errors[i] = error;
                    }
                });
                return { error: mainError, result: responses };
            });
        });
        _legacySendPayload.set(this, async (payload) => {
            const method = payload.method;
            const params = payload.params;
            try {
                const result = await this.request({ method, params });
                return {
                    error: null,
                    result: utils_1.makeResponse(payload.id, JSON.parse(JSON.stringify(result)))
                };
            }
            catch (error) {
                let result;
                // In order to provide `vmErrorsOnRPCResponse`, the `error` might have
                // a `result` property that we need to move to the result field. Yes,
                // it's super weird behavior!
                if (utils_1.hasOwn(error, "result")) {
                    result = error.result;
                    delete error.result;
                }
                return { error, result: utils_1.makeError(payload.id, error, result) };
            }
        });
        __classPrivateFieldSet(this, _executor, executor);
        const providerOptions = (__classPrivateFieldSet(this, _options, ethereum_options_1.EthereumOptionsConfig.normalize(options)));
        const wallet = (__classPrivateFieldSet(this, _wallet, new wallet_1.default(providerOptions.wallet)));
        const accounts = wallet.initialAccounts;
        const fork = providerOptions.fork.url || providerOptions.fork.provider;
        const fallback = fork ? new fork_1.Fork(providerOptions, accounts) : null;
        const coinbase = parseCoinbase(providerOptions.miner.coinbase, accounts);
        const blockchain = new blockchain_1.default(providerOptions, coinbase, fallback);
        __classPrivateFieldSet(this, _blockchain, blockchain);
        __classPrivateFieldSet(this, _api, new api_1.default(providerOptions, wallet, blockchain));
    }
    async initialize() {
        await __classPrivateFieldGet(this, _blockchain).initialize(__classPrivateFieldGet(this, _wallet).initialAccounts);
        this.emit("connect");
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
    getInitialAccounts() {
        const accounts = {};
        const wallet = __classPrivateFieldGet(this, _wallet);
        const unlockedAccounts = __classPrivateFieldGet(this, _wallet).unlockedAccounts;
        wallet.initialAccounts.forEach(account => {
            const address = account.address.toString();
            accounts[address] = {
                secretKey: account.privateKey.toString(),
                balance: account.balance.toBigInt(),
                unlocked: unlockedAccounts.has(address)
            };
        });
        return accounts;
    }
    send(arg1, arg2) {
        return __classPrivateFieldGet(this, _send).call(this, arg1, arg2);
    }
    sendAsync(arg1, arg2) {
        __classPrivateFieldGet(this, _send).call(this, arg1, arg2);
    }
    /**
     * EIP-1193 style request method
     * @param args - the args
     * @returns A Promise that resolves with the method's result or rejects with a CodedError
     * @EIP [1193](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md)
     */
    async request(args) {
        const rawResult = await this._requestRaw(args);
        const value = await rawResult.value;
        return JSON.parse(JSON.stringify(value));
    }
    /**
     * INTERNAL. Used when the caller wants to access the original `PromiEvent`,
     * which would otherwise be flattened into a regular Promise through the
     * Promise chain.
     * @param request - the request
     */
    async _requestRaw({ method, params }) {
        __classPrivateFieldGet(this, _logRequest).call(this, method, params);
        const result = await __classPrivateFieldGet(this, _executor).execute(__classPrivateFieldGet(this, _api), method, params);
        const promise = result.value;
        if (promise instanceof utils_1.PromiEvent) {
            promise.on("message", data => {
                // EIP-1193
                this.emit("message", data);
                // legacy
                this.emit("data", {
                    jsonrpc: "2.0",
                    method: "eth_subscription",
                    params: data.data
                });
            });
        }
        const value = promise.catch((error) => {
            if (__classPrivateFieldGet(this, _options).chain.vmErrorsOnRPCResponse) {
                if (utils_1.hasOwn(error, "result")) {
                    // stringify the result here
                    // TODO: not sure why the stringification is even needed.
                    error.result = JSON.parse(JSON.stringify(error.result));
                }
            }
            // then rethrow
            throw error;
        });
        return { value: value };
    }
}
exports.default = EthereumProvider;
_options = new WeakMap(), _api = new WeakMap(), _executor = new WeakMap(), _wallet = new WeakMap(), _blockchain = new WeakMap(), _send = new WeakMap(), _logRequest = new WeakMap(), _legacySendPayloads = new WeakMap(), _legacySendPayload = new WeakMap();
//# sourceMappingURL=provider.js.map
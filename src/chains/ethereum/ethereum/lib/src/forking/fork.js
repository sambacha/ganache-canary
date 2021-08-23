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
var _abortController, _handler, _options, _accounts, _setCommonFromChain, _setBlockDataFromChainAndOptions, _syncAccounts;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fork = void 0;
const utils_1 = require("@ganache/utils");
const abort_controller_1 = __importDefault(require("abort-controller"));
const common_1 = __importDefault(require("@ethereumjs/common"));
const http_handler_1 = require("./handlers/http-handler");
const ws_handler_1 = require("./handlers/ws-handler");
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const ethereum_block_1 = require("@ganache/ethereum-block");
function fetchChainId(fork) {
    return fork
        .request("eth_chainId", [])
        .then(chainIdHex => parseInt(chainIdHex, 16));
}
function fetchNetworkId(fork) {
    return fork
        .request("net_version", [])
        .then(networkIdStr => parseInt(networkIdStr, 10));
}
function fetchBlockNumber(fork) {
    return fork.request("eth_blockNumber", []);
}
function fetchBlock(fork, blockNumber) {
    return fork.request("eth_getBlockByNumber", [blockNumber, true]);
}
function fetchNonce(fork, address, blockNumber) {
    return fork
        .request("eth_getTransactionCount", [address, blockNumber])
        .then(nonce => utils_1.Quantity.from(nonce));
}
class Fork {
    constructor(options, accounts) {
        _abortController.set(this, new abort_controller_1.default());
        _handler.set(this, void 0);
        _options.set(this, void 0);
        _accounts.set(this, void 0);
        _setCommonFromChain.set(this, async () => {
            const [chainId, networkId] = await Promise.all([
                fetchChainId(this),
                fetchNetworkId(this)
            ]);
            this.common = common_1.default.forCustomChain(utils_1.KNOWN_CHAINIDS.has(chainId) ? chainId : 1, {
                name: "ganache-fork",
                networkId,
                chainId,
                comment: "Local test network fork"
            });
            this.common.on = () => { };
        });
        _setBlockDataFromChainAndOptions.set(this, async () => {
            const options = __classPrivateFieldGet(this, _options);
            if (options.blockNumber === ethereum_utils_1.Tag.LATEST) {
                // if our block number option is "latest" override it with the original
                // chain's current blockNumber
                const block = await fetchBlock(this, ethereum_utils_1.Tag.LATEST);
                options.blockNumber = parseInt(block.number, 16);
                this.blockNumber = utils_1.Quantity.from(options.blockNumber);
                this.stateRoot = utils_1.Data.from(block.stateRoot);
                await __classPrivateFieldGet(this, _syncAccounts).call(this, this.blockNumber);
                return block;
            }
            else if (typeof options.blockNumber === "number") {
                const blockNumber = utils_1.Quantity.from(options.blockNumber);
                const [block] = await Promise.all([
                    fetchBlock(this, blockNumber).then(async (block) => {
                        this.stateRoot = block.stateRoot;
                        await __classPrivateFieldGet(this, _syncAccounts).call(this, blockNumber);
                        return block;
                    }),
                    fetchBlockNumber(this).then((latestBlockNumberHex) => {
                        const latestBlockNumberInt = parseInt(latestBlockNumberHex, 16);
                        // if our block number option is _after_ the current block number
                        // throw, as it likely wasn't intentional and doesn't make sense.
                        if (options.blockNumber > latestBlockNumberInt) {
                            throw new Error(`\`fork.blockNumber\` (${options.blockNumber}) must not be greater than the current block number (${latestBlockNumberInt})`);
                        }
                        else {
                            this.blockNumber = blockNumber;
                        }
                    })
                ]);
                return block;
            }
            else {
                throw new Error(`Invalid value for \`fork.blockNumber\` option: "${options.blockNumber}". Must be a positive integer or the string "latest".`);
            }
        });
        _syncAccounts.set(this, (blockNumber) => {
            return Promise.all(__classPrivateFieldGet(this, _accounts).map(async (account) => {
                const nonce = await fetchNonce(this, account.address, blockNumber);
                account.nonce = nonce;
            }));
        });
        const forkingOptions = (__classPrivateFieldSet(this, _options, options.fork));
        __classPrivateFieldSet(this, _accounts, accounts);
        const { url } = forkingOptions;
        if (url) {
            const { protocol } = url;
            switch (protocol) {
                case "ws:":
                case "wss:":
                    __classPrivateFieldSet(this, _handler, new ws_handler_1.WsHandler(options, __classPrivateFieldGet(this, _abortController).signal));
                    break;
                case "http:":
                case "https:":
                    __classPrivateFieldSet(this, _handler, new http_handler_1.HttpHandler(options, __classPrivateFieldGet(this, _abortController).signal));
                    break;
                default: {
                    throw new Error(`Unsupported protocol: ${protocol}`);
                }
            }
        }
        else if (forkingOptions.provider) {
            let id = 0;
            __classPrivateFieldSet(this, _handler, {
                request: (method, params) => {
                    // format params via JSON stringification because the params might
                    // be Quantity or Data, which aren't valid as `params` themselves,
                    // but when JSON stringified they are
                    const paramCopy = JSON.parse(JSON.stringify(params));
                    if (forkingOptions.provider.request) {
                        return forkingOptions.provider.request({
                            method,
                            params: paramCopy
                        });
                    }
                    else if (forkingOptions.provider.send) {
                        // TODO: remove support for legacy providers
                        // legacy `.send`
                        console.warn("WARNING: Ganache forking only supports EIP-1193-compliant providers. Legacy support for send is currently enabled, but will be removed in a future version _without_ a breaking change. To remove this warning, switch to an EIP-1193 provider. This error is probably caused by an old version of Web3's HttpProvider (or an ganache < v7)");
                        return new Promise((resolve, reject) => {
                            forkingOptions.provider.send({
                                id: id++,
                                jsonrpc: "2.0",
                                method,
                                params: paramCopy
                            }, (err, response) => {
                                if (err)
                                    return void reject(err);
                                resolve(response.result);
                            });
                        });
                    }
                    else {
                        throw new Error("Forking `provider` must be EIP-1193 compatible");
                    }
                },
                close: () => Promise.resolve()
            });
        }
    }
    async initialize() {
        const [block] = await Promise.all([
            __classPrivateFieldGet(this, _setBlockDataFromChainAndOptions).call(this),
            __classPrivateFieldGet(this, _setCommonFromChain).call(this)
        ]);
        this.block = new ethereum_block_1.Block(ethereum_block_1.Block.rawFromJSON(block), this.common);
    }
    request(method, params) {
        return __classPrivateFieldGet(this, _handler).request(method, params);
    }
    abort() {
        return __classPrivateFieldGet(this, _abortController).abort();
    }
    close() {
        return __classPrivateFieldGet(this, _handler).close();
    }
    selectValidForkBlockNumber(blockNumber) {
        return blockNumber.toBigInt() < this.blockNumber.toBigInt()
            ? blockNumber
            : this.blockNumber;
    }
}
exports.Fork = Fork;
_abortController = new WeakMap(), _handler = new WeakMap(), _options = new WeakMap(), _accounts = new WeakMap(), _setCommonFromChain = new WeakMap(), _setBlockDataFromChainAndOptions = new WeakMap(), _syncAccounts = new WeakMap();
//# sourceMappingURL=fork.js.map
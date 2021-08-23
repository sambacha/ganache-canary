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
var _blockchain;
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = __importDefault(require("./manager"));
const utils_1 = require("@ganache/utils");
const ethereum_transaction_1 = require("@ganache/ethereum-transaction");
const ethereum_address_1 = require("@ganache/ethereum-address");
class TransactionReceiptManager extends manager_1.default {
    constructor(base, blockchain) {
        super(base, ethereum_transaction_1.TransactionReceipt);
        _blockchain.set(this, void 0);
        __classPrivateFieldSet(this, _blockchain, blockchain);
    }
    async get(key) {
        const receipt = await super.get(key);
        if (receipt) {
            return receipt;
        }
        else if (__classPrivateFieldGet(this, _blockchain).fallback) {
            const res = await __classPrivateFieldGet(this, _blockchain).fallback.request("eth_getTransactionReceipt", [typeof key === "string" ? key : utils_1.Data.from(key)]);
            if (!res)
                return null;
            const status = res.status === "0x1" ? utils_1.RPCQUANTITY_ONE.toBuffer() : utils_1.BUFFER_ZERO;
            const cumulativeGasUsed = utils_1.Quantity.from(res.cumulativeGasUsed).toBuffer();
            const logsBloom = utils_1.Data.from(res.logsBloom, 256).toBuffer();
            const logs = res.logs.map(log => [
                ethereum_address_1.Address.from(log.address).toBuffer(),
                log.topics.map(topic => utils_1.Data.from(topic).toBuffer()),
                Array.isArray(log.data)
                    ? log.data.map(data => utils_1.Data.from(data).toBuffer())
                    : utils_1.Data.from(log.data).toBuffer()
            ]);
            const gasUsed = utils_1.Quantity.from(res.gasUsed).toBuffer();
            const contractAddress = res.contractAddress == null
                ? utils_1.BUFFER_EMPTY
                : ethereum_address_1.Address.from(res.contractAddress).toBuffer();
            return ethereum_transaction_1.TransactionReceipt.fromValues(status, cumulativeGasUsed, logsBloom, logs, gasUsed, contractAddress);
        }
    }
}
exports.default = TransactionReceiptManager;
_blockchain = new WeakMap();
//# sourceMappingURL=transaction-receipt-manager.js.map
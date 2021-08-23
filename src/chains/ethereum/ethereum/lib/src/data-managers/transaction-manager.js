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
var _queue, _paused, _resumer, _resolver, _blockchain;
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = __importDefault(require("./manager"));
const transaction_pool_1 = __importDefault(require("../transaction-pool"));
const promise_queue_1 = __importDefault(require("@ganache/promise-queue"));
const utils_1 = require("@ganache/utils");
const ethereum_transaction_1 = require("@ganache/ethereum-transaction");
class TransactionManager extends manager_1.default {
    constructor(options, common, blockchain, base) {
        super(base, ethereum_transaction_1.FrozenTransaction, common);
        _queue.set(this, new promise_queue_1.default());
        _paused.set(this, false);
        _resumer.set(this, void 0);
        _resolver.set(this, void 0);
        _blockchain.set(this, void 0);
        this.fromFallback = async (transactionHash) => {
            const { fallback } = __classPrivateFieldGet(this, _blockchain);
            const tx = await fallback.request("eth_getTransactionByHash", [utils_1.Data.from(transactionHash).toString()]);
            if (tx == null)
                return null;
            const runTx = new ethereum_transaction_1.RuntimeTransaction(tx, fallback.common);
            return runTx.serializeForDb(utils_1.Data.from(tx.blockHash, 32), utils_1.Quantity.from(tx.blockNumber), utils_1.Quantity.from(tx.transactionIndex));
        };
        /**
         * Resume processing transactions. Has no effect if not paused.
         */
        this.resume = () => {
            if (!__classPrivateFieldGet(this, _paused))
                return;
            __classPrivateFieldSet(this, _paused, false);
            __classPrivateFieldGet(this, _resolver).call(this);
        };
        __classPrivateFieldSet(this, _blockchain, blockchain);
        this.transactionPool = new transaction_pool_1.default(options, blockchain);
    }
    async getRaw(transactionHash) {
        return super.getRaw(transactionHash).then(block => {
            if (block == null && __classPrivateFieldGet(this, _blockchain).fallback) {
                return this.fromFallback(transactionHash);
            }
            return block;
        });
    }
    /**
     * Adds the transaction to the transaction pool.
     *
     * Returns a promise that is only resolved in the order it was added.
     *
     * @param transaction
     * @param secretKey
     * @returns `true` if the `transaction` is immediately executable, `false` if
     * it may be valid in the future. Throws if the transaction is invalid.
     */
    async add(transaction, secretKey) {
        if (__classPrivateFieldGet(this, _paused)) {
            await __classPrivateFieldGet(this, _resumer);
        }
        // Because ganache requires determinism, we can't allow varying IO times to
        // potentially affect the order in which transactions are inserted into the
        // pool, so we use a FIFO queue to _return_ transaction insertions in the
        // order the were received.
        const insertion = this.transactionPool.prepareTransaction(transaction, secretKey);
        const result = await __classPrivateFieldGet(this, _queue).add(insertion);
        if (result) {
            this.transactionPool.drain();
        }
        return result;
    }
    /**
     * Immediately ignores all transactions that were in the process of being
     * added to the pool. These transactions' `push` promises will be resolved
     * immediately with the value `false` and will _not_ be added to the pool.
     *
     * Also clears all transactions that were already added to the pool.
     *
     * Transactions that are currently in the process of being mined may still be
     * mined.
     */
    clear() {
        __classPrivateFieldGet(this, _queue).clear(false);
        this.transactionPool.clear();
    }
    /**
     * Stop processing _new_ transactions; puts new requests in a queue. Has no
     * affect if already paused.
     */
    async pause() {
        if (!__classPrivateFieldGet(this, _paused)) {
            // stop processing new transactions immediately
            __classPrivateFieldSet(this, _paused, true);
            __classPrivateFieldSet(this, _resumer, new Promise(resolve => {
                __classPrivateFieldSet(this, _resolver, resolve);
            }));
        }
        // then wait until all async things we were already processing are done
        // before returning
        if (__classPrivateFieldGet(this, _queue).isBusy()) {
            await __classPrivateFieldGet(this, _queue).emit("idle");
        }
    }
}
exports.default = TransactionManager;
_queue = new WeakMap(), _paused = new WeakMap(), _resumer = new WeakMap(), _resolver = new WeakMap(), _blockchain = new WeakMap();
//# sourceMappingURL=transaction-manager.js.map
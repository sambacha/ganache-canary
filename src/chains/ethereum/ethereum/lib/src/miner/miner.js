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
var _currentlyExecutingPrice, _origins, _pending, _isBusy, _paused, _resumer, _resolver, _executables, _options, _instamine, _vm, _createBlock, _priced, _mine, _mineTxs, _runTx, _removeBestAndOrigin, _reset, _setPricedHeap, _updatePricedHeap;
Object.defineProperty(exports, "__esModule", { value: true });
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const utils_1 = require("@ganache/utils");
const rlp_1 = require("@ganache/rlp");
const merkle_patricia_tree_1 = require("merkle-patricia-tree");
const emittery_1 = __importDefault(require("emittery"));
const replace_from_heap_1 = __importDefault(require("./replace-from-heap"));
const ethereum_transaction_1 = require("@ganache/ethereum-transaction");
const updateBloom = (blockBloom, bloom) => {
    let i = 256;
    while (--i)
        blockBloom[i] |= bloom[i];
};
const sortByPrice = (values, a, b) => values[a].gasPrice > values[b].gasPrice;
class Miner extends emittery_1.default.Typed {
    /*
     * @param executables A live Map of pending transactions from the transaction
     * pool. The miner will update this Map by removing the best transactions
     * and putting them in new blocks.
     */
    constructor(options, executables, instamine, vm, createBlock) {
        super();
        _currentlyExecutingPrice.set(this, 0n);
        _origins.set(this, new Set());
        _pending.set(this, void 0);
        _isBusy.set(this, false);
        _paused.set(this, false);
        _resumer.set(this, void 0);
        _resolver.set(this, void 0);
        _executables.set(this, void 0);
        _options.set(this, void 0);
        _instamine.set(this, void 0);
        _vm.set(this, void 0);
        _createBlock.set(this, void 0);
        // create a Heap that sorts by gasPrice
        _priced.set(this, new utils_1.Heap(sortByPrice));
        _mine.set(this, async (block, maxTransactions = -1, onlyOneBlock = false) => {
            const { block: lastBlock, transactions } = await __classPrivateFieldGet(this, _mineTxs).call(this, block, maxTransactions, onlyOneBlock);
            // if there are more txs to mine, start mining them without awaiting their
            // result.
            if (__classPrivateFieldGet(this, _pending)) {
                __classPrivateFieldGet(this, _setPricedHeap).call(this);
                __classPrivateFieldSet(this, _pending, false);
                if (!onlyOneBlock && __classPrivateFieldGet(this, _priced).length > 0) {
                    const nextBlock = __classPrivateFieldGet(this, _createBlock).call(this, lastBlock);
                    await __classPrivateFieldGet(this, _mine).call(this, nextBlock, __classPrivateFieldGet(this, _instamine) ? 1 : -1);
                }
            }
            return transactions;
        });
        _mineTxs.set(this, async (runtimeBlock, maxTransactions, onlyOneBlock) => {
            let block;
            const vm = __classPrivateFieldGet(this, _vm);
            const { pending, inProgress } = __classPrivateFieldGet(this, _executables);
            const options = __classPrivateFieldGet(this, _options);
            let keepMining = true;
            const priced = __classPrivateFieldGet(this, _priced);
            const legacyInstamine = __classPrivateFieldGet(this, _options).legacyInstamine;
            const storageKeys = new Map();
            let blockTransactions;
            do {
                keepMining = false;
                __classPrivateFieldSet(this, _isBusy, true);
                blockTransactions = [];
                const transactionsTrie = new merkle_patricia_tree_1.BaseTrie(null, null);
                const receiptTrie = new merkle_patricia_tree_1.BaseTrie(null, null);
                // don't mine anything at all if maxTransactions is `0`
                if (maxTransactions === 0) {
                    await vm.stateManager.checkpoint();
                    await vm.stateManager.commit();
                    const finalizedBlockData = runtimeBlock.finalize(transactionsTrie.root, receiptTrie.root, utils_1.BUFFER_256_ZERO, vm.stateManager._trie.root, 0n, // gas used
                    options.extraData, [], storageKeys);
                    this.emit("block", finalizedBlockData);
                    __classPrivateFieldGet(this, _reset).call(this);
                    return { block: finalizedBlockData.block, transactions: [] };
                }
                let numTransactions = 0;
                let blockGasLeft = options.blockGasLimit.toBigInt();
                let blockGasUsed = 0n;
                const blockBloom = Buffer.allocUnsafe(256).fill(0);
                const promises = [];
                // Set a block-level checkpoint so our unsaved trie doesn't update the
                // vm's "live" trie.
                await vm.stateManager.checkpoint();
                const TraceData = ethereum_utils_1.TraceDataFactory();
                // We need to listen for any SSTORE opcodes so we can grab the raw, unhashed version
                // of the storage key and save it to the db along with it's keccak hashed version of
                // the storage key. Why you might ask? So we can reference the raw version in
                // debug_storageRangeAt.
                const stepListener = (event, next) => {
                    if (event.opcode.name === "SSTORE") {
                        const key = TraceData.from(event.stack[event.stack.length - 1].toArrayLike(Buffer)).toBuffer();
                        const hashedKey = utils_1.keccak(key);
                        storageKeys.set(hashedKey.toString(), { key, hashedKey });
                    }
                    next();
                };
                vm.on("step", stepListener);
                // Run until we run out of items, or until the inner loop stops us.
                // we don't call `shift()` here because we will may need to `replace`
                // this `best` transaction with the next best transaction from the same
                // origin later.
                let best;
                while ((best = priced.peek())) {
                    const origin = best.from.toString();
                    if (best.calculateIntrinsicGas() > blockGasLeft) {
                        // if the current best transaction can't possibly fit in this block
                        // go ahead and run the next best transaction, ignoring all other
                        // pending transactions from this account for this block.
                        //  * We don't replace this "best" transaction with another from the
                        // same account.
                        //  * We do "unlock" this transaction in the transaction pool's `pending`
                        // queue so it can be replaced, if needed.
                        best.locked = false;
                        __classPrivateFieldGet(this, _removeBestAndOrigin).call(this, origin);
                        continue;
                    }
                    __classPrivateFieldSet(this, _currentlyExecutingPrice, best.gasPrice.toBigInt());
                    // Set a transaction-level checkpoint so we can undo state changes in
                    // the case where the transaction is rejected by the VM.
                    await vm.stateManager.checkpoint();
                    // Set the internal trie's block number (for forking)
                    vm.stateManager._trie.blockNumber = utils_1.Quantity.from(runtimeBlock.header.number.toArrayLike(Buffer));
                    const result = await __classPrivateFieldGet(this, _runTx).call(this, best, runtimeBlock, origin, pending);
                    if (result !== null) {
                        const gasUsed = utils_1.Quantity.from(result.gasUsed.toArrayLike(Buffer)).toBigInt();
                        if (blockGasLeft >= gasUsed) {
                            // if the transaction will fit in the block, commit it!
                            await vm.stateManager.commit();
                            blockTransactions[numTransactions] = best;
                            blockGasLeft -= gasUsed;
                            blockGasUsed += gasUsed;
                            // calculate receipt and tx tries
                            const txKey = rlp_1.encode(numTransactions === 0
                                ? utils_1.BUFFER_EMPTY
                                : utils_1.uintToBuffer(numTransactions));
                            promises.push(transactionsTrie.put(txKey, best.serialized));
                            const receipt = best.fillFromResult(result, blockGasUsed);
                            promises.push(receiptTrie.put(txKey, receipt));
                            // update the block's bloom
                            updateBloom(blockBloom, result.bloom.bitvector);
                            numTransactions++;
                            const pendingOrigin = pending.get(origin);
                            // since this transaction was successful, remove it from the "pending"
                            // transaction pool.
                            keepMining = pendingOrigin.removeBest();
                            inProgress.add(best);
                            best.once("finalized").then(() => {
                                // it is in the database (or thrown out) so delete it from the
                                // `inProgress` Set
                                inProgress.delete(best);
                            });
                            // if we:
                            //  * don't have enough gas left for even the smallest of transactions
                            //  * Or if we've mined enough transactions
                            // we're done with this block!
                            // notice: when `maxTransactions` is `-1` (AKA infinite), `numTransactions === maxTransactions`
                            // will always return false, so this comparison works out fine.
                            if (blockGasLeft <= ethereum_transaction_1.Params.TRANSACTION_GAS ||
                                numTransactions === maxTransactions) {
                                if (keepMining) {
                                    // remove the newest (`best`) tx from this account's pending queue
                                    // as we know we can fit another transaction in the block. Stick
                                    // this tx into our `priced` heap.
                                    keepMining = replace_from_heap_1.default(priced, pendingOrigin);
                                }
                                else {
                                    keepMining = __classPrivateFieldGet(this, _removeBestAndOrigin).call(this, origin);
                                }
                                break;
                            }
                            if (keepMining) {
                                // remove the newest (`best`) tx from this account's pending queue
                                // as we know we can fit another transaction in the block. Stick
                                // this tx into our `priced` heap.
                                keepMining = replace_from_heap_1.default(priced, pendingOrigin);
                            }
                            else {
                                // since we don't have any more txs from this account, just get the
                                // next bext transaction sorted in our `priced` heap.
                                keepMining = __classPrivateFieldGet(this, _removeBestAndOrigin).call(this, origin);
                            }
                        }
                        else {
                            // didn't fit in the current block
                            await vm.stateManager.revert();
                            // unlock the transaction so the transaction pool can reconsider this
                            // transaction
                            best.locked = false;
                            // didn't fit. remove it from the priced transactions without replacing
                            // it with another from the account. This transaction will have to be
                            // run again in another block.
                            keepMining = priced.removeBest();
                        }
                    }
                    else {
                        // no result means the transaction is an "always failing tx", so we
                        // revert its changes here.
                        // Note: we don't clean up (`removeBest`, etc) because `runTx`'s
                        // error handler does the clean up itself.
                        await vm.stateManager.revert();
                    }
                }
                await Promise.all(promises);
                await vm.stateManager.commit();
                vm.removeListener("step", stepListener);
                const finalizedBlockData = runtimeBlock.finalize(transactionsTrie.root, receiptTrie.root, blockBloom, vm.stateManager._trie.root, blockGasUsed, options.extraData, blockTransactions, storageKeys);
                block = finalizedBlockData.block;
                const emitBlockProm = this.emit("block", finalizedBlockData);
                if (legacyInstamine === true) {
                    // we need to wait for each block to be done mining when in legacy
                    // mode because things like `mine` and `miner_start` must wait for the
                    // first mine operation to be fully complete.
                    await emitBlockProm;
                }
                if (onlyOneBlock) {
                    __classPrivateFieldSet(this, _currentlyExecutingPrice, 0n);
                    __classPrivateFieldGet(this, _reset).call(this);
                    break;
                }
                else {
                    __classPrivateFieldSet(this, _currentlyExecutingPrice, 0n);
                    __classPrivateFieldGet(this, _updatePricedHeap).call(this);
                    if (priced.length !== 0) {
                        maxTransactions = __classPrivateFieldGet(this, _instamine) ? 1 : -1;
                        runtimeBlock = __classPrivateFieldGet(this, _createBlock).call(this, block);
                    }
                    else {
                        // reset the miner
                        __classPrivateFieldGet(this, _reset).call(this);
                    }
                }
            } while (keepMining);
            return { block, transactions: blockTransactions };
        });
        _runTx.set(this, async (tx, block, origin, pending) => {
            try {
                const vm = __classPrivateFieldGet(this, _vm);
                const o = {
                    tx: tx.toVmTransaction(),
                    block: block
                };
                const r = vm.runTx(o);
                const p = await r;
                return p;
            }
            catch (err) {
                const errorMessage = err.message;
                // We do NOT want to re-run this transaction.
                // Update the `priced` heap with the next best transaction from this
                // account
                const pendingOrigin = pending.get(origin);
                if (pendingOrigin.removeBest()) {
                    replace_from_heap_1.default(__classPrivateFieldGet(this, _priced), pendingOrigin);
                }
                else {
                    // if there are no more transactions from this origin remove this tx
                    // from the priced heap and clear out it's origin so it can accept new
                    // transactions from this origin.
                    __classPrivateFieldGet(this, _removeBestAndOrigin).call(this, origin);
                }
                const e = {
                    execResult: {
                        runState: { programCounter: 0 },
                        exceptionError: { error: errorMessage },
                        returnValue: utils_1.BUFFER_EMPTY
                    }
                };
                const error = new ethereum_utils_1.RuntimeError(tx.hash, e, ethereum_utils_1.RETURN_TYPES.TRANSACTION_HASH);
                tx.finalize("rejected", error);
                return null;
            }
        });
        _removeBestAndOrigin.set(this, (origin) => {
            __classPrivateFieldGet(this, _origins).delete(origin);
            return __classPrivateFieldGet(this, _priced).removeBest();
        });
        _reset.set(this, () => {
            __classPrivateFieldGet(this, _origins).clear();
            __classPrivateFieldGet(this, _priced).clear();
            __classPrivateFieldSet(this, _isBusy, false);
        });
        /**
         * Adds one transaction from each origin into the "priced" heap, which
         * sorts each tx by gasPrice (high to low)
         */
        _setPricedHeap.set(this, () => {
            const { pending } = __classPrivateFieldGet(this, _executables);
            const origins = __classPrivateFieldGet(this, _origins);
            const priced = __classPrivateFieldGet(this, _priced);
            for (let mapping of pending) {
                const heap = mapping[1];
                const next = heap.peek();
                if (next && !next.locked) {
                    const origin = next.from.toString();
                    origins.add(origin);
                    priced.push(next);
                    next.locked = true;
                }
            }
        });
        /**
         * Updates the "priced" heap with transactions from origins it doesn't yet
         * contain.
         */
        _updatePricedHeap.set(this, () => {
            const { pending } = __classPrivateFieldGet(this, _executables);
            const origins = __classPrivateFieldGet(this, _origins);
            const priced = __classPrivateFieldGet(this, _priced);
            // Note: the `pending` Map passed here is "live", meaning it is constantly
            // being updated by the `transactionPool`. This allows us to begin
            // processing a block with the _current_ pending transactions, and while
            // that is processing, to receive new transactions, updating our `priced`
            // heap with these new pending transactions.
            for (let mapping of pending) {
                const heap = mapping[1];
                const next = heap.peek();
                if (next && !next.locked) {
                    const price = next.gasPrice.toBigInt();
                    if (__classPrivateFieldGet(this, _currentlyExecutingPrice) > price) {
                        // don't insert a transaction into the miner's `priced` heap
                        // if it will be better than its last
                        continue;
                    }
                    const origin = next.from.toString();
                    if (origins.has(origin)) {
                        // don't insert a transaction into the miner's `priced` heap if it
                        // has already queued up transactions for that origin
                        continue;
                    }
                    origins.add(origin);
                    priced.push(next);
                    next.locked = true;
                }
            }
        });
        __classPrivateFieldSet(this, _vm, vm);
        __classPrivateFieldSet(this, _options, options);
        __classPrivateFieldSet(this, _executables, executables);
        __classPrivateFieldSet(this, _instamine, instamine);
        __classPrivateFieldSet(this, _createBlock, createBlock);
        // initialize the heap with an empty array
        __classPrivateFieldGet(this, _priced).init([]);
    }
    async pause() {
        if (!__classPrivateFieldGet(this, _paused)) {
            __classPrivateFieldSet(this, _paused, true);
            __classPrivateFieldSet(this, _resumer, new Promise(resolve => {
                __classPrivateFieldSet(this, _resolver, resolve);
            }));
        }
        if (__classPrivateFieldGet(this, _isBusy)) {
            await this.once("idle");
        }
    }
    resume() {
        if (!__classPrivateFieldGet(this, _paused))
            return;
        __classPrivateFieldSet(this, _paused, false);
        __classPrivateFieldGet(this, _resolver).call(this);
    }
    /**
     * @param maxTransactions: maximum number of transactions per block. If `-1`,
     * unlimited.
     * @param onlyOneBlock: set to `true` if only 1 block should be mined.
     *
     * @returns the transactions mined in the _first_ block
     */
    async mine(block, maxTransactions = -1, onlyOneBlock = false) {
        if (__classPrivateFieldGet(this, _paused)) {
            await __classPrivateFieldGet(this, _resumer);
        }
        // only allow mining a single block at a time (per miner)
        if (__classPrivateFieldGet(this, _isBusy)) {
            // if we are currently mining a block, set the `pending` property
            // so the miner knows it can immediately start mining another block once
            // it is done with its current work.
            __classPrivateFieldSet(this, _pending, true);
            __classPrivateFieldGet(this, _updatePricedHeap).call(this);
            return;
        }
        else {
            __classPrivateFieldGet(this, _setPricedHeap).call(this);
            const result = await __classPrivateFieldGet(this, _mine).call(this, block, maxTransactions, onlyOneBlock);
            this.emit("idle");
            return result;
        }
    }
}
exports.default = Miner;
_currentlyExecutingPrice = new WeakMap(), _origins = new WeakMap(), _pending = new WeakMap(), _isBusy = new WeakMap(), _paused = new WeakMap(), _resumer = new WeakMap(), _resolver = new WeakMap(), _executables = new WeakMap(), _options = new WeakMap(), _instamine = new WeakMap(), _vm = new WeakMap(), _createBlock = new WeakMap(), _priced = new WeakMap(), _mine = new WeakMap(), _mineTxs = new WeakMap(), _runTx = new WeakMap(), _removeBestAndOrigin = new WeakMap(), _reset = new WeakMap(), _setPricedHeap = new WeakMap(), _updatePricedHeap = new WeakMap();
//# sourceMappingURL=miner.js.map
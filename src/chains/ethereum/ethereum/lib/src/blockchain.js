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
var _state, _miner, _blockBeingSavedPromise, _timer, _database, _options, _instamine, _saveNewBlock, _emitNewBlock, _getTransactionLogOutput, _handleNewBlockData, _readyNextBlock, _isPaused, _commitAccounts, _initializeGenesisBlock, _timeAdjustment, _currentTime, _deleteBlockData, _snapshots, _traceTransaction, _prepareNextBlock;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Status = void 0;
const os_1 = require("os");
const miner_1 = __importDefault(require("./miner/miner"));
const database_1 = __importDefault(require("./database"));
const emittery_1 = __importDefault(require("emittery"));
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const rlp_1 = require("@ganache/rlp");
const ethereumjs_util_1 = require("ethereumjs-util");
const common_1 = __importDefault(require("@ethereumjs/common"));
const vm_1 = __importDefault(require("@ethereumjs/vm"));
const exceptions_1 = require("@ethereumjs/vm/dist/exceptions");
const utils_1 = require("@ganache/utils");
const account_manager_1 = __importDefault(require("./data-managers/account-manager"));
const block_manager_1 = __importDefault(require("./data-managers/block-manager"));
const blocklog_manager_1 = __importDefault(require("./data-managers/blocklog-manager"));
const transaction_manager_1 = __importDefault(require("./data-managers/transaction-manager"));
const ethereum_address_1 = require("@ganache/ethereum-address");
const ethereum_transaction_1 = require("@ganache/ethereum-transaction");
const ethereum_block_1 = require("@ganache/ethereum-block");
const run_transactions_1 = require("./helpers/run-transactions");
const state_manager_1 = require("./forking/state-manager");
const index_1 = require("@ethereumjs/vm/dist/state/index");
const trie_1 = require("./helpers/trie");
const trie_2 = require("./forking/trie");
const precompiles_1 = require("./helpers/precompiles");
const transaction_receipt_manager_1 = __importDefault(require("./data-managers/transaction-receipt-manager"));
var Status;
(function (Status) {
    // Flags
    Status[Status["started"] = 1] = "started";
    Status[Status["starting"] = 2] = "starting";
    Status[Status["stopped"] = 4] = "stopped";
    Status[Status["stopping"] = 8] = "stopping";
    Status[Status["paused"] = 16] = "paused"; // 0001 0000
})(Status = exports.Status || (exports.Status = {}));
/**
 * Sets the provided VM state manager's state root *without* first
 * checking for checkpoints or flushing the existing cache.
 *
 * Useful if you know the state manager is not in a checkpoint and its internal
 * cache is safe to discard.
 *
 * @param stateManager
 * @param stateRoot
 */
function setStateRootSync(stateManager, stateRoot) {
    stateManager._trie.root = stateRoot;
    stateManager._cache.clear();
    stateManager._storageTries = {};
}
function makeTrie(blockchain, db, root) {
    if (blockchain.fallback) {
        return new trie_2.ForkTrie(db, root ? root.toBuffer() : null, blockchain);
    }
    else {
        return new trie_1.GanacheTrie(db, root ? root.toBuffer() : null, blockchain);
    }
}
function createCommon(chainId, networkId, hardfork) {
    const common = common_1.default.forCustomChain(
    // if we were given a chain id that matches a real chain, use it
    // NOTE: I don't think Common serves a purpose other than instructing the
    // VM what hardfork is in use. But just incase things change in the future
    // its configured "more correctly" here.
    utils_1.KNOWN_CHAINIDS.has(chainId) ? chainId : 1, {
        name: "ganache",
        networkId: networkId,
        chainId: chainId,
        comment: "Local test network"
    }, hardfork);
    // the VM likes to listen to "hardforkChanged" events from common, but:
    //  a) we don't currently support changing hardforks
    //  b) it can cause `MaxListenersExceededWarning`.
    // Since we don't need it we overwrite .on to make it be quiet.
    common.on = () => { };
    return common;
}
class Blockchain extends emittery_1.default.Typed {
    /**
     * Initializes the underlying Database and handles synchronization between
     * the API and the database.
     *
     * Emits a `ready` event once the database and all dependencies are fully
     * initialized.
     * @param options
     */
    constructor(options, coinbase, fallback) {
        super();
        _state.set(this, Status.starting);
        _miner.set(this, void 0);
        _blockBeingSavedPromise.set(this, void 0);
        /**
         * When not instamining (blockTime > 0) this value holds the timeout timer.
         */
        _timer.set(this, null);
        _database.set(this, void 0);
        _options.set(this, void 0);
        _instamine.set(this, void 0);
        _saveNewBlock.set(this, ({ block, serialized, storageKeys, transactions }) => {
            const { blocks } = this;
            blocks.latest = block;
            return __classPrivateFieldGet(this, _database).batch(() => {
                const blockHash = block.hash();
                const blockHeader = block.header;
                const blockNumberQ = blockHeader.number;
                const blockNumber = blockNumberQ.toBuffer();
                const blockLogs = ethereum_utils_1.BlockLogs.create(blockHash);
                const timestamp = blockHeader.timestamp;
                const timestampStr = new Date(timestamp.toNumber() * 1000).toString();
                const logOutput = [];
                transactions.forEach((tx, i) => {
                    const hash = tx.hash.toBuffer();
                    const index = utils_1.Quantity.from(i);
                    // save transaction to the database
                    const serialized = tx.serializeForDb(blockHash, blockNumberQ, index);
                    this.transactions.set(hash, serialized);
                    // save receipt to the database
                    const receipt = tx.getReceipt();
                    const encodedReceipt = receipt.serialize(true);
                    this.transactionReceipts.set(hash, encodedReceipt);
                    // collect block logs
                    tx.getLogs().forEach(blockLogs.append.bind(blockLogs, index, tx.hash));
                    // prepare log output
                    logOutput.push(__classPrivateFieldGet(this, _getTransactionLogOutput).call(this, hash, receipt, blockHeader.number, timestampStr, tx.execException));
                });
                // save storage keys to the database
                storageKeys.forEach(value => {
                    this.storageKeys.put(value.hashedKey, value.key);
                });
                blockLogs.blockNumber = blockHeader.number;
                // save block logs to the database
                this.blockLogs.set(blockNumber, blockLogs.serialize());
                // save block to the database
                blocks.putBlock(blockNumber, blockHash, serialized);
                // output to the log, if we have data to output
                if (logOutput.length > 0)
                    __classPrivateFieldGet(this, _options).logging.logger.log(logOutput.join(os_1.EOL));
                return { block, blockLogs, transactions };
            });
        });
        _emitNewBlock.set(this, async (blockInfo) => {
            const options = __classPrivateFieldGet(this, _options);
            const { block, blockLogs, transactions } = blockInfo;
            // emit the block once everything has been fully saved to the database
            transactions.forEach(transaction => {
                transaction.finalize("confirmed", transaction.execException);
            });
            if (__classPrivateFieldGet(this, _instamine) && options.miner.legacyInstamine) {
                // in legacy instamine mode we must delay the broadcast of new blocks
                await new Promise(resolve => {
                    process.nextTick(async () => {
                        // emit block logs first so filters can pick them up before
                        // block listeners are notified
                        await Promise.all([
                            this.emit("blockLogs", blockLogs),
                            this.emit("block", block)
                        ]);
                        resolve(void 0);
                    });
                });
            }
            else {
                // emit block logs first so filters can pick them up before
                // block listeners are notified
                await Promise.all([
                    this.emit("blockLogs", blockLogs),
                    this.emit("block", block)
                ]);
            }
            return blockInfo;
        });
        _getTransactionLogOutput.set(this, (hash, receipt, blockNumber, timestamp, error) => {
            let str = `${os_1.EOL}  Transaction: ${utils_1.Data.from(hash)}${os_1.EOL}`;
            const contractAddress = receipt.contractAddress;
            if (contractAddress != null) {
                str += `  Contract created: ${ethereum_address_1.Address.from(contractAddress)}${os_1.EOL}`;
            }
            str += `  Gas usage: ${utils_1.Quantity.from(receipt.raw[1]).toNumber()}${os_1.EOL}
  Block number: ${blockNumber.toNumber()}${os_1.EOL}
  Block time: ${timestamp}${os_1.EOL}`;
            if (error) {
                str += `  Runtime error: ${error.data.message}${os_1.EOL}`;
                if (error.data.reason) {
                    str += `  Revert reason: ${error.data.reason}${os_1.EOL}`;
                }
            }
            return str;
        });
        _handleNewBlockData.set(this, async (blockData) => {
            __classPrivateFieldSet(this, _blockBeingSavedPromise, __classPrivateFieldGet(this, _blockBeingSavedPromise).then(() => __classPrivateFieldGet(this, _saveNewBlock).call(this, blockData))
                .then(__classPrivateFieldGet(this, _emitNewBlock)));
            return __classPrivateFieldGet(this, _blockBeingSavedPromise);
        });
        _readyNextBlock.set(this, (previousBlock, timestamp) => {
            const previousHeader = previousBlock.header;
            const previousNumber = previousHeader.number.toBigInt() || 0n;
            return new ethereum_block_1.RuntimeBlock(utils_1.Quantity.from(previousNumber + 1n), previousBlock.hash(), this.coinbase, __classPrivateFieldGet(this, _options).miner.blockGasLimit.toBuffer(), utils_1.Quantity.from(timestamp == null ? __classPrivateFieldGet(this, _currentTime).call(this) : timestamp), __classPrivateFieldGet(this, _options).miner.difficulty, previousBlock.header.totalDifficulty);
        });
        this.isStarted = () => {
            return __classPrivateFieldGet(this, _state) === Status.started;
        };
        this.mine = async (maxTransactions, timestamp, onlyOneBlock = false) => {
            await __classPrivateFieldGet(this, _blockBeingSavedPromise);
            const nextBlock = __classPrivateFieldGet(this, _readyNextBlock).call(this, this.blocks.latest, timestamp);
            return __classPrivateFieldGet(this, _miner).mine(nextBlock, maxTransactions, onlyOneBlock);
        };
        _isPaused.set(this, () => {
            return (__classPrivateFieldGet(this, _state) & Status.paused) !== 0;
        });
        this.createVmFromStateTrie = async (stateTrie, allowUnlimitedContractSize, activatePrecompile) => {
            const blocks = this.blocks;
            // ethereumjs vm doesn't use the callback style anymore
            const blockchain = {
                getBlock: async (number) => {
                    const block = await blocks.get(number.toBuffer()).catch(_ => null);
                    return block ? { hash: () => block.hash().toBuffer() } : null;
                }
            };
            const common = this.common;
            const vm = await vm_1.default.create({
                state: stateTrie,
                activatePrecompiles: false,
                common,
                allowUnlimitedContractSize,
                blockchain,
                stateManager: this.fallback
                    ? new state_manager_1.ForkStateManager({ common, trie: stateTrie })
                    : new index_1.DefaultStateManager({ common, trie: stateTrie })
            });
            if (activatePrecompile) {
                await precompiles_1.activatePrecompiles(vm.stateManager);
            }
            return vm;
        };
        _commitAccounts.set(this, (accounts) => {
            return Promise.all(accounts.map(account => this.trie.put(account.address.toBuffer(), account.serialize())));
        });
        _initializeGenesisBlock.set(this, async (timestamp, blockGasLimit, initialAccounts) => {
            if (this.fallback != null) {
                // commit accounts, but for forking.
                const sm = this.vm.stateManager;
                this.vm.stateManager.checkpoint();
                initialAccounts.forEach(acc => {
                    const a = { buf: acc.address.toBuffer() };
                    sm._cache.put(a, acc);
                    sm.touchAccount(a);
                });
                await this.vm.stateManager.commit();
                // create the genesis block
                const genesis = new ethereum_block_1.RuntimeBlock(utils_1.Quantity.from(this.fallback.block.header.number.toBigInt() + 1n), this.fallback.block.hash(), this.coinbase, blockGasLimit.toBuffer(), utils_1.Quantity.from(timestamp), __classPrivateFieldGet(this, _options).miner.difficulty, this.fallback.block.header.totalDifficulty);
                // store the genesis block in the database
                const { block, serialized } = genesis.finalize(ethereumjs_util_1.KECCAK256_RLP, ethereumjs_util_1.KECCAK256_RLP, utils_1.BUFFER_256_ZERO, this.trie.root, 0n, __classPrivateFieldGet(this, _options).miner.extraData, [], new Map());
                const hash = block.hash();
                return this.blocks
                    .putBlock(block.header.number.toBuffer(), hash, serialized)
                    .then(_ => ({
                    block,
                    blockLogs: ethereum_utils_1.BlockLogs.create(hash)
                }));
            }
            await __classPrivateFieldGet(this, _commitAccounts).call(this, initialAccounts);
            // README: block `0` is weird in that a `0` _should_ be hashed as `[]`,
            // instead of `[0]`, so we set it to `RPCQUANTITY_EMPTY` instead of
            // `RPCQUANTITY_ZERO` here. A few lines down in this function we swap
            // this `RPCQUANTITY_EMPTY` for `RPCQUANTITY_ZERO`. This is all so we don't
            // have to have a "treat empty as 0` check in every function that uses the
            // "latest" block (which this genesis block will be for brief moment).
            const rawBlockNumber = utils_1.RPCQUANTITY_EMPTY;
            // create the genesis block
            const genesis = new ethereum_block_1.RuntimeBlock(rawBlockNumber, utils_1.Quantity.from(utils_1.BUFFER_32_ZERO), this.coinbase, blockGasLimit.toBuffer(), utils_1.Quantity.from(timestamp), __classPrivateFieldGet(this, _options).miner.difficulty, utils_1.RPCQUANTITY_ZERO // we start the totalDifficulty at 0
            );
            // store the genesis block in the database
            const { block, serialized } = genesis.finalize(ethereumjs_util_1.KECCAK256_RLP, ethereumjs_util_1.KECCAK256_RLP, utils_1.BUFFER_256_ZERO, this.trie.root, 0n, __classPrivateFieldGet(this, _options).miner.extraData, [], new Map());
            // README: set the block number to an actual 0 now.
            block.header.number = utils_1.RPCQUANTITY_ZERO;
            const hash = block.hash();
            return this.blocks
                .putBlock(block.header.number.toBuffer(), hash, serialized)
                .then(_ => ({
                block,
                blockLogs: ethereum_utils_1.BlockLogs.create(hash)
            }));
        });
        _timeAdjustment.set(this, 0);
        /**
         * Returns the timestamp, adjusted by the timeAdjustment offset, in seconds.
         */
        _currentTime.set(this, () => {
            return Math.floor((Date.now() + __classPrivateFieldGet(this, _timeAdjustment)) / 1000);
        });
        _deleteBlockData.set(this, (blocksToDelete) => {
            return __classPrivateFieldGet(this, _database).batch(() => {
                const { blocks, transactions, transactionReceipts, blockLogs } = this;
                blocksToDelete.forEach(block => {
                    block.getTransactions().forEach(tx => {
                        const txHash = tx.hash.toBuffer();
                        transactions.del(txHash);
                        transactionReceipts.del(txHash);
                    });
                    const blockNum = block.header.number.toBuffer();
                    blocks.del(blockNum);
                    blocks.del(block.hash().toBuffer());
                    blockLogs.del(blockNum);
                });
            });
        });
        // TODO(stability): this.#snapshots is a potential unbound memory suck. Caller
        // could call `evm_snapshot` over and over to grow the snapshot stack
        // indefinitely. `this.#snapshots.blocks` is even worse. To solve this we
        // might need to store in the db. An unlikely real problem, but possible.
        _snapshots.set(this, {
            snaps: [],
            blocks: null,
            unsubscribeFromBlocks: null
        });
        _traceTransaction.set(this, async (trie, newBlock, options, keys, contractAddress) => {
            let currentDepth = -1;
            const storageStack = [];
            const blocks = this.blocks;
            // ethereumjs vm doesn't use the callback style anymore
            const blockchain = {
                getBlock: async (number) => {
                    const block = await blocks.get(number.toBuffer()).catch(_ => null);
                    return block ? { hash: () => block.hash().toBuffer() } : null;
                }
            };
            const common = this.common;
            const vm = await vm_1.default.create({
                state: trie,
                activatePrecompiles: false,
                common,
                allowUnlimitedContractSize: this.vm.allowUnlimitedContractSize,
                blockchain,
                stateManager: this.fallback
                    ? new state_manager_1.ForkStateManager({ common, trie: trie })
                    : new index_1.DefaultStateManager({ common, trie: trie })
            });
            const storage = {};
            const transaction = newBlock.transactions[newBlock.transactions.length - 1];
            // TODO: gas could go theoretically go over Number.MAX_SAFE_INTEGER.
            // (Ganache v2 didn't handle this possibility either, so it hasn't been
            // updated yet)
            let gas = 0;
            const structLogs = [];
            const TraceData = ethereum_utils_1.TraceDataFactory();
            const stepListener = async (event, next) => {
                // See these docs:
                // https://github.com/ethereum/go-ethereum/wiki/Management-APIs
                const gasLeft = event.gasLeft.toNumber();
                const totalGasUsedAfterThisStep = transaction.gasLimit.toNumber() - gasLeft;
                const gasUsedPreviousStep = totalGasUsedAfterThisStep - gas;
                gas += gasUsedPreviousStep;
                const memory = [];
                if (options.disableMemory !== true) {
                    // We get the memory as one large array.
                    // Let's cut it up into 32 byte chunks as required by the spec.
                    let index = 0;
                    while (index < event.memory.length) {
                        const slice = event.memory.slice(index, index + 32);
                        memory.push(TraceData.from(Buffer.from(slice)));
                        index += 32;
                    }
                }
                const stack = [];
                if (options.disableStack !== true) {
                    for (const stackItem of event.stack) {
                        stack.push(TraceData.from(stackItem.toArrayLike(Buffer)));
                    }
                }
                const structLog = {
                    depth: event.depth,
                    error: "",
                    gas: gasLeft,
                    gasCost: 0,
                    memory,
                    op: event.opcode.name,
                    pc: event.pc,
                    stack,
                    storage: null
                };
                // The gas difference calculated for each step is indicative of gas consumed in
                // the previous step. Gas consumption in the final step will always be zero.
                if (structLogs.length) {
                    structLogs[structLogs.length - 1].gasCost = gasUsedPreviousStep;
                }
                if (options.disableStorage === true) {
                    // Add the struct log as is - nothing more to do.
                    structLogs.push(structLog);
                    next();
                }
                else {
                    const { depth: eventDepth } = event;
                    if (currentDepth > eventDepth) {
                        storageStack.pop();
                    }
                    else if (currentDepth < eventDepth) {
                        storageStack.push(new ethereum_utils_1.TraceStorageMap());
                    }
                    currentDepth = eventDepth;
                    switch (event.opcode.name) {
                        case "SSTORE": {
                            const key = stack[stack.length - 1];
                            const value = stack[stack.length - 2];
                            // new TraceStorageMap() here creates a shallow clone, to prevent other steps from overwriting
                            structLog.storage = new ethereum_utils_1.TraceStorageMap(storageStack[eventDepth]);
                            // Tell vm to move on to the next instruction. See below.
                            structLogs.push(structLog);
                            next();
                            // assign after callback because this storage change actually takes
                            // effect _after_ this opcode executes
                            storageStack[eventDepth].set(key, value);
                            break;
                        }
                        case "SLOAD": {
                            const key = stack[stack.length - 1];
                            const result = await vm.stateManager.getContractStorage(event.address, key.toBuffer());
                            const value = TraceData.from(result);
                            storageStack[eventDepth].set(key, value);
                            // new TraceStorageMap() here creates a shallow clone, to prevent other steps from overwriting
                            structLog.storage = new ethereum_utils_1.TraceStorageMap(storageStack[eventDepth]);
                            structLogs.push(structLog);
                            next();
                            break;
                        }
                        default:
                            // new TraceStorageMap() here creates a shallow clone, to prevent other steps from overwriting
                            structLog.storage = new ethereum_utils_1.TraceStorageMap(storageStack[eventDepth]);
                            structLogs.push(structLog);
                            next();
                    }
                }
            };
            const beforeTxListener = async (tx) => {
                if (tx === transaction) {
                    if (keys && contractAddress) {
                        const database = __classPrivateFieldGet(this, _database);
                        return Promise.all(keys.map(async (key) => {
                            // get the raw key using the hashed key
                            let rawKey = await database.storageKeys.get(key);
                            const result = await vm.stateManager.getContractStorage({ buf: ethereum_address_1.Address.from(contractAddress).toBuffer() }, rawKey);
                            storage[utils_1.Data.from(key, key.length).toString()] = {
                                key: utils_1.Data.from(rawKey, rawKey.length),
                                value: utils_1.Data.from(result, 32)
                            };
                        }));
                    }
                    vm.on("step", stepListener);
                }
            };
            const removeListeners = () => {
                vm.removeListener("step", stepListener);
                vm.removeListener("beforeTx", beforeTxListener);
            };
            // Listen to beforeTx so we know when our target transaction
            // is processing. This event will add the event listener for getting the trace data.
            vm.on("beforeTx", beforeTxListener);
            // Don't even let the vm try to flush the block's _cache to the stateTrie.
            // When forking some of the data that the traced function may request will
            // exist only on the main chain. Because we pretty much lie to the VM by
            // telling it we DO have data in our Trie, when we really don't, it gets
            // lost during the commit phase when it traverses the "borrowed" datum's
            // trie (as it may not have a valid root). Because this is a trace, and we
            // don't need to commit the data, duck punching the `flush` method (the
            // simplest method I could find) is fine.
            // Remove this and you may see the infamous
            // `Uncaught TypeError: Cannot read property 'pop' of undefined` error!
            vm.stateManager._cache.flush = () => { };
            // Process the block without committing the data.
            // The vmerr key on the result appears to be removed.
            // The previous implementation had specific error handling.
            // It's possible we've removed handling specific cases in this implementation.
            // e.g., the previous incantation of RuntimeError
            await run_transactions_1.runTransactions(vm, newBlock.transactions, newBlock);
            // Just to be safe
            removeListeners();
            // send state results back
            return {
                gas,
                structLogs,
                returnValue: "",
                storage
            };
        });
        _prepareNextBlock.set(this, (targetBlock, parentBlock, transactionHash) => {
            // Prepare the "next" block with necessary transactions
            const newBlock = new ethereum_block_1.RuntimeBlock(utils_1.Quantity.from((parentBlock.header.number.toBigInt() || 0n) + 1n), parentBlock.hash(), parentBlock.header.miner, parentBlock.header.gasLimit.toBuffer(), 
            // make sure we use the same timestamp as the target block
            targetBlock.header.timestamp, __classPrivateFieldGet(this, _options).miner.difficulty, parentBlock.header.totalDifficulty);
            newBlock.transactions = [];
            newBlock.uncleHeaders = [];
            const transactions = targetBlock.getTransactions();
            for (const tx of transactions) {
                newBlock.transactions.push(tx.toVmTransaction());
                // After including the target transaction, that's all we need to do.
                if (tx.hash.toBuffer().equals(transactionHash)) {
                    break;
                }
            }
            return newBlock;
        });
        __classPrivateFieldSet(this, _options, options);
        this.fallback = fallback;
        const instamine = (__classPrivateFieldSet(this, _instamine, !options.miner.blockTime || options.miner.blockTime <= 0));
        const legacyInstamine = options.miner.legacyInstamine;
        {
            // warnings and errors
            if (legacyInstamine) {
                console.info("Legacy instamining, where transactions are fully mined before the hash is returned, is deprecated and will be removed in the future.");
            }
            if (!instamine) {
                if (legacyInstamine) {
                    console.info("Setting `legacyInstamine` to `true` has no effect when blockTime is non-zero");
                }
                if (options.chain.vmErrorsOnRPCResponse) {
                    console.info("Setting `vmErrorsOnRPCResponse` to `true` has no effect on transactions when blockTime is non-zero");
                }
            }
        }
        this.coinbase = coinbase;
        __classPrivateFieldSet(this, _database, new database_1.default(options.database, this));
    }
    async initialize(initialAccounts) {
        const database = __classPrivateFieldGet(this, _database);
        const options = __classPrivateFieldGet(this, _options);
        const instamine = __classPrivateFieldGet(this, _instamine);
        let common;
        if (this.fallback) {
            await Promise.all([database.initialize(), this.fallback.initialize()]);
            common = this.common = this.fallback.common;
            options.fork.blockNumber = this.fallback.blockNumber.toNumber();
            options.chain.networkId = common.networkId();
            options.chain.chainId = common.chainId();
        }
        else {
            await database.initialize();
            common = this.common = createCommon(options.chain.chainId, options.chain.networkId, options.chain.hardfork);
        }
        const blocks = (this.blocks = await block_manager_1.default.initialize(this, common, database.blockIndexes, database.blocks));
        this.blockLogs = new blocklog_manager_1.default(database.blockLogs, this);
        this.transactions = new transaction_manager_1.default(options.miner, common, this, database.transactions);
        this.transactionReceipts = new transaction_receipt_manager_1.default(database.transactionReceipts, this);
        this.accounts = new account_manager_1.default(this);
        this.storageKeys = database.storageKeys;
        // if we have a latest block, use it to set up the trie.
        const { latest } = blocks;
        {
            let stateRoot;
            if (latest) {
                __classPrivateFieldSet(this, _blockBeingSavedPromise, Promise.resolve({
                    block: latest,
                    blockLogs: null
                }));
                ({ stateRoot } = latest.header);
            }
            else {
                stateRoot = null;
            }
            this.trie = makeTrie(this, database.trie, stateRoot);
        }
        // create VM and listen to step events
        this.vm = await this.createVmFromStateTrie(this.trie, options.chain.allowUnlimitedContractSize, true);
        {
            // create first block
            let firstBlockTime;
            if (options.chain.time != null) {
                // If we were given a timestamp, use it instead of the `_currentTime`
                const t = options.chain.time.getTime();
                firstBlockTime = Math.floor(t / 1000);
                this.setTime(t);
            }
            else {
                firstBlockTime = __classPrivateFieldGet(this, _currentTime).call(this);
            }
            // if we don't already have a latest block, create a genesis block!
            if (!latest) {
                if (initialAccounts.length > 0) {
                    await __classPrivateFieldGet(this, _commitAccounts).call(this, initialAccounts);
                }
                __classPrivateFieldSet(this, _blockBeingSavedPromise, __classPrivateFieldGet(this, _initializeGenesisBlock).call(this, firstBlockTime, options.miner.blockGasLimit, initialAccounts));
                blocks.earliest = blocks.latest = await __classPrivateFieldGet(this, _blockBeingSavedPromise).then(({ block }) => block);
            }
        }
        {
            // configure and start miner
            const txPool = this.transactions.transactionPool;
            const minerOpts = options.miner;
            const miner = (__classPrivateFieldSet(this, _miner, new miner_1.default(minerOpts, txPool.executables, instamine, this.vm, __classPrivateFieldGet(this, _readyNextBlock))));
            //#region automatic mining
            const nullResolved = Promise.resolve(null);
            const mineAll = (maxTransactions) => __classPrivateFieldGet(this, _isPaused).call(this) ? nullResolved : this.mine(maxTransactions);
            if (instamine) {
                // insta mining
                // whenever the transaction pool is drained mine the txs into blocks
                txPool.on("drain", mineAll.bind(null, 1));
            }
            else {
                // interval mining
                const wait = () => 
                // unref, so we don't hold the chain open if nothing can interact with it
                utils_1.unref((__classPrivateFieldSet(this, _timer, setTimeout(next, minerOpts.blockTime * 1e3))));
                const next = () => mineAll(-1).then(wait);
                wait();
            }
            //#endregion
            miner.on("block", __classPrivateFieldGet(this, _handleNewBlockData));
            this.once("stop").then(() => miner.clearListeners());
        }
        __classPrivateFieldSet(this, _state, Status.started);
        this.emit("ready");
    }
    pause() {
        __classPrivateFieldSet(this, _state, __classPrivateFieldGet(this, _state) | Status.paused);
    }
    resume(_threads = 1) {
        if (!__classPrivateFieldGet(this, _isPaused).call(this)) {
            console.log("Warning: startMining called when miner was already started");
            return;
        }
        // toggles the `paused` bit
        __classPrivateFieldSet(this, _state, __classPrivateFieldGet(this, _state) ^ Status.paused);
        // if we are instamining mine a block right away
        if (__classPrivateFieldGet(this, _instamine)) {
            return this.mine(-1);
        }
    }
    /**
     * @param seconds
     * @returns the total time offset *in milliseconds*
     */
    increaseTime(seconds) {
        if (seconds < 0) {
            seconds = 0;
        }
        return (__classPrivateFieldSet(this, _timeAdjustment, __classPrivateFieldGet(this, _timeAdjustment) + seconds));
    }
    /**
     * @param seconds
     * @returns the total time offset *in milliseconds*
     */
    setTime(timestamp) {
        return (__classPrivateFieldSet(this, _timeAdjustment, timestamp - Date.now()));
    }
    snapshot() {
        const snapshots = __classPrivateFieldGet(this, _snapshots);
        const snaps = snapshots.snaps;
        // Subscription ids are based on the number of active snapshots. Weird? Yes.
        // But it's the way it's been since the beginning so it just hasn't been
        // changed. Feel free to change it so ids are unique if it bothers you
        // enough.
        const id = snaps.push({
            block: this.blocks.latest,
            timeAdjustment: __classPrivateFieldGet(this, _timeAdjustment)
        });
        // start listening to new blocks if this is the first snapshot
        if (id === 1) {
            snapshots.unsubscribeFromBlocks = this.on("block", block => {
                snapshots.blocks = {
                    current: block.hash().toBuffer(),
                    next: snapshots.blocks
                };
            });
        }
        __classPrivateFieldGet(this, _options).logging.logger.log("Saved snapshot #" + id);
        return id;
    }
    async revert(snapshotId) {
        const rawValue = snapshotId.valueOf();
        if (rawValue === null || rawValue === undefined) {
            throw new Error("invalid snapshotId");
        }
        __classPrivateFieldGet(this, _options).logging.logger.log("Reverting to snapshot #" + snapshotId);
        // snapshot ids can't be < 1, so we do a quick sanity check here
        if (rawValue < 1n) {
            return false;
        }
        const snapshots = __classPrivateFieldGet(this, _snapshots);
        const snaps = snapshots.snaps;
        const snapshotIndex = Number(rawValue - 1n);
        const snapshot = snaps[snapshotIndex];
        if (!snapshot) {
            return false;
        }
        // pause processing new transactions...
        await this.transactions.pause();
        // then pause the miner, too.
        await __classPrivateFieldGet(this, _miner).pause();
        // wait for anything in the process of being saved to finish up
        await __classPrivateFieldGet(this, _blockBeingSavedPromise);
        // Pending transactions are always removed when you revert, even if they
        // were present before the snapshot was created. Ideally, we'd remove only
        // the new transactions.. but we'll leave that for another day.
        this.transactions.clear();
        const blocks = this.blocks;
        const currentHash = blocks.latest.hash().toBuffer();
        const snapshotBlock = snapshot.block;
        const snapshotHeader = snapshotBlock.header;
        const snapshotHash = snapshotBlock.hash().toBuffer();
        // remove this and all stored snapshots after this snapshot
        snaps.splice(snapshotIndex);
        // if there are no more listeners, stop listening to new blocks
        if (snaps.length === 0) {
            snapshots.unsubscribeFromBlocks();
        }
        // if the snapshot's hash is different than the latest block's hash we've
        // got new blocks to clean up.
        if (!currentHash.equals(snapshotHash)) {
            // if we've added blocks since we snapshotted we need to delete them and put
            // some things back the way they were.
            const blockPromises = [];
            let blockList = snapshots.blocks;
            while (blockList !== null) {
                if (blockList.current.equals(snapshotHash))
                    break;
                blockPromises.push(blocks.getByHash(blockList.current));
                blockList = blockList.next;
            }
            snapshots.blocks = blockList;
            await Promise.all(blockPromises).then(__classPrivateFieldGet(this, _deleteBlockData));
            setStateRootSync(this.vm.stateManager, snapshotHeader.stateRoot.toBuffer());
            blocks.latest = snapshotBlock;
        }
        // put our time adjustment back
        __classPrivateFieldSet(this, _timeAdjustment, snapshot.timeAdjustment);
        // resume mining
        __classPrivateFieldGet(this, _miner).resume();
        // resume processing transactions
        this.transactions.resume();
        return true;
    }
    async queueTransaction(transaction, secretKey) {
        // NOTE: this.transactions.add *must* be awaited before returning the
        // `transaction.hash()`, as the transactionPool may change the transaction
        // (and thus its hash!)
        // It may also throw Errors that must be returned to the caller.
        const isExecutable = (await this.transactions.add(transaction, secretKey)) === true;
        if (isExecutable) {
            process.nextTick(this.emit.bind(this), "pendingTransaction", transaction);
        }
        const hash = transaction.hash;
        if (__classPrivateFieldGet(this, _isPaused).call(this) || !__classPrivateFieldGet(this, _instamine)) {
            return hash;
        }
        else {
            if (__classPrivateFieldGet(this, _instamine) && __classPrivateFieldGet(this, _options).miner.legacyInstamine) {
                // in legacyInstamine mode we must wait for the transaction to be saved
                // before we can return the hash
                const { status, error } = await transaction.once("finalized");
                // in legacyInstamine mode we must throw on all rejected transaction
                // errors. We must also throw on `confirmed` transactions when
                // vmErrorsOnRPCResponse is enabled.
                if (error &&
                    (status === "rejected" || __classPrivateFieldGet(this, _options).chain.vmErrorsOnRPCResponse))
                    throw error;
            }
            return hash;
        }
    }
    async simulateTransaction(transaction, parentBlock) {
        let result;
        const data = transaction.data;
        let gasLeft = transaction.gas.toBigInt();
        // subtract out the transaction's base fee from the gas limit before
        // simulating the tx, because `runCall` doesn't account for raw gas costs.
        const hasToAddress = transaction.to != null;
        let to = null;
        if (hasToAddress) {
            const toBuf = transaction.to.toBuffer();
            to = {
                equals: (a) => toBuf.equals(a.buf),
                buf: toBuf
            };
        }
        else {
            to = null;
        }
        gasLeft -= ethereum_transaction_1.calculateIntrinsicGas(data, hasToAddress, this.common);
        if (gasLeft >= 0n) {
            const stateTrie = this.trie.copy(false);
            stateTrie.setContext(parentBlock.header.stateRoot.toBuffer(), null, parentBlock.header.number);
            const vm = await this.createVmFromStateTrie(stateTrie, __classPrivateFieldGet(this, _options).chain.allowUnlimitedContractSize, false);
            // take a checkpoint so the `runCall` never writes to the trie. We don't
            // commit/revert later because this stateTrie is ephemeral anyway.
            vm.stateManager.checkpoint();
            const caller = transaction.from.toBuffer();
            result = await vm.runCall({
                caller: {
                    buf: caller,
                    equals: (a) => caller.equals(a.buf)
                },
                data: transaction.data && transaction.data.toBuffer(),
                gasPrice: new ethereumjs_util_1.BN(transaction.gasPrice.toBuffer()),
                gasLimit: new ethereumjs_util_1.BN(utils_1.Quantity.from(gasLeft).toBuffer()),
                to,
                value: transaction.value == null
                    ? new ethereumjs_util_1.BN(0)
                    : new ethereumjs_util_1.BN(transaction.value.toBuffer()),
                block: transaction.block
            });
        }
        else {
            result = {
                execResult: {
                    runState: { programCounter: 0 },
                    exceptionError: new exceptions_1.VmError(exceptions_1.ERROR.OUT_OF_GAS),
                    returnValue: utils_1.BUFFER_EMPTY
                }
            };
        }
        if (result.execResult.exceptionError) {
            if (__classPrivateFieldGet(this, _options).chain.vmErrorsOnRPCResponse) {
                // eth_call transactions don't really have a transaction hash
                const hash = utils_1.RPCQUANTITY_EMPTY;
                throw new ethereum_utils_1.RuntimeError(hash, result, ethereum_utils_1.RETURN_TYPES.RETURN_VALUE);
            }
            else {
                return utils_1.Data.from(result.execResult.returnValue || "0x");
            }
        }
        else {
            return utils_1.Data.from(result.execResult.returnValue || "0x");
        }
    }
    /**
     * traceTransaction
     *
     * Run a previously-run transaction in the same state in which it occurred at the time it was run.
     * This will return the vm-level trace output for debugging purposes.
     *
     * Strategy:
     *
     *  1. Find block where transaction occurred
     *  2. Set state root of that block
     *  3. Rerun every transaction in that block prior to and including the requested transaction
     *  4. Send trace results back.
     *
     * @param transactionHash
     * @param options
     */
    async traceTransaction(transactionHash, options) {
        const transactionHashBuffer = utils_1.Data.from(transactionHash).toBuffer();
        // #1 - get block via transaction object
        const transaction = await this.transactions.get(transactionHashBuffer);
        if (!transaction) {
            throw new Error("Unknown transaction " + transactionHash);
        }
        const targetBlock = await this.blocks.get(transaction.blockNumber.toBuffer());
        const parentBlock = await this.blocks.getByHash(targetBlock.header.parentHash.toBuffer());
        const newBlock = __classPrivateFieldGet(this, _prepareNextBlock).call(this, targetBlock, parentBlock, transactionHashBuffer);
        // only copy relevant transactions
        newBlock.transactions = newBlock.transactions.slice(0, 1 + transaction.index.toNumber());
        // #2 - Set state root of original block
        //
        // TODO: Forking needs the forked block number passed during this step:
        // https://github.com/trufflesuite/ganache/blob/develop/lib/blockchain_double.js#L917
        const trie = this.trie.copy();
        trie.setContext(parentBlock.header.stateRoot.toBuffer(), null, parentBlock.header.number);
        // #3 - Rerun every transaction in block prior to and including the requested transaction
        const { gas, structLogs, returnValue, storage } = await __classPrivateFieldGet(this, _traceTransaction).call(this, trie, newBlock, options);
        // #4 - Send results back
        return { gas, structLogs, returnValue, storage };
    }
    /**
     * storageRangeAt
     *
     * Returns a contract's storage given a starting key and max number of
     * entries to return.
     *
     * Strategy:
     *
     *  1. Find block where transaction occurred
     *  2. Set state root of that block
     *  3. Use contract address storage trie to get the storage keys from the transaction
     *  4. Sort and filter storage keys using the startKey and maxResult
     *  5. Rerun every transaction in that block prior to and including the requested transaction
     *  6. Send storage results back
     *
     * @param blockHash
     * @param txIndex
     * @param contractAddress
     * @param startKey
     * @param maxResult
     */
    async storageRangeAt(blockHash, txIndex, contractAddress, startKey, maxResult) {
        // #1 - get block information
        const targetBlock = await this.blocks.getByHash(blockHash);
        // get transaction using txIndex
        const transactions = targetBlock.getTransactions();
        const transaction = transactions[txIndex];
        if (!transaction) {
            throw new Error(`transaction index ${txIndex} is out of range for block ${blockHash}`);
        }
        // #2 - set state root of block
        const parentBlock = await this.blocks.getByHash(targetBlock.header.parentHash.toBuffer());
        const trie = makeTrie(this, __classPrivateFieldGet(this, _database).trie, parentBlock.header.stateRoot);
        // get the contractAddress account storage trie
        const contractAddressBuffer = ethereum_address_1.Address.from(contractAddress).toBuffer();
        const addressData = await trie.get(contractAddressBuffer);
        if (!addressData) {
            throw new Error(`account ${contractAddress} doesn't exist`);
        }
        // #3 - use the contractAddress storage trie to get relevant hashed keys
        const getStorageKeys = () => {
            const storageTrie = trie.copy(false);
            // An address's stateRoot is stored in the 3rd rlp entry
            storageTrie.setContext(rlp_1.decode(addressData)[2], contractAddressBuffer, parentBlock.header.number);
            return new Promise((resolve, reject) => {
                const startKeyBuffer = utils_1.Data.from(startKey).toBuffer();
                const compare = (a, b) => a.compare(b) < 0;
                const keys = [];
                const handleData = ({ key }) => {
                    // ignore anything that comes before our starting point
                    if (startKeyBuffer.compare(key) > 0)
                        return;
                    // #4 - sort and filter keys
                    // insert the key exactly where it needs to go in the array
                    const position = utils_1.findInsertPosition(keys, key, compare);
                    // ignore if the value couldn't possibly be relevant
                    if (position > maxResult)
                        return;
                    keys.splice(position, 0, key);
                };
                const handleEnd = () => {
                    if (keys.length > maxResult) {
                        // we collected too much data, so we've got to trim it a bit
                        resolve({
                            // only take the maximum number of entries requested
                            keys: keys.slice(0, maxResult),
                            // assign nextKey
                            nextKey: utils_1.Data.from(keys[maxResult])
                        });
                    }
                    else {
                        resolve({
                            keys,
                            nextKey: null
                        });
                    }
                };
                const rs = storageTrie.createReadStream();
                rs.on("data", handleData).on("error", reject).on("end", handleEnd);
            });
        };
        const { keys, nextKey } = await getStorageKeys();
        // #5 -  rerun every transaction in that block prior to and including the requested transaction
        // prepare block to be run in traceTransaction
        const transactionHashBuffer = transaction.hash.toBuffer();
        const newBlock = __classPrivateFieldGet(this, _prepareNextBlock).call(this, targetBlock, parentBlock, transactionHashBuffer);
        // get storage data given a set of keys
        const options = {
            disableMemory: true,
            disableStack: true,
            disableStorage: false
        };
        const { storage } = await __classPrivateFieldGet(this, _traceTransaction).call(this, trie, newBlock, options, keys, contractAddressBuffer);
        // #6 - send back results
        return {
            storage,
            nextKey
        };
    }
    /**
     * Gracefully shuts down the blockchain service and all of its dependencies.
     */
    async stop() {
        // If the blockchain is still initalizing we don't want to shut down
        // yet because there may still be database calls in flight. Leveldb may
        // cause a segfault due to a race condition between a db write and the close
        // call.
        if (__classPrivateFieldGet(this, _state) === Status.starting) {
            await this.once("ready");
        }
        // stop the polling miner, if necessary
        clearTimeout(__classPrivateFieldGet(this, _timer));
        // clean up listeners
        this.vm.removeAllListeners();
        // pause processing new transactions...
        await this.transactions.pause();
        // then pause the miner, too.
        await __classPrivateFieldGet(this, _miner).pause();
        // wait for anything in the process of being saved to finish up
        await __classPrivateFieldGet(this, _blockBeingSavedPromise);
        this.fallback && (await this.fallback.close());
        await this.emit("stop");
        if (__classPrivateFieldGet(this, _state) === Status.started) {
            __classPrivateFieldSet(this, _state, Status.stopping);
            await __classPrivateFieldGet(this, _database).close();
            __classPrivateFieldSet(this, _state, Status.stopped);
        }
    }
}
exports.default = Blockchain;
_state = new WeakMap(), _miner = new WeakMap(), _blockBeingSavedPromise = new WeakMap(), _timer = new WeakMap(), _database = new WeakMap(), _options = new WeakMap(), _instamine = new WeakMap(), _saveNewBlock = new WeakMap(), _emitNewBlock = new WeakMap(), _getTransactionLogOutput = new WeakMap(), _handleNewBlockData = new WeakMap(), _readyNextBlock = new WeakMap(), _isPaused = new WeakMap(), _commitAccounts = new WeakMap(), _initializeGenesisBlock = new WeakMap(), _timeAdjustment = new WeakMap(), _currentTime = new WeakMap(), _deleteBlockData = new WeakMap(), _snapshots = new WeakMap(), _traceTransaction = new WeakMap(), _prepareNextBlock = new WeakMap();
//# sourceMappingURL=blockchain.js.map
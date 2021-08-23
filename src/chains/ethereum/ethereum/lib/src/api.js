"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var _getId, _filters, _subscriptions, _options, _blockchain, _wallet;
Object.defineProperty(exports, "__esModule", { value: true });
//#region Imports
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const ethereum_block_1 = require("@ganache/ethereum-block");
const ethereum_transaction_1 = require("@ganache/ethereum-transaction");
const ethereumjs_util_1 = require("ethereumjs-util");
const eth_sig_util_1 = require("eth-sig-util");
const utils_1 = require("@ganache/utils");
const wallet_1 = __importDefault(require("./wallet"));
const gas_estimator_1 = __importDefault(require("./helpers/gas-estimator"));
const assert_arg_length_1 = require("./helpers/assert-arg-length");
const filter_parsing_1 = require("./helpers/filter-parsing");
const rlp_1 = require("@ganache/rlp");
const ethereum_address_1 = require("@ganache/ethereum-address");
// Read in the current ganache version from core's package.json
const { version } = { "version": "7.0.0-canary.1341" };
//#endregion
//#region Constants
const CLIENT_VERSION = `Ganache/v${version}/EthereumJS TestRPC/v${version}/ethereum-js`;
const PROTOCOL_VERSION = utils_1.Data.from("0x3f");
const RPC_MODULES = {
    eth: "1.0",
    net: "1.0",
    rpc: "1.0",
    web3: "1.0",
    evm: "1.0",
    personal: "1.0"
};
//#endregion
//#region helpers
function assertExceptionalTransactions(transactions) {
    let baseError = null;
    let errors;
    const data = {};
    transactions.forEach(transaction => {
        if (transaction.execException) {
            if (baseError) {
                baseError = ethereum_utils_1.VM_EXCEPTIONS;
                errors.push(`${transaction.hash.toString()}: ${transaction.execException}\n`);
                data[transaction.execException.data.hash] =
                    transaction.execException.data;
            }
            else {
                baseError = ethereum_utils_1.VM_EXCEPTION;
                errors = [transaction.execException.message];
                data[transaction.execException.data.hash] =
                    transaction.execException.data;
            }
        }
    });
    if (baseError) {
        const err = new Error(baseError + errors.join("\n"));
        err.data = data;
        throw err;
    }
}
//#endregion helpers
class EthereumApi {
    /**
     * This is the Ethereum API that the provider interacts with.
     * The only methods permitted on the prototype are the supported json-rpc
     * methods.
     * @param options
     * @param wallet
     * @param emitter
     */
    constructor(options, wallet, blockchain) {
        _getId.set(this, (id => () => utils_1.Quantity.from(++id))(0));
        _filters.set(this, new Map());
        _subscriptions.set(this, new Map());
        _options.set(this, void 0);
        _blockchain.set(this, void 0);
        _wallet.set(this, void 0);
        __classPrivateFieldSet(this, _options, options);
        __classPrivateFieldSet(this, _wallet, wallet);
        __classPrivateFieldSet(this, _blockchain, blockchain);
    }
    //#region db
    /**
     * Stores a string in the local database.
     *
     * @param dbName - Database name.
     * @param key - Key name.
     * @param value - String to store.
     * @returns returns true if the value was stored, otherwise false.
     * @example
     * ```javascript
     * console.log(await provider.send("db_putString", ["testDb", "testKey", "testValue"] ));
     * ```
     */
    async db_putString(dbName, key, value) {
        return false;
    }
    /**
     * Returns string from the local database.
     *
     * @param dbName - Database name.
     * @param key - Key name.
     * @returns The previously stored string.
     * @example
     * ```javascript
     * console.log(await provider.send("db_getString", ["testDb", "testKey"] ));
     * ```
     */
    async db_getString(dbName, key) {
        return "";
    }
    /**
     * Stores binary data in the local database.
     *
     * @param dbName - Database name.
     * @param key - Key name.
     * @param data - Data to store.
     * @returns true if the value was stored, otherwise false.
     * @example
     * ```javascript
     * console.log(await provider.send("db_putHex", ["testDb", "testKey", "0x0"] ));
     * ```
     */
    async db_putHex(dbName, key, data) {
        return false;
    }
    /**
     * Returns binary data from the local database.
     *
     * @param dbName - Database name.
     * @param key - Key name.
     * @returns The previously stored data.
     * @example
     * ```javascript
     * console.log(await provider.send("db_getHex", ["testDb", "testKey"] ));
     * ```
     */
    async db_getHex(dbName, key) {
        return "0x00";
    }
    //#endregion
    //#region bzz
    /**
     * Returns the kademlia table in a readable table format.
     * @returns Returns the kademlia table in a readable table format.
     * @example
     * ```javascript
     * console.log(await provider.send("bzz_hive"));
     * ```
     */
    async bzz_hive() {
        return [];
    }
    /**
     * Returns details about the swarm node.
     * @returns Returns details about the swarm node.
     * @example
     * ```javascript
     * console.log(await provider.send("bzz_info"));
     * ```
     */
    async bzz_info() {
        return [];
    }
    async evm_mine(arg) {
        const blockchain = __classPrivateFieldGet(this, _blockchain);
        const vmErrorsOnRPCResponse = __classPrivateFieldGet(this, _options).chain.vmErrorsOnRPCResponse;
        // Since `typeof null === "object"` we have to guard against that
        if (arg !== null && typeof arg === "object") {
            let { blocks, timestamp } = arg;
            if (blocks == null) {
                blocks = 1;
            }
            // TODO(perf): add an option to mine a bunch of blocks in a batch so
            // we can save them all to the database in one go.
            // Developers like to move the blockchain forward by thousands of blocks
            // at a time and doing this would make it way faster
            for (let i = 0; i < blocks; i++) {
                const transactions = await blockchain.mine(-1, timestamp, true);
                if (vmErrorsOnRPCResponse) {
                    assertExceptionalTransactions(transactions);
                }
            }
        }
        else {
            const transactions = await blockchain.mine(-1, arg, true);
            if (vmErrorsOnRPCResponse) {
                assertExceptionalTransactions(transactions);
            }
        }
        return "0x0";
    }
    /**
     * Sets the given account's nonce to the specified value. Mines a new block
     * before returning.
     *
     * Warning: this will result in an invalid state tree.
     *
     * @param address - The account address to update.
     * @param nonce - The nonce value to be set.
     * @returns `true` if it worked, otherwise `false`.
     * @example
     * ```javascript
     * const nonce = "0x3e8";
     * const [address] = await provider.request({ method: "eth_accounts", params: [] });
     * const result = await provider.send("evm_setAccountNonce", [address, nonce] );
     * console.log(result);
     * ```
     */
    async evm_setAccountNonce(address, nonce) {
        // TODO: the effect of this function could happen during a block mine operation, which would cause all sorts of
        // issues. We need to figure out a good way of timing this.
        const buffer = ethereum_address_1.Address.from(address).toBuffer();
        const blockchain = __classPrivateFieldGet(this, _blockchain);
        const stateManager = blockchain.vm.stateManager;
        const account = await stateManager.getAccount({ buf: buffer });
        account.nonce = {
            toArrayLike: () => utils_1.Quantity.from(nonce).toBuffer()
        };
        await stateManager.putAccount({ buf: buffer }, account);
        // TODO: do we need to mine a block here? The changes we're making really don't make any sense at all
        // and produce an invalid trie going forward.
        await blockchain.mine(0);
        return true;
    }
    /**
     * Jump forward in time by the given amount of time, in seconds.
     * @param seconds Number of seconds to jump forward in time by. Must be greater than or equal to `0`.
     * @returns Returns the total time adjustment, in seconds.
     * @example
     * ```javascript
     * const seconds = 10;
     * const timeAdjustment = await provider.send("evm_increaseTime", [seconds] );
     * console.log(timeAdjustment);
     * ```
     */
    async evm_increaseTime(seconds) {
        const milliseconds = (typeof seconds === "number"
            ? seconds
            : utils_1.Quantity.from(seconds).toNumber()) * 1000;
        return Math.floor(__classPrivateFieldGet(this, _blockchain).increaseTime(milliseconds) / 1000);
    }
    /**
     * Sets the internal clock time to the given timestamp.
     *
     * Warning: This will allow you to move *backwards* in time, which may cause
     * new blocks to appear to be mined before old blocks. This is will result in
     * an invalid state.
     *
     * @param time JavaScript timestamp (millisecond precision).
     * @returns The amount of *seconds* between the given timestamp and now.
     * @example
     * ```javascript
     * const currentDate = Date.now();
     * setTimeout(async () => {
     *   const time = await provider.send("evm_setTime", [currentDate] );
     *   console.log(time); // should be about two seconds ago
     * }, 1000);
     * ```
     */
    async evm_setTime(time) {
        let t;
        switch (typeof time) {
            case "object":
                t = time.getTime();
                break;
            case "number":
                t = time;
                break;
            default:
                t = utils_1.Quantity.from(time).toNumber();
                break;
        }
        return Math.floor(__classPrivateFieldGet(this, _blockchain).setTime(t) / 1000);
    }
    /**
     * Revert the state of the blockchain to a previous snapshot. Takes a single
     * parameter, which is the snapshot id to revert to. This deletes the given
     * snapshot, as well as any snapshots taken after (Ex: reverting to id 0x1
     * will delete snapshots with ids 0x1, 0x2, etc... If no snapshot id is
     * passed it will revert to the latest snapshot.
     *
     * @param snapshotId The snapshot id to revert.
     * @returns `true` if a snapshot was reverted, otherwise `false`.
     *
     * @example
     * ```javascript
     * const [from, to] = await provider.send("eth_accounts");
     * const startingBalance = BigInt(await provider.send("eth_getBalance", [from] ));
     *
     * // take a snapshot
     * const snapshotId = await provider.send("evm_snapshot");
     *
     * // send value to another account (over-simplified example)
     * await provider.send("eth_subscribe", ["newHeads"] );
     * await provider.send("eth_sendTransaction", [{from, to, value: "0xffff"}] );
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     *
     * // ensure balance has updated
     * const newBalance = await provider.send("eth_getBalance", [from] );
     * assert(BigInt(newBalance) < startingBalance);
     *
     * // revert the snapshot
     * const isReverted = await provider.send("evm_revert", [snapshotId] );
     * assert(isReverted);
     * console.log({isReverted: isReverted});
     *
     * // ensure balance has reverted
     * const endingBalance = await provider.send("eth_getBalance", [from] );
     * const isBalanceReverted = assert.strictEqual(BigInt(endingBalance), startingBalance);
     * console.log({isBalanceReverted: isBalanceReverted});
     * ```
     */
    async evm_revert(snapshotId) {
        return __classPrivateFieldGet(this, _blockchain).revert(utils_1.Quantity.from(snapshotId));
    }
    /**
     * Snapshot the state of the blockchain at the current block. Takes no
     * parameters. Returns the id of the snapshot that was created. A snapshot can
     * only be reverted once. After a successful `evm_revert`, the same snapshot
     * id cannot be used again. Consider creating a new snapshot after each
     * `evm_revert` if you need to revert to the same point multiple times.
     *
     * @returns The hex-encoded identifier for this snapshot.
     *
     * @example
     * ```javascript
     * const provider = ganache.provider();
     * const [from, to] = await provider.send("eth_accounts");
     * const startingBalance = BigInt(await provider.send("eth_getBalance", [from] ));
     *
     * // take a snapshot
     * const snapshotId = await provider.send("evm_snapshot");
     *
     * // send value to another account (over-simplified example)
     * await provider.send("eth_subscribe", ["newHeads"] );
     * await provider.send("eth_sendTransaction", [{from, to, value: "0xffff"}] );
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     *
     * // ensure balance has updated
     * const newBalance = await provider.send("eth_getBalance", [from] );
     * assert(BigInt(newBalance) < startingBalance);
     *
     * // revert the snapshot
     * const isReverted = await provider.send("evm_revert", [snapshotId] );
     * assert(isReverted);
     *
     * // ensure balance has reverted
     * const endingBalance = await provider.send("eth_getBalance", [from] );
     * const isBalanceReverted = assert.strictEqual(BigInt(endingBalance), startingBalance);
     * console.log({isBalanceReverted: isBalanceReverted});
     * ```
     */
    async evm_snapshot() {
        return utils_1.Quantity.from(__classPrivateFieldGet(this, _blockchain).snapshot());
    }
    /**
     * Unlocks any unknown account.
     *
     * Note: accounts known to the `personal` namespace and accounts returned by
     * `eth_accounts` cannot be unlocked using this method.
     *
     * @param address The address of the account to unlock.
     * @param duration (Default: disabled) Duration in seconds how long the account
     * should remain unlocked for. Set to 0 to disable automatic locking.
     * @returns `true` if the account was unlocked successfully, `false` if the
     * account was already unlocked. Throws an error if the account could not be
     * unlocked.
     * @example
     * ```javascript
     * const address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
     * const result = await provider.send("evm_unlockUnknownAccount", [address] );
     * console.log(result);
     * ```
     */
    async evm_unlockUnknownAccount(address, duration = 0) {
        return __classPrivateFieldGet(this, _wallet).unlockUnknownAccount(address.toLowerCase(), duration);
    }
    /**
     * Locks any unknown account.
     *
     * Note: accounts known to the `personal` namespace and accounts returned by
     * `eth_accounts` cannot be locked using this method.
     *
     * @param address The address of the account to lock.
     * @returns `true` if the account was locked successfully, `false` if the
     * account was already locked. Throws an error if the account could not be
     * locked.
     * @example
     * ```javascript
     * const address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
     * const result = await provider.send("evm_lockUnknownAccount", [address] );
     * console.log(result);
     * ```
     */
    async evm_lockUnknownAccount(address) {
        const lowerAddress = address.toLowerCase();
        // if this is a known account we can't unlock it this way
        if (__classPrivateFieldGet(this, _wallet).knownAccounts.has(lowerAddress)) {
            throw new Error("cannot lock known/personal account");
        }
        return __classPrivateFieldGet(this, _wallet).lockAccount(lowerAddress);
    }
    //#endregion evm
    //#region miner
    /**
     * Resume the CPU mining process with the given number of threads.
     *
     * Note: `threads` is ignored.
     * @param threads Number of threads to resume the CPU mining process with.
     * @returns `true`.
     * @example
     * ```javascript
     * await provider.send("miner_stop");
     * // check that eth_mining returns false
     * console.log(await provider.send("eth_mining"));
     * await provider.send("miner_start");
     * // check that eth_mining returns true
     * console.log(await provider.send("eth_mining"));
     * ```
     */
    async miner_start(threads = 1) {
        if (__classPrivateFieldGet(this, _options).miner.legacyInstamine === true) {
            const transactions = await __classPrivateFieldGet(this, _blockchain).resume(threads);
            if (transactions != null && __classPrivateFieldGet(this, _options).chain.vmErrorsOnRPCResponse) {
                assertExceptionalTransactions(transactions);
            }
        }
        else {
            __classPrivateFieldGet(this, _blockchain).resume(threads);
        }
        return true;
    }
    /**
     * Stop the CPU mining operation.
     * @returns `true`.
     * @example
     * ```javascript
     * // check that eth_mining returns true
     * console.log(await provider.send("eth_mining"));
     * await provider.send("miner_stop");
     * // check that eth_mining returns false
     * console.log(await provider.send("eth_mining"));
     * ```
     */
    async miner_stop() {
        __classPrivateFieldGet(this, _blockchain).pause();
        return true;
    }
    /**
     * Sets the default accepted gas price when mining transactions.
     * Any transactions that don't specify a gas price will use this amount.
     * Transactions that are below this limit are excluded from the mining process.
     * @param number Default accepted gas price.
     * @returns `true`.
     * @example
     * ```javascript
     * console.log(await provider.send("miner_setGasPrice", [300000] ));
     * ```
     */
    async miner_setGasPrice(number) {
        __classPrivateFieldGet(this, _options).miner.defaultGasPrice = utils_1.Quantity.from(number);
        return true;
    }
    /**
     * Sets the etherbase, where mining rewards will go.
     * @param address The address where the mining rewards will go.
     * @returns `true`.
     * @example
     * ```javascript
     * const [account] = await provider.request({ method: "eth_accounts", params: [] });
     * console.log(await provider.send("miner_setEtherbase", [account] ));
     * ```
     */
    async miner_setEtherbase(address) {
        __classPrivateFieldGet(this, _blockchain).coinbase = ethereum_address_1.Address.from(address);
        return true;
    }
    /**
     * Set the extraData block header field a miner can include.
     * @param extra The `extraData` to include.
     * @returns If successfully set returns `true`, otherwise returns an error.
     * @example
     * ```javascript
     * console.log(await provider.send("miner_setExtra", ["0x0"] ));
     * ```
     */
    async miner_setExtra(extra) {
        const bytes = utils_1.Data.from(extra);
        const length = bytes.toBuffer().length;
        if (length > 32) {
            throw new Error(`extra exceeds max length. ${length} > 32`);
        }
        __classPrivateFieldGet(this, _options).miner.extraData = bytes;
        return true;
    }
    //#endregion
    //#region web3
    /**
     * Returns the current client version.
     * @returns The current client version.
     * @example
     * ```javascript
     * console.log(await provider.send("web3_clientVersion"));
     * ```
     */
    async web3_clientVersion() {
        return CLIENT_VERSION;
    }
    /**
     * Returns Keccak-256 (not the standardized SHA3-256) of the given data.
     * @param data - the data to convert into a SHA3 hash.
     * @returns The SHA3 result of the given string.
     * @example
     * ```javascript
     * const data = "hello trufflers";
     * const sha3 = await provider.send("web3_sha3", [data] );
     * console.log(sha3);
     * ```
     */
    async web3_sha3(data) {
        return utils_1.Data.from(utils_1.keccak(Buffer.from(data)));
    }
    //#endregion
    //#region net
    /**
     * Returns the current network id.
     * @returns The current network id. This value should NOT be JSON-RPC
     * Quantity/Data encoded.
     * @example
     * ```javascript
     * console.log(await provider.send("net_version"));
     * ```
     */
    async net_version() {
        return __classPrivateFieldGet(this, _options).chain.networkId.toString();
    }
    /**
     * Returns `true` if client is actively listening for network connections.
     * @returns `true` when listening, otherwise `false`.
     * @example
     * ```javascript
     * console.log(await provider.send("net_listening"));
     * ```
     */
    async net_listening() {
        return true;
    }
    /**
     * Returns number of peers currently connected to the client.
     * @returns Number of connected peers.
     * @example
     * ```javascript
     * console.log(await provider.send("net_peerCount"));
     * ```
     */
    async net_peerCount() {
        return utils_1.RPCQUANTITY_ZERO;
    }
    //#endregion
    //#region eth
    // TODO: example doesn't return correct value
    /**
     * Generates and returns an estimate of how much gas is necessary to allow the
     * transaction to complete. The transaction will not be added to the
     * blockchain. Note that the estimate may be significantly more than the
     * amount of gas actually used by the transaction, for a variety of reasons
     * including EVM mechanics and node performance.
     *
     * Transaction call object:
     * * `from`: `DATA`, 20 bytes (optional) - The address the transaction is sent from.
     * * `to`: `DATA`, 20 bytes - The address the transaction is sent to.
     * * `gas`: `QUANTITY` (optional) - Integer of the maximum gas allowance for the transaction.
     * * `gasPrice`: `QUANTITY` (optional) - Integer of the price of gas in wei.
     * * `value`: `QUANTITY` (optional) - Integer of the value in wei.
     * * `data`: `DATA` (optional) - Hash of the method signature and the ABI encoded parameters.
     *
     * @param transaction The transaction call object as seen in source.
     * @param blockNumber Integer block number, or the string "latest", "earliest"
     *  or "pending".
     *
     * @returns The amount of gas used.
     *
     * @example
     * ```javascript
     * const [from, to] = await provider.request({ method: "eth_accounts", params: [] });
     * const gasEstimate = await provider.request({ method: "eth_estimateGas", params: [{ from, to }, "latest" ] });
     * console.log(gasEstimate);
     * ```
     */
    async eth_estimateGas(transaction, blockNumber = ethereum_utils_1.Tag.LATEST) {
        const blockchain = __classPrivateFieldGet(this, _blockchain);
        const blocks = blockchain.blocks;
        const parentBlock = await blocks.get(blockNumber);
        const parentHeader = parentBlock.header;
        const options = __classPrivateFieldGet(this, _options);
        const generateVM = () => {
            return blockchain.vm.copy();
        };
        return new Promise((resolve, reject) => {
            const { coinbase } = blockchain;
            const tx = new ethereum_transaction_1.RuntimeTransaction(transaction, __classPrivateFieldGet(this, _blockchain).common);
            if (tx.from == null) {
                tx.from = coinbase;
            }
            if (tx.gas.isNull()) {
                // eth_estimateGas isn't subject to regular transaction gas limits
                tx.gas = options.miner.callGasLimit;
            }
            const block = new ethereum_block_1.RuntimeBlock(utils_1.Quantity.from((parentHeader.number.toBigInt() || 0n) + 1n), parentHeader.parentHash, parentHeader.miner, tx.gas.toBuffer(), parentHeader.timestamp, options.miner.difficulty, parentHeader.totalDifficulty);
            const runArgs = {
                tx: tx.toVmTransaction(),
                block,
                skipBalance: true,
                skipNonce: true
            };
            gas_estimator_1.default(generateVM, runArgs, (err, result) => {
                if (err)
                    return reject(err);
                resolve(utils_1.Quantity.from(result.gasEstimate.toArrayLike(Buffer)));
            });
        });
    }
    /**
     * Returns the current ethereum protocol version.
     * @returns The current ethereum protocol version.
     * @example
     * ```javascript
     * const version = await provider.request({ method: "eth_protocolVersion", params: [] });
     * console.log(version);
     * ```
     */
    async eth_protocolVersion() {
        return PROTOCOL_VERSION;
    }
    /**
     * Returns an object containing data about the sync status or `false` when not syncing.
     *
     * @returns An object with sync status data or `false`, when not syncing.
     *
     * * `startingBlock`: {bigint} The block at which the import started (will
     *     only be reset, after the sync reached his head).
     * * `currentBlock`: {bigint} The current block, same as `eth_blockNumber`.
     * * `highestBlock`: {bigint} The estimated highest block.
     *
     * @example
     * ```javascript
     * const result = await provider.request({ method: "eth_syncing", params: [] });
     * console.log(result);
     * ```
     */
    async eth_syncing() {
        return false;
    }
    /**
     * Returns the client coinbase address.
     * @returns The current coinbase address.
     * @example
     * ```javascript
     * const coinbaseAddress = await provider.request({ method: "eth_coinbase" });
     * console.log(coinbaseAddress);
     * ```
     */
    async eth_coinbase() {
        return __classPrivateFieldGet(this, _blockchain).coinbase;
    }
    /**
     * Returns information about a block by block number.
     * @param number Integer of a block number, or the string "earliest", "latest" or "pending", as in the
     * default block parameter.
     * @param transactions If `true` it returns the full transaction objects, if `false` only the hashes of the
     * transactions.
     * @returns The block, `null` if the block doesn't exist.
     *
     * * `hash`: `DATA`, 32 Bytes - Hash of the block. `null` when pending.
     * * `parentHash`: `DATA`, 32 Bytes - Hash of the parent block.
     * * `sha3Uncles`: `DATA`, 32 Bytes - SHA3 of the uncles data in the block.
     * * `miner`: `DATA`, 20 Bytes -  Address of the miner.
     * * `stateRoot`: `DATA`, 32 Bytes - The root of the state trie of the block.
     * * `transactionsRoot`: `DATA`, 32 Bytes - The root of the transaction trie of the block.
     * * `receiptsRoot`: `DATA`, 32 Bytes - The root of the receipts trie of the block.
     * * `logsBloom`: `DATA`, 256 Bytes - The bloom filter for the logs of the block. `null` when pending.
     * * `difficulty`: `QUANTITY` - Integer of the difficulty of this block.
     * * `number`: `QUANTITY` - The block number. `null` when pending.
     * * `gasLimit`: `QUANTITY` - The maximum gas allowed in the block.
     * * `gasUsed`: `QUANTITY` - Total gas used by all transactions in the block.
     * * `timestamp`: `QUANTITY` - The unix timestamp for when the block was collated.
     * * `extraData`: `DATA` - Extra data for the block.
     * * `mixHash`: `DATA`, 256 Bytes - Hash identifier for the block.
     * * `nonce`: `DATA`, 8 Bytes - Hash of the generated proof-of-work. `null` when pending.
     * * `totalDifficulty`: `QUANTITY` - Integer of the total difficulty of the chain until this block.
     * * `size`: `QUANTITY` - Integer the size of the block in bytes.
     * * `transactions`: `Array` - Array of transaction objects or 32 Bytes transaction hashes depending on the last parameter.
     * * `uncles`: `Array` - Array of uncle hashes.
     *
     * @example
     * ```javascript
     * const block = await provider.request({ method: "eth_getBlockByNumber", params: ["0x0", false] });
     * console.log(block);
     * ```
     */
    async eth_getBlockByNumber(number, transactions = false) {
        const block = await __classPrivateFieldGet(this, _blockchain).blocks.get(number).catch(_ => null);
        return block ? block.toJSON(transactions) : null;
    }
    /**
     * Returns information about a block by block hash.
     * @param hash Hash of a block.
     * @param transactions If `true` it returns the full transaction objects, if `false` only the hashes of the
     * transactions.
     * @returns The block, `null` if the block doesn't exist.
     *
     * * `hash`: `DATA`, 32 Bytes - Hash of the block. `null` when pending.
     * * `parentHash`: `DATA`, 32 Bytes - Hash of the parent block.
     * * `sha3Uncles`: `DATA`, 32 Bytes - SHA3 of the uncles data in the block.
     * * `miner`: `DATA`, 20 Bytes -  Address of the miner.
     * * `stateRoot`: `DATA`, 32 Bytes - The root of the state trie of the block.
     * * `transactionsRoot`: `DATA`, 32 Bytes - The root of the transaction trie of the block.
     * * `receiptsRoot`: `DATA`, 32 Bytes - The root of the receipts trie of the block.
     * * `logsBloom`: `DATA`, 256 Bytes - The bloom filter for the logs of the block. `null` when pending.
     * * `difficulty`: `QUANTITY` - Integer of the difficulty of this block.
     * * `number`: `QUANTITY` - The block number. `null` when pending.
     * * `gasLimit`: `QUANTITY` - The maximum gas allowed in the block.
     * * `gasUsed`: `QUANTITY` - Total gas used by all transactions in the block.
     * * `timestamp`: `QUANTITY` - The unix timestamp for when the block was collated.
     * * `extraData`: `DATA` - Extra data for the block.
     * * `mixHash`: `DATA`, 256 Bytes - Hash identifier for the block.
     * * `nonce`: `DATA`, 8 Bytes - Hash of the generated proof-of-work. `null` when pending.
     * * `totalDifficulty`: `QUANTITY` - Integer of the total difficulty of the chain until this block.
     * * `size`: `QUANTITY` - Integer the size of the block in bytes.
     * * `transactions`: `Array` - Array of transaction objects or 32 Bytes transaction hashes depending on the last parameter.
     * * `uncles`: `Array` - Array of uncle hashes.
     *
     * @example
     * ```javascript
     * // Simple.sol
     * // // SPDX-License-Identifier: MIT
     * //  pragma solidity ^0.7.4;
     * //
     * //  contract Simple {
     * //      uint256 public value;
     * //      constructor() payable {
     * //          value = 5;
     * //      }
     * //  }
     * const simpleSol = "0x6080604052600560008190555060858060196000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80633fa4f24514602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea26469706673582212200897f7766689bf7a145227297912838b19bcad29039258a293be78e3bf58e20264736f6c63430007040033";
     * const [from] = await provider.request({ method: "eth_accounts", params: [] });
     * await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * const txHash = await provider.request({ method: "eth_sendTransaction", params: [{ from, gas: "0x5b8d80", data: simpleSol }] });
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     * const txReceipt = await provider.request({ method: "eth_getTransactionReceipt", params: [txHash] });
     * const block = await provider.request({ method: "eth_getBlockByHash", params: [txReceipt.blockHash, true] });
     * console.log(block);
     * ```
     */
    async eth_getBlockByHash(hash, transactions = false) {
        const block = await __classPrivateFieldGet(this, _blockchain).blocks
            .getByHash(hash)
            .catch(_ => null);
        return block ? block.toJSON(transactions) : null;
    }
    /**
     * Returns the number of transactions in a block from a block matching the given block number.
     * @param number Integer of a block number, or the string "earliest", "latest" or "pending", as in the
     * default block parameter.
     * @returns Integer of the number of transactions in the block.
     * @example
     * ```javascript
     * const txCount = await provider.request({ method: "eth_getBlockTransactionCountByNumber", params: ["0x0"] });
     * console.log(txCount);
     * ```
     */
    async eth_getBlockTransactionCountByNumber(blockNumber) {
        const { blocks } = __classPrivateFieldGet(this, _blockchain);
        const blockNum = blocks.getEffectiveNumber(blockNumber);
        const rawBlock = await blocks.getRawByBlockNumber(blockNum);
        if (!rawBlock)
            return null;
        const [, rawTransactions] = rlp_1.decode(rawBlock);
        return utils_1.Quantity.from(rawTransactions.length);
    }
    /**
     * Returns the number of transactions in a block from a block matching the given block hash.
     * @param hash Hash of a block.
     * @returns Number of transactions in the block.
     * @example
     * ```javascript
     * // Simple.sol
     * // // SPDX-License-Identifier: MIT
     * //  pragma solidity ^0.7.4;
     * //
     * //  contract Simple {
     * //      uint256 public value;
     * //      constructor() payable {
     * //          value = 5;
     * //      }
     * //  }
     * const simpleSol = "0x6080604052600560008190555060858060196000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80633fa4f24514602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea26469706673582212200897f7766689bf7a145227297912838b19bcad29039258a293be78e3bf58e20264736f6c63430007040033";
     * const [from] = await provider.request({ method: "eth_accounts", params: [] });
     * await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * const txHash = await provider.request({ method: "eth_sendTransaction", params: [{ from, gas: "0x5b8d80", data: simpleSol }] });
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     * const txReceipt = await provider.request({ method: "eth_getTransactionReceipt", params: [txHash] });
     * const txCount = await provider.request({ method: "eth_getBlockTransactionCountByHash", params: [txReceipt.blockHash] });
     * console.log(txCount);
     * ```
     */
    async eth_getBlockTransactionCountByHash(hash) {
        const { blocks } = __classPrivateFieldGet(this, _blockchain);
        const blockNum = await blocks.getNumberFromHash(hash);
        if (!blockNum)
            return null;
        const rawBlock = await blocks.getRawByBlockNumber(utils_1.Quantity.from(blockNum));
        if (!rawBlock)
            return null;
        const [, rawTransactions] = rlp_1.decode(rawBlock);
        return utils_1.Quantity.from(rawTransactions.length);
    }
    /**
     * Returns a list of available compilers.
     * @returns List of available compilers.
     * @example
     * ```javascript
     * const compilers = await provider.send("eth_getCompilers");
     * console.log(compilers);
     * ```
     */
    async eth_getCompilers() {
        return [];
    }
    /**
     * Returns information about a transaction by block hash and transaction index position.
     * @param hash Hash of a block.
     * @param index Integer of the transaction index position.
     * @returns The transaction object or `null` if no transaction was found.
     *
     * * `hash`: `DATA`, 32 Bytes - The transaction hash.
     * * `nonce`: `QUANTITY` - The number of transactions made by the sender prior to this one.
     * * `blockHash`: `DATA`, 32 Bytes - The hash of the block the transaction is in. `null` when pending.
     * * `blockNumber`: `QUANTITY` - The number of the block the transaction is in. `null` when pending.
     * * `transactionIndex`: `QUANTITY` - The index position of the transaction in the block.
     * * `from`: `DATA`, 20 Bytes - The address the transaction is sent from.
     * * `to`: `DATA`, 20 Bytes - The address the transaction is sent to.
     * * `value`: `QUANTITY` - The value transferred in wei.
     * * `gas`: `QUANTITY` - The gas provided by the sender.
     * * `gasPrice`: `QUANTITY` - The price of gas in wei.
     * * `input`: `DATA` - The data sent along with the transaction.
     * * `v`: `QUANTITY` - ECDSA recovery id.
     * * `r`: `DATA`, 32 Bytes - ECDSA signature r.
     * * `s`: `DATA`, 32 Bytes - ECDSA signature s.
     *
     * @example
     * ```javascript
     * const [from, to] = await provider.request({ method: "eth_accounts", params: [] });
     * await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * const txHash = await provider.request({ method: "eth_sendTransaction", params: [{ from, to, gas: "0x5b8d80" }] });
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     * const { blockHash, transactionIndex } = await provider.request({ method: "eth_getTransactionReceipt", params: [txHash] });
     *
     * const tx = await provider.request({ method: "eth_getTransactionByBlockHashAndIndex", params: [ blockHash, transactionIndex ] });
     * console.log(tx);
     * ```
     */
    async eth_getTransactionByBlockHashAndIndex(hash, index) {
        const block = await this.eth_getBlockByHash(hash, true);
        if (block) {
            const tx = block.transactions[utils_1.Quantity.from(index).toNumber()];
            if (tx)
                return tx;
        }
        return null;
    }
    /**
     * Returns information about a transaction by block number and transaction index position.
     * @param number A block number, or the string "earliest", "latest" or "pending".
     * @param index Integer of the transaction index position.
     * @returns The transaction object or `null` if no transaction was found.
     *
     * * `hash`: `DATA`, 32 Bytes - The transaction hash.
     * * `nonce`: `QUANTITY` - The number of transactions made by the sender prior to this one.
     * * `blockHash`: `DATA`, 32 Bytes - The hash of the block the transaction is in. `null` when pending.
     * * `blockNumber`: `QUANTITY` - The number of the block the transaction is in. `null` when pending.
     * * `transactionIndex`: `QUANTITY` - The index position of the transaction in the block.
     * * `from`: `DATA`, 20 Bytes - The address the transaction is sent from.
     * * `to`: `DATA`, 20 Bytes - The address the transaction is sent to.
     * * `value`: `QUANTITY` - The value transferred in wei.
     * * `gas`: `QUANTITY` - The gas provided by the sender.
     * * `gasPrice`: `QUANTITY` - The price of gas in wei.
     * * `input`: `DATA` - The data sent along with the transaction.
     * * `v`: `QUANTITY` - ECDSA recovery id.
     * * `r`: `DATA`, 32 Bytes - ECDSA signature r.
     * * `s`: `DATA`, 32 Bytes - ECDSA signature s.
     *
     * @example
     * ```javascript
     * const [from, to] = await provider.request({ method: "eth_accounts", params: [] });
     * await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * const txHash = await provider.request({ method: "eth_sendTransaction", params: [{ from, to, gas: "0x5b8d80" }] });
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     * const { transactionIndex } = await provider.request({ method: "eth_getTransactionReceipt", params: [txHash] });
     *
     * const tx = await provider.request({ method: "eth_getTransactionByBlockNumberAndIndex", params: [ "latest", transactionIndex ] });
     * console.log(tx);
     * ```
     */
    async eth_getTransactionByBlockNumberAndIndex(number, index) {
        const block = await this.eth_getBlockByNumber(number, true);
        return block.transactions[parseInt(utils_1.Quantity.from(index).toString(), 10)];
    }
    /**
     * Returns the number of uncles in a block from a block matching the given block hash.
     * @param hash Hash of a block.
     * @returns The number of uncles in a block.
     * @example
     * ```javascript
     * const blockHash = await provider.send("eth_getBlockByNumber", ["latest"] );
     * const uncleCount = await provider.send("eth_getUncleCountByBlockHash", [blockHash] );
     * console.log(uncleCount);
     * ```
     */
    async eth_getUncleCountByBlockHash(hash) {
        return utils_1.RPCQUANTITY_ZERO;
    }
    /**
     * Returns the number of uncles in a block from a block matching the given block hash.
     * @param blockNumber A block number, or the string "earliest", "latest" or "pending".
     * @returns The number of uncles in a block.
     * @example
     * ```javascript
     * const uncleCount = await provider.send("eth_getUncleCountByBlockNumber", ["latest"] );
     * console.log(uncleCount);
     * ```
     */
    async eth_getUncleCountByBlockNumber(blockNumber) {
        return utils_1.RPCQUANTITY_ZERO;
    }
    /**
     * Returns information about a uncle of a block by hash and uncle index position.
     *
     * @param hash Hash of a block.
     * @param index The uncle's index position.
     * @returns A block object or `null` when no block is found.
     *
     * * `hash`: `DATA`, 32 Bytes - Hash of the block. `null` when pending.
     * * `parentHash`: `DATA`, 32 Bytes - Hash of the parent block.
     * * `sha3Uncles`: `DATA`, 32 Bytes - SHA3 of the uncles data in the block.
     * * `miner`: `DATA`, 20 Bytes -  Address of the miner.
     * * `stateRoot`: `DATA`, 32 Bytes - The root of the state trie of the block.
     * * `transactionsRoot`: `DATA`, 32 Bytes - The root of the transaction trie of the block.
     * * `receiptsRoot`: `DATA`, 32 Bytes - The root of the receipts trie of the block.
     * * `logsBloom`: `DATA`, 256 Bytes - The bloom filter for the logs of the block. `null` when pending.
     * * `difficulty`: `QUANTITY` - Integer of the difficulty of this block.
     * * `number`: `QUANTITY` - The block number. `null` when pending.
     * * `gasLimit`: `QUANTITY` - The maximum gas allowed in the block.
     * * `gasUsed`: `QUANTITY` - Total gas used by all transactions in the block.
     * * `timestamp`: `QUANTITY` - The unix timestamp for when the block was collated.
     * * `extraData`: `DATA` - Extra data for the block.
     * * `mixHash`: `DATA`, 256 Bytes - Hash identifier for the block.
     * * `nonce`: `DATA`, 8 Bytes - Hash of the generated proof-of-work. `null` when pending.
     * * `totalDifficulty`: `QUANTITY` - Integer of the total difficulty of the chain until this block.
     * * `size`: `QUANTITY` - Integer the size of the block in bytes.
     * * `transactions`: `Array` - Array of transaction objects or 32 Bytes transaction hashes depending on the last parameter.
     * * `uncles`: `Array` - Array of uncle hashes.
     *
     * @example
     * ```javascript
     * const blockHash = await provider.send("eth_getBlockByNumber", ["latest"] );
     * const block = await provider.send("eth_getUncleByBlockHashAndIndex", [blockHash, "0x0"] );
     * console.log(block);
     * ```
     */
    async eth_getUncleByBlockHashAndIndex(hash, index) {
        return null;
    }
    /**
     * Returns information about a uncle of a block by hash and uncle index position.
     *
     * @param blockNumber A block number, or the string "earliest", "latest" or "pending".
     * @param uncleIndex The uncle's index position.
     * @returns A block object or `null` when no block is found.
     *
     * * `hash`: `DATA`, 32 Bytes - Hash of the block. `null` when pending.
     * * `parentHash`: `DATA`, 32 Bytes - Hash of the parent block.
     * * `sha3Uncles`: `DATA`, 32 Bytes - SHA3 of the uncles data in the block.
     * * `miner`: `DATA`, 20 Bytes -  Address of the miner.
     * * `stateRoot`: `DATA`, 32 Bytes - The root of the state trie of the block.
     * * `transactionsRoot`: `DATA`, 32 Bytes - The root of the transaction trie of the block.
     * * `receiptsRoot`: `DATA`, 32 Bytes - The root of the receipts trie of the block.
     * * `logsBloom`: `DATA`, 256 Bytes - The bloom filter for the logs of the block. `null` when pending.
     * * `difficulty`: `QUANTITY` - Integer of the difficulty of this block.
     * * `number`: `QUANTITY` - The block number. `null` when pending.
     * * `gasLimit`: `QUANTITY` - The maximum gas allowed in the block.
     * * `gasUsed`: `QUANTITY` - Total gas used by all transactions in the block.
     * * `timestamp`: `QUANTITY` - The unix timestamp for when the block was collated.
     * * `extraData`: `DATA` - Extra data for the block.
     * * `mixHash`: `DATA`, 256 Bytes - Hash identifier for the block.
     * * `nonce`: `DATA`, 8 Bytes - Hash of the generated proof-of-work. `null` when pending.
     * * `totalDifficulty`: `QUANTITY` - Integer of the total difficulty of the chain until this block.
     * * `size`: `QUANTITY` - Integer the size of the block in bytes.
     * * `transactions`: `Array` - Array of transaction objects or 32 Bytes transaction hashes depending on the last parameter.
     * * `uncles`: `Array` - Array of uncle hashes.
     *
     * @example
     * ```javascript
     * const block = await provider.send("eth_getUncleByBlockNumberAndIndex", ["latest", "0x0"] );
     * console.log(block);
     * ```
     */
    async eth_getUncleByBlockNumberAndIndex(blockNumber, uncleIndex) {
        return null;
    }
    /**
     * Returns: An Array with the following elements
     * 1: `DATA`, 32 Bytes - current block header pow-hash
     * 2: `DATA`, 32 Bytes - the seed hash used for the DAG.
     * 3: `DATA`, 32 Bytes - the boundary condition ("target"), 2^256 / difficulty.
     *
     * @param filterId A filter id.
     * @returns The hash of the current block, the seedHash, and the boundary condition to be met ("target").
     * @example
     * ```javascript
     * console.log(await provider.send("eth_getWork", ["0x0"] ));
     *  ```
     */
    async eth_getWork(filterId) {
        return [];
    }
    /**
     * Used for submitting a proof-of-work solution.
     *
     * @param nonce The nonce found (64 bits).
     * @param powHash The header's pow-hash (256 bits).
     * @param digest The mix digest (256 bits).
     * @returns `true` if the provided solution is valid, otherwise `false`.
     * @example
     * ```javascript
     * const nonce = "0xe0df4bd14ab39a71";
     * const powHash = "0x0000000000000000000000000000000000000000000000000000000000000001";
     * const digest = "0xb2222a74119abd18dbcb7d1f661c6578b7bbeb4984c50e66ed538347f606b971";
     * const result = await provider.request({ method: "eth_submitWork", params: [nonce, powHash, digest] });
     * console.log(result);
     * ```
     */
    async eth_submitWork(nonce, powHash, digest) {
        return false;
    }
    /**
     * Used for submitting mining hashrate.
     *
     * @param hashRate A hexadecimal string representation (32 bytes) of the hash rate.
     * @param clientID A random hexadecimal(32 bytes) ID identifying the client.
     * @returns `true` if submitting went through succesfully and `false` otherwise.
     * @example
     * ```javascript
     * const hashRate = "0x0000000000000000000000000000000000000000000000000000000000000001";
     * const clientId = "0xb2222a74119abd18dbcb7d1f661c6578b7bbeb4984c50e66ed538347f606b971";
     * const result = await provider.request({ method: "eth_submitHashrate", params: [hashRate, clientId] });
     * console.log(result);
     * ```
     */
    async eth_submitHashrate(hashRate, clientID) {
        return false;
    }
    /**
     * Returns `true` if client is actively mining new blocks.
     * @returns returns `true` if the client is mining, otherwise `false`.
     * @example
     * ```javascript
     * const isMining = await provider.request({ method: "eth_mining", params: [] });
     * console.log(isMining);
     * ```
     */
    async eth_mining() {
        // we return the blockchain's started state
        return __classPrivateFieldGet(this, _blockchain).isStarted();
    }
    /**
     * Returns the number of hashes per second that the node is mining with.
     * @returns Number of hashes per second.
     * @example
     * ```javascript
     * const hashrate = await provider.request({ method: "eth_hashrate", params: [] });
     * console.log(hashrate);
     * ```
     */
    async eth_hashrate() {
        return utils_1.RPCQUANTITY_ZERO;
    }
    /**
     * Returns the current price per gas in wei.
     * @returns Integer of the current gas price in wei.
     * @example
     * ```javascript
     * const gasPrice = await provider.request({ method: "eth_gasPrice", params: [] });
     * console.log(gasPrice);
     * ```
     */
    async eth_gasPrice() {
        return __classPrivateFieldGet(this, _options).miner.defaultGasPrice;
    }
    /**
     * Returns a list of addresses owned by client.
     * @returns Array of 20 Bytes - addresses owned by the client.
     * @example
     * ```javascript
     * const accounts = await provider.request({ method: "eth_accounts", params: [] });
     * console.log(accounts);
     * ```
     */
    async eth_accounts() {
        return __classPrivateFieldGet(this, _wallet).addresses;
    }
    /**
     * Returns the number of the most recent block.
     * @returns The current block number the client is on.
     * @example
     * ```javascript
     * const blockNumber = await provider.request({ method: "eth_blockNumber" });
     * console.log(blockNumber);
     * ```
     */
    async eth_blockNumber() {
        return __classPrivateFieldGet(this, _blockchain).blocks.latest.header.number;
    }
    /**
     * Returns the currently configured chain id, a value used in
     * replay-protected transaction signing as introduced by EIP-155.
     * @returns The chain id as a string.
     * @EIP [155 – Simple replay attack protection](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md)
     *
     * @example
     * ```javascript
     * const chainId = await provider.send("eth_chainId");
     * console.log(chainId);
     * ```
     */
    async eth_chainId() {
        return utils_1.Quantity.from(__classPrivateFieldGet(this, _options).chain.chainId);
    }
    /**
     * Returns the balance of the account of given address.
     * @param address Address to check for balance.
     * @param blockNumber Integer block number, or the string "latest", "earliest"
     *  or "pending".
     *
     * @returns Integer of the account balance in wei.
     *
     * @example
     * ```javascript
     * const accounts = await provider.request({ method: "eth_accounts", params: [] });
     * const balance = await provider.request({ method: "eth_getBalance", params: [accounts[0], "latest"] });
     * console.log(balance);
     * ```
     */
    async eth_getBalance(address, blockNumber = ethereum_utils_1.Tag.LATEST) {
        return __classPrivateFieldGet(this, _blockchain).accounts.getBalance(ethereum_address_1.Address.from(address), blockNumber);
    }
    /**
     * Returns code at a given address.
     *
     * @param address Address.
     * @param blockNumber Integer block number, or the string "latest", "earliest" or "pending".
     * @returns The code from the given address.
     * @example
     * ```javascript
     * // Simple.sol
     * // // SPDX-License-Identifier: MIT
     * //  pragma solidity ^0.7.4;
     * //
     * //  contract Simple {
     * //      uint256 public value;
     * //      constructor() payable {
     * //          value = 5;
     * //      }
     * //  }
     * const simpleSol = "0x6080604052600560008190555060858060196000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80633fa4f24514602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea26469706673582212200897f7766689bf7a145227297912838b19bcad29039258a293be78e3bf58e20264736f6c63430007040033";
     * const [from] = await provider.request({ method: "eth_accounts", params: [] });
     * await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * const txHash = await provider.request({ method: "eth_sendTransaction", params: [{ from, gas: "0x5b8d80", data: simpleSol }] });
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     * const txReceipt = await provider.request({ method: "eth_getTransactionReceipt", params: [txHash] });
     * const code = await provider.request({ method: "eth_getCode", params: [txReceipt.contractAddress, "latest"] });
     * console.log(code);
     * ```
     */
    async eth_getCode(address, blockNumber = ethereum_utils_1.Tag.LATEST) {
        const { accounts } = __classPrivateFieldGet(this, _blockchain);
        return accounts.getCode(ethereum_address_1.Address.from(address), blockNumber);
    }
    /**
     * Returns the value from a storage position at a given address.
     * @param address Address of the storage.
     * @param position Integer of the position in the storage.
     * @param blockNumber Integer block number, or the string "latest", "earliest"
     *  or "pending".
     * @returns The value in storage at the requested position.
     * @example
     * ```javascript
     * // Simple.sol
     * // // SPDX-License-Identifier: MIT
     * //  pragma solidity ^0.7.4;
     * //
     * //  contract Simple {
     * //      uint256 public value;
     * //      constructor() payable {
     * //          value = 5;
     * //      }
     * //  }
     * const simpleSol = "0x6080604052600560008190555060858060196000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80633fa4f24514602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea26469706673582212200897f7766689bf7a145227297912838b19bcad29039258a293be78e3bf58e20264736f6c63430007040033";
     * const [from] = await provider.request({ method: "eth_accounts", params: [] });
     * await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * const txHash = await provider.request({ method: "eth_sendTransaction", params: [{ from, gas: "0x5b8d80", data: simpleSol }] });
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     * const txReceipt = await provider.request({ method: "eth_getTransactionReceipt", params: [txHash] });
     * const storageValue = await provider.request({ method: "eth_getStorageAt", params: [txReceipt.contractAddress, "0x0", "latest"] });
     * console.log(storageValue);
     * ```
     */
    async eth_getStorageAt(address, position, blockNumber = ethereum_utils_1.Tag.LATEST) {
        const blockchain = __classPrivateFieldGet(this, _blockchain);
        const blockNum = blockchain.blocks.getEffectiveNumber(blockNumber);
        const block = await blockchain.blocks.getRawByBlockNumber(blockNum);
        if (!block)
            throw new Error("header not found");
        const [[, , , blockStateRoot]] = rlp_1.decode(block);
        const trie = blockchain.trie.copy(false);
        trie.setContext(blockStateRoot, null, blockNum);
        const posBuff = utils_1.Quantity.from(position).toBuffer();
        const length = posBuff.length;
        let paddedPosBuff;
        if (length < 32) {
            // storage locations are 32 bytes wide, so we need to expand any value
            // given to 32 bytes.
            paddedPosBuff = Buffer.allocUnsafe(32).fill(0);
            posBuff.copy(paddedPosBuff, 32 - length);
        }
        else if (length === 32) {
            paddedPosBuff = posBuff;
        }
        else {
            // if the position value we're passed is > 32 bytes, truncate it. This is
            // what geth does.
            paddedPosBuff = posBuff.slice(-32);
        }
        const addressBuf = ethereum_address_1.Address.from(address).toBuffer();
        const addressData = await trie.get(addressBuf);
        // An address's stateRoot is stored in the 3rd rlp entry
        const addressStateRoot = rlp_1.decode(addressData)[2];
        trie.setContext(addressStateRoot, addressBuf, blockNum);
        const value = await trie.get(paddedPosBuff);
        return utils_1.Data.from(rlp_1.decode(value));
    }
    /**
     * Returns the information about a transaction requested by transaction hash.
     *
     * @param transactionHash Hash of a transaction.
     * @returns The transaction object or `null` if no transaction was found.
     *
     * * `hash`: `DATA`, 32 Bytes - The transaction hash.
     * * `nonce`: `QUANTITY` - The number of transactions made by the sender prior to this one.
     * * `blockHash`: `DATA`, 32 Bytes - The hash of the block the transaction is in. `null` when pending.
     * * `blockNumber`: `QUANTITY` - The number of the block the transaction is in. `null` when pending.
     * * `transactionIndex`: `QUANTITY` - The index position of the transaction in the block.
     * * `from`: `DATA`, 20 Bytes - The address the transaction is sent from.
     * * `to`: `DATA`, 20 Bytes - The address the transaction is sent to.
     * * `value`: `QUANTITY` - The value transferred in wei.
     * * `gas`: `QUANTITY` - The gas provided by the sender.
     * * `gasPrice`: `QUANTITY` - The price of gas in wei.
     * * `input`: `DATA` - The data sent along with the transaction.
     * * `v`: `QUANTITY` - ECDSA recovery id.
     * * `r`: `DATA`, 32 Bytes - ECDSA signature r.
     * * `s`: `DATA`, 32 Bytes - ECDSA signature s.
     *
     * @example
     * ```javascript
     * const [from, to] = await provider.request({ method: "eth_accounts", params: [] });
     * await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * const txHash = await provider.request({ method: "eth_sendTransaction", params: [{ from, to, gas: "0x5b8d80" }] });
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     *
     * const tx = await provider.request({ method: "eth_getTransactionByHash", params: [ txHash ] });
     * console.log(tx);
     * ```
     */
    async eth_getTransactionByHash(transactionHash) {
        const { transactions } = __classPrivateFieldGet(this, _blockchain);
        const hashBuffer = utils_1.Data.from(transactionHash).toBuffer();
        // we must check the database before checking the pending cache, because the
        // cache is updated _after_ the transaction is already in the database, and
        // the database contains block info whereas the pending cache doesn't.
        const transaction = await transactions.get(hashBuffer);
        if (transaction === null) {
            // if we can't find it in the list of pending transactions, check the db!
            const tx = transactions.transactionPool.find(hashBuffer);
            return tx ? tx.toJSON() : null;
        }
        else {
            return transaction.toJSON();
        }
    }
    /**
     * Returns the receipt of a transaction by transaction hash.
     *
     * Note: The receipt is not available for pending transactions.
     *
     * @param transactionHash Hash of a transaction.
     * @returns Returns the receipt of a transaction by transaction hash.
     * @example
     * ```javascript
     * const [from, to] = await provider.request({ method: "eth_accounts", params: [] });
     * await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * const txHash = await provider.request({ method: "eth_sendTransaction", params: [{ from, to, gas: "0x5b8d80" }] });
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     *
     * const txReceipt = await provider.request({ method: "eth_getTransactionReceipt", params: [ txHash ] });
     * console.log(txReceipt);
     * ```
     */
    async eth_getTransactionReceipt(transactionHash) {
        const { transactions, transactionReceipts, blocks } = __classPrivateFieldGet(this, _blockchain);
        const dataHash = utils_1.Data.from(transactionHash);
        const txHash = dataHash.toBuffer();
        const transactionPromise = transactions.get(txHash);
        const receiptPromise = transactionReceipts.get(txHash);
        const blockPromise = transactionPromise.then(t => t ? blocks.get(t.blockNumber.toBuffer()) : null);
        const [transaction, receipt, block] = await Promise.all([
            transactionPromise,
            receiptPromise,
            blockPromise
        ]);
        if (transaction) {
            return receipt.toJSON(block, transaction);
        }
        // if we are performing non-legacy instamining, then check to see if the
        // transaction is pending so as to warn about the v7 breaking change
        const options = __classPrivateFieldGet(this, _options);
        if (options.miner.blockTime <= 0 &&
            options.miner.legacyInstamine !== true &&
            __classPrivateFieldGet(this, _blockchain).isStarted()) {
            const tx = __classPrivateFieldGet(this, _blockchain).transactions.transactionPool.find(txHash);
            if (tx != null) {
                options.logging.logger.log(" > Ganache `eth_getTransactionReceipt` notice: the transaction with hash\n" +
                    ` > \`${dataHash.toString()}\` has not\n` +
                    " > yet been mined."
                // TODO: uncomment once we have a valid domain
                // + " See https://trfl.co/v7-instamine for additional information."
                );
            }
        }
        return null;
    }
    /**
     * Creates new message call transaction or a contract creation, if the data field contains code.
     *
     * Transaction call object:
     * * `from`: `DATA`, 20 bytes (optional) - The address the transaction is sent from.
     * * `to`: `DATA`, 20 bytes - The address the transaction is sent to.
     * * `gas`: `QUANTITY` (optional) - Integer of the maximum gas allowance for the transaction.
     * * `gasPrice`: `QUANTITY` (optional) - Integer of the price of gas in wei.
     * * `value`: `QUANTITY` (optional) - Integer of the value in wei.
     * * `data`: `DATA` (optional) - Hash of the method signature and the ABI encoded parameters.
     *
     * @param transaction - The transaction call object as seen in source.
     * @returns The transaction hash.
     * @example
     * ```javascript
     * const [from, to] = await provider.request({ method: "eth_accounts", params: [] });
     * await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * const txHash = await provider.request({ method: "eth_sendTransaction", params: [{ from, to, gas: "0x5b8d80" }] });
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     * console.log(txHash);
     * ```
     */
    async eth_sendTransaction(transaction) {
        const blockchain = __classPrivateFieldGet(this, _blockchain);
        const tx = new ethereum_transaction_1.RuntimeTransaction(transaction, blockchain.common);
        if (tx.from == null) {
            throw new Error("from not found; is required");
        }
        const fromString = tx.from.toString();
        const wallet = __classPrivateFieldGet(this, _wallet);
        const isKnownAccount = wallet.knownAccounts.has(fromString);
        const isUnlockedAccount = wallet.unlockedAccounts.has(fromString);
        if (!isUnlockedAccount) {
            const msg = isKnownAccount
                ? "authentication needed: password or unlock"
                : "sender account not recognized";
            throw new Error(msg);
        }
        if (tx.gas.isNull()) {
            const defaultLimit = __classPrivateFieldGet(this, _options).miner.defaultTransactionGasLimit;
            if (defaultLimit === utils_1.RPCQUANTITY_EMPTY) {
                // if the default limit is `RPCQUANTITY_EMPTY` use a gas estimate
                tx.gas = await this.eth_estimateGas(transaction, ethereum_utils_1.Tag.LATEST);
            }
            else {
                tx.gas = defaultLimit;
            }
        }
        if (tx.gasPrice.isNull()) {
            tx.gasPrice = __classPrivateFieldGet(this, _options).miner.defaultGasPrice;
        }
        if (isUnlockedAccount) {
            const secretKey = wallet.unlockedAccounts.get(fromString);
            return blockchain.queueTransaction(tx, secretKey);
        }
        else {
            return blockchain.queueTransaction(tx);
        }
    }
    /**
     * Signs a transaction that can be submitted to the network at a later time using `eth_sendRawTransaction`.
     *
     * Transaction call object:
     * * `from`: `DATA`, 20 bytes (optional) - The address the transaction is sent from.
     * * `to`: `DATA`, 20 bytes - The address the transaction is sent to.
     * * `gas`: `QUANTITY` (optional) - Integer of the maximum gas allowance for the transaction.
     * * `gasPrice`: `QUANTITY` (optional) - Integer of the price of gas in wei.
     * * `value`: `QUANTITY` (optional) - Integer of the value in wei.
     * * `data`: `DATA` (optional) - Hash of the method signature and the ABI encoded parameters.
     *
     * @param transaction - The transaction call object as seen in source.
     * @returns The raw, signed transaction.
     * @example
     * ```javascript
     * const [from, to] = await provider.request({ method: "eth_accounts", params: [] });
     * const signedTx = await provider.request({ method: "eth_signTransaction", params: [{ from, to }] });
     * console.log(signedTx)
     * ```
     */
    async eth_signTransaction(transaction) {
        const blockchain = __classPrivateFieldGet(this, _blockchain);
        const tx = new ethereum_transaction_1.RuntimeTransaction(transaction, blockchain.common);
        if (tx.from == null) {
            throw new Error("from not found; is required");
        }
        const fromString = tx.from.toString();
        const wallet = __classPrivateFieldGet(this, _wallet);
        const isKnownAccount = wallet.knownAccounts.has(fromString);
        const isUnlockedAccount = wallet.unlockedAccounts.has(fromString);
        if (!isUnlockedAccount) {
            const msg = isKnownAccount
                ? "authentication needed: password or unlock"
                : "sender account not recognized";
            throw new Error(msg);
        }
        const secretKey = wallet.unlockedAccounts.get(fromString).toBuffer();
        tx.signAndHash(secretKey);
        return utils_1.Data.from(tx.serialized).toString();
    }
    /**
     * Creates new message call transaction or a contract creation for signed transactions.
     * @param transaction The signed transaction data.
     * @returns The transaction hash.
     * @example
     * ```javascript
     * const [from, to] = await provider.request({ method: "eth_accounts", params: [] });
     * const signedTx = await provider.request({ method: "eth_signTransaction", params: [{ from, to, gas: "0x5b8d80" }] });
     * const txHash = await provider.send("eth_sendRawTransaction", [signedTx] );
     * console.log(txHash);
     * ```
     */
    async eth_sendRawTransaction(transaction) {
        const data = utils_1.Data.from(transaction).toBuffer();
        const raw = rlp_1.decode(data);
        const blockchain = __classPrivateFieldGet(this, _blockchain);
        const tx = new ethereum_transaction_1.RuntimeTransaction(raw, blockchain.common);
        return blockchain.queueTransaction(tx);
    }
    /**
     * The sign method calculates an Ethereum specific signature with:
     * `sign(keccak256("\x19Ethereum Signed Message:\n" + message.length + message)))`.
     *
     * By adding a prefix to the message makes the calculated signature
     * recognizable as an Ethereum specific signature. This prevents misuse where a malicious DApp can sign arbitrary data
     *  (e.g. transaction) and use the signature to impersonate the victim.
     *
     * Note the address to sign with must be unlocked.
     *
     * @param address Address to sign with.
     * @param message Message to sign.
     * @returns Signature - a hex encoded 129 byte array
     * starting with `0x`. It encodes the `r`, `s`, and `v` parameters from
     * appendix F of the [yellow paper](https://ethereum.github.io/yellowpaper/paper.pdf)
     *  in big-endian format. Bytes 0...64 contain the `r` parameter, bytes
     * 64...128 the `s` parameter, and the last byte the `v` parameter. Note
     * that the `v` parameter includes the chain id as specified in [EIP-155](https://eips.ethereum.org/EIPS/eip-155).
     * @example
     * ```javascript
     * const [account] = await provider.request({ method: "eth_accounts", params: [] });
     * const msg = "0x307866666666666666666666";
     * const signature = await provider.request({ method: "eth_sign", params: [account, msg] });
     * console.log(signature);
     * ```
     */
    async eth_sign(address, message) {
        const account = ethereum_address_1.Address.from(address).toString().toLowerCase();
        const privateKey = __classPrivateFieldGet(this, _wallet).unlockedAccounts.get(account);
        if (privateKey == null) {
            throw new Error("cannot sign data; no private key");
        }
        const chainId = __classPrivateFieldGet(this, _options).chain.chainId;
        const messageHash = ethereumjs_util_1.hashPersonalMessage(utils_1.Data.from(message).toBuffer());
        const { v, r, s } = ethereumjs_util_1.ecsign(messageHash, privateKey.toBuffer(), chainId);
        return ethereumjs_util_1.toRpcSig(v, r, s, chainId);
    }
    /**
     *
     * @param address Address of the account that will sign the messages.
     * @param typedData Typed structured data to be signed.
     * @returns Signature. As in `eth_sign`, it is a hex encoded 129 byte array
     * starting with `0x`. It encodes the `r`, `s`, and `v` parameters from
     * appendix F of the [yellow paper](https://ethereum.github.io/yellowpaper/paper.pdf)
     *  in big-endian format. Bytes 0...64 contain the `r` parameter, bytes
     * 64...128 the `s` parameter, and the last byte the `v` parameter. Note
     * that the `v` parameter includes the chain id as specified in [EIP-155](https://eips.ethereum.org/EIPS/eip-155).
     * @EIP [712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md)
     * @example
     * ```javascript
     * const [account] = await provider.request({ method: "eth_accounts", params: [] });
     * const typedData = {
     *  types: {
     *    EIP712Domain: [
     *      { name: 'name', type: 'string' },
     *      { name: 'version', type: 'string' },
     *      { name: 'chainId', type: 'uint256' },
     *      { name: 'verifyingContract', type: 'address' },
     *    ],
     *    Person: [
     *      { name: 'name', type: 'string' },
     *      { name: 'wallet', type: 'address' }
     *    ],
     *    Mail: [
     *      { name: 'from', type: 'Person' },
     *      { name: 'to', type: 'Person' },
     *      { name: 'contents', type: 'string' }
     *    ],
     *  },
     *  primaryType: 'Mail',
     *  domain: {
     *    name: 'Ether Mail',
     *    version: '1',
     *    chainId: 1,
     *    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
     *  },
     *  message: {
     *    from: {
     *      name: 'Cow',
     *      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
     *    },
     *    to: {
     *      name: 'Bob',
     *      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
     *    },
     *    contents: 'Hello, Bob!',
     *  },
     * };
     * const signature = await provider.request({ method: "eth_signTypedData", params: [account, typedData] });
     * console.log(signature);
     * ```
     */
    async eth_signTypedData(address, typedData) {
        const account = ethereum_address_1.Address.from(address).toString().toLowerCase();
        const privateKey = __classPrivateFieldGet(this, _wallet).unlockedAccounts.get(account);
        if (privateKey == null) {
            throw new Error("cannot sign data; no private key");
        }
        if (!typedData.types) {
            throw new Error("cannot sign data; types missing");
        }
        if (!typedData.types.EIP712Domain) {
            throw new Error("cannot sign data; EIP712Domain definition missing");
        }
        if (!typedData.domain) {
            throw new Error("cannot sign data; domain missing");
        }
        if (!typedData.primaryType) {
            throw new Error("cannot sign data; primaryType missing");
        }
        if (!typedData.message) {
            throw new Error("cannot sign data; message missing");
        }
        return eth_sig_util_1.signTypedData_v4(privateKey.toBuffer(), { data: typedData });
    }
    eth_subscribe(subscriptionName, options) {
        const subscriptions = __classPrivateFieldGet(this, _subscriptions);
        switch (subscriptionName) {
            case "newHeads": {
                const subscription = __classPrivateFieldGet(this, _getId).call(this);
                const promiEvent = utils_1.PromiEvent.resolve(subscription);
                const unsubscribe = __classPrivateFieldGet(this, _blockchain).on("block", (block) => {
                    const value = block;
                    const header = value.header;
                    const result = {
                        logsBloom: header.logsBloom,
                        miner: header.miner,
                        difficulty: header.difficulty,
                        totalDifficulty: header.totalDifficulty,
                        extraData: header.extraData,
                        gasLimit: header.gasLimit,
                        gasUsed: header.gasUsed,
                        hash: block.hash(),
                        mixHash: block.header.mixHash,
                        nonce: header.nonce,
                        number: header.number,
                        parentHash: header.parentHash,
                        receiptsRoot: header.receiptsRoot,
                        stateRoot: header.stateRoot,
                        timestamp: header.timestamp,
                        transactionsRoot: header.transactionsRoot,
                        sha3Uncles: header.sha3Uncles
                    };
                    // TODO: move the JSON stringification closer to where the message
                    // is actually sent to the listener
                    promiEvent.emit("message", {
                        type: "eth_subscription",
                        data: {
                            result: JSON.parse(JSON.stringify(result)),
                            subscription: subscription.toString()
                        }
                    });
                });
                subscriptions.set(subscription.toString(), unsubscribe);
                return promiEvent;
            }
            case "logs": {
                const subscription = __classPrivateFieldGet(this, _getId).call(this);
                const promiEvent = utils_1.PromiEvent.resolve(subscription);
                const { addresses, topics } = options
                    ? filter_parsing_1.parseFilterDetails(options)
                    : { addresses: [], topics: [] };
                const unsubscribe = __classPrivateFieldGet(this, _blockchain).on("blockLogs", (blockLogs) => {
                    // TODO: move the JSON stringification closer to where the message
                    // is actually sent to the listener
                    const result = JSON.parse(JSON.stringify([...blockLogs.filter(addresses, topics)]));
                    promiEvent.emit("message", {
                        type: "eth_subscription",
                        data: {
                            result,
                            subscription: subscription.toString()
                        }
                    });
                });
                subscriptions.set(subscription.toString(), unsubscribe);
                return promiEvent;
            }
            case "newPendingTransactions": {
                const subscription = __classPrivateFieldGet(this, _getId).call(this);
                const promiEvent = utils_1.PromiEvent.resolve(subscription);
                const unsubscribe = __classPrivateFieldGet(this, _blockchain).on("pendingTransaction", (transaction) => {
                    const result = transaction.hash.toString();
                    promiEvent.emit("message", {
                        type: "eth_subscription",
                        data: {
                            result,
                            subscription: subscription.toString()
                        }
                    });
                });
                subscriptions.set(subscription.toString(), unsubscribe);
                return promiEvent;
            }
            case "syncing": {
                // ganache doesn't sync, so doing nothing is perfectly valid.
                const subscription = __classPrivateFieldGet(this, _getId).call(this);
                const promiEvent = utils_1.PromiEvent.resolve(subscription);
                __classPrivateFieldGet(this, _subscriptions).set(subscription.toString(), () => { });
                return promiEvent;
            }
            default:
                throw new ethereum_utils_1.CodedError(`no \"${subscriptionName}\" subscription in eth namespace`, utils_1.JsonRpcErrorCode.METHOD_NOT_FOUND);
        }
    }
    /**
     * Cancel a subscription to a particular event. Returns a boolean indicating
     * if the subscription was successfully cancelled.
     *
     * @param subscriptionId The ID of the subscription to unsubscribe to.
     * @returns `true` if subscription was cancelled successfully, otherwise `false`.
     * @example
     * ```javascript
     * const subscriptionId = await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * const result = await provider.request({ method: "eth_unsubscribe", params: [subscriptionId] });
     * console.log(result);
     * ```
     */
    async eth_unsubscribe(subscriptionId) {
        const subscriptions = __classPrivateFieldGet(this, _subscriptions);
        const unsubscribe = subscriptions.get(subscriptionId);
        if (unsubscribe) {
            subscriptions.delete(subscriptionId);
            unsubscribe();
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Creates a filter in the node, to notify when a new block arrives. To check
     * if the state has changed, call `eth_getFilterChanges`.
     *
     * @returns A filter id.
     * @example
     * ```javascript
     * const filterId = await provider.request({ method: "eth_newBlockFilter", params: [] });
     * console.log(filterId);
     * ```
     */
    async eth_newBlockFilter() {
        const unsubscribe = __classPrivateFieldGet(this, _blockchain).on("block", (block) => {
            value.updates.push(block.hash());
        });
        const value = {
            updates: [],
            unsubscribe,
            filter: null,
            type: ethereum_utils_1.FilterTypes.block
        };
        const filterId = __classPrivateFieldGet(this, _getId).call(this);
        __classPrivateFieldGet(this, _filters).set(filterId.toString(), value);
        return filterId;
    }
    /**
     * Creates a filter in the node, to notify when new pending transactions
     * arrive. To check if the state has changed, call `eth_getFilterChanges`.
     *
     * @returns A filter id.
     * @example
     * ```javascript
     * const filterId = await provider.request({ method: "eth_newPendingTransactionFilter", params: [] });
     * console.log(filterId);
     * ```
     */
    async eth_newPendingTransactionFilter() {
        const unsubscribe = __classPrivateFieldGet(this, _blockchain).on("pendingTransaction", (transaction) => {
            value.updates.push(transaction.hash);
        });
        const value = {
            updates: [],
            unsubscribe,
            filter: null,
            type: ethereum_utils_1.FilterTypes.pendingTransaction
        };
        const filterId = __classPrivateFieldGet(this, _getId).call(this);
        __classPrivateFieldGet(this, _filters).set(filterId.toString(), value);
        return filterId;
    }
    /**
     * Creates a filter object, based on filter options, to notify when the state
     * changes (logs). To check if the state has changed, call
     * `eth_getFilterChanges`.
     *
     * If the from `fromBlock` or `toBlock` option are equal to "latest" the
     * filter continually append logs for whatever block is seen as latest at the
     * time the block was mined, not just for the block that was "latest" when the
     * filter was created.
     *
     * ### A note on specifying topic filters:
     * Topics are order-dependent. A transaction with a log with topics [A, B]
     * will be matched by the following topic filters:
     *  * `[]` “anything”
     *  * `[A]` “A in first position (and anything after)”
     *  * `[null, B]` “anything in first position AND B in second position (and
     * anything after)”
     *  * `[A, B]` “A in first position AND B in second position (and anything
     * after)”
     *  * `[[A, B], [A, B]]` “(A OR B) in first position AND (A OR B) in second
     * position (and anything after)”
     *
     * Filter options:
     * * `fromBlock`: `QUANTITY | TAG` (optional) - Integer block number, or the string "latest", "earliest"
     * or "pending".
     * * `toBlock`: `QUANTITY | TAG` (optional) - Integer block number, or the string "latest", "earliest"
     * or "pending".
     * * `address`: `DATA | Array` (optional) - Contract address or a list of addresses from which the logs should originate.
     * * `topics`: `Array of DATA` (optional) - Array of 32 Bytes `DATA` topcis. Topics are order-dependent. Each topic can also
     * be an array of `DATA` with "or" options.
     *
     * @param filter The filter options as seen in source.
     *
     * @returns A filter id.
     * @example
     * ```javascript
     * const filterId = await provider.request({ method: "eth_newFilter", params: [] });
     * console.log(filterId);
     * ```
     */
    async eth_newFilter(filter) {
        const blockchain = __classPrivateFieldGet(this, _blockchain);
        if (filter == null)
            filter = {};
        const { addresses, topics } = filter_parsing_1.parseFilterDetails(filter || {});
        const unsubscribe = blockchain.on("blockLogs", (blockLogs) => {
            const blockNumber = blockLogs.blockNumber;
            // every time we get a blockLogs message we re-check what the filter's
            // range is. We do this because "latest" isn't the latest block at the
            // time the filter was set up, rather it is the actual latest *mined*
            // block (that is: not pending)
            const { fromBlock, toBlock } = filter_parsing_1.parseFilterRange(filter, blockchain);
            if (fromBlock <= blockNumber && toBlock >= blockNumber) {
                value.updates.push(...blockLogs.filter(addresses, topics));
            }
        });
        const value = { updates: [], unsubscribe, filter, type: ethereum_utils_1.FilterTypes.log };
        const filterId = __classPrivateFieldGet(this, _getId).call(this);
        __classPrivateFieldGet(this, _filters).set(filterId.toString(), value);
        return filterId;
    }
    /**
     * Polling method for a filter, which returns an array of logs, block hashes,
     * or transaction hashes, depending on the filter type, which occurred since
     * last poll.
     *
     * @param filterId The filter id.
     * @returns An array of logs, block hashes, or transaction hashes, depending
     * on the filter type, which occurred since last poll.
     *
     * For filters created with `eth_newBlockFilter` the return are block hashes (`DATA`, 32 Bytes).
     *
     * For filters created with `eth_newPendingTransactionFilter` the return are transaction hashes (`DATA`, 32 Bytes).
     *
     * For filters created with `eth_newFilter` the return are log objects with the following parameters:
     * * `removed`: `TAG` - `true` when the log was removed, `false` if its a valid log.
     * * `logIndex`: `QUANTITY` - Integer of the log index position in the block. `null` when pending.
     * * `transactionIndex`: `QUANTITY` - Integer of the transactions index position. `null` when pending.
     * * `transactionHash`: `DATA`, 32 Bytes - Hash of the transaction where the log was. `null` when pending.
     * * `blockHash`: `DATA`, 32 Bytes - Hash of the block where the log was. `null` when pending.
     * * `blockNumber`: `QUANTITY` - The block number where the log was in. `null` when pending.
     * * `address`: `DATA`, 20 Bytes - The address from which the log originated.
     * * `data`: `DATA` - Contains one or more 32 Bytes non-indexed arguments of the log.
     * * `topics`: `Array of DATA` - Array of 0 to 4 32 Bytes `DATA` of indexed log arguments.
     *
     * @example
     * ```javascript
     * // Logs.sol
     * // // SPDX-License-Identifier: MIT
     * // pragma solidity ^0.7.4;
     * // contract Logs {
     * //   event Event(uint256 indexed first, uint256 indexed second);
     * //   constructor() {
     * //     emit Event(1, 2);
     * //   }
     * //
     * //   function logNTimes(uint8 n) public {
     * //     for (uint8 i = 0; i < n; i++) {
     * //       emit Event(i, i);
     * //     }
     * //   }
     * // }
     *
     * const logsContract = "0x608060405234801561001057600080fd5b50600260017f34e802e5ebd1f132e05852c5064046c1b535831ec52f1c4997fc6fdc4d5345b360405160405180910390a360e58061004f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80635e19e69f14602d575b600080fd5b605960048036036020811015604157600080fd5b81019080803560ff169060200190929190505050605b565b005b60005b8160ff168160ff16101560ab578060ff168160ff167f34e802e5ebd1f132e05852c5064046c1b535831ec52f1c4997fc6fdc4d5345b360405160405180910390a38080600101915050605e565b505056fea26469706673582212201af9c13c7b00e2b628c1258d45f9f62d2aad8cd32fc32fd9515d8ad1e792679064736f6c63430007040033";
     * const [from] = await provider.send("eth_accounts");
     * const filterId = await provider.send("eth_newFilter");
     *
     * const subscriptionId = await provider.send("eth_subscribe", ["newHeads"]);
     * await provider.send("eth_sendTransaction", [{ from, data: logsContract, gas: "0x5b8d80" }] );
     * await provider.once("message");
     *
     * const changes = await provider.request({ method: "eth_getFilterChanges", params: [filterId] });
     * console.log(changes);
     *
     * await provider.send("eth_unsubscribe", [subscriptionId]);
     * ```
     */
    async eth_getFilterChanges(filterId) {
        const filter = __classPrivateFieldGet(this, _filters).get(utils_1.Quantity.from(filterId).toString());
        if (filter) {
            const updates = filter.updates;
            filter.updates = [];
            return updates;
        }
        else {
            throw new Error("filter not found");
        }
    }
    /**
     * Uninstalls a filter with given id. Should always be called when watch is
     * no longer needed.
     *
     * @param filterId The filter id.
     * @returns `true` if the filter was successfully uninstalled, otherwise
     * `false`.
     * @example
     * ```javascript
     * const filterId = await provider.request({ method: "eth_newFilter", params: [] });
     * const result = await provider.request({ method: "eth_uninstallFilter", params: [filterId] });
     * console.log(result);
     * ```
     */
    async eth_uninstallFilter(filterId) {
        const id = utils_1.Quantity.from(filterId).toString();
        const filter = __classPrivateFieldGet(this, _filters).get(id);
        if (!filter)
            return false;
        filter.unsubscribe();
        return __classPrivateFieldGet(this, _filters).delete(id);
    }
    /**
     * Returns an array of all logs matching filter with given id.
     *
     * @param filterId The filter id.
     * @returns Array of log objects, or an empty array.
     * @example
     * ```javascript
     * // Logs.sol
     * // // SPDX-License-Identifier: MIT
     * // pragma solidity ^0.7.4;
     * // contract Logs {
     * //   event Event(uint256 indexed first, uint256 indexed second);
     * //   constructor() {
     * //     emit Event(1, 2);
     * //   }
     * //
     * //   function logNTimes(uint8 n) public {
     * //     for (uint8 i = 0; i < n; i++) {
     * //       emit Event(i, i);
     * //     }
     * //   }
     * // }
     *
     * const logsContract = "0x608060405234801561001057600080fd5b50600260017f34e802e5ebd1f132e05852c5064046c1b535831ec52f1c4997fc6fdc4d5345b360405160405180910390a360e58061004f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80635e19e69f14602d575b600080fd5b605960048036036020811015604157600080fd5b81019080803560ff169060200190929190505050605b565b005b60005b8160ff168160ff16101560ab578060ff168160ff167f34e802e5ebd1f132e05852c5064046c1b535831ec52f1c4997fc6fdc4d5345b360405160405180910390a38080600101915050605e565b505056fea26469706673582212201af9c13c7b00e2b628c1258d45f9f62d2aad8cd32fc32fd9515d8ad1e792679064736f6c63430007040033";
     * const [from] = await provider.send("eth_accounts");
     * const filterId = await provider.send("eth_newFilter");
     *
     * await provider.send("eth_subscribe", ["newHeads"]);
     * await provider.send("eth_sendTransaction", [{ from, data: logsContract, gas: "0x5b8d80" }] );
     * await provider.once("message");
     *
     * const logs = await provider.request({ method: "eth_getFilterLogs", params: [filterId] });
     * console.log(logs);
     * ```
     */
    async eth_getFilterLogs(filterId) {
        const filter = __classPrivateFieldGet(this, _filters).get(utils_1.Quantity.from(filterId).toString());
        if (filter && filter.type === ethereum_utils_1.FilterTypes.log) {
            return this.eth_getLogs(filter.filter);
        }
        else {
            throw new Error("filter not found");
        }
    }
    /**
     * Returns an array of all logs matching a given filter object.
     *
     * Filter options:
     * * `fromBlock`: `QUANTITY | TAG` (optional) - Integer block number, or the string "latest", "earliest"
     * or "pending".
     * * `toBlock`: `QUANTITY | TAG` (optional) - Integer block number, or the string "latest", "earliest"
     * or "pending".
     * * `address`: `DATA | Array` (optional) - Contract address or a list of addresses from which the logs should originate.
     * * `topics`: `Array of DATA` (optional) - Array of 32 Bytes `DATA` topcis. Topics are order-dependent. Each topic can also
     * be an array of `DATA` with "or" options.
     * * `blockHash`: `DATA`, 32 Bytes (optional) - Hash of the block to restrict logs from. If `blockHash` is present,
     * then neither `fromBlock` or `toBlock` are allowed.
     *
     * @param filter The filter options as seen in source.
     * @returns Array of log objects, or an empty array.
     * @example
     * ```javascript
     * // Logs.sol
     * // // SPDX-License-Identifier: MIT
     * // pragma solidity ^0.7.4;
     * // contract Logs {
     * //   event Event(uint256 indexed first, uint256 indexed second);
     * //   constructor() {
     * //     emit Event(1, 2);
     * //   }
     * //
     * //   function logNTimes(uint8 n) public {
     * //     for (uint8 i = 0; i < n; i++) {
     * //       emit Event(i, i);
     * //     }
     * //   }
     * // }
     *
     * const logsContract = "0x608060405234801561001057600080fd5b50600260017f34e802e5ebd1f132e05852c5064046c1b535831ec52f1c4997fc6fdc4d5345b360405160405180910390a360e58061004f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80635e19e69f14602d575b600080fd5b605960048036036020811015604157600080fd5b81019080803560ff169060200190929190505050605b565b005b60005b8160ff168160ff16101560ab578060ff168160ff167f34e802e5ebd1f132e05852c5064046c1b535831ec52f1c4997fc6fdc4d5345b360405160405180910390a38080600101915050605e565b505056fea26469706673582212201af9c13c7b00e2b628c1258d45f9f62d2aad8cd32fc32fd9515d8ad1e792679064736f6c63430007040033";
     * const [from] = await provider.send("eth_accounts");
     *
     * await provider.send("eth_subscribe", ["newHeads"]);
     * const txHash = await provider.send("eth_sendTransaction", [{ from, data: logsContract, gas: "0x5b8d80" }] );
     * await provider.once("message");
     *
     * const { contractAddress } = await provider.send("eth_getTransactionReceipt", [txHash] );
     *
     * const logs = await provider.request({ method: "eth_getLogs", params: [{ address: contractAddress }] });
     * console.log(logs);
     * ```
     */
    async eth_getLogs(filter) {
        return __classPrivateFieldGet(this, _blockchain).blockLogs.getLogs(filter);
    }
    /**
     * Returns the number of transactions sent from an address.
     *
     * @param address `DATA`, 20 Bytes - The address to get number of transactions sent from
     * @param blockNumber Integer block number, or the string "latest", "earliest"
     * or "pending".
     * @returns Number of transactions sent from this address.
     * @example
     * ```javascript
     * const [from, to] = await provider.request({ method: "eth_accounts", params: [] });
     * await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * await provider.request({ method: "eth_sendTransaction", params: [{ from, to, gas: "0x5b8d80" }] });
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     *
     * const txCount = await provider.request({ method: "eth_getTransactionCount", params: [ from, "latest" ] });
     * console.log(txCount);
     * ```
     */
    async eth_getTransactionCount(address, blockNumber = ethereum_utils_1.Tag.LATEST) {
        return __classPrivateFieldGet(this, _blockchain).accounts.getNonce(ethereum_address_1.Address.from(address), blockNumber);
    }
    /**
     * Executes a new message call immediately without creating a transaction on the block chain.
     *
     * Transaction call object:
     * * `from`: `DATA`, 20 bytes (optional) - The address the transaction is sent from.
     * * `to`: `DATA`, 20 bytes - The address the transaction is sent to.
     * * `gas`: `QUANTITY` (optional) - Integer of the maximum gas allowance for the transaction.
     * * `gasPrice`: `QUANTITY` (optional) - Integer of the price of gas in wei.
     * * `value`: `QUANTITY` (optional) - Integer of the value in wei.
     * * `data`: `DATA` (optional) - Hash of the method signature and the ABI encoded parameters.
     *
     * @param transaction - The transaction call object as seen in source.
     * @param blockNumber Integer block number, or the string "latest", "earliest"
     *  or "pending".
     *
     * @returns The return value of executed contract.
     * @example
     * ```javascript
     * // Simple.sol
     * // // SPDX-License-Identifier: MIT
     * //  pragma solidity ^0.7.4;
     * //
     * //  contract Simple {
     * //      uint256 public value;
     * //      constructor() payable {
     * //          value = 5;
     * //      }
     * //  }
     * const simpleSol = "0x6080604052600560008190555060858060196000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80633fa4f24514602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea26469706673582212200897f7766689bf7a145227297912838b19bcad29039258a293be78e3bf58e20264736f6c63430007040033";
     * const [from] = await provider.request({ method: "eth_accounts", params: [] });
     * const txObj = { from, gas: "0x5b8d80", gasPrice: "0x1dfd14000", value:"0x0", data: simpleSol };
     * const result = await provider.request({ method: "eth_call", params: [txObj, "latest"] });
     * console.log(result);
     * ```
     */
    async eth_call(transaction, blockNumber = ethereum_utils_1.Tag.LATEST) {
        const blockchain = __classPrivateFieldGet(this, _blockchain);
        const blocks = blockchain.blocks;
        const parentBlock = await blocks.get(blockNumber);
        const parentHeader = parentBlock.header;
        const options = __classPrivateFieldGet(this, _options);
        let gas;
        if (typeof transaction.gasLimit === "undefined") {
            if (typeof transaction.gas !== "undefined") {
                gas = utils_1.Quantity.from(transaction.gas);
            }
            else {
                // eth_call isn't subject to regular transaction gas limits by default
                gas = options.miner.callGasLimit;
            }
        }
        else {
            gas = utils_1.Quantity.from(transaction.gasLimit);
        }
        let data;
        if (typeof transaction.data === "undefined") {
            if (typeof transaction.input !== "undefined") {
                data = utils_1.Data.from(transaction.input);
            }
        }
        else {
            data = utils_1.Data.from(transaction.data);
        }
        const block = new ethereum_block_1.RuntimeBlock(parentHeader.number, parentHeader.parentHash, blockchain.coinbase, gas.toBuffer(), parentHeader.timestamp, options.miner.difficulty, parentHeader.totalDifficulty);
        const simulatedTransaction = {
            gas,
            // if we don't have a from address, our caller sut be the configured coinbase address
            from: transaction.from == null
                ? blockchain.coinbase
                : ethereum_address_1.Address.from(transaction.from),
            to: transaction.to == null ? null : ethereum_address_1.Address.from(transaction.to),
            gasPrice: utils_1.Quantity.from(transaction.gasPrice == null ? 0 : transaction.gasPrice),
            value: transaction.value == null ? null : utils_1.Quantity.from(transaction.value),
            data,
            block
        };
        return blockchain.simulateTransaction(simulatedTransaction, parentBlock);
    }
    //#endregion
    //#region debug
    /**
     * Attempt to run the transaction in the exact same manner as it was executed
     * on the network. It will replay any transaction that may have been executed
     * prior to this one before it will finally attempt to execute the transaction
     * that corresponds to the given hash.
     *
     * In addition to the hash of the transaction you may give it a secondary
     * optional argument, which specifies the options for this specific call.
     * The possible options are:
     *
     * * `disableStorage`: \{boolean\} Setting this to `true` will disable storage capture (default = `false`).
     * * `disableMemory`: \{boolean\} Setting this to `true` will disable memory capture (default = `false`).
     * * `disableStack`: \{boolean\} Setting this to `true` will disable stack capture (default = `false`).
     *
     * @param transactionHash Hash of the transaction to trace.
     * @param options - See options in source.
     * @returns Returns the `gas`, `structLogs`, and `returnValue` for the traced transaction.
     *
     * The `structLogs` are an array of logs, which contains the following fields:
     * * `depth`: The execution depth.
     * * `error`: Information about an error, if one occurred.
     * * `gas`: The number of gas remaining.
     * * `gasCost`: The cost of gas in wei.
     * * `memory`: An array containing the contract's memory data.
     * * `op`: The current opcode.
     * * `pc`: The current program counter.
     * * `stack`: The EVM execution stack.
     * * `storage`: An object containing the contract's storage data.
     *
     * @example
     * ```javascript
     * // Simple.sol
     * // // SPDX-License-Identifier: MIT
     * //  pragma solidity ^0.7.4;
     * //
     * //  contract Simple {
     * //      uint256 public value;
     * //      constructor() payable {
     * //          value = 5;
     * //      }
     * //  }
     * const simpleSol = "0x6080604052600560008190555060858060196000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80633fa4f24514602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea26469706673582212200897f7766689bf7a145227297912838b19bcad29039258a293be78e3bf58e20264736f6c63430007040033";
     * const [from] = await provider.request({ method: "eth_accounts", params: [] });
     * await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * const txHash = await provider.request({ method: "eth_sendTransaction", params: [{ from, gas: "0x5b8d80", data: simpleSol }] });
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     * const transactionTrace = await provider.request({ method: "debug_traceTransaction", params: [txHash] });
     * console.log(transactionTrace);
     * ```
     */
    async debug_traceTransaction(transactionHash, options) {
        return __classPrivateFieldGet(this, _blockchain).traceTransaction(transactionHash, options || {});
    }
    // TODO: example doesn't return correct value
    /**
     * Attempts to replay the transaction as it was executed on the network and
     * return storage data given a starting key and max number of entries to return.
     *
     * @param blockHash Hash of a block.
     * @param transactionIndex Integer of the transaction index position.
     * @param contractAddress Address of the contract.
     * @param startKey Hash of the start key for grabbing storage entries.
     * @param maxResult Integer of maximum number of storage entries to return.
     * @returns Returns a storage object with the keys being keccak-256 hashes of the storage keys,
     * and the values being the raw, unhashed key and value for that specific storage slot. Also
     * returns a next key which is the keccak-256 hash of the next key in storage for continuous downloading.
     * @example
     * ```javascript
     * // Simple.sol
     * // // SPDX-License-Identifier: MIT
     * //  pragma solidity ^0.7.4;
     * //
     * //  contract Simple {
     * //      uint256 public value;
     * //      constructor() payable {
     * //          value = 5;
     * //      }
     * //  }
     * const simpleSol = "0x6080604052600560008190555060858060196000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80633fa4f24514602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000548156fea26469706673582212200897f7766689bf7a145227297912838b19bcad29039258a293be78e3bf58e20264736f6c63430007040033";
     * const [from] = await provider.request({ method: "eth_accounts", params: [] });
     * await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * const initialTxHash = await provider.request({ method: "eth_sendTransaction", params: [{ from, gas: "0x5b8d80", data: simpleSol }] });
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     *
     * const {contractAddress} = await provider.request({ method: "eth_getTransactionReceipt", params: [initialTxHash] });
     *
     * // set value to 19
     * const data = "0x552410770000000000000000000000000000000000000000000000000000000000000019";
     * const txHash = await provider.request({ method: "eth_sendTransaction", params: [{ from, to: contractAddress, data }] });
     * await provider.once("message"); // Note: `await provider.once` is non-standard
     *
     * const { blockHash, transactionIndex } = await provider.request({ method: "eth_getTransactionReceipt", params: [txHash] });
     * const storage = await provider.request({ method: "debug_storageRangeAt", params: [blockHash, transactionIndex, contractAddress, "0x01", 1] });
     * console.log(storage);
     * ```
     */
    async debug_storageRangeAt(blockHash, transactionIndex, contractAddress, startKey, maxResult) {
        return __classPrivateFieldGet(this, _blockchain).storageRangeAt(blockHash, utils_1.Quantity.from(transactionIndex).toNumber(), contractAddress, startKey, utils_1.Quantity.from(maxResult).toNumber());
    }
    //#endregion
    //#region personal
    /**
     * Returns all the Ethereum account addresses of all keys that have been
     * added.
     * @returns The Ethereum account addresses of all keys that have been added.
     * @example
     * ```javascript
     * console.log(await provider.send("personal_listAccounts"));
     * ```
     */
    async personal_listAccounts() {
        return __classPrivateFieldGet(this, _wallet).addresses;
    }
    // TODO: example doesn't return correct value
    /**
     * Generates a new account with private key. Returns the address of the new
     * account.
     * @param passphrase The passphrase to encrypt the private key with.
     * @returns The new account's address.
     * @example
     * ```javascript
     * const passphrase = "passphrase";
     * const address = await provider.send("personal_newAccount", [passphrase] );
     * console.log(address);
     * ```
     */
    async personal_newAccount(passphrase) {
        if (typeof passphrase !== "string") {
            throw new Error("missing value for required argument `passphrase`");
        }
        const wallet = __classPrivateFieldGet(this, _wallet);
        const newAccount = wallet.createRandomAccount();
        const address = newAccount.address;
        const strAddress = address.toString();
        const encryptedKeyFile = await wallet.encrypt(newAccount.privateKey, passphrase);
        wallet.encryptedKeyFiles.set(strAddress, encryptedKeyFile);
        wallet.addresses.push(strAddress);
        wallet.knownAccounts.add(strAddress);
        return newAccount.address;
    }
    /**
     * Imports the given unencrypted private key (hex string) into the key store, encrypting it with the passphrase.
     *
     * @param rawKey The raw, unencrypted private key to import.
     * @param passphrase The passphrase to encrypt with.
     * @returns Returns the address of the new account.
     * @example
     * ```javascript
     * const rawKey = "0x0123456789012345678901234567890123456789012345678901234567890123";
     * const passphrase = "passphrase";
     *
     * const address = await provider.send("personal_importRawKey",[rawKey, passphrase] );
     * console.log(address);
     * ```
     */
    async personal_importRawKey(rawKey, passphrase) {
        if (typeof passphrase !== "string") {
            throw new Error("missing value for required argument `passphrase`");
        }
        const wallet = __classPrivateFieldGet(this, _wallet);
        const newAccount = wallet_1.default.createAccountFromPrivateKey(utils_1.Data.from(rawKey));
        const address = newAccount.address;
        const strAddress = address.toString();
        const encryptedKeyFile = await wallet.encrypt(newAccount.privateKey, passphrase);
        wallet.encryptedKeyFiles.set(strAddress, encryptedKeyFile);
        wallet.addresses.push(strAddress);
        wallet.knownAccounts.add(strAddress);
        return newAccount.address;
    }
    /**
     * Locks the account. The account can no longer be used to send transactions.
     * @param address The account address to be locked.
     * @returns Returns `true` if the account was locked, otherwise `false`.
     * @example
     * ```javascript
     * const [account] = await provider.send("personal_listAccounts");
     * const isLocked = await provider.send("personal_lockAccount", [account] );
     * console.log(isLocked);
     * ```
     */
    async personal_lockAccount(address) {
        return __classPrivateFieldGet(this, _wallet).lockAccount(address.toLowerCase());
    }
    // TODO: example doesn't return correct value
    /**
     * Unlocks the account for use.
     *
     * The unencrypted key will be held in memory until the unlock duration
     * expires. The unlock duration defaults to 300 seconds. An explicit duration
     * of zero seconds unlocks the key until geth exits.
     *
     * The account can be used with `eth_sign` and `eth_sendTransaction` while it is
     * unlocked.
     * @param address - 20 Bytes - The address of the account to unlock.
     * @param passphrase - Passphrase to unlock the account.
     * @param duration - (default: 300) Duration in seconds how long the account
     * should remain unlocked for. Set to 0 to disable automatic locking.
     * @returns `true` if it worked. Throws an error or returns `false` if it did not.
     * @example
     * ```javascript
     * // generate an account
     * const passphrase = "passphrase";
     * const newAccount = await provider.send("personal_newAccount", [passphrase] );
     * const isUnlocked = await provider.send("personal_unlockAccount", [newAccount, passphrase] );
     * console.log(isUnlocked);
     * ```
     */
    async personal_unlockAccount(address, passphrase, duration = 300) {
        return __classPrivateFieldGet(this, _wallet).unlockAccount(address.toLowerCase(), passphrase, duration);
    }
    /**
     * Validate the given passphrase and submit transaction.
     *
     * The transaction is the same argument as for `eth_sendTransaction` and
     * contains the from address. If the passphrase can be used to decrypt the
     * private key belonging to `tx.from` the transaction is verified, signed and
     * send onto the network. The account is not unlocked globally in the node
     * and cannot be used in other RPC calls.
     *
     * Transaction call object:
     * * `from`: `DATA`, 20 bytes (optional) - The address the transaction is sent from.
     * * `to`: `DATA`, 20 bytes - The address the transaction is sent to.
     * * `gas`: `QUANTITY` (optional) - Integer of the maximum gas allowance for the transaction.
     * * `gasPrice`: `QUANTITY` (optional) - Integer of the price of gas in wei.
     * * `value`: `QUANTITY` (optional) - Integer of the value in wei.
     * * `data`: `DATA` (optional) - Hash of the method signature and the ABI encoded parameters.
     *
     * @param txData - The transaction call object as seen in source.
     * @param passphrase - The passphrase to decrpyt the private key belonging to `tx.from`.
     * @returns The transaction hash or if unsuccessful an error.
     * @example
     * ```javascript
     * const passphrase = "passphrase";
     * const newAccount = await provider.send("personal_newAccount", [passphrase] );
     * const [to] = await provider.send("personal_listAccounts");
     *
     * // use account and passphrase to send the transaction
     * const txHash = await provider.send("personal_sendTransaction", [{ from: newAccount, to, gasLimit: "0x5b8d80" }, passphrase] );
     * console.log(txHash);
     * ```
     */
    async personal_sendTransaction(transaction, passphrase) {
        const blockchain = __classPrivateFieldGet(this, _blockchain);
        const tx = new ethereum_transaction_1.RuntimeTransaction(transaction, blockchain.common);
        const from = tx.from;
        if (from == null) {
            throw new Error("from not found; is required");
        }
        const fromString = tx.from.toString();
        const wallet = __classPrivateFieldGet(this, _wallet);
        const encryptedKeyFile = wallet.encryptedKeyFiles.get(fromString);
        if (encryptedKeyFile === undefined) {
            throw new Error("no key for given address or file");
        }
        if (encryptedKeyFile !== null) {
            const secretKey = await wallet.decrypt(encryptedKeyFile, passphrase);
            tx.signAndHash(secretKey);
        }
        return blockchain.queueTransaction(tx);
    }
    /**
     * Validates the given passphrase and signs a transaction that can be
     * submitted to the network at a later time using `eth_sendRawTransaction`.
     *
     * The transaction is the same argument as for `eth_signTransaction` and
     * contains the from address. If the passphrase can be used to decrypt the
     * private key belonging to `tx.from` the transaction is verified and signed.
     * The account is not unlocked globally in the node and cannot be used in other RPC calls.
     *
     * Transaction call object:
     * * `from`: `DATA`, 20 bytes (optional) - The address the transaction is sent from.
     * * `to`: `DATA`, 20 bytes - The address the transaction is sent to.
     * * `gas`: `QUANTITY` (optional) - Integer of the maximum gas allowance for the transaction.
     * * `gasPrice`: `QUANTITY` (optional) - Integer of the price of gas in wei.
     * * `value`: `QUANTITY` (optional) - Integer of the value in wei.
     * * `data`: `DATA` (optional) - Hash of the method signature and the ABI encoded parameters.
     *
     * @param transaction - The transaction call object as seen in source.
     * @returns The raw, signed transaction.
     * @example
     * ```javascript
     * const [to] = await provider.request({ method: "eth_accounts", params: [] });
     * const passphrase = "passphrase";
     * const from = await provider.send("personal_newAccount", [passphrase] );
     * await provider.request({ method: "eth_subscribe", params: ["newHeads"] });
     * const signedTx = await provider.request({ method: "personal_signTransaction", params: [{ from, to }, passphrase] });
     * console.log(signedTx)
     * ```
     */
    async personal_signTransaction(transaction, passphrase) {
        const blockchain = __classPrivateFieldGet(this, _blockchain);
        const tx = new ethereum_transaction_1.RuntimeTransaction(transaction, blockchain.common);
        if (tx.from == null) {
            throw new Error("from not found; is required");
        }
        const fromString = tx.from.toString();
        const wallet = __classPrivateFieldGet(this, _wallet);
        const encryptedKeyFile = wallet.encryptedKeyFiles.get(fromString);
        if (encryptedKeyFile === undefined || encryptedKeyFile === null) {
            throw new Error("no key for given address or file");
        }
        const secretKey = await wallet.decrypt(encryptedKeyFile, passphrase);
        tx.signAndHash(secretKey);
        return utils_1.Data.from(tx.serialized).toString();
    }
    //#endregion
    //#region rpc
    /**
     * Returns object of RPC modules.
     * @returns RPC modules.
     * @example
     * ```javascript
     * console.log(await provider.send("rpc_modules"));
     * ```
     */
    async rpc_modules() {
        return RPC_MODULES;
    }
    //endregion
    //#region shh
    /**
     * Creates new whisper identity in the client.
     *
     * @returns - The address of the new identity.
     * @example
     * ```javascript
     * console.log(await provider.send("shh_newIdentity"));
     * ```
     */
    async shh_newIdentity() {
        return "0x00";
    }
    /**
     * Checks if the client hold the private keys for a given identity.
     *
     * @param address - The identity address to check.
     * @returns Returns `true` if the client holds the private key for that identity, otherwise `false`.
     * @example
     * ```javascript
     * console.log(await provider.send("shh_hasIdentity", ["0x0"] ));
     * ```
     */
    async shh_hasIdentity(address) {
        return false;
    }
    /**
     * Creates a new group.
     *
     * @returns The address of the new group.
     */
    async shh_newGroup() {
        return "0x00";
    }
    /**
     * Adds a whisper identity to the group.
     *
     * @param address - The identity address to add to a group.
     * @returns `true` if the identity was successfully added to the group, otherwise `false`.
     * @example
     * ```javascript
     * console.log(await provider.send("shh_addToGroup", ["0x0"] ));
     * ```
     */
    async shh_addToGroup(address) {
        return false;
    }
    /**
     * Creates filter to notify, when client receives whisper message matching the filter options.
     *
     * @param to - (optional) Identity of the receiver. When present it will try to decrypt any incoming message
     *  if the client holds the private key to this identity.
     * @param topics - Array of topics which the incoming message's topics should match.
     * @returns Returns `true` if the identity was successfully added to the group, otherwise `false`.
     * @example
     * ```javascript
     * console.log(await provider.send("shh_newFilter", ["0x0", []] ));
     * ```
     */
    async shh_newFilter(to, topics) {
        return false;
    }
    /**
     * Uninstalls a filter with given id. Should always be called when watch is no longer needed.
     * Additionally filters timeout when they aren't requested with `shh_getFilterChanges` for a period of time.
     *
     * @param id - The filter id. Ex: "0x7"
     * @returns `true` if the filter was successfully uninstalled, otherwise `false`.
     * @example
     * ```javascript
     * console.log(await provider.send("shh_uninstallFilter", ["0x0"] ));
     * ```
     */
    async shh_uninstallFilter(id) {
        return false;
    }
    /**
     * Polling method for whisper filters. Returns new messages since the last call of this method.
     *
     * @param id - The filter id. Ex: "0x7"
     * @returns More Info: https://github.com/ethereum/wiki/wiki/JSON-RPC#shh_getfilterchanges
     * @example
     * ```javascript
     * console.log(await provider.send("shh_getFilterChanges", ["0x0"] ));
     * ```
     */
    async shh_getFilterChanges(id) {
        return [];
    }
    /**
     * Get all messages matching a filter. Unlike shh_getFilterChanges this returns all messages.
     *
     * @param id - The filter id. Ex: "0x7"
     * @returns See: `shh_getFilterChanges`.
     * @example
     * ```javascript
     * console.log(await provider.send("shh_getMessages", ["0x0"] ));
     * ```
     */
    async shh_getMessages(id) {
        return false;
    }
    /**
     * Creates a whisper message and injects it into the network for distribution.
     *
     * @param postData
     * @returns Returns `true` if the message was sent, otherwise `false`.
     * @example
     * ```javascript
     * console.log(await provider.send("shh_post", [{}] ));
     * ```
     */
    async shh_post(postData) {
        return false;
    }
    /**
     * Returns the current whisper protocol version.
     *
     * @returns The current whisper protocol version.
     * @example
     * ```javascript
     * console.log(await provider.send("shh_version"));
     * ```
     */
    async shh_version() {
        return "2";
    }
}
_getId = new WeakMap(), _filters = new WeakMap(), _subscriptions = new WeakMap(), _options = new WeakMap(), _blockchain = new WeakMap(), _wallet = new WeakMap();
__decorate([
    assert_arg_length_1.assertArgLength(3)
], EthereumApi.prototype, "db_putString", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "db_getString", null);
__decorate([
    assert_arg_length_1.assertArgLength(3)
], EthereumApi.prototype, "db_putHex", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "db_getHex", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "bzz_hive", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "bzz_info", null);
__decorate([
    assert_arg_length_1.assertArgLength(0, 1)
], EthereumApi.prototype, "evm_mine", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "evm_setAccountNonce", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "evm_increaseTime", null);
__decorate([
    assert_arg_length_1.assertArgLength(0, 1)
], EthereumApi.prototype, "evm_setTime", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "evm_revert", null);
__decorate([
    assert_arg_length_1.assertArgLength(0, 1)
], EthereumApi.prototype, "miner_start", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "miner_stop", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "miner_setGasPrice", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "miner_setEtherbase", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "miner_setExtra", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "web3_clientVersion", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "web3_sha3", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "net_version", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "net_listening", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "net_peerCount", null);
__decorate([
    assert_arg_length_1.assertArgLength(1, 2)
], EthereumApi.prototype, "eth_estimateGas", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "eth_protocolVersion", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "eth_syncing", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "eth_coinbase", null);
__decorate([
    assert_arg_length_1.assertArgLength(1, 2)
], EthereumApi.prototype, "eth_getBlockByNumber", null);
__decorate([
    assert_arg_length_1.assertArgLength(1, 2)
], EthereumApi.prototype, "eth_getBlockByHash", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_getBlockTransactionCountByNumber", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_getBlockTransactionCountByHash", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "eth_getCompilers", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "eth_getTransactionByBlockHashAndIndex", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "eth_getTransactionByBlockNumberAndIndex", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_getUncleCountByBlockHash", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_getUncleCountByBlockNumber", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "eth_getUncleByBlockHashAndIndex", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "eth_getUncleByBlockNumberAndIndex", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_getWork", null);
__decorate([
    assert_arg_length_1.assertArgLength(3)
], EthereumApi.prototype, "eth_submitWork", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "eth_submitHashrate", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "eth_mining", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "eth_hashrate", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "eth_gasPrice", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "eth_accounts", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "eth_blockNumber", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "eth_chainId", null);
__decorate([
    assert_arg_length_1.assertArgLength(1, 2)
], EthereumApi.prototype, "eth_getBalance", null);
__decorate([
    assert_arg_length_1.assertArgLength(1, 2)
], EthereumApi.prototype, "eth_getCode", null);
__decorate([
    assert_arg_length_1.assertArgLength(2, 3)
], EthereumApi.prototype, "eth_getStorageAt", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_getTransactionByHash", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_getTransactionReceipt", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_sendTransaction", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_signTransaction", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_sendRawTransaction", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "eth_sign", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "eth_signTypedData", null);
__decorate([
    assert_arg_length_1.assertArgLength(1, 2)
], EthereumApi.prototype, "eth_subscribe", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_unsubscribe", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "eth_newBlockFilter", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "eth_newPendingTransactionFilter", null);
__decorate([
    assert_arg_length_1.assertArgLength(0, 1)
], EthereumApi.prototype, "eth_newFilter", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_getFilterChanges", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_uninstallFilter", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_getFilterLogs", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "eth_getLogs", null);
__decorate([
    assert_arg_length_1.assertArgLength(1, 2)
], EthereumApi.prototype, "eth_getTransactionCount", null);
__decorate([
    assert_arg_length_1.assertArgLength(1, 2)
], EthereumApi.prototype, "eth_call", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "personal_listAccounts", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "personal_newAccount", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "personal_importRawKey", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "personal_lockAccount", null);
__decorate([
    assert_arg_length_1.assertArgLength(2, 3)
], EthereumApi.prototype, "personal_unlockAccount", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "personal_sendTransaction", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "personal_signTransaction", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "rpc_modules", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "shh_newIdentity", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "shh_hasIdentity", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "shh_newGroup", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "shh_addToGroup", null);
__decorate([
    assert_arg_length_1.assertArgLength(2)
], EthereumApi.prototype, "shh_newFilter", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "shh_uninstallFilter", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "shh_getFilterChanges", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "shh_getMessages", null);
__decorate([
    assert_arg_length_1.assertArgLength(1)
], EthereumApi.prototype, "shh_post", null);
__decorate([
    assert_arg_length_1.assertArgLength(0)
], EthereumApi.prototype, "shh_version", null);
exports.default = EthereumApi;
//# sourceMappingURL=api.js.map
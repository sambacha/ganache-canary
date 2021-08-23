"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForkTrie = void 0;
const ethereum_address_1 = require("@ganache/ethereum-address");
const utils_1 = require("@ganache/utils");
const trie_1 = require("../helpers/trie");
const subleveldown_1 = __importDefault(require("subleveldown"));
const lexico = __importStar(require("./lexicographic-key-codec"));
const rlp_1 = require("@ganache/rlp");
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const ethereumjs_util_1 = require("ethereumjs-util");
const GET_CODE = "eth_getCode";
const GET_NONCE = "eth_getTransactionCount";
const GET_BALANCE = "eth_getBalance";
const GET_STORAGE_AT = "eth_getStorageAt";
const MetadataSingletons = new WeakMap();
const LEVELDOWN_OPTIONS = {
    keyEncoding: "binary",
    valueEncoding: "binary"
};
/**
 * Commits a checkpoint to disk, if current checkpoint is not nested.
 * If nested, only sets the parent checkpoint as current checkpoint.
 * @throws If not during a checkpoint phase
 */
async function commit() {
    const { keyValueMap } = this.checkpoints.pop();
    if (!this.isCheckpoint) {
        // This was the final checkpoint, we should now commit and flush everything to disk
        const batchOp = [];
        keyValueMap.forEach(function (value, key) {
            if (value === null) {
                batchOp.push({
                    type: "del",
                    key: Buffer.from(key, "binary")
                });
            }
            else {
                batchOp.push({
                    type: "put",
                    key: Buffer.from(key, "binary"),
                    value
                });
            }
        });
        await this.batch(batchOp);
    }
    else {
        // dump everything into the current (higher level) cache
        const currentKeyValueMap = this.checkpoints[this.checkpoints.length - 1]
            .keyValueMap;
        keyValueMap.forEach((value, key) => currentKeyValueMap.set(key, value));
    }
}
class ForkTrie extends trie_1.GanacheTrie {
    constructor(db, root, blockchain) {
        super(db, root, blockchain);
        this.address = null;
        this.blockNumber = null;
        /**
         * Gets an account from the fork/fallback.
         *
         * @param address the address of the account
         * @param blockNumber the block number at which to query the fork/fallback.
         * @param stateRoot the state root at the given blockNumber
         */
        this.accountFromFallback = async (address, blockNumber) => {
            const { fallback } = this.blockchain;
            const number = this.blockchain.fallback.selectValidForkBlockNumber(blockNumber);
            // get nonce, balance, and code from the fork/fallback
            const codeProm = fallback.request(GET_CODE, [address, number]);
            const promises = [
                fallback.request(GET_NONCE, [address, number]),
                fallback.request(GET_BALANCE, [address, number]),
                null
            ];
            // create an account so we can serialize everything later
            const account = new ethereum_utils_1.Account(address);
            // because code requires additional asynchronous processing, we await and
            // process it ASAP
            const codeHex = await codeProm;
            if (codeHex !== "0x") {
                const code = utils_1.Data.from(codeHex).toBuffer();
                // the codeHash is just the keccak hash of the code itself
                account.codeHash = utils_1.keccak(code);
                if (!account.codeHash.equals(ethereumjs_util_1.KECCAK256_NULL)) {
                    // insert the code directly into the database with a key of `codeHash`
                    promises[2] = this.db.put(account.codeHash, code);
                }
            }
            // finally, set the `nonce` and `balance` on the account before returning
            // the serialized data
            const [nonce, balance] = await Promise.all(promises);
            account.nonce =
                nonce === "0x0" ? utils_1.RPCQUANTITY_EMPTY : utils_1.Quantity.from(nonce, true);
            account.balance =
                balance === "0x0" ? utils_1.RPCQUANTITY_EMPTY : utils_1.Quantity.from(balance);
            return account.serialize();
        };
        this.storageFromFallback = async (address, key, blockNumber) => {
            const result = await this.blockchain.fallback.request(GET_STORAGE_AT, [
                `0x${address.toString("hex")}`,
                `0x${key.toString("hex")}`,
                this.blockchain.fallback.selectValidForkBlockNumber(blockNumber)
            ]);
            if (!result)
                return null;
            // remove the `0x` and all leading 0 pairs:
            const compressed = result.replace(/^0x(00)*/, "");
            const buf = Buffer.from(compressed, "hex");
            return rlp_1.encode(buf);
        };
        this.db.commit = commit.bind(this.db);
        this.accounts = blockchain.accounts;
        this.blockNumber = this.blockchain.fallback.blockNumber;
        if (MetadataSingletons.has(db)) {
            this.metadata = MetadataSingletons.get(db);
        }
        else {
            this.metadata = subleveldown_1.default(db, "f", LEVELDOWN_OPTIONS);
            MetadataSingletons.set(db, this.metadata);
        }
    }
    set root(value) {
        this._root = value;
    }
    get root() {
        return this._root;
    }
    setContext(stateRoot, address, blockNumber) {
        this._root = stateRoot;
        this.address = address;
        this.blockNumber = blockNumber;
    }
    async put(key, val) {
        return super.put(key, val);
    }
    createDelKey(key) {
        const blockNum = this.blockNumber.toBuffer();
        return lexico.encode([blockNum, this.address, key]);
    }
    async keyWasDeleted(key) {
        return new Promise((resolve, reject) => {
            const selfAddress = this.address === null ? utils_1.BUFFER_EMPTY : this.address;
            let wasDeleted = false;
            const stream = this.metadata
                .createKeyStream({
                lte: this.createDelKey(key),
                reverse: true
            })
                .on("data", data => {
                const delKey = lexico.decode(data);
                // const blockNumber = delKey[0];
                const address = delKey[1];
                const deletedKey = delKey[2];
                if (address.equals(selfAddress) && deletedKey.equals(key)) {
                    wasDeleted = true;
                    stream.destroy();
                }
            })
                .on("close", () => resolve(wasDeleted))
                .on("error", reject);
        });
    }
    async del(key) {
        await this.lock.wait();
        const hash = utils_1.keccak(key);
        const delKey = this.createDelKey(key);
        const metaDataPutPromise = this.metadata.put(delKey, utils_1.BUFFER_ZERO);
        const { node, stack } = await this.findPath(hash);
        if (node)
            await this._deleteNode(hash, stack);
        await metaDataPutPromise;
        this.lock.signal();
    }
    async get(key) {
        const value = await super.get(key);
        if (value != null) {
            return value;
        }
        if (await this.keyWasDeleted(key)) {
            return null;
        }
        if (this.address === null) {
            // if the trie context's address isn't set, our key represents an address:
            return this.accountFromFallback(ethereum_address_1.Address.from(key), this.blockNumber);
        }
        else {
            // otherwise the key represents storage at the given address:
            return this.storageFromFallback(this.address, key, this.blockNumber);
        }
    }
    /**
     * Returns a copy of the underlying trie with the interface of ForkTrie.
     * @param includeCheckpoints - If true and during a checkpoint, the copy will contain the checkpointing metadata and will use the same scratch as underlying db.
     */
    copy() {
        const db = this.db.copy();
        const secureTrie = new ForkTrie(db._leveldb, this.root, this.blockchain);
        secureTrie.accounts = this.accounts;
        secureTrie.address = this.address;
        secureTrie.blockNumber = this.blockNumber;
        return secureTrie;
    }
}
exports.ForkTrie = ForkTrie;
//# sourceMappingURL=trie.js.map